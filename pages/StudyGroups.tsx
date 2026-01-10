import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Users, BookOpen, ChevronRight, MoreVertical, ArrowLeft, Plus, X, Upload, Image as ImageIcon, Lock, Globe, Search, Smile, FileText, BarChart3, Video, File, Hash, MapPin, Download } from 'lucide-react';
import { StudyGroup, ChatMessage } from '../types';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import { generateStudyHelp } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, updateDoc, increment, setDoc, getDoc, where } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

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
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<{name: string; latitude?: number; longitude?: number} | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{name: string; type: string} | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showJoinRequestSuccess, setShowJoinRequestSuccess] = useState(false);
  const [userRole, setUserRole] = useState<Map<string, string>>(new Map());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

  // Debug: Log when files change to verify send button state
  useEffect(() => {
    const hasContent = messageText.trim() || imageFile || attachmentFile || selectedGif || (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2);
    const isDisabled = uploading || !selectedGroup || !user || !hasContent;
    
    // Only log when files are actually selected to reduce spam
    if (imageFile || attachmentFile || selectedGif) {
      console.log('🔍 Send button state check (FILE SELECTED):', {
        hasContent: !!hasContent,
        isDisabled,
        imageFile: !!imageFile,
        imageFileName: imageFile?.name,
        attachmentFile: !!attachmentFile,
        attachmentFileName: attachmentFile?.name,
        selectedGif: !!selectedGif,
        messageText: messageText.trim(),
        uploading,
        selectedGroup: !!selectedGroup,
        user: !!user
      });
    }
  }, [imageFile, attachmentFile, selectedGif, messageText, uploading, selectedGroup, user, showPollCreator, pollQuestion, pollOptions]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      if (!db || !user) throw new Error("DB unavailable or user not logged in");
      
      // Get user's college from profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userCollege = userDoc.exists() ? userDoc.data()?.college : null;

      if (!userCollege) {
        console.warn('User college not found. Please complete your profile.');
        setGroups([]);
        setLoading(false);
        return;
      }

      // Ensure db is valid before creating query
      if (!db) {
        console.error('Firestore db is not initialized');
        setGroups([]);
        setLoading(false);
        return;
      }

      // Filter groups by user's college
      const groupsRef = collection(db, "groups");
      const q = query(
        groupsRef,
        where("college", "==", userCollege)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Calculate actual member count from members subcollection for each group
      const fetchedGroups = await Promise.all(
        querySnapshot.docs.map(async (groupDoc) => {
          const groupData = groupDoc.data();
          
          // Get actual member count from members subcollection
          try {
            const membersSnapshot = await getDocs(collection(db, "groups", groupDoc.id, "members"));
            const actualMemberCount = membersSnapshot.size;
            
            return {
              id: groupDoc.id,
              ...groupData,
              memberCount: actualMemberCount // Use actual count from subcollection
            } as StudyGroup;
          } catch (memberErr) {
            // If subcollection doesn't exist or error, use stored memberCount or 0
            console.warn(`Could not count members for group ${groupDoc.id}:`, memberErr);
            return {
              id: groupDoc.id,
              ...groupData,
              memberCount: groupData.memberCount || 0
            } as StudyGroup;
          }
        })
      );
      
      setGroups(fetchedGroups);
    } catch (err) {
      console.error(err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGroups = async () => {
    if (!user || !db) return;
    try {
      // Get user's college from profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userCollege = userDoc.exists() ? userDoc.data()?.college : null;

      if (!userCollege) {
        setMyGroupIds(new Set());
        setUserRole(new Map());
        return;
      }

      // Filter groups by user's college
      const groupsRef = collection(db, 'groups');
      const q = query(
        groupsRef,
        where("college", "==", userCollege)
      );
      
      const groupsSnapshot = await getDocs(q);
      const myIds = new Set<string>();
      const roles = new Map<string, string>();
      
      for (const groupDoc of groupsSnapshot.docs) {
        const memberDoc = await getDoc(doc(db, 'groups', groupDoc.id, 'members', user.uid));
        if (memberDoc.exists()) {
          myIds.add(groupDoc.id);
          const memberData = memberDoc.data();
          roles.set(groupDoc.id, memberData.role || 'member');
        }
      }
      
      setMyGroupIds(myIds);
      setUserRole(roles);
    } catch (error) {
      console.error('Error loading my groups:', error);
    }
  };

  // Load join requests for selected group
  useEffect(() => {
    if (!selectedGroup || !user || !db) {
      setJoinRequests([]);
      return;
    }

    // Check if user is owner or admin
    const role = userRole.get(selectedGroup.id);
    if (role !== 'owner' && role !== 'admin') {
      setJoinRequests([]);
      return;
    }

    const requestsRef = collection(db, 'groups', selectedGroup.id, 'joinRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter((req: any) => req.status === 'pending');
      setJoinRequests(requests);
    }, (error) => {
      console.error('Error loading join requests:', error);
      setJoinRequests([]);
    });

    return () => unsubscribe();
  }, [selectedGroup, user, userRole]);

  useEffect(() => {
    // Don't set up listener if user is not authenticated
    if (!user) {
      console.log('⏳ Waiting for user authentication...');
      setMessages([]);
      return;
    }

    if (!selectedGroup || !db) {
      setMessages([]);
      return;
    }

    console.log('🔌 Setting up Firestore listener for group:', selectedGroup.id, 'User:', user.uid);

    let unsubscribe = () => {};
    try {
        // Check if Firestore is available
        if (!db) {
            console.error('❌ Firestore (db) is not initialized');
            alert('❌ Firestore not initialized!\n\nPlease check:\n1. Firebase project is correct\n2. Firestore API is enabled\n3. Refresh the page');
            return () => {};
        }
        
            const q = query(
                collection(db, "groups", selectedGroup.id, "messages"),
                orderBy("timestamp", "asc"),
                limit(50)
            );

        unsubscribe = onSnapshot(q, 
            (snapshot) => {
                console.log('✅ Firestore listener connected, messages:', snapshot.docs.length);
                const msgs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const msg = {
                        id: doc.id,
                        text: data.text || '',
                        senderId: data.senderId || '',
                        senderName: data.senderName || 'Unknown',
                        imageUrl: data.imageUrl || null,
                        stickerUrl: data.stickerUrl || null,
                        poll: data.poll || null,
                        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                        isAi: data.isAi || false,
                        tags: data.tags || null,
                        location: data.location || null,
                        attachments: data.attachments || null
                    } as ChatMessage & { tags?: string[]; location?: any; attachments?: any[] };
                    return msg;
                });
                // Sort messages by timestamp
                msgs.sort((a, b) => {
                    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp as any).getTime();
                    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp as any).getTime();
                    return timeA - timeB;
                });
                
                console.log('📨 Processed messages:', msgs.length, 'messages');
                if (msgs.length > 0) {
                    console.log('📨 First message:', { id: msgs[0].id, text: msgs[0].text?.substring(0, 30), senderName: msgs[0].senderName });
                    console.log('📨 Last message:', { id: msgs[msgs.length - 1].id, text: msgs[msgs.length - 1].text?.substring(0, 30), senderName: msgs[msgs.length - 1].senderName });
                }
                setMessages(msgs);
                // Scroll to bottom after messages are rendered
                setTimeout(() => {
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                    }
                }, 300);
            }, 
            (error) => {
                console.error("❌ Firestore Listener Error:", error);
                console.error("Error details:", {
                    code: error.code,
                    message: error.message,
                    stack: error.stack
                });
                
                // Check if it's a permission error
                if (error.code === 'permission-denied') {
                    console.error("❌ Permission denied - check Firestore rules are published");
                    alert('❌ Permission denied!\n\nPlease:\n1. Go to Firebase Console → Firestore → Rules\n2. Make sure rules match firestore.rules file\n3. Click "Publish" (not just Save!)\n4. Refresh this page');
                } else if (error.code === 'failed-precondition') {
                    console.error("❌ Index missing - Firestore needs an index for this query");
                    console.error("Go to Firebase Console → Firestore → Indexes → Create index");
                    alert('❌ Index missing!\n\nClick the link in the console to create the required index.');
                } else if (error.message?.includes('access control') || error.message?.includes('CORS') || error.message?.includes('Fetch API cannot load') || error.code === 'unavailable') {
                    console.error("❌ CORS/Access control error - Firestore API or rules issue");
                    console.error("🔧 FIX STEPS:");
                    console.error("1. Go to: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=campus-connect-fd225");
                    console.error("2. Click 'ENABLE' if not enabled (wait 10-20 seconds)");
                    console.error("3. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules");
                    console.error("4. Click 'PUBLISH' (not just Save!) - wait for 'Rules published successfully'");
                    console.error("5. Go to: https://console.firebase.google.com/project/campus-connect-fd225/firestore");
                    console.error("6. Make sure database exists (if not, create it in 'Test mode')");
                    console.error("7. Hard refresh this page (Cmd+Shift+R or Ctrl+Shift+R)");
                    
                    const errorDetails = `
❌ FIRESTORE CONNECTION ERROR!

🔧 STEP-BY-STEP FIX:

1️⃣ ENABLE FIRESTORE API:
   👉 https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=campus-connect-fd225
   → Click big blue "ENABLE" button
   → Wait 10-20 seconds for activation

2️⃣ PUBLISH FIRESTORE RULES:
   👉 https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules
   → Make sure rules are correct
   → Click "PUBLISH" (NOT "Save"!)
   → Wait for "Rules published successfully"

3️⃣ CHECK DATABASE EXISTS:
   👉 https://console.firebase.google.com/project/campus-connect-fd225/firestore
   → If you see "Create database", create it in "Test mode"
   → Choose location (e.g., asia-south1)
   → Click "Enable"

4️⃣ HARD REFRESH:
   → Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

✅ After all steps, refresh this page!
                    `;
                    alert(errorDetails);
        } else {
                    console.error("Firestore error code:", error.code, error.message);
                }
                setMessages([]);
            }
        );
    } catch (e: any) {
        console.error("❌ Firestore init failed:", e);
        setMessages([]);
    }

    return () => { 
        if (unsubscribe) {
            try {
                unsubscribe();
                // Only log if it's a meaningful change (group/user changed), not just a re-render
                if (selectedGroup?.id && user?.uid) {
                    console.log('🔌 Firestore listener unsubscribed (group/user changed)');
        }
    } catch (e) {
                console.error("Error unsubscribing:", e);
            }
        }
    };
  }, [selectedGroup?.id, user?.uid, db]);

  // Real-time member count listener for selected group
  useEffect(() => {
    if (!selectedGroup || !db) return;

    const membersRef = collection(db, 'groups', selectedGroup.id, 'members');
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const actualMemberCount = snapshot.size;
      
      // Update the selectedGroup's memberCount
      setSelectedGroup(prev => prev ? {
        ...prev,
        memberCount: actualMemberCount
      } : null);
      
      // Also update in the groups list
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, memberCount: actualMemberCount }
          : g
      ));
    }, (error) => {
      console.error('Error listening to members:', error);
    });

    return () => unsubscribe();
  }, [selectedGroup?.id, db]);


  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) {
      alert('Please log in to create a group');
      return;
    }

    try {
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
        alert('Please complete your profile with your college information before creating groups.');
        return;
      }

      const groupsRef = collection(db, "groups");
      const groupRef = await addDoc(groupsRef, {
        ...newGroup,
        college: userCollege, // Add college field for filtering
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
      setSuccessMessage('Group created successfully! 🎉');
      setShowSuccessModal(true);
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
        alert('Group not found');
        return;
      }

      const groupData = groupSnap.data();
      const isPrivate = groupData.isPrivate || false;

      if (isPrivate) {
        // For private groups, create a join request
        const joinRequestRef = doc(db, 'groups', groupId, 'joinRequests', user.uid);
        const existingRequest = await getDoc(joinRequestRef);
        
        if (existingRequest.exists()) {
          const requestData = existingRequest.data();
          if (requestData.status === 'pending') {
            alert('You already have a pending join request for this group.');
            return;
          } else if (requestData.status === 'approved') {
            alert('Your request was already approved! You should be able to access this group.');
            loadMyGroups();
            return;
          }
        }

        // Create new join request
        await setDoc(joinRequestRef, {
          groupId,
          userId: user.uid,
          userName: user.displayName || 'User',
          userAvatar: user.photoURL || null,
          message: '',
          status: 'pending',
          createdAt: serverTimestamp()
        });

        setShowJoinModal(false);
        loadGroups();
        // Show success modal instead of alert
        setShowJoinRequestSuccess(true);
      } else {
        // For public groups, join directly
        // Check if already a member
        const memberRef = doc(db, 'groups', groupId, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);
        
        if (memberSnap.exists()) {
          alert('You are already a member of this group!');
          loadMyGroups();
          return;
        }

        // Add user to members
        await setDoc(memberRef, {
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
        setSuccessMessage('Joined group successfully! 🎉');
        setShowSuccessModal(true);
        loadGroups();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to join group');
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string, userName: string) => {
    if (!selectedGroup || !user || !db) return;

    try {
      // Add user to members
      await setDoc(doc(db, 'groups', selectedGroup.id, 'members', userId), {
        userId,
        userName,
        role: 'member',
        joinedAt: serverTimestamp()
      });

      // Update request status
      await updateDoc(doc(db, 'groups', selectedGroup.id, 'joinRequests', requestId), {
        status: 'approved'
      });

      // Increment member count
      await updateDoc(doc(db, 'groups', selectedGroup.id), {
        members: increment(1)
      });

      loadMyGroups();
      alert(`${userName} has been added to the group!`);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!selectedGroup || !db) return;

    try {
      await updateDoc(doc(db, 'groups', selectedGroup.id, 'joinRequests', requestId), {
        status: 'rejected'
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setSelectedGif(null);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
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
      setImageFile(null);
      setImagePreview('');
      setSelectedGif(null);
    }
    e.target.value = '';
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Handle file download
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName; // Set the filename
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
      alert('Download failed. File opened in new tab instead.');
    }
  };

  const emojis = ['😀', '😂', '❤️', '👍', '👏', '🎉', '🔥', '💯', '😊', '😍', '🤔', '🙌', '😎', '🥳', '🤩', '😋', '😴', '🤗', '😇', '🥰', '😘', '🤪', '😜', '😝', '🤤', '😌', '😏', '😒', '🙄', '🤐', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '🤨', '🤝', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'];

  // GIF search using Giphy API
  const searchGifs = async (searchTerm: string) => {
    try {
      const apiKey = '3XEocAPxmO6auiyHBqiHea0eeu9XnGo4'; // Giphy API key
      let url = '';
      
      if (searchTerm && searchTerm.trim() !== '' && searchTerm !== 'trending') {
        url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=g`;
      } else {
        url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;
      }
      
      console.log('GIPHY API request:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('GIPHY API success:', data.data?.length || 0, 'GIFs found');
        setGifResults(data.data || []);
      } else {
        console.error('GIPHY API error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('GIPHY error details:', errorData);
        alert(`GIF search failed: ${errorData.message || response.statusText}. Please check your GIPHY API key.`);
        setGifResults([]);
      }
    } catch (error: any) {
      console.error('Error searching GIFs:', error);
      alert(`GIF search error: ${error.message}. Please check your internet connection.`);
      setGifResults([]);
    }
  };

  // Click outside handler for emoji and GIF pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
    };
    if (showPlusMenu || showEmojiPicker || showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlusMenu, showEmojiPicker, showGifPicker]);

  // Handle poll voting
  const handlePollVote = async (messageId: string, optionIndex: number) => {
    if (!user || !db || !selectedGroup || !messageId) return;
    
    try {
      const postRef = doc(db, 'groups', selectedGroup.id, 'messages', messageId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;
      
      const postData = postSnap.data();
      const currentVotes = postData.poll?.votes || {};
      const currentUserVotes = postData.poll?.userVotes || {};
      const optionKey = optionIndex.toString();
      
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
      } else {
        // Add vote
        const newVoters = [...optionVoters, user.uid];
        const newVoteCount = (currentVotes[optionKey] || 0) + 1;
        
        await updateDoc(postRef, {
          [`poll.votes.${optionKey}`]: newVoteCount,
          [`poll.userVotes.${optionKey}`]: newVoters
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSendMessage = async () => {
    // Allow sending if there's text, image, attachment, GIF, or poll
    const hasContent = messageText.trim() || imageFile || attachmentFile || selectedGif || (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2);
    
    if (!hasContent) {
      alert('Please add content to send (text, image, attachment, GIF, or poll)');
      return;
    }
    
    if (!selectedGroup) {
      console.warn('❌ Cannot send: No group selected');
      alert('Please select a group first');
      return;
    }
    
    if (!user) {
      console.warn('❌ Cannot send: User not authenticated');
      alert('Please log in to send messages');
      return;
    }
    
    if (uploading) {
      console.warn('⏳ Already uploading, please wait...');
      return;
    }

    const text = messageText;
    // Store file references before clearing state
    const currentImageFile = imageFile;
    const currentAttachmentFile = attachmentFile;
    const currentSelectedGif = selectedGif;
    const currentTags = tags;
    const currentLocation = location;
    const currentPollQuestion = pollQuestion;
    const currentPollOptions = pollOptions;
    
    // Clear state AFTER storing references
    setMessageText('');
    setUploading(true);

    try {
        let imageUrl = '';
        let attachmentUrl = '';
        let attachmentName = '';
        let attachmentType = '';
        let stickerUrl = '';
        let poll = null;
        
        // Handle GIF/Sticker
        if (currentSelectedGif) {
          console.log('📤 Sending sticker/GIF:', currentSelectedGif);
          stickerUrl = currentSelectedGif;
          setSelectedGif(null);
        }
        
        // Upload image if present
        if (currentImageFile) {
          try {
            console.log('📤 Uploading image:', currentImageFile.name, currentImageFile.size, 'bytes');
            const formData = new FormData();
            formData.append('file', currentImageFile);
            formData.append('upload_preset', 'uniconnect_uploads');
            formData.append('folder', `uniconnect/groups/${selectedGroup.id}/images`);
            // Note: Don't add resource_type for images - Cloudinary auto-detects
            
            console.log('📋 Upload parameters:', {
              preset: 'uniconnect_uploads',
              folder: `uniconnect/groups/${selectedGroup.id}/images`,
              fileName: currentImageFile.name,
              fileSize: currentImageFile.size
            });
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/dlnlwudgr/image/upload`, {
              method: 'POST',
              body: formData,
            });
            
            const responseData = await response.json().catch(async () => {
              const text = await response.text().catch(() => 'Unknown error');
              return { error: { message: text } };
            });
            
            if (response.ok) {
              imageUrl = responseData.secure_url;
              console.log('✅ Image uploaded successfully:', imageUrl);
            } else {
              console.error('❌ Image upload error:', {
                status: response.status,
                statusText: response.statusText,
                error: responseData
              });
              
              // Detailed error message based on Cloudinary response
              let errorMsg = `Image upload failed (${response.status})`;
              
              if (responseData.error?.message) {
                errorMsg = responseData.error.message;
              } else if (response.status === 400) {
                // 400 usually means preset is "Signed" or doesn't exist
                errorMsg = `❌ Cloudinary 400 Error!\n\nYour upload preset 'uniconnect_uploads' is either:\n1. Set to "Signed" (MUST be "Unsigned")\n2. Doesn't exist\n3. Not configured correctly\n\n🔧 FIX:\n1. Go to: https://cloudinary.com/console/settings/upload\n2. Edit preset: uniconnect_uploads\n3. General tab → Signing Mode → Change to "Unsigned"\n4. Optimize and Deliver tab → Access control → Set to "Public"\n5. Click "Save"`;
              } else if (response.status === 401) {
                errorMsg = 'Cloudinary authentication failed. Check upload preset is set to "Unsigned".';
              } else if (response.status === 403) {
                errorMsg = 'Access denied. Check Cloudinary preset "Access control" is set to "Public".';
              } else if (response.status === 404) {
                errorMsg = 'Cloudinary preset not found. Create preset "uniconnect_uploads" with "Unsigned" signing mode.';
              }
              
              throw new Error(errorMsg);
            }
            setImageFile(null);
            setImagePreview('');
          } catch (error: any) {
            console.error('Image upload error:', error);
            throw new Error(error.message || 'Failed to upload image. Please try again.');
          }
        }

        // Upload attachment if present
        if (currentAttachmentFile) {
          try {
            const postId = `temp_${Date.now()}`;
            const uploaded = await uploadImageToCloudinary(currentAttachmentFile, `uniconnect/groups/${selectedGroup.id}/attachments/${postId}`);
            attachmentUrl = uploaded;
            attachmentName = currentAttachmentFile.name;
            attachmentType = currentAttachmentFile.type.split('/')[0] || 'file';
            setAttachmentFile(null);
            setAttachmentPreview(null);
          } catch (error: any) {
            console.error('Attachment upload error:', error);
            throw new Error(error.message || 'Failed to upload attachment. Please try again.');
          }
        }

        // Handle poll if created
        if (currentPollQuestion && currentPollOptions.filter(o => o.trim()).length >= 2) {
          const validOptions = currentPollOptions.filter(o => o.trim());
          const initialVotes: {[key: string]: number} = {};
          const initialUserVotes: {[key: string]: string[]} = {};
          validOptions.forEach((_, index) => {
            initialVotes[index.toString()] = 0;
            initialUserVotes[index.toString()] = [];
          });
          poll = {
            question: currentPollQuestion,
            options: validOptions,
            votes: initialVotes,
            userVotes: initialUserVotes
          };
          setShowPollCreator(false);
          setPollQuestion('');
          setPollOptions(['', '']);
        }

        if (!db) throw new Error("DB unavailable");

        // Only send message if there's actual content
        if (text.trim() || imageUrl || attachmentUrl || stickerUrl || poll) {
          // Add message to Firestore
          const messageData: any = {
            text: text || '',
            senderId: user.uid,
            senderName: user.displayName || 'User',
            timestamp: serverTimestamp(),
            isAi: false
          };
          
          if (imageUrl) messageData.imageUrl = imageUrl;
          if (stickerUrl) messageData.stickerUrl = stickerUrl;
          if (poll) messageData.poll = poll;
          if (currentTags.length > 0) messageData.tags = currentTags;
          if (currentLocation) messageData.location = currentLocation;
          if (attachmentUrl) {
            messageData.attachments = [{
              name: attachmentName,
              url: attachmentUrl,
              type: attachmentType
            }];
          }
          
          await addDoc(collection(db, "groups", selectedGroup.id, "messages"), messageData);
          
          // Clear all state after successful send
          setImageFile(null);
          setImagePreview('');
          setSelectedGif(null);
          setTags([]);
          setTagInput('');
          setLocation(null);
          setAttachmentFile(null);
          setAttachmentPreview(null);
          setShowEmojiPicker(false);
          setShowGifPicker(false);

        } else {
          alert('No content to send. Please add text, image, attachment, sticker, or poll.');
        }

        // Check for AI invocation
        if (text.toLowerCase().includes('@ai')) {
            setIsTyping(true);
            try {
              // Extract question and generate AI response
              const aiResponse = await generateStudyHelp(text, selectedGroup.subject || 'General Studies');
            
              // Add AI response to Firestore
            await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
                text: aiResponse,
                senderId: 'ai-bot',
                  senderName: 'Study Buddy',
                timestamp: serverTimestamp(),
                isAi: true
            });
            } catch (aiError: any) {
              console.error('AI Error:', aiError);
              // Add error message as AI response
              await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
                  text: "I'm having trouble right now. Please try again in a moment! If this persists, check your Grok API key configuration.",
                  senderId: 'ai-bot',
                  senderName: 'Study Buddy',
                timestamp: serverTimestamp(),
                    isAi: true
            });
            } finally {
            setIsTyping(false);
        }
        }
    } catch (e: any) {
        console.error("Failed to send message:", e);
        const errorMessage = e.message || 'Failed to send message. Please try again.';
        
        // Show detailed error to user
        alert(`❌ Upload Failed!\n\n${errorMessage}\n\nPlease check:\n1. Cloudinary preset is set to "Unsigned"\n2. Access control is set to "Public"\n3. File size is under 10MB\n4. Internet connection is stable`);
        
        // Restore message text if upload failed
        setMessageText(text);
        
        // Don't clear files on error - let user retry
        // Files remain selected so user can try again
    } finally {
        setUploading(false);
    }
  };

  const myGroups = groups.filter(g => myGroupIds.has(g.id));
  const availableGroups = groups.filter(g => !myGroupIds.has(g.id));

  // Group List View
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:ml-64 w-full max-w-full overflow-x-hidden">
        <Header title="Study Groups" />
        <div className="max-w-3xl mx-auto p-3 sm:p-4 md:px-6 w-full">
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
                    <p className="text-sm text-slate-500">{group.subject} • {group.memberCount || 0} members</p>
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
            {availableGroups.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-100 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-2">No groups available yet</p>
                <p className="text-sm text-slate-400 mb-4">Create the first study group!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create Group
                </button>
              </div>
            ) : (
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
                        <p className="text-sm text-slate-500">{group.subject} • {group.memberCount || 0} members</p>
                        {group.description && <p className="text-xs text-slate-400 mt-1">{group.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="ml-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      {group.isPrivate ? 'Request to Join' : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 safe-top safe-bottom">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl mx-auto">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Create Group</h2>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 safe-top safe-bottom">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl mx-auto">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Join a Group</h2>
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
                          <p className="text-xs text-slate-500 mt-2">{group.memberCount || 0} members</p>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="ml-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          {group.isPrivate ? 'Request to Join' : 'Join'}
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
    <div className="h-screen flex flex-col bg-white md:ml-64 relative z-0 w-full max-w-full overflow-hidden">
      {/* Chat Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10 w-full max-w-full safe-top">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            onClick={() => setSelectedGroup(null)} 
            className="p-1.5 sm:p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-full touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0" 
            aria-label="Back"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Users size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{selectedGroup.name}</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">{selectedGroup.memberCount || 0} members • AI Active</p>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0" aria-label="More options">
          <MoreVertical size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Join Requests Banner (for owners/admins) */}
      {joinRequests.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {joinRequests.length} pending join request{joinRequests.length > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowRequestsModal(true)}
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50 pb-32 md:pb-4 w-full max-w-full min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            <Bot size={48} className="mx-auto text-indigo-300 mb-3" />
            <p>Start the conversation!</p>
            <p className="text-xs mt-2">Mention @AI to get study help</p>
          </div>
        )}
        
        {messages.length > 0 && (
          <div className="text-xs text-slate-400 mb-2 px-2 sticky top-0 bg-slate-50 z-10 py-1">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        )}
        
        {messages.map((msg, index) => {
          if (!msg || !msg.id) {
            return null;
          }
          const isMe = msg.senderId === user?.uid || msg.senderId === 'me';
          return (
            <div key={msg.id || `msg-${index}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
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
                {!isMe && !msg.isAi && <p className="text-[10px] font-bold text-slate-400 mb-1">{msg.senderName || 'Unknown'}</p>}
                
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Shared" 
                    className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.imageUrl, '_blank')}
                  />
                )}
                {(msg as any).attachments && (msg as any).attachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {(msg as any).attachments.map((att: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-100 rounded-lg flex items-center gap-2">
                        <FileText size={20} className="text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{att.name || 'Attachment'}</p>
                          <button
                            onClick={() => handleDownload(att.url, att.name || 'attachment')}
                            className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.stickerUrl && (
                  <div className="mb-2">
                    <img 
                      src={msg.stickerUrl} 
                      alt="Sticker" 
                      className="max-w-[200px] rounded-lg"
                    />
                  </div>
                )}
                {msg.poll && (
                  <div className="mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sm text-slate-800 mb-2">{msg.poll.question}</h4>
                    <div className="space-y-2">
                      {msg.poll.options.map((option, index) => {
                        const votes = msg.poll?.votes?.[index.toString()] || 0;
                        const totalVotes = Object.values(msg.poll?.votes || {}).reduce((a: number, b: number) => a + b, 0) || 0;
                        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                        const optionVoters = msg.poll?.userVotes?.[index.toString()] || [];
                        const userHasVoted = user ? optionVoters.includes(user.uid) : false;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => msg.id && handlePollVote(msg.id, index)}
                            className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                              userHasVoted 
                                ? 'bg-indigo-100 border-indigo-300' 
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700">{option}</span>
                              {userHasVoted && <span className="text-xs text-indigo-600 font-medium">✓</span>}
                            </div>
                            {totalVotes > 0 && (
                              <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            )}
                            <span className="text-xs text-slate-500 mt-1 block">{votes} votes</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                
                {/* Tags */}
                {(msg as any).tags && (msg as any).tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(msg as any).tags.map((tag: string, idx: number) => (
                      <span key={idx} className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Location */}
                {(msg as any).location && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} />
                    <span>{(msg as any).location.name}</span>
                  </div>
                )}
                
                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {(() => {
                      if (!msg.timestamp) return '...';
                      if (msg.timestamp instanceof Date) {
                        return msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      if (typeof msg.timestamp === 'object' && 'toDate' in msg.timestamp) {
                        return (msg.timestamp as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      try {
                        return new Date(msg.timestamp as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return '...';
                      }
                    })()}
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
          <div className="px-3 sm:px-4 py-2 bg-white border-t border-slate-200 w-full max-w-full">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg max-w-full" />
              <button 
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

      {/* Input Area - Fixed at bottom on mobile above nav bar, sticky on desktop - no gap */}
      <div className="fixed md:sticky bottom-[56px] md:bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:border-t border-b border-slate-200 md:border-b-0 p-2 sm:p-2.5 md:p-4 pb-2 sm:pb-2.5 md:pb-4 z-50 shadow-none md:shadow-none w-full max-w-full" style={{ marginBottom: 0 }}>
        {/* Text Input with Send Button */}
        <div className="flex items-end gap-2 sm:gap-3 mb-1 sm:mb-1.5 w-full max-w-full">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none touch-manipulation min-h-[40px] sm:min-h-[44px] max-h-28 sm:max-h-32 min-w-0"
            rows={1}
          />
          {/* Send Button - Always visible next to textarea, prominent on mobile */}
          <button 
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && !selectedGif && !imageFile && !pollQuestion && !attachmentFile) || uploading}
            className="bg-primary hover:bg-indigo-700 active:bg-indigo-800 text-white p-2 sm:p-2.5 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation flex-shrink-0 shadow-lg hover:shadow-xl min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] active:scale-95"
            aria-label="Send message"
            title="Send message"
          >
            {uploading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <Send size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Poll Creator */}
        {showPollCreator && (
          <div className="mb-1 sm:mb-1.5 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-full">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-slate-700">Create Poll</h4>
              <button 
                onClick={() => setShowPollCreator(false)} 
                className="text-slate-400 hover:text-slate-600 touch-manipulation p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Close poll creator"
              >
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Poll question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full px-3 py-2 mb-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
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
                    className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation min-w-0"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                      aria-label="Remove option"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button 
                onClick={addPollOption} 
                className="text-sm text-primary hover:underline mt-2 touch-manipulation py-1"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Icons Row - Toolbar - Compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar w-full max-w-full -mx-1 px-1 flex-nowrap pt-0.5">
          {/* Emoji Picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className="p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full text-primary cursor-pointer transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center flex-shrink-0"
              title="Add Emoji"
              aria-label="Add Emoji"
            >
              <Smile size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="fixed sm:absolute bottom-[105px] sm:bottom-full left-2 sm:left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-[60] max-h-48 overflow-y-auto"
                style={{ width: 'min(280px, calc(100vw - 1rem))' }}
              >
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMessageText(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl sm:text-2xl hover:bg-slate-50 rounded-lg p-1.5 sm:p-2 transition-colors touch-manipulation"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GIF Picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
                if (!showGifPicker) {
                  searchGifs('trending');
                }
              }}
              className="p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full text-primary cursor-pointer transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center flex-shrink-0"
              title="Add GIF"
              aria-label="Add GIF"
            >
              <ImageIcon size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
            </button>
            {showGifPicker && (
              <div
                ref={gifPickerRef}
                className="fixed sm:absolute bottom-[105px] sm:bottom-full left-2 sm:left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-[60]"
                style={{ width: 'min(320px, calc(100vw - 1rem))', maxHeight: '400px' }}
              >
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={gifSearchTerm}
                  onChange={(e) => {
                    setGifSearchTerm(e.target.value);
                    searchGifs(e.target.value);
                  }}
                  className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
                />
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {gifResults.map((gif: any) => (
                    <button
                      key={gif.id}
                      onClick={() => {
                        setSelectedGif(gif.images.fixed_height.url);
                        setShowGifPicker(false);
                      }}
                      className="hover:opacity-80 transition-opacity touch-manipulation"
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
            className={`p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full transition-colors touch-manipulation flex-shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center ${
              showPollCreator ? 'text-primary bg-indigo-50' : 'text-slate-600'
            }`}
            title="Create Poll"
            aria-label="Create Poll"
          >
            <BarChart3 size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
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
            className="p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full text-slate-600 transition-colors touch-manipulation flex-shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
            title="Add Tags"
            aria-label="Add Tags"
          >
            <Hash size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          </button>

          {/* Location */}
          <button
            onClick={handleGetLocation}
            className={`p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full transition-colors touch-manipulation flex-shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center ${
              location ? 'text-primary bg-indigo-50' : 'text-slate-600'
            }`}
            title="Add Location"
            aria-label="Add Location"
          >
            <MapPin size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          </button>

          {/* Image Upload */}
          <label className="p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full text-slate-600 cursor-pointer transition-colors touch-manipulation flex-shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center" title="Upload Image" aria-label="Upload Image">
            <Upload size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          {/* File Attachment */}
          <label className="p-1.5 sm:p-2 hover:bg-slate-50 active:bg-slate-100 rounded-full text-slate-600 cursor-pointer transition-colors touch-manipulation flex-shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center" title="Attach File" aria-label="Attach File">
            <FileText size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.txt,.zip"
              onChange={handleAttachmentSelect}
              className="hidden"
            />
          </label>
        </div>

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

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 w-full max-w-full">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium max-w-full"
              >
                <span className="truncate">#{tag}</span>
                <button
                  onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  className="hover:text-indigo-900 touch-manipulation p-0.5 flex-shrink-0"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 w-full max-w-full">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate flex-1 min-w-0">{location.name}</span>
            <button 
              onClick={() => setLocation(null)} 
              className="text-slate-400 hover:text-slate-600 touch-manipulation p-1 min-w-[28px] min-h-[28px] flex items-center justify-center flex-shrink-0"
              aria-label="Remove location"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attachment Preview */}
        {attachmentPreview && (
          <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-lg w-full max-w-full">
            <FileText size={16} className="text-slate-600 flex-shrink-0" />
            <span className="text-sm text-slate-700 truncate flex-1 min-w-0">{attachmentPreview.name}</span>
            <button 
              onClick={() => {
                setAttachmentFile(null);
                setAttachmentPreview(null);
              }} 
              className="text-slate-400 hover:text-slate-600 touch-manipulation p-1 min-w-[28px] min-h-[28px] flex items-center justify-center flex-shrink-0"
              aria-label="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* GIF Preview */}
        {selectedGif && (
          <div className="mt-2 relative w-full max-w-full">
            <img src={selectedGif} alt="Selected GIF" className="h-32 rounded-lg object-cover w-full max-w-full" />
            <button
              onClick={() => setSelectedGif(null)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1.5 text-xs hover:bg-black/70 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Remove GIF"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-2 relative w-full max-w-full">
            <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover w-full max-w-full" />
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview('');
              }}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1.5 text-xs hover:bg-black/70 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Join Request Success Modal */}
      {showJoinRequestSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Join Request Sent!</h2>
              <p className="text-slate-600 text-sm mb-6">The group owner will review your request.</p>
              <button 
                onClick={() => setShowJoinRequestSuccess(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Join Requests</h2>
              <button onClick={() => setShowRequestsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24}/>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {joinRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No pending join requests</p>
                </div>
              ) : (
                joinRequests.map((request: any) => (
                  <div key={request.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{request.userName}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Requested {request.createdAt.toLocaleDateString()}
                        </p>
                        {request.message && (
                          <p className="text-sm text-slate-600 mt-2">{request.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id, request.userId, request.userName)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
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

export default StudyGroups;
