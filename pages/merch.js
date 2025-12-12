import { useEffect, useState } from "react";
import Layout from "../components/ui/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Merch() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
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
    const { data } = await supabase.from("merch_items").select("*");
    setItems(data || []);
  };

  const submit = async (e) => {
    e.preventDefault();

    await supabase.from("merch_items").insert({
      ...form,
      organizer_id: user.id,
      price: Number(form.price),
      stock: Number(form.stock),
    });

    alert("Merch item added!");
    setForm({ name: "", description: "", price: "", stock: "", image_url: "" });
    loadItems();
  };

  return (
    <Layout title="Merch Shop">
      <div className="p-6 max-w-4xl mx-auto space-y-10">

        <h1 className="text-2xl font-bold">Merch Shop</h1>

        {profile?.role === "organizer" && (
          <form onSubmit={submit} className="border p-4 rounded space-y-4">
            <h2 className="text-xl font-semibold">Add New Item</h2>

            <input
              className="border p-2 w-full"
              placeholder="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <textarea
              className="border p-2 w-full"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <input
              className="border p-2 w-full"
              placeholder="Price"
              required
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <input
              className="border p-2 w-full"
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />

            <input
              className="border p-2 w-full"
              placeholder="Image URL"
              value={form.image_url}
              onChange={(e) =>
                setForm({ ...form, image_url: e.target.value })
              }
            />

            <button className="bg-green-600 text-white px-4 py-2 rounded">
              Add Item
            </button>
          </form>
        )}

        <h2 className="text-xl font-semibold">Available Items</h2>
        <div className="grid grid-cols-2 gap-4">
          {items.map((i) => (
            <div key={i.id} className="border p-3 rounded">
              <b>{i.name}</b>
              <p>{i.description}</p>
              <p>${i.price}</p>
              {i.image_url && (
                <img
                  src={i.image_url}
                  className="w-full h-40 object-cover rounded"
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

