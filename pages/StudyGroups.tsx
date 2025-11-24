import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Users, BookOpen, ChevronRight, MoreVertical, ArrowLeft, Plus, X, Upload, Image as ImageIcon, Lock, Globe, Search, Smile, FileText, BarChart3, Video, File } from 'lucide-react';
import { StudyGroup, ChatMessage } from '../types';
import Header from '../components/Header';
import { generateStudyHelp } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
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
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [userRole, setUserRole] = useState<Map<string, string>>(new Map());
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
    const hasContent = messageText.trim() || imageFile || videoFile || documentFile || selectedGif || (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2);
    const isDisabled = uploading || !selectedGroup || !user || !hasContent;
    
    // Only log when files are actually selected to reduce spam
    if (imageFile || videoFile || documentFile || selectedGif) {
      console.log('🔍 Send button state check (FILE SELECTED):', {
        hasContent: !!hasContent,
        isDisabled,
        imageFile: !!imageFile,
        imageFileName: imageFile?.name,
        videoFile: !!videoFile,
        videoFileName: videoFile?.name,
        documentFile: !!documentFile,
        documentFileName: documentFile?.name,
        selectedGif: !!selectedGif,
        messageText: messageText.trim(),
        uploading,
        selectedGroup: !!selectedGroup,
        user: !!user
      });
    }
  }, [imageFile, videoFile, documentFile, selectedGif, messageText, uploading, selectedGroup, user, showPollCreator, pollQuestion, pollOptions]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      if (!db) throw new Error("DB unavailable");
      const querySnapshot = await getDocs(collection(db, "groups"));
      
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
      
      if (fetchedGroups.length > 0) {
        setGroups(fetchedGroups);
      } else {
        setGroups([]);
      }
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
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
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
                        videoUrl: data.videoUrl || null,
                        documentUrl: data.documentUrl || null,
                        documentName: data.documentName || null,
                        stickerUrl: data.stickerUrl || null,
                        poll: data.poll || null,
                        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                        isAi: data.isAi || false
                    } as ChatMessage;
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
        alert('Join request sent! The group owner will review your request.');
        loadGroups();
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
        alert('Joined group successfully! 🎉');
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
    const files = e.target.files;
    if (files && files.length > 0) {
      // For now, handle only the first file (can extend to multiple later)
      const file = files[0];
      console.log('📷 Image selected:', file.name, file.size, 'bytes', file.type);
      setImageFile(file);
      setVideoFile(null);
      setDocumentFile(null);
      setSelectedGif(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('✅ Image preview ready, send button should be enabled');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('⚠️ No image file selected');
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('🎥 Video selected:', file.name, file.size, 'bytes', file.type);
      setVideoFile(file);
      setImageFile(null);
      setDocumentFile(null);
      setImagePreview('');
      setSelectedGif(null);
      console.log('✅ Video file set, send button should be enabled');
    } else {
      console.log('⚠️ No video file selected');
    }
    setShowPlusMenu(false);
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📄 Document selected:', file.name, file.size, 'bytes', file.type);
      setDocumentFile(file);
      setImageFile(null);
      setVideoFile(null);
      setImagePreview('');
      setSelectedGif(null);
      console.log('✅ Document file set');
      console.log('✅ Send button should now be ENABLED - documentFile is set:', !!file);
    } else {
      console.log('⚠️ No document file selected');
    }
    setShowPlusMenu(false);
    // Reset input to allow selecting same file again
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
    // Allow sending if there's text, image, video, document, GIF, or poll
    const hasContent = messageText.trim() || imageFile || videoFile || documentFile || selectedGif || (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2);
    
    console.log('🔵 handleSendMessage called:', {
      hasContent,
      messageText: messageText.trim(),
      imageFile: !!imageFile,
      imageFileName: imageFile?.name,
      videoFile: !!videoFile,
      videoFileName: videoFile?.name,
      documentFile: !!documentFile,
      documentFileName: documentFile?.name,
      selectedGif: !!selectedGif,
      selectedGroup: !!selectedGroup,
      selectedGroupId: selectedGroup?.id,
      user: !!user,
      userId: user?.uid,
      uploading: uploading
    });
    
    if (!hasContent) {
      console.warn('❌ Cannot send: No content (text, image, video, document, GIF, or poll)');
      alert('Please add content to send (text, image, video, document, or sticker)');
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
    const currentVideoFile = videoFile;
    const currentDocumentFile = documentFile;
    const currentSelectedGif = selectedGif;
    
    // Clear state AFTER storing references
    setMessageText('');
    setUploading(true);

    try {
        let imageUrl = '';
        let videoUrl = '';
        let documentUrl = '';
        let documentName = '';
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

        // Upload video if present
        if (currentVideoFile) {
          try {
            console.log('📤 Uploading video:', currentVideoFile.name, currentVideoFile.size, 'bytes');
            const formData = new FormData();
            formData.append('file', currentVideoFile);
            formData.append('upload_preset', 'uniconnect_uploads');
            formData.append('folder', `uniconnect/groups/${selectedGroup.id}/videos`);
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/dlnlwudgr/video/upload`, {
              method: 'POST',
              body: formData,
            });
            
            const responseData = await response.json().catch(async () => {
              const text = await response.text().catch(() => 'Unknown error');
              return { error: { message: text } };
            });
            
            if (response.ok) {
              videoUrl = responseData.secure_url;
              console.log('✅ Video uploaded successfully:', videoUrl);
            } else {
              console.error('❌ Video upload error:', {
                status: response.status,
                statusText: response.statusText,
                error: responseData
              });
              
              let errorMsg = `Video upload failed (${response.status})`;
              if (responseData.error?.message) {
                errorMsg = responseData.error.message;
              } else if (response.status === 400) {
                errorMsg = `❌ Cloudinary 400 Error!\n\nYour upload preset 'uniconnect_uploads' is either:\n1. Set to "Signed" (MUST be "Unsigned")\n2. Doesn't exist\n3. Not configured correctly\n\n🔧 FIX:\n1. Go to: https://cloudinary.com/console/settings/upload\n2. Edit preset: uniconnect_uploads\n3. General tab → Signing Mode → Change to "Unsigned"\n4. Optimize and Deliver tab → Access control → Set to "Public"\n5. Click "Save"`;
              } else if (response.status === 401) {
                errorMsg = 'Cloudinary authentication failed. Check upload preset is set to "Unsigned".';
              } else if (response.status === 403) {
                errorMsg = 'Access denied. Check Cloudinary preset "Access control" is set to "Public".';
              } else if (response.status === 413) {
                errorMsg = 'Video file too large. Maximum size is 10MB for free tier.';
              }
              
              throw new Error(errorMsg);
            }
            setVideoFile(null);
          } catch (error: any) {
            console.error('❌ Video upload error:', error);
            setUploading(false);
            throw new Error(error.message || 'Failed to upload video. Please try again.');
          }
        }

        // Upload document if present
        if (currentDocumentFile) {
          try {
            console.log('📤 Uploading document:', currentDocumentFile.name, currentDocumentFile.size, 'bytes');
            const formData = new FormData();
            formData.append('file', currentDocumentFile);
            formData.append('upload_preset', 'uniconnect_uploads');
            formData.append('folder', `uniconnect/groups/${selectedGroup.id}/documents`);
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/dlnlwudgr/raw/upload`, {
              method: 'POST',
              body: formData,
            });
            
            const responseData = await response.json().catch(async () => {
              const text = await response.text().catch(() => 'Unknown error');
              return { error: { message: text } };
            });
            
            if (response.ok) {
              documentUrl = responseData.secure_url;
              documentName = currentDocumentFile.name;
              console.log('✅ Document uploaded successfully:', documentUrl);
            } else {
              console.error('❌ Document upload error:', {
                status: response.status,
                statusText: response.statusText,
                error: responseData
              });
              
              let errorMsg = `Document upload failed (${response.status})`;
              if (responseData.error?.message) {
                errorMsg = responseData.error.message;
              } else if (response.status === 400) {
                errorMsg = `❌ Cloudinary 400 Error!\n\nYour upload preset 'uniconnect_uploads' is either:\n1. Set to "Signed" (MUST be "Unsigned")\n2. Doesn't exist\n3. Not configured correctly\n\n🔧 FIX:\n1. Go to: https://cloudinary.com/console/settings/upload\n2. Edit preset: uniconnect_uploads\n3. General tab → Signing Mode → Change to "Unsigned"\n4. Optimize and Deliver tab → Access control → Set to "Public"\n5. Click "Save"`;
              } else if (response.status === 401) {
                errorMsg = 'Cloudinary authentication failed. Check upload preset is set to "Unsigned".';
              } else if (response.status === 403) {
                errorMsg = 'Access denied. Check Cloudinary preset "Access control" is set to "Public".';
              } else if (response.status === 413) {
                errorMsg = 'Document file too large. Maximum size is 10MB for free tier.';
              }
              
              throw new Error(errorMsg);
            }
            setDocumentFile(null);
          } catch (error: any) {
            console.error('❌ Document upload error:', error);
            setUploading(false);
            throw new Error(error.message || 'Failed to upload document. Please try again.');
          }
        }

        // Handle poll if created
        if (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2) {
          poll = {
            question: pollQuestion,
            options: pollOptions.filter(o => o.trim()),
            votes: {},
            userVotes: {}
          };
          setShowPollCreator(false);
          setPollQuestion('');
          setPollOptions(['', '']);
        }

        if (!db) throw new Error("DB unavailable");

        // Only send message if there's actual content (text, image, video, document, sticker, or poll)
        if (text.trim() || imageUrl || videoUrl || documentUrl || stickerUrl || poll) {
          console.log('Saving message to Firestore:', {
            hasText: !!text.trim(),
            hasImage: !!imageUrl,
            hasVideo: !!videoUrl,
            hasDocument: !!documentUrl,
            hasSticker: !!stickerUrl,
            hasPoll: !!poll
          });
          
          // Add message to Firestore
        await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
            text: text || '',
            imageUrl: imageUrl || null,
            videoUrl: videoUrl || null,
            documentUrl: documentUrl || null,
            documentName: documentName || null,
            stickerUrl: stickerUrl || null,
            poll: poll || null,
            senderId: user.uid,
            senderName: user.displayName || 'User',
            timestamp: serverTimestamp(),
            isAi: false
        });

          console.log('Message saved successfully to Firestore');
        } else {
          console.warn('No content to send - skipping message creation');
          alert('No content to send. Please add text, image, video, document, sticker, or poll.');
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
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:ml-64">
        <Header title="Study Groups" />
        <div className="max-w-3xl mx-auto p-4 md:px-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6">
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
              <p className="text-[10px] text-slate-500">{selectedGroup.memberCount || 0} members • AI Active</p>
            </div>
          </div>
        </div>
        <MoreVertical className="text-slate-400" size={20} />
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
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
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
                {msg.videoUrl && (
                  <div className="mb-2">
                    <video 
                      src={msg.videoUrl} 
                      controls
                      className="max-w-[250px] rounded-lg"
                    />
                  </div>
                )}
                {msg.documentUrl && (
                  <div className="mb-2 p-3 bg-slate-100 rounded-lg flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{msg.documentName || 'Document'}</p>
                      <a 
                        href={msg.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Download
                      </a>
                    </div>
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
        {/* Poll Creator */}
        {showPollCreator && (
          <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-slate-700">Create Poll</h4>
              <button onClick={() => setShowPollCreator(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Poll question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full px-3 py-2 mb-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => removePollOption(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button onClick={addPollOption} className="text-sm text-primary hover:underline">
                + Add Option
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          {/* Plus Button with Menu */}
          <div className="relative" ref={plusMenuRef}>
            <button
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowEmojiPicker(false);
              }}
              className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors"
            >
              <Plus size={20} />
            </button>
            {showPlusMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 min-w-[180px]">
                <button
                  onClick={() => {
                    document.getElementById('photo-upload')?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center gap-2 text-sm text-slate-700"
                >
                  <ImageIcon size={18} />
                  Photos
                </button>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  multiple
                />
                <button
                  onClick={() => {
                    document.getElementById('video-upload')?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center gap-2 text-sm text-slate-700"
                >
                  <Video size={18} />
                  Videos
                </button>
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    document.getElementById('document-upload')?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center gap-2 text-sm text-slate-700"
                >
                  <File size={18} />
                  Documents
                </button>
                <input
                  type="file"
                  id="document-upload"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDocumentSelect}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    setShowPollCreator(true);
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center gap-2 text-sm text-slate-700"
                >
                  <BarChart3 size={18} />
                  Poll
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker(true);
                    setShowPlusMenu(false);
                    setShowEmojiPicker(false);
                    setGifSearchTerm('');
                    searchGifs('trending');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center gap-2 text-sm text-slate-700"
                >
                  <Smile size={18} />
                  Sticker (GIF)
                </button>
              </div>
            )}
          </div>

          {/* GIF/Sticker Picker - Positioned near Plus button */}
          {showGifPicker && (
            <div 
              ref={gifPickerRef}
              className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50"
              style={{ width: '320px', maxHeight: '400px' }}
            >
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={gifSearchTerm}
                  onChange={(e) => {
                    setGifSearchTerm(e.target.value);
                    if (e.target.value.trim()) {
                      searchGifs(e.target.value);
                    } else {
                      searchGifs('trending');
                    }
                  }}
                  className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {gifResults.length > 0 ? (
                    gifResults.map((gif: any) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedGif(gif.images.fixed_height.url);
                          setShowGifPicker(false);
                          setGifSearchTerm('');
                        }}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={gif.images.fixed_height_small.url}
                          alt={gif.title || 'GIF'}
                          className="w-full rounded-lg"
                        />
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4 col-span-2">Loading GIFs...</p>
                  )}
                </div>
              </div>
          )}

          {/* Emoji Button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
                setShowPlusMenu(false);
                setShowGifPicker(false);
              }}
              className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors"
            >
              <Smile size={20} />
            </button>
            {/* Emoji Picker - Positioned relative to emoji button */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50 max-h-64 overflow-y-auto"
                style={{ width: '280px' }}
              >
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMessageText(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl hover:bg-slate-50 rounded-lg p-1.5 transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !uploading && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button 
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const hasContent = messageText.trim() || imageFile || videoFile || documentFile || selectedGif || (showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2);
              
              console.log('🔵 Send button clicked!', {
                hasContent,
                imageFile: !!imageFile,
                imageFileName: imageFile?.name,
                videoFile: !!videoFile,
                videoFileName: videoFile?.name,
                documentFile: !!documentFile,
                documentFileName: documentFile?.name,
                selectedGif: !!selectedGif,
                messageText: messageText.trim(),
                uploading: uploading,
                selectedGroup: !!selectedGroup,
                selectedGroupId: selectedGroup?.id,
                user: !!user,
                userId: user?.uid
              });
              
              if (!hasContent) {
                console.warn('⚠️ No content to send');
                alert('Please add content to send (text, image, video, document, or sticker)');
                return;
              }
              
              if (uploading) {
                console.warn('⏳ Already uploading, please wait...');
                return;
              }
              
              try {
                await handleSendMessage();
              } catch (error: any) {
                console.error('❌ Send button error:', error);
                alert(`Failed to send message: ${error.message || 'Unknown error'}`);
              }
            }}
            disabled={
              uploading || 
              !selectedGroup || 
              !user ||
              (!messageText.trim() && 
               !imageFile && 
               !videoFile && 
               !documentFile && 
               !selectedGif && 
               !(showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2))
            }
            style={{
              opacity: (uploading || !selectedGroup || !user || (!messageText.trim() && !imageFile && !videoFile && !documentFile && !selectedGif && !(showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2))) ? 0.5 : 1,
              cursor: (uploading || !selectedGroup || !user || (!messageText.trim() && !imageFile && !videoFile && !documentFile && !selectedGif && !(showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2))) ? 'not-allowed' : 'pointer'
            }}
            className={`p-2 rounded-full transition-colors ${
              (uploading || !selectedGroup || !user || (!messageText.trim() && !imageFile && !videoFile && !documentFile && !selectedGif && !(showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2)))
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-indigo-700 cursor-pointer'
            }`}
            title={
              uploading ? "Uploading..." :
              !selectedGroup ? "Select a group" :
              !user ? "Please log in" :
              (!messageText.trim() && !imageFile && !videoFile && !documentFile && !selectedGif && !(showPollCreator && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2)) 
                ? "Add content to send" 
                : "Send message"
            }
          >
            {uploading ? <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        {/* Preview */}
        {imagePreview && (
          <div className="mt-2 relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-w-[200px] max-h-[200px] rounded-lg" />
            <div className="absolute top-1 right-1 flex gap-1">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Ready to send</span>
              <button
                onClick={() => {
                  console.log('🗑️ Removing image');
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={14} />
              </button>
      </div>
          </div>
        )}
        {videoFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
            <Video size={16} className="text-primary" />
            <span className="flex-1 truncate">{videoFile.name}</span>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Ready to send</span>
            <button 
              onClick={() => {
                console.log('🗑️ Removing video');
                setVideoFile(null);
              }} 
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {documentFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
            <File size={16} className="text-primary" />
            <span className="flex-1 truncate">{documentFile.name}</span>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Ready to send</span>
            <button 
              onClick={() => {
                console.log('🗑️ Removing document');
                setDocumentFile(null);
              }} 
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {selectedGif && (
          <div className="mt-2 relative inline-block">
            <img src={selectedGif} alt="Selected GIF" className="max-w-[200px] max-h-[200px] rounded-lg" />
            <div className="absolute top-1 right-1 flex gap-1">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Ready to send</span>
              <button
                onClick={() => {
                  console.log('🗑️ Removing GIF');
                  setSelectedGif(null);
                }}
                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Join Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">Join Requests</h2>
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
    </div>
  );
};

export default StudyGroups;
