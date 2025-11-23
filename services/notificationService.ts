import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Notification, NotificationType } from '../types';

// Create notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  imageUrl?: string,
  fromUserId?: string,
  fromUserName?: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, `users/${userId}/notifications`), {
    userId,
    type,
    title,
    message,
    link: link || null,
    imageUrl: imageUrl || null,
    fromUserId: fromUserId || null,
    fromUserName: fromUserName || null,
    read: false,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

// Get user notifications
export const getUserNotifications = async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
  const q = query(
    collection(db, `users/${userId}/notifications`),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, `users/${userId}/notifications`),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Mark notification as read
export const markAsRead = async (userId: string, notificationId: string): Promise<void> => {
  await updateDoc(doc(db, `users/${userId}/notifications`, notificationId), {
    read: true
  });
};

// Mark all notifications as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, `users/${userId}/notifications`),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { read: true })
  );

  await Promise.all(updatePromises);
};

// Delete notification
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, `users/${userId}/notifications`, notificationId));
};

// Clear all notifications
export const clearAllNotifications = async (userId: string): Promise<void> => {
  const q = query(collection(db, `users/${userId}/notifications`));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

// Notification helper functions for common events

export const notifyNewComment = async (
  postAuthorId: string,
  commenterName: string,
  commenterId: string,
  postId: string
): Promise<void> => {
  await createNotification(
    postAuthorId,
    'comment',
    'New Comment',
    `${commenterName} commented on your post`,
    `/post/${postId}`,
    undefined,
    commenterId,
    commenterName
  );
};

export const notifyNewLike = async (
  postAuthorId: string,
  likerName: string,
  likerId: string,
  postId: string
): Promise<void> => {
  await createNotification(
    postAuthorId,
    'like',
    'New Like',
    `${likerName} liked your post`,
    `/post/${postId}`,
    undefined,
    likerId,
    likerName
  );
};

export const notifyGroupInvite = async (
  userId: string,
  groupName: string,
  groupId: string,
  inviterName: string,
  inviterId: string
): Promise<void> => {
  await createNotification(
    userId,
    'group_invite',
    'Group Invitation',
    `${inviterName} invited you to join ${groupName}`,
    `/groups/${groupId}`,
    undefined,
    inviterId,
    inviterName
  );
};

export const notifyEventUpdate = async (
  userId: string,
  eventName: string,
  eventId: string,
  message: string
): Promise<void> => {
  await createNotification(
    userId,
    'event_update',
    'Event Update',
    `${eventName}: ${message}`,
    `/events/${eventId}`
  );
};

export const notifyMarketplaceInquiry = async (
  sellerId: string,
  buyerName: string,
  buyerId: string,
  listingTitle: string,
  listingId: string
): Promise<void> => {
  await createNotification(
    sellerId,
    'marketplace_inquiry',
    'New Inquiry',
    `${buyerName} is interested in ${listingTitle}`,
    `/marketplace/${listingId}`,
    undefined,
    buyerId,
    buyerName
  );
};

// Simple addNotification function for general use
export const addNotification = async (
  userId: string,
  notification: {
    type: string;
    message: string;
    createdAt: Date;
    title?: string;
    link?: string;
  }
): Promise<void> => {
  await addDoc(collection(db, `users/${userId}/notifications`), {
    userId,
    type: notification.type,
    title: notification.title || 'Notification',
    message: notification.message,
    link: notification.link || null,
    read: false,
    createdAt: serverTimestamp()
  });
};

