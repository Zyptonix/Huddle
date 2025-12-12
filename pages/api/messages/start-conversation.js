import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { otherUserId } = req.body

  if (!otherUserId) {
    return res.status(400).json({ error: 'Other user ID is required' })
  }

  // Check if conversation already exists
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id, user1:user1_id(id, username, avatar_url, role), user2:user2_id(id, username, avatar_url, role)')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
    .single()

  if (existingConversation) {
    // Return existing conversation with proper otherUser
    const otherUser = existingConversation.user1_id === user.id 
      ? existingConversation.user2 
      : existingConversation.user1

    return res.status(200).json({
      id: existingConversation.id,
      otherUser: otherUser
    })
  }

  // Create new conversation
  const { data: newConversation, error: convError } = await supabase
    .from('conversations')
    .insert([{
      user1_id: user.id,
      user2_id: otherUserId
    }])
    .select('id, user1_id, user2_id')
    .single()

  if (convError) return res.status(500).json({ error: convError.message })

  // Get other user's profile
  const { data: otherUserProfile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .eq('id', otherUserId)
    .single()

  return res.status(201).json({
    id: newConversation.id,
    otherUser: otherUserProfile
  })
}