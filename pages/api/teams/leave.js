import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { teamId } = req.body

  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' })
  }

  // 1. Get team information first
  const { data: team, error: teamError } = await supabaseServer
    .from('teams')
    .select('id, name, sport, coach_id')
    .eq('id', teamId)
    .single()

  if (teamError || !team) {
    return res.status(404).json({ error: 'Team not found' })
  }

  // 2. Prevent coach from leaving their own team
  if (team.coach_id === user.id) {
    return res.status(403).json({ 
      error: 'Coaches cannot leave their own teams. Please delete the team instead.' 
    })
  }

  // 3. Verify membership exists
  const { data: membership, error: membershipError } = await supabaseServer
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('player_id', user.id)
    .single()

  if (membershipError || !membership) {
    return res.status(404).json({ error: 'You are not a member of this team.' })
  }

  // 4. Get current team count before leaving
  const { data: allMemberships, count: membershipCount } = await supabaseServer
    .from('team_members')
    .select('id', { count: 'exact' })
    .eq('player_id', user.id)

  const currentTeamCount = membershipCount || 0

  // 5. Remove player from team
  const { error: deleteError } = await supabaseServer
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('player_id', user.id)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return res.status(500).json({ error: deleteError.message })
  }

  // 6. Calculate new availability status
  const newTeamCount = currentTeamCount - 1
  const isNowAvailable = newTeamCount === 0

  const availabilityUpdate = {
    wasAvailable: currentTeamCount === 1,
    isNowAvailable,
    status: isNowAvailable ? 'available' : 'unavailable',
    remainingTeamCount: newTeamCount,
    message: isNowAvailable 
      ? 'You are now available for new teams!' 
      : `You are still in ${newTeamCount} team${newTeamCount > 1 ? 's' : ''}`
  }

  return res.status(200).json({
    message: `Successfully left ${team.name}`,
    leftTeam: {
      id: team.id,
      name: team.name,
      sport: team.sport
    },
    availability: availabilityUpdate
  })
}