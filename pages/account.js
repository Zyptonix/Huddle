import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/ui/Layout'
import AccountDetails from '../components/account/AccountDetails'
import EditProfileForm from '../components/account/EditProfileForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Account() {
  const { user, profile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  if (loading || !user) return null

  return (
    <Layout title="My Account - Huddle">
      <div className="max-w-3xl mx-auto py-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 font-medium w-max">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

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
    </Layout>
  )
}