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
  Tag,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle,
  Loader
} from "lucide-react";

export default function Merch() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  
  // Cart & Checkout State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1=Summary, 2=Payment, 3=Success
  const [checkoutItems, setCheckoutItems] = useState([]); // Items being purchased
  
  // Checkout Form State
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' or 'cod'
  const [isProcessing, setIsProcessing] = useState(false);

  // Admin State (for organizers to add items later)
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", image_url: "" });

  // === OFFICIAL MERCH DATA (All 8 Items) ===
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
      image_url: "/images/merch/pro-match-ball.jpg",
      team: "Tournament Gear",
      category: "Equipment"
    }
  ];

  useEffect(() => {
    if (profile?.role === "organizer") setIsOrganizer(true);
    loadItems();
  }, [profile]);

  const loadItems = async () => {
    // Try loading from Supabase first, fallback to hardcoded list if empty
    const { data } = await supabase.from("merch_items").select("*");
    if (data && data.length > 0) {
      setItems(data);
    } else {
      setItems(officialMerch);
    }
  };

  // --- CART ACTIONS ---
  const addToCart = (item) => {
    setCart([...cart, item]);
    setIsCartOpen(true);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  // --- CHECKOUT ACTIONS ---
  const startCheckout = (itemsToBuy) => {
    if (!user) return alert("Please login to purchase.");
    setCheckoutItems(itemsToBuy);
    setCheckoutStep(1); // Reset to summary step
    setIsCheckoutOpen(true);
    setIsCartOpen(false); // Close cart drawer
  };

  const calculateTotal = () => {
    return checkoutItems.reduce((total, item) => total + Number(item.price), 0).toFixed(2);
  };

  const handlePayment = async () => {
    if (!address) return alert("Please enter a shipping address.");
    setIsProcessing(true);

    // Simulate Network Delay
    setTimeout(async () => {
      // 1. Save Order to Supabase 'orders' table
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: calculateTotal(),
          status: paymentMethod === 'cod' ? 'pending' : 'paid',
          payment_method: paymentMethod,
          shipping_address: address
        })
        .select()
        .single();

      if (orderError) {
        alert("Order failed: " + orderError.message);
        setIsProcessing(false);
        return;
      }

      // 2. Save Order Items to 'order_items' table
      const orderItemsData = checkoutItems.map(item => ({
        order_id: orderData.id,
        product_name: item.name,
        price: item.price,
        quantity: 1
      }));

      await supabase.from("order_items").insert(orderItemsData);

      // 3. Success!
      setIsProcessing(false);
      setCheckoutStep(3); // Show Success Screen
      setCart([]); // Clear cart if we bought everything
    }, 2000);
  };

  return (
    <Layout title="The Shop">
      <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20 relative">
        
        {/* === 1. HERO SECTION === */}
        <div className="relative w-full h-[50vh] bg-neutral-900 overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Stadium"
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
               <button 
                 onClick={() => setIsCartOpen(true)}
                 className="relative cursor-pointer group"
               >
                 <ShoppingBag size={22} className="text-gray-700 group-hover:text-black transition-colors" />
                 {cart.length > 0 && (
                   <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                     {cart.length}
                   </span>
                 )}
               </button>
             </div>
          </div>
        </div>

        {/* === 3. PRODUCT GRID === */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((i) => (
              <div key={i.id} className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Image Area */}
                <div className="relative aspect-[4/5] bg-white p-4 overflow-hidden rounded-t-2xl">
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
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    // Fallback if image fails
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/f3f4f6/9ca3af?text=Image+Coming+Soon"; }}
                  />
                </div>

                {/* Details Area */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-white rounded-b-2xl border-t border-gray-50">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{i.category || "Merch"}</p>
                       <p className="font-bold text-gray-900">${Number(i.price).toFixed(2)}</p>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">{i.name}</h3>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => startCheckout([i])}
                      className="flex-1 bg-black text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                      Buy Now
                    </button>
                    <button 
                      onClick={() => addToCart(i)}
                      className="bg-gray-100 text-gray-900 p-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* === FOOTER STATS === */}
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

        {/* === 4. CART DRAWER (Slide Out) === */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag size={20} /> Your Cart ({cart.length})
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">Your cart is empty.</div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <img src={item.image_url} className="w-16 h-16 object-cover rounded-lg bg-white" alt={item.name} />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-gray-500">${item.price}</p>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span>${cart.reduce((a, b) => a + Number(b.price), 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => startCheckout(cart)}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === 5. CHECKOUT MODAL === */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCheckoutOpen(false)} />
            <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Secure Checkout</h2>
                <button onClick={() => setIsCheckoutOpen(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
              </div>

              <div className="p-8">
                {/* STEP 1: REVIEW & ADDRESS */}
                {checkoutStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h3>
                      <div className="max-h-32 overflow-y-auto space-y-2 mb-4 pr-2">
                        {checkoutItems.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate pr-4">{item.name}</span>
                            <span className="font-bold">${item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xl font-black border-t pt-3">
                        <span>Total To Pay</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Shipping Address</label>
                      <textarea 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                        rows="2"
                        placeholder="Enter your full delivery address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={() => setCheckoutStep(2)}
                      disabled={!address}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {checkoutStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-900">Select Payment Method</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <CreditCard size={24} />
                        <span className="text-xs font-bold">Credit Card</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <Banknote size={24} />
                        <span className="text-xs font-bold">Cash on Delivery</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                        <p className="text-xs text-gray-500 mb-2">Mock Payment Gateway</p>
                        <div className="h-10 bg-white border rounded-lg flex items-center px-3 text-gray-400 text-sm">
                          •••• •••• •••• 4242
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                    >
                      {isProcessing ? <Loader className="animate-spin" /> : `Pay $${calculateTotal()}`}
                    </button>
                    <button onClick={() => setCheckoutStep(1)} className="w-full text-xs text-gray-400 hover:text-gray-600 font-bold">Back</button>
                  </div>
                )}

                {/* STEP 3: SUCCESS */}
                {checkoutStep === 3 && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
                    <p className="text-gray-500 mb-8">
                      {paymentMethod === 'cod' ? "Please pay the driver upon delivery." : "Your payment was successful."}
                      <br/>We've sent a receipt to your email.
                    </p>
                    <button 
                      onClick={() => setIsCheckoutOpen(false)}
                      className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}