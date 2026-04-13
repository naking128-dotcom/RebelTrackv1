-- ============================================================
-- RebelTrack — Ole Miss Athletics
-- Migration 001: Full Database Schema (clean, consistent)
-- Run this FIRST in a fresh Supabase project
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'po_status') then
    create type po_status as enum (
      'PO Created','Ordered','Shipped','Delivered',
      'Received','Asset Tagged','Closed'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'it_admin','dept_admin','business_office','read_only'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'item_category') then
    create type item_category as enum (
      'Hardware','Software','Equipment','Supplies',
      'Furniture','AV / Media','Other'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'notification_event') then
    create type notification_event as enum (
      'po_created','status_ordered','status_shipped','status_delivered',
      'status_received','status_asset_tagged','status_closed',
      'warranty_90_days','warranty_30_days','warranty_quarterly_digest'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'doc_type') then
    create type doc_type as enum (
      'po_file','invoice','packing_slip','warranty_doc','other'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'dept_gender') then
    create type dept_gender as enum ('mens','womens','coed');
  end if;
end $$;

-- ============================================================
-- DEPARTMENTS
-- ============================================================

create table if not exists departments (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  sport_group  text,
  gender       dept_gender,
  icon         text,
  color        text,
  sort_order   integer not null default 0,
  parent_id    uuid references departments(id) on delete set null,
  head_user_id uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table departments
  drop constraint if exists departments_name_key;

create unique index if not exists idx_departments_root_name_unique
  on departments (lower(name))
  where parent_id is null;

create unique index if not exists idx_departments_parent_name_unique
  on departments (parent_id, lower(name))
  where parent_id is not null;

create index if not exists idx_departments_parent_id on departments(parent_id);
create index if not exists idx_departments_sport_group on departments(sport_group);

-- ============================================================
-- USER PROFILES
-- ============================================================

create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  email         text not null unique,
  role          user_role not null default 'read_only',
  department_id uuid references departments(id) on delete set null,
  must_reset_pw boolean not null default true,
  is_active     boolean not null default true,
  created_by    uuid references user_profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table departments
  drop constraint if exists departments_head_user_id_fkey;
alter table departments
  add constraint departments_head_user_id_fkey
  foreign key (head_user_id) references user_profiles(id) on delete set null;

-- ============================================================
-- VENDORS
-- ============================================================

create table if not exists vendors (
  id         uuid primary key default uuid_generate_v4(),
  vendor_id  text unique,
  name       text not null,
  contact    text,
  email      text,
  phone      text,
  address    text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into vendors (vendor_id, name) values
  ('V-0001', 'Apple Inc.'),
  ('V-0099', 'Staples Business'),
  ('V-0221', 'Cisco Systems'),
  ('V-0305', 'Adobe Inc.'),
  ('V-0550', 'Rawlings'),
  ('V-0812', 'Hudl'),
  ('V-1042', 'Dell Technologies'),
  ('V-1190', 'Panasonic'),
  ('V-2210', 'Ergotron'),
  ('V-2291', 'CDW Government LLC'),
  ('V-3301', 'BSN Sports'),
  ('V-9901', 'Grainger')
on conflict (vendor_id) do nothing;

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================

create table if not exists purchase_orders (
  id                     uuid primary key default uuid_generate_v4(),
  po_number              text not null unique,
  requisition_number     text,
  requester_id           uuid references user_profiles(id) on delete set null,
  requester_name         text not null,
  department_id          uuid references departments(id) on delete set null,
  department_name        text not null,
  business_contact_id    uuid references user_profiles(id) on delete set null,
  vendor_id              uuid references vendors(id) on delete set null,
  vendor_name            text not null,
  unit_cost              numeric(12,2) not null default 0,
  quantity               integer not null default 1,
  total_cost             numeric(12,2) generated always as (unit_cost * quantity) stored,
  funding_source         text,
  order_date             date,
  expected_delivery      date,
  actual_delivery        date,
  received_date          date,
  status                 po_status not null default 'PO Created',
  item_description       text not null,
  category               item_category,
  manufacturer           text,
  model                  text,
  serial_number          text,
  asset_tag              text,
  building               text,
  room                   text,
  custodian              text,
  has_warranty           boolean not null default false,
  warranty_end_date      date,
  warranty_provider      text,
  warranty_notes         text,
  extra_email_recipients text[],
  notes                  text,
  created_by             uuid references user_profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_po_status     on purchase_orders(status);
create index if not exists idx_po_dept       on purchase_orders(department_id);
create index if not exists idx_po_created_at on purchase_orders(created_at desc);
create index if not exists idx_po_warranty   on purchase_orders(has_warranty) where has_warranty = true;
create index if not exists idx_po_number     on purchase_orders(po_number);

-- ============================================================
-- PO DOCUMENTS
-- ============================================================

create table if not exists po_documents (
  id           uuid primary key default uuid_generate_v4(),
  po_id        uuid not null references purchase_orders(id) on delete cascade,
  doc_type     doc_type not null default 'other',
  file_name    text not null,
  storage_path text not null,
  file_size    bigint,
  mime_type    text,
  uploaded_by  uuid references user_profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_pod_po_id on po_documents(po_id);

-- ============================================================
-- PO AUDIT LOG
-- ============================================================

create table if not exists po_audit_log (
  id              uuid primary key default uuid_generate_v4(),
  po_id           uuid not null references purchase_orders(id) on delete cascade,
  field_changed   text not null,
  old_value       text,
  new_value       text,
  changed_by      uuid references user_profiles(id) on delete set null,
  changed_by_name text,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_po_id on po_audit_log(po_id);

-- ============================================================
-- NOTIFICATION SETTINGS
-- ============================================================

create table if not exists notification_settings (
  event      notification_event primary key,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into notification_settings (event, enabled) values
  ('po_created',                true),
  ('status_ordered',            true),
  ('status_shipped',            true),
  ('status_delivered',          true),
  ('status_received',           true),
  ('status_asset_tagged',       false),
  ('status_closed',             false),
  ('warranty_90_days',          true),
  ('warranty_30_days',          true),
  ('warranty_quarterly_digest', true)
on conflict (event) do nothing;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

create table if not exists notification_preferences (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references user_profiles(id) on delete cascade,
  event      notification_event not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, event)
);

create index if not exists idx_notif_pref_user on notification_preferences(user_id);

-- ============================================================
-- NOTIFICATION LOG
-- ============================================================

create table if not exists notification_log (
  id            uuid primary key default uuid_generate_v4(),
  po_id         uuid references purchase_orders(id) on delete set null,
  event         text not null,
  recipients    text[] not null,
  subject       text not null,
  sent_at       timestamptz not null default now(),
  success       boolean not null default true,
  error_message text
);

create index if not exists idx_notif_log_po_id on notification_log(po_id);

-- ============================================================
-- FUNCTIONS + TRIGGERS
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_departments_updated_at') then
    create trigger trg_departments_updated_at before update on departments
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_profiles_updated_at') then
    create trigger trg_user_profiles_updated_at before update on user_profiles
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_vendors_updated_at') then
    create trigger trg_vendors_updated_at before update on vendors
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_purchase_orders_updated_at') then
    create trigger trg_purchase_orders_updated_at before update on purchase_orders
      for each row execute function set_updated_at();
  end if;
end $$;

create or replace function log_po_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into po_audit_log (po_id, field_changed, old_value, new_value, changed_by_name)
    values (new.id, 'status', old.status::text, new.status::text, 'system');
  end if;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_po_status_audit') then
    create trigger trg_po_status_audit after update on purchase_orders
      for each row execute function log_po_status_change();
  end if;
end $$;

create or replace function check_duplicate_po(p_po_number text)
returns boolean language sql stable as $$
  select exists (
    select 1 from purchase_orders where lower(po_number) = lower(p_po_number)
  );
$$;

create or replace function get_spend_by_month(p_year integer default null)
returns table (
  month_num integer,
  month_name text,
  total_spend numeric,
  po_count bigint
) language sql stable as $$
  select
    extract(month from created_at)::integer,
    to_char(created_at, 'Mon'),
    coalesce(sum(total_cost), 0),
    count(*)
  from purchase_orders
  where (p_year is null or extract(year from created_at) = p_year)
  group by 1, 2
  order by 1;
$$;

create or replace function get_spend_by_dept(p_year integer default null)
returns table (
  dept_name text,
  total_spend numeric,
  po_count bigint
) language sql stable as $$
  select
    department_name,
    coalesce(sum(total_cost), 0),
    count(*)
  from purchase_orders
  where (p_year is null or extract(year from created_at) = p_year)
  group by department_name
  order by 2 desc;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table departments              enable row level security;
alter table user_profiles            enable row level security;
alter table vendors                  enable row level security;
alter table purchase_orders          enable row level security;
alter table po_documents             enable row level security;
alter table po_audit_log             enable row level security;
alter table notification_settings    enable row level security;
alter table notification_preferences enable row level security;
alter table notification_log         enable row level security;

create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from user_profiles where id = auth.uid();
$$;

create or replace function auth_dept()
returns uuid language sql stable security definer as $$
  select department_id from user_profiles where id = auth.uid();
$$;

create or replace function auth_active()
returns boolean language sql stable security definer as $$
  select coalesce(is_active, false) from user_profiles where id = auth.uid();
$$;

drop policy if exists "dept_select" on departments;
create policy "dept_select" on departments for select using (auth_active());

drop policy if exists "dept_insert" on departments;
create policy "dept_insert" on departments for insert with check (auth_role() = 'it_admin');

drop policy if exists "dept_update" on departments;
create policy "dept_update" on departments for update using (auth_role() = 'it_admin');

drop policy if exists "dept_delete" on departments;
create policy "dept_delete" on departments for delete using (auth_role() = 'it_admin');

drop policy if exists "profile_select" on user_profiles;
create policy "profile_select" on user_profiles
  for select using (id = auth.uid() or auth_role() in ('it_admin', 'business_office'));

drop policy if exists "profile_insert" on user_profiles;
create policy "profile_insert" on user_profiles for insert with check (auth_role() = 'it_admin');

drop policy if exists "profile_update" on user_profiles;
create policy "profile_update" on user_profiles
  for update using (id = auth.uid() or auth_role() = 'it_admin');

drop policy if exists "profile_delete" on user_profiles;
create policy "profile_delete" on user_profiles for delete using (auth_role() = 'it_admin');

drop policy if exists "vendor_select" on vendors;
create policy "vendor_select" on vendors for select using (auth_active());

drop policy if exists "vendor_insert" on vendors;
create policy "vendor_insert" on vendors
  for insert with check (auth_role() in ('it_admin', 'dept_admin', 'business_office'));

drop policy if exists "vendor_update" on vendors;
create policy "vendor_update" on vendors
  for update using (auth_role() in ('it_admin', 'business_office'));

drop policy if exists "po_select" on purchase_orders;
create policy "po_select" on purchase_orders
  for select using (
    auth_active() and (
      auth_role() in ('it_admin', 'business_office')
      or department_id = auth_dept()
      or auth_role() = 'read_only'
    )
  );

drop policy if exists "po_insert" on purchase_orders;
create policy "po_insert" on purchase_orders
  for insert with check (
    auth_active() and auth_role() in ('it_admin', 'dept_admin', 'business_office')
  );

drop policy if exists "po_update" on purchase_orders;
create policy "po_update" on purchase_orders
  for update using (
    auth_active() and (
      auth_role() = 'it_admin'
      or (auth_role() in ('dept_admin', 'business_office') and department_id = auth_dept())
    )
  );

drop policy if exists "po_delete" on purchase_orders;
create policy "po_delete" on purchase_orders for delete using (auth_role() = 'it_admin');

drop policy if exists "pod_select" on po_documents;
create policy "pod_select" on po_documents
  for select using (
    exists (
      select 1 from purchase_orders p
      where p.id = po_id
        and (
          auth_role() in ('it_admin', 'business_office')
          or p.department_id = auth_dept()
          or auth_active()
        )
    )
  );

drop policy if exists "pod_insert" on po_documents;
create policy "pod_insert" on po_documents
  for insert with check (auth_role() in ('it_admin', 'dept_admin', 'business_office'));

drop policy if exists "pod_delete" on po_documents;
create policy "pod_delete" on po_documents for delete using (auth_role() = 'it_admin');

drop policy if exists "audit_select" on po_audit_log;
create policy "audit_select" on po_audit_log for select using (auth_active());

drop policy if exists "audit_insert" on po_audit_log;
create policy "audit_insert" on po_audit_log for insert with check (auth_active());

drop policy if exists "notif_settings_select" on notification_settings;
create policy "notif_settings_select" on notification_settings for select using (auth_active());

drop policy if exists "notif_settings_update" on notification_settings;
create policy "notif_settings_update" on notification_settings
  for update using (auth_role() in ('it_admin', 'business_office'));

drop policy if exists "notif_settings_insert" on notification_settings;
create policy "notif_settings_insert" on notification_settings
  for insert with check (auth_role() in ('it_admin', 'business_office'));

drop policy if exists "notif_pref_select" on notification_preferences;
create policy "notif_pref_select" on notification_preferences
  for select using (user_id = auth.uid() or auth_role() = 'it_admin');

drop policy if exists "notif_pref_insert" on notification_preferences;
create policy "notif_pref_insert" on notification_preferences for insert with check (user_id = auth.uid());

drop policy if exists "notif_pref_update" on notification_preferences;
create policy "notif_pref_update" on notification_preferences for update using (user_id = auth.uid());

drop policy if exists "notif_pref_delete" on notification_preferences;
create policy "notif_pref_delete" on notification_preferences for delete using (user_id = auth.uid());

drop policy if exists "notif_log_select" on notification_log;
create policy "notif_log_select" on notification_log
  for select using (auth_role() in ('it_admin', 'business_office'));

drop policy if exists "notif_log_insert" on notification_log;
create policy "notif_log_insert" on notification_log for insert with check (auth_active());

-- ============================================================
-- STORAGE NOTE
-- ============================================================
-- Create bucket manually in Supabase Dashboard:
-- Storage -> New Bucket -> name: po-documents -> Private
