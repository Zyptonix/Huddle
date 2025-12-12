import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      // 1. Fetch Basic Tournament Info
      const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

      if (tError) throw tError
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' })

      // 2. Fetch Registered Teams (Joining with the 'teams' table to get names/logos)
      const { data: teamsData, error: teamsError } = await supabase
        .from('tournament_teams')
        .select(`
          status,
          teams (
            id,
            name,
            logo_url,
            owner_id
          )
        `)
        .eq('tournament_id', id)
      
      if (teamsError) throw teamsError

      // Flatten the team structure for easier frontend use
      const teams = teamsData.map(t => ({
        ...t.teams,
        registration_status: t.status
      }))

      // 3. Fetch Matches
      const { data: matches, error: mError } = await supabase
        .from('matches')
        .select(`
          id,
          date,
          status,
          round,
          score_a,
          score_b,
          team_a: team_a_id ( name, logo_url ),
          team_b: team_b_id ( name, logo_url )
        `)
        .eq('tournament_id', id)
        .order('date', { ascending: true })

      if (mError) throw mError

      // 4. Fetch Announcements
      const { data: announcements, error: aError } = await supabase
        .from('announcements')
        .select('*')
        .eq('tournament_id', id)
        .order('created_at', { ascending: false })

      if (aError) throw aError

      // 5. Combine everything
      return res.status(200).json({
        ...tournament,
        teams,
        matches,
        announcements
      })

    } catch (error) {
      console.error('Error fetching tournament:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}