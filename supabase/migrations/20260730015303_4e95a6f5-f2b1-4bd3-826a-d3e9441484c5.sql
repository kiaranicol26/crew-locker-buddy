CREATE TABLE public.salary_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_months TO anon, authenticated;
GRANT ALL ON public.salary_months TO service_role;
ALTER TABLE public.salary_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read salary_months" ON public.salary_months FOR SELECT USING (true);
CREATE POLICY "public insert salary_months" ON public.salary_months FOR INSERT WITH CHECK (true);
CREATE POLICY "public update salary_months" ON public.salary_months FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete salary_months" ON public.salary_months FOR DELETE USING (true);

CREATE TABLE public.salary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id uuid NOT NULL REFERENCES public.salary_months(id) ON DELETE CASCADE,
  nombre text,
  paga numeric NOT NULL DEFAULT 0,
  pagado boolean NOT NULL DEFAULT false,
  ultima_edicion_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX salary_entries_month_id_idx ON public.salary_entries(month_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_entries TO anon, authenticated;
GRANT ALL ON public.salary_entries TO service_role;
ALTER TABLE public.salary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read salary_entries" ON public.salary_entries FOR SELECT USING (true);
CREATE POLICY "public insert salary_entries" ON public.salary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "public update salary_entries" ON public.salary_entries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete salary_entries" ON public.salary_entries FOR DELETE USING (true);

CREATE TRIGGER touch_salary_months BEFORE UPDATE ON public.salary_months FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_salary_entries BEFORE UPDATE ON public.salary_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();