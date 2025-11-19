import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ className }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all ${className}`}
    >
      <LogOut size={20} />
      <span className="hidden sm:inline">Log Out</span>
    </button>
  )
}