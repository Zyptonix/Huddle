import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createPagesServerClient({ req, res })
  const { name, sport, description, is_recruiting, logo_url, owner_id } = req.body

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let c = ''
    for (let i = 0; i < 6; i++) c += chars.charAt(Math.floor(Math.random() * chars.length))
    return c
  }

  const teamCode = generateCode()

  try {
    // 1. Create the Team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([{
        name,
        sport,
        description,
        is_recruiting,
        logo_url,
        owner_id,
        join_code: teamCode
      }])
      .select()
      .single()

    if (teamError) throw teamError

    // 2. Add the Creator (YOU) as the Head Coach
    // We set role='owner' so you have full control, 
    // but position='Head Coach' so it looks correct on the profile.
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{
        team_id: team.id,
        user_id: owner_id,
        role: 'owner',       // Grants you Admin rights (Delete/Edit team)
        position: 'Head Coach', // Displays you as the Coach
        status: 'active'
      }])

    if (memberError) {
      // If adding the member fails, we should technically delete the team to cleanup,
      // but for now let's just throw the error.
      throw memberError
    }

    return res.status(200).json({ teamId: team.id, code: teamCode })

  } catch (error) {
    console.error('Error creating team:', error)
    return res.status(500).json({ error: error.message })
  }
}