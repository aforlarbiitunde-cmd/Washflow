create table if not exists public.business_subscriptions (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null unique references public.businesses(id) on delete cascade,
 plan text not null default 'trial' check (plan in ('trial','starter','growth','pro')),
 status text not null default 'trial' check (status in ('trial','active','past_due','suspended','cancelled')),
 monthly_price numeric(8,3) not null default 0 check(monthly_price>=0),
 trial_ends_at timestamptz not null default now()+interval '30 days',
 current_period_ends_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.businesses add column if not exists status text not null default 'active' check(status in ('active','suspended','pending'));
alter table public.business_subscriptions enable row level security;
drop policy if exists "members can view own subscription" on public.business_subscriptions;
create policy "members can view own subscription" on public.business_subscriptions for select to authenticated using (private.is_business_member(business_id) or private.is_platform_admin());
grant select on public.business_subscriptions to authenticated;
revoke update on public.businesses from authenticated;
grant update(name,phone) on public.businesses to authenticated;
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare new_business_id uuid;
begin
 if coalesce(trim(new.raw_user_meta_data->>'business_name'),'') = '' then return new; end if;
 insert into public.businesses(name,country,phone)
 values(left(trim(new.raw_user_meta_data->>'business_name'),120),coalesce(nullif(left(trim(new.raw_user_meta_data->>'country'),80),''),'Unspecified'),nullif(left(trim(new.raw_user_meta_data->>'phone'),30),''))
 returning id into new_business_id;
 insert into public.business_members(business_id,user_id,role) values(new_business_id,new.id,'owner');
 insert into public.business_subscriptions(business_id,plan,status,monthly_price,trial_ends_at) values(new_business_id,'trial','trial',0,now()+interval '30 days');
 return new;
end;$$;
revoke all on function private.handle_new_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created_washflow on auth.users;
create trigger on_auth_user_created_washflow after insert on auth.users for each row execute procedure private.handle_new_user();

create or replace function public.admin_set_business_status(target_business uuid,new_status text)
returns void language plpgsql security invoker set search_path=''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins where user_id=auth.uid()) then raise exception 'Admin authorization required'; end if;
 if new_status not in ('active','suspended','pending') then raise exception 'Invalid business status'; end if;
 update public.businesses set status=new_status where id=target_business;
 if new_status='suspended' then update public.business_subscriptions set status='suspended',updated_at=now() where business_id=target_business;
 elsif new_status='active' then update public.business_subscriptions set status='active',updated_at=now() where business_id=target_business and status='suspended'; end if;
end;$$;
revoke all on function public.admin_set_business_status(uuid,text) from public,anon;
grant execute on function public.admin_set_business_status(uuid,text) to authenticated;
create or replace function public.admin_set_business_plan(target_business uuid,new_plan text,new_price numeric)
returns void language plpgsql security invoker set search_path=''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.platform_admins where user_id=auth.uid()) then raise exception 'Admin authorization required'; end if;
 if new_plan not in ('trial','starter','growth','pro') or new_price<0 or new_price>10000 then raise exception 'Invalid plan'; end if;
 update public.business_subscriptions set plan=new_plan,monthly_price=new_price,status=case when new_plan='trial' then 'trial' else 'active' end,updated_at=now() where business_id=target_business;
 if not found then raise exception 'Subscription not found'; end if;
end;$$;
revoke all on function public.admin_set_business_plan(uuid,text,numeric) from public,anon;
grant execute on function public.admin_set_business_plan(uuid,text,numeric) to authenticated;

drop policy if exists "platform admins can update businesses" on public.businesses;
create policy "platform admins can update businesses" on public.businesses for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
grant update(status) on public.businesses to authenticated;
drop policy if exists "platform admins manage subscriptions" on public.business_subscriptions;
create policy "platform admins manage subscriptions" on public.business_subscriptions for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
grant update(plan,status,monthly_price,trial_ends_at,current_period_ends_at) on public.business_subscriptions to authenticated;
