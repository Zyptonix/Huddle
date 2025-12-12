import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query // team id
  const { userId } = req.body

  try {
    // 1. Verify the team allows public recruiting
    const { data: team } = await supabase
      .from('teams')
      .select('is_recruiting')
      .eq('id', id)
      .single()

    if (!team || !team.is_recruiting) {
      return res.status(403).json({ error: "This team is not accepting public requests." })
    }

    // 2. Add the member
    const { error } = await supabase
      .from('team_members')
      .insert([{
        team_id: id,
        user_id: userId,
        role: 'player',
        status: 'active'
      }])

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "Already a member" })
      throw error
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}