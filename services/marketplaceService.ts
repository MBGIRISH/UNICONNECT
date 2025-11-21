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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MarketplaceListing, MarketplaceInquiry, SearchFilters, PaginationParams } from '../types';

// Create marketplace listing
export const createListing = async (listingData: Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'marketplace'), {
    ...listingData,
    isSold: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
};

// Get marketplace listings with filters and pagination
export const getListings = async (filters?: SearchFilters, pagination?: PaginationParams): Promise<MarketplaceListing[]> => {
  let q = query(collection(db, 'marketplace'));

  // Apply filters
  if (filters?.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters?.condition) {
    q = query(q, where('condition', '==', filters.condition));
  }

  if (filters?.minPrice !== undefined) {
    q = query(q, where('price', '>=', filters.minPrice));
  }

  if (filters?.maxPrice !== undefined) {
    q = query(q, where('price', '<=', filters.maxPrice));
  }

  // Only show unsold items by default
  q = query(q, where('isSold', '==', false));

  // Order and paginate
  q = query(q, orderBy('createdAt', 'desc'), limit(pagination?.limit || 20));

  if (pagination?.lastDoc) {
    q = query(q, startAfter(pagination.lastDoc));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceListing));
};

// Get listing by ID
export const getListingById = async (listingId: string): Promise<MarketplaceListing | null> => {
  const docSnap = await getDoc(doc(db, 'marketplace', listingId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as MarketplaceListing;
  }
  return null;
};

// Get user's listings
export const getUserListings = async (userId: string): Promise<MarketplaceListing[]> => {
  const q = query(
    collection(db, 'marketplace'),
    where('sellerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceListing));
};

// Mark listing as sold
export const markAsSold = async (listingId: string): Promise<void> => {
  await updateDoc(doc(db, 'marketplace', listingId), {
    isSold: true,
    updatedAt: serverTimestamp()
  });
};

// Update listing
export const updateListing = async (listingId: string, updates: Partial<MarketplaceListing>): Promise<void> => {
  await updateDoc(doc(db, 'marketplace', listingId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Delete listing
export const deleteListing = async (listingId: string): Promise<void> => {
  await deleteDoc(doc(db, 'marketplace', listingId));
};

// Send inquiry to seller
export const sendInquiry = async (
  listingId: string,
  buyerId: string,
  buyerName: string,
  sellerId: string,
  message: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'marketplace', listingId, 'inquiries'), {
    listingId,
    buyerId,
    buyerName,
    sellerId,
    message,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

// Get inquiries for a listing
export const getInquiries = async (listingId: string): Promise<MarketplaceInquiry[]> => {
  const q = query(
    collection(db, 'marketplace', listingId, 'inquiries'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceInquiry));
};

// Search listings
export const searchListings = async (searchTerm: string): Promise<MarketplaceListing[]> => {
  const q = query(
    collection(db, 'marketplace'),
    where('isSold', '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const allListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceListing));

  // Client-side filtering for search term (Firestore doesn't support full-text search natively)
  const searchLower = searchTerm.toLowerCase();
  return allListings.filter(listing =>
    listing.title.toLowerCase().includes(searchLower) ||
    listing.description.toLowerCase().includes(searchLower)
  );
};

