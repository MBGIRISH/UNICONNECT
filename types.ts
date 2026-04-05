import { Timestamp } from 'firebase/firestore';

// ============================================================================
// USER TYPES
// ============================================================================
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  backgroundImage?: string; // Profile background/banner image
  bio?: string;
  college?: string; // User's college/university
  location?: string;
  latitude?: number; // User's location coordinates
  longitude?: number;
  city?: string; // User's city
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
  authorCollege?: string; // NEW: Author's college
  college?: string; // College field for filtering (matches user's college)
  content: string;
  imageUrls?: string[];
  mediaItems?: {
    type: 'image' | 'gif';
    url: string;
  }[];
  groupId?: string; // If posted in a group
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  // New features
  emoji?: string; // Selected emoji
  gifUrl?: string; // GIF URL from Giphy
  poll?: {
    question: string;
    options: string[];
    votes?: { [optionIndex: string]: number }; // Total votes per option
    userVotes?: { [optionIndex: string]: string[] }; // Array of user IDs who voted for each option
  };
  tags?: string[]; // Hashtags or tags
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  attachments?: {
    name: string;
    url: string;
    type: string; // 'pdf', 'doc', 'image', etc.
  }[];
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
  college?: string; // College where event is hosted
  latitude?: number; // Location coordinates for distance calculation
  longitude?: number;
  city?: string; // City name for display
  address?: string; // Full address from Google Maps
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

export interface StudyGroup extends Group {
  subject?: string;
  college?: string; // College field for filtering (matches user's college)
}

export interface ChatMessage {
  id?: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  stickerUrl?: string; // GIF/Sticker URL from GIPHY
  poll?: {
    question: string;
    options: string[];
    votes?: { [optionIndex: string]: number };
    userVotes?: { [optionIndex: string]: string[] };
  };
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: Timestamp | Date;
  isAi?: boolean;
  createdAt?: Timestamp | Date;
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
  college?: string; // College field for filtering (matches user's college)
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
  | 'follow'
  | 'class_reminder';

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
