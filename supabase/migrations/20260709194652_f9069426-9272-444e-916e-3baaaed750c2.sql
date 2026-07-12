CREATE TABLE public.rnap_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo text NOT NULL,
  tipo_documento text,
  numero_documento text,
  fecha_nacimiento text,
  nacionalidad text,
  emitido_por text,
  emitido_fecha text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rnap_certificates TO anon, authenticated;
GRANT ALL ON public.rnap_certificates TO service_role;
ALTER TABLE public.rnap_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read rnap" ON public.rnap_certificates FOR SELECT USING (true);
CREATE POLICY "public insert rnap" ON public.rnap_certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "public update rnap" ON public.rnap_certificates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete rnap" ON public.rnap_certificates FOR DELETE USING (true);
CREATE TRIGGER trg_rnap_updated BEFORE UPDATE ON public.rnap_certificates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();