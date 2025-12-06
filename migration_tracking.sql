-- Add sub_status column to leads table
alter table leads add column if not exists sub_status text check (sub_status in ('Replied', 'Seen', 'Booked', 'Closed'));

-- Create index for faster search on lead_identifier
create index if not exists leads_lead_identifier_idx on leads (lead_identifier);
