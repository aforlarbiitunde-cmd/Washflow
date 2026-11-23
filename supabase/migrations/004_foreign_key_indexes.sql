create index if not exists vehicles_customer_tenant_idx on public.vehicles(customer_id,business_id);
create index if not exists memberships_customer_tenant_idx on public.memberships(customer_id,business_id);
create index if not exists wash_transactions_customer_tenant_idx on public.wash_transactions(customer_id,business_id);
create index if not exists wash_transactions_vehicle_tenant_idx on public.wash_transactions(vehicle_id,business_id);
create index if not exists wash_transactions_staff_idx on public.wash_transactions(staff_user_id);
create index if not exists wash_redemptions_membership_tenant_idx on public.wash_redemptions(membership_id,business_id);
create index if not exists wash_redemptions_staff_idx on public.wash_redemptions(staff_user_id);
