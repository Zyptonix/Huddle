import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS for insertions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query; // This is the team_id from the URL
  const { user_id } = req.body; // Sent from frontend

  if (!id || !user_id) {
    return res.status(400).json({ error: 'Missing team ID or User ID' });
  }

  try {
    // 1. Check if already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User is already in this team' });
    }

    // 2. Add to team
    const { error } = await supabase
      .from('team_members')
      .insert([
        { 
          team_id: id, 
          user_id: user_id, 
          role: 'player', 
          status: 'active' 
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Joined team successfully' });

  } catch (error) {
    console.error('Join Error:', error);
    return res.status(500).json({ error: error.message });
  }
}