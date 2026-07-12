
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Instructor';
UPDATE public.instructors SET role = 'Comisario' WHERE is_alto_mando = true;

ALTER TABLE public.records ADD COLUMN IF NOT EXISTS instructor_asignado TEXT;
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS ultima_edicion_por TEXT;

INSERT INTO public.records (nombre_old, nombre_new, motivo, rango_old, rango_new, pasa, discord) VALUES
('David Lazo','David Lazo','Renuncia','Sargento','Cabo','No EDSA','Maikel.1242'),
('Valhalla Khyzzy','','Renuncia','Oficial','Cadete','No Nombre','_oid'),
('Daren Santos','Scarlett Santos','Expulsion','Cadete','Cadete','---','Calito0753'),
('Shawty Ramirez – Karina Beckenbauer','Shawty Lampard','Renuncia','Cabo','Oficial','Si','herber2k'),
('Harvey Shikpa','Harvey Shikpa','Renuncia','Capitan','Teniente','Si','Woodstar'),
('Keilyn Vidal','Keilyn Vidal','Renuncia','Sargento','Cabo','Si','Nicole721'),
('Luciano Quintero','Luciano Quintero','Expulsion Vetado','X','X','No Vetado','Luciano_mayweah'),
('Karma Naz','Karma Naz','Expulsion','Oficial','Cadete','Si','Se.xo'),
('Aless_Soto','Air_Blair','Renuncia','Cadete','Cadete','Si','l.a_k'),
('Alex Kamado','Moises Rodríguez','Renuncia','Cadete','X','No Sin regitros','the_daniel09'),
('Oscar Monasterio','Oscar Monasterio','Inactividad','Cadete','Cadete','','alejandro.mbb'),
('Marko Bennett','London Vheghton','Renuncia','Cabo','Oficial','Si','thuglifebetterdayz'),
('Franco Tornillo','Franco Tornillo','Renuncia','Cabo','Oficial','Si','alembibarra'),
('Paul Ivanov','Paul Headklouz','Renuncia','Cabo','Oficial','Si','_1vann.'),
('Juan Marchetti','Juan Marchetti','Expulsion Inactividad','Oficial','Cadete','Si','Juan_Marchetti');
