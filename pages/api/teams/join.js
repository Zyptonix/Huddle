import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createPagesServerClient({ req, res })
  
  // Get the data
  const { userId, joinCode, teamId } = req.body
  
  let targetTeamId = teamId;

  try {
    // 1. IF WE DON'T HAVE AN ID, FIND IT USING THE CODE
    if (!targetTeamId) {
       if (!joinCode) return res.status(400).json({ error: "No code provided" });

       const { data: teamFound, error: searchError } = await supabase
         .from('teams')
         .select('id')
         .eq('join_code', joinCode)
         .single();
       
       if (searchError || !teamFound) {
         return res.status(404).json({ error: "Invalid Join Code. No team found." });
       }
       targetTeamId = teamFound.id;
    }

    // 2. NOW FETCH SETTINGS (To check if public joining is allowed)
    const { data: team } = await supabase
      .from('teams')
      .select('is_recruiting, join_code')
      .eq('id', targetTeamId)
      .single()

    if (!team) return res.status(404).json({ error: "Team not found" })

    // 3. LOGIC CHECK
    const isCodeValid = joinCode && (joinCode === team.join_code)
    const isPublicOpen = team.is_recruiting

    if (!isCodeValid && !isPublicOpen) {
      return res.status(403).json({ error: "This team is not accepting requests." })
    }

    // 4. ADD MEMBER
    const { error } = await supabase
      .from('team_members')
      .insert([{
        team_id: targetTeamId,
        user_id: userId,
        role: 'player',
        status: 'active' 
      }])

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "You are already in this team" })
      throw error
    }

    return res.status(200).json({ success: true, teamId: targetTeamId })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}