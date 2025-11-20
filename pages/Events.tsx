import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, X, Loader2 } from 'lucide-react';
import { Event } from '../types';
import Header from '../components/Header';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    category: 'Social',
    image: 'https://picsum.photos/seed/event/800/400'
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
        if (!db) throw new Error("DB unavailable");
        const querySnapshot = await getDocs(collection(db, "events"));
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
            date: 'OCT 15',
            time: '9:00 AM',
            location: 'Engineering Building, Hall A',
            organizer: 'CS Society',
            category: 'Academic',
            attendees: 142,
            image: 'https://picsum.photos/seed/hack/800/400'
            }
        ]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login required");

    try {
        if (!db) throw new Error("DB unavailable");
        await addDoc(collection(db, "events"), {
            ...newEvent,
            organizer: user.displayName || 'Student',
            attendees: 1,
        });
        setShowModal(false);
        fetchEvents();
    } catch (error) {
        console.error(error);
        // Optimistic update for Demo
        setEvents([...events, { ...newEvent, id: 'demo', organizer: user.displayName, attendees: 1 } as Event]);
        setShowModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 relative">
      <Header title="Events Hub" />
      
      <div className="max-w-3xl mx-auto p-4">
        {/* Top Actions */}
        <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 mr-2">
                {['All', 'Academic', 'Social', 'Sports', 'Career', 'Arts'].map((cat, i) => (
                    <button 
                    key={cat}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        i === 0 
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
                    <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        Interested
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
                        <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                             onChange={e => setNewEvent({...newEvent, category: e.target.value as any})}>
                            <option>Academic</option>
                            <option>Social</option>
                            <option>Sports</option>
                            <option>Career</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4">Create Event</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Events;