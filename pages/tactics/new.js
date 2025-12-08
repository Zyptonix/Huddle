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
    // FIX: Switched from bg-gray-900 (dark) to bg-gray-50 (light) to match the app
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header: Switched to White background with Gray text */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium">
               <ArrowLeft size={20} /> <span className="text-sm">Exit</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              // FIX: Text is now gray-900 (black) instead of white
              className="bg-transparent text-xl font-bold text-gray-900 focus:outline-none focus:border-b focus:border-blue-500 px-1 placeholder-gray-400"
              placeholder="Tactic Name"
            />
         </div>
         <div className="flex items-center gap-2">
            {saving && <span className="text-sm text-blue-600 animate-pulse font-medium">Saving...</span>}
         </div>
      </div>

      {/* Board Area */}
      <div className="flex-grow p-4 lg:p-6 overflow-hidden">
         <div className="h-full max-w-[1600px] mx-auto">
            <TacticsBoard onSave={handleSave} initialData={null} />
         </div>
      </div>
    </div>
  )
}