create table if not exists public.wash_redemptions (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 membership_id uuid not null,
 staff_user_id uuid references auth.users(id) on delete set null,
 redeemed_at timestamptz not null default now(),
 unique (id,business_id),
 constraint redemption_membership_same_tenant foreign key (membership_id,business_id)
  references public.memberships(id,business_id) on delete cascade
);
create index if not exists redemptions_business_time_idx on public.wash_redemptions(business_id,redeemed_at desc);
alter table public.wash_redemptions enable row level security;
create policy "tenant redemption history" on public.wash_redemptions for select to authenticated
 using (private.is_business_member(business_id));
grant select on public.wash_redemptions to authenticated;

create or replace function public.redeem_membership_token(token text)
returns table (redemption_id uuid, membership_id uuid, customer_id uuid, remaining_washes integer, plan_name text)
language plpgsql security definer
set search_path = ''
as $$
declare
 caller uuid := auth.uid();
 m public.memberships%rowtype;
 r uuid;
begin
 if caller is null then raise exception 'Authentication required'; end if;
 if token is null or length(token) < 32 or length(token) > 512 then raise exception 'Invalid token'; end if;
 select * into m from public.memberships
  where qr_token_hash = encode(digest(token,'sha256'),'hex')
  for update;
 if not found then raise exception 'Membership token not found'; end if;
 if not exists(select 1 from public.business_members bm where bm.business_id=m.business_id and bm.user_id=caller) then
  raise exception 'Not authorized for this business';
 end if;
 if m.status <> 'active' or m.starts_at > now() or (m.expires_at is not null and m.expires_at <= now()) then
  raise exception 'Membership is not active';
 end if;
 if m.remaining_washes is not null and m.remaining_washes <= 0 then raise exception 'No washes remaining'; end if;
 if m.remaining_washes is not null then
  update public.memberships set remaining_washes=remaining_washes-1
   where id=m.id and remaining_washes > 0 returning remaining_washes into m.remaining_washes;
  if not found then raise exception 'No washes remaining'; end if;
 end if;
 insert into public.wash_redemptions(business_id,membership_id,staff_user_id)
 values(m.business_id,m.id,caller) returning id into r;
 return query select r,m.id,m.customer_id,m.remaining_washes,m.plan_name;
end;
$$;
revoke all on function public.redeem_membership_token(text) from public, anon;
grant execute on function public.redeem_membership_token(text) to authenticated;
