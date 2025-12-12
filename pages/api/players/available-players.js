import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { sport } = req.query 

  // 1. Get all players
  let query = supabase
    .from('profiles')
    .select('id, username, role, avatar_url, height, created_at')
    .eq('role', 'player')

  const { data: allPlayers, error: playersError } = await query

  if (playersError) {
    return res.status(500).json({ error: playersError.message })
  }

  // 2. Get all team memberships
  // FIX: Changed 'player_id' to 'user_id' to match your DB schema
  const { data: allMemberships, error: membershipsError } = await supabase
    .from('team_members')
    .select('user_id, teams(sport)') 

  if (membershipsError) {
    // This was causing the 500 error before
    return res.status(500).json({ error: membershipsError.message })
  }

  // 3. Create a map of player IDs who are in teams
  const playersInTeams = new Set()
  const playerSports = {} 

  if (allMemberships) {
    allMemberships.forEach(membership => {
      // FIX: Use 'user_id' here too
      const memberId = membership.user_id 
      
      playersInTeams.add(memberId)
      
      if (!playerSports[memberId]) {
        playerSports[memberId] = []
      }
      if (membership.teams?.sport) {
        playerSports[memberId].push(membership.teams.sport)
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

  // 6. Apply sport filter
  let filteredAvailable = availablePlayers
  let filteredUnavailable = unavailablePlayers

  if (sport) {
    // Note: Available players don't have a sport yet, so filtering them by sport usually implies 
    // you want players who play that sport, or just empty list. 
    // Standard logic: Show all available, or filter unavailable by their team's sport.
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