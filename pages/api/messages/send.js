import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { conversationId, content } = req.body

  if (!conversationId || !content) {
    return res.status(400).json({ error: 'Conversation ID and content are required' })
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

  // Send the message
  const { data: message, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      message_type: 'text',
      read: false
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(201).json(message)
}