import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase/client";
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
<Link to="/agent" className="transition hover:text-white">Agent portal</Link>
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
        {/* <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(201,150,10,.34),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,255,255,.12),transparent_25%)]" />
          <div className="absolute inset-y-0 left-[8%] w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent" />
          <div className="relative mx-auto grid min-h-[690px] max-w-[1380px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/75"><BadgeCheck className="h-4 w-4 text-accent" /> Trusted help, thoughtfully assigned</div>
              <h1 className="font-display text-5xl font-semibold leading-[.98] sm:text-7xl lg:text-[88px]">Your errands.<br /><span className="italic text-accent">Our duty.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
              From deliveries and grocery shopping to house cleaning, market runs, tours and everyday errands, KALA coordinates the right professional and keeps you informed from request to completion.
              </p>
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
        </section> */}

        <section className="relative overflow-visible bg-primary text-white">
  {/* Background atmosphere */}
  <div className="absolute inset-0">
    <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
    <div className="absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,150,10,.18),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,255,255,.08),transparent_25%)]" />
  </div>

  {/* Decorative vertical line */}
  <div className="absolute inset-y-0 left-[7%] hidden w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent lg:block" />

  <div className="relative mx-auto max-w-[1380px] px-5 pb-28 pt-16 lg:px-8 lg:pb-36 lg:pt-24">
    <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">

      {/* Hero copy */}
      <div className="max-w-3xl">

        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-wide text-white/70">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Reliable service coordination
        </div>

        <h1 className="font-display text-5xl font-semibold leading-[0.96] tracking-tight sm:text-7xl lg:text-[82px]">
          Your errands.
          <br />
          <span className="italic text-accent">
            Our duty.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
          From deliveries and grocery shopping to house cleaning,
          market runs, tours and everyday errands, KALA coordinates
          the right professional and keeps you informed from request
          to completion.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/book")}
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a]"
          >
            Book a Service
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate("/track")}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 font-bold text-white transition hover:bg-white/5"
          >
            Track an Order
          </button>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/45">
          <span className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-accent" />
            Verified professionals
          </span>

          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-accent" />
            Human support
          </span>

          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-accent" />
            Order visibility
          </span>
        </div>
      </div>

      {/* Hero visual */}
      <div className="relative hidden lg:block">

        <div className="absolute -inset-4 rounded-[44px] border border-accent/20" />

        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-accent/20" />

        <ImageWithFallback
          src={brandImage}
          alt="KALA service professional"
          className="relative h-[570px] w-full rounded-[40px] bg-[#071126] object-cover object-top shadow-2xl"
        />

        {/* Floating information card */}
        <div className="absolute -bottom-7 -left-10 max-w-sm rounded-[26px] border border-white/10 bg-[#071126]/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                One request. One team.
              </p>
              <p className="mt-1 text-xs text-white/45">
                Managed from booking to completion.
              </p>
            </div>
          </div>
        </div>

        {/* Small status card */}
        <div className="absolute -right-5 bottom-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs font-semibold text-white">
              KALA operations active
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Service picker */}
  <div className="relative z-30 mx-auto -mb-14 max-w-[1180px] px-5 lg:-mb-16">
  <ServicePicker />
</div>
</section>

        <section className="relative bg-[#F7F4EC] px-5 pb-28 pt-32 lg:px-8">
          <div className="mx-auto max-w-[1280px]">

            {/* Section heading */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                  Everyday support
                </p>

                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
                  One trusted place for
                  <br className="hidden sm:block" />
                  the things that need doing.
                </h2>
              </div>

              <Link
                to="/services"
                className="group inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-accent"
              >
                View all services
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Service cards */}
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  onClick={() => navigate(`/book?service=${service.id}`)}
                  className="group relative min-h-[235px] overflow-hidden rounded-[28px] border border-primary/8 bg-white p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_rgba(13,27,62,0.10)]"
                >
                  {/* Decorative number */}
                  <span className="absolute right-6 top-5 font-mono text-[10px] font-bold tracking-widest text-primary/15">
                    0{index + 1}
                  </span>

                  {/* Icon */}
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F4EAD0] text-accent transition duration-300 group-hover:bg-primary group-hover:text-accent">
                    <ServiceIcon service={service} className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="mt-8 max-w-[260px]">
                    <h3 className="font-display text-2xl font-semibold text-primary">
                      {service.name}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full border border-primary/10 text-primary transition duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>

                  {/* Hover accent */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Small reassurance line */}
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-primary/45">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Professionally coordinated
              </span>

              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                Clear communication
              </span>

              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Trusted service
              </span>
            </div>

          </div>
        </section>

        <section className="bg-white px-5 py-28 lg:px-8">
  <div className="mx-auto max-w-[1280px]">

    <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

      {/* Intro */}
      <div className="max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
          How KALA works
        </p>

        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
          Delegate with
          <br />
          confidence.
        </h2>

        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          You tell us what needs doing. KALA handles the coordination,
          assigns the right professional and keeps you informed until
          the service is completed.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F4EAD0] text-accent">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-primary">
              One team managing your request
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              From booking to completion.
            </p>
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="border-y border-primary/10">

        {[
          {
            number: "01",
            title: "Choose a service",
            body: "Select the service that matches what you need.",
            icon: Search,
          },
          {
            number: "02",
            title: "Tell us what you need",
            body: "Give us the instructions, location and preferred timing.",
            icon: FileText,
          },
          {
            number: "03",
            title: "KALA assigns the right professional",
            body: "Our operations team reviews your request and assigns a suitable agent.",
            icon: Users,
          },
          {
            number: "04",
            title: "Track and communicate",
            body: "Follow progress, send instructions and communicate through your order.",
            icon: MessageCircle,
          },
          {
            number: "05",
            title: "Get it done",
            body: "The assigned professional completes the request and KALA confirms the outcome.",
            icon: CheckCircle2,
          },
        ].map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.number}
              className="group grid grid-cols-[42px_1fr_34px] items-center gap-4 border-b border-primary/10 py-6 last:border-b-0 sm:grid-cols-[52px_1fr_40px] sm:gap-5"
            >
              {/* Number */}
              <span className="font-mono text-[10px] font-bold tracking-widest text-accent">
                {step.number}
              </span>

              {/* Text */}
              <div>
                <h3 className="text-sm font-bold text-primary sm:text-base">
                  {step.title}
                </h3>

                <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                  {step.body}
                </p>
              </div>

              {/* Icon */}
              <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/10 text-primary/30 transition duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          );
        })}

      </div>
    </div>

    {/* Bottom workflow statement */}
    <div className="mt-14 rounded-[28px] bg-primary px-7 py-8 text-white sm:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            The KALA model
          </p>

          <p className="mt-2 font-display text-2xl sm:text-3xl">
            You request. We coordinate. Your service gets done.
          </p>
        </div>

        <button
          onClick={() => navigate("/book")}
          className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a]"
        >
          Book a Service
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>

      </div>
    </div>

  </div>
