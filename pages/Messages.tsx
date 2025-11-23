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
  doc
} from 'firebase/firestore';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

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

      docs.forEach((doc) => {
        const msg = doc.data();
        const otherUserId = msg.senderId === currentUser.uid ? msg.receiverId : msg.senderId;
        
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            userId: otherUserId,
            userName: msg.senderName || 'Unknown User',
            userPhoto: msg.senderPhoto || `https://ui-avatars.com/api/?name=User`,
            lastMessage: msg.text || '📷 Image',
            lastMessageTime: msg.createdAt,
            unread: msg.receiverId === currentUser.uid && !msg.read ? 1 : 0
          });
        }
      });

      setConversations(Array.from(convMap.values()));
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
      <div className="flex h-screen bg-slate-50">
        {/* Conversations List */}
        <div className="w-full md:w-96 bg-white border-r border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-2">No conversations yet</p>
                <p className="text-sm text-slate-400 px-6">Use the search bar to find people and start chatting</p>
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
                  className="w-full p-4 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-left"
                >
                  <img 
                    src={conv.userPhoto}
                    alt={conv.userName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{conv.userName}</p>
                      {conv.unread > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Empty State */}
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
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white sticky top-0 z-10">
        <button 
          onClick={() => setSelectedUser(null)}
          className="md:hidden"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <img 
          src={selectedUser.photo}
          alt={selectedUser.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">{selectedUser.name}</h2>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <div 
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl}
                    alt="Shared"
                    className="rounded-lg mb-1 max-h-64 w-auto"
                  />
                )}
                {msg.text && (
                  <div className={`px-4 py-2 rounded-2xl ${
                    isMine 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1 px-2">
                  {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
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
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;

