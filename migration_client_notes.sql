CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_client_notes_lead_id ON client_notes(lead_id);
