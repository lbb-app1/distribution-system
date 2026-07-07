-- ============================================================
-- Migration: Attendance System + Lead Pool Management
-- ============================================================

-- 1. Add upload tracking to existing leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_id uuid;

CREATE INDEX IF NOT EXISTS idx_leads_upload_id ON leads(upload_id);

-- 2. Lead Uploads table — tracks each bulk file upload
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

-- 3. Re-add upload_id as a proper FK now that lead_uploads exists
-- (Drop the column first to recreate with FK cleanly)
ALTER TABLE leads DROP COLUMN IF EXISTS upload_id;
ALTER TABLE leads ADD COLUMN upload_id uuid REFERENCES lead_uploads(id) ON DELETE SET NULL;

-- 4. Daily attendance — one row per user per day
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
 UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attendance_user_date ON daily_attendance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(date);

-- 5. Individual task rows — one per lead assigned to a user per day
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

-- 6. Bulk operations log — records admin actions on lead pools
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
-- Helper function: update lead upload counts
-- ============================================================
CREATE OR REPLACE FUNCTION update_lead_upload_counts(upload_uuid uuid)
RETURNS void AS $$
DECLARE
 v_total int;
 v_assigned int;
 v_pending int;
 v_done int;
 v_rejected int;
BEGIN
 SELECT COUNT(*) INTO v_total FROM leads WHERE upload_id = upload_uuid;
 SELECT COUNT(*) INTO v_assigned FROM leads WHERE upload_id = upload_uuid AND assigned_to IS NOT NULL;
 SELECT COUNT(*) INTO v_pending FROM leads WHERE upload_id = upload_uuid AND (assigned_to IS NULL OR status = 'pending');
 SELECT COUNT(*) INTO v_done FROM leads WHERE upload_id = upload_uuid AND status = 'done';
 SELECT COUNT(*) INTO v_rejected FROM leads WHERE upload_id = upload_uuid AND status = 'rejected';

 UPDATE lead_uploads
 SET
 lead_count = COALESCE(v_total, 0),
 assigned_count = COALESCE(v_assigned, 0),
 pending_count = COALESCE(v_pending, 0),
 done_count = COALESCE(v_done, 0),
 rejected_count = COALESCE(v_rejected, 0)
 WHERE id = upload_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger: auto-update lead_upload counts whenever leads change
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_update_upload_counts()
RETURNS TRIGGER AS $$
BEGIN
 IF TG_OP = 'INSERT' AND NEW.upload_id IS NOT NULL THEN
 PERFORM update_lead_upload_counts(NEW.upload_id);
 ELSIF TG_OP = 'UPDATE' THEN
 IF OLD.upload_id IS DISTINCT FROM NEW.upload_id THEN
 IF OLD.upload_id IS NOT NULL THEN
 PERFORM update_lead_upload_counts(OLD.upload_id);
 END IF;
 IF NEW.upload_id IS NOT NULL THEN
 PERFORM update_lead_upload_counts(NEW.upload_id);
 END IF;
 ELSIF OLD.status IS DISTINCT FROM NEW.status OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
 IF NEW.upload_id IS NOT NULL THEN
 PERFORM update_lead_upload_counts(NEW.upload_id);
 END IF;
 END IF;
 ELSIF TG_OP = 'DELETE' AND OLD.upload_id IS NOT NULL THEN
 PERFORM update_lead_upload_counts(OLD.upload_id);
 END IF;
 RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_upload_counts ON leads;
CREATE TRIGGER trg_leads_upload_counts
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW EXECUTE FUNCTION trigger_update_upload_counts();

-- ============================================================
-- Trigger: auto-mark attendance present when all tasks done
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_check_full_attendance()
RETURNS TRIGGER AS $$
DECLARE
 v_total int;
 v_completed int;
 v_date_val date;
BEGIN
 IF NEW.is_completed = false THEN
 RETURN NEW;
 END IF;

 SELECT COUNT(*), MAX(date) INTO v_total, v_date_val
 FROM daily_tasks
 WHERE user_id = NEW.user_id AND date = NEW.date;

 SELECT COUNT(*) INTO v_completed
 FROM daily_tasks
 WHERE user_id = NEW.user_id AND date = NEW.date AND is_completed = true;

 IF v_total > 0 AND v_total = v_completed THEN
 UPDATE daily_attendance
 SET is_present = true, completed_tasks = v_completed, marked_at = now()
 WHERE user_id = NEW.user_id AND date = v_date_val;
 ELSE
 UPDATE daily_attendance
 SET completed_tasks = v_completed
 WHERE user_id = NEW.user_id AND date = v_date_val;
 END IF;

 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_full_attendance ON daily_tasks;
CREATE TRIGGER trg_check_full_attendance
AFTER UPDATE OF is_completed ON daily_tasks
FOR EACH ROW EXECUTE FUNCTION trigger_check_full_attendance();
