CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  contenido text NOT NULL DEFAULT '',
  nota text,
  adjuntos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by_id text,
  created_by text,
  edited_by text,
  edited_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.forum_posts TO service_role;

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages forum posts" ON public.forum_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER touch_forum_posts BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();