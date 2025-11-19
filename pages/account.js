import { useAuth } from '../context/AuthContext'
// FIX: Correct path
import Layout from '../components/ui/Layout'
import AccountDetails from '../components/account/AccountDetails'
import EditProfileForm from '../components/account/EditProfileForm'

export default function Account() {
  const { user, profile } = useAuth()

  return (
    <Layout title="My Account - Huddle">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile details and preferences.</p>
        </div>

        <AccountDetails email={user.email} role={profile?.role} />
        <EditProfileForm user={user} profile={profile} />
      </div>
    </Layout>
  )
}