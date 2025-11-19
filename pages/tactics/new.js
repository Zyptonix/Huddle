import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/ui/Layout'
import TacticsBoard from '../../components/tactics/TacticsBoard'

export default function NewTactic() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('New Tactic')
  const [saving, setSaving] = useState(false)

  const handleSave = async (tacticData) => {
    if (!name) return alert("Please name your tactic")
    setSaving(true)
    const { error } = await supabase.from('tactics').insert([{
      name, sport: 'football', creator_id: user.id, data: tacticData, is_public: false
    }])
    if (error) alert('Error: ' + error.message)
    else alert('Tactic Saved!')
    setSaving(false)
  }

  if (profile?.role !== 'coach') return <Layout><div className="text-center mt-20">Only Coaches can use this tool.</div></Layout>

  return (
    // We don't use the standard <Layout> here because we need a custom full-screen dark mode
    // But we mimic the Navbar manually if we wanted, or just keep it immersive.
    // Let's stick to immersive mode for tactics.
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      
      {/* Custom Dark Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-md z-20">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
               <ArrowLeft size={20} /> <span className="text-sm font-medium">Exit</span>
            </Link>
            <div className="h-6 w-px bg-gray-600"></div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b focus:border-blue-500 px-1 placeholder-gray-500"
              placeholder="Tactic Name"
            />
         </div>
         <div className="flex items-center gap-2">
            {saving && <span className="text-sm text-gray-400 animate-pulse">Saving...</span>}
         </div>
      </div>

      {/* Board Area */}
      <div className="flex-grow p-4 lg:p-6 overflow-hidden bg-gray-900">
         <div className="h-full max-w-[1600px] mx-auto">
            <TacticsBoard onSave={handleSave} initialData={null} />
         </div>
      </div>
    </div>
  )
}