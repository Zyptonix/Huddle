import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANT: Use SERVICE_ROLE_KEY to bypass RLS restrictions for deletions/updates
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messageId, userId, mode } = req.body; // mode: 'me' or 'everyone'

  try {
    if (mode === 'everyone') {
      // 1. Unsend: Update content and flag
      const { data, error } = await supabase
        .from('messages')
        .update({ 
            is_unsent: true, 
            content: '🚫 This message was unsent' 
        })
        .eq('id', messageId)
        .eq('sender_id', userId) // Security check: only sender can unsend
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);

    } else {
      // 2. Delete for me: Add ID to array
      const { data: msg, error: fetchError } = await supabase
        .from('messages')
        .select('deleted_by')
        .eq('id', messageId)
        .single();
      
      if (fetchError) throw fetchError;

      const currentDeleted = msg.deleted_by || [];
      
      // Only update if not already in the array
      if (!currentDeleted.includes(userId)) {
        const { data, error } = await supabase
          .from('messages')
          .update({ deleted_by: [...currentDeleted, userId] })
          .eq('id', messageId)
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      return res.status(200).json(msg);
    }
  } catch (error) {
    console.error("Delete API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}