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

  // Listen for unread direct messages (new model: conversations/{id}/messages with unreadCounts on conversation)
  useEffect(() => {
    if (!currentUser || !db) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach((d) => {
        const data: any = d.data();
        const counts = data?.unreadCounts || {};
        const mine = counts?.[currentUser.uid] || 0;
        totalUnread += mine;
      });
      setMessageUnreadCount(totalUnread);
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
    const userId = currentUser?.uid;
    if (!userId || !db) return;

    if (!notification.read && currentUser) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setNotificationUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await updateDoc(doc(db, `users/${userId}/notifications`, notification.id), {
          read: true
        });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.type === 'marketplace_inquiry' && notification.fromUserId) {
      navigate('/messages', {
        state: {
          userId: notification.fromUserId,
          userName: notification.fromUserName || 'User',
          userPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.fromUserName || 'User')}`
        }
      });
      setShowNotifications(false);
      return;
    }

    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationUnreadCount(0);

    try {
      const updatePromises = unreadNotifications.map((n) =>
        updateDoc(doc(db, `users/${currentUser.uid}/notifications`, n.id), { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!currentUser) return;

    const currentNotification = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (currentNotification && !currentNotification.read) {
      setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/notifications`, notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
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
      <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center safe-top">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate flex-1 min-w-0 mr-2">{title}</h1>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {showSearchBar && (
            <button 
              onClick={() => setShowSearch(true)}
              className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-full touch-manipulation"
              aria-label="Search"
            >
              <Search size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
          <button 
            onClick={() => navigate('/messages')}
            className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 rounded-full relative touch-manipulation"
            aria-label="Messages"
          >
            <MessageCircle size={18} className="sm:w-5 sm:h-5" />
            {messageUnreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] flex items-center justify-center px-0.5 sm:px-1">
                {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
              </span>
            )}
          </button>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-1.5 sm:p-2 rounded-full relative ${showNotifications ? 'bg-slate-100 text-primary' : 'text-slate-600 hover:bg-slate-100'} touch-manipulation`}
              aria-label="Notifications"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop for mobile */}
                <div 
                  className="fixed inset-0 bg-black/20 z-40 md:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="fixed md:absolute right-2 md:right-0 top-14 md:top-full mt-2 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-80 lg:w-96 max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[calc(100vh-5rem)] md:max-h-[80vh] flex flex-col">
                  <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 flex-shrink-0">
                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Notifications</h3>
                    {notificationUnreadCount > 0 && (
                      <button 
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs text-primary hover:text-indigo-700 flex items-center gap-1 touch-manipulation px-2 py-1 min-h-[32px]"
                      >
                        <Check size={12} />
                        <span className="hidden sm:inline">Mark all read</span>
                        <span className="sm:hidden">Mark</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 sm:p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-2 sm:gap-3 touch-manipulation ${
                            !notification.read ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            !notification.read ? 'bg-primary' : 'bg-transparent'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 break-words">{notification.title}</p>
                            <p className="text-sm text-slate-600 mt-0.5 break-words">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              {notification.createdAt 
                                ? (notification.createdAt instanceof Date 
                                    ? notification.createdAt.toLocaleDateString()
                                    : new Date((notification.createdAt as any).seconds * 1000).toLocaleDateString())
                                : 'Just now'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => deleteNotification(e, notification.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 sm:p-2 touch-manipulation flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Actions (Messages + Notifications) */}
      {/* Place below the main navbar (HashRouter app layout) so it doesn't get covered on desktop */}
      <div className="hidden md:flex fixed top-20 right-4 z-50 items-center gap-2">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full relative shadow-sm"
          aria-label="Messages"
        >
          <MessageCircle size={18} />
          {messageUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 bg-white border border-slate-200 rounded-full relative shadow-sm ${
              showNotifications ? 'text-primary' : 'text-slate-700 hover:bg-slate-50'
            }`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notificationUnreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Notifications Dropdown (Desktop uses absolute positioning) */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 max-w-[min(24rem,calc(100vw-2rem))] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 flex-shrink-0">
                <h3 className="font-semibold text-slate-800 text-base">Notifications</h3>
                {notificationUnreadCount > 0 && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={markAllNotificationsRead}
                    className="text-xs text-primary hover:text-indigo-700 flex items-center gap-1 px-2 py-1 min-h-[32px]"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 min-h-0">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 ${
                        !notification.read ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 break-words">{notification.title}</p>
                        <p className="text-sm text-slate-600 mt-0.5 break-words">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {notification.createdAt
                            ? (notification.createdAt instanceof Date
                                ? notification.createdAt.toLocaleDateString()
                                : new Date((notification.createdAt as any).seconds * 1000).toLocaleDateString())
                            : 'Just now'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => deleteNotification(e, notification.id)}
                        className="text-slate-400 hover:text-red-500 p-2 flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Search Bar */}
      {showSearchBar && (
      <div className="hidden md:block fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
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
        <div className="md:hidden fixed inset-0 z-50 bg-white safe-top safe-bottom overflow-y-auto">
          <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 bg-white z-10">
            <button 
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close search"
            >
              <X size={24} className="text-slate-600" />
            </button>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="flex-1 text-base sm:text-lg focus:outline-none min-h-[44px] px-2"
            />
          </div>

          <div className="p-3 sm:p-4">
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
