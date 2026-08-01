ALTER TABLE public.pd_members
  ADD COLUMN IF NOT EXISTS sueldo_defecto numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_instructor boolean NOT NULL DEFAULT false;

ALTER TABLE public.salary_entries
  ADD COLUMN IF NOT EXISTS es_instructor boolean NOT NULL DEFAULT false;