import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can send invitations.' })
  }

  const { playerId, teamId, teamName, joinCode, coachName } = req.body

  if (!playerId || !teamId || !teamName || !joinCode) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Verify ownership of the team
  // FIX: Changed 'coach_id' to 'owner_id'
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('owner_id', user.id) // <--- THIS WAS THE CAUSE OF THE 403 ERROR
    .single()

  if (!team) {
    return res.status(403).json({ error: 'You do not own this team.' })
  }

  // Check if player is already in a team (Double check)
  // FIX: Ensure we check 'user_id' not 'player_id' if your schema uses user_id for members
  const { data: existingMemberships } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', playerId) // Changed to user_id to be safe, matching previous fixes

  if (existingMemberships && existingMemberships.length > 0) {
    return res.status(400).json({ error: 'Player is already in a team and unavailable.' })
  }

  // --- Conversation Logic ---
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${playerId}),and(user1_id.eq.${playerId},user2_id.eq.${user.id})`)
    .single()

  let conversationId

  if (existingConversation) {
    conversationId = existingConversation.id
  } else {
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert([{
        user1_id: user.id,
        user2_id: playerId
      }])
      .select()
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return res.status(500).json({ error: 'Failed to create conversation' })
    }

    conversationId = newConversation.id
  }

  const messageContent = `🏆 Team Invitation

Hello! I'm ${coachName}, and I'd like to invite you to join my team "${teamName}".

Use this join code to accept the invitation:
📋 ${joinCode}

Looking forward to having you on the team!`

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent,
      message_type: 'team_invitation',
      metadata: {
        teamId: teamId,
        teamName: teamName,
        joinCode: joinCode,
        invitationType: 'team_join'
      }
    }])
    .select()
    .single()

  if (messageError) {
    console.error('Error sending message:', messageError)
    return res.status(500).json({ error: 'Failed to send invitation message' })
  }

  return res.status(200).json({ 
    message: 'Invitation sent successfully',
    conversationId: conversationId,
    messageData: message
  })
}