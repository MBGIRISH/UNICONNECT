import React, { useState, useEffect } from 'react';
import { Tag, Filter, Plus, X, Loader2, Upload, MessageCircle, DollarSign, Package, ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { MarketplaceInquiry, MarketplaceListing } from '../types';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp, query, doc, updateDoc, getDoc, where } from 'firebase/firestore';
import { uploadMarketplaceImages } from '../services/cloudinaryService';
import { getInquiries, sendInquiry } from '../services/marketplaceService';
import { notifyMarketplaceInquiry } from '../services/notificationService';
import { ensureConversation, getConversationId, sendDirectMessage } from '../services/chatService';

const Marketplace: React.FC = () => {
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<MarketplaceInquiry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'Good',
    category: 'Books'
  });

  const formatInquiryTime = (createdAt: MarketplaceInquiry['createdAt']) => {
    if (createdAt instanceof Date) {
      return createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const seconds = (createdAt as any)?.seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return 'Just now';
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
        if (!db || !user) {
          setItems([]);
          setLoading(false);
          return;
        }
        
        // Get user's college from profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userCollege = userDoc.exists() ? userDoc.data()?.college : null;

        if (!userCollege) {
          console.warn('User college not found. Please complete your profile.');
          setItems([]);
          setLoading(false);
          return;
        }

        // Ensure db is valid before creating query
        if (!db) {
          console.error('Firestore db is not initialized');
          setItems([]);
          setLoading(false);
          return;
        }

        // Filter items by user's college
        const marketplaceRef = collection(db, "marketplace");
        const q = query(
          marketplaceRef,
          where("college", "==", userCollege)
        );
        
        const snapshot = await getDocs(q);
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as MarketplaceListing));
        
        setItems(fetchedItems);
    } catch (e) {
        console.error("Error fetching marketplace items:", e);
        setItems([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!selectedItem) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadInquiries = async () => {
      try {
        const inquiries = await getInquiries(selectedItem.id);
        if (!cancelled) {
          setMessages(inquiries);
        }
      } catch (error) {
        console.error('Error loading marketplace inquiries:', error);
        if (!cancelled) {
          setMessages([]);
        }
      }
    };

    loadInquiries();

    return () => {
      cancelled = true;
    };
  }, [selectedItem?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to sell items');
      return;
    }

    setUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload images to Cloudinary
      if (imageFiles.length > 0) {
        const listingId = `listing_${Date.now()}`;
        imageUrls = await uploadMarketplaceImages(listingId, imageFiles);
      }

      if (!db) {
        throw new Error("DB unavailable");
      }
      
      // Get user's college from profile
      let userCollege = '';
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          userCollege = userDoc.data()?.college || '';
        }
      } catch (error) {
        console.error('Error fetching user college:', error);
      }

      if (!userCollege) {
        throw new Error('Please complete your profile with your college information before listing items.');
      }
      
      const marketplaceRef = collection(db, "marketplace");
      await addDoc(marketplaceRef, {
        title: newItem.title,
        description: newItem.description,
        price: Number(newItem.price),
        condition: newItem.condition,
        category: newItem.category,
        images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400'],
        sellerId: user.uid,
        sellerName: user.displayName || 'User',
        sellerAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
        college: userCollege, // Add college field for filtering
        isSold: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowSellModal(false);
      setNewItem({ title: '', description: '', price: '', condition: 'Good', category: 'Books' });
      setImageFiles([]);
      setImagePreviews([]);
      fetchItems();
      setSuccessMessage('Item listed successfully! 🎉');
      setShowSuccessModal(true);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to list item');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = (item: MarketplaceListing) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleStartChat = async () => {
    if (!user) {
      alert('Please log in to message sellers');
      return;
    }
    
    if (!selectedItem) return;

    setShowDetailModal(false);
    navigate('/messages', {
      state: {
        userId: selectedItem.sellerId,
        userName: selectedItem.sellerName,
        userPhoto: selectedItem.sellerAvatar,
        itemId: selectedItem.id,
        itemTitle: selectedItem.title,
      }
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedItem || !user || !db) return;

    try {
      const conversationId = getConversationId(user.uid, selectedItem.sellerId);
      await ensureConversation(conversationId, [user.uid, selectedItem.sellerId]);

      await sendInquiry(
        selectedItem.id,
        user.uid,
        user.displayName || 'User',
        selectedItem.sellerId,
        newMessage.trim()
      );

      await notifyMarketplaceInquiry(
        selectedItem.sellerId,
        user.displayName || 'User',
        user.uid,
        selectedItem.title,
        selectedItem.id
      );

      await sendDirectMessage({
        conversationId,
        senderId: user.uid,
        receiverId: selectedItem.sellerId,
        text: newMessage.trim(),
        messageType: 'text',
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || '',
        receiverName: selectedItem.sellerName,
        receiverPhoto: selectedItem.sellerAvatar || '',
      });

      setNewMessage('');
      const inquiries = await getInquiries(selectedItem.id);
      setMessages(inquiries);
      setShowMessageModal(false);
      navigate('/messages', {
        state: {
          userId: selectedItem.sellerId,
          userName: selectedItem.sellerName,
          userPhoto: selectedItem.sellerAvatar,
          itemId: selectedItem.id,
          itemTitle: selectedItem.title,
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleMarkAsSold = async () => {
    if (!selectedItem || !user || selectedItem.sellerId !== user.uid) return;

    try {
      if (!db) throw new Error("DB unavailable");
      
      const itemRef = doc(db, 'marketplace', selectedItem.id);
      await updateDoc(itemRef, {
        isSold: true,
        updatedAt: serverTimestamp()
      });

      setShowDetailModal(false);
      fetchItems();
      setSuccessMessage('Item marked as sold! 🎉');
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert('Failed to update item');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-4 md:pb-4 lg:pb-0 w-full max-w-full overflow-x-hidden">
      <Header title="Marketplace" />
      
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Browse Listings</h2>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50">
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button 
              onClick={() => setShowSellModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
              <Plus size={16} />
              Sell Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-primary" size={40}/>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No items yet</h3>
            <p className="text-slate-500 mb-6">Be the first to list something for sale!</p>
            <button 
              onClick={() => setShowSellModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              List Your First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleViewDetails(item)}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer touch-manipulation w-full max-w-full"
              >
                <div className="aspect-square overflow-hidden bg-slate-100 relative w-full">
                  <img 
                    src={item.images[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 max-w-full" 
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                    ₹{item.price}
                  </div>
                  {item.isSold && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg font-bold text-xs md:text-sm">SOLD</span>
                    </div>
                  )}
                </div>
                <div className="p-2 sm:p-3 min-w-0">
                  <h3 className="font-medium text-slate-800 truncate text-xs sm:text-sm mb-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 gap-1">
                    <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100 rounded whitespace-nowrap">{item.condition}</span>
                    <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                      <Tag size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate min-w-0">{item.sellerName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sell Item Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 safe-top safe-bottom">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Sell an Item</h2>
              <button onClick={() => {
                setShowSellModal(false);
                setImageFiles([]);
                setImagePreviews([]);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={24}/>
              </button>
            </div>
            <form onSubmit={handleSell} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Title *</label>
                <input 
                  required 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="e.g. Calculus Textbook"
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input 
                    required 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condition *</label>
                  <select 
                    value={newItem.condition}
                    onChange={e => setNewItem({...newItem, condition: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select 
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Sports">Sports Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea 
                  required
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Describe your item..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Images (Max 5)</label>
                {imagePreviews.length === 0 ? (
                  <label className="w-full p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary cursor-pointer flex flex-col items-center gap-2 transition-colors">
                    <Upload size={32} className="text-slate-400" />
                    <span className="text-sm text-slate-600">Click to upload images</span>
                    <span className="text-xs text-slate-400">Up to 5 images</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {imagePreviews.length < 5 && (
                      <label className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary cursor-pointer flex items-center justify-center gap-2 transition-colors">
                        <Plus size={20} className="text-slate-400" />
                        <span className="text-sm text-slate-600">Add more images</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full py-3 sm:py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors touch-manipulation text-sm sm:text-base"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    List for Sale
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-3 md:p-4 safe-top safe-bottom">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Item Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24}/>
              </button>
            </div>
            <div className="p-4 sm:p-5 md:p-6">
              {/* Image Gallery */}
              <div className="mb-4 md:mb-6 w-full max-w-full">
                <img 
                  src={selectedItem.images[0] || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600'} 
                  alt={selectedItem.title} 
                  className="w-full h-48 md:h-64 object-cover rounded-xl mb-3 max-w-full"
                />
                {selectedItem.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 w-full max-w-full">
                    {selectedItem.images.slice(1, 5).map((img, idx) => (
                      <img key={idx} src={img} alt={`${selectedItem.title} ${idx + 2}`} className="w-full h-20 object-cover rounded-lg max-w-full" />
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg md:text-2xl font-bold text-slate-900 mb-2 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{selectedItem.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-2 md:px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium text-xs md:text-sm">{selectedItem.category}</span>
                    <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs md:text-sm">{selectedItem.condition}</span>
                    {selectedItem.isSold && (
                      <span className="px-2 md:px-3 py-1 bg-red-50 text-red-600 rounded-full font-medium text-xs md:text-sm">SOLD</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 md:p-4 bg-slate-50 rounded-xl">
                  <img 
                    src={selectedItem.sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedItem.sellerName)}`}
                    alt={selectedItem.sellerName}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-slate-500">Seller</p>
                    <p className="font-semibold text-slate-900 truncate text-sm md:text-base">{selectedItem.sellerName}</p>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-0">
                    <p className="text-lg sm:text-xl md:text-3xl font-bold text-primary break-words">{selectedItem.price}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Description</h4>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{selectedItem.description}</p>
                </div>

                {user && user.uid === selectedItem.sellerId && messages.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Buyer inquiries</h4>
                      <span className="text-xs text-slate-500">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {messages.map((msg) => (
                        <div key={msg.id} className="bg-white border border-slate-200 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-900">{msg.buyerName}</p>
                            <p className="text-[11px] text-slate-400">
                              {msg.createdAt instanceof Date
                                ? msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date((msg.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 break-words">{msg.message}</p>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const buyerPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.buyerName || 'User')}`;
                                try {
                                  const conversationId = getConversationId(user?.uid || msg.buyerId, msg.buyerId);
                                  if (user) {
                                    await ensureConversation(conversationId, [user.uid, msg.buyerId]);
                                  }
                                } catch (error) {
                                  console.error('Failed to prepare conversation:', error);
                                }
                                navigate('/messages', {
                                  state: {
                                    userId: msg.buyerId,
                                    userName: msg.buyerName,
                                    userPhoto: buyerPhoto,
                                    itemId: selectedItem.id,
                                    itemTitle: selectedItem.title,
                                  }
                                });
                              }}
                              className="text-xs font-medium text-primary hover:text-indigo-700"
                            >
                              Reply in Messages
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {user && user.uid === selectedItem.sellerId ? (
                    !selectedItem.isSold && (
                      <button 
                        onClick={handleMarkAsSold}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                      >
                        Mark as Sold
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={handleStartChat}
                      disabled={selectedItem.isSold}
                      className="flex-1 py-3 sm:py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors touch-manipulation text-sm sm:text-base"
                    >
                      <MessageCircle size={18} className="sm:w-5 sm:h-5" />
                      {selectedItem.isSold ? 'Item Sold' : 'Message Seller'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md h-[600px] flex flex-col m-4 md:m-0">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <button onClick={() => setShowMessageModal(false)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={24}/>
              </button>
              <img 
                src={selectedItem.sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedItem.sellerName)}`}
                alt={selectedItem.sellerName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{selectedItem.sellerName}</h3>
                <p className="text-xs text-slate-500 truncate">{selectedItem.title}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">
                  <MessageCircle size={48} className="mx-auto text-slate-300 mb-3" />
                  <p>Start the conversation!</p>
                  <p className="text-xs mt-1">Ask about the item</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.buyerId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 text-sm ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                      }`}>
                        {user && user.uid === selectedItem.sellerId && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1">{msg.buyerName}</p>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {formatInquiryTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-full border border-slate-200">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-800"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </div>
  );
};

export default Marketplace;
