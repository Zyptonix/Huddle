import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Plus, Tag, Package, Image as ImageIcon } from "lucide-react";

export default function Merch() {
  const { user, profile } = useAuth();
  
  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Added Loading State
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("merch_items").select("*").order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error loading merch:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");

    const { error } = await supabase.from("merch_items").insert({
      ...form,
      organizer_id: user.id,
      price: Number(form.price),
      stock: Number(form.stock),
    });

    if (error) {
      alert("Error adding item: " + error.message);
    } else {
      alert("Merch item added!");
      setForm({ name: "", description: "", price: "", stock: "", image_url: "" });
      loadItems();
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <Layout dark={true}>
        <div className="min-h-screen flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </Layout>
    );
  }

  // Check if user is allowed to add items (e.g., role is 'organizer' or just for testing 'user')
  // Adjust this condition based on your exact role logic
  const canAddItems = profile?.role === "organizer" || profile?.role === "admin"; 

  return (
    <Layout dark={true} title="Merch Shop">
      <div className="p-6 md:p-12 max-w-7xl mx-auto text-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="text-emerald-500" /> Official Store
            </h1>
            <p className="text-slate-400 mt-2">Get the latest tournament gear and kits.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT: ADD ITEM FORM (Only for Organizers) */}
          {canAddItems && (
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-emerald-400"/> Add Inventory
                </h2>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                      placeholder="e.g. 2025 Home Kit"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none h-24"
                      placeholder="Product details..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Price ($)</label>
                      <input
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                        placeholder="0.00"
                        required
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                      <input
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                        placeholder="0"
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Image URL</label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-3">
                      <ImageIcon size={16} className="text-slate-500"/>
                      <input
                        className="flex-1 bg-transparent text-white outline-none"
                        placeholder="https://..."
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20">
                    Create Product
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* RIGHT: ITEMS GRID */}
          <div className={canAddItems ? "lg:col-span-2" : "lg:col-span-3"}>
            <h2 className="text-xl font-bold text-white mb-6">Available Items</h2>
            
            {items.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <ShoppingBag size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Store is currently empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {items.map((i) => (
                  <div key={i.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors shadow-lg group">
                    {/* Image Area */}
                    <div className="h-48 bg-slate-950 relative overflow-hidden">
                      {i.image_url ? (
                        <img
                          src={i.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={i.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      {/* Price Tag Overlay */}
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white font-bold px-3 py-1 rounded-full shadow-lg text-sm">
                        ${i.price}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-white">{i.name}</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{i.description || "No description."}</p>
                      
                      <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
                          <Package size={14} /> Stock: {i.stock}
                        </span>
                        <button className="text-sm bg-white text-slate-900 hover:bg-emerald-400 font-bold px-4 py-2 rounded-lg transition-colors">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}