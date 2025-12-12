import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import { Search, X, Loader, User } from 'lucide-react'

export default function UserSearch({ className = "" }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Clear search when route changes (user clicks a result)
  useEffect(() => {
    setQuery('')
    setShowResults(false)
  }, [router.asPath])

  // Search Logic with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 0) {
        setLoading(true)
        setShowResults(true)
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, role')
            .ilike('username', `%${query}%`) // Case-insensitive partial match
            .limit(5)

          if (!error) {
            setResults(data || [])
          }
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300) // Wait 300ms after typing stops

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  return (
    <div ref={searchRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          placeholder="Search players, coaches..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
              if(query) setShowResults(true)
          }}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <Loader size={16} className="text-blue-500 animate-spin" />
            ) : (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && query && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {results.length > 0 ? (
            <ul>
              {results.map((profile) => (
                <li key={profile.id} className="border-b border-gray-50 last:border-0">
                  <Link 
                    href={`/profile/${profile.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profile.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No users found for "{query}"
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}