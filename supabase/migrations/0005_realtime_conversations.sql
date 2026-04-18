-- Enable Realtime for conversations so sidebar updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Enable Realtime for memory facts so memory page updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_facts;
