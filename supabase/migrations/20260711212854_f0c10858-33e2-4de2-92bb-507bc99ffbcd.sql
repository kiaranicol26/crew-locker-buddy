
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_emit_rnap boolean NOT NULL DEFAULT false;

-- Comisarios always have all permissions
UPDATE public.instructors SET can_delete = true, can_emit_rnap = true WHERE is_alto_mando = true;
