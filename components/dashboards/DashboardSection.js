import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function DashboardSection({ title, icon: Icon, link, linkText, items, emptyText, type }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Icon size={18} className="text-blue-600"/> {title}
        </h3>
        <Link href={link} className="text-xs font-semibold text-blue-600 hover:underline">
          {linkText}
        </Link>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{emptyText}</p>
        ) : (
          <ul className="space-y-3">
            {items.slice(0, 5).map((item, i) => (
              <li key={i} className="pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                 {type === 'team' ? (
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.sport === 'football' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span className="font-medium text-gray-900">{item.name}</span>
                     </div>
                     <span className="text-xs text-gray-400 uppercase">{item.sport}</span>
                   </div>
                 ) : (
                   <Link href={`/tournament/${item.id}`} className="block hover:bg-gray-50 rounded p-1 -m-1 transition-colors">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="flex justify-between mt-1">
                         <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12}/> {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'TBD'}
                         </span>
                         {item.registration_status && (
                           <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">
                              {item.registration_status}
                           </span>
                         )}
                      </div>
                   </Link>
                 )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}