
CREATE TABLE public.instructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_alto_mando BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructors TO anon, authenticated;
GRANT ALL ON public.instructors TO service_role;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read instructors" ON public.instructors FOR SELECT USING (true);
CREATE POLICY "public insert instructors" ON public.instructors FOR INSERT WITH CHECK (true);
CREATE POLICY "public update instructors" ON public.instructors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete instructors" ON public.instructors FOR DELETE USING (true);

INSERT INTO public.instructors (id, name, is_alto_mando, created_by) VALUES
  ('M-104WZRP', 'Mike', true, 'system'),
  ('K-105WZRP', 'Kendo', true, 'system');

CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_old TEXT,
  nombre_new TEXT,
  motivo TEXT,
  rango_old TEXT,
  rango_new TEXT,
  pasa TEXT,
  discord TEXT,
  nota_final TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO anon, authenticated;
GRANT ALL ON public.records TO service_role;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read records" ON public.records FOR SELECT USING (true);
CREATE POLICY "public insert records" ON public.records FOR INSERT WITH CHECK (true);
CREATE POLICY "public update records" ON public.records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete records" ON public.records FOR DELETE USING (true);

CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id TEXT,
  instructor_name TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.logs TO anon, authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read logs" ON public.logs FOR SELECT USING (true);
CREATE POLICY "public insert logs" ON public.logs FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER records_touch BEFORE UPDATE ON public.records
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
