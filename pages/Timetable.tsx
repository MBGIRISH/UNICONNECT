import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, MapPin, User } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../App';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';

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
  }, [user]);

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
        // Demo mode
        const newId = `demo_${Date.now()}`;
        setClasses([...classes, { id: newId, ...newClass }]);
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
      if (db && !id.startsWith('demo')) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-0">
      <Header title="My Timetable" />

      <div className="max-w-7xl mx-auto p-4 md:py-8">
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
                    {dayClasses.map((classItem) => (
                      <div
                        key={classItem.id}
                        className="relative p-3 rounded-lg border-l-4 bg-slate-50 dark:bg-slate-700/50"
                        style={{ borderLeftColor: classItem.color }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                              {classItem.subject}
                            </h3>
                            
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
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

