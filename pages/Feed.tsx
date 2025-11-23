import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Loader2, Upload, GraduationCap } from 'lucide-react';
import { Post } from '../types';
import Header from '../components/Header';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, getDocs } from 'firebase/firestore';
import { uploadPostImages } from '../services/cloudinaryService';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');
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
                setPosts([]);
            });
        } else {
            setPosts([]);
        }
    } catch (e) {
        console.error("Feed Init Error:", e);
        setPosts([]);
    }

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);


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

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    
    if (!user) {
      alert('Please log in to create a post');
      return;
    }

    setUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload image to Cloudinary if present
      if (imageFile) {
        const postId = `temp_${Date.now()}`;
        imageUrls = await uploadPostImages(postId, [imageFile]);
      }

      if (db) {
          // Fetch user's college from their profile
          let userCollege = '';
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              userCollege = userDoc.data()?.college || '';
            }
          } catch (error) {
            console.error('Error fetching user college:', error);
          }

          await addDoc(collection(db, "posts"), {
            authorId: user.uid,
            authorName: user.displayName || 'Student',
            authorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Student')}`,
            authorCollege: userCollege,
            content: newPostText,
            imageUrls: imageUrls,
            likesCount: 0,
            commentsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setNewPostText('');
          setImageFile(null);
          setImagePreview('');
          alert('Post created successfully!');
      } else {
          throw new Error("DB Offline");
      }
    } catch (e: any) {
      console.error("Error adding post: ", e);
      alert(e.message || 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user || !db) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const isLiked = likedPosts.has(postId);

      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likesCount: increment(1)
        });
        setLikedPosts(prev => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: `Post by ${post.authorName}`,
      text: post.content,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${post.content}\n\n- ${post.authorName}`);
        alert('Post copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (showCommentsFor === postId) {
      setShowCommentsFor(null);
    } else {
      setShowCommentsFor(postId);
      // Load comments if not already loaded
      if (!comments[postId] && db) {
        try {
          const commentsRef = collection(db, 'posts', postId, 'comments');
          const q = query(commentsRef, orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const loadedComments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setComments(prev => ({ ...prev, [postId]: loadedComments }));
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user || !db) return;

    try {
      const commentData = {
        authorId: user.uid,
        authorName: user.displayName || 'Student',
        authorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Student')}`,
        content: newComment,
        createdAt: serverTimestamp()
      };

      // Add comment
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      
      // Update comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      // Add to local state immediately
      setComments(prev => ({
        ...prev,
        [postId]: [{ ...commentData, createdAt: new Date(), id: Date.now().toString() }, ...(prev[postId] || [])]
      }));

      setNewComment('');
      alert('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:ml-64">
      <Header title="Campus Feed" />
      
      <div className="max-w-2xl mx-auto pt-4 px-4 md:px-6">
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
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                    <button 
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }} 
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs hover:bg-black/70"
                    >
                      ✕
                    </button>
                  </div>
                )}
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-3">
            <div className="flex gap-2">
              <label className="p-2 hover:bg-slate-50 rounded-full text-primary cursor-pointer">
                <Upload size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
            <button 
                onClick={handlePost}
                disabled={!newPostText.trim() || uploading}
                className="bg-primary hover:bg-indigo-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
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
                    <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" />
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{post.authorName}</h3>
                        {post.authorCollege && (
                          <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium truncate">
                            <GraduationCap size={12} className="flex-shrink-0" />
                            <span className="truncate">{post.authorCollege}</span>
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                            {post.createdAt instanceof Date ? post.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recent'}
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

                {post.imageUrls?.[0] && (
                    <div className="w-full bg-slate-100">
                    <img src={post.imageUrls[0]} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
                    </div>
                )}

                <div className="p-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors group ${
                        likedPosts.has(post.id) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                      }`}
                    >
                        <Heart 
                          size={22} 
                          className={`group-hover:scale-110 transition-transform ${
                            likedPosts.has(post.id) ? 'fill-current' : ''
                          }`} 
                        />
                        <span className="text-sm font-medium">{post.likesCount}</span>
                    </button>
                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle size={22} />
                        <span className="text-sm font-medium">{post.commentsCount}</span>
                    </button>
                    </div>
                    <button 
                      onClick={() => handleShare(post)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Share2 size={20} />
                    </button>
                </div>

                {/* Comments Section */}
                {showCommentsFor === post.id && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    {/* Add Comment Input */}
                    <div className="flex gap-2 mb-4">
                      <img 
                        src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
                        alt="You" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {comments[post.id]?.length > 0 ? (
                        comments[post.id].map((comment: any) => (
                          <div key={comment.id} className="flex gap-2">
                            <img 
                              src={comment.authorAvatar || "https://ui-avatars.com/api/?name=User"} 
                              alt={comment.authorName} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 bg-white rounded-2xl px-4 py-2 border border-slate-100">
                              <p className="font-semibold text-sm text-slate-900">{comment.authorName}</p>
                              <p className="text-sm text-slate-700 mt-0.5">{comment.content}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {comment.createdAt instanceof Date 
                                  ? comment.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : 'Just now'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-slate-400 text-sm py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  </div>
                )}
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