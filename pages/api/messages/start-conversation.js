import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // 1. Initialize Supabase Client
  const supabase = createPagesServerClient({ req, res })
   
  // 2. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { otherUserId } = req.body
  if (!otherUserId) return res.status(400).json({ error: 'Missing otherUserId' })

  try {
    // 3. Check if conversation exists
    const { data: existingConvo, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .maybeSingle() // Use maybeSingle to prevent crash if 0 rows

    if (fetchError) throw fetchError

    let conversation = existingConvo

    if (conversation) {
      // 4. REVIVE LOGIC: If exists but deleted by me, call the secure RPC function
      const currentDeleted = conversation.deleted_by || []
      
      if (currentDeleted.includes(user.id)) {
        // CALL THE RPC FUNCTION WE JUST CREATED
        const { data: revived, error: rpcError } = await supabase
          .rpc('revive_conversation', {
            conv_id: conversation.id,
            user_id: user.id
          })
          .maybeSingle()

        if (rpcError) throw rpcError
        
        // If revived successfully, use that data; otherwise keep existing
        if (revived) conversation = revived
      }
    } else {
      // 5. CREATE LOGIC: If no conversation exists, create a new one
      const { data: newConvo, error: createError } = await supabase
        .from('conversations')
        .insert([
          { user1_id: user.id, user2_id: otherUserId }
        ])
        .select()
        .single()

      if (createError) throw createError
      conversation = newConvo
    }

    // 6. Fetch details of the "Other User"
    const isUser1 = conversation.user1_id === user.id
    const otherIdToFetch = isUser1 ? conversation.user2_id : conversation.user1_id

    const { data: otherUserData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role')
        .eq('id', otherIdToFetch)
        .maybeSingle() // Use maybeSingle to be safe

    // 7. Return Formatted Object
    return res.status(200).json({
      ...conversation,
      otherUser: otherUserData || { username: 'Unknown User' }, // Fallback if profile missing
      unreadCount: 0,
      lastMessage: 'New conversation',
      lastMessageTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('Start Conversation Error:', error)
    // Return a clearer error so the frontend knows what happened
    return res.status(500).json({ error: error.message, details: error.details })
  }
}