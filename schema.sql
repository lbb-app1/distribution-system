-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text check (role in ('admin', 'user')) default 'user',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Leads Table
create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_identifier text not null,
  assigned_to uuid references users(id),
  status text check (status in ('pending', 'done', 'rejected')) default 'pending',
  sub_status text check (sub_status in ('Replied', 'Seen', 'Booked', 'Closed')),
  assigned_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- RLS Policies (Optional but recommended, though we are using custom auth so we might bypass RLS or use a service role for everything if we don't use Supabase Auth)
-- For this prototype, we will use the service role key or just standard client with custom logic.
-- If using Supabase Auth, we would link users table to auth.users.
-- Since we are doing custom auth, we will manage this manually.

-- Create an initial admin user (password: admin123 - hash this in real app, here just placeholder or use a script to insert)
-- insert into users (username, password_hash, role) values ('admin', 'hashed_admin123', 'admin');

-- Auto Assign Settings Table
create table if not exists auto_assign_settings (
  user_id uuid references users(id) on delete cascade primary key,
  daily_limit int default 0,
  is_enabled boolean default false,
  updated_at timestamptz default now()
);

