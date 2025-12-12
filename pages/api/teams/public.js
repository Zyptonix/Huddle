import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { recruiting } = req.query

  if (req.method === 'GET') {
    try {
      let query = supabase
        .from('teams')
        .select(`
          *,
          member_count: team_members(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20) // Limit to 20 for now to keep it fast

      // If ?recruiting=true is passed, filter the results
      if (recruiting === 'true') {
        query = query.eq('is_recruiting', true)
      }

      const { data, error } = await query

      if (error) throw error

      const formatted = data.map(team => ({
        ...team,
        member_count: team.member_count?.[0]?.count || 0
      }))

      return res.status(200).json(formatted)
    } catch (error) {
      console.error('Error fetching public teams:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}