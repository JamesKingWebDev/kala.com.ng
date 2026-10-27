import { projectId, publicAnonKey } from "./supabase/info";

// Replace with your Paystack public key (starts with pk_live_ or pk_test_)
export const PAYSTACK_PUBLIC_KEY =
  "pk_live_55f9d953888a4eaf6950d7619844794d72249396";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-73b64ebc`;

// Helper to make API calls
const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const hasBody =
    options.method &&
    ["POST", "PUT", "PATCH"].includes(options.method);
  const headers: Record<string, string> = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${publicAnonKey}`,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};

export type ServiceRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  active?: boolean;
};

export type OrderInput = {
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_description: string;
  pickup_address?: string;
  destination_address?: string;
  lga?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  preferred_date?: string;
  preferred_time?: string;
  flexible_schedule?: boolean;
  special_instructions?: string;
  service_data?: Record<string, string>;
};

export const serviceApi = {
  list: async () => apiCall("/services"),
};

export const orderApi = {
  create: async (order: OrderInput) =>
    apiCall("/orders", { method: "POST", body: JSON.stringify(order) }),
  track: async (reference: string, contact: string) =>
    apiCall(`/orders/track?${new URLSearchParams({ reference, contact })}`),
};

// Agent APIs
export const agentApi = {
  getActiveAgents: async (filters?: {
    city?: string;
    state?: string;
    service?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.state) params.append("state", filters.state);
    if (filters?.service)
      params.append("service", filters.service);

    const query = params.toString();
    return apiCall(`/agents${query ? `?${query}` : ""}`);
  },

  getProfileByEmail: async (email: string) => {
    const params = new URLSearchParams({ email });
    return apiCall(`/agents/by-email?${params.toString()}`);
  },

  saveProfile: async (profileData: any) => {
    return apiCall("/agents/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },
};

// Payment APIs
export const paymentApi = {
  getStatus: async (email: string) => {
    const params = new URLSearchParams({ email });
    return apiCall(`/payments/status?${params.toString()}`);
  },

  verifyPaystack: async (
    reference: string,
    email: string,
    plan: string,
  ) => {
    return apiCall("/payments/paystack/verify", {
      method: "POST",
      body: JSON.stringify({ reference, email, plan }),
    });
  },
};

// Booking APIs
export const bookingApi = {
  create: async (data: {
    agent_id: string;
    client_name: string;
    client_phone: string;
    service: string;
    pickup_address?: string;
    notes?: string;
  }) => {
    return apiCall("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Location API
export const locationApi = {
  update: async (email: string, lat: number, lng: number, lga: string) => {
    return apiCall("/agents/location", {
      method: "POST",
      body: JSON.stringify({ email, current_lat: lat, current_lng: lng, current_lga: lga }),
    });
  },
  getMapAgents: async () => {
    return apiCall("/agents/map");
  },
};

// Admin APIs
export const adminApi = {
  login: async (pin: string) => {
    return apiCall("/admin/auth", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },

  getMetrics: async () => {
    return apiCall("/admin/metrics");
  },

  getAllAgents: async () => {
    return apiCall("/admin/agents");
  },

  getAdminWhatsApp: async () => {
    return apiCall("/admin/whatsapp");
  },

  createAgent: async (agentData: any) => {
    return apiCall("/admin/agents", {
      method: "POST",
      body: JSON.stringify(agentData),
    });
  },

  updateAgent: async (agentId: string, updates: any) => {
    return apiCall(`/admin/agents/${agentId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteAgent: async (agentId: string) => {
    return apiCall(`/admin/agents/${agentId}`, {
      method: "DELETE",
    });
  },

  activateAgent: async (
    agentId: string,
    hours: number = 24,
  ) => {
    return apiCall(`/admin/agents/${agentId}/activate`, {
      method: "POST",
      body: JSON.stringify({ hours }),
    });
  },

  verifyAgent: async (agentId: string, isVerified: boolean) => {
    return apiCall(`/admin/agents/${agentId}/verify`, {
      method: "POST",
      body: JSON.stringify({ isVerified }),
    });
  },

  setBookingStatus: async (agentId: string, booking_status: 'free' | 'booked') => {
    return apiCall(`/admin/agents/${agentId}/booking-status`, {
      method: "PUT",
      body: JSON.stringify({ booking_status }),
    });
  },

  getBookings: async () => {
    return apiCall("/admin/bookings");
  },
  getOrders: async (pin: string) =>
    apiCall("/admin/orders", { headers: { "X-Admin-Pin": pin } }),
  getSuggestedAgents: async (orderId: string, pin: string) =>
    apiCall(`/admin/orders/${orderId}/suggested-agents`, {
      headers: { "X-Admin-Pin": pin },
    }),
  assignOrder: async (
    orderId: string,
    agentId: string,
    agentPayment: number,
    pin: string,
  ) =>
    apiCall(`/admin/orders/${orderId}/assign`, {
      method: "POST",
      headers: { "X-Admin-Pin": pin },
      body: JSON.stringify({ agent_id: agentId, agent_payment: agentPayment }),
    }),
};

export const agentOperationsApi = {
  getOrders: async (email: string) =>
    apiCall(`/agent/orders?${new URLSearchParams({ email })}`),
  updateStatus: async (orderId: string, email: string, status: string) =>
    apiCall(`/agent/orders/${orderId}/status`, {
      method: "POST",
      body: JSON.stringify({ email, status }),
    }),
};
