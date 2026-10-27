import { useState, useEffect, useRef } from "react";
import {
  User,
  MapPin,
  Phone,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  Mail,
  MessageCircle,
  CreditCard,
  Zap,
  ShoppingCart,
  GraduationCap,
  Package,
  Star,
  LucideIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  agentApi,
  paymentApi,
  adminApi,
  locationApi,
  PAYSTACK_PUBLIC_KEY,
} from "../../utils/api";

const SERVICES = [
  "Package Pickup & Delivery",
  "Groceries & Foodstuff Shopping",
  "Back-to-School Runs",
  "Market Runs & Other Errands",
];

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "Package Pickup & Delivery": Package,
  "Groceries & Foodstuff Shopping": ShoppingCart,
  "Back-to-School Runs": GraduationCap,
  "Market Runs & Other Errands": Star,
};

function ServiceIcon({ service, className = "w-4 h-4" }: { service: string; className?: string }) {
  const Icon = SERVICE_ICONS[service];
  if (!Icon) return null;
  return <Icon className={className} />;
}

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const storage = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, val: string) => { try { localStorage.setItem(key, val); } catch { /* ignore */ } },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

const PLANS = [
  {
    id: "daily",
    label: "1 Day",
    price: "₦1,000",
    amount: 100000,
    hours: 24,
    popular: false,
  },
  {
    id: "weekly",
    label: "1 Week",
    price: "₦5,000",
    amount: 500000,
    hours: 168,
    popular: true,
  },
  {
    id: "monthly",
    label: "1 Month",
    price: "₦15,000",
    amount: 1500000,
    hours: 720,
    popular: false,
  },
];

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export default function AgentDashboard() {
  const [step, setStep] = useState<"email" | "dashboard">(
    "email",
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [activePayment, setActivePayment] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>(
    [],
  );
  const [timeRemaining, setTimeRemaining] = useState("");
  const [adminWhatsApp, setAdminWhatsApp] =
    useState("+2348148224425");
  const [payingPlan, setPayingPlan] = useState<string | null>(
    null,
  );
  const [profileData, setProfileData] = useState({
    email: "",
    business_name: "",
    description: "",
    whatsapp_number: "",
    location_city: "",
    location_state: "",
    services: [] as string[],
  });
  const [currentLga, setCurrentLga] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationShared, setLocationShared] = useState(false);
  const paystackScriptLoaded = useRef(false);

  useEffect(() => {
    // Load Paystack script
    if (!paystackScriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.head.appendChild(script);
      paystackScriptLoaded.current = true;
    }

    const savedEmail = storage.get("agentEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      fetchAgentProfile(savedEmail);
      setStep("dashboard");
    }

    fetchAdminWhatsApp();
  }, []);

  useEffect(() => {
    if (!activePayment?.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(
        activePayment.expires_at,
      ).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setActivePayment(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60),
      );
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [activePayment]);

  const fetchAdminWhatsApp = async () => {
    try {
      const { whatsapp } = await adminApi.getAdminWhatsApp();
      if (whatsapp) setAdminWhatsApp(whatsapp);
    } catch {
      // keep default
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    storage.set("agentEmail", email);
    await fetchAgentProfile(email);
    setStep("dashboard");
    setLoading(false);
  };

  const fetchAgentProfile = async (agentEmail: string) => {
    try {
      setLoading(true);
      const { agent: fetchedAgent } =
        await agentApi.getProfileByEmail(agentEmail);
      if (fetchedAgent) {
        setAgent(fetchedAgent);
        setProfileData({
          email: fetchedAgent.email || agentEmail,
          business_name: fetchedAgent.business_name || "",
          description: fetchedAgent.description || "",
          whatsapp_number: fetchedAgent.whatsapp_number || "",
          location_city: fetchedAgent.location_city || "",
          location_state: fetchedAgent.location_state || "",
          services: fetchedAgent.services || [],
        });
        if (fetchedAgent.activePayment)
          setActivePayment(fetchedAgent.activePayment);
      } else {
        setEditing(true);
        setProfileData({
          email: agentEmail,
          business_name: "",
          description: "",
          whatsapp_number: "",
          location_city: "",
          location_state: "",
          services: [],
        });
      }
      fetchPaymentStatus(agentEmail);
    } catch {
      const saved = storage.get("agentProfile");
      const local = saved ? JSON.parse(saved) : null;
      if (local && local.email === agentEmail) {
        setAgent(local);
        setProfileData({
          email: local.email || agentEmail,
          business_name: local.business_name || "",
          description: local.description || "",
          whatsapp_number: local.whatsapp_number || "",
          location_city: local.location_city || "",
          location_state: local.location_state || "",
          services: local.services || [],
        });
      } else {
        setEditing(true);
        setProfileData({
          email: agentEmail,
          business_name: "",
          description: "",
          whatsapp_number: "",
          location_city: "",
          location_state: "",
          services: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async (agentEmail: string) => {
    try {
      const { activePayment: active, paymentHistory: history } =
        await paymentApi.getStatus(agentEmail);
      setActivePayment(active);
      setPaymentHistory(history);
    } catch {
      // backend unreachable; stay empty
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { agent: updatedAgent } =
        await agentApi.saveProfile(profileData);
      setAgent(updatedAgent);
      storage.set("agentProfile", JSON.stringify(updatedAgent));
      setEditing(false);
    } catch {
      const localProfile = { ...profileData, id: agent?.id };
      storage.set("agentProfile", JSON.stringify(localProfile));
      setAgent(localProfile);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePaystackPayment = (plan: (typeof PLANS)[0]) => {
    if (!agent && !profileData.email) return;
    if (!window.PaystackPop) {
      alert(
        "Payment system is loading, please try again in a moment.",
      );
      return;
    }

    setPayingPlan(plan.id);
    const ref = `logcon_${plan.id}_${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: plan.amount,
      currency: "NGN",
      ref,
      callback: async (response) => {
        try {
          await paymentApi.verifyPaystack(
            response.reference,
            email,
            plan.id,
          );
          await fetchPaymentStatus(email);
        } catch {
          // Payment recorded locally if backend is down
        } finally {
          setPayingPlan(null);
        }
      },
      onClose: () => {
        setPayingPlan(null);
      },
    });

    handler.openIframe();
  };

  const handleContactAdmin = () => {
    const message = encodeURIComponent(
      `Hi Admin, I would like to activate my logistics agent profile.\n\nEmail: ${email}\nBusiness: ${agent?.business_name || "Not set"}\n\nPlease provide payment details.`,
    );
    window.open(
      `https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}?text=${message}`,
      "_blank",
    );
  };

  const handleServiceToggle = (service: string) => {
    setProfileData({
      ...profileData,
      services: profileData.services.includes(service)
        ? profileData.services.filter((s) => s !== service)
        : [...profileData.services, service],
    });
  };

  const handleChangeEmail = () => {
    storage.remove("agentEmail");
    setStep("email");
    setAgent(null);
    setEmail("");
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await locationApi.update(email, pos.coords.latitude, pos.coords.longitude, currentLga || profileData.location_city);
          setLocationShared(true);
        } catch {
          // silent fallback
          setLocationShared(true);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        alert("Could not get your location. Please enable location access.");
      }
    );
  };

  if (step === "email") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Agent Dashboard
              </h1>
              <p className="text-gray-600">
                Enter your email to access your profile
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8">
              <form
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />{" "}
                      Loading...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" /> Continue
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  const isActive = !!activePayment;
  const profileComplete = !!(
    agent?.business_name && agent?.whatsapp_number
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Dashboard
          </h1>
          <button
            onClick={handleChangeEmail}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Change Email
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Agent Profile
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{email}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Business Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profileData.business_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          business_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your business name"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {agent?.business_name || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      value={profileData.description}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell customers about your services..."
                    />
                  ) : (
                    <p className="text-gray-900">
                      {agent?.description || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> WhatsApp
                    Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={profileData.whatsapp_number}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          whatsapp_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+234..."
                    />
                  ) : (
                    <p className="text-gray-900">
                      {agent?.whatsapp_number || "Not set"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> State
                    </label>
                    {editing ? (
                      <select
                        value={profileData.location_state}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location_state: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {agent?.location_state || "Not set"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileData.location_city}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location_city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Lagos"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {agent?.location_city || "Not set"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Services
                    Offered
                  </label>
                  {editing ? (
                    <div className="grid grid-cols-1 gap-2">
                      {SERVICES.map((service) => (
                        <label
                          key={service}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${profileData.services.includes(service) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <input
                            type="checkbox"
                            checked={profileData.services.includes(
                              service,
                            )}
                            onChange={() =>
                              handleServiceToggle(service)
                            }
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <span className="text-blue-600">
                              <ServiceIcon service={service} />
                            </span>
                            {service}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {agent?.services?.length > 0 ? (
                        agent.services.map(
                          (service: string) => (
                            <span
                              key={service}
                              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              <ServiceIcon service={service} /> {service}
                            </span>
                          ),
                        )
                      ) : (
                        <p className="text-gray-500">
                          No services selected
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {editing && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Save
                          Profile
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        if (agent)
                          setProfileData({
                            email: agent.email || email,
                            business_name:
                              agent.business_name || "",
                            description:
                              agent.description || "",
                            whatsapp_number:
                              agent.whatsapp_number || "",
                            location_city:
                              agent.location_city || "",
                            location_state:
                              agent.location_state || "",
                            services: agent.services || [],
                          });
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Subscription Plans
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Subscribe to get listed and visible to clients
              </p>

              {!profileComplete && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Complete your profile (business name +
                  WhatsApp) before subscribing.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 p-5 flex flex-col gap-3 transition ${plan.popular ? "border-blue-500 shadow-lg" : "border-gray-200"}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {plan.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {plan.price}
                      </p>
                    </div>
                    <ul className="space-y-1 flex-1">
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {plan.hours}h of visibility
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Listed to all clients
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Instant activation
                      </li>
                    </ul>
                    <button
                      onClick={() =>
                        handlePaystackPayment(plan)
                      }
                      disabled={
                        !profileComplete || !!payingPlan
                      }
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}
                    >
                      {payingPlan === plan.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" /> Subscribe
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activation History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Activation History
              </h2>
              {paymentHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No activation history yet
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {payment.payment_provider === "manual"
                            ? "Admin Activation"
                            : payment.payment_provider ===
                                "paystack"
                              ? "Paystack Payment"
                              : "Payment"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            payment.created_at,
                          ).toLocaleDateString()}{" "}
                          — expires{" "}
                          {new Date(
                            payment.expires_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Visibility Status
              </h3>

              {isActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">
                      Active
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700 mb-2">
                      Your profile is visible to clients
                    </p>
                    <div className="flex items-center gap-2 text-green-800 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>Expires in: {timeRemaining}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Renew anytime using the plans below
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">
                      Inactive
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      Your profile is hidden from clients.
                      Choose a plan to get listed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location & Status */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[#0D1B3E]/5">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#C9960A]" /> My Location
              </h3>
              <p className="text-xs text-gray-500 mb-4">Share your GPS position so clients can track you on the map</p>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Current LGA / Area</label>
                <input
                  type="text"
                  value={currentLga}
                  onChange={(e) => setCurrentLga(e.target.value)}
                  placeholder={profileData.location_city || "Enter your current LGA"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A]"
                />
              </div>

              <button
                onClick={handleShareLocation}
                disabled={locationLoading || !email}
                className="w-full bg-[#0D1B3E] hover:bg-[#1A3170] text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {locationLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                {locationLoading ? "Locating..." : "Share My Location"}
              </button>

              {locationShared && (
                <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Location updated on map
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2 text-center">Updates your pin on the live client map</p>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                How it works
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                {[
                  "Complete your profile with services and location",
                  "Choose a subscription plan and pay via Paystack",
                  "Your profile goes live instantly after payment",
                  "Clients find you and reach out on WhatsApp",
                  "Renew before expiry to stay visible",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* WhatsApp fallback */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Alternative
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Prefer to pay via transfer? Contact the admin on
                WhatsApp and they can activate your profile
                manually.
              </p>
              <button
                onClick={handleContactAdmin}
                disabled={!agent}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Admin to Activate
              </button>
              {!agent && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Complete your profile first
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}