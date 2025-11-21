import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, X, Loader2, Upload } from 'lucide-react';
import { Event } from '../types';
import Header from '../components/Header';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { uploadEventCover } from '../services/cloudinaryService';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  // Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    category: 'Academic',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  });

  const fetchEvents = async (category?: string) => {
    setLoading(true);
    try {
        if (!db) throw new Error("DB unavailable");
        
        let q;
        if (category && category !== 'All') {
          q = query(collection(db, "events"), where("category", "==", category));
        } else {
          q = collection(db, "events");
        }
        
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
        
        if (fetchedEvents.length > 0) {
            setEvents(fetchedEvents);
        } else {
            throw new Error("No events");
        }
    } catch (err) {
        // Fallback mock data
        setEvents([
            {
              id: '1',
              title: 'Campus Tech Hackathon 2024',
              date: 'NOV 25',
              time: '9:00 AM',
              location: 'Engineering Building, Hall A',
              organizer: 'CS Society',
              category: 'Academic',
              attendees: 142,
              image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            },
            {
              id: '2',
              title: 'Annual Sports Day',
              date: 'DEC 05',
              time: '8:00 AM',
              location: 'University Stadium',
              organizer: 'Sports Club',
              category: 'Sports',
              attendees: 320,
              image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'
            },
            {
              id: '3',
              title: 'Career Fair 2024',
              date: 'DEC 10',
              time: '10:00 AM',
              location: 'Main Auditorium',
              organizer: 'Career Services',
              category: 'Career',
              attendees: 250,
              image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800'
            }
        ]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    loadUserInterests();
  }, []);

  const loadUserInterests = async () => {
    if (!user || !db) return;
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const interested = new Set<string>();
      
      for (const eventDoc of eventsSnapshot.docs) {
        const attendeeDoc = await getDoc(doc(db, 'events', eventDoc.id, 'attendees', user.uid));
        if (attendeeDoc.exists()) {
          interested.add(eventDoc.id);
        }
      }
      
      setInterestedEvents(interested);
    } catch (error) {
      console.error('Error loading interests:', error);
    }
  };

  const handleToggleInterest = async (eventId: string) => {
    if (!user || !db) {
      alert('Please log in to RSVP');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      // Check if event exists in Firestore
      if (!eventSnap.exists()) {
        // This is a demo event, just update local state
        const isInterested = interestedEvents.has(eventId);
        
        if (isInterested) {
          setInterestedEvents(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, attendees: (e.attendees || 1) - 1 } : e
          ));
          alert('RSVP cancelled (Demo mode)');
        } else {
          setInterestedEvents(prev => new Set(prev).add(eventId));
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1 } : e
          ));
          alert('RSVP confirmed! 🎉 (Demo mode)');
        }
        return;
      }

      // Event exists in Firestore - do real RSVP
      const attendeeRef = doc(db, 'events', eventId, 'attendees', user.uid);
      const isInterested = interestedEvents.has(eventId);

      if (isInterested) {
        // Remove interest (cancel RSVP)
        await deleteDoc(attendeeRef);
        await updateDoc(eventRef, {
          attendees: increment(-1)
        });
        
        setInterestedEvents(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        
        // Update local state
        setEvents(prev => prev.map(e => 
          e.id === eventId ? { ...e, attendees: (e.attendees || 1) - 1 } : e
        ));
        
        alert('RSVP cancelled');
      } else {
        // Add interest (RSVP)
        await setDoc(attendeeRef, {
          userId: user.uid,
          userName: user.displayName || 'Student',
          userAvatar: user.photoURL || null,
          joinedAt: new Date()
        });
        
        await updateDoc(eventRef, {
          attendees: increment(1)
        });
        
        setInterestedEvents(prev => new Set(prev).add(eventId));
        
        // Update local state
        setEvents(prev => prev.map(e => 
          e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1 } : e
        ));
        
        alert('RSVP confirmed! 🎉');
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      alert('Failed to update RSVP. Please try again.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please log in to create events");
      setShowModal(false);
      return;
    }

    if (!db) {
      alert("Database not available. Please check your Firebase configuration.");
      return;
    }

    setUploading(true);
    try {
        let coverImageUrl = newEvent.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
        
        // Upload image to Cloudinary if present
        if (imageFile) {
          console.log('Uploading image to Cloudinary...');
          const eventId = `temp_${Date.now()}`;
          try {
            coverImageUrl = await uploadEventCover(eventId, imageFile);
            console.log('Image uploaded successfully:', coverImageUrl);
          } catch (uploadError: any) {
            console.error('Cloudinary upload error:', uploadError);
            alert(`Failed to upload image: ${uploadError.message}. Creating event without image.`);
            // Continue with default image
          }
        }

        console.log('Creating event in Firestore...');
        await addDoc(collection(db, "events"), {
            ...newEvent,
            image: coverImageUrl,
            organizer: user.displayName || 'Student',
            attendees: 1,
        });
        
        console.log('Event created successfully!');
        setShowModal(false);
        setImageFile(null);
        setImagePreview('');
        setNewEvent({
          category: 'Academic',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
        });
        fetchEvents(selectedCategory);
        alert('Event created successfully! 🎉');
    } catch (error: any) {
        console.error('Error creating event:', error);
        let errorMessage = 'Failed to create event. ';
        
        if (error.code === 'permission-denied') {
          errorMessage += 'You do not have permission. Please make sure you are logged in.';
        } else if (error.message) {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 relative">
      <Header title="Events Hub" />
      
      <div className="max-w-3xl mx-auto p-4">
        {/* Top Actions */}
        <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 mr-2">
                {['All', 'Academic', 'Social', 'Sports', 'Career', 'Arts'].map((cat) => (
                    <button 
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchEvents(cat);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                        ? 'bg-slate-800 text-white' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                    >
                    {cat}
                    </button>
                ))}
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
                <Plus size={24} />
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
            <div className="space-y-4">
            {events.map(event => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow cursor-pointer">
                <div className="sm:w-48 h-48 sm:h-auto relative">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center shadow-sm">
                    <span className="block text-xs font-bold text-red-500 uppercase">{event.date.split(' ')[0] || 'NOV'}</span>
                    <span className="block text-lg font-bold text-slate-900 leading-none">{event.date.split(' ')[1] || '01'}</span>
                    </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                        {event.category}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{event.title}</h3>
                    <div className="space-y-1.5">
                        <div className="flex items-center text-slate-500 text-sm">
                        <Clock size={16} className="mr-2 text-slate-400" />
                        {event.time}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm">
                        <MapPin size={16} className="mr-2 text-slate-400" />
                        {event.location}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm">
                        <Users size={16} className="mr-2 text-slate-400" />
                        {event.attendees} going
                        </div>
                    </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500">By {event.organizer}</span>
                    <button 
                      onClick={() => handleToggleInterest(event.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        interestedEvents.has(event.id)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {interestedEvents.has(event.id) ? '✓ Going' : 'Interested'}
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">Create Event</h2>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date (e.g. NOV 15)</label>
                            <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                                onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <input required type="time" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                                onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" 
                            onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select 
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                          value={newEvent.category}
                          onChange={e => setNewEvent({...newEvent, category: e.target.value as any})}
                        >
                            <option value="Academic">Academic</option>
                            <option value="Social">Social</option>
                            <option value="Sports">Sports</option>
                            <option value="Career">Career</option>
                            <option value="Arts">Arts</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Cover Image</label>
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                            <button 
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview('');
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary cursor-pointer flex flex-col items-center gap-2 transition-colors">
                            <Upload size={32} className="text-slate-400" />
                            <span className="text-sm text-slate-600">Click to upload cover image</span>
                            <span className="text-xs text-slate-400">(Optional)</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                    </div>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Event'
                      )}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Events;