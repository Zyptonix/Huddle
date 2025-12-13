import { createClient } from '@supabase/supabase-js'

// Use Service Role Key to ensure we have permission to update/delete rows
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { member_record_id, action } = req.body

  if (!member_record_id || !action) {
    return res.status(400).json({ message: 'Missing record ID or action' })
  }

  try {
    if (action === 'accept') {
      // Update status to 'active'
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', member_record_id)
      
      if (error) throw error
    } 
    else if (action === 'deny') {
      // Delete the request entirely
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member_record_id)

      if (error) throw error
    }

    return res.status(200).json({ message: 'Success' })

  } catch (error) {
    console.error("Handle Request Error:", error)
    return res.status(500).json({ message: error.message })
  }
}