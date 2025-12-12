import { useRouter } from 'next/router'
import { MessageCircle, Send, ChevronRight } from 'lucide-react'

export default function MessagesPortalCard() {
  const router = useRouter()

  return (
    <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
         onClick={() => router.push('/messages')}>
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black opacity-10 rounded-full blur-xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          Messages
        </h3>
        <p className="text-purple-50 text-sm mb-4">
          
        </p>

        {/* Quick Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">New Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-white/70" />
            <span className="text-white/70 font-semibold text-sm">Conversations</span>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-pink-500/0 group-hover:from-purple-400/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
    </div>
  )
}