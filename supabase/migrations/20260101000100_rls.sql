-- Row level security. Service role bypasses RLS: all message/payment writes
-- and cron work happen server-side with the service key.

-- ---------- helper predicates (security definer, no recursion) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.is_org_manager(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships
    where org_id = p_org and user_id = auth.uid() and role in ('owner', 'manager')
  );
$$;

create or replace function public.can_manage_event(p_event uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event
      and (e.owner_id = auth.uid()
           or (e.org_id is not null and public.is_org_member(e.org_id))
           or public.is_admin())
  );
$$;

create or replace function public.is_event_staff(p_event uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.event_staff where event_id = p_event and user_id = auth.uid());
$$;

alter table public.profiles           enable row level security;
alter table public.organizations      enable row level security;
alter table public.memberships        enable row level security;
alter table public.clients            enable row level security;
alter table public.templates          enable row level security;
alter table public.events             enable row level security;
alter table public.event_staff        enable row level security;
alter table public.guests             enable row level security;
alter table public.messages           enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.orders             enable row level security;
alter table public.payments           enable row level security;
alter table public.data_requests      enable row level security;
alter table public.audit_log          enable row level security;

-- profiles
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- organizations
create policy orgs_select on public.organizations for select
  using (public.is_org_member(id) or public.is_admin());
create policy orgs_insert on public.organizations for insert
  with check (created_by = auth.uid());
create policy orgs_update on public.organizations for update
  using (public.is_org_manager(id) or public.is_admin());
create policy orgs_delete on public.organizations for delete
  using (created_by = auth.uid() or public.is_admin());

-- memberships: members see their org's roster; managers manage it.
-- Creating an org also needs its first (owner) membership, so allow a creator to add themselves.
create policy memberships_select on public.memberships for select
  using (user_id = auth.uid() or public.is_org_member(org_id) or public.is_admin());
create policy memberships_insert on public.memberships for insert
  with check (
    public.is_org_manager(org_id) or public.is_admin()
    or (user_id = auth.uid() and role = 'owner'
        and exists (select 1 from public.organizations o where o.id = org_id and o.created_by = auth.uid()))
  );
create policy memberships_update on public.memberships for update
  using (public.is_org_manager(org_id) or public.is_admin());
create policy memberships_delete on public.memberships for delete
  using (public.is_org_manager(org_id) or user_id = auth.uid() or public.is_admin());

-- clients
create policy clients_all on public.clients for all
  using (public.is_org_member(org_id) or public.is_admin())
  with check (public.is_org_member(org_id) or public.is_admin());

-- templates: anyone signed in or not may read published templates (gallery is public)
create policy templates_select on public.templates for select
  using (is_published or public.is_admin());
create policy templates_admin_write on public.templates for all
  using (public.is_admin()) with check (public.is_admin());

-- events
create policy events_select on public.events for select
  using (public.can_manage_event(id) or public.is_event_staff(id));
create policy events_insert on public.events for insert
  with check (
    owner_id = auth.uid()
    and (org_id is null or public.is_org_member(org_id))
  );
create policy events_update on public.events for update
  using (public.can_manage_event(id))
  with check (public.can_manage_event(id) and (org_id is null or public.is_org_member(org_id) or public.is_admin()));
create policy events_delete on public.events for delete
  using (public.can_manage_event(id));

-- event staff
create policy event_staff_select on public.event_staff for select
  using (user_id = auth.uid() or public.can_manage_event(event_id));
create policy event_staff_write on public.event_staff for all
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

-- guests: managers full control, door staff read-only
create policy guests_select on public.guests for select
  using (public.can_manage_event(event_id) or public.is_event_staff(event_id));
create policy guests_write on public.guests for all
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

-- messaging + billing: read-only to clients (writes via service role)
create policy messages_select on public.messages for select using (public.can_manage_event(event_id));
create policy scheduled_select on public.scheduled_messages for select using (public.can_manage_event(event_id));
create policy orders_select on public.orders for select using (public.can_manage_event(event_id));
create policy orders_insert on public.orders for insert
  with check (public.can_manage_event(event_id) and status = 'pending');
create policy payments_select on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and public.can_manage_event(o.event_id)));

-- compliance
create policy requests_select on public.data_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy requests_insert on public.data_requests for insert
  with check (user_id = auth.uid() and state = 'open');
create policy audit_select on public.audit_log for select using (public.is_admin());

-- ---------- stats ----------
-- security_invoker: the caller's RLS applies to the underlying tables.
create view public.event_stats with (security_invoker = true) as
select
  e.id as event_id,
  count(g.id)                                                         as total,
  count(g.sent_at)                                                    as sent,
  count(g.delivered_at)                                               as delivered,
  count(*) filter (where g.status = 'confirmed')                      as confirmed,
  count(*) filter (where g.status = 'declined')                       as declined,
  count(*) filter (where g.status in ('pending', 'sent', 'delivered')) as pending,
  count(*) filter (where g.checked_in_at is not null)                 as attended
from public.events e
left join public.guests g on g.event_id = e.id
group by e.id;

-- ---------- door check-in ----------
-- Called by the check-in API after it has verified the QR signature.
-- Atomic: only one concurrent scan can flip checked_in_at.
create or replace function public.check_in_guest(p_event uuid, p_guest uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  g public.guests;
  stats record;
begin
  if auth.uid() is null
     or not (public.is_event_staff(p_event) or public.can_manage_event(p_event)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update public.guests
     set checked_in_at = now(), checked_in_by = auth.uid()
   where id = p_guest and event_id = p_event
     and status = 'confirmed' and checked_in_at is null
   returning * into g;

  if found then
    select count(*) filter (where checked_in_at is not null) as attended,
           count(*) filter (where status = 'confirmed') as confirmed
      into stats from public.guests where event_id = p_event;
    return jsonb_build_object('result', 'valid', 'name', g.name, 'party_size', g.party_size,
                              'at', g.checked_in_at, 'attended', stats.attended, 'confirmed', stats.confirmed);
  end if;

  select * into g from public.guests where id = p_guest and event_id = p_event;
  select count(*) filter (where checked_in_at is not null) as attended,
         count(*) filter (where status = 'confirmed') as confirmed
    into stats from public.guests where event_id = p_event;

  if g.id is not null and g.checked_in_at is not null then
    return jsonb_build_object('result', 'already_used', 'name', g.name, 'party_size', g.party_size,
                              'at', g.checked_in_at, 'attended', stats.attended, 'confirmed', stats.confirmed);
  end if;
  return jsonb_build_object('result', 'invalid', 'attended', stats.attended, 'confirmed', stats.confirmed);
end $$;

revoke all on function public.check_in_guest(uuid, uuid) from public, anon;
grant execute on function public.check_in_guest(uuid, uuid) to authenticated;

-- ---------- PDPL helpers ----------
-- Erase one guest's personal data but keep aggregate counts.
create or replace function public.erase_guest(p_guest uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare ev uuid;
begin
  select event_id into ev from public.guests where id = p_guest;
  if ev is null or not public.can_manage_event(ev) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.messages where guest_id = p_guest;
  delete from public.guests where id = p_guest;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'guest.erase', 'guest', p_guest::text);
end $$;
revoke all on function public.erase_guest(uuid) from public, anon;
grant execute on function public.erase_guest(uuid) to authenticated;
