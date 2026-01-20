import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Users, Plus, X, Loader2, Upload, GraduationCap, Map, Filter, Navigation } from 'lucide-react';
import { Event } from '../types';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { uploadEventCover } from '../services/cloudinaryService';
import { getEventDistance, formatDistance, getCityCoordinates, getUserLocation, parseLocationInput, getGoogleMapsUrl } from '../services/locationService';
import { getUserProfile } from '../services/profileService';
import EventMap from '../components/EventMap';
import TimePicker12h from '../components/TimePicker12h';

// Comprehensive colleges list - ALL IITs, NITs, and Karnataka Engineering Colleges
const POPULAR_COLLEGES = [
  // === ALL IITs (23) ===
  'IIT Bombay',
  'IIT Delhi',
  'IIT Madras',
  'IIT Kanpur',
  'IIT Kharagpur',
  'IIT Roorkee',
  'IIT Guwahati',
  'IIT Hyderabad',
  'IIT Indore',
  'IIT Bhubaneswar',
  'IIT Gandhinagar',
  'IIT Patna',
  'IIT Ropar',
  'IIT Mandi',
  'IIT (BHU) Varanasi',
  'IIT Jodhpur',
  'IIT Bhilai',
  'IIT Goa',
  'IIT Jammu',
  'IIT Dharwad',
  'IIT Palakkad',
  'IIT Tirupati',
  'IIT (ISM) Dhanbad',
  
  // === ALL NITs (31) ===
  'NIT Trichy (Tiruchirappalli)',
  'NIT Surathkal (Karnataka)',
  'NIT Warangal',
  'NIT Calicut',
  'NIT Rourkela',
  'NIT Durgapur',
  'NIT Jaipur',
  'NIT Kurukshetra',
  'NIT Nagpur',
  'NIT Silchar',
  'NIT Hamirpur',
  'NIT Jalandhar',
  'NIT Raipur',
  'NIT Allahabad (Prayagraj)',
  'NIT Bhopal',
  'NIT Jamshedpur',
  'NIT Patna',
  'NIT Surat',
  'NIT Agartala',
  'NIT Arunachal Pradesh',
  'NIT Delhi',
  'NIT Goa',
  'NIT Manipur',
  'NIT Meghalaya',
  'NIT Mizoram',
  'NIT Nagaland',
  'NIT Puducherry',
  'NIT Sikkim',
  'NIT Srinagar',
  'NIT Uttarakhand',
  'NIT Andhra Pradesh',
  
  // === KARNATAKA ENGINEERING COLLEGES ===
  'RV College of Engineering (RVCE), Bangalore',
  'BMS College of Engineering, Bangalore',
  'MS Ramaiah Institute of Technology, Bangalore',
  'PES University, Bangalore',
  'Dayananda Sagar College of Engineering, Bangalore',
  'BMS Institute of Technology, Bangalore',
  'Sir M Visvesvaraya Institute of Technology (MVIT), Bangalore',
  'Bangalore Institute of Technology (BIT)',
  'JSS Science and Technology University, Mysore',
  'Manipal Institute of Technology, Manipal',
  'NMAM Institute of Technology, Nitte',
  'KLE Technological University, Hubballi',
  'Nitte Meenakshi Institute of Technology, Bangalore',
  'CMR Institute of Technology, Bangalore',
  'New Horizon College of Engineering, Bangalore',
  'Acharya Institute of Technology, Bangalore',
  'Oxford College of Engineering, Bangalore',
  'SJB Institute of Technology, Bangalore',
  'RNS Institute of Technology, Bangalore',
  'Global Academy of Technology, Bangalore',
  'REVA University, Bangalore',
  'Jain University, Bangalore',
  'Christ University, Bangalore',
  'NIE Institute of Technology, Mysore',
  'Siddaganga Institute of Technology, Tumkur',
  'Gogte Institute of Technology, Belgaum',
  'SDM College of Engineering and Technology, Dharwad',
  'Basaveshwar Engineering College, Bagalkot',
  'KLS Vishwanathrao Deshpande Rural Institute, Haliyal',
  'Sahyadri College of Engineering, Mangalore',
  
  // === OTHER PREMIER INSTITUTES ===
  'BITS Pilani',
  'BITS Goa',
  'BITS Hyderabad',
  'IIIT Bangalore',
  'IIIT Hyderabad',
  'IIIT Allahabad',
  'VIT Vellore',
  'VIT Chennai',
  'VIT Bhopal',
  'VIT Andhra Pradesh',
  'SRM Institute of Science and Technology, Chennai',
  'Amity University',
  'Thapar Institute of Engineering and Technology',
  'Delhi Technological University (DTU)',
  'Netaji Subhas University of Technology (NSUT), Delhi',
  'Anna University, Chennai',
  'PSG College of Technology, Coimbatore',
  'Jadavpur University, Kolkata',
  'College of Engineering Pune (COEP)',
  'Veermata Jijabai Technological Institute (VJTI), Mumbai',
  
  // === CUSTOM OPTION ===
  'Other (Enter Your College)'
];

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
  
  // Location & Filter State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [userCollege, setUserCollege] = useState<string>('');
  const [showMyCollegeOnly, setShowMyCollegeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');
  const [showMapView, setShowMapView] = useState(false);
  const [eventsWithDistance, setEventsWithDistance] = useState<Array<Event & { distance?: number; distanceText?: string }>>([]);
  
  // Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    category: 'Academic',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  });
  const [eventCity, setEventCity] = useState('');
  const [registrationFormLink, setRegistrationFormLink] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchEvents = async (category?: string) => {
    setLoading(true);
    try {
        if (!db || !user) throw new Error("DB unavailable or user not logged in");
        
        // Get user's college from profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userCollege = userDoc.exists() ? userDoc.data()?.college : null;

        if (!userCollege) {
          console.warn('User college not found. Please complete your profile.');
          setEvents([]);
          setLoading(false);
          return;
        }

        // Ensure db is valid before creating query
        if (!db) {
          console.error('Firestore db is not initialized');
          setEvents([]);
          setLoading(false);
          return;
        }

        // Filter events by user's college
        const eventsRef = collection(db, "events");
        let q;
        if (category && category !== 'All') {
          q = query(
            eventsRef,
            where("college", "==", userCollege),
            where("category", "==", category)
          );
        } else {
          q = query(
            eventsRef,
            where("college", "==", userCollege)
          );
        }
        
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
        
        setEvents(fetchedEvents);
    } catch (err) {
        // No fallback mock data - only show real events from Firestore
        setEvents([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    loadUserInterests();
    loadUserLocationAndCollege();
  }, [user]);

  // Load user's location and college
  const loadUserLocationAndCollege = async () => {
    if (!user) return;
    
    try {
      // Get user profile to find college and city
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserCollege(profile.college || '');
        setUserCity(profile.city || profile.location || '');
        
        // Try to get coordinates from city
        if (profile.city || profile.location) {
          const cityCoords = getCityCoordinates(profile.city || profile.location || '');
          if (cityCoords) {
            setUserLocation(cityCoords);
          }
        }
        
        // If user has saved coordinates, use them
        if (profile.latitude && profile.longitude) {
          setUserLocation({ lat: profile.latitude, lon: profile.longitude });
        }
      }
      
      // Try to get current location from browser
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.log('Could not get browser location:', error);
        // Continue with city-based location
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  // Calculate distances for all events
  useEffect(() => {
    if (events.length > 0) {
      const eventsWithDist = events.map(event => {
        // Try to calculate distance if user has location
        let distance: number | null = null;
        if (userLocation || userCity) {
          distance = getEventDistance(
            userLocation?.lat,
            userLocation?.lon,
            event.latitude,
            event.longitude,
            userCity,
            event.city
          );
        }
        
        return {
          ...event,
          distance: distance || undefined,
          distanceText: distance !== null ? formatDistance(distance) : undefined
        };
      });
      
      // Sort by distance if sortBy is 'distance'
      if (sortBy === 'distance') {
        eventsWithDist.sort((a, b) => {
          if (!a.distance && !b.distance) return 0;
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        });
      }
      
      setEventsWithDistance(eventsWithDist);
    } else {
      setEventsWithDistance([]);
    }
  }, [events, userLocation, userCity, sortBy]);

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
        alert('Event not found. It may have been deleted.');
        // Remove from local state
        setEvents(prev => prev.filter(e => e.id !== eventId));
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
        
        setSuccessMessage('RSVP cancelled');
        setShowSuccessModal(true);
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
        
        setSuccessMessage('RSVP confirmed! 🎉');
        setShowSuccessModal(true);
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
        // Get user's college from profile (required)
        let userCollege = '';
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            userCollege = userDoc.data()?.college || '';
          }
        } catch (error) {
          console.error('Error fetching user college:', error);
        }

        if (!userCollege) {
          throw new Error('Please complete your profile with your college information before creating events.');
        }

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

        // Use user's college from profile (not from form)
        const finalCollege = userCollege;

        // Parse location input (can be city name, coordinates, or Google Maps URL)
        let eventLat: number | undefined;
        let eventLon: number | undefined;
        let parsedCity: string | undefined;
        let parsedAddress: string | undefined;
        let googleMapsUrl: string | undefined;
        
        if (eventCity) {
          // Check if it's a Google Maps URL
          const trimmed = eventCity.trim();
          if (trimmed.includes('maps.google.com') || trimmed.includes('google.com/maps') || 
              trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
            googleMapsUrl = trimmed;
          }
          
          const parsed = await parseLocationInput(eventCity);
          if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
            eventLat = parsed.latitude;
            eventLon = parsed.longitude;
          }
          if (parsed.city) {
            parsedCity = parsed.city;
          }
          if (parsed.address) {
            parsedAddress = parsed.address;
          }
        }

        console.log('Creating event in Firestore...');
        
        // Build event data object, only including defined values
        const eventData: any = {
            ...newEvent,
            college: finalCollege, // Always use user's college from profile
            image: coverImageUrl,
            organizer: user.displayName || 'Student',
            attendees: 1,
        };
        
        // Add registration form link if provided
        if (registrationFormLink && registrationFormLink.trim()) {
          eventData.registrationFormLink = registrationFormLink.trim();
        }
        
        // Only add location fields if they have values
        if (parsedCity || eventCity) {
          eventData.city = parsedCity || eventCity;
        }
        if (parsedAddress) {
          eventData.address = parsedAddress;
        }
        // Store Google Maps URL if detected (for short URLs that can't be parsed)
        if (googleMapsUrl) {
          eventData.googleMapsUrl = googleMapsUrl;
        }
        if (eventLat !== undefined && eventLon !== undefined) {
          eventData.latitude = eventLat;
          eventData.longitude = eventLon;
        }
        
        const eventsRef = collection(db, "events");
        await addDoc(eventsRef, eventData);
        
        console.log('Event created successfully!');
        setShowModal(false);
        setImageFile(null);
        setImagePreview('');
        setEventCity('');
        setRegistrationFormLink('');
        setNewEvent({
            category: 'Academic',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
        });
        fetchEvents(selectedCategory);
        fetchEvents(selectedCategory);
        setSuccessMessage('Event created successfully! 🎉');
        setShowSuccessModal(true);
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
    <div className="min-h-screen bg-slate-50 pb-4 md:pb-4 lg:pb-0 relative w-full max-w-full overflow-x-hidden">
      <Header title="Events Hub" />
      
      <div className="max-w-3xl mx-auto p-3 sm:p-4 md:px-6 lg:px-8 w-full">
        {/* Top Actions */}
        <div className="flex justify-between items-center mb-4 gap-2">
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1 mr-1 min-w-0">
                {['All', 'Academic', 'Social', 'Sports', 'Career', 'Arts'].map((cat) => (
                    <button 
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchEvents(cat);
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors touch-manipulation flex-shrink-0 ${
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
                className="bg-primary text-white p-2 sm:p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors touch-manipulation flex-shrink-0"
                aria-label="Create Event"
            >
                <Plus size={20} className="sm:w-6 sm:h-6" />
            </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Filter size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline">Filters:</span>
          </div>
          
          {userCollege && (
            <button
              onClick={() => setShowMyCollegeOnly(!showMyCollegeOnly)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                showMyCollegeOnly
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🎓 My College
            </button>
          )}
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'distance')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 touch-manipulation"
          >
            <option value="date">Sort by Date</option>
            <option value="distance">Sort by Distance</option>
          </select>
          
          <button
            onClick={() => setShowMapView(!showMapView)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation whitespace-nowrap ${
              showMapView
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Map size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{showMapView ? 'List View' : 'Map View'}</span>
            <span className="sm:hidden">{showMapView ? 'List' : 'Map'}</span>
          </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
            <>
            {showMapView ? (
              <EventMap
                events={showMyCollegeOnly && userCollege
                  ? eventsWithDistance.filter(e => e.college === userCollege)
                  : eventsWithDistance
                }
                userLocation={userLocation}
                onEventClick={(event) => {
                  // Scroll to event or show details
                  console.log('Event clicked:', event);
                }}
              />
            ) : (
            <div className="space-y-4">
            {(showMyCollegeOnly && userCollege
              ? eventsWithDistance.filter(e => e.college === userCollege)
              : eventsWithDistance
            ).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No events yet</h3>
                <p className="text-slate-500 mb-6">Be the first to create an event!</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Create Event
                </button>
              </div>
            ) : (
            (showMyCollegeOnly && userCollege
              ? eventsWithDistance.filter(e => e.college === userCollege)
              : eventsWithDistance
            ).map(event => {
              const eventWithDist = event as Event & { distance?: number; distanceText?: string };
              return (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow cursor-pointer w-full max-w-full">
                <div className="w-full md:w-48 h-48 md:h-auto relative flex-shrink-0">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-center shadow-sm">
                    <span className="block text-[10px] sm:text-xs font-bold text-red-500 uppercase">{event.date.split(' ')[0] || 'NOV'}</span>
                    <span className="block text-base sm:text-lg font-bold text-slate-900 leading-none">{event.date.split(' ')[1] || '01'}</span>
                    </div>
                </div>
                
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                        {event.category}
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{event.title}</h3>
                    <div className="space-y-1.5">
                        {eventWithDist.college && (
                          <div className="flex items-center text-indigo-600 text-sm font-medium">
                            <GraduationCap size={16} className="mr-2" />
                            {eventWithDist.college}
                            {showMyCollegeOnly && eventWithDist.college === userCollege && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Your College</span>
                            )}
                          </div>
                        )}
                        {eventWithDist.distanceText && (
                          <div className="flex items-center text-primary text-sm font-medium">
                            <Navigation size={16} className="mr-2" />
                            {eventWithDist.distanceText}
                          </div>
                        )}
                        <div className="flex items-center text-slate-500 text-sm">
                        <Clock size={16} className="mr-2 text-slate-400" />
                        {eventWithDist.time}
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-slate-400" />
                            {eventWithDist.location}
                          </div>
                          {(() => {
                            // Show button if coordinates exist OR if there's a Google Maps URL
                            const hasCoordinates = eventWithDist.latitude !== undefined && eventWithDist.longitude !== undefined;
                            const hasGoogleMapsUrl = (eventWithDist as any).googleMapsUrl || 
                                                     (eventWithDist.location && (
                                                       eventWithDist.location.includes('maps.google.com') ||
                                                       eventWithDist.location.includes('google.com/maps') ||
                                                       eventWithDist.location.includes('maps.app.goo.gl') ||
                                                       eventWithDist.location.includes('goo.gl/maps')
                                                     ));
                            
                            if (hasCoordinates || hasGoogleMapsUrl) {
                              let mapsUrl: string;
                              if (hasCoordinates) {
                                mapsUrl = getGoogleMapsUrl(eventWithDist.latitude, eventWithDist.longitude, eventWithDist.location);
                              } else {
                                // Use the Google Maps URL directly
                                mapsUrl = (eventWithDist as any).googleMapsUrl || eventWithDist.location;
                              }
                              
                              return (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                >
                                  <Map size={12} />
                                  Open in Maps
                                </a>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm">
                        <Users size={16} className="mr-2 text-slate-400" />
                        {eventWithDist.attendees || eventWithDist.attendeeCount || 0} going
                        </div>
                    </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">By {eventWithDist.organizer || eventWithDist.hostName || 'Organizer'}</span>
                        <button 
                          onClick={() => handleToggleInterest(eventWithDist.id)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            interestedEvents.has(eventWithDist.id)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {interestedEvents.has(eventWithDist.id) ? '✓ Going' : 'Interested'}
                        </button>
                      </div>
                      {(eventWithDist as any).registrationFormLink && (
                        <a
                          href={(eventWithDist as any).registrationFormLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center flex items-center justify-center gap-2"
                        >
                          <Calendar size={16} />
                          Register for Event
                        </a>
                      )}
                    </div>
                </div>
                </div>
              );
            })
            )}
            </div>
            )}
            </>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 safe-top safe-bottom">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Create Event</h2>
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        setEventCity('');
                        setImageFile(null);
                        setImagePreview('');
                        setRegistrationFormLink('');
                      }} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={24}/>
                    </button>
                </div>
                <form onSubmit={handleCreateEvent} className="p-4 sm:p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation" 
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date (e.g. NOV 15)</label>
                            <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation" 
                                onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                        </div>
                        <div>
                            <TimePicker12h
                              label="Time"
                              value={(newEvent.time as string) || '09:00'}
                              onChange={(val) => setNewEvent({ ...newEvent, time: val })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation" 
                            onChange={e => setNewEvent({...newEvent, location: e.target.value})} 
                            placeholder="e.g., Main Auditorium, Room 101" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City or Google Maps Link</label>
                        <input 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation" 
                            value={eventCity}
                            onChange={e => setEventCity(e.target.value)}
                            placeholder="e.g., Bangalore, Mumbai, Delhi OR https://maps.app.goo.gl/..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Enter city name or paste Google Maps link to auto-extract location
                        </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
                      <p className="font-medium mb-1">🎓 College</p>
                      <p className="text-xs text-indigo-700">Events will be automatically associated with your college from your profile.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select 
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Registration Form Link <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                        </label>
                        <input 
                          type="url"
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-base" 
                          value={registrationFormLink}
                          onChange={e => setRegistrationFormLink(e.target.value)}
                          placeholder="https://forms.google.com/..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Add a link to Google Forms, Typeform, or any registration form
                        </p>
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
                      className="w-full py-3 sm:py-3.5 bg-primary text-white font-bold rounded-xl mt-4 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
    </div>
  );
};

export default Events;