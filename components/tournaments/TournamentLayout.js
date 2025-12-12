import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  ArrowLeft, Trophy, Calendar, Users, Megaphone, 
  Activity, MapPin, Share2 
} from 'lucide-react'
import Layout from '../ui/Layout' // Ensure this points to your new Light Mode Layout

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p>Loading Tournament Data...</p>
       </div>
    </Layout>
  )

  if (error || !tournament) return (
    <Layout>
       <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Tournament Not Found</h2>
          <Link href="/tournament_portal" className="text-indigo-600 hover:underline mt-4 block">
             &larr; Go Back
          </Link>
       </div>
    </Layout>
  )

  return (
    <Layout title={`${tournament.name} - Huddle`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* --- Back Link --- */}
        <div className="mb-6">
          <Link 
            href="/tournament_portal" 
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Portal
          </Link>
        </div>

        {/* --- Hero Header --- */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8 group relative">
          
          {/* Top Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400"></div>

          {/* Main Content Area */}
          <div className="p-6 md:p-8">
             <div className="flex flex-col md:flex-row gap-6 md:items-end">
                
                {/* Icon Box */}
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                   <Trophy size={40} />
                </div>

                {/* Title & Info */}
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                      <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                         {tournament.sport}
                      </span>
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                         {tournament.format}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1
                         ${tournament.status === 'active' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                         {tournament.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                         {tournament.status === 'active' ? 'Live Now' : tournament.status}
                      </span>
                   </div>
                   
                   <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-2">
                      {tournament.name}
                   </h1>
                   
                   <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-default">
                         <MapPin size={16} className="text-gray-400"/> {tournament.venue || 'Multiple Venues'}
                      </span>
                      <span className="flex items-center gap-1.5">
                         <Calendar size={16} className="text-gray-400"/> 
                         {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Date TBD'}
                      </span>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                     onClick={() => navigator.clipboard.writeText(window.location.href)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                   >
                      <Share2 size={16} /> Share
                   </button>
                   {/* Organizer Action Placeholder */}
                   {/* <button className="... bg-indigo-600 text-white ...">Manage</button> */}
                </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-t border-gray-100">
             <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                   const active = isActive(tab.href)
                   return (
                      <Link 
                         key={tab.name} 
                         href={tab.href}
                         className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                            active 
                               ? 'border-indigo-600 text-indigo-600' 
                               : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                         }`}
                      >
                         <tab.icon size={16} className={active ? 'text-indigo-600' : 'text-gray-400'} />
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