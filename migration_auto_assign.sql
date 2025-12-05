-- Create table for auto-assignment settings
create table if not exists auto_assign_settings (
  user_id uuid references users(id) on delete cascade primary key,
  daily_limit int default 0,
  is_enabled boolean default false,
  updated_at timestamptz default now()
);

-- Make sure assigned_to in leads is nullable (it should be by default, but good to ensure)
alter table leads alter column assigned_to drop not null;
