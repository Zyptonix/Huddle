export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
           <span className="text-2xl font-bold text-blue-600">Huddle</span>
           <p className="text-sm text-gray-500 mt-1">© 2025 Huddle Platform. All rights reserved.</p>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-gray-400 hover:text-gray-500">Privacy</a>
          <a href="#" className="text-gray-400 hover:text-gray-500">Terms</a>
          <a href="#" className="text-gray-400 hover:text-gray-500">Contact</a>
        </div>
      </div>
    </footer>
  )
}