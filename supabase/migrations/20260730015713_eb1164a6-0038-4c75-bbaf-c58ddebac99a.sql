CREATE TABLE public.pd_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rango text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pd_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pd_members TO authenticated;
GRANT ALL ON public.pd_members TO service_role;

ALTER TABLE public.pd_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read pd_members" ON public.pd_members FOR SELECT USING (true);
CREATE POLICY "public insert pd_members" ON public.pd_members FOR INSERT WITH CHECK (true);
CREATE POLICY "public update pd_members" ON public.pd_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete pd_members" ON public.pd_members FOR DELETE USING (true);

CREATE TRIGGER touch_pd_members BEFORE UPDATE ON public.pd_members
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pd_members (nombre, rango) VALUES
('Abdul','Comisario'),
('Mike_Holloway','Comisario'),
('airi_hushpuppy','Comisario'),
('Kendo_Lockser','Comisario'),
('Ele_Saint','Comisario'),
('Saint_Ele','Comisario'),
('Lukas_Rivera','Comisario'),
('Izhan_Sunderstard','Inspector'),
('Jhon_Conor','Capitan'),
('Aslan_Mog','Teniente'),
('Harvey_Shikpa','Teniente'),
('Santiago_Pearson','Sargento'),
('Camilo_Campos','Sargento'),
('Luis_Cornielis','Sargento'),
('Kristen_Schoettle','Sargento'),
('Derek_Frost','Sargento'),
('Luar_Vuitton','Sargento'),
('Scarlett_Harper','Cabo'),
('Kitto_Murzynek','Cabo'),
('Larsen_Mcgarrett','Cabo'),
('Storm_Lampard','Oficial'),
('Paul_Headklouz','Oficial'),
('Nick_Hawks','Oficial'),
('Keilyn_Vidal','Oficial'),
('Alejandra_White','Cadete'),
('Zeller_Nhykerz','Cadete'),
('Daren_Santos','Cadete'),
('air_blair','Cadete'),
('Nicolas_Murcia','Cadete'),
('Damn_Vercetti','Cadete'),
('Ethan_Rashford','Cadete'),
('Karma_Naz','Cadete'),
('Juan_Ferrara','Cadete'),
('albehrto_mog','Cadete'),
('Morgan_Sremmonds','Cadete'),
('Juan_Ropero','Cadete');