-- WashFlow initial multi-tenant database schema.
-- Apply only to a new WashFlow Supabase project; review policies before production launch.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  country text not null check (char_length(country) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  role text not null check (role in ('owner','manager','cashier','attendant')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- Platform admins are assigned manually by the platform owner using the SQL editor.
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid,
  plate text,
  make text,
  model text,
  color text,
  vehicle_type text,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, customer_id) references public.customers(business_id, id) on delete cascade
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  price numeric(12,3) not null check (price >= 0),
  currency char(3) not null default 'OMR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name),
  unique (business_id, id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null,
  plan_name text not null,
  membership_type text not null default 'prepaid' check (membership_type in ('prepaid','vip_monthly','unlimited','corporate')),
  status text not null default 'active' check (status in ('active','expired','cancelled','suspended')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  remaining_washes integer check (remaining_washes is null or remaining_washes >= 0),
  qr_token_hash text unique,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, customer_id) references public.customers(business_id, id) on delete cascade
);

create table public.wash_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid,
  vehicle_id uuid,
  service_id uuid,
  service_name text not null,
  amount numeric(12,3) not null check (amount >= 0),
  currency char(3) not null default 'OMR',
  payment_method text not null check (payment_method in ('cash','card','bank_transfer','online','membership','other')),
  status text not null default 'completed' check (status in ('completed','refunded','voided')),
  staff_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, customer_id) references public.customers(business_id, id) on delete restrict,
  foreign key (business_id, vehicle_id) references public.vehicles(business_id, id) on delete restrict,
  foreign key (business_id, service_id) references public.services(business_id, id) on delete restrict
);

create table public.membership_redemptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  membership_id uuid not null,
  transaction_id uuid,
  staff_user_id uuid references auth.users(id),
  idempotency_key uuid not null,
  redeemed_at timestamptz not null default now(),
  unique (business_id, idempotency_key),
  foreign key (business_id, membership_id) references public.memberships(business_id, id) on delete restrict,
  foreign key (business_id, transaction_id) references public.wash_transactions(business_id, id) on delete restrict
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index business_members_user_idx on public.business_members(user_id);
create index customers_business_created_idx on public.customers(business_id, created_at desc);
create index vehicles_business_idx on public.vehicles(business_id);
create index services_business_active_idx on public.services(business_id, is_active);
create index memberships_business_status_idx on public.memberships(business_id, status);
create index transactions_business_created_idx on public.wash_transactions(business_id, created_at desc);
create index redemptions_business_redeemed_idx on public.membership_redemptions(business_id, redeemed_at desc);
create index audit_logs_business_created_idx on public.audit_logs(business_id, created_at desc);

-- These narrowly scoped SECURITY DEFINER helpers live in a non-exposed schema.
-- They always bind checks to auth.uid(); callers cannot supply another user identity.
create or replace function private.is_business_member(target_business_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.business_members bm
    where bm.business_id = target_business_id and bm.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
      and bm.role = any(allowed_roles)
  );
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_business_member(uuid) from public, anon;
revoke all on function private.has_business_role(uuid, text[]) from public, anon;
revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_business_member(uuid) to authenticated;
grant execute on function private.has_business_role(uuid, text[]) to authenticated;
grant execute on function private.is_platform_admin() to authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.services enable row level security;
alter table public.memberships enable row level security;
alter table public.wash_transactions enable row level security;
alter table public.membership_redemptions enable row level security;
alter table public.audit_logs enable row level security;

create policy "business members can read their business" on public.businesses
  for select to authenticated
  using (private.is_business_member(id) or private.is_platform_admin());
create policy "owners and managers can update business profile" on public.businesses
  for update to authenticated
  using (private.has_business_role(id, array['owner','manager']))
  with check (private.has_business_role(id, array['owner','manager']));

create policy "users can read their own business memberships" on public.business_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_admin());
create policy "users can read their own platform admin row" on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "tenant customer access" on public.customers
  for all to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin())
  with check (private.is_business_member(business_id) or private.is_platform_admin());
create policy "tenant vehicle access" on public.vehicles
  for all to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin())
  with check (private.is_business_member(business_id) or private.is_platform_admin());
create policy "tenant service access" on public.services
  for all to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin())
  with check (private.is_business_member(business_id) or private.is_platform_admin());
create policy "tenant membership access" on public.memberships
  for all to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin())
  with check (private.is_business_member(business_id) or private.is_platform_admin());
create policy "tenant transaction access" on public.wash_transactions
  for all to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin())
  with check (private.is_business_member(business_id) or private.is_platform_admin());
create policy "tenant redemption read access" on public.membership_redemptions
  for select to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin());
-- Client roles intentionally have no INSERT/UPDATE/DELETE policy on redemption records.
-- A trusted atomic redemption endpoint will be added before live QR use.
create policy "tenant audit log read access" on public.audit_logs
  for select to authenticated
  using (private.is_business_member(business_id) or private.is_platform_admin());

-- Runs on Auth signup. User metadata only supplies business form values; it is NOT
-- used for authorization. The owner role is assigned from the trusted Auth user ID.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  safe_business_name text;
  safe_country text;
begin
  safe_business_name := nullif(btrim(new.raw_user_meta_data ->> 'business_name'), '');
  safe_country := nullif(btrim(new.raw_user_meta_data ->> 'country'), '');
  if safe_business_name is null or safe_country is null then
    raise exception 'Business name and country are required to create a WashFlow workspace';
  end if;
  if char_length(safe_business_name) > 120 or char_length(safe_country) > 80 then
    raise exception 'WashFlow workspace details exceed allowed length';
  end if;

  insert into public.businesses(name, country, phone)
  values (safe_business_name, safe_country, nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''))
  returning id into new_business_id;

  insert into public.business_members(business_id, user_id, display_name, role)
  values (new_business_id, new.id, left(nullif(btrim(new.raw_user_meta_data ->> 'owner_name'), ''), 120), 'owner');

  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_washflow on auth.users;
create trigger on_auth_user_created_washflow
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Provision the platform owner manually after creating/verifying the owner's Auth account:
-- insert into public.platform_admins(user_id) values ('AUTH_USER_UUID');
-- Never allow public signup or client-side code to assign this role.
