import React from 'react';
import { MapPin, Book, Link as LinkIcon, Grid, Bookmark } from 'lucide-react';
import Header from '../components/Header';

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header title="My Profile" />
      
      <div className="max-w-4xl mx-auto md:p-6">
        <div className="bg-white md:rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          {/* Banner */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 mb-6">
              <div className="relative">
                <img 
                  src="https://picsum.photos/seed/me/200" 
                  alt="Profile" 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md"
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">Alex Johnson</h1>
                <p className="text-slate-500 text-sm">Computer Science • Class of 2025</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <button className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50">
                  Edit Profile
                </button>
                <button className="flex-1 md:flex-none bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-lg shadow-primary/25">
                  Share
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <p className="text-slate-700 text-sm leading-relaxed max-w-2xl">
                Building things with code. Love hackathons, coffee, and late-night study sessions. 
                Currently looking for team members for the Spring Capstone project! 💻☕️
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  Stanford University
                </div>
                <div className="flex items-center gap-1">
                  <Book size={14} />
                  CS & Economics
                </div>
                <div className="flex items-center gap-1 text-indigo-600">
                  <LinkIcon size={14} />
                  github.com/alexj
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 border-y border-slate-100 py-4 mb-6">
              <div className="text-center">
                <span className="block font-bold text-slate-900">1,240</span>
                <span className="text-xs text-slate-500">Followers</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-900">580</span>
                <span className="text-xs text-slate-500">Following</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-900">45</span>
                <span className="text-xs text-slate-500">Events</span>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex justify-center gap-8 border-b border-slate-100 mb-6">
              <button className="flex items-center gap-2 pb-3 border-b-2 border-primary text-primary font-medium text-sm">
                <Grid size={18} />
                Posts
              </button>
              <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-slate-400 font-medium text-sm hover:text-slate-600">
                <Bookmark size={18} />
                Saved
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
               {[1,2,3,4,5,6].map(i => (
                 <img 
                   key={i} 
                   src={`https://picsum.photos/seed/post${i}/400/400`} 
                   alt="Post" 
                   className="aspect-square object-cover rounded-lg hover:opacity-90 cursor-pointer"
                 />
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
