import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, MapPin, User, Bell, X, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../App';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { addNotification } from '../services/notificationService';

interface ClassItem {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  professor: string;
  color: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];

const Timetable: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingClass, setUpcomingClass] = useState<ClassItem | null>(null);
  const [ongoingClass, setOngoingClass] = useState<ClassItem | null>(null);
  const [notifiedClasses, setNotifiedClasses] = useState<Set<string>>(new Set());
  const [lastNotificationDate, setLastNotificationDate] = useState<string>('');
  
  const [newClass, setNewClass] = useState({
    subject: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    professor: '',
    color: COLORS[0]
  });

  useEffect(() => {
    if (user) {
      loadClasses();
    }
    
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.error('Error requesting notification permission:', err);
      });
    }
  }, [user]);

  // Check for upcoming and ongoing classes every minute
  useEffect(() => {
    if (!user || classes.length === 0) return;

    const checkClassReminders = () => {
      const now = new Date();
      const currentDate = now.toDateString();
      
      // Reset notification state if it's a new day (prevents "never notify again" after midnight)
      if (lastNotificationDate !== currentDate) {
        setLastNotificationDate(currentDate);
        setNotifiedClasses(new Set());
      }
      
      const currentDay = DAYS[now.getDay() === 0 ? 5 : now.getDay() - 1]; // Sunday = Saturday index
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const todayClasses = classes.filter(c => c.day === currentDay);

      // Check for ongoing classes
      const ongoing = todayClasses.find(c => currentTime >= c.startTime && currentTime < c.endTime);
      setOngoingClass(ongoing || null);

      // Check for upcoming classes (5-10 minutes before start time)
      const upcoming = todayClasses.find(c => {
        const classStartMinutes = parseInt(c.startTime.split(':')[0]) * 60 + parseInt(c.startTime.split(':')[1]);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const diffMinutes = classStartMinutes - nowMinutes;
        
        // Notify 5-10 minutes before class starts (inclusive range)
        // This ensures notifications are sent when exactly 10, 9, 8, 7, 6, or 5 minutes remain
        return diffMinutes >= 5 && diffMinutes <= 10 && diffMinutes > 0;
      });

      if (upcoming) {
        setNotifiedClasses(prev => {
          // Check if already notified
          if (prev.has(upcoming.id)) {
            return prev;
          }
          
          // Mark as notified first to prevent duplicate notifications
          const newSet = new Set(prev);
          newSet.add(upcoming.id);
          
          setUpcomingClass(upcoming);
          
          // Calculate minutes until class
          const classStartMinutes = parseInt(upcoming.startTime.split(':')[0]) * 60 + parseInt(upcoming.startTime.split(':')[1]);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const minutesUntil = classStartMinutes - nowMinutes;
          
          // Send notification to Firestore
          if (user && db) {
            addNotification(user.uid, {
              type: 'class_reminder',
              title: 'Class Starting Soon',
              message: `${upcoming.subject} starts in ${minutesUntil} minutes at ${upcoming.startTime} in ${upcoming.location}`,
              link: '/timetable',
              createdAt: new Date()
            }).catch(err => console.error('Failed to add notification:', err));
          }

          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('📚 Class Reminder', {
                body: `${upcoming.subject} starts in ${minutesUntil} minutes\nTime: ${upcoming.startTime}\nLocation: ${upcoming.location}${upcoming.professor ? `\nProfessor: ${upcoming.professor}` : ''}`,
                tag: `class-${upcoming.id}`,
                requireInteraction: false
              });
            } catch (err) {
              console.error('Failed to show browser notification:', err);
            }
          }
          
          return newSet;
        });
      } else {
        setUpcomingClass(null);
      }
    };

    // Check immediately
    checkClassReminders();

    // Check every 30 seconds for more accurate timing (5-10 minute window)
    // This ensures we catch the notification window precisely
    const interval = setInterval(checkClassReminders, 30000);

    return () => clearInterval(interval);
  }, [classes, user, db]);

  const loadClasses = async () => {
    if (!user || !db) {
      // Demo data
      setClasses([
        {
          id: 'demo1',
          subject: 'Computer Science',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          location: 'Room 301',
          professor: 'Dr. Smith',
          color: '#6366f1'
        },
        {
          id: 'demo2',
          subject: 'Mathematics',
          day: 'Monday',
          startTime: '11:00',
          endTime: '12:30',
          location: 'Room 205',
          professor: 'Prof. Johnson',
          color: '#8b5cf6'
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'timetable'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const loadedClasses: ClassItem[] = [];
      
      snapshot.forEach((doc) => {
        loadedClasses.push({ id: doc.id, ...doc.data() } as ClassItem);
      });

      setClasses(loadedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!user) {
      alert('Please login to add classes');
      return;
    }

    if (!newClass.subject || !newClass.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (db) {
        const docRef = await addDoc(collection(db, 'timetable'), {
          ...newClass,
          userId: user.uid,
          createdAt: serverTimestamp()
        });

        setClasses([...classes, { id: docRef.id, ...newClass }]);
      } else {
        console.error('Database not available');
        alert('Cannot create class. Please check your connection.');
        return;
      }

      setShowModal(false);
      setNewClass({
        subject: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        professor: '',
        color: COLORS[0]
      });
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this class?')) return;

    try {
      if (db) {
        await deleteDoc(doc(db, 'timetable', id));
      }
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  };

  const getClassesForDay = (day: string) => {
    return classes
      .filter(c => c.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-4 md:pb-4 lg:pb-0 w-full max-w-full overflow-x-hidden">
      <Header title="My Timetable" />

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:px-6 lg:px-8 md:py-6 lg:py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Schedule</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage your class timetable</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Add Class
          </button>
        </div>

        {/* Ongoing Class Banner */}
        {ongoingClass && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm flex items-start gap-3">
            <div className="mt-0.5">
              <AlertCircle className="text-green-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 text-sm">Class in Progress</h3>
              <p className="text-green-800 text-sm mt-1">
                <strong>{ongoingClass.subject}</strong> is currently ongoing
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-green-700">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Ends at {ongoingClass.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {ongoingClass.location}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Class Banner */}
        {upcomingClass && !ongoingClass && (
          <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm flex items-start gap-3">
            <div className="mt-0.5">
              <Bell className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-sm">Class Starting Soon</h3>
              <p className="text-amber-800 text-sm mt-1">
                <strong>{upcomingClass.subject}</strong> starts in less than 15 minutes
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-amber-700">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {upcomingClass.startTime} - {upcomingClass.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {upcomingClass.location}
                </span>
                {upcomingClass.professor && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {upcomingClass.professor}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setUpcomingClass(null)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Timetable Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const dayClasses = getClassesForDay(day);

            return (
              <div key={day} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                  {day}
                </h2>

                {dayClasses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                    No classes scheduled
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayClasses.map((classItem) => {
                      const isOngoing = ongoingClass?.id === classItem.id;
                      const isUpcoming = upcomingClass?.id === classItem.id;

                      return (
                        <div
                          key={classItem.id}
                          className={`relative p-3 rounded-lg border-l-4 ${
                            isOngoing
                              ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500'
                              : isUpcoming
                              ? 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500'
                              : 'bg-slate-50 dark:bg-slate-700/50'
                          }`}
                          style={{ borderLeftColor: classItem.color }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {classItem.subject}
                                </h3>
                                {isOngoing && (
                                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    Live
                                  </span>
                                )}
                                {isUpcoming && !isOngoing && (
                                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">
                                    Soon
                                  </span>
                                )}
                              </div>
                            
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <Clock size={12} />
                                {classItem.startTime} - {classItem.endTime}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <MapPin size={12} />
                                {classItem.location}
                              </div>

                              {classItem.professor && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                  <User size={12} />
                                  {classItem.professor}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteClass(classItem.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add New Class</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                <select
                  value={newClass.day}
                  onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newClass.startTime}
                    onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={newClass.location}
                  onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., Room 301"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Professor
                </label>
                <input
                  type="text"
                  value={newClass.professor}
                  onChange={(e) => setNewClass({ ...newClass, professor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewClass({ ...newClass, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newClass.color === color ? 'border-slate-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;

