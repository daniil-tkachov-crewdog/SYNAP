CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE public.messages (
  id                  uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid             NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id             uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                public.message_role NOT NULL,
  content             text             NOT NULL,
  ai_provider         text,
  is_context_summary  boolean          NOT NULL DEFAULT false,
  metadata            jsonb            NOT NULL DEFAULT '{}',
  created_at          timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at ASC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
  ON public.messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for messages (so the web app gets live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
