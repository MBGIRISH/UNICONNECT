import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Post } from '../types';
import Header from '../components/Header';
import { generatePostContent } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Real-time listener for posts
    let unsubscribe = () => {};
    
    try {
        // Check if DB is available
        if (db) {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
            unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post));
            setPosts(fetchedPosts);
            setIsLoading(false);
            }, (error) => {
                console.error("Error fetching posts:", error);
                loadMockPosts();
            });
        } else {
            loadMockPosts();
        }
    } catch (e) {
        console.error("Feed Init Error:", e);
        loadMockPosts();
    }

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadMockPosts = () => {
      setPosts([
            {
                id: 'mock-1',
                userId: '1',
                userName: 'Campus Admin',
                userAvatar: 'https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff',
                content: '👋 Welcome to UniConnect! \n\nIf you see this, we are running in Demo Mode or offline.',
                likes: 100,
                comments: 12,
                timestamp: 'Pinned'
            },
            {
                id: 'mock-2',
                userId: '2',
                userName: 'Sarah Student',
                userAvatar: 'https://ui-avatars.com/api/?name=Sarah',
                content: 'Just finished my final project! 📚☕️ #CSLife',
                image: 'https://picsum.photos/seed/study/800/400',
                likes: 24,
                comments: 3,
                timestamp: '2h ago'
            }
      ]);
      setIsLoading(false);
  }

  const handleMagicWrite = async () => {
    setIsGenerating(true);
    const generated = await generatePostContent("studying hard for finals with coffee");
    setNewPostText(generated);
    setIsGenerating(false);
  };

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    
    if (!user) return;

    try {
      if (db) {
          await addDoc(collection(db, "posts"), {
            userId: user.uid,
            userName: user.displayName || 'Student',
            userAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
            content: newPostText,
            image: imageUrl || null,
            likes: 0,
            comments: 0,
            createdAt: serverTimestamp(),
            timestamp: "Just now" 
          });
          setNewPostText('');
          setImageUrl('');
      } else {
          throw new Error("DB Offline");
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      // Mock adding for demo
      const newMockPost: Post = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: user.displayName || 'Me',
        userAvatar: user.photoURL || '',
        content: newPostText,
        image: imageUrl,
        likes: 0,
        comments: 0,
        timestamp: "Just now"
      };
      setPosts([newMockPost, ...posts]);
      setNewPostText('');
      setImageUrl('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header title="Campus Feed" />
      
      <div className="max-w-2xl mx-auto pt-4 px-4">
        {/* Create Post Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <img 
              src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
              alt="Me" 
              className="w-10 h-10 rounded-full object-cover" 
            />
            <div className="flex-1">
                <textarea 
                className="w-full bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="What's happening on campus?"
                rows={3}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                />
                {imageUrl && (
                  <div className="mt-2 relative">
                    <img src={imageUrl} alt="Preview" className="h-32 rounded-lg object-cover" />
                    <button onClick={() => setImageUrl('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs">✕</button>
                  </div>
                )}
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-3">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                   const url = prompt("Enter Image URL (Mock upload):");
                   if(url) setImageUrl(url);
                }}
                className="p-2 hover:bg-slate-50 rounded-full text-primary"
              >
                <ImageIcon size={20} />
              </button>
              <button 
                onClick={handleMagicWrite}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                disabled={isGenerating}
              >
                <Sparkles size={14} />
                {isGenerating ? 'Magic...' : 'AI Assist'}
              </button>
            </div>
            <button 
                onClick={handlePost}
                disabled={!newPostText.trim()}
                className="bg-primary hover:bg-indigo-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
            <div className="space-y-6">
            {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" />
                    <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{post.userName}</h3>
                        <p className="text-xs text-slate-500">
                            {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (post.timestamp || 'Recent')}
                        </p>
                    </div>
                    </div>
                    <button className="text-slate-400 hover:bg-slate-50 p-1 rounded-full">
                    <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="px-4 pb-3">
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line">{post.content}</p>
                </div>

                {post.image && (
                    <div className="w-full bg-slate-100">
                    <img src={post.image} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
                    </div>
                )}

                <div className="p-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors group">
                        <Heart size={22} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-600 hover:text-blue-500 transition-colors">
                        <MessageCircle size={22} />
                        <span className="text-sm font-medium">{post.comments}</span>
                    </button>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                    <Share2 size={20} />
                    </button>
                </div>
                </div>
            ))}
            {posts.length === 0 && (
                <div className="text-center py-10 text-slate-500">No posts yet. Be the first!</div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Feed;