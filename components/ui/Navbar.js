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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Force a hard redirect to clear state completely
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error.message)
      // Attempt to redirect anyway
      router.push('/')
    }
  }

  const isActive = (path) => router.pathname.startsWith(path)
  
  const navLinkStyle = (active) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
      active 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href={user ? "/dashboard" : "/"} className="text-2xl font-extrabold text-blue-600 tracking-tight cursor-pointer">
                Huddle
              </Link>
            </div>
            
            {/* Show Navigation Links ONLY if logged in */}
            {user && (
              <div className="hidden md:ml-8 md:flex md:space-x-2 items-center">
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
                    Tactics Board
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
                  className="flex items-center gap-2 max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 pr-3 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                     {profile?.avatar_url ? (
                       <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                     ) : (
                       <User className="h-5 w-5 text-gray-400" />
                     )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                    {profile?.username || 'User'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      <p className="text-xs text-blue-600 capitalize mt-0.5">{profile?.role}</p>
                    </div>
                    
                    <Link 
                      href="/account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings size={16} /> Account Settings
                    </Link>
                    
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                  className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-600/20"
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
              // Logged In Mobile Menu
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
              // Logged Out Mobile Menu
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