</section>

        <section className="bg-[#F7F4EC] px-5 py-28 lg:px-8">
  <div className="mx-auto max-w-[1280px]">

    {/* Heading */}
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
        The KALA standard
      </p>

      <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
        Serious about the details.
      </h2>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
        Every request is handled with clear communication, professional
        coordination and operational visibility from start to finish.
      </p>
    </div>

    {/* Standards */}
    <div className="mt-14 grid gap-5 md:grid-cols-3">
      {[
        {
          icon: ShieldCheck,
          number: "01",
          title: "Verified professionals",
          body: "We review the people entrusted with KALA orders so your request is handled by a professional.",
        },
        {
          icon: MessageCircle,
          number: "02",
          title: "One clear conversation",
          body: "Keep instructions, approvals, images and updates connected to the same order.",
        },
        {
          icon: MapPin,
          number: "03",
          title: "Operational visibility",
          body: "KALA monitors the progress of your request while keeping you informed along the way.",
        },
      ].map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.number}
            className="group relative overflow-hidden rounded-[28px] border border-primary/8 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(13,27,62,0.10)]"
          >
            {/* Number */}
            <span className="absolute right-7 top-6 font-mono text-[10px] font-bold tracking-widest text-primary/15">
              {item.number}
            </span>

            {/* Icon */}
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F4EAD0] text-accent transition duration-300 group-hover:bg-primary">
              <Icon className="h-5 w-5 transition group-hover:text-accent" />
            </div>

            {/* Text */}
            <h3 className="mt-8 font-display text-2xl font-semibold text-primary">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>

            {/* Bottom accent */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </div>
        );
      })}
    </div>

    {/* Agent CTA */}
    <div className="relative mt-16 overflow-hidden rounded-[32px] bg-primary px-7 py-10 text-white sm:px-10 sm:py-12">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-accent/10" />
      <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            Become a KALA agent
          </p>

          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Want to earn by helping people?
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
            Join the KALA professional network, receive service requests
            matched to your capabilities and earn from completed orders.
          </p>
        </div>

        <Link
          to="/become-an-agent"
          className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a]"
        >
          Become a KALA Agent
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>

      </div>
    </div>

  </div>
</section>

        <section className="bg-white px-5 py-28 lg:px-8">
  <div className="mx-auto max-w-[1280px]">

    <div className="grid items-center gap-14 lg:grid-cols-[0.75fr_1.25fr]">

      {/* Intro */}
      <div className="max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
          Why clients choose KALA
        </p>

        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
          Relief,
          <br />
          delivered.
        </h2>

        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          You don't need another number to call or another person to
          coordinate. KALA gives you one place to request a service,
          communicate, follow progress and get the job completed.
        </p>

        <button
          onClick={() => navigate("/book")}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#162b5d]"
        >
          Book a Service
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </div>

      {/* Benefits */}
      <div className="grid gap-4 sm:grid-cols-2">

        {[
          {
            icon: Clock3,
            title: "Less coordination",
            body: "Tell KALA what you need once. Our operations team handles the coordination.",
          },
          {
            icon: MessageCircle,
            title: "Clear communication",
            body: "Keep instructions, updates, approvals and conversations connected to your order.",
          },
          {
            icon: MapPin,
            title: "Know what's happening",
            body: "Follow your request from booking through assignment, execution and completion.",
          },
          {
            icon: ShieldCheck,
            title: "A team you can rely on",
            body: "KALA oversees the service while the assigned professional handles the work.",
          },
          {
            icon: FileText,
            title: "Everything stays connected",
            body: "Your order details, instructions and service history stay together in one place.",
          },
          {
            icon: CheckCircle2,
            title: "Completion matters",
            body: "We don't stop at assignment. KALA follows the request through to the outcome.",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-[26px] border border-primary/8 bg-[#F7F4EC] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_50px_rgba(13,27,62,0.08)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-sm transition duration-300 group-hover:bg-primary">
                <Icon className="h-5 w-5 transition group-hover:text-accent" />
              </div>

              <h3 className="mt-6 font-display text-xl font-semibold text-primary">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </div>
          );
        })}

      </div>
    </div>

  </div>
