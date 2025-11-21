import React from 'react';
import { Home, Calendar, ShoppingBag, Users, User, PlusCircle, Clock, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Clock, label: 'Timetable', path: '/timetable' },
    { icon: Users, label: 'Groups', path: '/groups' },
    { icon: ShoppingBag, label: 'Market', path: '/marketplace' },
    { icon: BookOpen, label: 'Resources', path: '/resources' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-50">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">UniConnect</span>
        </div>

        <div className="flex-1 px-4 space-y-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-4">
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-primary hover:bg-indigo-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all"
          >
            <PlusCircle size={20} />
            New Post
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-50 pb-safe">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 ${
                isActive(item.path) ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
