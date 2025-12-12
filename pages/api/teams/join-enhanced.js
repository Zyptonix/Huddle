import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { joinCode } = req.body

  if (!joinCode) {
    return res.status(400).json({ error: 'Join code is required' })
  }

  // 1. Find the team by join code
  const { data: team, error: teamError } = await supabaseServer
    .from('teams')
    .select('id, name, sport')
    .eq('join_code', joinCode)
    .single()

  if (teamError || !team) {
    return res.status(404).json({ error: 'Invalid join code. Team not found.' })
  }

  // 2. Check current availability status
  const { data: existingMemberships } = await supabaseServer
    .from('team_members')
    .select('id, teams(name, sport)')
    .eq('player_id', user.id)

  const isCurrentlyAvailable = !existingMemberships || existingMemberships.length === 0

  // 3. Check if already a member of THIS specific team
  const alreadyInThisTeam = existingMemberships?.some(m => m.teams?.name === team.name)

  if (alreadyInThisTeam) {
    return res.status(400).json({ 
      error: 'You are already in this team.',
      availability: {
        status: 'unavailable',
        teamCount: existingMemberships.length
      }
    })
  }

  // 4. Add player to the team
  const { data: newMembership, error: joinError } = await supabaseServer
    .from('team_members')
    .insert([
      {
        team_id: team.id,
        player_id: user.id
      }
    ])
    .select()
    .single()

  if (joinError) return res.status(500).json({ error: joinError.message })

  // 5. Calculate new availability status
  const newTeamCount = (existingMemberships?.length || 0) + 1
  const newAvailabilityStatus = {
    wasAvailable: isCurrentlyAvailable,
    isNowAvailable: false, // Now unavailable since they joined a team
    status: 'unavailable',
    teamCount: newTeamCount,
    teams: [
      ...(existingMemberships?.map(m => m.teams.name) || []),
      team.name
    ]
  }

  return res.status(200).json({ 
    message: `Successfully joined ${team.name}!`,
    team: {
      id: team.id,
      name: team.name,
      sport: team.sport
    },
    membership: newMembership,
    availability: newAvailabilityStatus
  })
}