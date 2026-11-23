drop policy if exists "platform admins can update businesses" on public.businesses;
create policy "platform admins can update businesses" on public.businesses for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
grant update(status) on public.businesses to authenticated;
drop policy if exists "platform admins manage subscriptions" on public.business_subscriptions;
create policy "platform admins manage subscriptions" on public.business_subscriptions for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
grant update(plan,status,monthly_price,trial_ends_at,current_period_ends_at) on public.business_subscriptions to authenticated;
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
