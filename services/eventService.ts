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
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Event, EventAttendee } from '../types';

// Create event
export const createEvent = async (eventData: Omit<Event, 'id' | 'attendeeCount' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'events'), {
    ...eventData,
    attendeeCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Add host as attendee
  await addDoc(collection(db, `events/${docRef.id}/attendees`), {
    eventId: docRef.id,
    userId: eventData.hostId,
    userName: eventData.hostName,
    role: 'host',
    joinedAt: serverTimestamp(),
    status: 'going'
  });

  return docRef.id;
};

// Get all events
export const getEvents = async (): Promise<Event[]> => {
  const q = query(collection(db, 'events'), orderBy('startTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
};

// Get event by ID
export const getEventById = async (eventId: string): Promise<Event | null> => {
  const docSnap = await getDoc(doc(db, 'events', eventId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Event;
  }
  return null;
};

// RSVP to event
export const rsvpToEvent = async (
  eventId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  status: 'going' | 'interested' | 'not-going'
): Promise<void> => {
  // Check if already RSVP'd
  const attendeeRef = doc(db, `events/${eventId}/attendees`, userId);
  const attendeeSnap = await getDoc(attendeeRef);

  if (attendeeSnap.exists()) {
    // Update status
    await updateDoc(attendeeRef, { status, updatedAt: serverTimestamp() });
  } else {
    // Add new RSVP
    await addDoc(collection(db, `events/${eventId}/attendees`), {
      eventId,
      userId,
      userName,
      userAvatar: userAvatar || null,
      role: 'attendee',
      joinedAt: serverTimestamp(),
      status
    });

    // Increment attendee count
    if (status === 'going') {
      await updateDoc(doc(db, 'events', eventId), {
        attendeeCount: increment(1)
      });
    }
  }
};

// Remove RSVP
export const removeRSVP = async (eventId: string, userId: string): Promise<void> => {
  await deleteDoc(doc(db, `events/${eventId}/attendees`, userId));
  
  await updateDoc(doc(db, 'events', eventId), {
    attendeeCount: increment(-1)
  });
};

// Get event attendees
export const getEventAttendees = async (eventId: string): Promise<EventAttendee[]> => {
  const q = query(collection(db, `events/${eventId}/attendees`), orderBy('joinedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventAttendee));
};

// Update event
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  await updateDoc(doc(db, 'events', eventId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Delete event
export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(db, 'events', eventId));
};

// Check if user is attending
export const checkIfAttending = async (eventId: string, userId: string): Promise<EventAttendee | null> => {
  const attendeeDoc = await getDoc(doc(db, `events/${eventId}/attendees`, userId));
  if (attendeeDoc.exists()) {
    return { id: attendeeDoc.id, ...attendeeDoc.data() } as EventAttendee;
  }
  return null;
};

