-- Delta para a integração de IA no cadastro/aprovação de louvores.
-- Rode no SQL Editor do Supabase antes de usar o fluxo com o banco remoto.

ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE TABLE IF NOT EXISTS public.song_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  youtube_url TEXT,
  notes TEXT,
  suggested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'song_suggestions'
      AND column_name = 'link_url'
  ) THEN
    UPDATE public.song_suggestions
    SET youtube_url = COALESCE(youtube_url, link_url)
    WHERE youtube_url IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'song_suggestions'
      AND column_name = 'profile_id'
  ) THEN
    UPDATE public.song_suggestions
    SET suggested_by = COALESCE(suggested_by, profile_id)
    WHERE suggested_by IS NULL;
  END IF;
END $$;

ALTER TABLE public.song_suggestions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Public Read Suggestions" ON public.song_suggestions;
CREATE POLICY "Public Read Suggestions" ON public.song_suggestions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Insert Own Suggestions" ON public.song_suggestions;
CREATE POLICY "Insert Own Suggestions" ON public.song_suggestions
FOR INSERT
WITH CHECK (suggested_by IS NULL OR auth.uid() = suggested_by);

DROP POLICY IF EXISTS "Minister Full Suggestions" ON public.song_suggestions;
CREATE POLICY "Minister Full Suggestions" ON public.song_suggestions
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
));

DROP TRIGGER IF EXISTS song_suggestions_set_updated_at ON public.song_suggestions;
CREATE TRIGGER song_suggestions_set_updated_at
BEFORE UPDATE ON public.song_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.song_suggestions;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
