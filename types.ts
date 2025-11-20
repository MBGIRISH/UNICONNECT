export interface User {
  id: string;
  name: string;
  avatar: string;
  university: string;
  major: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp?: any; // Firestore Timestamp
  createdAt?: string; // Display string
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: 'Academic' | 'Social' | 'Sports' | 'Career' | 'Arts';
  attendees: number;
  image: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  description: string;
  seller: string;
  sellerId?: string;
  image: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: any; // Firestore Timestamp
  isAi?: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  members: number;
}