import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { conversationId } = req.body

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

  // Mark all messages in this conversation as read (except ones sent by current user)
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('read', false)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ message: 'Messages marked as read' })
}