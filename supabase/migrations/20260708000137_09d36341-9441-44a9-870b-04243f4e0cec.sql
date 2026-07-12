
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "public insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update app_settings" ON public.app_settings FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES ('discord_webhook_url', '') ON CONFLICT (key) DO NOTHING;
