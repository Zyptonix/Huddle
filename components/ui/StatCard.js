export default function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}