import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Image as ImageIcon, ArrowLeft, MessageCircle, Smile, Paperclip, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { 
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getUserProfile } from '../services/profileService';
import {
  ensureConversation,
  getConversationId,
  listenToConversations,
  listenToDirectMessages,
  markConversationRead,
  sendDirectMessage,
  type ConversationSummary,
  type DirectMessage,
} from '../services/chatService';
import EmojiPicker from '../components/chat/EmojiPicker';
import ImageLightbox from '../components/chat/ImageLightbox';
import LocationCard, { type SharedLocation } from '../components/chat/LocationCard';
import FileAttachmentCard from '../components/chat/FileAttachmentCard';
import { uploadChatImageToCloudinary, uploadFileToCloudinary } from '../services/cloudinaryService';

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
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageToPreview, setImageToPreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingLocation, setPendingLocation] = useState<SharedLocation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;
  const [isNearBottom, setIsNearBottom] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

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

  const activeConversationId = useMemo(() => {
    if (!currentUser || !selectedUser) return null;
    return getConversationId(currentUser.uid, selectedUser.id);
  }, [currentUser?.uid, selectedUser?.id]);

  // Load conversations (real-time) from conversations collection
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }

    const unsub = listenToConversations(currentUser.uid, async (convs: ConversationSummary[]) => {
      const mapped = (await Promise.all(
        convs.map(async (c) => {
          const otherUserId = c.participants.find((p) => p !== currentUser.uid) || '';
          if (!otherUserId) return null;

          let userName = 'Unknown User';
          let userPhoto = `https://ui-avatars.com/api/?name=User`;
          try {
            const profile = await getUserProfile(otherUserId);
            if (profile) {
              userName = profile.displayName || userName;
              userPhoto = profile.photoURL || userPhoto;
            }
          } catch {
            // ignore profile fetch errors
          }
          
          return {
            userId: otherUserId,
            userName,
            userPhoto,
            lastMessage: c.lastMessageText || '',
            lastMessageTime: c.lastMessageAt,
            unread: c.unreadCounts?.[currentUser.uid] || 0,
          } as Conversation;
        })
      )) as Array<Conversation | null>;

      setConversations(mapped.filter(Boolean) as Conversation[]);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Listen to direct messages for the selected conversation
        useEffect(() => {
    if (!currentUser || !selectedUser || !activeConversationId) {
            setMessages([]);
            return;
          }

    let cancelled = false;
    ensureConversation(activeConversationId, [currentUser.uid, selectedUser.id]).catch(() => {});

    const unsub = listenToDirectMessages(activeConversationId, (msgs) => {
      if (cancelled) return;
      setMessages(msgs);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [currentUser?.uid, selectedUser?.id, activeConversationId]);

  // Mark messages as read (best-effort)
  useEffect(() => {
    if (!currentUser || !activeConversationId || messages.length === 0) return;
    if (!db) return;

    const unread = messages.filter((m) => m.receiverId === currentUser.uid && !m.read);
    unread.slice(-25).forEach((m) => {
      updateDoc(doc(db, 'conversations', activeConversationId, 'messages', m.id), { read: true, readAt: new Date() }).catch(() => {});
    });
    // Also reset conversation unread badge
    markConversationRead(activeConversationId, currentUser.uid).catch(() => {});
  }, [messages, currentUser?.uid, activeConversationId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll only if user is near bottom (WhatsApp behavior)
  useEffect(() => {
    if (!selectedUser) return;
    if (isNearBottom) {
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
  }, [messages.length, selectedUser?.id, isNearBottom]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom < 120);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !currentUser || !activeConversationId) return;
    if (!newMessage.trim() && !pendingImageFile && !pendingFile && !pendingLocation) return;
    try {
      setUploadError('');
      await ensureConversation(activeConversationId, [currentUser.uid, selectedUser.id]);
      setUploading(true);
      setUploadProgress(0);

      // 1) Location
      if (pendingLocation) {
        await sendDirectMessage({
          conversationId: activeConversationId,
          senderId: currentUser.uid,
          receiverId: selectedUser.id,
          text: '',
          messageType: 'location',
          location: pendingLocation,
          senderName: currentUser.displayName || 'Anonymous',
          senderPhoto: currentUser.photoURL || '',
          receiverName: selectedUser.name,
          receiverPhoto: selectedUser.photo,
        });
        setPendingLocation(null);
      }

      // 2) Image (upload to Firebase Storage)
      if (pendingImageFile) {
        setUploadProgress(10);
        const url = await uploadChatImageToCloudinary(
          pendingImageFile,
          `uniconnect/chat/direct/${activeConversationId}/${currentUser.uid}`
        );
        setUploadProgress(90);
        await sendDirectMessage({
          conversationId: activeConversationId,
      senderId: currentUser.uid,
          receiverId: selectedUser.id,
          text: '',
          messageType: 'image',
          imageUrl: url,
      senderName: currentUser.displayName || 'Anonymous',
      senderPhoto: currentUser.photoURL || '',
          receiverName: selectedUser.name,
          receiverPhoto: selectedUser.photo,
        });
        setUploadProgress(100);
        setPendingImageFile(null);
        setPendingImagePreview('');
      }

      // 3) File (upload to Cloudinary raw)
      if (pendingFile) {
        setUploadProgress(10);
        const uploaded = await uploadFileToCloudinary(
          pendingFile,
          `uniconnect/chat/direct/${activeConversationId}/${currentUser.uid}/files`
        );
        setUploadProgress(90);
        await sendDirectMessage({
          conversationId: activeConversationId,
          senderId: currentUser.uid,
      receiverId: selectedUser.id,
          text: '',
          messageType: 'file',
          file: uploaded,
          senderName: currentUser.displayName || 'Anonymous',
          senderPhoto: currentUser.photoURL || '',
      receiverName: selectedUser.name,
          receiverPhoto: selectedUser.photo,
        });
        setUploadProgress(100);
        setPendingFile(null);
      }

      // 4) Text
      if (newMessage.trim()) {
        await sendDirectMessage({
          conversationId: activeConversationId,
          senderId: currentUser.uid,
          receiverId: selectedUser.id,
          text: newMessage.trim(),
          messageType: 'text',
          senderName: currentUser.displayName || 'Anonymous',
          senderPhoto: currentUser.photoURL || '',
          receiverName: selectedUser.name,
          receiverPhoto: selectedUser.photo,
        });
        setNewMessage('');
      } else {
        setNewMessage('');
      }

      setIsNearBottom(true);
      scrollToBottom('auto');
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadError((error as any)?.message || 'Failed to send message');
      alert((error as any)?.message || 'Failed to send message');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setPendingFile(null);
    setPendingLocation(null);
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPendingImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
      
  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setPendingImageFile(null);
    setPendingImagePreview('');
    setPendingLocation(null);
    setPendingFile(file);
    e.target.value = '';
  };

  const handleShareLocation = async () => {
    setUploadError('');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingImageFile(null);
        setPendingImagePreview('');
        setPendingFile(null);
        setPendingLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: 'Current location',
        });
      },
      () => {
        alert('Could not get location. Please allow location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const insertEmojiAtCursor = (emoji: string) => {
    const input = textInputRef.current;
    if (!input) {
      setNewMessage((prev) => prev + emoji);
      return;
    }
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const next = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(next);
    requestAnimationFrame(() => {
      input.focus();
      const caret = start + emoji.length;
      input.setSelectionRange(caret, caret);
    });
  };

  if (!selectedUser) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden pb-4 md:pb-4 lg:pb-0 w-full max-w-full">
        {/* Conversations List */}
        <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full max-w-full overflow-hidden">
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
                    <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">{conv.lastMessage || 'Tap to chat'}</p>
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
    <div className="flex flex-col h-screen md:h-screen bg-white overflow-hidden pb-0 w-full max-w-full">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 pl-16 md:pl-4 border-b border-slate-200 flex items-center gap-2 sm:gap-3 bg-white sticky top-0 z-[60] flex-shrink-0 safe-top">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex-shrink-0 p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back"
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
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2 bg-slate-50 min-h-0 pb-24 md:pb-4 w-full"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <div 
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full max-w-full`}
            >
              <div className={`max-w-[88%] sm:max-w-[70%] min-w-0 message-container ${isMine ? 'order-2' : 'order-1'}`}>
                {/* WhatsApp-like: render by message type */}
                {msg.messageType === 'image' && msg.imageUrl && (
                  <button
                    onClick={() => setImageToPreview(msg.imageUrl || null)}
                    className="block"
                    aria-label="Open image"
                  >
                  <img 
                    src={msg.imageUrl}
                    alt="Shared"
                      className="rounded-2xl mb-1 max-h-64 sm:max-h-80 w-full h-auto object-cover border border-slate-200"
                    style={{ maxWidth: '100%' }}
                  />
                  </button>
                )}

                {msg.messageType === 'file' && (msg as any).file?.url && (
                  <FileAttachmentCard file={(msg as any).file} />
                )}

                {msg.messageType === 'location' && (msg as any).location?.latitude && (
                  <LocationCard location={(msg as any).location} />
                )}

                {(msg.messageType === 'text' || !msg.messageType) && msg.text && (
                  <div
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base shadow-sm ${
                    isMine 
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                    }`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}
                  >
                    <p style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 px-2">
                  <p className="text-xs text-slate-400 break-words">
                  {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                </p>
                  {isMine && (
                    <span className={`text-xs ${msg.read ? 'text-sky-500' : 'text-slate-400'}`} aria-label={msg.read ? 'Read' : 'Sent'}>
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Composer */}
      <div className="bg-white border-t border-slate-200 fixed md:sticky bottom-0 md:bottom-4 lg:bottom-0 left-0 right-0 z-10 flex-shrink-0 pb-safe md:pb-0 max-w-full shadow-lg md:shadow-none">
        {/* Pending previews */}
        {(pendingImagePreview || pendingFile || pendingLocation) && (
          <div className="px-3 sm:px-4 pt-3">
            {pendingImagePreview && (
              <div className="relative inline-block">
                <img src={pendingImagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-slate-200" />
                <button
                  onClick={() => { setPendingImageFile(null); setPendingImagePreview(''); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )}
            {pendingFile && (
              <div className="mt-2">
                <FileAttachmentCard file={{ url: '#', name: pendingFile.name, size: pendingFile.size, mimeType: pendingFile.type }} />
                <button
                  onClick={() => setPendingFile(null)}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            )}
            {pendingLocation && (
              <div className="mt-2">
                <LocationCard location={pendingLocation} />
                <button
                  onClick={() => setPendingLocation(null)}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Remove location
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-3 sm:p-4">
          {/* hidden inputs */}
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePickImage} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={handlePickFile} />

        <div className="flex items-center gap-2 sm:gap-3 w-full">
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Emoji"
            >
              <Smile size={20} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Photo"
            >
              <ImageIcon size={20} />
            </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Attach file"
          >
              <Paperclip size={20} />
            </button>
            <button
              onClick={handleShareLocation}
              disabled={uploading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Share location"
            >
              <MapPin size={20} />
          </button>

          <input
              ref={textInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message"
              className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base touch-manipulation"
          />

          <button
            onClick={handleSendMessage}
              disabled={uploading || (!newMessage.trim() && !pendingImageFile && !pendingFile && !pendingLocation)}
            className="p-2.5 sm:p-3 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Send"
          >
              <Send size={20} />
          </button>
        </div>

        {uploading && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-center">Uploading… {uploadProgress}%</p>
            </div>
          )}
          {uploadError && (
            <p className="text-xs text-red-600 mt-2 text-center">{uploadError}</p>
        )}
        </div>
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={(e) => {
          insertEmojiAtCursor(e);
          setShowEmojiPicker(false);
        }}
      />
      <ImageLightbox
        isOpen={!!imageToPreview}
        src={imageToPreview}
        onClose={() => setImageToPreview(null)}
      />
    </div>
  );
};

export default Messages;

