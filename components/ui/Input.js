export default function Input({ 
  label, 
  id, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  icon, // Pass an Icon element (e.g. <User size={20} />)
  required = false,
  className = "" 
}) {
  return (
    <div className={`mb-4 relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm p-2.5 border text-gray-900 ${icon ? 'pl-10' : ''} transition-colors`}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}