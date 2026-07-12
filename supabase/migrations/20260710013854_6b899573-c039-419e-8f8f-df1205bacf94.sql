ALTER TABLE public.rnap_certificates
  ADD COLUMN IF NOT EXISTS antecedentes TEXT,
  ADD COLUMN IF NOT EXISTS foto TEXT;