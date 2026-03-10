-- Drop and recreate messages INSERT policy to check account status
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) 
  AND is_conversation_participant(auth.uid(), conversation_id) 
  AND (NOT EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.is_disabled = true
  ))
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.account_status = 'active'
  )
);