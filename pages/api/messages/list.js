import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { conversationId } = req.query

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID is required' })
  }

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('user1_id, user2_id')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
    return res.status(403).json({ error: 'You are not part of this conversation' })
  }

  // Get all messages in this conversation
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json(messages)
}