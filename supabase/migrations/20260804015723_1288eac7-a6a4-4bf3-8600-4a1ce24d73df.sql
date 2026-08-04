CREATE TABLE public.archivo_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  foto text,
  es_policia boolean NOT NULL DEFAULT false,
  game_id text,
  veto_sapd boolean NOT NULL DEFAULT false,
  veto_edsa boolean NOT NULL DEFAULT false,
  veto_staff boolean NOT NULL DEFAULT false,
  cap_m4 boolean NOT NULL DEFAULT false,
  cap_edc boolean NOT NULL DEFAULT false,
  cap_mary boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.archivo_personas TO service_role;
ALTER TABLE public.archivo_personas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.archivo_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.archivo_personas(id) ON DELETE CASCADE,
  autor text,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.archivo_notas TO service_role;
ALTER TABLE public.archivo_notas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER touch_archivo_personas BEFORE UPDATE ON public.archivo_personas
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_archivo_notas BEFORE UPDATE ON public.archivo_notas
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS can_edit_files boolean NOT NULL DEFAULT false;