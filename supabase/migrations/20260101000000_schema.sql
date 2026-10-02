-- Dawati schema. All tables have RLS enabled (see 20260101000100_rls.sql).
create extension if not exists pgcrypto;

-- ---------- enums ----------
create type public.user_role      as enum ('host', 'planner', 'staff', 'admin');
create type public.org_role       as enum ('owner', 'manager', 'member');
create type public.occasion       as enum ('wedding', 'engagement', 'birthday', 'dinner', 'party');
create type public.template_kind  as enum ('static', 'animated', 'video');
create type public.template_tier  as enum ('standard', 'premium');
create type public.event_status   as enum ('draft', 'paid', 'sending', 'live', 'done', 'cancelled');
create type public.event_city     as enum ('riyadh', 'jeddah');
create type public.guest_status   as enum ('pending', 'sent', 'delivered', 'confirmed', 'declined', 'failed', 'opted_out');
create type public.consent_source as enum ('host_attested', 'guest_opt_in');
create type public.message_kind   as enum ('invite', 'reminder_7d', 'reminder_1d', 'ticket', 'reply');
create type public.message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed', 'received');
create type public.message_dir    as enum ('outbound', 'inbound');
create type public.order_status   as enum ('pending', 'paid', 'failed', 'refunded');
create type public.request_type   as enum ('export', 'delete');
create type public.request_state  as enum ('open', 'done', 'rejected');

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- identity ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  email      text,
  locale     text not null default 'ar' check (locale in ('ar', 'en')),
  role       public.user_role not null default 'host',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever an auth user is created. Self-service roles are
-- limited to host/planner: staff are assigned per event, admins by hand.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, phone, email, locale, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone,
    new.email,
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end,
    case when requested = 'planner' then 'planner'::public.user_role else 'host'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users must not be able to promote themselves. Service role / SQL console
-- (auth.uid() is null) and admins may change roles.
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'role can only be changed by an admin' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- Planner sub-accounts: the planner's own customers.
create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  name       text not null,
  contact    text,
  created_at timestamptz not null default now()
);
create index clients_org_idx on public.clients (org_id);

-- ---------- catalogue ----------
create table public.templates (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  occasion         public.occasion not null,
  style            text not null,
  kind             public.template_kind not null default 'static',
  tier             public.template_tier not null default 'standard',
  name_i18n        jsonb not null,
  description_i18n jsonb not null default '{}'::jsonb,
  spec             jsonb not null,
  video_url        text,
  music_url        text,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- animated and video templates are the premium tier
  constraint templates_tier_matches_kind check ((kind = 'static') = (tier = 'standard'))
);
create trigger templates_updated before update on public.templates
  for each row execute function public.set_updated_at();

-- ---------- events ----------
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id),
  org_id        uuid references public.organizations (id) on delete set null,
  client_id     uuid references public.clients (id) on delete set null,
  title         text not null,
  occasion      public.occasion not null,
  starts_at     timestamptz not null,
  venue         text not null,
  city          public.event_city not null,
  maps_url      text,
  template_id   uuid references public.templates (id),
  customization jsonb not null default '{}'::jsonb,
  language      text not null default 'ar' check (language in ('ar', 'en', 'both')),
  status        public.event_status not null default 'draft',
  consent_attested_at timestamptz,   -- host confirmed permission to contact guests (PDPL)
  purge_after   timestamptz,         -- guest data is deleted after this date
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_client_needs_org check (client_id is null or org_id is not null)
);
create index events_owner_idx on public.events (owner_id);
create index events_org_idx on public.events (org_id);
create index events_starts_idx on public.events (starts_at);
create trigger events_updated before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_staff (
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_staff_user_idx on public.event_staff (user_id);

-- ---------- guests ----------
create table public.guests (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events (id) on delete cascade,
  name             text not null,
  phone_e164       text not null check (phone_e164 ~ '^\+9665[0-9]{8}$'),
  party_size       smallint not null default 1 check (party_size between 1 and 20),
  status           public.guest_status not null default 'pending',
  sent_at          timestamptz,
  delivered_at     timestamptz,
  responded_at     timestamptz,
  checked_in_at    timestamptz,
  checked_in_by    uuid references public.profiles (id),
  consent_source   public.consent_source not null default 'host_attested',
  consent_at       timestamptz not null default now(),
  opted_out_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (event_id, phone_e164)
);
create index guests_event_status_idx on public.guests (event_id, status);
create trigger guests_updated before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------- messaging ----------
create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  guest_id            uuid not null references public.guests (id) on delete cascade,
  direction           public.message_dir not null default 'outbound',
  kind                public.message_kind not null,
  provider_message_id text,
  status              public.message_status not null default 'queued',
  body                text,
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index messages_guest_idx on public.messages (guest_id);
create index messages_event_idx on public.messages (event_id, created_at);
create unique index messages_provider_idx on public.messages (provider_message_id) where provider_message_id is not null;
create trigger messages_updated before update on public.messages
  for each row execute function public.set_updated_at();

-- One row per (guest, kind): makes cron sending idempotent.
create table public.scheduled_messages (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  guest_id   uuid not null references public.guests (id) on delete cascade,
  kind       public.message_kind not null check (kind in ('invite', 'reminder_7d', 'reminder_1d')),
  run_at     timestamptz not null,
  state      text not null default 'pending' check (state in ('pending', 'sent', 'skipped', 'failed')),
  processed_at timestamptz,
  unique (guest_id, kind)
);
create index scheduled_due_idx on public.scheduled_messages (run_at) where state = 'pending';

-- ---------- billing ----------
create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  tier         public.template_tier not null,
  guest_count  integer not null check (guest_count > 0),
  base_sar     numeric(10, 2) not null,
  guests_sar   numeric(10, 2) not null,
  vat_sar      numeric(10, 2) not null,
  total_sar    numeric(10, 2) not null,
  status       public.order_status not null default 'pending',
  created_at   timestamptz not null default now()
);
create index orders_event_idx on public.orders (event_id);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  provider     text not null,
  provider_ref text,
  amount_sar   numeric(10, 2) not null,
  status       public.order_status not null,
  created_at   timestamptz not null default now()
);

-- ---------- compliance ----------
create table public.data_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  event_id    uuid references public.events (id) on delete set null,
  type        public.request_type not null,
  state       public.request_state not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,
  entity     text,
  entity_id  text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
