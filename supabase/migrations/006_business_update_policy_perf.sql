drop policy if exists "owners can update their business" on public.businesses;
drop policy if exists "platform admins can update businesses" on public.businesses;
drop policy if exists "owners or admins can update businesses" on public.businesses;
create policy "owners or admins can update businesses" on public.businesses for update to authenticated
 using ((select private.is_platform_admin()) or exists(select 1 from public.business_members bm where bm.business_id=id and bm.user_id=(select auth.uid()) and bm.role='owner'))
 with check ((select private.is_platform_admin()) or exists(select 1 from public.business_members bm where bm.business_id=id and bm.user_id=(select auth.uid()) and bm.role='owner'));
