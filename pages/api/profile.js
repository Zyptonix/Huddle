// pages/api/profile.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const token = req.headers.authorization?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. EXTRACT avatar_url HERE
    const {
      username,
      phone,
      address,
      height,
      age,
      jersey_number,
      positions_preferred,
      previous_teams,
      notable_achievements,
      previous_tournaments,
      avatar_url // <--- Added this
    } = req.body;

    // 2. INCLUDE IT IN THE UPDATE HERE
    const { data, error: dbError } = await supabase
      .from('profiles')
      .update({
        username,
        phone,
        address,
        height,
        age,
        jersey_number,
        positions_preferred,
        previous_teams,
        notable_achievements,
        previous_tournaments,
        avatar_url // <--- Added this
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Database Error:', dbError);
      throw dbError;
    }

    return res.status(200).json({ message: 'Profile updated', data });

  } catch (error) {
    console.error('API Route Error:', error);
    return res.status(500).json({ message: error.message });
  }
}