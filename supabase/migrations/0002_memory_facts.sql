CREATE TYPE public.memory_category AS ENUM (
  'personal',
  'preferences',
  'professional',
  'custom'
);

CREATE TABLE public.memory_facts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   public.memory_category NOT NULL DEFAULT 'custom',
  key        text        NOT NULL CHECK (char_length(key) > 0),
  value      text        NOT NULL CHECK (char_length(value) > 0),
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX memory_facts_user_active_idx ON public.memory_facts (user_id, is_active);

ALTER TABLE public.memory_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memory facts"
  ON public.memory_facts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
