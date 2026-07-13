-- ============================================================
-- Migration: Attendance System + Lead Pool Management
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Lead Uploads table
CREATE TABLE IF NOT EXISTS lead_uploads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 file_name text NOT NULL,
 display_name text,
 uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
 uploaded_at timestamptz DEFAULT now(),
 lead_count int DEFAULT 0,
 assigned_count int DEFAULT 0,
 pending_count int DEFAULT 0,
 done_count int DEFAULT 0,
 rejected_count int DEFAULT 0,
 is_active boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_lead_uploads_uploaded_by ON lead_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_lead_uploads_uploaded_at ON lead_uploads(uploaded_at DESC);

-- 2. Add upload_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_id uuid REFERENCES lead_uploads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_upload_id ON leads(upload_id);

-- 3. Daily attendance
CREATE TABLE IF NOT EXISTS daily_attendance (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 date date NOT NULL,
 total_tasks int DEFAULT 0,
 completed_tasks int DEFAULT 0,
 is_present boolean DEFAULT false,
 marked_by uuid REFERENCES users(id) ON DELETE SET NULL,
 marked_at timestamptz,
 notes text,
 admin_override boolean DEFAULT false,
 UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attendance_user_date ON daily_attendance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(date);

-- 4. Daily tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 date date NOT NULL,
 is_completed boolean DEFAULT false,
 completed_at timestamptz,
 created_at timestamptz DEFAULT now(),
 UNIQUE(user_id, lead_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_lead_id ON daily_tasks(lead_id);

-- 5. Bulk operations log
CREATE TABLE IF NOT EXISTS bulk_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 operation_type text NOT NULL CHECK (operation_type IN ('withdraw', 'reassign', 'delete', 'archive')),
 upload_id uuid REFERENCES lead_uploads(id) ON DELETE SET NULL,
 target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 lead_count int DEFAULT 0,
 lead_ids uuid[] DEFAULT '{}',
 performed_by uuid REFERENCES users(id) ON DELETE SET NULL,
 performed_at timestamptz DEFAULT now(),
 notes text
);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_upload_id ON bulk_operations(upload_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_performed_at ON bulk_operations(performed_at DESC);

-- ============================================================
-- Trigger: auto-update lead_uploads counts when leads change
-- ============================================================
CREATE OR REPLACE FUNCTION update_lead_upload_counts()
RETURNS TRIGGER AS $$
DECLARE
 v_upload_id uuid;
BEGIN
 -- Determine which upload_id to refresh
 IF TG_OP = 'DELETE' THEN
 v_upload_id := OLD.upload_id;
 ELSE
 v_upload_id := NEW.upload_id;
 END IF;

 -- If upload changed, also refresh the old one
 IF TG_OP = 'UPDATE' AND OLD.upload_id IS DISTINCT FROM NEW.upload_id THEN
 UPDATE lead_uploads SET
 lead_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id),
 assigned_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND assigned_to IS NOT NULL),
 pending_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND (assigned_to IS NULL OR status = 'pending')),
 done_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND status = 'done'),
 rejected_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND status = 'rejected'))
 WHERE id = OLD.upload_id;
 END IF;

 -- Refresh the target upload
 IF v_upload_id IS NOT NULL THEN
 UPDATE lead_uploads SET
 lead_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id),
 assigned_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND assigned_to IS NOT NULL),
 pending_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND (assigned_to IS NULL OR status = 'pending')),
 done_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND status = 'done'),
 rejected_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND status = 'rejected'))
 WHERE id = v_upload_id;
 END IF;

 RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_upload_counts ON leads;
CREATE TRIGGER trg_leads_upload_counts
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW EXECUTE FUNCTION update_lead_upload_counts();

-- ============================================================
-- Trigger: auto-mark attendance present when all tasks done
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_check_full_attendance()
RETURNS TRIGGER AS $$
DECLARE
 v_total int;
 v_completed int;
BEGIN
 IF NEW.is_completed = false THEN
 RETURN NEW;
 END IF;

 SELECT COUNT(*) INTO v_total FROM daily_tasks
 WHERE user_id = NEW.user_id AND date = NEW.date;

 SELECT COUNT(*) INTO v_completed FROM daily_tasks
 WHERE user_id = NEW.user_id AND date = NEW.date AND is_completed = true;

 IF v_total > 0 AND v_total = v_completed THEN
 UPDATE daily_attendance
 SET is_present = true, completed_tasks = v_completed, marked_at = now()
 WHERE user_id = NEW.user_id AND date = NEW.date;
 ELSE
 UPDATE daily_attendance
 SET completed_tasks = v_completed
 WHERE user_id = NEW.user_id AND date = NEW.date;
 END IF;

 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_full_attendance ON daily_tasks;
CREATE TRIGGER trg_check_full_attendance
AFTER UPDATE OF is_completed ON daily_tasks
FOR EACH ROW EXECUTE FUNCTION trigger_check_full_attendance();
