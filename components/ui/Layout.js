import Head from 'next/head'
import Navbar from './Navbar'
import Loading from './Loading'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children, title }) {
  const { loading, user } = useAuth()

  // --- FIX: Sanitize Title ---
  // This ensures 'title' is ALWAYS a simple string.
  // It prevents the "React expects children to be a string but found Array" crash.
  const safeTitle = (typeof title === 'string' && title.trim().length > 0)
    ? title 
    : 'Huddle';

  // 1. Handle Global Loading (Prevents page flicker)
  if (loading) return <Loading message="Loading Huddle..." />
  
  // 2. Handle Non-Auth State (Renders children without Layout wrapper)
  if (!user) return <>{children}</> 

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Head>
        {/* Now safe to render */}
        <title>{safeTitle}</title>
        <link rel="icon" href="/huddle.jpg" />
      </Head>
      
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}