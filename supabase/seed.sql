-- Local demo data. Run via `supabase db reset`.
-- Demo logins (OTP): see supabase/config.toml [auth.sms.test_otp] (code 123456);
-- email codes arrive in Inbucket at http://127.0.0.1:54324.

-- ---------- users ----------
insert into auth.users (
  instance_id, id, aud, role, email, phone, email_confirmed_at, phone_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, u.phone, now(), now(),
  '{"provider":"email","providers":["email","phone"]}'::jsonb,
  jsonb_build_object('full_name', u.name, 'role', u.meta_role),
  now(), now(), '', '', '', '', '', '', '', ''
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@dawati.test',   '966500000001', 'Layla Admin',   'host'),
  ('00000000-0000-0000-0000-0000000000b1'::uuid, 'host@dawati.test',    '966500000002', 'Mohammed Host', 'host'),
  ('00000000-0000-0000-0000-0000000000c1'::uuid, 'planner@dawati.test', '966500000003', 'Noura Planner', 'planner'),
  ('00000000-0000-0000-0000-0000000000d1'::uuid, 'staff@dawati.test',   '966500000004', 'Faisal Staff',  'host')
) as u (id, email, phone, name, meta_role);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', email, now(), now(), now()
from auth.users where email like '%@dawati.test';

-- Elevated roles can only be assigned here / by an admin (see protect_profile_role).
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'staff' where id = '00000000-0000-0000-0000-0000000000d1';

-- ---------- templates ----------
insert into public.templates (slug, occasion, style, kind, tier, name_i18n, description_i18n, spec, music_url) values
 ('royal-navy-gold', 'wedding', 'classic', 'animated', 'premium',
   '{"ar":"كحلي وذهبي ملكي","en":"Royal Navy & Gold"}', '{"ar":"بطاقة زفاف فاخرة بحركة هادئة وموسيقى","en":"A luxurious animated wedding card with soft music"}',
   '{"palette":{"bg":"#14213d","ink":"#fbf7ef","accent":"#d9b061","frame":"#d9b061"}}', '/audio/oud-soft.mp3'),
 ('ivory-najdi', 'wedding', 'najdi', 'static', 'standard',
   '{"ar":"نجدي عاجي","en":"Ivory Najdi"}', '{"ar":"زخارف نجدية على خلفية عاجية","en":"Najdi motifs on warm ivory"}',
   '{"palette":{"bg":"#f6ecd9","ink":"#2a1f17","accent":"#9a4a45","frame":"#b8893b"}}', null),
 ('blush-engagement', 'engagement', 'floral', 'static', 'standard',
   '{"ar":"خطوبة وردية","en":"Blush Engagement"}', '{"ar":"ورود ناعمة لحفل خطوبة","en":"Soft florals for an engagement"}',
   '{"palette":{"bg":"#f3dcd6","ink":"#4a1f1c","accent":"#9a4a45","frame":"#9a4a45"}}', null),
 ('golden-ring', 'engagement', 'modern', 'video', 'premium',
   '{"ar":"الخاتم الذهبي","en":"Golden Ring"}', '{"ar":"دعوة فيديو قصيرة مع موسيقى","en":"A short video invite with music"}',
   '{"palette":{"bg":"#241a14","ink":"#f2e9d8","accent":"#d9b061","frame":"#5b4a3c"}}', '/audio/oud-soft.mp3'),
 ('garden-sage', 'birthday', 'floral', 'static', 'standard',
   '{"ar":"حديقة المريمية","en":"Garden Sage"}', '{"ar":"ألوان هادئة ونباتات","en":"Calm greens and botanicals"}',
   '{"palette":{"bg":"#e6ece3","ink":"#25392b","accent":"#4f6b57","frame":"#4f6b57"}}', null),
 ('confetti-night', 'birthday', 'modern', 'animated', 'premium',
   '{"ar":"ليلة الكونفيتي","en":"Confetti Night"}', '{"ar":"بطاقة متحركة مرحة","en":"A playful animated card"}',
   '{"palette":{"bg":"#14213d","ink":"#fbf7ef","accent":"#d9b061","frame":"#243659"}}', '/audio/upbeat.mp3'),
 ('midnight-dinner', 'dinner', 'modern', 'static', 'standard',
   '{"ar":"عشاء منتصف الليل","en":"Midnight Dinner"}', '{"ar":"أنيقة وداكنة لعشاء خاص","en":"Dark and refined for an intimate dinner"}',
   '{"palette":{"bg":"#241a14","ink":"#f2e9d8","accent":"#d9b061","frame":"#5b4a3c"}}', null),
 ('sand-table', 'dinner', 'classic', 'static', 'standard',
   '{"ar":"مائدة الرمال","en":"Sand Table"}', '{"ar":"ألوان دافئة ترحب بضيوفك","en":"Warm tones that welcome guests"}',
   '{"palette":{"bg":"#f2e9d8","ink":"#2a1f17","accent":"#7d5a17","frame":"#b8893b"}}', null),
 ('rose-celebration', 'party', 'modern', 'video', 'premium',
   '{"ar":"احتفال وردي","en":"Rose Celebration"}', '{"ar":"دعوة فيديو حيوية","en":"A lively video invitation"}',
   '{"palette":{"bg":"#f3dcd6","ink":"#4a1f1c","accent":"#9a4a45","frame":"#9a4a45"}}', '/audio/upbeat.mp3'),
 ('gold-sparkle', 'party', 'classic', 'static', 'standard',
   '{"ar":"لمعة ذهبية","en":"Gold Sparkle"}', '{"ar":"بطاقة احتفالية لامعة","en":"A glittering celebration card"}',
   '{"palette":{"bg":"#fbf7ef","ink":"#14213d","accent":"#b8893b","frame":"#b8893b"}}', null);

