import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Loader2, Upload, GraduationCap, Smile, FileText, MapPin, Hash, BarChart3, X, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, getDocs, deleteDoc, setDoc, where } from 'firebase/firestore';
import { uploadPostImages } from '../services/cloudinaryService';

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedGifs, setSelectedGifs] = useState<string[]>([]);
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<{name: string; latitude?: number; longitude?: number} | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{name: string; type: string} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_MEDIA_ITEMS = 10;
  const fallbackGifResults = [
    {
      id: 'fallback-1',
      title: 'Thumbs up',
      images: {
        fixed_height: { url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
        fixed_height_small: { url: 'https://media.giphy.com/media/111ebonMs90YLu/100w.gif' }
      }
    },
    {
      id: 'fallback-2',
      title: 'Celebrate',
      images: {
        fixed_height: { url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif' },
        fixed_height_small: { url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/100w.gif' }
      }
    },
    {
      id: 'fallback-3',
      title: 'Dance',
      images: {
        fixed_height: { url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif' },
        fixed_height_small: { url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/100w.gif' }
      }
    },
    {
      id: 'fallback-4',
      title: 'Cool',
      images: {
        fixed_height: { url: 'https://media.giphy.com/media/xUOxfjsw4v6Vxf9nPO/giphy.gif' },
        fixed_height_small: { url: 'https://media.giphy.com/media/xUOxfjsw4v6Vxf9nPO/100w.gif' }
      }
    }
  ];

  useEffect(() => {
    // Real-time listener for posts - filtered by user's college
    let unsubscribe = () => {};
    
    const loadPosts = async () => {
      if (!user || !db) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      try {
        // Get user's college from profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userCollege = userDoc.exists() ? userDoc.data()?.college : null;

        if (!userCollege) {
          console.warn('User college not found. Please complete your profile.');
          setPosts([]);
          setIsLoading(false);
          return;
        }

        // Ensure db is valid before creating query
        if (!db) {
          console.error('Firestore db is not initialized');
          setPosts([]);
          setIsLoading(false);
          return;
        }

        // Filter posts by college
        const postsRef = collection(db, "posts");
        const q = query(
          postsRef,
          where("college", "==", userCollege),
          orderBy("createdAt", "desc")
        );
        
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
          setIsLoading(false);
        });
      } catch (e) {
        console.error("Feed Init Error:", e);
        setPosts([]);
        setIsLoading(false);
      }
    };

    loadPosts();

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [user, db]);

  // Load user's liked posts on mount and when user/posts change
  useEffect(() => {
    if (!user || !db || posts.length === 0) {
      setLikedPosts(new Set());
      return;
    }

    const loadLikedPosts = async () => {
      try {
        const likedPostIds = new Set<string>();
        
        // Check each post to see if current user has liked it
        // Use Promise.allSettled to handle errors gracefully
        const results = await Promise.allSettled(
          posts.map(async (post) => {
            const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
            const likeDoc = await getDoc(likeRef);
            if (likeDoc.exists()) {
              return post.id;
            }
            return null;
          })
        );
        
        // Collect all liked post IDs
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            likedPostIds.add(result.value);
          }
        });
        
        setLikedPosts(likedPostIds);
      } catch (error) {
        console.error('Error loading liked posts:', error);
      }
    };

    loadLikedPosts();
  }, [user?.uid, posts.length, db]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentMediaCount = imageFiles.length + selectedGifs.length;
    if (currentMediaCount + files.length > MAX_MEDIA_ITEMS) {
      alert(`You can add up to ${MAX_MEDIA_ITEMS} media items per post`);
      e.target.value = '';
      return;
    }

    setImageFiles(prev => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addGif = (gifUrl: string) => {
    const currentMediaCount = imageFiles.length + selectedGifs.length;
    if (currentMediaCount >= MAX_MEDIA_ITEMS) {
      alert(`You can add up to ${MAX_MEDIA_ITEMS} media items per post`);
      return;
    }

    setSelectedGifs(prev => [...prev, gifUrl]);
    setShowGifPicker(false);
  };

  const removeGif = (index: number) => {
    setSelectedGifs(prev => prev.filter((_, i) => i !== index));
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
        setGifResults(fallbackGifResults);
        console.warn('Giphy API returned no GIFs, using fallback results.');
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifResults(fallbackGifResults);
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
    if (!newPostText.trim() && selectedGifs.length === 0 && imageFiles.length === 0 && !pollQuestion) return;
    
    if (!user) {
      alert('Please log in to create a post');
      return;
    }

    setUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload images to Cloudinary if present
      if (imageFiles.length > 0) {
        const postId = `temp_${Date.now()}`;
        imageUrls = await uploadPostImages(postId, imageFiles);
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

          if (!userCollege) {
            throw new Error('Please complete your profile with your college information before posting.');
          }

          const postData: any = {
            authorId: user.uid,
            authorName: user.displayName || 'Student',
            authorAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Student')}`,
            authorCollege: userCollege,
            college: userCollege, // Add college field for filtering
            content: newPostText,
            imageUrls: imageUrls,
            likesCount: 0,
            commentsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Add new features
          const mediaItems = [
            ...imageUrls.map((url) => ({ type: 'image' as const, url })),
            ...selectedGifs.map((url) => ({ type: 'gif' as const, url }))
          ];

          if (mediaItems.length > 0) postData.mediaItems = mediaItems;
          if (selectedGifs.length === 1 && imageUrls.length === 0) postData.gifUrl = selectedGifs[0];
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

          const postsRef = collection(db, "posts");
          await addDoc(postsRef, postData);
          
          // Reset all states
          setNewPostText('');
          setImageFiles([]);
          setImagePreviews([]);
          setSelectedGifs([]);
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
          
          setSuccessMessage('Post created successfully! 🎉');
          setShowSuccessModal(true);
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
      
      // Always check Firestore to ensure accuracy (prevents race conditions)
      const likeDoc = await getDoc(likeRef);
      const actuallyLiked = likeDoc.exists();

      if (actuallyLiked) {
        // Unlike - remove like document (user already liked, so unlike)
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like - create like document to track user (user hasn't liked yet)
        // Double-check: Ensure no duplicate like exists
        const doubleCheck = await getDoc(likeRef);
        if (!doubleCheck.exists()) {
          await setDoc(likeRef, {
        userId: user.uid,
            userName: user.displayName || 'User',
            createdAt: serverTimestamp()
          });
          await updateDoc(postRef, {
            likesCount: increment(1)
          });
          setLikedPosts(prev => new Set(prev).add(postId));
        } else {
          // Like already exists (race condition handled)
          setLikedPosts(prev => new Set(prev).add(postId));
        }
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
          if (!db) {
            console.error('Firestore db is not initialized');
            return;
          }
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
      if (!db) {
        throw new Error('Firestore db is not initialized');
      }
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, commentData);
      
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
      setSuccessMessage('Comment added!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const getPostMediaItems = (post: Post) => {
    if (post.mediaItems && post.mediaItems.length > 0) {
      return post.mediaItems;
    }

    const legacyImages = (post.imageUrls || []).map((url) => ({ type: 'image' as const, url }));
    const legacyGif = post.gifUrl ? [{ type: 'gif' as const, url: post.gifUrl }] : [];

    return [...legacyImages, ...legacyGif];
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-4 md:pb-4 lg:pb-0 w-full max-w-full overflow-x-hidden">
      <Header title="Campus Feed" />
      
      <div className="max-w-2xl mx-auto pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        {/* Create Post Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 mb-4 sm:mb-6 w-full max-w-full overflow-visible">
          <div className="flex gap-2 sm:gap-3 mb-3">
            <img 
              src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
              alt="Me" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
                <textarea 
                className="w-full bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-w-0"
                placeholder="What's happening on campus?"
                rows={3}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                style={{ maxWidth: '100%' }}
                />
                {(imagePreviews.length > 0 || selectedGifs.length > 0) && (
                  <div className="mt-2 space-y-2">
                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {imagePreviews.map((preview, index) => (
                          <div key={`image-${index}`} className="relative flex-shrink-0 w-24 h-24">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black/80"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedGifs.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {selectedGifs.map((gif, index) => (
                          <div key={`gif-${index}`} className="relative flex-shrink-0 w-24 h-24">
                            <img src={gif} alt={`GIF ${index + 1}`} className="w-full h-full rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGif(index)}
                              className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black/80"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/80 text-indigo-700 hover:bg-white hover:text-indigo-900 transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={10} />
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

          <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-3 mt-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowEmojiPicker(prev => !prev);
                    setShowAttachmentMenu(false);
                    setShowGifPicker(false);
                  }}
                  className="p-2 rounded-full text-primary hover:bg-slate-50 transition-colors touch-manipulation flex-shrink-0"
                  title="Add Emoji"
                  aria-label="Add Emoji"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="fixed sm:absolute bottom-20 sm:bottom-full left-2 sm:left-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 max-h-48 overflow-y-auto"
                    style={{ width: 'min(280px, calc(100vw - 1rem))' }}
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

              <div className="relative">
                <button
                  onClick={() => {
                    setShowAttachmentMenu(prev => !prev);
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                  }}
                  className={`p-2 rounded-full transition-colors touch-manipulation flex-shrink-0 ${
                    showAttachmentMenu ? 'text-primary bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Attach"
                  aria-label="Attach"
                >
                  <Paperclip size={20} />
                </button>

                {showAttachmentMenu && (
                  <div
                    ref={attachmentMenuRef}
                    className="absolute top-full mt-2 left-0 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:left-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Upload size={16} />
                      <span>Photos / Videos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGifPicker(true);
                        setShowAttachmentMenu(false);
                        setShowEmojiPicker(false);
                        searchGifs('trending');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ImageIcon size={16} />
                      <span>GIF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FileText size={16} />
                      <span>File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPollCreator(prev => !prev);
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <BarChart3 size={16} />
                      <span>Poll</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tag-input') as HTMLInputElement | null;
                        if (input) {
                          input.style.display = 'block';
                          input.focus();
                        }
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Hash size={16} />
                      <span>Tags</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleGetLocation();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <MapPin size={16} />
                      <span>Location</span>
                    </button>
                  </div>
                )}
              </div>

              {showGifPicker && (
                <div
                  ref={gifPickerRef}
                  className="fixed bottom-20 left-2 z-50 w-[min(320px,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:bottom-auto sm:top-full sm:mt-2 sm:left-12"
                  style={{ maxHeight: '400px' }}
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
                        onClick={() => addGif(gif.images.fixed_height.url)}
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

              <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip" onChange={handleAttachmentSelect} className="hidden" />
            </div>
            <button 
              onClick={handlePost}
              disabled={(!newPostText.trim() && selectedGifs.length === 0 && imageFiles.length === 0 && !pollQuestion) || uploading}
              className="bg-primary hover:bg-indigo-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
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
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full max-w-full">
                <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                    <button
                      onClick={() => post.authorId && navigate(`/profile/${post.authorId}`)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" />
                      <div className="min-w-0 flex-1 text-left">
                          <h3 className="font-semibold text-slate-900 text-sm truncate hover:text-primary transition-colors cursor-pointer">{post.authorName}</h3>
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
                    </button>
                    </div>
                    <button className="text-slate-400 hover:bg-slate-50 p-1 rounded-full">
                    <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="px-3 sm:px-4 pb-3">
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{post.content}</p>
                    
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
                                        // Remove vote (allow unvoting)
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
                                        // SINGLE CHOICE: Remove user's vote from any other option first
                                        const updateData: any = {};
                                        let previousOptionIndex = -1;
                                        
                                        // Find which option user previously voted for (if any)
                                        Object.keys(currentUserVotes).forEach((key) => {
                                          const voters = currentUserVotes[key] || [];
                                          if (voters.includes(user.uid)) {
                                            previousOptionIndex = parseInt(key);
                                            // Remove user from previous option
                                            const newVoters = voters.filter((uid: string) => uid !== user.uid);
                                            const newVoteCount = Math.max(0, (currentVotes[key] || 0) - 1);
                                            updateData[`poll.votes.${key}`] = newVoteCount;
                                            updateData[`poll.userVotes.${key}`] = newVoters;
                                          }
                                        });
                                        
                                        // Add vote to new option
                                        const newVoters = [...optionVoters, user.uid];
                                        const newVoteCount = (currentVotes[optionKey] || 0) + 1;
                                        updateData[`poll.votes.${optionKey}`] = newVoteCount;
                                        updateData[`poll.userVotes.${optionKey}`] = newVoters;
                                        
                                        await updateDoc(postRef, updateData);
                                        
                                        // Update local state
                                        setPollVotes(prev => {
                                          const postVotes = prev[post.id] || new Set<number>();
                                          const newPostVotes = new Set<number>();
                                          // Only add the new vote (removing previous one)
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

                {/* Media Carousel */}
                {getPostMediaItems(post).length > 0 && (
                  <div className="w-full bg-slate-100">
                    <div className="relative w-full aspect-[4/5] sm:aspect-video overflow-hidden">
                      <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar">
                        {getPostMediaItems(post).map((media, index) => (
                          <div
                            key={`${post.id}-media-${index}`}
                            className="w-full h-full flex-shrink-0 snap-center bg-slate-100"
                          >
                            <img
                              src={media.url}
                              alt={`${post.content || post.authorName} media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      {getPostMediaItems(post).length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                          {getPostMediaItems(post).map((_, index) => (
                            <span
                              key={`${post.id}-dot-${index}`}
                              className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-3 sm:p-4 flex items-center justify-between border-t border-slate-100 gap-2">
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
                    <div className="flex gap-2 mb-4 w-full max-w-full">
                      <img 
                        src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
                        alt="You" 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 flex gap-2 min-w-0">
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
                          className="flex-1 min-w-0 px-3 py-2 bg-white rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 whitespace-nowrap min-h-[44px]"
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
                            <button
                              onClick={() => comment.authorId && navigate(`/profile/${comment.authorId}`)}
                              className="flex items-start gap-2 hover:opacity-80 transition-opacity"
                            >
                              <img 
                                src={comment.authorAvatar || "https://ui-avatars.com/api/?name=User"} 
                                alt={comment.authorName} 
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 bg-white rounded-2xl px-4 py-2 border border-slate-100 text-left">
                                <p className="font-semibold text-sm text-slate-900 hover:text-primary transition-colors cursor-pointer">{comment.authorName}</p>
                                <p className="text-sm text-slate-700 mt-0.5">{comment.content}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {comment.createdAt instanceof Date 
                                    ? comment.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    : 'Just now'}
                                </p>
                              </div>
                            </button>
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </div>
  );
};

export default Feed;
