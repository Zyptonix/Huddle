import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { conversationId, userId } = req.body;

  try {
    // Fetch current array
    const { data: conv } = await supabase
        .from('conversations')
        .select('deleted_by')
        .eq('id', conversationId)
        .single();

    const currentDeleted = conv.deleted_by || [];

    if (!currentDeleted.includes(userId)) {
      const { error } = await supabase
        .from('conversations')
        .update({ deleted_by: [...currentDeleted, userId] })
        .eq('id', conversationId);

      if (error) throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}