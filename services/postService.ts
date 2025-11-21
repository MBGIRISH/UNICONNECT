import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Post, Comment, PaginationParams } from '../types';

// Create a new post
export const createPost = async (
  authorId: string,
  authorName: string,
  authorAvatar: string | undefined,
  content: string,
  imageUrls?: string[],
  groupId?: string
): Promise<string> => {
  const postData = {
    authorId,
    authorName,
    authorAvatar: authorAvatar || null,
    content,
    imageUrls: imageUrls || [],
    groupId: groupId || null,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const collectionPath = groupId ? `groups/${groupId}/posts` : 'posts';
  const docRef = await addDoc(collection(db, collectionPath), postData);
  
  return docRef.id;
};

// Get posts with pagination
export const getPosts = async (params?: PaginationParams, groupId?: string): Promise<Post[]> => {
  const collectionPath = groupId ? `groups/${groupId}/posts` : 'posts';
  let q = query(
    collection(db, collectionPath),
    orderBy('createdAt', 'desc'),
    limit(params?.limit || 20)
  );

  if (params?.lastDoc) {
    q = query(q, startAfter(params.lastDoc));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
};

// Like a post
export const likePost = async (postId: string, userId: string, userName: string, groupId?: string): Promise<void> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  const likeRef = doc(db, postPath, 'likes', userId);
  
  await addDoc(collection(db, postPath, 'likes'), {
    userId,
    userName,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, postPath), {
    likesCount: increment(1)
  });
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string, groupId?: string): Promise<void> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  await deleteDoc(doc(db, postPath, 'likes', userId));
  
  await updateDoc(doc(db, postPath), {
    likesCount: increment(-1)
  });
};

// Check if user liked a post
export const checkIfLiked = async (postId: string, userId: string, groupId?: string): Promise<boolean> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  const likeDoc = await getDoc(doc(db, postPath, 'likes', userId));
  return likeDoc.exists();
};

// Add comment to post
export const addComment = async (
  postId: string,
  authorId: string,
  authorName: string,
  authorAvatar: string | undefined,
  content: string,
  groupId?: string
): Promise<string> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  
  const commentData = {
    postId,
    authorId,
    authorName,
    authorAvatar: authorAvatar || null,
    content,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, postPath, 'comments'), commentData);
  
  await updateDoc(doc(db, postPath), {
    commentsCount: increment(1)
  });

  return docRef.id;
};

// Get comments for a post
export const getComments = async (postId: string, groupId?: string): Promise<Comment[]> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  const q = query(
    collection(db, postPath, 'comments'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
};

// Delete post
export const deletePost = async (postId: string, groupId?: string): Promise<void> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  await deleteDoc(doc(db, postPath));
};

// Update post
export const updatePost = async (
  postId: string,
  content: string,
  imageUrls?: string[],
  groupId?: string
): Promise<void> => {
  const postPath = groupId ? `groups/${groupId}/posts/${postId}` : `posts/${postId}`;
  await updateDoc(doc(db, postPath), {
    content,
    imageUrls: imageUrls || [],
    updatedAt: serverTimestamp()
  });
};

