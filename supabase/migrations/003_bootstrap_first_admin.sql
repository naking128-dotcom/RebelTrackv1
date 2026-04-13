-- ============================================================
-- RebelTrack — Ole Miss Athletics
-- Migration 003: First admin bootstrap helper
-- Run this AFTER 002_ole_miss_departments.sql
-- ============================================================

create or replace function bootstrap_first_it_admin(
  p_email text,
  p_first_name text default 'System',
  p_last_name text default 'Administrator'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_existing_admin uuid;
begin
  select id into v_existing_admin
  from user_profiles
  where role = 'it_admin'
  limit 1;

  if v_existing_admin is not null then
    raise exception 'An IT admin already exists. Use the Users screen or admin SQL instead.';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No auth.users record found for %. Create the Auth user first in Supabase Dashboard.', p_email;
  end if;

  insert into user_profiles (
    id, first_name, last_name, email, role, department_id,
    must_reset_pw, is_active, created_by
  ) values (
    v_user_id, p_first_name, p_last_name, p_email, 'it_admin', null,
    false, true, null
  )
  on conflict (id) do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      role = 'it_admin',
      is_active = true,
      must_reset_pw = false,
      updated_at = now();

  return v_user_id;
end;
$$;

comment on function bootstrap_first_it_admin(text, text, text)
is 'Create the first IT admin after creating the auth user in Supabase Dashboard.';
