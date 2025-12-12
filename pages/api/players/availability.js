import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { playerId } = req.query
  const targetPlayerId = playerId || user.id

  // 1. Get player profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, role, avatar_url')
    .eq('id', targetPlayerId)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Player not found' })
  }

  // 2. Check if player is part of any team
  // FIX: Changed 'player_id' to 'user_id' to match your DB schema
  const { data: teamMemberships, error: membershipError } = await supabase
    .from('team_members')
    .select(`
      id,
      created_at,
      teams (
        id,
        name,
        sport,
        owner_id 
      )
    `)
    .eq('user_id', targetPlayerId) // <--- THIS WAS THE ERROR (was player_id)

  if (membershipError) {
    console.error("Membership Fetch Error:", membershipError) // Log for debugging
    return res.status(500).json({ error: membershipError.message })
  }

  // 3. Determine availability
  const isAvailable = !teamMemberships || teamMemberships.length === 0
  const teamCount = teamMemberships ? teamMemberships.length : 0

  // 4. Build response
  const responseData = {
    player: {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      avatar_url: profile.avatar_url
    },
    availability: {
      isAvailable,
      status: isAvailable ? 'available' : 'unavailable',
      reason: isAvailable ? 'Not part of any team' : `Currently in ${teamCount} team${teamCount > 1 ? 's' : ''}`
    },
    teams: teamMemberships ? teamMemberships.map(m => ({
      id: m.teams?.id,
      name: m.teams?.name,
      sport: m.teams?.sport,
      // Note: joined_at might not exist in your schema, using created_at from team_members
      joinedAt: m.created_at 
    })) : [],
    teamCount
  }

  return res.status(200).json(responseData)
}