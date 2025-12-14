import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // 1. Destructure sport from the request body
    const { email, password, username, role, phone, age, address, sport } = req.body

    // 2. Create user in Supabase Auth
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message })
    }

    const userId = authUser.user?.id
    if (!userId) {
      return res.status(400).json({ error: "Auth user not returned" })
    }

    // 3. Insert into profiles table with the new sport field
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username,
      role,
      phone,
      age,
      address,
      sport: role === 'player' ? sport : null // Only save sport if role is player
    })

    if (profileError) {
      return res.status(400).json({ error: profileError.message })
    }

    return res.status(200).json({ success: true })
  } 
  catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ error: "Server error" })
  }
}