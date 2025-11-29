import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, ArrowLeft, Search, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  or,
  limit,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { getUserProfile } from '../services/profileService';

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  imageUrl?: string;
  createdAt: any;
  read: boolean;
}

interface Conversation {
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  lastMessageTime: any;
  unread: number;
}

const Messages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, photo: string} | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Check if we came from search with a specific user
    if (location.state?.userId && location.state?.userName) {
      setSelectedUser({
        id: location.state.userId,
        name: location.state.userName,
        photo: location.state.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.state.userName)}`
      });
    }
  }, [location.state]);

  // Load conversations
  useEffect(() => {
    if (!currentUser || !db) {
      setConversations([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', currentUser.uid),
        where('receiverId', '==', currentUser.uid)
      ),
      limit(100) // Increased limit since we filter client-side
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convMap = new Map<string, Conversation>();
      
      // Sort docs client-side since we removed orderBy
      const docs = snapshot.docs.sort((a, b) => {
        const timeA = a.data().createdAt?.toMillis?.() || 0;
        const timeB = b.data().createdAt?.toMillis?.() || 0;
        return timeB - timeA; // Descending
      });

      // First pass: Build conversation map with message data
      docs.forEach((doc) => {
        const msg = doc.data();
        const otherUserId = msg.senderId === currentUser.uid ? msg.receiverId : msg.senderId;
        
        if (!convMap.has(otherUserId)) {
          // Determine the correct name and photo from message data
          let userName = 'Unknown User';
          let userPhoto = `https://ui-avatars.com/api/?name=User`;
          
          if (msg.senderId === currentUser.uid) {
            // Current user sent this message, so use receiver's info
            userName = msg.receiverName || 'Unknown User';
            userPhoto = msg.receiverPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
          } else {
            // Someone else sent this message, so use sender's info
            userName = msg.senderName || 'Unknown User';
            userPhoto = msg.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
          }
          
          convMap.set(otherUserId, {
            userId: otherUserId,
            userName,
            userPhoto,
            lastMessage: msg.text || '📷 Image',
            lastMessageTime: msg.createdAt,
            unread: msg.receiverId === currentUser.uid && !msg.read ? 1 : 0
          });
        } else {
          // Update unread count if needed
          const existingConv = convMap.get(otherUserId);
          if (existingConv && msg.receiverId === currentUser.uid && !msg.read) {
            existingConv.unread += 1;
          }
        }
      });

      // Set conversations immediately with message data
      setConversations(Array.from(convMap.values()));

      // Second pass: Fetch user profiles asynchronously and update
      const userIds = Array.from(convMap.keys());
      userIds.forEach(async (userId) => {
        try {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
            setConversations(prev => prev.map(conv => 
              conv.userId === userId 
                ? { ...conv, userName: userProfile.displayName || conv.userName, userPhoto: userProfile.photoURL || conv.userPhoto }
                : conv
            ));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

        // Load messages for selected user
        useEffect(() => {
          if (!selectedUser || !currentUser || !db) {
            setMessages([]);
            return;
          }

    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', currentUser.uid),
        where('receiverId', '==', currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const msg = doc.data();
        if (
          (msg.senderId === currentUser.uid && msg.receiverId === selectedUser.id) ||
          (msg.senderId === selectedUser.id && msg.receiverId === currentUser.uid)
        ) {
          msgs.push({ id: doc.id, ...msg } as Message);
          
          // Mark as read if it's for current user
          if (msg.receiverId === currentUser.uid && !msg.read) {
            updateDoc(doc.ref, { read: true });
          }
        }
      });

      // Sort messages by time (ascending)
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedUser, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      senderPhoto: currentUser.photoURL || '',
      receiverId: selectedUser.id,
      receiverName: selectedUser.name,
      createdAt: db ? serverTimestamp() : new Date(),
      read: false
    };

    try {
      if (db) {
        await addDoc(collection(db, 'messages'), messageData);
      } else {
        console.error('Database not available');
        alert('Cannot send message. Please check your connection.');
      }
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser || !currentUser) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, `uniconnect/messages/${currentUser.uid}`);
      
      const messageData = {
        text: '',
        imageUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhoto: currentUser.photoURL || '',
        receiverId: selectedUser.id,
        receiverName: selectedUser.name,
        createdAt: db ? serverTimestamp() : new Date(),
        read: false
      };

      if (db) {
        await addDoc(collection(db, 'messages'), messageData);
      } else {
        setMessages([...messages, {
          id: Date.now().toString(),
          ...messageData,
          createdAt: new Date()
        } as Message]);
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden pb-20 md:pb-0">
        {/* Conversations List */}
        <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full">
          <div className="p-3 sm:p-4 border-b border-slate-200 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Messages</h1>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pb-20 md:pb-0" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle size={40} className="sm:w-12 sm:h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-2 text-sm sm:text-base">No conversations yet</p>
                <p className="text-xs sm:text-sm text-slate-400 px-6">Use the search bar to find people and start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUser({
                    id: conv.userId,
                    name: conv.userName,
                    photo: conv.userPhoto
                  })}
                  className="w-full p-3 sm:p-4 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 flex items-center gap-2 sm:gap-3 text-left touch-manipulation"
                >
                  <img 
                    src={conv.userPhoto}
                    alt={conv.userName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{conv.userName}</p>
                      {conv.unread > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Empty State - Desktop only */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageCircle size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-xl text-slate-500">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-2">Choose someone to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen md:h-screen bg-white overflow-hidden pb-20 md:pb-0 max-w-full">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center gap-2 sm:gap-3 bg-white sticky top-0 z-10 flex-shrink-0">
        <button 
          onClick={() => setSelectedUser(null)}
          className="md:hidden flex-shrink-0"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6 text-slate-600" />
        </button>
        <img 
          src={selectedUser.photo}
          alt={selectedUser.name}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{selectedUser.name}</h2>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50 min-h-0" style={{ maxHeight: 'calc(100vh - 180px)', width: '100%' }}>
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <div 
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full max-w-full`}
            >
              <div className={`max-w-[85%] sm:max-w-[70%] min-w-0 message-container ${isMine ? 'order-2' : 'order-1'}`} style={{ maxWidth: '85%' }}>
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl}
                    alt="Shared"
                    className="rounded-lg mb-1 max-h-48 sm:max-h-64 w-full h-auto object-contain"
                    style={{ maxWidth: '100%' }}
                  />
                )}
                {msg.text && (
                  <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base ${
                    isMine 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                    <p style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1 px-2 break-words">
                  {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Sticky at bottom with safe area padding, above mobile nav */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white fixed md:sticky bottom-20 md:bottom-0 left-0 right-0 z-10 flex-shrink-0 pb-safe md:pb-0 max-w-full">
        <div className="flex items-center gap-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full flex-shrink-0 touch-manipulation"
            aria-label="Upload image"
          >
            <ImageIcon size={18} className="sm:w-5 sm:h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || uploading}
            className="p-2 sm:p-2.5 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation transition-colors"
            aria-label="Send message"
          >
            <Send size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        {uploading && (
          <p className="text-xs text-slate-500 mt-2 text-center">Uploading image...</p>
        )}
      </div>
    </div>
  );
};

export default Messages;

