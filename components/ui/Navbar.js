import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import UserSearch from './UserSearch'
import { 
  Menu, X, ChevronDown, LogOut, User, Settings, 
  MessageCircle, UserPlus, Clipboard, Users 
} from 'lucide-react'

export default function Navbar() {
  const { user, profile } = useAuth()
  const router = useRouter()
  
  // State
  const [isOpen, setIsOpen] = useState(false) // Mobile menu
  const [userDropdownOpen, setUserDropdownOpen] = useState(false) // Profile dropdown
  const [teamsDropdownOpen, setTeamsDropdownOpen] = useState(false) // New Teams dropdown
  
  // Refs for click outside
  const userDropdownRef = useRef(null)
  const teamsDropdownRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
      if (teamsDropdownRef.current && !teamsDropdownRef.current.contains(event.target)) {
        setTeamsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async (e) => {
    if (e) e.preventDefault()
    const timeout = new Promise((resolve) => setTimeout(resolve, 1000))
    try {
      await Promise.race([supabase.auth.signOut(), timeout])
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
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

  const isTeamsActive = 
    isActive('/team_portal') || 
    isActive('/team/') || 
    isActive('/player-availability') || 
    isActive('/tactics')

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LEFT: Logo & Search */}
          <div className="flex items-center flex-1 gap-8">
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
                <div className="hidden md:block w-full max-w-sm">
                    <UserSearch />
                </div>
            )}
          </div>

          {/* MIDDLE: Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
             {user && (
               <>
                <Link href="/dashboard" className={navLinkStyle(router.pathname === '/dashboard')}>
                  Dashboard
                </Link>
                <Link href="/merch" className={navLinkStyle(router.pathname === '/merch')}>
                  Merch Store
                </Link>
                
                <Link href="/tournament_portal" className={navLinkStyle(isActive('/tournament_portal') || isActive('/tournament/'))}>
                  {profile?.role === 'organizer' ? 'Manage Tournaments' : 'Tournaments'}
                </Link>

                {/* TEAMS DROPDOWN */}
                {(profile?.role === 'coach' || profile?.role === 'player') && (
                  <div className="relative" ref={teamsDropdownRef}>
                    <button
                      onClick={() => setTeamsDropdownOpen(!teamsDropdownOpen)}
                      className={navLinkStyle(isTeamsActive)}
                    >
                      {profile?.role === 'coach' ? 'My Teams' : 'My Squads'}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${teamsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {teamsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                        
                        <Link 
                          href="/team_portal"
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                          onClick={() => setTeamsDropdownOpen(false)}
                        >
                          <Users size={16} /> Team Portal
                        </Link>

                        {profile?.role === 'coach' && (
                          <Link 
                            href="/player-availability"
                            className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                            onClick={() => setTeamsDropdownOpen(false)}
                          >
                            <UserPlus size={16} /> Recruit
                          </Link>
                        )}

                        {profile?.role === 'coach' && (
                          <Link 
                            href="/tactics/new"
                            className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                            onClick={() => setTeamsDropdownOpen(false)}
                          >
                            <Clipboard size={16} /> Tactics Board
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* UPDATED MESSAGES LINK */}
                <Link href="/messages" className={navLinkStyle(isActive('/messages'))}>
                   <MessageCircle size={16} /> Messages
                </Link>
               </>
             )}
          </div>

          {/* RIGHT: User Profile Dropdown */}
          <div className="hidden md:flex items-center space-x-4 ml-4">
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
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
                    <span className="text-xs font-medium text-blue-600 capitalize leading-none mt-1">{profile?.role}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-3 w-56 rounded-xl shadow-xl py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-1">{user?.email}</p>
                    </div>
                    
                    <Link 
                      href={`/profile/${profile?.id || user?.id}`}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>

                    <Link 
                      href="/account"
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings size={16} /> Account Settings
                    </Link>
                    
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-semibold px-4 py-2 transition-colors">Sign in</Link>
                <Link href="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30">Get Started</Link>
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
        <div className="md:hidden border-t border-gray-200 h-screen overflow-y-auto pb-20">
          <div className="px-4 pt-4 pb-3 space-y-1 sm:px-3">
             {user ? (
               <>
                 <div className="mb-4">
                    <UserSearch className="w-full" />
                 </div>

                 <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                   Dashboard
                 </Link>
                 <Link href="/tournament_portal" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                   Tournaments
                 </Link>
                 
                 {(profile?.role === 'coach' || profile?.role === 'player') && (
                    <div className="py-2">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {profile?.role === 'coach' ? 'My Teams' : 'My Squads'}
                        </p>
                        <Link href="/team_portal" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2">
                             <Users size={16} /> Team Portal
                        </Link>
                        {profile?.role === 'coach' && (
                           <>
                             <Link href="/player-availability" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2">
                               <UserPlus size={16} /> Recruit
                             </Link>
                             <Link href="/tactics/new" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2">
                               <Clipboard size={16} /> Tactics
                             </Link>
                           </>
                        )}
                    </div>
                 )}

                 <Link href="/messages" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2">
                    <MessageCircle size={16} /> Messages
                 </Link>

                 <div className="border-t border-gray-100 my-2 pt-2">
                    <Link href={`/profile/${profile?.id || user?.id}`} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    My Profile
                    </Link>
                    <Link href="/account" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Account
                    </Link>
                    <button type="button" onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                        Sign out
                    </button>
                 </div>
               </>
             ) : (
               <>
                 <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign in</Link>
                 <Link href="/register" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50">Create Account</Link>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  )
}