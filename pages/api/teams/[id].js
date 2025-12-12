import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Team not found' })

      return res.status(200).json(data)
    } catch (error) {
      console.error('Error fetching team:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}