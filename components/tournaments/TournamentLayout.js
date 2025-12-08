import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Trophy, Calendar, Users, Megaphone, Activity, Shield } from 'lucide-react'
import Layout from '../ui/Layout'

export default function TournamentLayout({ children, tournament, loading }) {
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

  if (loading) return <Layout><div className="p-10 text-center">Loading Tournament...</div></Layout>
  if (!tournament) return null

  return (
    <Layout title={`${tournament.name} - Huddle`}>
      <div className="mb-6">
        <Link 
          href="/tournament_portal" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Portal
        </Link>
      </div>

      {/* --- Tournament Header --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="absolute -bottom-10 right-10 opacity-10 text-white">
              <Trophy size={140} />
           </div>
        </div>
        <div className="px-8 pb-8 pt-4 relative">
           <div className="flex justify-between items-end">
             <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-xs tracking-wider mb-1">
                   <Trophy size={14} /> {tournament.sport} • {tournament.format}
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{tournament.name}</h1>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                   <span className="flex items-center gap-1"><Shield size={14}/> Organized by {tournament.organizerName}</span>
                   <span className="flex items-center gap-1"><Calendar size={14}/> {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}</span>
                </div>
             </div>
             <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tournament.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                   {tournament.status}
                </span>
             </div>
           </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="px-8 border-t border-gray-100 bg-gray-50 flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            // FIX: Removed <a> tag and applied classes directly to Link
            <Link 
              key={tab.name} 
              href={tab.href}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                 isActive(tab.href) 
                   ? 'border-blue-600 text-blue-600' 
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* --- Page Content --- */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </Layout>
  )
}