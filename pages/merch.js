import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { 
  ShoppingBag, 
  Plus, 
  X, 
  Heart, 
  ShieldCheck, 
  Truck,
  Tag
} from "lucide-react";

export default function Merch() {
  const { user, profile } = useAuth();
  
  // State
  const [items, setItems] = useState([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // === OFFICIAL TEAM MERCHANDISE DATA ===
  const officialMerch = [
    // --- JERSEYS ---
    {
      id: 1,
      name: "Neon Ninjas | Pro Home Kit",
      description: "Official 2025 Match Jersey. Electric green accents on breathable black mesh.",
      price: 89.99,
      image_url: "/images/merch/neon-ninjas-kit.jpg", 
      team: "Neon Ninjas",
      category: "Jerseys"
    },
    {
      id: 2,
      name: "Cyber Centurions | Away Jersey",
      description: "Performance fit away kit. White base with teal digital circuit patterns.",
      price: 89.99,
      image_url: "/images/merch/cyber-centurions-kit.jpg",
      team: "Cyber Centurions",
      category: "Jerseys"
    },
    {
      id: 3,
      name: "Solar Strikers | Warm-Up Tee",
      description: "Lightweight pre-match top. High-visibility orange gradient.",
      price: 45.00,
      image_url: "/images/merch/solar-strikers-tee.jpg", 
      team: "Solar Strikers",
      category: "Training"
    },
    
    // --- OUTERWEAR ---
    {
      id: 4,
      name: "Huddle Official Track Jacket",
      description: "Sideline essential. Navy blue with white piping and gold Huddle emblem.",
      price: 110.00,
      image_url: "/images/merch/huddle-track-jacket.jpg", 
      team: "Huddle Originals",
      category: "Outerwear"
    },
    {
      id: 5,
      name: "Quantum Quasars | Fan Hoodie",
      description: "Heavyweight galaxy-print hoodie. The ultimate fan statement piece.",
      price: 75.00,
      image_url: "/images/merch/quantum-quasars-hoodie.jpg", 
      team: "Quantum Quasars",
      category: "Outerwear"
    },
    
    // --- HEADWEAR ---
    {
      id: 6,
      name: "Plasma Panthers | Snapback",
      description: "Structured purple brim cap with neon electric panther logo.",
      price: 35.00,
      image_url: "/images/merch/plasma-panthers-cap.jpg", 
      team: "Plasma Panthers",
      category: "Headwear"
    },
    {
      id: 7,
      name: "Tactical Winter Beanie",
      description: "Ribbed knit grey beanie with embroidered shield logo.",
      price: 25.00,
      image_url: "/images/merch/tactical-beanie.jpg", 
      team: "Huddle Originals",
      category: "Headwear"
    },

    // --- EQUIPMENT ---
    {
      id: 10,
      name: "Pro Match Ball (Size 5)",
      description: "FIFA-approved bonded construction. The official ball of the Summer League.",
      price: 140.00,
      // UPDATED: Pointing to your new local image
      image_url: "/images/merch/pro-match-ball.jpg",
      team: "Tournament Gear",
      category: "Equipment"
    },
    {
      id: 11,
      name: "Elite Player Duffel Bag",
      description: "Waterproof compartment for boots. 60L capacity for all your kit.",
      price: 85.00,
      // Using a reliable online placeholder for now as no local image was provided for this one.
      // You can replace this with a local file like the others if you have one.
      image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      team: "Huddle Originals",
      category: "Accessories"
    }
  ];

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
  });

  useEffect(() => {
    // Check role
    if (profile?.role === "organizer") setIsOrganizer(true);
    
    // Load Items
    loadItems();
  }, [profile]);

  const loadItems = async () => {
    const { data } = await supabase.from("merch_items").select("*");
    if (data && data.length > 0) {
      setItems(data);
    } else {
      setItems(officialMerch);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await supabase.from("merch_items").insert({
      ...form,
      organizer_id: user.id,
      price: Number(form.price),
      stock: Number(form.stock),
    });

    alert("Item added to catalog!");
    setForm({ name: "", description: "", price: "", stock: "", image_url: "" });
    setShowAddForm(false);
    loadItems();
  };

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
    alert("Added to bag!");
  };

  return (
    <Layout title="The Shop">
      <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
        
        {/* === 1. HERO SECTION === */}
        <div className="relative w-full h-[50vh] bg-neutral-900 overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Stadium Tunnel"
            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              Official Store
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-4 drop-shadow-2xl">
              GEAR UP. GAME ON.
            </h1>
            <p className="text-gray-300 text-lg font-medium max-w-lg">
              Authentic kits and training wear from your favorite teams.
            </p>
          </div>
        </div>

        {/* === 2. NAVBAR === */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <div className="text-sm font-black tracking-tighter uppercase text-gray-900">
                Huddle <span className="text-gray-400">/</span> Shop
             </div>

             <div className="flex items-center gap-6">
               {isOrganizer && (
                 <button 
                   onClick={() => setShowAddForm(!showAddForm)}
                   className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                 >
                   {showAddForm ? <X size={16} /> : <Plus size={16} />}
                   {showAddForm ? "Close Manager" : "Add Item"}
                 </button>
               )}
               
               <div className="relative cursor-pointer group">
                 <ShoppingBag size={22} className="text-gray-700 group-hover:text-black transition-colors" />
                 {cartCount > 0 && (
                   <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                     {cartCount}
                   </span>
                 )}
               </div>
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* === 3. ORGANIZER FORM === */}
          {showAddForm && (
            <div className="mb-12 bg-white rounded-xl p-8 border border-gray-200 shadow-xl animate-in slide-in-from-top-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Tag size={20} /> Add to Catalog
                </h2>
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium" placeholder="Item Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium" type="number" placeholder="Price ($)" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium min-h-[100px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium" type="number" placeholder="Stock Qty" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium" placeholder="Image URL (e.g., /images/merch/my-item.jpg)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  </div>
                  <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    Publish Product
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* === 4. PRODUCT GRID === */}
          <div className="mb-8">
             <h3 className="text-2xl font-bold text-gray-900">New Arrivals</h3>
             <p className="text-gray-500 text-sm mt-1">Exclusive gear from the Winter Cup & Pro League teams.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((i) => (
              <div key={i.id} className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
                
                {/* Image Area - UPDATED FOR VISIBILITY */}
                <div className="relative aspect-[4/5] bg-white p-4 overflow-hidden rounded-t-2xl">
                  {/* Team Badge */}
                  {i.team && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded text-gray-900 uppercase tracking-wide">
                        {i.team}
                      </span>
                    </div>
                  )}

                  <img
                    src={i.image_url}
                    alt={i.name}
                    // UPDATED: object-contain ensures the whole image is visible
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://placehold.co/600x800/f3f4f6/9ca3af?text=Image+Coming+Soon";
                    }}
                  />
                  
                  {/* Quick Add Button */}
                  <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                    <button 
                      onClick={handleAddToCart}
                      className="w-full bg-white text-black font-bold py-3 rounded-xl shadow-lg hover:bg-black hover:text-white transition-colors text-xs uppercase tracking-widest border border-gray-100"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Text Details */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-white rounded-b-2xl">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{i.category || "Merch"}</p>
                       <p className="font-bold text-gray-900">${Number(i.price).toFixed(2)}</p>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {i.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{i.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* === 5. FOOTER STATS === */}
          <div className="mt-20 border-t border-gray-200 pt-10 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                  <div className="bg-green-50 p-3 rounded-full text-green-600"><ShieldCheck size={24} /></div>
                  <div>
                    <h4 className="font-bold text-sm">Official Merch</h4>
                    <p className="text-xs text-gray-500">100% Authentic Team Gear</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Truck size={24} /></div>
                  <div>
                    <h4 className="font-bold text-sm">Global Shipping</h4>
                    <p className="text-xs text-gray-500">Delivery to all fan zones</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
                  <div className="bg-purple-50 p-3 rounded-full text-purple-600"><Tag size={24} /></div>
                  <div>
                    <h4 className="font-bold text-sm">Member Pricing</h4>
                    <p className="text-xs text-gray-500">Best prices for registered fans</p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
