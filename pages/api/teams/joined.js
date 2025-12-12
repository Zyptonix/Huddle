import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })

  // Check for session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams (
            id,
            name,
            sport,
            logo_url,
            description,
            is_recruiting,
            member_count: team_members(count)
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      if (error) throw error

      // Flatten the response so it's just a list of teams
      const teams = data.map(item => ({
        ...item.teams,
        role: item.role,
        member_count: item.teams.member_count?.[0]?.count || 0
      }))

      return res.status(200).json(teams)
    } catch (error) {
      console.error('Error fetching joined teams:', error)
      return res.status(500).json({ error: error.message })
    }
  }
}