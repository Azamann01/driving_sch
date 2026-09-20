-- Driving school booking platform: initial schema
-- Run this in the Supabase SQL editor for your project, or via the
-- Supabase CLI (supabase db push), before the app is used for the first time.

create extension if not exists "pgcrypto";

-- Instructors ---------------------------------------------------------

create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  vehicle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Students --------------------------------------------------------------
-- A student is created once an enquiry is converted, or can be added
-- directly from the dashboard for an existing pupil.

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  postcode text,
  progress_notes text,
  created_at timestamptz not null default now()
);

-- Enquiries ---------------------------------------------------------------
-- Created from the public booking form. Lesson type name, duration and
-- price are copied in at the time of the enquiry so that a later change
-- to config/business.ts never rewrites the price on a historical record.

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  postcode text not null,
  lesson_type_id text not null,
  lesson_type_name text not null,
  price_gbp numeric(8, 2) not null,
  duration_minutes integer not null,
  preferred_date date,
  preferred_time_notes text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'converted', 'waiting', 'lost')),
  created_at timestamptz not null default now()
);

-- Bookings ------------------------------------------------------------
-- A confirmed (or pending) lesson. Usually created by converting an
-- enquiry from the dashboard, which assigns an instructor and a time.

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid references enquiries(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  instructor_id uuid references instructors(id) on delete set null,
  lesson_type_id text not null,
  lesson_type_name text not null,
  price_gbp numeric(8, 2) not null,
  duration_minutes integer not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partially_paid', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_start_time_idx on bookings (start_time);
create index if not exists bookings_instructor_idx on bookings (instructor_id);

-- Payments --------------------------------------------------------------

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  amount_gbp numeric(8, 2) not null,
  method text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text,
  provider_reference text,
  created_at timestamptz not null default now()
);

-- Waiting list ----------------------------------------------------------

create table if not exists waiting_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  postcode text,
  lesson_type_id text,
  lesson_type_name text,
  preferred_area text,
  preferred_times text,
  notes text,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

-- Row level security ------------------------------------------------------
-- The public site only ever needs to insert into enquiries and waiting_list,
-- using the anon key. Every read, update and delete, and all access to the
-- other tables, is restricted to an authenticated session, which is how the
-- owner dashboard talks to the database once logged in.

alter table instructors enable row level security;
alter table students enable row level security;
alter table enquiries enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table waiting_list enable row level security;

create policy "public can submit an enquiry"
  on enquiries for insert
  to anon
  with check (true);

create policy "owner can manage enquiries"
  on enquiries for all
  to authenticated
  using (true)
  with check (true);

create policy "public can join the waiting list"
  on waiting_list for insert
  to anon
  with check (true);

create policy "owner can manage the waiting list"
  on waiting_list for all
  to authenticated
  using (true)
  with check (true);

create policy "owner can manage instructors"
  on instructors for all
  to authenticated
  using (true)
  with check (true);

create policy "owner can manage students"
  on students for all
  to authenticated
  using (true)
  with check (true);

create policy "owner can manage bookings"
  on bookings for all
  to authenticated
  using (true)
  with check (true);

create policy "owner can manage payments"
  on payments for all
  to authenticated
  using (true)
  with check (true);
