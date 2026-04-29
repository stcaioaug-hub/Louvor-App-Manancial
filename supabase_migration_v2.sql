-- =========================================================================================
-- MANANCIAL V2 - NON-DESTRUCTIVE EVOLUTION SCHEMA
-- Criação de relações para substituir event.team e event.attendance sem perder backwards compat.
-- =========================================================================================

-- 1. Criação das novas tabelas filhas (Entidades Relacionais)

-- Tabela: event_assignments (Substitui parte do 'team' JSONB: vocal e instruments)
CREATE TABLE IF NOT EXISTS public.event_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.worship_events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  functional_role TEXT NOT NULL, -- 'vocal', 'acoustic_guitar', 'keys', 'drums', etc.
  instrument TEXT, -- Para detalhar se for instrumentista
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evita duplo assignment da mesma função pro mesmo membro no mesmo evento.
ALTER TABLE public.event_assignments
ADD CONSTRAINT uq_event_member_role UNIQUE (event_id, member_id, functional_role);

-- Tabela: event_attendance (Substitui 'attendance' JSONB)
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.worship_events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_attendance
ADD CONSTRAINT uq_event_attendance_member UNIQUE (event_id, member_id);

-- Tabela: song_favorites
CREATE TABLE IF NOT EXISTS public.song_favorites (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (profile_id, song_id)
);

-- Tabela: song_suggestions
CREATE TABLE IF NOT EXISTS public.song_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  link_url TEXT,
  youtube_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

ALTER TABLE public.song_suggestions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Habilitando RLS

ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_suggestions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso

-- Permite Leitura Global base para assinaturas e escalas.
CREATE POLICY "Public Read Assignments" ON public.event_assignments FOR SELECT USING (true);
CREATE POLICY "Public Read Attendance" ON public.event_attendance FOR SELECT USING (true);
CREATE POLICY "Public Read Suggestions" ON public.song_suggestions FOR SELECT USING (true);

-- Favoritos só podem ser lidos e editados pelo próprio usuário.
CREATE POLICY "Users Own Favorites" ON public.song_favorites FOR ALL USING (auth.uid() = profile_id);

-- Modificações de Assignments/Attendance e Suggestions por Ministros.
CREATE POLICY "Minister Full Assignments" ON public.event_assignments FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

CREATE POLICY "Minister Full Attendance" ON public.event_attendance FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

-- Sugestões podem ser criadas por quem as solicitou.
DROP POLICY IF EXISTS "Insert Own Suggestions" ON public.song_suggestions;
CREATE POLICY "Insert Own Suggestions" ON public.song_suggestions FOR INSERT 
  WITH CHECK (auth.uid() = suggested_by OR suggested_by IS NULL);

DROP POLICY IF EXISTS "Minister Full Suggestions" ON public.song_suggestions;
CREATE POLICY "Minister Full Suggestions" ON public.song_suggestions FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('minister', 'pastor')));

-- 4. Função de Sincronia / Backfill
-- Tenta mapear nomes dos JSONBs antigos para UUIDs das novas tabelas. Recomendado rodar sob demanda.

CREATE OR REPLACE FUNCTION backfill_event_relations() RETURNS VOID AS $$
DECLARE
  v_event RECORD;
  v_member_name TEXT;
  v_instrument_key TEXT;
  v_instrument_val TEXT;
  v_member_id UUID;
  v_attendance_key TEXT;
  v_attendance_val BOOLEAN;
BEGIN
  -- Percorre todos os eventos para converter teams passados
  FOR v_event IN SELECT id, team, attendance FROM public.worship_events LOOP
    
    -- Tratar Vocais do JSONB
    IF v_event.team ? 'vocal' THEN
      FOR v_member_name IN SELECT * FROM jsonb_array_elements_text(v_event.team->'vocal') LOOP
        -- Busca member por nome aproximado (sensível a exatidão pra evitar crash)
        SELECT id INTO v_member_id FROM team_members WHERE name ILIKE v_member_name LIMIT 1;
        
        IF v_member_id IS NOT NULL THEN
          INSERT INTO event_assignments (event_id, member_id, functional_role)
          VALUES (v_event.id, v_member_id, 'vocal')
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    -- Tratar Instrumentos (Chave-Valor)
    IF v_event.team ? 'instruments' THEN
      FOR v_instrument_key, v_instrument_val IN SELECT * FROM jsonb_each_text(v_event.team->'instruments') LOOP
        SELECT id INTO v_member_id FROM team_members WHERE name ILIKE v_instrument_val LIMIT 1;

        IF v_member_id IS NOT NULL THEN
          INSERT INTO event_assignments (event_id, member_id, functional_role, instrument)
          VALUES (v_event.id, v_member_id, 'musician', v_instrument_key)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    -- Tratar Presença (Attendance)
    IF v_event.attendance IS NOT NULL AND v_event.attendance::text != '{}' THEN
      FOR v_attendance_key, v_attendance_val IN SELECT * FROM jsonb_each_text(v_event.attendance) LOOP
        -- Como a key antes erra baseada no nome (ex: "Caio"), precisamos localizar
        SELECT id INTO v_member_id FROM team_members WHERE name ILIKE v_attendance_key LIMIT 1;

        IF v_member_id IS NOT NULL THEN
          INSERT INTO event_attendance (event_id, member_id, status)
          VALUES (v_event.id, v_member_id, CASE WHEN v_attendance_val::BOOLEAN THEN 'confirmed' ELSE 'declined' END)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Realtime Publication
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE event_assignments;
  ALTER PUBLICATION supabase_realtime ADD TABLE event_attendance;
  ALTER PUBLICATION supabase_realtime ADD TABLE song_suggestions;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
