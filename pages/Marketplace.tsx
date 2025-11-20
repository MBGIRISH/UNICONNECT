import React, { useState, useEffect } from 'react';
import { Tag, Filter, Plus, X, Loader2 } from 'lucide-react';
import { MarketplaceItem } from '../types';
import Header from '../components/Header';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const Marketplace: React.FC = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [newItem, setNewItem] = useState<Partial<MarketplaceItem>>({
      condition: 'Good',
      image: 'https://picsum.photos/seed/sell/400/400'
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
        if (!db) throw new Error("DB unavailable");
        const snapshot = await getDocs(collection(db, "market"));
        const fetchedItems = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as MarketplaceItem));
        if (fetchedItems.length > 0) setItems(fetchedItems);
        else throw new Error("Empty");
    } catch (e) {
        // Mock fallback
        setItems([
        {
            id: '1',
            title: 'Calculus: Early Transcendentals',
            price: 45,
            description: 'Used for one semester',
            seller: 'John D.',
            image: 'https://picsum.photos/seed/book/400/400',
            condition: 'Good'
        }
        ]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSell = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return alert("Login required");

      try {
          if (!db) throw new Error("DB unavailable");
          await addDoc(collection(db, "market"), {
              ...newItem,
              price: Number(newItem.price),
              seller: user.displayName || 'Student',
              sellerId: user.uid,
              createdAt: serverTimestamp()
          });
          setShowModal(false);
          fetchItems();
      } catch (e) {
          console.error(e);
          // Demo fallback
          setItems([...items, { ...newItem, id: 'demo', seller: user.displayName, price: Number(newItem.price) } as MarketplaceItem]);
          setShowModal(false);
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header title="Marketplace" />
      
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Featured Listings</h2>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50">
                <Filter size={16} />
                Filters
            </button>
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
                <Plus size={16} />
                Sell Item
            </button>
          </div>
        </div>

        {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary"/></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer">
                <div className="aspect-square overflow-hidden bg-slate-100 relative">
                    <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                    ${item.price}
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="font-medium text-slate-800 truncate text-sm mb-1">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.condition}</span>
                    <div className="flex items-center gap-1">
                        <Tag size={12} />
                        {item.seller}
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Sell Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">List Item</h2>
                    <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-400"/></button>
                </div>
                <form onSubmit={handleSell} className="space-y-4">
                    <input required placeholder="Item Title" className="w-full p-3 bg-slate-50 rounded-xl border" 
                        onChange={e => setNewItem({...newItem, title: e.target.value})} />
                    <div className="flex gap-4">
                        <input required type="number" placeholder="Price ($)" className="w-1/2 p-3 bg-slate-50 rounded-xl border"
                            onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                        <select className="w-1/2 p-3 bg-slate-50 rounded-xl border"
                            onChange={e => setNewItem({...newItem, condition: e.target.value as any})}>
                            <option>New</option>
                            <option>Like New</option>
                            <option>Good</option>
                            <option>Fair</option>
                        </select>
                    </div>
                    <textarea required placeholder="Description" className="w-full p-3 bg-slate-50 rounded-xl border" rows={3}
                        onChange={e => setNewItem({...newItem, description: e.target.value})} />
                    
                    <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold">List for Sale</button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

export default Marketplace;