import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query

  console.log("Fetching team with ID:", id)

  // 1. Fetch Team Details & Coach Info
  const { data: team, error: teamError } = await supabaseServer
    .from('teams')
    .select(`
      *,
      profiles:coach_id (
        username,
        avatar_url
      )
    `) // FIX: Removed 'email' from this select list
    .eq('id', id)
    .single()

  if (teamError) {
    console.error("Supabase Team Fetch Error:", teamError)
    return res.status(500).json({ error: teamError.message })
  }

  if (!team) {
    console.error("No team found (RLS hidden?)")
    return res.status(404).json({ error: 'Team not found' })
  }

  // 2. Fetch Roster (Team Members)
  const { data: members, error: membersError } = await supabaseServer
    .from('team_members')
    .select(`
      joined_at,
      profiles:player_id (
        id,
        username,
        height,
        avatar_url
      )
    `)
    .eq('team_id', id)

  if (membersError) {
    console.error("Roster Fetch Error:", membersError)
    return res.status(500).json({ error: membersError.message })
  }

  // Combine data
  const responseData = {
    ...team,
    coach: team.profiles,
    roster: members.map(m => ({
      ...m.profiles,
      joined_at: m.joined_at
    }))
  }

  return res.status(200).json(responseData)
}