</section>

        <section className="bg-[#F7F4EC] px-5 py-28 lg:px-8">
  <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

    {/* FAQ intro */}
    <div className="max-w-md">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
        Questions, answered
      </p>

      <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
        Before you hand us
        <br />
        the list.
      </h2>

      <p className="mt-6 text-sm leading-7 text-muted-foreground">
        Need help with something unusual? Start a booking and describe it.
        Our operations team will review the request before assigning it.
      </p>

      <button
        onClick={() => navigate("/book")}
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#162b5d]"
      >
        Start a Booking
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </button>
    </div>

    {/* Questions */}
    <div className="space-y-3">

      {[
        {
          question: "How are agents assigned?",
          answer:
            "After you submit a booking, KALA reviews the service, location, timing and requirements. An admin then selects an appropriate verified and available professional and assigns the order.",
        },
        {
          question: "Can I speak with my assigned agent?",
          answer:
            "Yes. Once an agent has been assigned, communication can take place through your order workspace. You can exchange messages, instructions, images and relevant files while KALA remains connected to the request.",
        },
        {
          question: "How do I track my order?",
          answer:
            "Every booking receives an order reference. Use the Track Order page with your reference and contact details to follow the progress of your request from booking through completion.",
        },
        {
          question: "Can I send purchase images or proof of payment?",
          answer:
            "Yes. For services that involve purchases or payments, your order workspace can be used to share relevant images, receipts and proof of payment so the request remains properly documented.",
        },
        {
          question: "What happens if the assigned agent cannot complete the request?",
          answer:
            "KALA's operations team can review the situation and reassign the order when necessary. The goal is to keep responsibility with KALA rather than leaving you to coordinate a replacement yourself.",
        },
        {
          question: "Can I continue the conversation on WhatsApp?",
          answer:
            "Where appropriate, KALA can provide a WhatsApp option for continued communication. Your order remains the primary reference for the service and its progress.",
        },
      ].map((item, index) => (
        <details
          key={item.question}
          open={index === 0}
          className="group rounded-2xl border border-primary/8 bg-white px-6 transition duration-300 open:shadow-[0_16px_40px_rgba(13,27,62,0.06)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-sm font-bold text-primary [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>

            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/10 text-primary/50 transition duration-300 group-open:rotate-45 group-open:border-accent group-open:bg-accent group-open:text-primary">
              <Plus className="h-4 w-4" />
            </span>
          </summary>

          <div className="max-w-2xl pb-6 pr-10">
            <p className="text-sm leading-7 text-muted-foreground">
              {item.answer}
            </p>
          </div>
        </details>
      ))}

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
    <footer className="bg-[#071126] px-5 py-16 text-white lg:px-8">
  <div className="mx-auto max-w-[1280px]">

    {/* Main footer */}
    <div className="grid gap-12 md:grid-cols-[1.4fr_.7fr_.7fr_.8fr]">

      {/* Brand */}
      <div className="max-w-sm">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/50 text-accent">
            <span className="font-display text-lg italic">K</span>
          </div>

          <div>
            <div className="font-display text-xl font-semibold tracking-wide">
              KALA
            </div>

            <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/40">
              Concierge
            </div>
          </div>
        </Link>

        <p className="mt-6 max-w-xs text-sm leading-6 text-white/45">
          Reliable service coordination for busy people across Nigeria.
          Tell us what needs doing. We'll coordinate the rest.
        </p>

        <button
          onClick={() => navigate("/book")}
          className="group mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a]"
        >
          Book a Service
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </button>
      </div>

      {/* Navigate */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
          Navigate
        </p>

        <div className="mt-5 space-y-3 text-sm text-white/55">
          <Link
            to="/services"
            className="block transition hover:text-white"
          >
            Services
          </Link>

          <Link
            to="/book"
            className="block transition hover:text-white"
          >
            Book a service
          </Link>

          <Link
            to="/track"
            className="block transition hover:text-white"
          >
            Track an order
          </Link>

          <Link
            to="/become-an-agent"
            className="block transition hover:text-white"
          >
            Become an agent
          </Link>
        </div>
      </div>

      {/* Services */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
          Services
        </p>

        <div className="mt-5 space-y-3 text-sm text-white/55">
  <button
    onClick={() => navigate("/book?service=tour-guide")}
    className="block text-left transition hover:text-white"
  >
    Tour Guide
  </button>

  <button
    onClick={() => navigate("/book?service=house-cleaning")}
    className="block text-left transition hover:text-white"
  >
    House Cleaning
  </button>

  <button
    onClick={() => navigate("/book?service=pick-up-delivery")}
    className="block text-left transition hover:text-white"
  >
    Pick Up & Delivery
  </button>

  <button
    onClick={() => navigate("/book?service=grocery-shopping")}
    className="block text-left transition hover:text-white"
  >
    Grocery Shopping
  </button>
</div>
      </div>

      {/* Support */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
          Support
        </p>

        <div className="mt-5 space-y-4 text-sm text-white/55">
          <a
            href="tel:+2340000000000"
            className="block transition hover:text-white"
          >
            Call KALA
          </a>

          <a
            href="mailto:support@kala.com.ng"
            className="block transition hover:text-white"
          >
            support@kala.com.ng
          </a>

          <Link
            to="/track"
            className="flex items-center gap-2 transition hover:text-white"
          >
            <MapPin className="h-4 w-4 text-accent" />
            Track your order
          </Link>
        </div>
      </div>

    </div>

    {/* Bottom bar */}
    <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-[10px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
      <span>
        © 2026 KALA. Built with ❤️ by <a
            href="https://github.com/jameskingwebdev"
            className="transition hover:text-white text-[9px] font-bold uppercase tracking-[0.25em] text-accent"
          >
            James King
          </a>
      </span>

      <div className="flex gap-5">
        <span>Service coordination</span>
        <span>Client support</span>
        <span>Professional network</span>
      </div>
    </div>

  </div>
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
        <div className="mb-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              KALA service request
            </p>

            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
              Tell us what needs doing.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              Give us the details of your request and our operations team will
              review it, coordinate the right professional and keep you informed
              through completion.
            </p>
          </div>

          <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-accent">01</span>
              <span>Details</span>
              <span className="mx-1 text-primary/20">→</span>
              <span className={review ? "font-bold text-accent" : "text-primary/30"}>
                02
              </span>
              <span>Review</span>
            </div>
          </div>
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
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-primary">
                  What service do you need?
                </span>

                <select
                  value={form.service_id || ""}
                  onChange={(e) => set("service_id", e.target.value)}
                  className={`${fieldStyle} border-primary/20 bg-[#F7F4EC] font-semibold text-primary`}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <span className="mt-2 block text-xs text-muted-foreground">
                  Choose the service that best describes what you need. KALA will handle
                  the professional assignment.
                </span>
              </label>
              {specific.map(([key, label], index) => {
  const isLongText =
    key === "shopping_list" ||
    key === "cleaning_requirements" ||
    key === "package_description" ||
    key === "items_required" ||
    key === "errand_details";

  const isNumber =
    key === "budget" ||
    key === "rooms" ||
    key === "party_size";

  const fullWidth =
    isLongText ||
    (index === specific.length - 1 && specific.length % 2 !== 0);

  return (
    <label
      key={key}
      className={`text-sm font-semibold ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      <span className="mb-2 block text-primary">
        {label}
      </span>

      {isLongText ? (
        <textarea
          required={index === 0}
          rows={3}
          value={form[key] || ""}
          onChange={(e) => set(key, e.target.value)}
          className={fieldStyle}
          placeholder={
            key === "shopping_list"
              ? "List the items you need..."
              : key === "items_required"
                ? "List the items you need us to get..."
                : key === "package_description"
                  ? "Describe the package or item..."
                  : key === "cleaning_requirements"
                    ? "Tell us about any specific cleaning requirements..."
                    : "Describe what you need us to do..."
          }
        />
      ) : (
        <input
          required={index === 0}
          type={isNumber ? "number" : "text"}
          min={isNumber ? "1" : undefined}
          value={form[key] || ""}
          onChange={(e) => set(key, e.target.value)}
          className={fieldStyle}
          placeholder={
            key === "budget"
              ? "Enter your budget in ₦"
              : key === "rooms"
                ? "e.g. 3"
                : key === "party_size"
                  ? "e.g. 4"
                  : key === "preferred_store"
                    ? "e.g. Shoprite, local market..."
                    : key === "market_preference"
                      ? "Which market would you prefer?"
                      : key === "property_type"
                        ? "e.g. Apartment, duplex, office..."
                        : key === "duration"
                          ? "e.g. 3 hours"
                          : undefined
          }
        />
      )}
    </label>
  );
})}
              <label className="text-sm font-semibold sm:col-span-2">Additional instructions<textarea rows={3} value={form.special_instructions || ""} onChange={(e) => set("special_instructions", e.target.value)} className={fieldStyle} placeholder="Access notes, preferences, or anything else we should know" /></label>
            </div>
            <div className="my-8 h-px bg-border" />
            <h3 className="font-display text-2xl text-primary">
  Where and when?
</h3>

<p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
  Tell us where the service will happen and when you would like it handled.
  These details help our operations team coordinate the right professional.
</p>

<div className="mt-6 grid gap-5 sm:grid-cols-2">
  <label className="text-sm font-semibold sm:col-span-2">
    <span className="mb-2 block text-primary">
      Service address
    </span>

    <input
      required
      value={form.address || ""}
      onChange={(e) => set("address", e.target.value)}
      className={fieldStyle}
      placeholder="Street address, landmark or detailed location"
    />

    <span className="mt-2 block text-xs font-normal text-muted-foreground">
      Provide enough detail for the assigned professional to find the location.
    </span>
  </label>

  <label className="text-sm font-semibold">
    <span className="mb-2 block text-primary">
      LGA / Area
    </span>

    <input
      required
      value={form.lga || ""}
      onChange={(e) => set("lga", e.target.value)}
      className={fieldStyle}
      placeholder="e.g. Aba North"
    />
  </label>

  <label className="text-sm font-semibold">
    <span className="mb-2 block text-primary">
      State
    </span>

    <input
      required
      value={form.state || ""}
      onChange={(e) => set("state", e.target.value)}
      className={fieldStyle}
      placeholder="e.g. Abia"
    />
  </label>

  <label className="text-sm font-semibold">
    <span className="mb-2 block text-primary">
      Preferred date
    </span>

    <input
      required={!form.flexible_schedule}
      type="date"
      value={form.preferred_date || ""}
      onChange={(e) => set("preferred_date", e.target.value)}
      className={fieldStyle}
    />
  </label>

  <label className="text-sm font-semibold">
    <span className="mb-2 block text-primary">
      Preferred time
    </span>

    <input
      required={!form.flexible_schedule}
      type="time"
      value={form.preferred_time || ""}
      onChange={(e) => set("preferred_time", e.target.value)}
      className={fieldStyle}
    />
  </label>

  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/10 bg-[#F7F4EC] p-4 text-sm sm:col-span-2">
    <input
      type="checkbox"
      checked={form.flexible_schedule}
      onChange={(e) => set("flexible_schedule", e.target.checked)}
      className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9960A]"
    />

    <span>
      <span className="block font-bold text-primary">
        My schedule is flexible
      </span>

      <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
        KALA can coordinate the request around the availability of the
        appropriate professional.
      </span>
    </span>
  </label>
</div>
            <div className="mt-8">
  <button
    type="submit"
    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#162b5d]"
  >
    Review your request
    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
  </button>

  <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
    You will review all your details before the request is sent to KALA.
  </p>
</div>
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
  const serviceData = service
    ? {
        name: service.name,
        description: service.description,
      }
    : null;

  const details = [
    ["Client", form.client_name],
    ["Phone", form.client_phone],
    ["Email", form.client_email],
    ["Location", `${form.address}, ${form.lga}, ${form.state}`],
    [
      "Schedule",
      form.flexible_schedule
        ? "Flexible schedule"
        : `${form.preferred_date} at ${form.preferred_time}`,
    ],
    ["Instructions", form.special_instructions || "None"],
  ];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071126]/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl sm:p-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              Review your request
            </p>

            <h2 className="mt-2 font-display text-3xl font-semibold text-primary sm:text-4xl">
              Everything look right?
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Check your details before sending the request to KALA.
              You can go back and make changes if anything needs updating.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="shrink-0 rounded-full bg-secondary p-2 text-primary transition hover:bg-primary hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected service */}
        <div className="mt-7 rounded-[24px] bg-primary p-5 text-white">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
            Selected service
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-accent">
              {service && <ServiceIcon service={service} />}
            </div>

            <div>
              <h3 className="font-display text-2xl font-semibold">
                {serviceData?.name || "KALA service"}
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/50">
                {serviceData?.description ||
                  "Your request will be reviewed by KALA operations."}
              </p>
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="mt-5 overflow-hidden rounded-[24px] border border-primary/10">
          <div className="border-b border-primary/10 bg-[#F7F4EC] px-5 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
              Request details
            </p>
          </div>

          <div className="divide-y divide-primary/8 px-5">
            {details.map(([key, value]) => (
              <div
                key={key}
                className="grid gap-2 py-4 sm:grid-cols-[120px_1fr] sm:gap-5"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {key}
                </span>

                <span className="break-words text-sm font-semibold leading-6 text-primary">
                  {value || "Not provided"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KALA process note */}
        <div className="mt-5 rounded-[22px] border border-accent/20 bg-accent/5 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />

            <div>
              <p className="text-sm font-bold text-primary">
                What happens next?
              </p>

              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                Once you confirm, KALA will create your order and our
                operations team will review the request before assigning
                the appropriate professional.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex flex-1 items-center justify-center rounded-2xl border border-primary/10 py-4 text-sm font-bold text-primary transition hover:bg-secondary disabled:opacity-50"
          >
            Go back & edit
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating order…" : "Confirm & submit request"}

            {!saving && (
              <Check className="h-4 w-4 transition group-hover:scale-110" />
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
          Your request is not submitted until you click
          <span className="font-semibold text-primary">
            {" "}“Confirm & submit request”
          </span>.
        </p>

      </div>
    </div>
  );
}

function Confirmation({ reference, service }: { reference: string; service: string }) {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      <Navbar />

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center px-5 py-12 lg:px-8">
        <div className="w-full rounded-[32px] border border-primary/10 bg-white p-7 text-center shadow-[0_24px_80px_rgba(13,27,62,0.10)] sm:p-10">

          {/* Success icon */}
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/15">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>

          {/* Heading */}
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Request received
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
            We have your request.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
            Your KALA service request has been successfully submitted.
            Our operations team will review the request and coordinate the
            appropriate professional for you.
          </p>

          {/* Reference */}
          <div className="mx-auto mt-8 max-w-md rounded-[24px] border border-accent/25 bg-[#F7F4EC] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Your order reference
            </p>

            <p className="mt-3 break-all font-mono text-2xl font-bold tracking-wider text-primary">
              {reference}
            </p>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Keep this reference safe. You can use it to track your order
              and communicate with KALA about this request.
            </p>
          </div>

          {/* Service */}
          <div className="mx-auto mt-5 flex max-w-md items-center gap-4 rounded-[22px] border border-primary/10 p-4 text-left">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-accent">
              <Check className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Service requested
              </p>

              <p className="mt-1 truncate font-semibold text-primary">
                {service}
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="mx-auto mt-8 max-w-xl rounded-[24px] bg-primary p-6 text-left text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              What happens next?
            </p>

            <div className="mt-5 space-y-5">
              {[
                ["01", "KALA reviews your request", "Our operations team checks the details and requirements."],
                ["02", "A professional is assigned", "We select the appropriate verified professional for your request."],
                ["03", "You stay informed", "You can track the order and communicate through your order."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-accent">
                    {number}
                  </span>

                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/track/${reference}`)}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-[#e1b43a]"
            >
              Track this order
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex flex-1 items-center justify-center rounded-2xl border border-primary/10 py-4 text-sm font-bold text-primary transition hover:bg-secondary"
            >
              Return to KALA
            </button>
          </div>

          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Need help? Contact KALA support and provide your order reference.
          </p>
        </div>
      </main>
    </div>
  );
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
  const [chatMessages, setChatMessages] = useState<any[]>([]);
const [chatLoading, setChatLoading] = useState(false);
const [chatError, setChatError] = useState("");
const [chatMessage, setChatMessage] = useState("");
const [chatSending, setChatSending] = useState(false);
  const load = async (adminPin = pin) => { const result = await adminApi.getOrders(adminPin); setOrders(result.orders || []); setSelected(result.orders?.[0] || null); };
  useEffect(() => { if (pin) load().catch(() => setPin("")); }, [pin]);
  const login = async (e: FormEvent) => { e.preventDefault(); try { await adminApi.login(input); try { sessionStorage.setItem("kala_ops_pin", input); } catch {} setPin(input); } catch { alert("Incorrect PIN"); } };
  useEffect(() => {
  if (!selected?.id || !pin) {
    setChatMessages([]);
    return;
  }

  let cancelled = false;

  const loadMessages = async () => {
    setChatLoading(true);
    setChatError("");

    try {
      const result = await adminApi.getMessages(selected.id, pin);

      if (!cancelled) {
        setChatMessages(result.messages || []);
      }
    } catch (error: any) {
      if (!cancelled) {
        setChatError(error?.message || "Unable to load conversation.");
        setChatMessages([]);
      }
    } finally {
      if (!cancelled) {
        setChatLoading(false);
      }
    }
  };

  loadMessages();

  return () => {
    cancelled = true;
  };
}, [selected?.id, pin]);

const handleSendChatMessage = async () => {
  const content = chatMessage.trim();

  if (!content || !selected?.id || !pin || chatSending) {
    return;
  }

  setChatSending(true);
  setChatError("");

  try {
    await adminApi.sendMessage(selected.id, content, pin);

    setChatMessage("");

    const response = await adminApi.getMessages(selected.id, pin);
    setChatMessages(response.messages || []);
  } catch (error: any) {
    console.error("Failed to send admin message:", error);
    setChatError(error?.message || "Unable to send message.");
  } finally {
    setChatSending(false);
  }
};

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
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Operations workspace</p><h1 className="font-display text-3xl text-primary">Orders</h1></div><div className="flex gap-2 overflow-auto">{["Overview","Clients","Orders","Agents","Services","Live Map","Payments","Complaints"].map(x=><button
  key={x}
  onClick={() => {
    if (x === "Agents") {
      alert("Agents workspace coming next");
    }
  }}
  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
    x === "Orders"
      ? "bg-primary text-white"
      : "bg-white text-muted-foreground"
  }`}
>
  {x}
</button>)}</div></div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
          <div className="rounded-[24px] bg-white p-3"><div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-1">{["ACTIVE","ATTENDED","PENDING"].map(x=><button key={x} onClick={()=>setTab(x)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${tab===x?"bg-white text-primary shadow-sm":"text-muted-foreground"}`}>{x}</button>)}</div><div className="mt-2 space-y-2">{filtered.map(o=><button key={o.id} onClick={()=>setSelected(o)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id===o.id?"border-accent bg-accent/5":"border-transparent hover:bg-secondary/40"}`}><div className="flex justify-between gap-2"><b className="text-sm">{o.client_name}</b><small className="font-mono text-[10px] text-muted-foreground">{o.reference_number}</small></div><p className="mt-2 truncate text-xs text-muted-foreground">{o.services?.name || "Service request"} · {o.lga}</p><span className="mt-3 inline-block rounded-full bg-secondary px-2 py-1 text-[9px] font-bold">{o.status}</span></button>)}{!filtered.length&&<div className="p-8 text-center text-sm text-muted-foreground">No orders in this view.</div>}</div></div>
          {selected ? <div className="space-y-5">
            <section className="rounded-[24px] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-accent">{selected.reference_number}</p><h2 className="mt-1 font-display text-3xl text-primary">{selected.services?.name || "Service order"}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.client_name} · {selected.client_phone}</p></div><span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-bold text-[#8a6500]">{statusLabel[selected.status] || selected.status}</span></div><div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"><div><small className="text-muted-foreground">LOCATION</small><p className="mt-1 text-sm font-semibold">{selected.pickup_address || `${selected.lga}, ${selected.state}`}</p></div><div><small className="text-muted-foreground">DATE & TIME</small><p className="mt-1 text-sm font-semibold">{selected.preferred_date || "Flexible"} · {selected.preferred_time || "TBC"}</p></div><div><small className="text-muted-foreground">PAYMENT</small><p className="mt-1 text-sm font-semibold">{selected.payment_status || "Not quoted"}</p></div></div><p className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm leading-6 text-primary/75">{selected.service_description}</p></section>
            <section className="rounded-[24px] bg-white p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">
        Operations chat
      </p>
      <h3 className="mt-1 font-display text-2xl text-primary">
        Order conversation
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {selected.reference_number}
      </p>
    </div>

    <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700">
      LIVE
    </span>
  </div>

  <div className="mt-5 max-h-[450px] min-h-[180px] space-y-4 overflow-y-auto rounded-2xl bg-secondary/30 p-4">

    {chatLoading && (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading conversation...
      </p>
    )}

    {!chatLoading && chatError && (
      <p className="py-8 text-center text-sm text-red-600">
        {chatError}
      </p>
    )}

    {!chatLoading && !chatError && chatMessages.length === 0 && (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No messages yet. Messages from the client and assigned agent will appear here.
      </p>
    )}

    {!chatLoading && !chatError && chatMessages.map((message) => {
      const isAdmin = message.sender_type === "admin";

      return (
        <div
          key={message.id}
          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              isAdmin
                ? "rounded-br-sm bg-primary text-white"
                : "rounded-bl-sm bg-white text-primary shadow-sm"
            }`}
          >
            <p className={`mb-1 text-[10px] font-bold uppercase ${
              isAdmin ? "text-accent" : "text-muted-foreground"
            }`}>
              {message.sender_type === "admin"
                ? "Admin"
                : message.sender_type === "agent"
                ? "Agent"
                : "Client"}
            </p>

            {message.message_type === "text" ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {message.content}
              </p>
            ) : (
              <p className="text-sm">
                {message.content || "Attachment"}
              </p>
            )}

            {message.message_attachments?.map((attachment: any) => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noreferrer"
                className={`mt-2 block text-xs underline ${
                  isAdmin ? "text-accent" : "text-primary"
                }`}
              >
                {attachment.file_name || "View attachment"}
              </a>
            ))}

            <p className={`mt-2 text-[9px] ${
              isAdmin ? "text-white/50" : "text-muted-foreground"
            }`}>
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      );
    })}
  </div>
