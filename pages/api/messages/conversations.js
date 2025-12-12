import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Get all conversations where user is either user1 or user2
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      created_at,
      user1:user1_id(id, username, avatar_url, role),
      user2:user2_id(id, username, avatar_url, role)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // For each conversation, get the last message and unread count
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      // Determine who the "other user" is
      const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1

      // Get last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Get unread message count (messages sent by other user that current user hasn't read)
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_id', otherUser.id)
        .eq('read', false)

      return {
        id: conv.id,
        otherUser: otherUser,
        lastMessage: lastMsg?.content || 'No messages yet',
        lastMessageTime: lastMsg?.created_at || conv.created_at,
        unreadCount: unreadCount || 0
      }
    })
  )

  // Sort by last message time
  conversationsWithDetails.sort((a, b) => 
    new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  )

  return res.status(200).json(conversationsWithDetails)
}