import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

    export default async function handler(req, res) {
      if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
      }

      // 1. Create the server client that can read the auth cookie
      const supabaseServer = createPagesServerClient({ req, res })
      
      // 2. Use it to get the user
      const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

      if (userError || !user) {
        return res.status(401).json({ error: 'You must be logged in.' })
      }

      // 3. Get the username from the request body
      const { username } = req.body
      if (!username) {
        return res.status(400).json({ error: 'Username is required.' })
      }

      // 4. Use the *SAME* server client to update the database
      // This client carries the user's auth info, so RLS passes
      const { data, error } = await supabaseServer 
        .from('profiles')
        .update({ username: username })
        .eq('id', user.id) // RLS will also double-check this
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error.message)
        return res.status(500).json({ error: 'Failed to update profile.' })
      }

      // Success!
      return res.status(200).json(data)
    }