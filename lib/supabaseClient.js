// lib/supabaseClient.js
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

// This client is for the BROWSER and uses cookies
export const supabase = createPagesBrowserClient()