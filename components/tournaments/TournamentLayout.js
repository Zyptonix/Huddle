import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  ArrowLeft, Trophy, Calendar, Users, Megaphone, 
  Activity, MapPin, Share2 
} from 'lucide-react'
import Layout from '../ui/Layout'

export default function TournamentLayout({ children, tournament, loading, error }) {
  const router = useRouter()
  const { id } = router.query

  // Tabs Configuration
  const tabs = [
    { name: 'Overview', href: `/tournament/${id}`, icon: Activity },
    { name: 'Fixtures', href: `/tournament/${id}/fixtures`, icon: Calendar },
    { name: 'Teams', href: `/tournament/${id}/teams`, icon: Users },
    { name: 'Announcements', href: `/tournament/${id}/announcements`, icon: Megaphone },
  ]

  const isActive = (path) => router.pathname === path

  // --- Loading / Error States ---
  if (loading) return (
    <Layout>
       <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading Tournament Data...</p>
       </div>
    </Layout>
  )

  if (error || !tournament) return (
    <Layout>
       <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Tournament Not Found</h2>
          <Link href="/tournament_portal" className="text-blue-600 hover:underline mt-4 block">
             &larr; Go Back
          </Link>
       </div>
    </Layout>
  )

  return (
    <Layout title={`${tournament.name} - Huddle`}>
      <div className="max-w-6xl mx-auto">
        
        {/* --- Back Link --- */}
        <div className="mb-4">
          <Link 
            href="/tournament_portal" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Portal
          </Link>
        </div>

        {/* --- Hero Header --- */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8 group">
          
          {/* Cover Image Area */}
          <div className="h-40 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
             {/* Abstract Pattern Overlay */}
             <div className="absolute inset-0 opacity-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             
             {/* Floating Icon Background */}
             <div className="absolute -bottom-6 -right-6 text-white opacity-5 transform rotate-12 group-hover:rotate-6 transition-transform duration-700">
                <Trophy size={200} />
             </div>
             
             {/* Status Badge */}
             <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-md border border-white/20
                  ${tournament.status === 'active' ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'}`}>
                  {tournament.status === 'upcoming' ? 'Registration Open' : tournament.status}
                </span>
             </div>
          </div>

          {/* Tournament Info Bar */}
          <div className="px-6 pb-2 relative">
             <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4 gap-6">
                
                {/* Main Icon Box */}
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600 border-4 border-white z-10">
                   <Trophy size={48} />
                </div>

                {/* Title & Meta */}
                <div className="flex-1 pb-2">
                   <div className="flex items-center gap-2 text-indigo-200 font-bold uppercase text-xs tracking-wider mb-1 absolute top-[-3rem] md:static md:text-blue-100 md:mb-1">
                      {tournament.sport} • {tournament.format}
                   </div>
                    <div className="inline-block px-4 py-2 bg-cyan-500/60 backdrop-blur-sm rounded-lg shadow-sm mb-2">
                      <h1 className="text-3xl md:text-4xl font-black text-white leading-none">
                        {tournament.name}
                      </h1>
                    </div>
                   <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm font-medium">
                      <span className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <MapPin size={14}/> {tournament.venue || 'Multiple Venues'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14}/> {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Date TBD'}
                      </span>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pb-2 w-full md:w-auto">
                   <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">
                      <Share2 size={16} /> Share
                   </button>
                   {/* We can add 'Edit' button here if user is organizer */}
                </div>
             </div>

             {/* Navigation Tabs */}
             <div className="flex gap-1 overflow-x-auto pb-1 border-t border-gray-100 pt-2 no-scrollbar">
               {tabs.map((tab) => {
                 const active = isActive(tab.href)
                 return (
                   <Link 
                     key={tab.name} 
                     href={tab.href}
                     className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                       active 
                         ? 'bg-blue-50 text-blue-700' 
                         : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                     }`}
                   >
                     <tab.icon size={18} className={active ? 'text-blue-600' : 'text-gray-400'} />
                     {tab.name}
                   </Link>
                 )
               })}
             </div>
          </div>
        </div>

        {/* --- Page Content --- */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </div>
    </Layout>
  )
}