</section>

<div className="mt-4">
  {chatError && (
    <p className="mb-2 text-xs text-red-600">
      {chatError}
    </p>
  )}

  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleSendChatMessage();
    }}
    className="flex gap-2"
  >
    <input
      value={chatMessage}
      onChange={(e) => setChatMessage(e.target.value)}
      placeholder="Type a message..."
      disabled={chatSending}
      className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
    />

    <button
      type="submit"
      disabled={!chatMessage.trim() || chatSending}
      className="rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {chatSending ? "Sending..." : "Send"}
    </button>
  </form>
</div>

            <section className="rounded-[24px] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Suggested agents</p><h3 className="mt-1 font-display text-2xl text-primary">Best available matches</h3></div><MapPin className="text-accent" /></div><div className="mt-5 space-y-3">{agents.map(a=><div key={a.id} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary font-bold text-accent">{(a.owner_name||a.business_name||"KA").slice(0,2).toUpperCase()}</span><div><b className="text-sm">{a.owner_name || a.business_name}</b><p className="mt-1 text-xs text-muted-foreground">{a.distance_km ? `${a.distance_km} km away · `:""}{a.availability_status || "Available"} · Rating {a.rating || "4.8"}</p></div></div><div className="flex items-center gap-2"><input value={payment} onChange={(e)=>setPayment(e.target.value)} className="w-24 rounded-xl border border-border px-3 py-2 text-sm" aria-label="Agent payment" /><button onClick={()=>assign(a.id)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Assign</button></div></div>)}{!agents.length&&<p className="rounded-2xl bg-secondary/50 p-5 text-sm text-muted-foreground">No verified available match yet. Try the Agents workspace.</p>}</div></section>
          </div> : <div className="grid min-h-96 place-items-center rounded-[24px] bg-white text-muted-foreground">Select an order to begin.</div>}
        </div>
      </main>
    </div>
  </div>;
}

function AgentPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [authError, setAuthError] = useState("");
const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
const [newPassword, setNewPassword] = useState("");
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsPasswordRecovery(true);
      setEmail(session?.user?.email || "");
      return;
    }

    if (session?.user?.email) {
      setEmail(session.user.email);
    } else if (event === "SIGNED_OUT") {
      setEmail("");
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
const [entry, setEntry] = useState("");
const [orders, setOrders] = useState<any[]>([]);
const [chatOrder, setChatOrder] = useState<any>(null);

const [chatMessages, setChatMessages] = useState<any[]>([]);
const [chatLoading, setChatLoading] = useState(false);
const [chatError, setChatError] = useState("");
const [chatMessage, setChatMessage] = useState("");
const [chatSending, setChatSending] = useState(false);
const handleSendChatMessage = async () => {
  const content = chatMessage.trim();

  if (!content || !chatOrder?.id || !email || chatSending) {
    return;
  }

  setChatSending(true);
  setChatError("");

  try {
    await agentOperationsApi.sendMessage(
      chatOrder.id,
      email,
      content
    );

    setChatMessage("");

    const response = await agentOperationsApi.getMessages(
      chatOrder.id,
      email
    );

    setChatMessages(response.messages || []);
  } catch (error: any) {
    console.error("Failed to send chat message:", error);

    setChatError(
      error?.message || "Unable to send message."
    );
  } finally {
    setChatSending(false);
  }
};
  const [live, setLive] = useState(false);
  const [locationState, setLocationState] = useState("Location is off");
  useEffect(() => {
  if (!chatOrder?.id || !email) {
    setChatMessages([]);
    return;
  }

  let cancelled = false;

  const loadMessages = async () => {
    setChatLoading(true);
    setChatError("");

    try {
      const response = await agentOperationsApi.getMessages(
        chatOrder.id,
        email
      );

      if (!cancelled) {
        setChatMessages(response.messages || []);
      }
    } catch (error: any) {
      console.error("Failed to load chat messages:", error);

      if (!cancelled) {
        setChatError(
          error?.message || "Unable to load conversation messages."
        );
      }
    } finally {
      if (!cancelled) {
        setChatLoading(false);
      }
    }
  };

  loadMessages();

  return () => {
    cancelled = true;
  };
}, [chatOrder?.id, email]);

  useEffect(() => {
  if (!email) return;

  console.log("Loading agent orders for:", email);

  agentOperationsApi.getOrders(email)
    .then((r) => {
      console.log("Agent orders API response:", r);
      setOrders(r.orders || []);
    })
    .catch((error) => {
      console.error("Failed to load agent orders:", error);
    });
}, [email]);
  const enter = async (e: FormEvent) => {
  e.preventDefault();

  const emailAddress = entry.trim();

  if (!emailAddress || !password) {
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailAddress,
    password,
  });

  if (error) {
    console.error("Agent login failed:", error);
    alert(error.message);
    return;
  }

  setEmail(data.user?.email || emailAddress);
};

