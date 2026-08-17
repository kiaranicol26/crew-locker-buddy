ALTER TABLE public.pd_members
  ADD COLUMN IF NOT EXISTS foto text,
  ADD COLUMN IF NOT EXISTS placa text,
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS division_rango text;

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS can_edit_pd boolean NOT NULL DEFAULT false;