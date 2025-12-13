import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/ui/Layout'
import AccountDetails from '../components/account/AccountDetails'
import EditProfileForm from '../components/account/EditProfileForm'
import Loading from '../components/ui/Loading'

export default function Account() {
  const { user, profile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  if (loading) return <Loading />
  if (!user) return null

  return (
    <Layout title="My Profile - Huddle">
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Top Nav */}
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight hidden md:block">
              My Profile
            </h1>
          </div>

          {/* Main Content Area */}


            <div className="px-6 pb-8 md:px-10">
              {isEditing ? (
                <EditProfileForm 
                  user={user} 
                  profile={profile} 
                  onCancel={() => setIsEditing(false)} 
                />
              ) : (
                <AccountDetails 
                  user={user} 
                  profile={profile} 
                  onEdit={() => setIsEditing(true)} 
                />
              )}
            </div>
          </div>

        </div>

    </Layout>
  )
}