import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // 1. Get conversations (Added 'deleted_by' to selection)
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      created_at,
      deleted_by, 
      user1:user1_id(id, username, avatar_url, role),
      user2:user2_id(id, username, avatar_url, role)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // 2. CRITICAL FIX: Filter out conversations the user has deleted
  const visibleConversations = conversations.filter(c => 
    !c.deleted_by || !c.deleted_by.includes(user.id)
  )

  // 3. Get details for each visible conversation
  const conversationsWithDetails = await Promise.all(
    visibleConversations.map(async (conv) => {
      const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1

      // Get last message (Ensure we don't fetch one we deleted)
      // Note: We fetch 5 here to be safe, in case the very last one was deleted by us,
      // we can fallback to the one before it in JS.
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('content, created_at, deleted_by')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      // Find the first message that hasn't been deleted by current user
      const lastMsg = lastMessages?.find(m => 
        !m.deleted_by || !m.deleted_by.includes(user.id)
      )

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_id', otherUser.id)
        .eq('read', false)

      return {
        id: conv.id,
        otherUser: otherUser,
        // If no valid message found, show 'No messages'
        lastMessage: lastMsg?.content || 'No messages yet',
        lastMessageTime: lastMsg?.created_at || conv.created_at,
        unreadCount: unreadCount || 0
      }
    })
  )

  // 4. Sort by last message time
  conversationsWithDetails.sort((a, b) => 
    new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  )

  return res.status(200).json(conversationsWithDetails)
}