const handleForgotPassword = async () => {
  const emailAddress = entry.trim();

  if (!emailAddress) {
    setAuthError("Enter your registered email address first.");
    return;
  }

  setAuthLoading(true);
  setAuthError("");

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      emailAddress,
      {
        redirectTo: `${window.location.origin}/agent`,
      }
    );

    if (error) {
      setAuthError(error.message);
      return;
    }

    alert("If an account exists for this email, a password reset link will be sent.");
  } catch (error: any) {
    setAuthError(error.message || "Unable to request password reset.");
  } finally {
    setAuthLoading(false);
  }
};

const handlePasswordUpdate = async (e: FormEvent) => {
  e.preventDefault();

  if (newPassword.length < 8) {
    setAuthError("Your new password must contain at least 8 characters.");
    return;
  }

  setAuthLoading(true);
  setAuthError("");

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    setNewPassword("");
    setPassword("");
    setIsPasswordRecovery(false);

    alert("Your password has been updated successfully. Please sign in again.");

    await supabase.auth.signOut();
    setEmail("");
  } catch (error: any) {
    setAuthError(error.message || "Unable to update password.");
  } finally {
    setAuthLoading(false);
  }
};


  const share=()=>{if(!navigator.geolocation){setLocationState("GPS unavailable");return;}setLocationState("Requesting permission…");navigator.geolocation.getCurrentPosition(async(pos)=>{try{await locationApi.update(email,pos.coords.latitude,pos.coords.longitude,"Current area");setLive(true);setLocationState("Updated just now");}catch{setLocationState("Could not send location");}},()=>setLocationState("Permission denied — tracking is off"));};

  if (isPasswordRecovery) {
  return (
    <div className="grid min-h-screen place-items-center bg-primary p-5">
      <div className="absolute left-5 top-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Link>
      </div>
      <form
        onSubmit={handlePasswordUpdate}
        className="w-full max-w-md rounded-[30px] bg-white p-8"
      >
        <Logo light={false} />

        <h1 className="mt-10 font-display text-3xl text-primary">
          Reset your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Create a new password for your KALA Agent account.
        </p>

        <label className="mt-7 block text-sm font-semibold">
          New password
          <input
            required
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={fieldStyle}
            autoComplete="new-password"
          />
        </label>

        {authError && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="mt-6 w-full rounded-2xl bg-accent py-4 font-bold text-primary disabled:opacity-60"
        >
          {authLoading ? "Updating password..." : "Update password"}
        </button>
      </form>
    </div>
  );
}


 if (!email) {
  return (
    <div className="grid min-h-screen place-items-center bg-primary p-5">
      <div className="absolute left-5 top-5 z-50">
  <Link
    to="/"
    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
  >
    <Home className="h-4 w-4" />
    Return to Home
  </Link>
</div>
      <form
        onSubmit={enter}
        className="w-full max-w-md rounded-[30px] bg-white p-8"
      >
        <Logo light={false} />

        <h1 className="mt-10 font-display text-4xl text-primary">
          Agent portal
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Access assigned work, conversations, location sharing and weekly earnings.
        </p>

        <label className="mt-7 block text-sm font-semibold">
          Registered email
          <input
            required
            type="email"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className={fieldStyle}
            autoComplete="username"
          />
        </label>

        <label className="mt-5 block text-sm font-semibold">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldStyle}
            autoComplete="current-password"
          />
        </label>

        {authError && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="mt-6 w-full rounded-2xl bg-accent py-4 font-bold text-primary disabled:opacity-60"
        >
          {authLoading ? "Signing in..." : "Sign in"}
        </button>
        <button
  type="button"
  onClick={handleForgotPassword}
  disabled={authLoading}
  className="mt-5 w-full text-center text-sm font-semibold text-primary hover:text-accent"
>
  Forgot password?
</button>
      </form>
    </div>
  );
}
  const completed=orders.filter(o=>["COMPLETED","CONFIRMED"].includes(o.status));
  const weekly=completed.reduce((s,o)=>s+Number(o.agent_payment||0),0);
  return <div className="min-h-screen bg-background"><header className="flex h-16 items-center justify-between bg-primary px-5 text-white"><div className="flex items-center gap-3">
  <Logo />
  <Link
    to="/"
    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
  >
    <Home className="h-4 w-4" />
    Return to Home
  </Link>
</div><div className="flex items-center gap-3 text-sm"><div className="flex items-center gap-3 text-sm">
  <span className="hidden text-white/50 sm:inline">{email}</span>

  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
    <UserRound className="h-4 w-4"/>
  </span>

  <button
    type="button"
    onClick={async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert("Unable to log out: " + error.message);
        return;
      }

      setEmail("");
      setPassword("");
      setEntry("");
      setAuthError("");
      setIsPasswordRecovery(false);
    }}
    className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
  >
    Logout
  </button>
