import { auth, db } from '../firebaseConfig';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
  getDoc,
  increment,
} from 'firebase/firestore';

export type DirectMessage = {
  id: string;
  messageType?: 'text' | 'image' | 'file' | 'location';
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
  read: boolean;
  readAt?: any;
  imageUrl?: string;
  file?: {
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
};

export type ConversationSummary = {
  id: string;
  participants: string[];
  lastMessageText?: string;
  lastMessageAt?: any;
  lastMessageSenderId?: string;
  unreadCounts?: Record<string, number>;
};

export function getConversationId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('__');
}

export async function ensureConversation(conversationId: string, participants: string[]) {
  if (!db) throw new Error('Firestore unavailable');
  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    participants,
    unreadCounts: participants.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {} as Record<string, number>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenToConversations(
  userId: string,
  cb: (conversations: ConversationSummary[]) => void
) {
  if (!db) return () => {};
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ConversationSummary[];
    convs.sort((a: any, b: any) => {
      const ta = a.updatedAt?.toMillis?.() || a.lastMessageAt?.toMillis?.() || 0;
      const tb = b.updatedAt?.toMillis?.() || b.lastMessageAt?.toMillis?.() || 0;
      return tb - ta;
    });
    cb(convs);
  });
}

export function listenToDirectMessages(
  conversationId: string,
  cb: (messages: DirectMessage[]) => void
) {
  if (!db) return () => {};
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(300)
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DirectMessage[];
    cb(msgs);
  });
}

export async function sendDirectMessage(args: {
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  messageType?: 'text' | 'image' | 'file' | 'location';
  file?: { url: string; name: string; size?: number; mimeType?: string };
  location?: { latitude: number; longitude: number; name?: string };
  senderName?: string;
  senderPhoto?: string;
  receiverName?: string;
  receiverPhoto?: string;
}) {
  if (!db) throw new Error('Firestore unavailable');

  const {
    conversationId,
    senderId,
    receiverId,
    text,
    imageUrl,
    messageType,
    file,
    location,
    senderName,
    senderPhoto,
    receiverName,
    receiverPhoto,
  } = args;

  const computedType: 'text' | 'image' | 'file' | 'location' =
    messageType ||
    (location ? 'location' : file ? 'file' : imageUrl ? 'image' : 'text');

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    messageType: computedType,
    text: text || '',
    imageUrl: imageUrl || '',
    file: file || null,
    location: location || null,
    senderId,
    receiverId,
    senderName: senderName || auth.currentUser?.displayName || 'Anonymous',
    senderPhoto: senderPhoto || auth.currentUser?.photoURL || '',
    receiverName: receiverName || '',
    receiverPhoto: receiverPhoto || '',
    createdAt: serverTimestamp(),
    read: false,
    readAt: null,
  });

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessageText:
      computedType === 'text'
        ? (text && text.trim()) ? text.trim() : ''
        : computedType === 'image'
          ? '📷 Photo'
          : computedType === 'file'
            ? '📎 File'
            : '📍 Location',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    [`unreadCounts.${receiverId}`]: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  if (!db) return;
  // Best-effort: conversation-level unread badge reset
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}


