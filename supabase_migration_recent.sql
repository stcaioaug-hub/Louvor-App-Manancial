-- Delta de migracao para alinhar um projeto Supabase antigo
-- com o app atual de autenticacao, onboarding e perfil.

-- 1. Garantir colunas usadas pelo app atual
ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 5);

ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

ALTER TABLE public.worship_events
ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '{}'::JSONB;

-- 2. updated_at compartilhado
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Perfis vinculados ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'musician',
  avatar_url TEXT,
  functional_role TEXT,
  instrument TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'musician';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS functional_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instrument TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profile Read" ON public.profiles;
CREATE POLICY "Public Profile Read" ON public.profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, role, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE
      WHEN NEW.email IN ('caiogustavo.3@hotmail.com', 'silvia@manancial.com') THEN 'minister'
      ELSE 'musician'
    END,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. Permissoes dos dados principais
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read" ON public.songs;
DROP POLICY IF EXISTS "Public Read" ON public.team_members;
DROP POLICY IF EXISTS "Public Read" ON public.worship_events;
DROP POLICY IF EXISTS "Public Read" ON public.event_songs;

CREATE POLICY "Public Read" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.worship_events FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.event_songs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Dev Full Access" ON public.songs;
DROP POLICY IF EXISTS "Minister Full Access" ON public.songs;
CREATE POLICY "Minister Full Access" ON public.songs
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
));

DROP POLICY IF EXISTS "Dev Full Access" ON public.team_members;
DROP POLICY IF EXISTS "Minister Full Access" ON public.team_members;
CREATE POLICY "Minister Full Access" ON public.team_members
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
));

DROP POLICY IF EXISTS "Dev Full Access" ON public.worship_events;
DROP POLICY IF EXISTS "Minister Full Access" ON public.worship_events;
CREATE POLICY "Minister Full Access" ON public.worship_events
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
));

DROP POLICY IF EXISTS "Dev Full Access" ON public.event_songs;
DROP POLICY IF EXISTS "Minister Full Access" ON public.event_songs;
CREATE POLICY "Minister Full Access" ON public.event_songs
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid() AND role IN ('minister', 'pastor')
));

-- 5. Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.worship_events;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_songs;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 6. Opcional: promover administradores por e-mail
-- Troque os e-mails abaixo se necessario e rode este bloco separado:
-- UPDATE public.profiles p
-- SET role = 'minister'
-- FROM auth.users u
-- WHERE p.id = u.id
--   AND u.email IN ('seu-email@dominio.com', 'outro-email@dominio.com');
