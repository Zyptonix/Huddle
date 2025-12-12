import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Init Supabase (Auto-detects user from cookies)
  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'You must be logged in' });
  }

  const { id } = req.query; // Team ID from the URL

  try {
    // 2. Perform Delete
    // We strictly match both team_id AND user_id so they can't delete others
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Left team successfully' });

  } catch (error) {
    console.error('Leave Error:', error);
    return res.status(500).json({ error: error.message });
  }
}