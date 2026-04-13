-- ============================================================
-- RebelTrack — Ole Miss Athletics
-- Database Schema v1.0
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================

create type po_status as enum (
  'PO Created',
  'Ordered',
  'Shipped',
  'Delivered',
  'Received',
  'Asset Tagged',
  'Closed'
);

create type user_role as enum (
  'it_admin',
  'dept_admin',
  'business_office',
  'read_only'
);

create type item_category as enum (
  'Hardware',
  'Software',
  'Equipment',
  'Supplies',
  'Furniture',
  'AV / Media',
  'Other'
);

create type notification_event as enum (
  'po_created',
  'status_ordered',
  'status_shipped',
  'status_delivered',
  'status_received',
  'status_asset_tagged',
  'status_closed',
  'warranty_90_days',
  'warranty_30_days',
  'warranty_quarterly_digest'
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================

create table departments (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  parent_id     uuid references departments(id) on delete set null,
  head_user_id  uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into departments (name) values
  ('Football'),
  ('Basketball'),
  ('Baseball'),
  ('IT & Technology'),
  ('Facilities'),
  ('Business Office');

-- Sub-departments
insert into departments (name, parent_id) 
select 'Offense', id from departments where name = 'Football';
insert into departments (name, parent_id) 
select 'Defense', id from departments where name = 'Football';
insert into departments (name, parent_id) 
select 'Special Teams', id from departments where name = 'Football';
insert into departments (name, parent_id) 
select 'Infrastructure', id from departments where name = 'IT & Technology';
insert into departments (name, parent_id) 
select 'AV Support', id from departments where name = 'IT & Technology';
insert into departments (name, parent_id)
select 'Field Operations', id from departments where name = 'Facilities';

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================

create table user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  email           text not null unique,
  role            user_role not null default 'read_only',
  department_id   uuid references departments(id) on delete set null,
  must_reset_pw   boolean not null default true,
  is_active       boolean not null default true,
  created_by      uuid references user_profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- VENDORS
-- ============================================================

create table vendors (
  id          uuid primary key default uuid_generate_v4(),
  vendor_id   text unique,           -- e.g. V-1042
  name        text not null,
  contact     text,
  email       text,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into vendors (vendor_id, name) values
  ('V-0001', 'Apple Inc.'),
  ('V-0099', 'Staples Business'),
  ('V-0221', 'Cisco Systems'),
  ('V-0305', 'Adobe Inc.'),
  ('V-0441', 'Spalding'),
  ('V-0550', 'Rawlings'),
  ('V-0711', 'Grainger'),
  ('V-0812', 'Hudl'),
  ('V-1042', 'Dell Technologies'),
  ('V-1190', 'Panasonic'),
  ('V-2210', 'Ergotron'),
  ('V-2291', 'CDW Government LLC'),
  ('V-3301', 'BSN Sports');

-- ============================================================
-- PURCHASE ORDERS (master table)
-- ============================================================

create table purchase_orders (
  -- Identification
  id                  uuid primary key default uuid_generate_v4(),
  po_number           text not null unique,
  requisition_number  text,

  -- People
  requester_id        uuid references user_profiles(id) on delete set null,
  requester_name      text not null,
  department_id       uuid references departments(id) on delete set null,
  department_name     text not null,
  business_contact_id uuid references user_profiles(id) on delete set null,

  -- Vendor
  vendor_id           uuid references vendors(id) on delete set null,
  vendor_name         text not null,

  -- Financial
  unit_cost           numeric(12,2) not null default 0,
  quantity            integer not null default 1,
  total_cost          numeric(12,2) generated always as (unit_cost * quantity) stored,
  funding_source      text,

  -- Timeline
  order_date          date,
  expected_delivery   date,
  actual_delivery     date,
  received_date       date,

  -- Status
  status              po_status not null default 'PO Created',

  -- Item details
  item_description    text not null,
  category            item_category,
  manufacturer        text,
  model               text,
  serial_number       text,

  -- Inventory
  asset_tag           text,
  building            text,
  room                text,
  custodian           text,

  -- Warranty
  has_warranty        boolean not null default false,
  warranty_end_date   date,
  warranty_provider   text,
  warranty_notes      text,

  -- Extra recipients for this PO's notifications
  extra_email_recipients  text[],

  -- Meta
  notes               text,
  created_by          uuid references user_profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast lookups
create index idx_po_status   on purchase_orders(status);
create index idx_po_dept     on purchase_orders(department_id);
create index idx_po_created  on purchase_orders(created_at);
create index idx_po_warranty on purchase_orders(warranty_end_date) where has_warranty = true;

-- ============================================================
-- DOCUMENTS (file attachments per PO)
-- ============================================================

create type doc_type as enum (
  'po_file',
  'invoice',
  'packing_slip',
  'warranty_doc',
  'other'
);

create table po_documents (
  id            uuid primary key default uuid_generate_v4(),
  po_id         uuid not null references purchase_orders(id) on delete cascade,
  doc_type      doc_type not null,
  file_name     text not null,
  storage_path  text not null,      -- Supabase storage path
  file_size     bigint,
  mime_type     text,
  uploaded_by   uuid references user_profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index idx_docs_po on po_documents(po_id);

-- ============================================================
-- AUDIT / STATUS HISTORY
-- ============================================================

create table po_audit_log (
  id            uuid primary key default uuid_generate_v4(),
  po_id         uuid not null references purchase_orders(id) on delete cascade,
  field_changed text not null,
  old_value     text,
  new_value     text,
  changed_by    uuid references user_profiles(id) on delete set null,
  changed_by_name text,
  note          text,
  created_at    timestamptz not null default now()
);

create index idx_audit_po on po_audit_log(po_id);
create index idx_audit_ts on po_audit_log(created_at);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

create table notification_preferences (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  event         notification_event not null,
  enabled       boolean not null default true,
  unique(user_id, event)
);

-- System-wide notification toggle (for IT admins)
create table notification_settings (
  event         notification_event primary key,
  enabled       boolean not null default true,
  updated_at    timestamptz not null default now()
);

insert into notification_settings (event, enabled) values
  ('po_created',               true),
  ('status_ordered',           true),
  ('status_shipped',           true),
  ('status_delivered',         true),
  ('status_received',          true),
  ('status_asset_tagged',      false),
  ('status_closed',            false),
  ('warranty_90_days',         true),
  ('warranty_30_days',         true),
  ('warranty_quarterly_digest',true);

-- ============================================================
-- NOTIFICATION LOG (audit trail of emails sent)
-- ============================================================

create table notification_log (
  id            uuid primary key default uuid_generate_v4(),
  po_id         uuid references purchase_orders(id) on delete set null,
  event         notification_event not null,
  recipients    text[] not null,
  subject       text not null,
  sent_at       timestamptz not null default now(),
  success       boolean not null default true,
  error_message text
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_po_updated_at
  before update on purchase_orders
  for each row execute function set_updated_at();

create trigger trg_dept_updated_at
  before update on departments
  for each row execute function set_updated_at();

create trigger trg_user_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

create trigger trg_vendor_updated_at
  before update on vendors
  for each row execute function set_updated_at();

-- Audit log trigger — captures status changes automatically
create or replace function log_po_changes()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into po_audit_log (po_id, field_changed, old_value, new_value, changed_by_name)
    values (new.id, 'status', old.status::text, new.status::text, 'system');
  end if;

  if old.asset_tag is distinct from new.asset_tag then
    insert into po_audit_log (po_id, field_changed, old_value, new_value, changed_by_name)
    values (new.id, 'asset_tag', old.asset_tag, new.asset_tag, 'system');
  end if;

  return new;
end;
$$;

create trigger trg_po_audit
  after update on purchase_orders
  for each row execute function log_po_changes();

-- Duplicate PO number check (case-insensitive)
create or replace function check_duplicate_po(p_po_number text, p_exclude_id uuid default null)
returns boolean language sql stable as $$
  select exists (
    select 1 from purchase_orders
    where lower(po_number) = lower(p_po_number)
      and (p_exclude_id is null or id != p_exclude_id)
  );
$$;

-- Dashboard stats function
create or replace function get_dashboard_stats(p_dept_id uuid default null)
returns json language sql stable as $$
  select json_build_object(
    'active_pos',    count(*) filter (where status != 'Closed'),
    'needs_tag',     count(*) filter (where status = 'Received'),
    'closed',        count(*) filter (where status = 'Closed'),
    'total_spend',   coalesce(sum(total_cost), 0),
    'ytd_spend',     coalesce(sum(total_cost) filter (where extract(year from created_at) = extract(year from now())), 0),
    'warranty_expiring_90', count(*) filter (
      where has_warranty = true
        and warranty_end_date between now()::date and (now() + interval '90 days')::date
    )
  )
  from purchase_orders
  where (p_dept_id is null or department_id = p_dept_id);
$$;

-- Spend by month function
create or replace function get_spend_by_month(
  p_year int default extract(year from now())::int,
  p_dept_id uuid default null
)
returns table(month int, month_name text, total_spend numeric, po_count bigint)
language sql stable as $$
  select
    extract(month from created_at)::int,
    to_char(created_at, 'Mon'),
    coalesce(sum(total_cost), 0),
    count(*)
  from purchase_orders
  where extract(year from created_at) = p_year
    and (p_dept_id is null or department_id = p_dept_id)
  group by extract(month from created_at), to_char(created_at, 'Mon')
  order by 1;
$$;

-- Spend by department function
create or replace function get_spend_by_dept(
  p_year int default null,
  p_month int default null
)
returns table(dept_name text, total_spend numeric, po_count bigint)
language sql stable as $$
  select
    department_name,
    coalesce(sum(total_cost), 0),
    count(*)
  from purchase_orders
  where (p_year is null or extract(year from created_at) = p_year)
    and (p_month is null or extract(month from created_at) = p_month)
  group by department_name
  order by 2 desc;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table purchase_orders      enable row level security;
alter table po_documents         enable row level security;
alter table po_audit_log         enable row level security;
alter table user_profiles        enable row level security;
alter table departments          enable row level security;
alter table vendors              enable row level security;
alter table notification_preferences enable row level security;

-- Helper: get current user role
create or replace function current_user_role()
returns user_role language sql stable security definer as $$
  select role from user_profiles where id = auth.uid();
$$;

-- Helper: get current user department
create or replace function current_user_dept()
returns uuid language sql stable security definer as $$
  select department_id from user_profiles where id = auth.uid();
$$;

-- PO policies
create policy "IT admins see all POs"
  on purchase_orders for select
  using (current_user_role() in ('it_admin', 'business_office'));

create policy "Dept users see own dept POs"
  on purchase_orders for select
  using (
    current_user_role() in ('dept_admin', 'read_only')
    and department_id = current_user_dept()
  );

create policy "IT admins and business can insert POs"
  on purchase_orders for insert
  with check (current_user_role() in ('it_admin', 'business_office', 'dept_admin'));

create policy "IT admins can update all POs"
  on purchase_orders for update
  using (current_user_role() = 'it_admin');

create policy "Dept admins update own dept POs"
  on purchase_orders for update
  using (
    current_user_role() = 'dept_admin'
    and department_id = current_user_dept()
  );

-- User profile policies
create policy "Users see own profile"
  on user_profiles for select
  using (id = auth.uid() or current_user_role() in ('it_admin'));

create policy "IT admins manage users"
  on user_profiles for all
  using (current_user_role() = 'it_admin');

-- Departments: all authenticated users can read
create policy "All users read departments"
  on departments for select
  using (auth.uid() is not null);

create policy "IT admins manage departments"
  on departments for all
  using (current_user_role() = 'it_admin');

-- Vendors: all can read, admins can write
create policy "All users read vendors"
  on vendors for select
  using (auth.uid() is not null);

create policy "IT admins manage vendors"
  on vendors for all
  using (current_user_role() = 'it_admin');

-- Audit log: read only, no delete
create policy "Admins read audit log"
  on po_audit_log for select
  using (current_user_role() in ('it_admin', 'business_office'));

-- Documents: follow PO access
create policy "PO doc access follows PO"
  on po_documents for select
  using (
    exists (
      select 1 from purchase_orders p
      where p.id = po_documents.po_id
        and (
          current_user_role() in ('it_admin', 'business_office')
          or p.department_id = current_user_dept()
        )
    )
  );
