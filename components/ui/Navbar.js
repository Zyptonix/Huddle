import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { 
  Menu, X, ChevronDown, LogOut, User, Settings 
} from 'lucide-react'

export default function Navbar() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false) // Mobile menu
  const [dropdownOpen, setDropdownOpen] = useState(false) // User dropdown
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async (e) => {
    if (e) e.preventDefault()
    
    // Create a timeout promise to force redirect if signOut hangs
    const timeout = new Promise((resolve) => setTimeout(resolve, 1000))
    
    try {
      // Race the signOut against the timeout
      await Promise.race([
        supabase.auth.signOut(),
        timeout
      ])
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always redirect to home to clear state
      window.location.href = '/'
    }
  }

  const isActive = (path) => router.pathname.startsWith(path)
  
  const navLinkStyle = (active) => 
    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
      active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link 
                href={user ? "/dashboard" : "/"} 
                className="flex items-center gap-2 group"
              >
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight cursor-pointer group-hover:opacity-80 transition-opacity">
                  Huddle
                </span>
              </Link>
            </div>
            
            {user && (
              <div className="hidden md:ml-10 md:flex md:space-x-1 items-center">
                <Link 
                  href="/dashboard" 
                  className={navLinkStyle(router.pathname === '/dashboard')}
                >
                  Dashboard
                </Link>
                
                <Link 
                  href="/tournament_portal" 
                  className={navLinkStyle(isActive('/tournament_portal') || isActive('/tournament/'))}
                >
                  {profile?.role === 'organizer' ? 'Manage Tournaments' : 'Tournaments'}
                </Link>

                {(profile?.role === 'coach' || profile?.role === 'player') && (
                  <Link 
                    href="/team_portal" 
                    className={navLinkStyle(isActive('/team_portal') || isActive('/team/'))}
                  >
                    {profile?.role === 'coach' ? 'My Teams' : 'My Squads'}
                  </Link>
                )}

                {profile?.role === 'coach' && (
                  <Link 
                    href="/tactics/new" 
                    className={navLinkStyle(isActive('/tactics'))}
                  >
                    Tactics
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* --- RIGHT SIDE ACTIONS --- */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              // 1. LOGGED IN STATE: User Dropdown
              <div className="relative ml-3" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 bg-white pl-1 pr-3 py-1 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
                     <div className="h-full w-full rounded-full bg-white overflow-hidden">
                       {profile?.avatar_url ? (
                         <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                       ) : (
                         <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                         </div>
                       )}
                     </div>
                  </div>
                  <div className="flex flex-col items-start mr-1">
                    <span className="text-xs font-bold text-gray-900 leading-none">{profile?.username || 'User'}</span>
                    <span className="text-[10px] font-medium text-blue-600 capitalize leading-none mt-1">{profile?.role}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-3 w-56 rounded-xl shadow-xl py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-1">{user?.email}</p>
                    </div>
                    
                    <Link 
                      href="/account"
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                    >
                      <Settings size={16} /> Account Settings
                    </Link>
                    
                    <button
                      type="button"
                      // FIX: Using only onClick with a robust timeout fallback
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 2. LOGGED OUT STATE: Sign In Buttons
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-blue-600 font-semibold px-4 py-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {user ? (
               <>
                 <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Dashboard
                 </Link>
                 <Link href="/tournament_portal" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Tournaments
                 </Link>
                 {(profile?.role === 'coach' || profile?.role === 'player') && (
                   <Link href="/team_portal" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                     Teams
                   </Link>
                 )}
                 {profile?.role === 'coach' && (
                   <Link href="/tactics/new" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                     Tactics
                   </Link>
                 )}
                 <Link href="/account" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                   Account
                 </Link>
                 <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                 >
                    Sign out
                 </button>
               </>
             ) : (
               <>
                 <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Sign in
                 </Link>
                 <Link href="/register" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50">
                    Create Account
                 </Link>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  )
}