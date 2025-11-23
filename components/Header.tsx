import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, X, MessageCircle, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, limit, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Notification } from '../types';

interface HeaderProps {
  title: string;
  showSearchBar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showSearchBar = false }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for unread messages
  useEffect(() => {
    if (!currentUser || !db) return;

    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessageUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for notifications
  useEffect(() => {
    if (!currentUser || !db) return;

    const q = query(
      collection(db, `users/${currentUser.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      setNotifications(notifs);
      setNotificationUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && currentUser) {
      await updateDoc(doc(db, `users/${currentUser.uid}/notifications`, notification.id), {
        read: true
      });
    }
    
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    const updatePromises = unreadNotifications.map(n => 
      updateDoc(doc(db, `users/${currentUser.uid}/notifications`, n.id), { read: true })
    );
    
    await Promise.all(updatePromises);
  };

  const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    await deleteDoc(doc(db, `users/${currentUser.uid}/notifications`, notificationId));
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setSearching(true);
      try {
        if (!db) {
          // Demo data
          setSearchResults([
            { uid: 'demo1', displayName: 'John Doe', photoURL: 'https://ui-avatars.com/api/?name=John+Doe' },
            { uid: 'demo2', displayName: 'Jane Smith', photoURL: 'https://ui-avatars.com/api/?name=Jane+Smith' }
          ].filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase())));
          return;
        }

        const q = query(
          collection(db, 'users'),
          where('displayName', '>=', searchQuery),
          where('displayName', '<=', searchQuery + '\uf8ff'),
          limit(10)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        setSearchResults(users);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleUserClick = (userId: string) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(`/profile/${userId}`);
  };

  const handleMessageClick = (userId: string, userName: string) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate('/messages', { state: { userId, userName } });
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <div className="flex items-center gap-3">
          {showSearchBar && (
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <Search size={20} />
            </button>
          )}
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
          >
            <MessageCircle size={20} />
            {messageUnreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
              </span>
            )}
          </button>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full relative ${showNotifications ? 'bg-slate-100 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Bell size={20} />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {notificationUnreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsRead}
                      className="text-xs text-primary hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Check size={12} />
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="overflow-y-auto flex-1">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 ${
                          !notification.read ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-transparent'
                        }`} />
                        
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                          <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {notification.createdAt 
                              ? (notification.createdAt instanceof Date 
                                  ? notification.createdAt.toLocaleDateString()
                                  : new Date((notification.createdAt as any).seconds * 1000).toLocaleDateString())
                              : 'Just now'}
                          </p>
                        </div>

                        <button
                          onClick={(e) => deleteNotification(e, notification.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Search Bar */}
      {showSearchBar && (
      <div className="hidden md:block fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          )}

          {/* Desktop Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {searchResults.map((user) => (
                <div 
                  key={user.uid}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div 
                    onClick={() => handleUserClick(user.uid)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{user.displayName}</p>
                      {user.bio && <p className="text-xs text-slate-500 truncate">{user.bio}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMessageClick(user.uid, user.displayName)}
                    className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700 transition-colors"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Mobile Search Modal */}
      {showSearchBar && showSearch && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <button onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}>
              <X size={24} className="text-slate-600" />
            </button>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="flex-1 text-lg focus:outline-none"
            />
          </div>

          <div className="p-4">
            {searching ? (
              <div className="text-center py-8 text-slate-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <div 
                      onClick={() => handleUserClick(user.uid)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{user.displayName}</p>
                        {user.bio && <p className="text-sm text-slate-500 truncate">{user.bio}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMessageClick(user.uid, user.displayName)}
                      className="p-2 bg-primary text-white rounded-full hover:bg-indigo-700"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-slate-500">No users found</div>
            ) : (
              <div className="text-center py-8 text-slate-400">Type to search people...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