-- ---------- planner organisation ----------
insert into public.organizations (id, name, created_by)
values ('00000000-0000-0000-0000-00000000f001', 'Noura Events', '00000000-0000-0000-0000-0000000000c1');
insert into public.memberships (org_id, user_id, role)
values ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000c1', 'owner');
insert into public.clients (id, org_id, name, contact) values
 ('00000000-0000-0000-0000-00000000c101', '00000000-0000-0000-0000-00000000f001', 'Al-Harbi Family', '+966500000100'),
 ('00000000-0000-0000-0000-00000000c102', '00000000-0000-0000-0000-00000000f001', 'Bakr & Partners', '+966500000101');

-- ---------- events ----------
insert into public.events (id, owner_id, org_id, client_id, title, occasion, starts_at, venue, city, template_id, customization, language, status, consent_attested_at, purge_after)
values
 ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-0000000000b1', null, null,
  'Mohammed & Noura Wedding', 'wedding', now() + interval '10 days', 'Al Nakheel Hall, Riyadh', 'riyadh',
  (select id from public.templates where slug = 'royal-navy-gold'),
  '{"host":"Mohammed & Noura"}', 'ar', 'live', now() - interval '3 days', now() + interval '100 days'),
 ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000c101',
  'Al-Harbi Engagement', 'engagement', now() + interval '2 days', 'Corniche Pavilion, Jeddah', 'jeddah',
  (select id from public.templates where slug = 'blush-engagement'),
  '{"host":"Al-Harbi Family"}', 'both', 'live', now() - interval '5 days', now() + interval '90 days'),
 ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-0000000000b1', null, null,
  'Sara''s Birthday Dinner', 'birthday', now() + interval '30 days', 'Diriyah Terrace, Riyadh', 'riyadh',
  (select id from public.templates where slug = 'garden-sage'),
  '{}', 'en', 'draft', null, null);

insert into public.event_staff (event_id, user_id) values
 ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-0000000000d1'),
 ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000000d1');

-- ---------- guests (60 for e001, 25 for e002) ----------
with names (n) as (
  select unnest(array['Abdullah','Fahad','Saud','Khalid','Turki','Majed','Nasser','Sultan','Rakan','Bandar',
                      'Reem','Hessa','Maha','Dana','Lama','Joud','Shahad','Abeer','Sarah','Ghada'])
)
insert into public.guests (event_id, name, phone_e164, party_size, status, sent_at, delivered_at, responded_at, consent_source)
select
  '00000000-0000-0000-0000-00000000e001',
  (select n from names offset (i % 20) limit 1) || ' ' || (array['Al-Otaibi','Al-Qahtani','Al-Ghamdi','Al-Shehri','Al-Dosari'])[1 + i % 5],
  '+96655' || lpad((1000000 + i)::text, 7, '0'),
  1 + (i % 4),
  case when i % 10 < 5 then 'confirmed' when i % 10 < 6 then 'declined' when i % 10 < 8 then 'delivered' when i % 10 < 9 then 'sent' else 'pending' end::public.guest_status,
  case when i % 10 < 9 then now() - interval '2 days' end,
  case when i % 10 < 8 then now() - interval '2 days' end,
  case when i % 10 < 6 then now() - interval '1 day' end,
  'host_attested'
from generate_series(1, 60) as i;

with names (n) as (
  select unnest(array['Yousef','Ahmed','Omar','Ali','Hani','Mazen','Ziyad','Wael','Layan','Noor','Rahaf','Salma','Tala','Yara','Mona'])
)
insert into public.guests (event_id, name, phone_e164, party_size, status, sent_at, delivered_at, responded_at, checked_in_at, checked_in_by, consent_source)
select
  '00000000-0000-0000-0000-00000000e002',
  (select n from names offset (i % 15) limit 1) || ' Al-Harbi',
  '+96656' || lpad((2000000 + i)::text, 7, '0'),
  1 + (i % 3),
  case when i % 5 < 3 then 'confirmed' when i % 5 = 3 then 'declined' else 'delivered' end::public.guest_status,
  now() - interval '4 days', now() - interval '4 days',
  case when i % 5 < 4 then now() - interval '3 days' end,
  case when i % 5 = 0 then now() - interval '1 hour' end,
  case when i % 5 = 0 then '00000000-0000-0000-0000-0000000000d1'::uuid end,
  'host_attested'
from generate_series(1, 25) as i;

-- ---------- orders ----------
insert into public.orders (event_id, tier, guest_count, base_sar, guests_sar, vat_sar, total_sar, status) values
 ('00000000-0000-0000-0000-00000000e001', 'premium',  60, 200, 120, 48,   368, 'paid'),
 ('00000000-0000-0000-0000-00000000e002', 'standard', 25, 150,  50, 30,   230, 'paid');
insert into public.payments (order_id, provider, provider_ref, amount_sar, status)
select id, 'mock', 'seed-' || id::text, total_sar, 'paid' from public.orders;

-- ---------- reminder schedule + message log ----------
insert into public.scheduled_messages (event_id, guest_id, kind, run_at)
select g.event_id, g.id, k.kind, e.starts_at - k.lead
from public.guests g
join public.events e on e.id = g.event_id
cross join (values ('reminder_7d'::public.message_kind, interval '7 days'), ('reminder_1d', interval '1 day')) as k (kind, lead)
where g.status in ('confirmed', 'delivered', 'sent', 'pending');

insert into public.messages (event_id, guest_id, kind, status, provider_message_id, direction)
select event_id, id, 'invite', 'delivered', 'seed-' || id::text, 'outbound'
from public.guests where sent_at is not null;
