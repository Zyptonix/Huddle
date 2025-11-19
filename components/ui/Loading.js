export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="animate-pulse text-blue-600 font-semibold">{message}</div>
      </div>
    </div>
  )
}