-- Create guia_lotes table to store individual quantities per lote for each guia
CREATE TABLE IF NOT EXISTS guia_lotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guia_id UUID NOT NULL REFERENCES guias(id) ON DELETE CASCADE,
  lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guia_id, lote_id)
);

-- Add RLS policies
ALTER TABLE guia_lotes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read guia_lotes
CREATE POLICY "Users can view guia_lotes" ON guia_lotes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert guia_lotes
CREATE POLICY "Users can insert guia_lotes" ON guia_lotes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update guia_lotes
CREATE POLICY "Users can update guia_lotes" ON guia_lotes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete guia_lotes
CREATE POLICY "Users can delete guia_lotes" ON guia_lotes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_guia_lotes_guia_id ON guia_lotes(guia_id);
CREATE INDEX IF NOT EXISTS idx_guia_lotes_lote_id ON guia_lotes(lote_id);

-- Optional: Update existing guias to have guia_lotes entries if they have id_lotes
-- This assumes that if there are existing guias with id_lotes, we distribute the enviadas equally
-- But since this is a new feature, existing guias might not need this migration
