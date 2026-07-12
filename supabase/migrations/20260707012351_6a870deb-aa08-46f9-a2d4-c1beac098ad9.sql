CREATE TABLE public.aspirantes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pasa text,
  nombre text,
  dp text,
  instructor text,
  puntuacion_seleccion numeric,
  puntuacion_final numeric,
  notas text,
  updated_by text,
  ultima_edicion_por text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aspirantes TO anon, authenticated;
GRANT ALL ON public.aspirantes TO service_role;
ALTER TABLE public.aspirantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read aspirantes" ON public.aspirantes FOR SELECT USING (true);
CREATE POLICY "public insert aspirantes" ON public.aspirantes FOR INSERT WITH CHECK (true);
CREATE POLICY "public update aspirantes" ON public.aspirantes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete aspirantes" ON public.aspirantes FOR DELETE USING (true);
CREATE TRIGGER touch_aspirantes_updated_at BEFORE UPDATE ON public.aspirantes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();