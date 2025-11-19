import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

export default function VenueManager() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    const res = await fetch('/api/venues/list')
    if (res.ok) setVenues(await res.json())
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await fetch('/api/venues/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, capacity }),
    })
    if (res.ok) {
      setName(''); setLocation(''); setCapacity('');
      fetchVenues()
    } else {
      alert('Failed to create venue')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id) => {
    if(!confirm("Are you sure?")) return;
    alert("Delete API not yet implemented in this snippet, but UI is ready!")
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <MapPin className="text-purple-600" size={20}/> Venue Management
        </h3>
        <p className="text-sm text-gray-500 mt-1">Add stadiums and fields for your tournaments.</p>
      </div>

      <div className="p-6 grid lg:grid-cols-3 gap-8">
        {/* Left: Create Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Venue Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Central Stadium" required />
            <Input label="Location/Address" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. 123 Main St" required />
            <Input label="Capacity (Optional)" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 5000" />
            
            <Button type="submit" isLoading={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
              <Plus size={16} className="mr-2"/> Add Venue
            </Button>
          </form>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-gray-400">Loading venues...</p>
          ) : venues.length === 0 ? (
            <EmptyState message="No venues added yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {venues.map(v => (
                <div key={v.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors group relative">
                   <h4 className="font-bold text-gray-800">{v.name}</h4>
                   <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                     <MapPin size={12} /> {v.location}
                   </p>
                   {v.capacity > 0 && (
                     <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mt-2 inline-block">
                       Cap: {v.capacity}
                     </span>
                   )}
                   <button onClick={() => handleDelete(v.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 size={16} />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}