import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleDollarSign, Clock3, FileText, Headphones, Home,
  Image as ImageIcon, MapPin, Menu, MessageCircle, Package, Plus, Search,
  ShieldCheck, ShoppingBasket, Sparkles, Star, Store, BriefcaseBusiness, Truck,
  Upload, UserRound, Users, X,
} from "lucide-react";
import { NavProvider, Link, useNav } from "./nav";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import brandImage from "@/imports/WhatsApp_Image_2026-07-24_at_9.54.55_PM.jpeg";
import {
  adminApi, agentOperationsApi, locationApi, orderApi, OrderInput,
  serviceApi, ServiceRecord,
} from "../utils/api";

const serviceFallback: ServiceRecord[] = [
  { id: "tour-guide", slug: "tour-guide", name: "Tour Guide", description: "Explore new places with a trusted local guide.", icon: "tour" },
  { id: "house-cleaning", slug: "house-cleaning", name: "House Cleaning", description: "Careful, reliable cleaning for your space.", icon: "home" },
  { id: "pick-up-delivery", slug: "pick-up-delivery", name: "Pick Up & Delivery", description: "Door-to-door movement for packages and items.", icon: "truck" },
  { id: "grocery-shopping", slug: "grocery-shopping", name: "Grocery Shopping", description: "Fresh groceries sourced and delivered to you.", icon: "basket" },
  { id: "market-runs", slug: "market-runs", name: "Market Runs", description: "A trusted hand in the market, without the stress.", icon: "store" },
  { id: "personal-errands", slug: "personal-errands", name: "Personal & Other Errands", description: "Flexible help for the things on your list.", icon: "sparkles" },
];

const iconMap: Record<string, typeof Package> = {
  tour: BriefcaseBusiness, home: Home, truck: Truck, basket: ShoppingBasket, store: Store, sparkles: Sparkles,
};

