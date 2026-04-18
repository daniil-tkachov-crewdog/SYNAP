CREATE TABLE public.conversations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text,
  current_ai       text        NOT NULL DEFAULT 'chatgpt',
  memory_injected  boolean     NOT NULL DEFAULT false,
  last_message_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_user_last_msg_idx
  ON public.conversations (user_id, last_message_at DESC NULLS LAST);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
