import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Users, BookOpen, ChevronRight, MoreVertical, ArrowLeft, Plus, X, Upload, Image as ImageIcon, Lock, Globe, Search } from 'lucide-react';
import { StudyGroup, ChatMessage } from '../types';
import Header from '../components/Header';
import { generateStudyHelp } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { uploadPostImages } from '../services/cloudinaryService';

const StudyGroups: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [newGroup, setNewGroup] = useState({
    name: '',
    subject: '',
    description: '',
    isPrivate: false
  });

  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      if (!db) throw new Error("DB unavailable");
      const querySnapshot = await getDocs(collection(db, "groups"));
      const fetchedGroups = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StudyGroup));
      
      if (fetchedGroups.length > 0) {
        setGroups(fetchedGroups);
      } else {
        // Show demo groups
        setGroups([
          { id: 'demo-1', name: 'CS301 Algo Masters', subject: 'Computer Science', members: 15, description: 'Study algorithms together', isPrivate: false },
          { id: 'demo-2', name: 'O-Chem Survival', subject: 'Chemistry', members: 8, description: 'Organic Chemistry help', isPrivate: false },
          { id: 'demo-3', name: 'Econ 101 Study', subject: 'Economics', members: 12, description: 'Economics fundamentals', isPrivate: false },
        ]);
      }
    } catch (err) {
      console.error(err);
      setGroups([
        { id: 'demo-1', name: 'CS301 Algo Masters', subject: 'Computer Science', members: 15, description: 'Study algorithms together', isPrivate: false },
        { id: 'demo-2', name: 'O-Chem Survival', subject: 'Chemistry', members: 8, description: 'Organic Chemistry help', isPrivate: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGroups = async () => {
    if (!user || !db) return;
    try {
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const myIds = new Set<string>();
      
      for (const groupDoc of groupsSnapshot.docs) {
        const memberDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'members', user.uid));
        if (memberDoc.exists()) {
          myIds.add(groupDoc.id);
        }
      }
      
      setMyGroupIds(myIds);
    } catch (error) {
      console.error('Error loading my groups:', error);
    }
  };

  useEffect(() => {
    if (!selectedGroup) return;

    let unsubscribe = () => {};
    try {
        if (db) {
            const q = query(
                collection(db, "groups", selectedGroup.id, "messages"),
                orderBy("timestamp", "asc"),
                limit(50)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
                    } as ChatMessage;
                });
                setMessages(msgs);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }, (error) => {
                console.error("Group Chat Error:", error);
                loadMockMessages();
            });
        } else {
            loadMockMessages();
        }
    } catch (e) {
        console.error("Firestore init failed", e);
        loadMockMessages();
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [selectedGroup]);

  const loadMockMessages = () => {
     setMessages([
         {id: '1', senderId: 'mock', senderName: 'Alice', text: 'Hey everyone! Anyone started the assignment?', timestamp: new Date(), isAi: false},
         {id: '2', senderId: 'ai-bot', senderName: 'Gemini AI', text: 'I can help explain concepts if you get stuck! Just mention @AI', timestamp: new Date(), isAi: true}
     ]);
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) {
      alert('Please log in to create a group');
      return;
    }

    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        ...newGroup,
        creatorId: user.uid,
        members: 1,
        createdAt: serverTimestamp()
      });

      // Add creator as first member
      await setDoc(doc(db, 'groups', groupRef.id, 'members', user.uid), {
        userId: user.uid,
        userName: user.displayName || 'User',
        role: 'owner',
        joinedAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setNewGroup({ name: '', subject: '', description: '', isPrivate: false });
      loadGroups();
      loadMyGroups();
      alert('Group created successfully! 🎉');
    } catch (error) {
      console.error(error);
      alert('Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user || !db) {
      alert('Please log in to join groups');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        alert('Joined demo group! (Demo mode)');
        setMyGroupIds(prev => new Set(prev).add(groupId));
        return;
      }

      // Add user to members
      await setDoc(doc(db, 'groups', groupId, 'members', user.uid), {
        userId: user.uid,
        userName: user.displayName || 'User',
        role: 'member',
        joinedAt: serverTimestamp()
      });

      // Increment member count
      await updateDoc(groupRef, {
        members: increment(1)
      });

      setMyGroupIds(prev => new Set(prev).add(groupId));
      setShowJoinModal(false);
      alert('Joined group successfully! 🎉');
      loadGroups();
    } catch (error) {
      console.error(error);
      alert('Failed to join group');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !imageFile) || !selectedGroup || !user) return;

    const text = messageText;
    setMessageText('');
    setUploading(true);

    try {
        let imageUrl = '';
        
        // Upload image if present
        if (imageFile) {
          const messageId = `msg_${Date.now()}`;
          const urls = await uploadPostImages(messageId, [imageFile]);
          imageUrl = urls[0];
          setImageFile(null);
          setImagePreview('');
        }

        if (!db) throw new Error("DB unavailable");

        // Add message to Firestore
        await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
            text: text,
            imageUrl: imageUrl || null,
            senderId: user.uid,
            senderName: user.displayName || 'User',
            timestamp: serverTimestamp(),
            isAi: false
        });

        // Check for AI invocation
        if (text.toLowerCase().includes('@ai')) {
            setIsTyping(true);
            const aiResponse = await generateStudyHelp(text, selectedGroup.subject);
            
            await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
                text: aiResponse,
                senderId: 'ai-bot',
                senderName: 'Gemini AI',
                timestamp: serverTimestamp(),
                isAi: true
            });
            setIsTyping(false);
        }
    } catch (e) {
        console.error("Failed to send", e);
        // Fallback for demo mode
        const tempMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: user.uid,
            senderName: user.displayName || 'Me',
            text: text,
            imageUrl: imagePreview || undefined,
            timestamp: new Date(),
            isAi: false
        };
        setMessages(prev => [...prev, tempMsg]);
        setImageFile(null);
        setImagePreview('');
    } finally {
        setUploading(false);
    }
  };

  const myGroups = groups.filter(g => myGroupIds.has(g.id));
  const availableGroups = groups.filter(g => !myGroupIds.has(g.id));

  // Group List View
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Header title="Study Groups" />
        <div className="max-w-3xl mx-auto p-4">
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Create Group
            </button>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
            >
              <Search size={20} />
              Join Group
            </button>
          </div>

          {/* My Groups */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">My Groups ({myGroups.length})</h2>
            {myGroups.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-100 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-2">You haven't joined any groups yet</p>
                <p className="text-sm text-slate-400">Create a new group or join existing ones!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myGroups.map(group => (
                  <div 
                    key={group.id} 
                    onClick={() => setSelectedGroup(group)}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{group.name}</h3>
                          {group.isPrivate && <Lock size={14} className="text-slate-400" />}
                        </div>
                        <p className="text-sm text-slate-500">{group.subject} • {group.members} members</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Groups */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Discover Groups ({availableGroups.length})</h2>
            <div className="space-y-3">
              {availableGroups.map(group => (
                <div 
                  key={group.id} 
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Users size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{group.name}</h3>
                          {group.isPrivate ? <Lock size={14} className="text-slate-400" /> : <Globe size={14} className="text-green-500" />}
                        </div>
                        <p className="text-sm text-slate-500">{group.subject} • {group.members} members</p>
                        {group.description && <p className="text-xs text-slate-400 mt-1">{group.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="ml-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-800">Create Group</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24}/>
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group Name *</label>
                  <input 
                    required 
                    value={newGroup.name}
                    onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="e.g. CS301 Study Group"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                  <input 
                    required
                    value={newGroup.subject}
                    onChange={e => setNewGroup({...newGroup, subject: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    value={newGroup.description}
                    onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="What's this group about?"
                    rows={3}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <input 
                    type="checkbox"
                    id="private"
                    checked={newGroup.isPrivate}
                    onChange={e => setNewGroup({...newGroup, isPrivate: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="private" className="text-sm text-slate-700 flex items-center gap-2">
                    <Lock size={16} />
                    Make this group private
                  </label>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  Create Group
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-800">Join a Group</h2>
                <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24}/>
                </button>
              </div>
              <div className="p-6 space-y-3">
                {availableGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No groups available to join</p>
                    <p className="text-sm text-slate-400 mt-1">Create a new group instead!</p>
                  </div>
                ) : (
                  availableGroups.map(group => (
                    <div key={group.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{group.name}</h3>
                            {group.isPrivate ? <Lock size={14} className="text-slate-400" /> : <Globe size={14} className="text-green-500" />}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{group.subject}</p>
                          {group.description && <p className="text-xs text-slate-400 mt-1">{group.description}</p>}
                          <p className="text-xs text-slate-500 mt-2">{group.members} members</p>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="ml-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chat View
  return (
    <div className="h-screen flex flex-col bg-white md:ml-64 relative z-0">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedGroup(null)} className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight">{selectedGroup.name}</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-500">{selectedGroup.members} members • AI Active</p>
            </div>
          </div>
        </div>
        <MoreVertical className="text-slate-400" size={20} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            <Bot size={48} className="mx-auto text-indigo-300 mb-3" />
            <p>Start the conversation!</p>
            <p className="text-xs mt-2">Mention @AI to get study help</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid || msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 text-sm shadow-sm ${
                isMe 
                    ? 'bg-primary text-white rounded-br-none' 
                    : msg.isAi 
                    ? 'bg-white border-2 border-indigo-100 text-slate-800 rounded-bl-none'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                {msg.isAi && (
                    <div className="flex items-center gap-2 mb-1 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                    <Bot size={14} />
                    Study Buddy
                    </div>
                )}
                {!isMe && !msg.isAi && <p className="text-[10px] font-bold text-slate-400 mb-1">{msg.senderName}</p>}
                
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Shared" 
                    className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.imageUrl, '_blank')}
                  />
                )}
                
                {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                
                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </span>
                </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-3 rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-white border-t border-slate-200">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            <button 
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <label className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors">
            <ImageIcon size={20} />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !uploading && handleSendMessage()}
            placeholder="Type a message, share images, or ask @AI..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && !imageFile) || uploading}
            className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
