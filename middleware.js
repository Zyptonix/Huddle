// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  
  // This reads the auth cookie and updates it if necessary
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  
  return res
}