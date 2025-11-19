export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="mt-8 text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      {Icon && <Icon className="mx-auto h-10 w-10 text-gray-400 mb-3" />}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  )
}