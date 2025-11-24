import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Loader2, Upload, GraduationCap, Smile, FileText, MapPin, Hash, BarChart3, X } from 'lucide-react';
import { Post } from '../types';
import Header from '../components/Header';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { uploadPostImages } from '../services/cloudinaryService';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [pollVotes, setPollVotes] = useState<{[postId: string]: Set<number>}>({}); // Track which options user voted for
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  
  // New feature states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<{name: string; latitude?: number; longitude?: number} | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{name: string; type: string} | null>(null);
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);

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

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  // Emoji picker
  const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '😍', '🙌', '✨', '🎊', '😊', '🥳', '💪', '🌟', '😎', '🎈', '💖', '👏', '🎁'];
  
  const handleEmojiSelect = (emoji: string) => {
    setNewPostText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // GIF search using Giphy API (using public demo key)
  const searchGifs = async (searchTerm: string) => {
    try {
      // Using Giphy's public demo API key (limited but works)
      // For production, get your own free API key from https://developers.giphy.com/
      const apiKey = '3XEocAPxmO6auiyHBqiHea0eeu9XnGo4'; // Giphy API key
      let url = '';
      
      if (searchTerm.trim()) {
        url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=g`;
      } else {
        url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.data) {
        setGifResults(data.data);
      } else {
        // Fallback: Show message to configure API key
        setGifResults([]);
        console.warn('Giphy API key not configured. Get a free key from https://developers.giphy.com/');
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifResults([]);
    }
  };

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().replace('#', '');
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  // Handle location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding to get location name
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            setLocation({
              name: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude
            });
          } catch (error) {
            setLocation({
              name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              latitude,
              longitude
            });
          }
        },
        (error) => {
          alert('Could not get location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Handle attachment
  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      setAttachmentPreview({
        name: file.name,
        type: file.type.split('/')[0] || 'file'
      });
    }
  };

  // Add poll option
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // Remove poll option
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim() && !selectedGif && !imageFile && !pollQuestion) return;
    
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

      // Upload attachment if present
      let attachmentUrl = null;
      if (attachmentFile) {
        // For now, we'll upload to Cloudinary as well
        // In production, you might want a separate file storage service
        const postId = `temp_${Date.now()}`;
        const uploaded = await uploadPostImages(postId, [attachmentFile]);
        attachmentUrl = uploaded[0];
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

          const postData: any = {
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
          };

          // Add new features
          if (selectedGif) postData.gifUrl = selectedGif;
          if (pollQuestion && pollOptions.filter(o => o.trim()).length >= 2) {
            const validOptions = pollOptions.filter(o => o.trim());
            const initialVotes: {[key: string]: number} = {};
            const initialUserVotes: {[key: string]: string[]} = {};
            
            // Initialize votes for each option
            validOptions.forEach((_, index) => {
              initialVotes[index.toString()] = 0;
              initialUserVotes[index.toString()] = [];
            });
            
            postData.poll = {
              question: pollQuestion,
              options: validOptions,
              votes: initialVotes,
              userVotes: initialUserVotes
            };
          }
          if (tags.length > 0) postData.tags = tags;
          if (location) postData.location = location;
          if (attachmentUrl && attachmentPreview) {
            postData.attachments = [{
              name: attachmentPreview.name,
              url: attachmentUrl,
              type: attachmentPreview.type
            }];
          }

          await addDoc(collection(db, "posts"), postData);
          
          // Reset all states
          setNewPostText('');
          setImageFile(null);
          setImagePreview('');
          setSelectedGif(null);
          setShowPollCreator(false);
          setPollQuestion('');
          setPollOptions(['', '']);
          setTags([]);
          setTagInput('');
          setLocation(null);
          setAttachmentFile(null);
          setAttachmentPreview(null);
          setShowEmojiPicker(false);
          setShowGifPicker(false);
          
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
      const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
      const isLiked = likedPosts.has(postId);

      // Check if like document exists (double-check)
      const likeDoc = await getDoc(likeRef);
      const actuallyLiked = likeDoc.exists();

      if (isLiked || actuallyLiked) {
        // Unlike - remove like document
        if (actuallyLiked) {
          await deleteDoc(likeRef);
        }
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like - create like document to track user
        await setDoc(likeRef, {
          userId: user.uid,
          userName: user.displayName || 'User',
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, {
          likesCount: increment(1)
        });
        setLikedPosts(prev => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to like post. Please try again.');
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
                {/* Inline Tag Input */}
                <input
                  id="tag-input"
                  type="text"
                  placeholder="#tag (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInput}
                  className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ display: 'none' }}
                />
            </div>
          </div>
          {/* Poll Creator */}
          {showPollCreator && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-slate-700">Create Poll</h4>
                <button onClick={() => setShowPollCreator(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-3 py-2 mb-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={addPollOption}
                    className="text-sm text-primary hover:text-indigo-700 font-medium"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                >
                  #{tag}
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="hover:text-indigo-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} />
              <span className="truncate">{location.name}</span>
              <button onClick={() => setLocation(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Attachment Preview */}
          {attachmentPreview && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <FileText size={16} className="text-slate-600" />
              <span className="text-sm text-slate-700 truncate flex-1">{attachmentPreview.name}</span>
              <button onClick={() => {
                setAttachmentFile(null);
                setAttachmentPreview(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* GIF Preview */}
          {selectedGif && (
            <div className="mt-2 relative">
              <img src={selectedGif} alt="Selected GIF" className="h-32 rounded-lg object-cover" />
              <button
                onClick={() => setSelectedGif(null)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
            <div className="flex gap-1 md:gap-2 flex-wrap">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowGifPicker(false);
                  }}
                  className="p-2 hover:bg-slate-50 rounded-full text-primary cursor-pointer transition-colors"
                  title="Add Emoji"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 max-h-48 overflow-y-auto"
                    style={{ width: '280px' }}
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-slate-50 rounded-lg p-2 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* GIF Picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowEmojiPicker(false);
                    if (!showGifPicker) {
                      searchGifs('trending');
                    }
                  }}
                  className="p-2 hover:bg-slate-50 rounded-full text-primary cursor-pointer transition-colors"
                  title="Add GIF"
                >
                  <ImageIcon size={20} />
                </button>
                {showGifPicker && (
                  <div
                    ref={gifPickerRef}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50"
                    style={{ width: '320px', maxHeight: '400px' }}
                  >
                    <input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearchTerm}
                      onChange={(e) => {
                        setGifSearchTerm(e.target.value);
                        searchGifs(e.target.value);
                      }}
                      className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {gifResults.map((gif: any) => (
                        <button
                          key={gif.id}
                          onClick={() => {
                            setSelectedGif(gif.images.fixed_height.url);
                            setShowGifPicker(false);
                          }}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={gif.images.fixed_height_small.url}
                            alt={gif.title}
                            className="w-full rounded-lg"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Poll Creator */}
              <button
                onClick={() => {
                  setShowPollCreator(!showPollCreator);
                  setShowEmojiPicker(false);
                  setShowGifPicker(false);
                }}
                className={`p-2 hover:bg-slate-50 rounded-full transition-colors ${
                  showPollCreator ? 'text-primary bg-indigo-50' : 'text-slate-600'
                }`}
                title="Create Poll"
              >
                <BarChart3 size={20} />
              </button>

              {/* Tag Input */}
              <button
                onClick={() => {
                  const input = document.getElementById('tag-input') as HTMLInputElement;
                  if (input) {
                    input.style.display = input.style.display === 'none' ? 'block' : 'none';
                    if (input.style.display !== 'none') input.focus();
                  }
                }}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"
                title="Add Tags"
              >
                <Hash size={20} />
              </button>

              {/* Location */}
              <button
                onClick={handleGetLocation}
                className={`p-2 hover:bg-slate-50 rounded-full transition-colors ${
                  location ? 'text-primary bg-indigo-50' : 'text-slate-600'
                }`}
                title="Add Location"
              >
                <MapPin size={20} />
              </button>

              {/* Image Upload */}
              <label className="p-2 hover:bg-slate-50 rounded-full text-slate-600 cursor-pointer transition-colors" title="Upload Image">
                <Upload size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              {/* File Attachment */}
              <label className="p-2 hover:bg-slate-50 rounded-full text-slate-600 cursor-pointer transition-colors" title="Attach File">
                <FileText size={20} />
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt,.zip"
                  onChange={handleAttachmentSelect}
                  className="hidden"
                />
              </label>
            </div>
            <button 
                onClick={handlePost}
                disabled={(!newPostText.trim() && !selectedGif && !imageFile && !pollQuestion) || uploading}
                className="bg-primary hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="hidden md:inline">Posting...</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">Post</span>
                  <span className="md:hidden">✓</span>
                </>
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
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Location */}
                    {post.location && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <MapPin size={12} />
                        <span>{post.location.name}</span>
                      </div>
                    )}

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {post.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <FileText size={16} className="text-slate-600" />
                            <span className="text-sm text-slate-700 truncate">{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Poll */}
                    {post.poll && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-sm text-slate-800 mb-3">{post.poll.question}</h4>
                        <div className="space-y-2">
                          {post.poll.options.map((option, index) => {
                            const votes = post.poll?.votes?.[index.toString()] || 0;
                            const totalVotes = Object.values(post.poll?.votes || {}).reduce((a: number, b: number) => a + b, 0) || 0;
                            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                            
                            // Check if current user voted for this option
                            const userVotedForThis = pollVotes[post.id]?.has(index) || false;
                            const optionVoters = post.poll?.userVotes?.[index.toString()] || [];
                            const userHasVoted = user ? optionVoters.includes(user.uid) : false;
                            
                            return (
                              <div key={index} className="relative">
                                <button
                                  onClick={async () => {
                                    if (!user || !db) {
                                      alert('Please log in to vote');
                                      return;
                                    }
                                    
                                    try {
                                      const postRef = doc(db, 'posts', post.id);
                                      const postSnap = await getDoc(postRef);
                                      if (!postSnap.exists()) return;
                                      
                                      const postData = postSnap.data();
                                      const currentVotes = postData.poll?.votes || {};
                                      const currentUserVotes = postData.poll?.userVotes || {};
                                      const optionKey = index.toString();
                                      
                                      // Check if user already voted for this option
                                      const optionVoters = currentUserVotes[optionKey] || [];
                                      const hasVoted = optionVoters.includes(user.uid);
                                      
                                      if (hasVoted) {
                                        // Remove vote
                                        const newVoters = optionVoters.filter((uid: string) => uid !== user.uid);
                                        const newVoteCount = Math.max(0, (currentVotes[optionKey] || 0) - 1);
                                        
                                        await updateDoc(postRef, {
                                          [`poll.votes.${optionKey}`]: newVoteCount,
                                          [`poll.userVotes.${optionKey}`]: newVoters
                                        });
                                        
                                        // Update local state
                                        setPollVotes(prev => {
                                          const postVotes = prev[post.id] || new Set<number>();
                                          const newPostVotes = new Set(postVotes);
                                          newPostVotes.delete(index);
                                          return { ...prev, [post.id]: newPostVotes };
                                        });
                                      } else {
                                        // Add vote
                                        const newVoters = [...optionVoters, user.uid];
                                        const newVoteCount = (currentVotes[optionKey] || 0) + 1;
                                        
                                        await updateDoc(postRef, {
                                          [`poll.votes.${optionKey}`]: newVoteCount,
                                          [`poll.userVotes.${optionKey}`]: newVoters
                                        });
                                        
                                        // Update local state
                                        setPollVotes(prev => {
                                          const postVotes = prev[post.id] || new Set<number>();
                                          const newPostVotes = new Set(postVotes);
                                          newPostVotes.add(index);
                                          return { ...prev, [post.id]: newPostVotes };
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Error voting:', error);
                                      alert('Failed to vote. Please try again.');
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                                    userHasVoted 
                                      ? 'bg-indigo-100 border-indigo-300' 
                                      : 'bg-white border-slate-200 hover:border-indigo-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-slate-700">{option}</span>
                                      {userHasVoted && (
                                        <span className="text-xs text-indigo-600 font-medium">✓ Voted</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-500">{votes} votes</span>
                                  </div>
                                  {totalVotes > 0 && (
                                    <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>

                {/* GIF */}
                {post.gifUrl && (
                  <div className="w-full bg-slate-100">
                    <img src={post.gifUrl} alt="GIF" className="w-full h-auto max-h-[500px] object-cover" />
                  </div>
                )}

                {/* Image */}
                {post.imageUrls?.[0] && !post.gifUrl && (
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