import { Mail, Shield } from 'lucide-react'

export default function AccountDetails({ email, role }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Account Details</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <span className="text-gray-700">{email}</span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-gray-500" />
          <span className="text-gray-700 capitalize">
            Role: <strong className="font-medium text-gray-900">{role}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}