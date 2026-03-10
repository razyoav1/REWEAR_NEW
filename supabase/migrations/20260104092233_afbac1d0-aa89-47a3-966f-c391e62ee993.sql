-- Allow admins to view ALL conversations
CREATE POLICY "Admins can view all conversations" 
ON public.conversations 
FOR SELECT 
USING (is_admin());

-- Allow admins to update any conversation (for moderation - disable/enable)
CREATE POLICY "Admins can update any conversation" 
ON public.conversations 
FOR UPDATE 
USING (is_admin());

-- Allow admins to view ALL messages
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (is_admin());