-- Run manually in Supabase SQL Editor only after you have created and verified your owner account.
-- Replace the email below with the exact email address of the intended platform administrator.
insert into public.platform_admins(user_id)
select id from auth.users where lower(email)=lower('REPLACE_WITH_YOUR_VERIFIED_EMAIL')
on conflict do nothing;

-- Verify the grant. Expected: one row for the intended account.
select pa.user_id, au.email, pa.created_at
from public.platform_admins pa
join auth.users au on au.id=pa.user_id
where lower(au.email)=lower('REPLACE_WITH_YOUR_VERIFIED_EMAIL');
