import { Timestamp } from 'firebase/firestore';

// ============================================================================
// USER TYPES
// ============================================================================
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  isOnline?: boolean;
  lastSeen?: Timestamp | Date;
}

// ============================================================================
// POST TYPES
// ============================================================================
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrls?: string[];
  groupId?: string; // If posted in a group
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Like {
  id: string;
  userId: string;
  userName: string;
  createdAt: Timestamp | Date;
}

// ============================================================================
// EVENT TYPES
// ============================================================================
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  hostId: string;
  hostName: string;
  coverImage?: string;
  capacity?: number;
  attendeeCount: number;
  category?: 'Academic' | 'Social' | 'Sports' | 'Career' | 'Arts' | 'Other';
  isPublic: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'host' | 'attendee';
  joinedAt: Timestamp | Date;
  status: 'going' | 'interested' | 'not-going';
}

// ============================================================================
// GROUP TYPES
// ============================================================================
export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  creatorId: string;
  creatorName: string;
  isPrivate: boolean;
  memberCount: number;
  category?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Timestamp | Date;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================
export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  category: 'Books' | 'Electronics' | 'Furniture' | 'Clothing' | 'Sports' | 'Other';
  isSold: boolean;
  location?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface MarketplaceInquiry {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  message: string;
  createdAt: Timestamp | Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================
export type NotificationType = 
  | 'comment'
  | 'like'
  | 'group_invite'
  | 'group_request'
  | 'event_invite'
  | 'event_update'
  | 'marketplace_inquiry'
  | 'follow';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  imageUrl?: string;
  fromUserId?: string;
  fromUserName?: string;
  read: boolean;
  createdAt: Timestamp | Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================
export interface PaginationParams {
  limit: number;
  lastDoc?: any;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  searchTerm?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}
