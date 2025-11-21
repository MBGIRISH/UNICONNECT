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
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Group, GroupMember, JoinRequest } from '../types';

// Create group
export const createGroup = async (
  name: string,
  description: string,
  coverImage: string | undefined,
  creatorId: string,
  creatorName: string,
  isPrivate: boolean
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'groups'), {
    name,
    description,
    coverImage: coverImage || null,
    creatorId,
    creatorName,
    isPrivate,
    memberCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Add creator as owner
  await addDoc(collection(db, `groups/${docRef.id}/members`), {
    groupId: docRef.id,
    userId: creatorId,
    userName: creatorName,
    role: 'owner',
    joinedAt: serverTimestamp()
  });

  return docRef.id;
};

// Get all public groups or user's groups
export const getGroups = async (userId?: string): Promise<Group[]> => {
  let q;
  if (userId) {
    // Get groups user is a member of
    const membersQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(membersQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  } else {
    // Get all public groups
    q = query(
      collection(db, 'groups'),
      where('isPrivate', '==', false),
      orderBy('memberCount', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  }
};

// Get group by ID
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  const docSnap = await getDoc(doc(db, 'groups', groupId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Group;
  }
  return null;
};

// Join public group
export const joinGroup = async (
  groupId: string,
  userId: string,
  userName: string,
  userAvatar?: string
): Promise<void> => {
  await addDoc(collection(db, `groups/${groupId}/members`), {
    groupId,
    userId,
    userName,
    userAvatar: userAvatar || null,
    role: 'member',
    joinedAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(1)
  });
};

// Request to join private group
export const requestJoinGroup = async (
  groupId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  message?: string
): Promise<void> => {
  await addDoc(collection(db, `groups/${groupId}/joinRequests`), {
    groupId,
    userId,
    userName,
    userAvatar: userAvatar || null,
    message: message || '',
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

// Approve join request
export const approveJoinRequest = async (groupId: string, requestId: string, userId: string, userName: string): Promise<void> => {
  // Add to members
  await joinGroup(groupId, userId, userName);

  // Update request status
  await updateDoc(doc(db, `groups/${groupId}/joinRequests`, requestId), {
    status: 'approved'
  });
};

// Get group members
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const q = query(
    collection(db, `groups/${groupId}/members`),
    orderBy('joinedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupMember));
};

// Leave group
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  const q = query(
    collection(db, `groups/${groupId}/members`),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  snapshot.forEach(async (docSnap) => {
    await deleteDoc(docSnap.ref);
  });

  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(-1)
  });
};

// Update member role
export const updateMemberRole = async (groupId: string, memberId: string, role: 'owner' | 'admin' | 'member'): Promise<void> => {
  await updateDoc(doc(db, `groups/${groupId}/members`, memberId), {
    role
  });
};

// Remove member
export const removeMember = async (groupId: string, memberId: string): Promise<void> => {
  await deleteDoc(doc(db, `groups/${groupId}/members`, memberId));
  
  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(-1)
  });
};

// Check if user is member
export const checkMembership = async (groupId: string, userId: string): Promise<GroupMember | null> => {
  const q = query(
    collection(db, `groups/${groupId}/members`),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as GroupMember;
  }
  
  return null;
};

// Delete group
export const deleteGroup = async (groupId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groups', groupId));
};

