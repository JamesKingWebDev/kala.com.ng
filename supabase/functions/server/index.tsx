import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Helper to create Supabase client
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRole
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      : Deno.env.get("SUPABASE_ANON_KEY")!
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-73b64ebc/health", (c) => {
  return c.json({ status: "ok" });
});

const requireAdmin = (c: any) => {
  const supplied = c.req.header("X-Admin-Pin");
  const expected = Deno.env.get("ADMIN_PIN") || "1234";
  return supplied && supplied === expected;
};

const makeReference = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `KALA-${year}-${random}`;
};

// ============ CONFIGURATION ============
const ADMIN_WHATSAPP = "+2348012345678"; // Update this with actual admin WhatsApp number

// ============ AGENT ROUTES ============

// Get active agents (with optional filters)
app.get("/make-server-73b64ebc/agents", async (c) => {
  try {
    const city = c.req.query("city");
    const state = c.req.query("state");
    const service = c.req.query("service");

    const supabase = getSupabaseClient(true);

    // Get all active agents (those with valid payments)
    const now = new Date().toISOString();
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("agent_id")
      .eq("status", "completed")
      .gt("expires_at", now);

    if (paymentsError) {
      console.log(`Error fetching active payments: ${paymentsError.message}`);
      return c.json({ error: paymentsError.message }, 500);
    }

    const activeAgentIds = payments.map(p => p.agent_id);

    if (activeAgentIds.length === 0) {
      return c.json({ agents: [] });
    }

    // Build query for agents
    let query = supabase
      .from("agents")
      .select("*")
      .in("id", activeAgentIds);

    if (city) {
      query = query.ilike("location_city", city);
    }
    if (state) {
      query = query.ilike("location_state", state);
    }
    if (service) {
      query = query.contains("services", [service]);
    }

    const { data: agents, error: agentsError } = await query;

    if (agentsError) {
      console.log(`Error fetching agents: ${agentsError.message}`);
      return c.json({ error: agentsError.message }, 500);
    }

    // Get payment expiry for each agent
    const agentsWithExpiry = await Promise.all(
      agents.map(async (agent) => {
        const { data: payment } = await supabase
          .from("payments")
          .select("expires_at")
          .eq("agent_id", agent.id)
          .eq("status", "completed")
          .gt("expires_at", now)
          .order("expires_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...agent,
          expiresAt: payment?.expires_at
        };
      })
    );

    return c.json({ agents: agentsWithExpiry });
  } catch (error) {
    console.log(`Unexpected error fetching agents: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get agent profile by email
app.get("/make-server-73b64ebc/agents/by-email", async (c) => {
  try {
    const email = c.req.query("email");

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = getSupabaseClient(true);

    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.log(`Error fetching agent profile: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    // Get latest payment status
    if (agent) {
      const now = new Date().toISOString();
      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .gt("expires_at", now)
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return c.json({
        agent: {
          ...agent,
          activePayment: payment
        }
      });
    }

    return c.json({ agent: null });
  } catch (error) {
    console.log(`Unexpected error fetching agent profile: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get admin WhatsApp
app.get("/make-server-73b64ebc/admin/whatsapp", (c) => {
  return c.json({ whatsapp: ADMIN_WHATSAPP });
});

// Create/Update agent profile (no auth required)
app.post("/make-server-73b64ebc/agents/profile", async (c) => {
  try {
    const profileData = await c.req.json();

    if (!profileData.email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = getSupabaseClient(true);

    // Check if profile exists
    const { data: existingAgent } = await supabase
      .from("agents")
      .select("id")
      .eq("email", profileData.email)
      .maybeSingle();

    let result;
    if (existingAgent) {
      // Update existing profile
      const { data, error } = await supabase
        .from("agents")
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq("email", profileData.email)
        .select()
        .single();

      if (error) {
        console.log(`Error updating agent profile: ${error.message}`);
        return c.json({ error: error.message }, 500);
      }
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("agents")
        .insert({
          ...profileData,
          user_id: null // No user auth
        })
        .select()
        .single();

      if (error) {
        console.log(`Error creating agent profile: ${error.message}`);
        return c.json({ error: error.message }, 500);
      }
      result = data;
    }

    return c.json({ agent: result });
  } catch (error) {
    console.log(`Unexpected error saving agent profile: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ============ PAYMENT ROUTES ============

// Verify Paystack transaction and activate agent
app.post("/make-server-73b64ebc/payments/paystack/verify", async (c) => {
  try {
    const { reference, email, plan } = await c.req.json();

    if (!reference || !email || !plan) {
      return c.json({ error: "reference, email, and plan are required" }, 400);
    }

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      return c.json({ error: "Payment verification not configured" }, 500);
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return c.json({ error: "Payment verification failed" }, 400);
    }

    // Determine hours based on plan
    const planHours: Record<string, number> = {
      daily: 24,
      weekly: 168,
      monthly: 720,
    };
    const hours = planHours[plan] ?? 24;

    const supabase = getSupabaseClient(true);

    // Get or create agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!agent) {
      return c.json({ error: "Agent not found" }, 404);
    }

    // Record payment
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const { error: paymentError } = await supabase.from("payments").insert({
      agent_id: agent.id,
      amount: verifyData.data.amount,
      currency: "NGN",
      payment_provider: "paystack",
      payment_id: reference,
      status: "completed",
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (paymentError) {
      return c.json({ error: paymentError.message }, 500);
    }

    return c.json({ success: true, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Get payment status for agent by email
app.get("/make-server-73b64ebc/payments/status", async (c) => {
  try {
    const email = c.req.query("email");

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = getSupabaseClient(true);

    // Get agent profile
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!agent) {
      return c.json({ activePayment: null, paymentHistory: [] });
    }

    // Get active payment
    const now = new Date().toISOString();
    const { data: activePayment } = await supabase
      .from("payments")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("status", "completed")
      .gt("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get payment history
    const { data: paymentHistory } = await supabase
      .from("payments")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return c.json({
      activePayment,
      paymentHistory: paymentHistory || [],
    });
  } catch (error) {
    console.log(`Unexpected error fetching payment status: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ============ ADMIN ROUTES (Public Access) ============

// Get all agents
app.get("/make-server-73b64ebc/admin/agents", async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data: agents, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(`Error fetching all agents: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    // Get payment status for each agent
    const now = new Date().toISOString();
    const agentsWithStatus = await Promise.all(
      agents.map(async (agent) => {
        const { data: activePayment } = await supabase
          .from("payments")
          .select("*")
          .eq("agent_id", agent.id)
          .eq("status", "completed")
          .gt("expires_at", now)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...agent,
          isActive: !!activePayment,
          activePayment,
        };
      })
    );

    return c.json({ agents: agentsWithStatus });
  } catch (error) {
    console.log(`Unexpected error fetching admin agents: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Manually activate agent (after payment confirmation)
app.post("/make-server-73b64ebc/admin/agents/:id/activate", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const agentId = c.req.param("id");
    const { hours = 24 } = await c.req.json();

    // Create payment record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        agent_id: agentId,
        amount: 0, // Manual activation
        currency: "NGN",
        payment_provider: "manual",
        payment_id: `manual_${Date.now()}`,
        status: "completed",
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (paymentError) {
      console.log(`Error creating payment record: ${paymentError.message}`);
      return c.json({ error: paymentError.message }, 500);
    }

    return c.json({
      message: "Agent activated successfully",
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.log(`Unexpected error activating agent: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Update agent verification status
app.post("/make-server-73b64ebc/admin/agents/:id/verify", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const agentId = c.req.param("id");
    const { isVerified } = await c.req.json();

    const { data, error } = await supabase
      .from("agents")
      .update({ is_verified: isVerified })
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.log(`Error updating agent verification: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ agent: data });
  } catch (error) {
    console.log(`Unexpected error updating verification: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ============ BOOKING ROUTES ============

// Create booking (client books agent)
app.post("/make-server-73b64ebc/bookings", async (c) => {
  try {
    const { agent_id, client_name, client_phone, service, pickup_address, notes } = await c.req.json();
    if (!agent_id || !client_name || !client_phone || !service) {
      return c.json({ error: "agent_id, client_name, client_phone, service are required" }, 400);
    }
    const supabase = getSupabaseClient(true);

    // Insert booking record (table may not exist yet — handle gracefully)
    try {
      await supabase.from("bookings").insert({
        agent_id,
        client_name,
        client_phone,
        service,
        pickup_address: pickup_address || "",
        notes: notes || "",
        status: "pending",
      });
    } catch { /* bookings table may not exist */ }

    // Set agent booking_status to 'booked'
    await supabase.from("agents").update({ booking_status: "booked", updated_at: new Date().toISOString() }).eq("id", agent_id);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Get all bookings (admin)
app.get("/make-server-73b64ebc/admin/bookings", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    let bookings: any[] = [];
    try {
      const { data } = await supabase
        .from("bookings")
        .select("*, agents(business_name, location_city, location_state)")
        .order("created_at", { ascending: false })
        .limit(50);
      bookings = data || [];
    } catch { /* bookings table may not exist */ }
    return c.json({ bookings });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Update agent booking status (admin manual toggle)
app.put("/make-server-73b64ebc/admin/agents/:id/booking-status", async (c) => {
  try {
    const agentId = c.req.param("id");
    const { booking_status } = await c.req.json();
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("agents")
      .update({ booking_status, updated_at: new Date().toISOString() })
      .eq("id", agentId)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ agent: data });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Update agent location (from agent dashboard)
app.post("/make-server-73b64ebc/agents/location", async (c) => {
  try {
    const { email, current_lat, current_lng, current_lga } = await c.req.json();
    if (!email) return c.json({ error: "email required" }, 400);
    const supabase = getSupabaseClient(true);
    const recordedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("agents")
      .update({
        current_lat,
        current_lng,
        current_lga,
        live_tracking_enabled: true,
        location_updated_at: recordedAt,
        updated_at: recordedAt,
      })
      .eq("email", email)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    await supabase.from("agent_locations").insert({
      agent_id: data.id,
      latitude: current_lat,
      longitude: current_lng,
      lga: current_lga || null,
      tracking_enabled: true,
      recorded_at: recordedAt,
    });
    return c.json({ agent: data });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin map source. This is retained for compatibility with the existing
// AgentMap component but no longer depends on obsolete visibility subscriptions.
app.get("/make-server-73b64ebc/agents/map", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const { data: agents } = await supabase
      .from("agents")
      .select("id, business_name, owner_name, location_city, location_state, current_lat, current_lng, current_lga, availability_status, booking_status, location_updated_at, live_tracking_enabled, services")
      .not("current_lat", "is", null)
      .not("current_lng", "is", null);
    return c.json({ agents: agents || [] });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin PIN auth
app.post("/make-server-73b64ebc/admin/auth", async (c) => {
  try {
    const { pin } = await c.req.json();
    const adminPin = Deno.env.get("ADMIN_PIN") || "1234";
    if (pin === adminPin) {
      return c.json({ success: true });
    }
    return c.json({ error: "Invalid PIN" }, 401);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin metrics
app.get("/make-server-73b64ebc/admin/metrics", async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data: agents } = await supabase.from("agents").select("id");
    const totalAgents = agents?.length ?? 0;

    const now = new Date().toISOString();
    const { data: activePayments } = await supabase
      .from("payments")
      .select("agent_id")
      .eq("status", "completed")
      .gt("expires_at", now);
    const activeAgents = new Set(activePayments?.map((p) => p.agent_id)).size;

    const { data: allPayments } = await supabase
      .from("payments")
      .select("amount, activated_at, expires_at")
      .eq("status", "completed")
      .order("activated_at", { ascending: false })
      .limit(100);

    const totalRevenue = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Revenue by day (last 7 days)
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    (allPayments || []).forEach((p) => {
      const day = p.activated_at?.slice(0, 10);
      if (day && days[day] !== undefined) days[day] += p.amount || 0;
    });
    const revenueChart = Object.entries(days).map(([date, amount]) => ({ date, amount }));

    return c.json({ totalAgents, activeAgents, totalRevenue, revenueChart, recentPayments: (allPayments || []).slice(0, 10) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Create agent (admin)
app.post("/make-server-73b64ebc/admin/agents", async (c) => {
  try {
    const agentData = await c.req.json();
    if (!agentData.email) return c.json({ error: "Email is required" }, 400);
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("agents")
      .insert({ ...agentData, user_id: null })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ agent: data });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Update agent (admin)
app.put("/make-server-73b64ebc/admin/agents/:id", async (c) => {
  try {
    const agentId = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("agents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", agentId)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ agent: data });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete agent (admin)
app.delete("/make-server-73b64ebc/admin/agents/:id", async (c) => {
  try {
    const agentId = c.req.param("id");
    const supabase = getSupabaseClient(true);
    await supabase.from("payments").delete().eq("agent_id", agentId);
    const { error } = await supabase.from("agents").delete().eq("id", agentId);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============ SERVICE-BOOKING PLATFORM ROUTES ============

// Public, database-driven service catalogue.
app.get("/make-server-73b64ebc/services", async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, slug, description, icon, active, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ services: data || [] });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Create an unassigned service order. Agent assignment is always an admin action.
app.post("/make-server-73b64ebc/orders", async (c) => {
  try {
    const body = await c.req.json();
    const required = ["service_id", "client_name", "client_phone", "client_email", "service_description"];
    const missing = required.filter((key) => !body[key]);
    if (missing.length) return c.json({ error: `Missing: ${missing.join(", ")}` }, 400);

    const supabase = getSupabaseClient(true);
    const normalizedEmail = String(body.client_email).trim().toLowerCase();
    const normalizedPhone = String(body.client_phone).trim();

    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
      .limit(1)
      .maybeSingle();

    let clientId = existingClient?.id;
    if (!clientId) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          full_name: body.client_name,
          phone: normalizedPhone,
          email: normalizedEmail,
          location: body.pickup_address || "",
        })
        .select("id")
        .single();
      if (clientError) return c.json({ error: clientError.message }, 500);
      clientId = client.id;
    }

    const reference = makeReference();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        reference_number: reference,
        client_id: clientId,
        service_id: body.service_id,
        service_description: body.service_description,
        client_name: body.client_name,
        client_phone: normalizedPhone,
        client_email: normalizedEmail,
        pickup_address: body.pickup_address || "",
        destination_address: body.destination_address || "",
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        lga: body.lga || "",
        state: body.state || "",
        preferred_date: body.preferred_date || null,
        preferred_time: body.preferred_time || null,
        flexible_schedule: !!body.flexible_schedule,
        special_instructions: body.special_instructions || "",
        service_data: body.service_data || {},
        status: "PENDING",
      })
      .select("id, reference_number, status, created_at")
      .single();
    if (error) return c.json({ error: error.message }, 500);

    await supabase.from("order_status_history").insert({
      order_id: order.id,
      previous_status: null,
      new_status: "PENDING",
      changed_by_type: "client",
      notes: "Booking submitted",
    });

    return c.json({ order }, 201);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Contact is checked server-side before returning client-facing order data.
app.get("/make-server-73b64ebc/orders/track", async (c) => {
  try {
    const reference = String(c.req.query("reference") || "").trim().toUpperCase();
    const contact = String(c.req.query("contact") || "").trim().toLowerCase();
    if (!reference || !contact) return c.json({ error: "Reference and contact are required" }, 400);
    const supabase = getSupabaseClient(true);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, reference_number, status, service_description, pickup_address, destination_address, lga, state, preferred_date, preferred_time, client_phone, client_email, assigned_agent_id, created_at, services(name), agents:assigned_agent_id(business_name)")
      .eq("reference_number", reference)
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!order) return c.json({ error: "Order not found" }, 404);
    if (String(order.client_email).toLowerCase() !== contact && String(order.client_phone).toLowerCase() !== contact) {
      return c.json({ error: "The contact does not match this order" }, 403);
    }
    const { client_email, client_phone, ...safeOrder } = order;
    return c.json({ order: { ...safeOrder, assigned_agent: order.agents || null, agents: undefined } });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-73b64ebc/admin/orders", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Admin access required" }, 401);
  try {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, services(name, slug), agents:assigned_agent_id(id, business_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ orders: data || [] });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-73b64ebc/admin/orders/:id/suggested-agents", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Admin access required" }, 401);
  try {
    const supabase = getSupabaseClient(true);
    const orderId = c.req.param("id");
    const { data: order } = await supabase
      .from("orders")
      .select("service_id, lga, state, latitude, longitude")
      .eq("id", orderId)
      .single();
    if (!order) return c.json({ error: "Order not found" }, 404);

    const { data: capabilityRows } = await supabase
      .from("agent_services")
      .select("agent_id")
      .eq("service_id", order.service_id);
    const ids = (capabilityRows || []).map((row) => row.agent_id);
    if (!ids.length) return c.json({ agents: [] });

    const { data: agents, error } = await supabase
      .from("agents")
      .select("id, business_name, owner_name, current_lat, current_lng, current_lga, location_state, availability_status, is_verified, rating, active_order_count, blacklist_status")
      .in("id", ids)
      .eq("is_verified", true)
      .eq("blacklist_status", false)
      .neq("availability_status", "offline");
    if (error) return c.json({ error: error.message }, 500);

    const distance = (agent: any) => {
      if (order.latitude == null || order.longitude == null || agent.current_lat == null || agent.current_lng == null) return null;
      const rad = Math.PI / 180;
      const dLat = (agent.current_lat - order.latitude) * rad;
      const dLng = (agent.current_lng - order.longitude) * rad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(order.latitude * rad) * Math.cos(agent.current_lat * rad) * Math.sin(dLng / 2) ** 2;
      return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    };
    const ranked = (agents || []).map((agent) => ({ ...agent, distance_km: distance(agent) }))
      .sort((a, b) => {
        const sameA = a.current_lga === order.lga ? 0 : 1;
        const sameB = b.current_lga === order.lga ? 0 : 1;
        return sameA - sameB || (a.distance_km ?? 9999) - (b.distance_km ?? 9999) || (b.rating ?? 0) - (a.rating ?? 0);
      });
    return c.json({ agents: ranked });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-73b64ebc/admin/orders/:id/assign", async (c) => {
  if (!requireAdmin(c)) return c.json({ error: "Admin access required" }, 401);
  try {
    const orderId = c.req.param("id");
    const { agent_id, agent_payment } = await c.req.json();
    if (!agent_id || !Number.isFinite(Number(agent_payment))) return c.json({ error: "Agent and payment are required" }, 400);
    const supabase = getSupabaseClient(true);
    const now = new Date().toISOString();
    const { data: current } = await supabase.from("orders").select("status, client_id").eq("id", orderId).single();
    if (!current) return c.json({ error: "Order not found" }, 404);

    const { data: order, error } = await supabase
      .from("orders")
      .update({ assigned_agent_id: agent_id, agent_payment: Number(agent_payment), status: "ASSIGNED", assigned_at: now })
      .eq("id", orderId)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    await supabase.from("agents").update({ availability_status: "engaged", booking_status: "booked" }).eq("id", agent_id);
    await supabase.from("order_status_history").insert({
      order_id: orderId, previous_status: current.status, new_status: "ASSIGNED",
      changed_by_type: "admin", notes: `Agent assigned with payment ₦${Number(agent_payment).toLocaleString()}`,
    });
    const { data: conversation } = await supabase.from("conversations").insert({ order_id: orderId, type: "order" }).select("id").single();
    if (conversation) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversation.id, participant_type: "client", participant_id: current.client_id },
        { conversation_id: conversation.id, participant_type: "agent", participant_id: agent_id },
      ]);
    }
    return c.json({ order });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-73b64ebc/agent/orders", async (c) => {
  try {
    const email = String(c.req.query("email") || "").trim().toLowerCase();
    if (!email) return c.json({ error: "Email is required" }, 400);
    const supabase = getSupabaseClient(true);
    const { data: agent } = await supabase.from("agents").select("id").eq("email", email).maybeSingle();
    if (!agent) return c.json({ orders: [] });
    const { data, error } = await supabase
      .from("orders")
      .select("id, reference_number, status, client_name, lga, state, pickup_address, preferred_date, preferred_time, agent_payment, services(name)")
      .eq("assigned_agent_id", agent.id)
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ orders: data || [] });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-73b64ebc/agent/orders/:id/status", async (c) => {
  try {
    const orderId = c.req.param("id");
    const { email, status } = await c.req.json();
    const allowed = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CLIENT", "COMPLETED", "CANCELLED"];
    if (!email || !allowed.includes(status)) return c.json({ error: "Invalid status request" }, 400);
    const supabase = getSupabaseClient(true);
    const { data: agent } = await supabase.from("agents").select("id").eq("email", String(email).toLowerCase()).maybeSingle();
    if (!agent) return c.json({ error: "Agent not found" }, 404);
    const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).eq("assigned_agent_id", agent.id).maybeSingle();
    if (!current) return c.json({ error: "This order is not assigned to the agent" }, 403);
    const timestamp: Record<string, string> = {};
    if (status === "IN_PROGRESS") timestamp.started_at = new Date().toISOString();
    if (status === "COMPLETED") timestamp.completed_at = new Date().toISOString();
    const { data: order, error } = await supabase.from("orders").update({ status, ...timestamp }).eq("id", orderId).select().single();
    if (error) return c.json({ error: error.message }, 500);
    await supabase.from("order_status_history").insert({
      order_id: orderId, previous_status: current.status, new_status: status,
      changed_by_type: "agent", changed_by_id: agent.id,
    });
    return c.json({ order });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
