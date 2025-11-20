import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Users, BookOpen, ChevronRight, MoreVertical, ArrowLeft } from 'lucide-react';
import { StudyGroup, ChatMessage } from '../types';
import Header from '../components/Header';
import { generateStudyHelp } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';

const StudyGroups: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Static groups for demo - could also be in Firestore
  const groups: StudyGroup[] = [
    { id: 'cs301', name: 'CS301 Algo Masters', subject: 'Computer Science', members: 15 },
    { id: 'chem101', name: 'O-Chem Survival', subject: 'Chemistry', members: 8 },
    { id: 'econ101', name: 'Econ 101 Study', subject: 'Economics', members: 12 },
  ];

  useEffect(() => {
    if (!selectedGroup) return;

    let unsubscribe = () => {};
    try {
        if (db) {
            // Subscribe to messages for specific group
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
                // Scroll to bottom on new message
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
         {id: '2', senderId: 'ai-bot', senderName: 'Gemini AI', text: 'I can help explain algorithms if you get stuck! Just mention @AI', timestamp: new Date(), isAi: true}
     ]);
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedGroup) return;

    const text = messageText;
    setMessageText(''); // Optimistic clear

    if (!user) return;

    try {
        if (!db) throw new Error("DB unavailable");

        // 1. Add User Message
        await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
            text: text,
            senderId: user.uid,
            senderName: user.displayName,
            timestamp: serverTimestamp(),
            isAi: false
        });

        // 2. Check for AI invocation
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
        // Optimistic UI update for demo
        const tempMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: user.uid,
            senderName: user.displayName || 'Me',
            text: text,
            timestamp: new Date(),
            isAi: false
        };
        setMessages(prev => [...prev, tempMsg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        
        if (text.toLowerCase().includes('@ai')) {
            setIsTyping(true);
            setTimeout(async () => {
                const aiResponse = await generateStudyHelp(text, selectedGroup.subject);
                setMessages(prev => [...prev, {
                    id: (Date.now()+1).toString(),
                    senderId: 'ai',
                    senderName: 'Gemini AI',
                    text: aiResponse,
                    timestamp: new Date(),
                    isAi: true
                }]);
                setIsTyping(false);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }, 1000);
        }
    }
  };

  // Group List View
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Header title="Study Groups" />
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-slate-800">My Groups</h2>
             <button className="text-primary text-sm font-bold">Join New</button>
          </div>
          <div className="space-y-3">
            {groups.map(group => (
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
                    <h3 className="font-bold text-slate-900">{group.name}</h3>
                    <p className="text-sm text-slate-500">{group.subject} • {group.members} members</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
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
              <p className="text-[10px] text-slate-500">Gemini AI Active</p>
            </div>
          </div>
        </div>
        <MoreVertical className="text-slate-400" size={20} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">Start the conversation!</div>}
        
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
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message or ask @AI..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;