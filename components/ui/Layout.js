import Head from 'next/head'
import Navbar from './Navbar'
import Loading from './Loading'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children, title = "Huddle" }) {
  const { loading, user } = useAuth()

  if (loading) return <Loading message="Loading Huddle..." />
  
  // If not logged in, we don't show the layout (usually redirects happen in the page)
  if (!user) return <>{children}</> 

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Head>
        <title>{title}</title>
      </Head>
      
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}