import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { sport } = req.query // Optional filter by sport

  // 1. Get all players (profiles with role 'player')
  let query = supabase
    .from('profiles')
    .select('id, username, role, avatar_url, height, created_at')
    .eq('role', 'player')

  const { data: allPlayers, error: playersError } = await query

  if (playersError) {
    return res.status(500).json({ error: playersError.message })
  }

  // 2. Get all team memberships
  const { data: allMemberships, error: membershipsError } = await supabase
    .from('team_members')
    .select('player_id, teams(sport)')

  if (membershipsError) {
    return res.status(500).json({ error: membershipsError.message })
  }

  // 3. Create a map of player IDs who are in teams
  const playersInTeams = new Set()
  const playerSports = {} // Map player_id to sports they're playing

  if (allMemberships) {
    allMemberships.forEach(membership => {
      playersInTeams.add(membership.player_id)
      if (!playerSports[membership.player_id]) {
        playerSports[membership.player_id] = []
      }
      if (membership.teams?.sport) {
        playerSports[membership.player_id].push(membership.teams.sport)
      }
    })
  }

  // 4. Filter available players (not in any team)
  const availablePlayers = allPlayers.filter(player => !playersInTeams.has(player.id))

  // 5. Get unavailable players with their team info
  const unavailablePlayers = allPlayers
    .filter(player => playersInTeams.has(player.id))
    .map(player => ({
      ...player,
      sports: [...new Set(playerSports[player.id] || [])]
    }))

  // 6. Apply sport filter if provided
  let filteredAvailable = availablePlayers
  let filteredUnavailable = unavailablePlayers

  if (sport) {
    filteredUnavailable = unavailablePlayers.filter(player => 
      player.sports.includes(sport)
    )
  }

  // 7. Build response
  const responseData = {
    summary: {
      totalPlayers: allPlayers.length,
      availablePlayers: filteredAvailable.length,
      unavailablePlayers: filteredUnavailable.length
    },
    available: filteredAvailable.map(player => ({
      id: player.id,
      username: player.username,
      avatar_url: player.avatar_url,
      height: player.height,
      status: 'available',
      memberSince: player.created_at
    })),
    unavailable: filteredUnavailable.map(player => ({
      id: player.id,
      username: player.username,
      avatar_url: player.avatar_url,
      height: player.height,
      status: 'unavailable',
      sports: player.sports,
      memberSince: player.created_at
    }))
  }

  return res.status(200).json(responseData)
}