function Logo({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-full border border-accent/50">
        <span className="font-display text-xl font-bold italic text-accent">K</span>
        <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-accent" />
      </div>
      <div className="leading-none">
        <div className={`font-display text-xl font-bold tracking-[0.16em] ${light ? "text-white" : "text-primary"}`}>KALA</div>
        <div className={`mt-1 text-[8px] font-bold tracking-[0.24em] ${light ? "text-white/45" : "text-primary/45"}`}>CONCIERGE</div>
      </div>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          <Link to="/services" className="transition hover:text-white">Services</Link>
          <Link to="/track" className="transition hover:text-white">Track order</Link>
          <Link to="/become-an-agent" className="transition hover:text-white">Become an agent</Link>
          <Link to="/admin" className="transition hover:text-white">Operations</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/track" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/5">Track</Link>
          <Link to="/book" className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-[#e2b83f]">Book a service</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden" aria-label="Open menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-white/10 px-5 py-5 md:hidden">
          <div className="grid gap-2 text-sm">
            {[["Services", "/services"], ["Track order", "/track"], ["Become an agent", "/become-an-agent"], ["Operations", "/admin"], ["Agent portal", "/agent"]].map(([label, to]) => (
              <Link key={to} to={to} className="rounded-xl px-3 py-3 text-white/80 hover:bg-white/5">{label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function useServices() {
  const [services, setServices] = useState<ServiceRecord[]>(serviceFallback);
  useEffect(() => {
    serviceApi.list().then((result) => {
      if (result.services?.length) setServices(result.services);
    }).catch(() => undefined);
  }, []);
  return services;
}

function ServiceIcon({ service, className = "h-6 w-6" }: { service: ServiceRecord; className?: string }) {
  const Icon = iconMap[service.icon || ""] || Package;
  return <Icon className={className} />;
}

function ServicePicker({ compact = false }: { compact?: boolean }) {
  const services = useServices();
  const { navigate } = useNav();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceRecord | null>(null);
  const book = () => navigate(`/book${selected ? `?service=${selected.id}` : ""}`);
  return (
    <div className={`relative ${compact ? "" : "mx-auto max-w-5xl"}`}>
      <div className="rounded-[28px] border border-primary/10 bg-white p-3 shadow-[0_24px_80px_rgba(13,27,62,0.13)] sm:flex sm:items-center">
        <button onClick={() => setOpen(!open)} className="flex min-h-16 flex-1 items-center gap-4 rounded-2xl px-4 text-left hover:bg-secondary/50">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-accent"><Search className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">What can we help you with?</span>
            <span className="mt-1 block truncate text-base font-semibold text-primary">{selected?.name || "Choose a KALA service"}</span>
          </span>
          <ChevronDown className={`ml-auto h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={book} className="mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 font-bold text-white transition hover:bg-[#162b5d] sm:mt-0 sm:w-auto">
          Book Service <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-40 grid gap-2 rounded-[28px] border border-primary/10 bg-white p-3 shadow-2xl sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <button key={service.id} onClick={() => { setSelected(service); setOpen(false); }} className={`group flex gap-3 rounded-2xl border p-4 text-left transition ${selected?.id === service.id ? "border-accent bg-accent/5" : "border-transparent hover:border-border hover:bg-secondary/40"}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-accent"><ServiceIcon service={service} className="h-5 w-5" /></span>
              <span><b className="text-sm text-primary">{service.name}</b><small className="mt-1 block leading-relaxed text-muted-foreground">{service.description}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title, body, center = false }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
      <h2 className="font-display text-3xl font-semibold leading-tight text-primary sm:text-5xl">{title}</h2>
      {body && <p className="mt-5 leading-7 text-muted-foreground">{body}</p>}
    </div>
  );
}

function HomePage() {
  const services = useServices();
  const { navigate } = useNav();
  return (
    <div className="bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(201,150,10,.34),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,255,255,.12),transparent_25%)]" />
          <div className="absolute inset-y-0 left-[8%] w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent" />
          <div className="relative mx-auto grid min-h-[690px] max-w-[1380px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/75"><BadgeCheck className="h-4 w-4 text-accent" /> Trusted help, thoughtfully assigned</div>
              <h1 className="font-display text-5xl font-semibold leading-[.98] sm:text-7xl lg:text-[88px]">Your errands.<br /><span className="italic text-accent">Our responsibility.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">From market runs to home care, KALA handles everyday tasks with verified people, attentive support, and real-time order updates.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => navigate("/book")} className="rounded-full bg-accent px-7 py-3.5 font-bold text-primary hover:bg-[#e1b43a]">Book a Service</button>
                <button onClick={() => navigate("/track")} className="rounded-full border border-white/20 px-7 py-3.5 font-bold text-white hover:bg-white/5">Track an Order</button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-xs text-white/55"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Verified agents</span><span className="flex items-center gap-2"><Headphones className="h-4 w-4 text-accent" /> Human support</span></div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-5 rounded-[44px] border border-accent/25" />
              <ImageWithFallback src={brandImage} alt="KALA service professional" className="h-[530px] w-full rounded-[36px] bg-[#071126] object-cover object-top shadow-2xl" />
              <div className="absolute -bottom-6 -left-10 max-w-xs rounded-3xl border border-white/10 bg-[#071126]/90 p-5 backdrop-blur-xl">
                <div className="mb-3 flex -space-x-2">{["AO", "CM", "EN"].map((x) => <span key={x} className="grid h-9 w-9 place-items-center rounded-full border-2 border-primary bg-accent text-[10px] font-bold text-primary">{x}</span>)}</div>
                <p className="font-display text-lg">One request. The right person. Full support.</p>
              </div>
            </div>
          </div>
          <div className="relative mx-auto -mb-14 max-w-[1180px] px-5"><ServicePicker /></div>
        </section>

        <section className="px-5 pb-24 pt-36 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex items-end justify-between gap-8"><SectionTitle eyebrow="Everyday support" title="One trusted place for the things that need doing." /><Link to="/services" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">View all services <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <button key={service.id} onClick={() => navigate(`/book?service=${service.id}`)} className={`group min-h-56 rounded-[28px] border p-7 text-left transition hover:-translate-y-1 hover:shadow-xl ${index === 2 ? "border-primary bg-primary text-white" : "border-border bg-card text-primary"}`}>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 2 ? "bg-white/10 text-accent" : "bg-secondary text-accent"}`}><ServiceIcon service={service} /></div>
                  <h3 className="mt-8 font-display text-2xl font-semibold">{service.name}</h3>
                  <p className={`mt-2 text-sm leading-6 ${index === 2 ? "text-white/60" : "text-muted-foreground"}`}>{service.description}</p>
                  <ChevronRight className="ml-auto mt-5 h-5 w-5 text-accent transition group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-[.8fr_1.2fr]">
            <SectionTitle eyebrow="How KALA works" title="Delegate with confidence." body="KALA coordinates every request from the first brief to final confirmation. You always know what is happening and who is responsible." />
            <div className="divide-y divide-border border-y border-border">
              {["Choose a service", "Tell us what you need", "KALA assigns the right agent", "Track and communicate in real time", "Get the service completed"].map((step, index) => (
                <div key={step} className="grid grid-cols-[44px_1fr_auto] items-center gap-4 py-5">
                  <span className="font-mono text-xs text-accent">0{index + 1}</span><p className="font-semibold text-primary">{step}</p><CheckCircle2 className="h-5 w-5 text-primary/25" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <SectionTitle center eyebrow="The KALA standard" title="Serious about the details." />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [ShieldCheck, "Verified people", "Agents are reviewed before they are entrusted with your request."],
                [MessageCircle, "One clear conversation", "Keep instructions, approvals, images and updates in one place."],
                [MapPin, "Operational visibility", "Track progress while KALA monitors assignment and delivery."],
              ].map(([Icon, title, body]: any) => <div key={title} className="rounded-[28px] border border-border bg-white p-8"><Icon className="h-7 w-7 text-accent" /><h3 className="mt-7 font-display text-2xl text-primary">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
            </div>
            <div className="mt-20 grid items-center gap-12 rounded-[36px] bg-primary p-8 text-white md:grid-cols-[1.2fr_.8fr] md:p-14">
              <div><p className="text-xs font-bold uppercase tracking-[.24em] text-accent">Become a KALA agent</p><h2 className="mt-4 font-display text-4xl">Want to earn by helping people?</h2><p className="mt-4 max-w-xl leading-7 text-white/60">Join a professional network, receive work matched to your capabilities, and get paid weekly for completed orders.</p></div>
              <div className="md:text-right"><Link to="/become-an-agent" className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 font-bold text-primary">Become a KALA Agent <ArrowRight className="h-4 w-4" /></Link></div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-[1040px]">
            <SectionTitle center eyebrow="Client notes" title="Relief, delivered." />
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {[
                ["KALA handled my market run while I was at work. I approved everything in chat and the updates were excellent.", "Adaeze O.", "Lekki"],
                ["It feels less like calling a random rider and more like having a capable operations team on your side.", "Tunde A.", "Abuja"],
              ].map(([quote, name, place]) => <blockquote key={name} className="rounded-[28px] border border-border bg-background p-8"><div className="flex gap-1 text-accent">{[1,2,3,4,5].map((n)=><Star key={n} className="h-4 w-4 fill-current" />)}</div><p className="mt-6 font-display text-xl leading-8 text-primary">“{quote}”</p><footer className="mt-7 text-sm"><b>{name}</b><span className="ml-2 text-muted-foreground">· {place}</span></footer></blockquote>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-2">
            <SectionTitle eyebrow="Questions, answered" title="Before you hand us the list." body="Need help with something unusual? Start a booking and describe it. Our operations team will review the request before assignment." />
            <div className="space-y-3">
              {["How are agents assigned?", "Can I speak with my assigned agent?", "How do I track my order?", "Can I send purchase images or proof of payment?"].map((q, i) => <details key={q} className="group rounded-2xl border border-border bg-white px-5 py-4" open={i === 0}><summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-primary">{q}<Plus className="h-4 w-4 group-open:rotate-45" /></summary><p className="pt-4 text-sm leading-6 text-muted-foreground">{i === 0 ? "KALA reviews your service, location, timing and requirements, then an admin selects the best verified and available agent." : "Yes. Your order workspace keeps communication and status updates together, with KALA support available when needed."}</p></details>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#071126] px-5 py-14 text-white lg:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Logo /><p className="mt-5 max-w-sm text-sm leading-6 text-white/45">Reliable service coordination for busy people across Nigeria.</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Navigate</p><div className="mt-5 grid gap-3 text-sm text-white/60"><Link to="/services">Services</Link><Link to="/track">Track an order</Link><Link to="/agent">Agent portal</Link></div></div>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Support</p><p className="mt-5 text-sm text-white/60">0706 576 4557<br />support@kala.com.ng</p></div>
      </div>
      <div className="mx-auto mt-12 max-w-[1280px] border-t border-white/10 pt-6 text-xs text-white/35">© 2026 KALA · Built for Nigeria</div>
    </footer>
  );
}

const fieldStyle = "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function BookingPage() {
  const services = useServices();
  const { page, navigate } = useNav();
  const selectedFromPath = new URLSearchParams(page.split("?")[1] || "").get("service") || "";
  const [form, setForm] = useState<Record<string, any>>({ service_id: selectedFromPath, flexible_schedule: false });
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reference, setReference] = useState("");
  useEffect(() => { if (!form.service_id && services[0]) setForm((f) => ({ ...f, service_id: services[0].id })); }, [services]);
  const service = services.find((s) => s.id === form.service_id) || services[0];
  const set = (key: string, value: any) => setForm((old) => ({ ...old, [key]: value }));
  const specific = useMemo(() => {
    const slug = service?.slug || "";
    if (slug.includes("delivery")) return [["pickup_address", "Pickup address"], ["destination_address", "Delivery address"], ["package_description", "Package description"]];
    if (slug.includes("grocery")) return [["shopping_list", "Shopping list"], ["preferred_store", "Preferred store or market"], ["budget", "Budget (₦)"]];
    if (slug.includes("cleaning")) return [["property_type", "Property type"], ["rooms", "Number of rooms"], ["cleaning_requirements", "Cleaning requirements"]];
    if (slug.includes("tour")) return [["destination_area", "Destination / area"], ["party_size", "Number of people"], ["duration", "Expected duration"]];
    if (slug.includes("market")) return [["items_required", "Items required"], ["market_preference", "Market preference"], ["budget", "Budget (₦)"], ["destination_address", "Delivery address"]];
    return [["errand_details", "What needs to be done?"], ["pickup_address", "Pickup / starting location"], ["destination_address", "Destination, if applicable"]];
  }, [service]);
  const submit = async () => {
    setSaving(true);
    try {
      const serviceData = Object.fromEntries(specific.map(([key]) => [key, form[key] || ""]));
      const payload: OrderInput = {
        service_id: form.service_id, client_name: form.client_name, client_phone: form.client_phone,
        client_email: form.client_email, service_description: form.service_description || Object.values(serviceData).filter(Boolean).join(" · "),
        pickup_address: form.pickup_address || form.address, destination_address: form.destination_address,
        lga: form.lga, state: form.state, preferred_date: form.preferred_date, preferred_time: form.preferred_time,
        flexible_schedule: form.flexible_schedule, special_instructions: form.special_instructions, service_data: serviceData,
      };
      const result = await orderApi.create(payload);
      setReference(result.order?.reference_number || result.reference_number);
    } catch (error: any) {
      alert(error.message || "Could not complete booking.");
    } finally { setSaving(false); }
  };
  if (reference) return <Confirmation reference={reference} service={service?.name || "KALA service"} />;
  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8 lg:py-16">
        <div className="mb-10 flex items-end justify-between gap-6">
          <SectionTitle eyebrow="Service booking" title="Tell us what you need." body="We will review the details and assign the right verified agent. You are never choosing from a public directory." />
          <div className="hidden text-right text-xs text-muted-foreground sm:block"><span className="font-bold text-accent">01</span> Details&nbsp;&nbsp;→&nbsp;&nbsp;<span className={review ? "font-bold text-accent" : ""}>02</span> Review</div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={(e) => { e.preventDefault(); setReview(true); }} className="rounded-[30px] border border-border bg-white p-6 shadow-sm sm:p-8">
            <h3 className="font-display text-2xl text-primary">Client details</h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">Full name<input required value={form.client_name || ""} onChange={(e) => set("client_name", e.target.value)} className={fieldStyle} placeholder="Your full name" /></label>
              <label className="text-sm font-semibold">Phone number<input required type="tel" value={form.client_phone || ""} onChange={(e) => set("client_phone", e.target.value)} className={fieldStyle} placeholder="+234" /></label>
              <label className="text-sm font-semibold">Email address<input required type="email" value={form.client_email || ""} onChange={(e) => set("client_email", e.target.value)} className={fieldStyle} placeholder="you@example.com" /></label>
            </div>
            <div className="my-8 h-px bg-border" />
            <h3 className="font-display text-2xl text-primary">Service details</h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">Selected service<select value={form.service_id || ""} onChange={(e) => set("service_id", e.target.value)} className={fieldStyle}>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              {specific.map(([key, label], index) => <label key={key} className={`text-sm font-semibold ${index === specific.length - 1 && specific.length % 2 ? "sm:col-span-2" : ""}`}>{label}<input required={index === 0} value={form[key] || ""} onChange={(e) => set(key, e.target.value)} className={fieldStyle} /></label>)}
              <label className="text-sm font-semibold sm:col-span-2">Additional instructions<textarea rows={3} value={form.special_instructions || ""} onChange={(e) => set("special_instructions", e.target.value)} className={fieldStyle} placeholder="Access notes, preferences, or anything else we should know" /></label>
            </div>
            <div className="my-8 h-px bg-border" />
            <h3 className="font-display text-2xl text-primary">Location & schedule</h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">Current address<input required value={form.address || ""} onChange={(e) => set("address", e.target.value)} className={fieldStyle} placeholder="Street and landmark" /></label>
              <label className="text-sm font-semibold">LGA / area<input required value={form.lga || ""} onChange={(e) => set("lga", e.target.value)} className={fieldStyle} placeholder="e.g. Eti-Osa" /></label>
              <label className="text-sm font-semibold">State<input required value={form.state || ""} onChange={(e) => set("state", e.target.value)} className={fieldStyle} placeholder="e.g. Lagos" /></label>
              <label className="text-sm font-semibold">Preferred date<input required={!form.flexible_schedule} type="date" value={form.preferred_date || ""} onChange={(e) => set("preferred_date", e.target.value)} className={fieldStyle} /></label>
              <label className="text-sm font-semibold">Preferred time<input required={!form.flexible_schedule} type="time" value={form.preferred_time || ""} onChange={(e) => set("preferred_time", e.target.value)} className={fieldStyle} /></label>
              <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={form.flexible_schedule} onChange={(e) => set("flexible_schedule", e.target.checked)} className="h-5 w-5 accent-[#C9960A]" /> My schedule is flexible</label>
            </div>
            <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white">Review booking <ArrowRight className="h-4 w-4" /></button>
          </form>
          <aside className="h-fit rounded-[30px] bg-primary p-7 text-white lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Your request</p>
            <div className="mt-6 flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-accent">{service && <ServiceIcon service={service} />}</span><div><p className="font-display text-xl">{service?.name}</p><p className="text-xs text-white/45">Assigned after review</p></div></div>
            <div className="my-6 h-px bg-white/10" />
            <div className="space-y-4 text-sm text-white/60"><p className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-accent" /> A verified agent is selected by KALA.</p><p className="flex gap-3"><MessageCircle className="h-5 w-5 shrink-0 text-accent" /> Chat and approvals stay in your order.</p><p className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-accent" /> Track every major status update.</p></div>
          </aside>
        </div>
      </div>
      {review && <ReviewModal form={form} service={service} onClose={() => setReview(false)} onConfirm={submit} saving={saving} />}
    </div>
  );
}

function ReviewModal({ form, service, onClose, onConfirm, saving }: any) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071126]/75 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Review order</p><h2 className="mt-2 font-display text-3xl text-primary">Everything look right?</h2></div><button onClick={onClose} className="rounded-full bg-secondary p-2"><X className="h-5 w-5" /></button></div><div className="mt-7 divide-y divide-border rounded-2xl border border-border px-5">{[["Service", service?.name], ["Client", form.client_name], ["Contact", `${form.client_phone} · ${form.client_email}`], ["Location", `${form.address}, ${form.lga}, ${form.state}`], ["Schedule", form.flexible_schedule ? "Flexible" : `${form.preferred_date} at ${form.preferred_time}`], ["Instructions", form.special_instructions || "None"]].map(([k,v]) => <div key={k} className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm"><span className="text-muted-foreground">{k}</span><b className="text-primary">{v}</b></div>)}</div><button disabled={saving} onClick={onConfirm} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-bold text-primary disabled:opacity-50">{saving ? "Creating order…" : "Complete Booking"} <Check className="h-4 w-4" /></button></div></div>;
}

function Confirmation({ reference, service }: { reference: string; service: string }) {
  const { navigate } = useNav();
  return <div className="min-h-screen bg-primary px-5 py-20 text-white"><div className="mx-auto max-w-2xl text-center"><Logo /><div className="mx-auto mt-20 grid h-20 w-20 place-items-center rounded-full bg-accent text-primary"><Check className="h-10 w-10" /></div><p className="mt-8 text-xs font-bold uppercase tracking-[.25em] text-accent">Booking received</p><h1 className="mt-4 font-display text-5xl">We have your request.</h1><p className="mx-auto mt-5 max-w-lg leading-7 text-white/60">Your {service} order is now with the KALA operations team. Keep this reference safe.</p><div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-white/45">ORDER REFERENCE</p><p className="mt-2 font-mono text-2xl font-bold tracking-wider text-accent">{reference}</p></div><button onClick={() => navigate(`/track?reference=${reference}`)} className="mt-8 rounded-full bg-accent px-8 py-4 font-bold text-primary">Track Order</button></div></div>;
}

const statusSteps = ["PENDING", "REVIEWING", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "AWAITING_CLIENT", "COMPLETED", "CONFIRMED"];
const statusLabel: Record<string, string> = { PENDING: "Booking Received", REVIEWING: "Admin Reviewing", ASSIGNED: "Agent Assigned", ACCEPTED: "Agent Accepted", IN_PROGRESS: "In Progress", AWAITING_CLIENT: "Awaiting Client", COMPLETED: "Completed", CONFIRMED: "Confirmed" };

function TrackPage() {
  const { page } = useNav();
  const preset = new URLSearchParams(page.split("?")[1] || "").get("reference") || "";
  const [reference, setReference] = useState(preset);
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(""); try { const result = await orderApi.track(reference, contact); setOrder(result.order); } catch (err: any) { setError(err.message); } };
  return <div className="min-h-screen bg-background"><Navbar /><div className="mx-auto max-w-[1080px] px-5 py-14"><SectionTitle eyebrow="Order tracking" title="Follow the work, not the worry." body="Enter the reference and phone or email used for the booking." /><form onSubmit={submit} className="mt-10 grid gap-3 rounded-[28px] border border-border bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"><input required value={reference} onChange={(e)=>setReference(e.target.value.toUpperCase())} placeholder="KALA-26-XXXXXX" className={fieldStyle.replace("mt-2 ","")} /><input required value={contact} onChange={(e)=>setContact(e.target.value)} placeholder="Phone or email" className={fieldStyle.replace("mt-2 ","")} /><button className="rounded-2xl bg-primary px-7 py-3 font-bold text-white">Track order</button></form>{error && <p className="mt-4 text-sm text-destructive">{error}</p>}{order && <OrderTracker order={order} />}</div></div>;
}

function OrderTracker({ order }: { order: any }) {
  const current = Math.max(0, statusSteps.indexOf(order.status));
  return <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="rounded-[28px] border border-border bg-white p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">{order.reference_number}</p><h2 className="mt-2 font-display text-3xl text-primary">{order.services?.name || order.service_name || "KALA Service"}</h2></div><span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-bold text-[#8a6500]">{statusLabel[order.status] || order.status}</span></div><div className="mt-8">{statusSteps.map((step, i) => <div key={step} className="grid grid-cols-[28px_1fr] gap-4"><div className="flex flex-col items-center"><span className={`grid h-7 w-7 place-items-center rounded-full border-2 ${i <= current ? "border-accent bg-accent text-primary" : "border-border bg-white text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>{i < statusSteps.length - 1 && <span className={`h-10 w-px ${i < current ? "bg-accent" : "bg-border"}`} />}</div><div><p className={`text-sm font-semibold ${i <= current ? "text-primary" : "text-muted-foreground"}`}>{statusLabel[step]}</p>{i === current && <p className="mt-1 text-xs text-muted-foreground">Current status · updates appear here automatically</p>}</div></div>)}</div></div><aside className="space-y-4"><div className="rounded-[28px] bg-primary p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Order details</p><div className="mt-6 space-y-5 text-sm"><p><span className="block text-xs text-white/40">LOCATION</span>{order.pickup_address || `${order.lga || ""}, ${order.state || ""}`}</p><p><span className="block text-xs text-white/40">SCHEDULE</span>{order.preferred_date || "To be confirmed"} · {order.preferred_time || "Flexible"}</p><p><span className="block text-xs text-white/40">ASSIGNED AGENT</span>{order.assigned_agent?.business_name || "KALA is selecting the right agent"}</p></div></div>{order.assigned_agent_id && <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white py-4 font-bold text-primary"><MessageCircle className="h-5 w-5 text-accent" /> Open order chat</button>}</aside></div>;
}

function AdminPage() {
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem("kala_ops_pin") || ""; } catch { return ""; } });
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [payment, setPayment] = useState("8500");
  const [tab, setTab] = useState("ACTIVE");
  const load = async (adminPin = pin) => { const result = await adminApi.getOrders(adminPin); setOrders(result.orders || []); setSelected(result.orders?.[0] || null); };
  useEffect(() => { if (pin) load().catch(() => setPin("")); }, [pin]);
  const login = async (e: FormEvent) => { e.preventDefault(); try { await adminApi.login(input); try { sessionStorage.setItem("kala_ops_pin", input); } catch {} setPin(input); } catch { alert("Incorrect PIN"); } };
  useEffect(() => { if (selected && pin) adminApi.getSuggestedAgents(selected.id, pin).then((r)=>setAgents(r.agents || [])).catch(()=>setAgents([])); }, [selected, pin]);
  const assign = async (agentId: string) => { if (!selected) return; await adminApi.assignOrder(selected.id, agentId, Number(payment), pin); await load(); };
  if (!pin) return <div className="grid min-h-screen place-items-center bg-primary p-5"><form onSubmit={login} className="w-full max-w-sm rounded-[30px] bg-white p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-accent"><ShieldCheck /></div><h1 className="mt-6 font-display text-3xl text-primary">Operations access</h1><p className="mt-2 text-sm text-muted-foreground">Enter your admin PIN to continue.</p><input required type="password" inputMode="numeric" value={input} onChange={(e)=>setInput(e.target.value)} className={`${fieldStyle} text-center text-xl tracking-[.4em]`} placeholder="••••" /><button className="mt-4 w-full rounded-2xl bg-primary py-3.5 font-bold text-white">Enter workspace</button><Link to="/" className="mt-5 block text-xs text-muted-foreground">Return to KALA</Link></form></div>;
  const filtered = orders.filter((o) => tab === "PENDING" ? ["PENDING","REVIEWING"].includes(o.status) : tab === "ATTENDED" ? ["COMPLETED","CONFIRMED","CANCELLED"].includes(o.status) : !["COMPLETED","CONFIRMED","CANCELLED"].includes(o.status));
  return <div className="min-h-screen bg-[#eef0f4]">
    <header className="flex h-16 items-center justify-between bg-primary px-5 text-white"><Logo /><div className="flex items-center gap-3 text-sm"><span className="hidden text-white/50 sm:inline">Super Admin</span><span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-primary">SA</span></div></header>
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[360px_1fr]">
      <aside className="hidden border-r border-border bg-white lg:flex lg:flex-col">
        <div className="border-b border-border p-5"><div className="flex items-center justify-between"><b>Operations chat</b><span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">LIVE</span></div><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className="w-full rounded-xl bg-secondary/60 py-2.5 pl-9 pr-3 text-sm" placeholder="Search conversations" /></div></div>
        <div className="flex-1 space-y-1 overflow-auto p-3">{orders.slice(0,7).map((o, i)=><button key={o.id} onClick={()=>setSelected(o)} className={`flex w-full gap-3 rounded-2xl p-3 text-left ${selected?.id===o.id?"bg-secondary":"hover:bg-secondary/50"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-accent">{o.client_name?.split(" ").map((x:string)=>x[0]).join("").slice(0,2)}</span><span className="min-w-0 flex-1"><span className="flex justify-between"><b className="truncate text-sm">{o.client_name}</b><small className="text-muted-foreground">{i+9}:2{i}</small></span><span className="block truncate text-xs text-muted-foreground">{o.reference_number} · {o.status}</span></span></button>)}</div>
        <div className="border-t border-border p-4"><div className="rounded-2xl bg-primary p-4 text-xs text-white/60"><Headphones className="mb-3 h-5 w-5 text-accent" /> WhatsApp relay is handled securely by the KALA backend.</div></div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Operations workspace</p><h1 className="font-display text-3xl text-primary">Orders</h1></div><div className="flex gap-2 overflow-auto">{["Overview","Clients","Orders","Agents","Services","Live Map","Payments","Complaints"].map(x=><button key={x} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${x==="Orders"?"bg-primary text-white":"bg-white text-muted-foreground"}`}>{x}</button>)}</div></div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
          <div className="rounded-[24px] bg-white p-3"><div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-1">{["ACTIVE","ATTENDED","PENDING"].map(x=><button key={x} onClick={()=>setTab(x)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${tab===x?"bg-white text-primary shadow-sm":"text-muted-foreground"}`}>{x}</button>)}</div><div className="mt-2 space-y-2">{filtered.map(o=><button key={o.id} onClick={()=>setSelected(o)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id===o.id?"border-accent bg-accent/5":"border-transparent hover:bg-secondary/40"}`}><div className="flex justify-between gap-2"><b className="text-sm">{o.client_name}</b><small className="font-mono text-[10px] text-muted-foreground">{o.reference_number}</small></div><p className="mt-2 truncate text-xs text-muted-foreground">{o.services?.name || "Service request"} · {o.lga}</p><span className="mt-3 inline-block rounded-full bg-secondary px-2 py-1 text-[9px] font-bold">{o.status}</span></button>)}{!filtered.length&&<div className="p-8 text-center text-sm text-muted-foreground">No orders in this view.</div>}</div></div>
          {selected ? <div className="space-y-5">
            <section className="rounded-[24px] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-accent">{selected.reference_number}</p><h2 className="mt-1 font-display text-3xl text-primary">{selected.services?.name || "Service order"}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.client_name} · {selected.client_phone}</p></div><span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-bold text-[#8a6500]">{statusLabel[selected.status] || selected.status}</span></div><div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"><div><small className="text-muted-foreground">LOCATION</small><p className="mt-1 text-sm font-semibold">{selected.pickup_address || `${selected.lga}, ${selected.state}`}</p></div><div><small className="text-muted-foreground">DATE & TIME</small><p className="mt-1 text-sm font-semibold">{selected.preferred_date || "Flexible"} · {selected.preferred_time || "TBC"}</p></div><div><small className="text-muted-foreground">PAYMENT</small><p className="mt-1 text-sm font-semibold">{selected.payment_status || "Not quoted"}</p></div></div><p className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm leading-6 text-primary/75">{selected.service_description}</p></section>
            <section className="rounded-[24px] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Suggested agents</p><h3 className="mt-1 font-display text-2xl text-primary">Best available matches</h3></div><MapPin className="text-accent" /></div><div className="mt-5 space-y-3">{agents.map(a=><div key={a.id} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary font-bold text-accent">{(a.owner_name||a.business_name||"KA").slice(0,2).toUpperCase()}</span><div><b className="text-sm">{a.owner_name || a.business_name}</b><p className="mt-1 text-xs text-muted-foreground">{a.distance_km ? `${a.distance_km} km away · `:""}{a.availability_status || "Available"} · Rating {a.rating || "4.8"}</p></div></div><div className="flex items-center gap-2"><input value={payment} onChange={(e)=>setPayment(e.target.value)} className="w-24 rounded-xl border border-border px-3 py-2 text-sm" aria-label="Agent payment" /><button onClick={()=>assign(a.id)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Assign</button></div></div>)}{!agents.length&&<p className="rounded-2xl bg-secondary/50 p-5 text-sm text-muted-foreground">No verified available match yet. Try the Agents workspace.</p>}</div></section>
          </div> : <div className="grid min-h-96 place-items-center rounded-[24px] bg-white text-muted-foreground">Select an order to begin.</div>}
        </div>
      </main>
    </div>
  </div>;
}

function AgentPage() {
  const [email, setEmail] = useState(() => { try { return localStorage.getItem("kala_agent_email") || ""; } catch { return ""; } });
  const [entry, setEntry] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const [locationState, setLocationState] = useState("Location is off");
  useEffect(()=>{ if(email) agentOperationsApi.getOrders(email).then(r=>setOrders(r.orders||[])).catch(()=>setOrders([])); },[email]);
  const enter=(e:FormEvent)=>{e.preventDefault();try{localStorage.setItem("kala_agent_email",entry);}catch{}setEmail(entry);};
  const share=()=>{if(!navigator.geolocation){setLocationState("GPS unavailable");return;}setLocationState("Requesting permission…");navigator.geolocation.getCurrentPosition(async(pos)=>{try{await locationApi.update(email,pos.coords.latitude,pos.coords.longitude,"Current area");setLive(true);setLocationState("Updated just now");}catch{setLocationState("Could not send location");}},()=>setLocationState("Permission denied — tracking is off"));};
  if(!email)return <div className="grid min-h-screen place-items-center bg-primary p-5"><form onSubmit={enter} className="w-full max-w-md rounded-[30px] bg-white p-8"><Logo light={false}/><h1 className="mt-10 font-display text-4xl text-primary">Agent portal</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Access assigned work, conversations, location sharing and weekly earnings.</p><label className="mt-7 block text-sm font-semibold">Registered email<input required type="email" value={entry} onChange={e=>setEntry(e.target.value)} className={fieldStyle} /></label><button className="mt-4 w-full rounded-2xl bg-accent py-4 font-bold text-primary">Continue</button></form></div>;
  const completed=orders.filter(o=>["COMPLETED","CONFIRMED"].includes(o.status));
  const weekly=completed.reduce((s,o)=>s+Number(o.agent_payment||0),0);
  return <div className="min-h-screen bg-background"><header className="flex h-16 items-center justify-between bg-primary px-5 text-white"><Logo/><div className="flex items-center gap-3 text-sm"><span className="hidden text-white/50 sm:inline">{email}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary"><UserRound className="h-4 w-4"/></span></div></header><main className="mx-auto max-w-[1280px] px-5 py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Agent workspace</p><h1 className="font-display text-4xl text-primary">Your week at KALA.</h1></div><button onClick={share} className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${live?"bg-green-100 text-green-700":"bg-primary text-white"}`}><MapPin className="h-4 w-4"/>{live?"Live location on":"Share My Location"}</button></div><p className="mt-2 text-xs text-muted-foreground">{locationState}. Browser tracking may pause when this page is closed or suspended.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Total Orders",orders.length,Package],["Total Income",`₦${weekly.toLocaleString()}`,CircleDollarSign],["Weekly Orders",completed.length,CalendarDays],["Weekly Income",`₦${weekly.toLocaleString()}`,Star]].map(([label,value,Icon]:any)=><div key={label} className="rounded-[24px] border border-border bg-white p-6"><Icon className="h-5 w-5 text-accent"/><p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl text-primary">{value}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><section className="rounded-[28px] border border-border bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-display text-2xl text-primary">Assigned orders</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs">{orders.length} total</span></div><div className="mt-5 space-y-3">{orders.map(o=><div key={o.id} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex gap-2"><b className="font-mono text-xs text-accent">{o.reference_number}</b><span className="text-xs text-muted-foreground">{statusLabel[o.status]||o.status}</span></div><h3 className="mt-2 font-semibold">{o.services?.name||"Service order"}</h3><p className="mt-1 text-xs text-muted-foreground">{o.client_name} · {o.lga}, {o.state} · ₦{Number(o.agent_payment||0).toLocaleString()}</p></div><div className="flex gap-2"><button className="rounded-xl border border-border px-3 py-2 text-xs font-bold"><MessageCircle className="h-4 w-4"/></button><button onClick={()=>agentOperationsApi.updateStatus(o.id,email,o.status==="ASSIGNED"?"ACCEPTED":"IN_PROGRESS").then(()=>agentOperationsApi.getOrders(email).then(r=>setOrders(r.orders||[])))} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Update status</button></div></div>)}{!orders.length&&<div className="py-14 text-center"><Package className="mx-auto h-10 w-10 text-border"/><p className="mt-4 text-sm text-muted-foreground">No assigned orders yet.</p></div>}</div></section><aside className="rounded-[28px] bg-primary p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Current week</p><p className="mt-6 font-display text-5xl">{completed.length}</p><p className="text-sm text-white/45">Orders completed</p><div className="my-6 h-px bg-white/10"/><p className="text-sm text-white/45">Income</p><p className="mt-1 font-display text-3xl text-accent">₦{weekly.toLocaleString()}</p><div className="mt-8 rounded-2xl bg-white/5 p-4 text-sm"><div className="flex justify-between"><span className="text-white/45">Payment status</span><b>Pending</b></div><div className="mt-3 flex justify-between"><span className="text-white/45">Next payment</span><b>Friday</b></div></div></aside></div></main></div>;
}

function SimplePage({ type }: { type: "services" | "agent" }) {
  const services = useServices();
  return <div className="min-h-screen bg-background"><Navbar/><main className="mx-auto max-w-[1180px] px-5 py-16"><SectionTitle eyebrow={type==="services"?"KALA services":"Agent onboarding"} title={type==="services"?"What can we take off your list?":"Earn by helping people."} body={type==="services"?"Choose a service and tell us exactly what you need. KALA handles assignment and support.":"Register your capabilities and availability. KALA reviews every application before assigning orders."}/>{type==="services"?<div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map(s=><Link key={s.id} to={`/book?service=${s.id}`} className="rounded-[28px] border border-border bg-white p-7 hover:shadow-lg"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-accent"><ServiceIcon service={s}/></span><h2 className="mt-7 font-display text-2xl">{s.name}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{s.description}</p><span className="mt-6 flex items-center gap-2 text-sm font-bold text-primary">Book this service <ArrowRight className="h-4 w-4"/></span></Link>)}</div>:<div className="mt-12 grid gap-8 rounded-[32px] bg-white p-7 shadow-sm lg:grid-cols-[1fr_360px]"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Full name<input className={fieldStyle}/></label><label className="text-sm font-semibold">Email<input type="email" className={fieldStyle}/></label><label className="text-sm font-semibold">Phone / WhatsApp<input className={fieldStyle}/></label><label className="text-sm font-semibold">NIN<input className={fieldStyle}/><small className="mt-2 block text-muted-foreground">Stored privately and checked server-side.</small></label><label className="text-sm font-semibold sm:col-span-2">Services you can provide<select className={fieldStyle}>{services.map(s=><option key={s.id}>{s.name}</option>)}</select></label><button className="rounded-2xl bg-primary py-4 font-bold text-white sm:col-span-2">Submit application</button></div><div className="rounded-[24px] bg-primary p-6 text-white"><ShieldCheck className="text-accent"/><h3 className="mt-6 font-display text-2xl">A professional network</h3><p className="mt-3 text-sm leading-6 text-white/55">Assignments are based on verification, service capability, availability, location and performance. Agents never pay for public visibility.</p></div></div>}</main></div>;
}

function Pages() {
  const { page } = useNav();
  const path = page.split("?")[0];
  if (path === "/") return <HomePage />;
  if (path === "/book") return <BookingPage />;
  if (path === "/track" || path.startsWith("/track/")) return <TrackPage />;
  if (path === "/services") return <SimplePage type="services" />;
  if (path === "/become-an-agent") return <SimplePage type="agent" />;
  if (path.startsWith("/admin")) return <AdminPage />;
  if (path === "/agent" || path.startsWith("/agent/") || path === "/dashboard") return <AgentPage />;
  if (path.startsWith("/client")) return <TrackPage />;
  return <HomePage />;
}

export default function App() {
  return <NavProvider><Pages /></NavProvider>;
}
