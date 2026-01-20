import React, { useState, useEffect } from 'react';
import { Home, Calendar, ShoppingBag, Users, User, PlusCircle, Clock, BookOpen, MessageCircle, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Clock, label: 'Timetable', path: '/timetable' },
    { icon: Users, label: 'Groups', path: '/groups' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: ShoppingBag, label: 'Market', path: '/marketplace' },
    { icon: BookOpen, label: 'Resources', path: '/resources' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Horizontal Navbar */}
      <nav className="hidden lg:flex items-center justify-between px-4 xl:px-6 py-3 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">UniConnect</span>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 min-h-[44px] ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/25 transition-all min-h-[44px]"
        >
          <PlusCircle size={18} />
          <span className="text-sm">New Post</span>
        </button>
      </nav>

      {/* Mobile/Tablet Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-white p-2 rounded-lg shadow-md border border-slate-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center safe-top"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile/Tablet Slide-in Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <nav className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto">
          <div className="p-6 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">UniConnect</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 px-4 space-y-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-manipulation min-h-[44px] ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} />
                <span className="text-base">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200">
            <button 
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-primary hover:bg-indigo-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all touch-manipulation min-h-[44px]"
            >
              <PlusCircle size={20} />
              <span>New Post</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navigation;
