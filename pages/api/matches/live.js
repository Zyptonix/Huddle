import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { matchId, type, teamId, playerName, timestamp, message, scoreDelta, metadata } = req.body;

  try {
    // 1. Log the Event
    const { error: eventError } = await supabase
      .from('match_events')
      .insert([{ match_id: matchId, type, team_id: teamId, player_name: playerName, timestamp, message, metadata }]);

    if (eventError) throw eventError;

    // 2. Update Live Score in Matches Table
    if (scoreDelta || type === 'wicket') {
      // Get current match state
      const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
      
      let updateData = {};
      
      // Check if the team is Team A or Team B
      if (teamId === match.team_a_id) {
        if (scoreDelta) updateData.score_a = (match.score_a || 0) + scoreDelta;
        
        // Handle Cricket Wickets inside the 'details' JSONB column
        if (type === 'wicket') {
          const currentDetails = match.details || {};
          updateData.details = { ...currentDetails, wickets_a: (currentDetails.wickets_a || 0) + 1 };
        }
      } else {
        if (scoreDelta) updateData.score_b = (match.score_b || 0) + scoreDelta;
        
        if (type === 'wicket') {
          const currentDetails = match.details || {};
          updateData.details = { ...currentDetails, wickets_b: (currentDetails.wickets_b || 0) + 1 };
        }
      }

      await supabase.from('matches').update(updateData).eq('id', matchId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}