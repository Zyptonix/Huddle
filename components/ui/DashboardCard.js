import { useRouter } from 'next/router'
import { ChevronRight } from 'lucide-react'

export default function DashboardCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  link, 
  gradient = "from-blue-500 to-indigo-600", // Default gradient
  iconColor = "text-white", 
  children // For custom content like "Quick Actions" or stats rows
}) {
  const router = useRouter()

  return (
    <div 
      className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col`}
      onClick={() => router.push(link)}
    >
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black opacity-10 rounded-full blur-xl pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner">
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-transform duration-300" />
        </div>

        {/* Text Content */}
        <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-white/80 text-sm mb-4 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Custom Children (Stats rows, action buttons, etc.) */}
        {children && (
          <div className="mt-auto pt-4 border-t border-white/20">
            {children}
          </div>
        )}
      </div>

      {/* Interactive Hover Overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>
    </div>
  )
}