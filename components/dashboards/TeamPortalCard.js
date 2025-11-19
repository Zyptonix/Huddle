import Link from 'next/link'
import { Activity, ArrowRight } from 'lucide-react'

export default function TeamPortalCard() {
  return (
    <Link 
      href="/team_portal"
      className="group block p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Activity size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Team Portal
            </h3>
            <p className="text-gray-500 mt-1">Manage rosters & memberships</p>
          </div>
        </div>
        <ArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" size={32} />
      </div>
    </Link>
  )
}