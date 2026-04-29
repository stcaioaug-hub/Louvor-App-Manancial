-- 🚀 SUPABASE SCHEMA FOR MINISTÉRIO DE LOUVOR MANANCIAL

-- 1. ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('service', 'rehearsal');
  END IF;
END $$;

-- 2. SONGS TABLE
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  bpm INTEGER,
  "key" TEXT NOT NULL,
  proficiency INTEGER DEFAULT 0 CHECK (proficiency >= 0 AND proficiency <= 5),
  difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 5),
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  last_played TIMESTAMPTZ,
  chords_url TEXT,
  lyrics_url TEXT,
  video_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 5);

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL,
  avatar_url TEXT,
  is_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WORSHIP EVENTS TABLE
CREATE TABLE IF NOT EXISTS worship_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  "time" TIME NOT NULL,
  title TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'service',
  location TEXT DEFAULT 'Igreja Manancial',
  description TEXT,
  team JSONB DEFAULT '{"vocal": [], "instruments": {}}'::JSONB,
  attendance JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE worship_events
ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '{}'::JSONB;

-- 5. JUNCTION TABLE FOR EVENTS AND SONGS (SETLIST)
CREATE TABLE IF NOT EXISTS event_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES worship_events(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE RESTRICT,
  is_outro BOOLEAN DEFAULT FALSE,
  is_offering BOOLEAN DEFAULT FALSE,
  "position" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE event_songs
ADD COLUMN IF NOT EXISTS is_offering BOOLEAN DEFAULT FALSE;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_songs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for now)
DROP POLICY IF EXISTS "Public Read" ON songs;
DROP POLICY IF EXISTS "Public Read" ON team_members;
DROP POLICY IF EXISTS "Public Read" ON worship_events;
DROP POLICY IF EXISTS "Public Read" ON event_songs;
CREATE POLICY "Public Read" ON songs FOR SELECT USING (true);
CREATE POLICY "Public Read" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public Read" ON worship_events FOR SELECT USING (true);
CREATE POLICY "Public Read" ON event_songs FOR SELECT USING (true);

-- Enable all operations for manual tests/dev (REPLACE WITH AUTH POLICIES LATER)
DROP POLICY IF EXISTS "Dev Full Access" ON songs;
DROP POLICY IF EXISTS "Dev Full Access" ON team_members;
DROP POLICY IF EXISTS "Dev Full Access" ON worship_events;
DROP POLICY IF EXISTS "Dev Full Access" ON event_songs;
CREATE POLICY "Dev Full Access" ON songs FOR ALL USING (true);
CREATE POLICY "Dev Full Access" ON team_members FOR ALL USING (true);
CREATE POLICY "Dev Full Access" ON worship_events FOR ALL USING (true);
CREATE POLICY "Dev Full Access" ON event_songs FOR ALL USING (true);

-- Keep updated_at in sync automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS songs_set_updated_at ON songs;
CREATE TRIGGER songs_set_updated_at
BEFORE UPDATE ON songs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS team_members_set_updated_at ON team_members;
CREATE TRIGGER team_members_set_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS worship_events_set_updated_at ON worship_events;
CREATE TRIGGER worship_events_set_updated_at
BEFORE UPDATE ON worship_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 7. ENABLE REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE songs;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE worship_events;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_songs;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 8. PROFILES TABLE AND ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'musician', -- 'minister' or 'musician'
  avatar_url TEXT,
  functional_role TEXT, -- 'vocal', 'musician', 'minister', 'pastor'
  instrument TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'musician';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS functional_role TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instrument TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profile Read" ON public.profiles;
CREATE POLICY "Public Profile Read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle profile creation
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at in sync for profiles
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 9. AUTH BASED RLS POLICIES (UPDATE EXISTING ONES)
-- Only ministers can modify songs, events, etc.
-- Musicians can only select/read.

DROP POLICY IF EXISTS "Dev Full Access" ON public.songs;
DROP POLICY IF EXISTS "Minister Full Access" ON public.songs;
CREATE POLICY "Minister Full Access" ON public.songs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

DROP POLICY IF EXISTS "Dev Full Access" ON public.team_members;
DROP POLICY IF EXISTS "Minister Full Access" ON public.team_members;
CREATE POLICY "Minister Full Access" ON public.team_members FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

DROP POLICY IF EXISTS "Dev Full Access" ON public.worship_events;
DROP POLICY IF EXISTS "Minister Full Access" ON public.worship_events;
CREATE POLICY "Minister Full Access" ON public.worship_events FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

DROP POLICY IF EXISTS "Dev Full Access" ON public.event_songs;
DROP POLICY IF EXISTS "Minister Full Access" ON public.event_songs;
CREATE POLICY "Minister Full Access" ON public.event_songs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

-- 10. ENABLE REALTIME FOR PROFILES
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
