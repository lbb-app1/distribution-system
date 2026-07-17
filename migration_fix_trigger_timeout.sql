-- Fix: prevent statement timeout on bulk lead inserts
-- The trigger was doing 5 COUNT(*) queries per row, causing
-- timeouts on large uploads. Now it only recalculates when
-- a row actually affects the upload counts (status/assigned_to changes).

CREATE OR REPLACE FUNCTION update_lead_upload_counts()
RETURNS TRIGGER AS $$
DECLARE
 v_upload_id uuid;
BEGIN
 IF TG_OP = 'DELETE' THEN
 v_upload_id := OLD.upload_id;
 ELSE
 v_upload_id := NEW.upload_id;
 END IF;

 IF v_upload_id IS NULL THEN
 RETURN COALESCE(NEW, OLD);
 END IF;

 IF TG_OP = 'INSERT' THEN
 -- Skip inserts of pending/unassigned leads — they don't change counts
 IF NEW.status = 'pending' AND NEW.assigned_to IS NULL AND OLD IS NULL THEN
 RETURN NEW;
 END IF;
 ELSIF TG_OP = 'UPDATE' THEN
 -- Skip if nothing relevant changed
 IF (OLD.status = NEW.status) AND (OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to) AND (OLD.upload_id IS NOT DISTINCT FROM NEW.upload_id) THEN
 RETURN NEW;
 END IF;
 -- Refresh old upload if upload_id changed
 IF OLD.upload_id IS DISTINCT FROM NEW.upload_id AND OLD.upload_id IS NOT NULL THEN
 UPDATE lead_uploads SET
 lead_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id),
 assigned_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND assigned_to IS NOT NULL),
 pending_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND (assigned_to IS NULL OR status = 'pending')),
 done_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND status = 'done'),
 rejected_count = (SELECT COUNT(*) FROM leads WHERE upload_id = OLD.upload_id AND status = 'rejected')
 WHERE id = OLD.upload_id;
 END IF;
 END IF;

 UPDATE lead_uploads SET
 lead_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id),
 assigned_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND assigned_to IS NOT NULL),
 pending_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND (assigned_to IS NULL OR status = 'pending')),
 done_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND status = 'done'),
 rejected_count = (SELECT COUNT(*) FROM leads WHERE upload_id = v_upload_id AND status = 'rejected')
 WHERE id = v_upload_id;

 RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
