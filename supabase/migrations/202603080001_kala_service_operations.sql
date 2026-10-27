-- KALA service-booking and operations architecture
-- Run in the Supabase SQL editor, then redeploy make-server-73b64ebc.
begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.order_status as enum (
    'PENDING','REVIEWING','ASSIGNED','ACCEPTED','IN_PROGRESS',
    'AWAITING_CLIENT','COMPLETED','CONFIRMED','PAID','CANCELLED'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin','super_admin')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_permissions (
  admin_id uuid not null references public.admins(id) on delete cascade,
  permission text not null check (permission in (
    'manage_clients','manage_orders','manage_agents','assign_agents',
    'manage_services','view_live_map','manage_payments','manage_complaints',
    'manage_admins','manage_blacklist','view_reports','manage_settings'
  )),
  created_at timestamptz not null default now(),
  primary key (admin_id, permission)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text not null,
  location text,
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists clients_email_lower_idx on public.clients (lower(email));
create index if not exists clients_phone_idx on public.clients (phone);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'sparkles',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.services (name, slug, description, icon, sort_order)
values
  ('Tour Guide','tour-guide','Explore new places with a trusted local guide.','tour',10),
  ('House Cleaning','house-cleaning','Careful, reliable cleaning for your space.','home',20),
  ('Pick Up & Delivery','pick-up-delivery','Door-to-door movement for packages and items.','truck',30),
  ('Grocery Shopping','grocery-shopping','Fresh groceries sourced and delivered to you.','basket',40),
  ('Market Runs','market-runs','A trusted hand in the market, without the stress.','store',50),
  ('Personal & Other Errands','personal-errands','Flexible help for the things on your list.','sparkles',60)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- Extend the existing agent table without replacing existing KALA data.
alter table public.agents add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.agents add column if not exists owner_name text;
alter table public.agents add column if not exists phone text;
alter table public.agents add column if not exists nin_hash text;
alter table public.agents add column if not exists profile_photo_url text;
alter table public.agents add column if not exists current_lat double precision;
alter table public.agents add column if not exists current_lng double precision;
alter table public.agents add column if not exists current_lga text;
alter table public.agents add column if not exists availability_status text not null default 'offline';
alter table public.agents add column if not exists live_tracking_enabled boolean not null default false;
alter table public.agents add column if not exists location_updated_at timestamptz;
alter table public.agents add column if not exists rating numeric(3,2) not null default 5.00;
alter table public.agents add column if not exists active_order_count integer not null default 0;
alter table public.agents add column if not exists blacklist_status boolean not null default false;
alter table public.agents add column if not exists deactivated_at timestamptz;
create unique index if not exists agents_nin_hash_idx on public.agents(nin_hash) where nin_hash is not null;

create table if not exists public.agent_services (
  agent_id uuid not null references public.agents(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agent_id, service_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  assigned_admin_id uuid references public.admins(id) on delete set null,
  service_description text not null,
  service_data jsonb not null default '{}'::jsonb,
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  pickup_address text,
  destination_address text,
  latitude double precision,
  longitude double precision,
  lga text,
  state text,
  preferred_date date,
  preferred_time time,
  flexible_schedule boolean not null default false,
  special_instructions text,
  quoted_price numeric(14,2),
  agent_payment numeric(14,2),
  payment_status text not null default 'UNPAID',
  payment_reference text,
  payment_date timestamptz,
  status public.order_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists orders_agent_idx on public.orders(assigned_agent_id, status);
create index if not exists orders_client_idx on public.orders(client_id, created_at desc);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by_type text not null check (changed_by_type in ('client','agent','admin','system')),
  changed_by_id uuid,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists order_history_order_idx on public.order_status_history(order_id, created_at);

create table if not exists public.agent_locations (
  id bigint generated always as identity primary key,
  agent_id uuid not null references public.agents(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  lga text,
  tracking_enabled boolean not null default true,
  recorded_at timestamptz not null default now()
);
create index if not exists agent_locations_latest_idx on public.agent_locations(agent_id, recorded_at desc);

create table if not exists public.agent_earnings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  earned_at timestamptz not null default now()
);

create table if not exists public.agent_payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  period_start date not null,
  period_end date not null,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_blacklist (
  id uuid primary key default gen_random_uuid(),
  nin_hash text not null unique,
  nin_last_four text,
  reason text not null,
  agent_id uuid references public.agents(id) on delete set null,
  blacklisted_by uuid references public.admins(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'order' check (type in ('order','support','complaint')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  participant_type text not null check (participant_type in ('client','agent','admin')),
  participant_id uuid not null,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, participant_type, participant_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('client','agent','admin','system')),
  sender_id uuid,
  body text,
  message_type text not null default 'text' check (message_type in ('text','image','file','approval','system')),
  delivery_status text not null default 'sent' check (delivery_status in ('sending','sent','delivered','read','failed')),
  whatsapp_message_id text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  assigned_admin_id uuid references public.admins(id) on delete set null,
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved','closed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('client','agent','admin')),
  recipient_id uuid not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references public.admins(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Prevent a blacklisted identity from being inserted or reactivated.
create or replace function public.reject_blacklisted_agent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.nin_hash is not null and exists (
    select 1 from public.agent_blacklist b where b.nin_hash = new.nin_hash
  ) then
    raise exception 'This identity is permanently ineligible for agent registration';
  end if;
  return new;
end $$;
drop trigger if exists agents_reject_blacklist on public.agents;
create trigger agents_reject_blacklist
before insert or update of nin_hash on public.agents
for each row execute function public.reject_blacklisted_agent();

-- Client-side code never receives service-role access. These RLS rules are a
-- conservative base; privileged mutations continue through the Edge Function.
alter table public.admins enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.agent_services enable row level security;
alter table public.agent_locations enable row level security;
alter table public.agent_earnings enable row level security;
alter table public.agent_payments enable row level security;
alter table public.agent_blacklist enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services" on public.services for select
using (active = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

commit;