</div><span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary"><UserRound className="h-4 w-4"/></span></div></header><main className="mx-auto max-w-[1280px] px-5 py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Agent workspace</p><h1 className="font-display text-4xl text-primary">Your week at KALA.</h1></div><button onClick={share} className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${live?"bg-green-100 text-green-700":"bg-primary text-white"}`}><MapPin className="h-4 w-4"/>{live?"Live location on":"Share My Location"}</button></div><p className="mt-2 text-xs text-muted-foreground">{locationState}. Browser tracking may pause when this page is closed or suspended.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Total Orders",orders.length,Package],["Total Income",`₦${weekly.toLocaleString()}`,CircleDollarSign],["Weekly Orders",completed.length,CalendarDays],["Weekly Income",`₦${weekly.toLocaleString()}`,Star]].map(([label,value,Icon]:any)=><div key={label} className="rounded-[24px] border border-border bg-white p-6"><Icon className="h-5 w-5 text-accent"/><p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl text-primary">{value}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><section className="rounded-[28px] border border-border bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-display text-2xl text-primary">Assigned orders</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs">{orders.length} total</span></div><div className="mt-5 space-y-3">{orders.map(o=><div key={o.id} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex gap-2"><b className="font-mono text-xs text-accent">{o.reference_number}</b><span className="text-xs text-muted-foreground">{statusLabel[o.status]||o.status}</span></div><h3 className="mt-2 font-semibold">{o.services?.name||"Service order"}</h3><p className="mt-1 text-xs text-muted-foreground">{o.client_name} · {o.lga}, {o.state} · ₦{Number(o.agent_payment||0).toLocaleString()}</p></div><div className="flex gap-2"><button
  onClick={() => setChatOrder(o)}
  className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
  title="Open chat"
>
  <MessageCircle className="h-4 w-4"/>
</button>{o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
  <button
    onClick={async () => {
      const nextStatus =
        o.status === "ASSIGNED"
          ? "ACCEPTED"
          : o.status === "ACCEPTED"
            ? "IN_PROGRESS"
            : o.status === "IN_PROGRESS"
              ? "COMPLETED"
              : o.status === "AWAITING_CLIENT"
                ? "COMPLETED"
                : null;

      if (!nextStatus) return;

      try {
        await agentOperationsApi.updateStatus(o.id, email, nextStatus);

        const r = await agentOperationsApi.getOrders(email);
        setOrders(r.orders || []);
      } catch (error: any) {
        alert(error?.message || "Unable to update order status");
      }
    }}
    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
  >
    {o.status === "ASSIGNED"
      ? "Accept Order"
      : o.status === "ACCEPTED"
        ? "Start Order"
        : o.status === "IN_PROGRESS"
          ? "Complete Order"
          : o.status === "AWAITING_CLIENT"
            ? "Complete Order"
            : "Update status"}
  </button>
)}</div></div>)}{!orders.length&&<div className="py-14 text-center"><Package className="mx-auto h-10 w-10 text-border"/><p className="mt-4 text-sm text-muted-foreground">No assigned orders yet.</p></div>}</div></section><aside className="rounded-[28px] bg-primary p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">Current week</p><p className="mt-6 font-display text-5xl">{completed.length}</p><p className="text-sm text-white/45">Orders completed</p><div className="my-6 h-px bg-white/10"/><p className="text-sm text-white/45">Income</p><p className="mt-1 font-display text-3xl text-accent">₦{weekly.toLocaleString()}</p><div className="mt-8 rounded-2xl bg-white/5 p-4 text-sm"><div className="flex justify-between"><span className="text-white/45">Payment status</span><b>Pending</b></div><div className="mt-3 flex justify-between"><span className="text-white/45">Next payment</span><b>Friday</b></div></div></aside></div>{chatOrder && (
  <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-4 sm:items-end">
    <div className="flex h-[520px] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-accent">
            Order Chat
          </p>
          <p className="mt-1 font-semibold">
            {chatOrder.reference_number}
          </p>
        </div>

        <button
          onClick={() => setChatOrder(null)}
          className="rounded-full px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white"
          title="Close chat"
        >
          ✕
        </button>
      </div>

      
<div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 p-4">
  {chatLoading && (
    <p className="py-4 text-center text-sm text-gray-500">
      Loading messages...
    </p>
  )}

  {chatError && (
    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
      {chatError}
    </p>
  )}

  {!chatLoading && !chatError && chatMessages.length === 0 && (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <MessageCircle className="h-10 w-10 text-accent" />
      <p className="mt-4 font-semibold text-primary">
        No messages yet
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Messages about this order will appear here.
      </p>
    </div>
  )}

  {chatMessages.map((message) => {
    const isAgent = message.sender_type === "agent";

    return (
      <div
        key={message.id}
        className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
            isAgent
              ? "rounded-br-sm bg-primary text-white"
              : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
          }`}
        >
          <p className="mb-1 text-[10px] font-bold uppercase opacity-70">
            {isAgent ? "You" : message.sender_type}
          </p>

          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>

          <p className="mt-2 text-right text-[10px] opacity-60">
            {message.created_at
              ? new Date(message.created_at).toLocaleString()
              : ""}
          </p>
        </div>
      </div>
    );
  })}
</div>


      <div className="border-t border-border bg-white p-4">
  <div className="flex gap-2">
    <input
      value={chatMessage}
      onChange={(e) => setChatMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendChatMessage();
        }
      }}
      placeholder="Type a message..."
      disabled={chatSending}
      className="flex-1 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
    />

    <button
      onClick={handleSendChatMessage}
      disabled={chatSending || !chatMessage.trim()}
      className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {chatSending ? "..." : "Send"}
    </button>
  </div>
</div>
    </div>
  </div>
)}

</main></div>;
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
