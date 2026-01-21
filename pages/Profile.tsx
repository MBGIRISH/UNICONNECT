import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Globe, Phone, Mail, Edit2, Share2, Loader2, Upload, X, Check, MessageCircle, LogOut, AlertTriangle, Ban, MoreVertical, GraduationCap } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile, copyProfileLink, shareProfile, uploadAndUpdateAvatar, uploadAndUpdateBackgroundImage } from '../services/profileService';
import { logout } from '../services/authService';
import { blockUser, unblockUser, isUserBlocked } from '../services/moderationService';
import ReportModal from '../components/ReportModal';
import { User } from '../types';

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

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    college: '',
    customCollege: '',
    location: '',
    phone: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: '',
    instagram: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.uid;

  // Check if user is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!isOwnProfile && currentUser && profile) {
        const blocked = await isUserBlocked(currentUser.uid, profile.uid);
        setIsBlocked(blocked);
      }
    };
    
    checkBlockStatus();
  }, [isOwnProfile, currentUser, profile]);

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const profileId = userId || currentUser.uid;
      const data = await getUserProfile(profileId);
      
      if (data) {
        setProfile(data);
        const isPopularCollege = POPULAR_COLLEGES.includes(data.college || '');
        setEditData({
          displayName: data.displayName || '',
          bio: data.bio || '',
          college: isPopularCollege ? (data.college || '') : 'Other (Enter Your College)',
          customCollege: isPopularCollege ? '' : (data.college || ''),
          location: data.location || '',
          phone: data.phone || '',
          website: data.website || '',
          twitter: data.socialLinks?.twitter || '',
          linkedin: data.socialLinks?.linkedin || '',
          github: data.socialLinks?.github || '',
          instagram: data.socialLinks?.instagram || ''
        });
      } else {
        // Profile doesn't exist - if it's own profile, redirect to onboarding
        if (isOwnProfile) {
          navigate('/onboarding');
          return;
        }
        // For other users' profiles, set profile to null to show "not found"
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // If it's own profile and there's an error, redirect to onboarding
      if (isOwnProfile) {
        navigate('/onboarding');
      } else {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !profile) return;

    setSaving(true);
    try {
      let photoURL = profile.photoURL;

      // College cannot be changed - use existing college from profile
      const finalCollege = profile.college;

      // Upload new avatar if selected (using Cloudinary - free!)
      if (avatarFile) {
        photoURL = await uploadAndUpdateAvatar(currentUser.uid, avatarFile);
      }

      // Upload new background image if selected
      if (backgroundFile) {
        await uploadAndUpdateBackgroundImage(currentUser.uid, backgroundFile);
      }

      // Update profile info
      await updateUserProfile(currentUser.uid, {
        displayName: editData.displayName,
        bio: editData.bio,
        college: finalCollege,
        location: editData.location,
        phone: editData.phone,
        website: editData.website,
        socialLinks: {
          twitter: editData.twitter,
          linkedin: editData.linkedin,
          github: editData.github,
          instagram: editData.instagram
        }
      });

      // Reload profile
      await loadProfile();
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview('');
      setBackgroundFile(null);
      setBackgroundPreview('');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    
    const shared = await shareProfile(profile);
    if (!shared) {
      // Fallback to copying link
      const copied = await copyProfileLink(profile.uid);
      if (copied) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !profile) return;
    
    try {
      if (isBlocked) {
        await unblockUser(currentUser.uid, profile.uid);
        setIsBlocked(false);
        alert('User unblocked');
      } else {
        await blockUser(currentUser.uid, profile.uid);
        setIsBlocked(true);
        alert('User blocked');
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      alert('Failed to block/unblock user');
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 flex items-center justify-center">
        <p className="text-slate-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-4 md:pb-4 lg:pb-0 w-full max-w-full overflow-x-hidden">
      <Header title={isOwnProfile ? "My Profile" : profile.displayName} showSearchBar={true} />
      
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 lg:px-8 w-full">
        <div className="bg-white md:rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          {/* Banner */}
          <div className="relative h-32 md:h-48 overflow-hidden">
            {backgroundPreview || profile.backgroundImage ? (
              <img 
                src={backgroundPreview || profile.backgroundImage} 
                alt="Profile background" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            )}
            {isEditing && isOwnProfile && (
              <label className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-700 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm flex items-center gap-2 shadow-md transition-colors">
                <Upload size={16} />
                {backgroundFile || profile.backgroundImage ? 'Change Background' : 'Add Background'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          <div className="px-6 pb-6 pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 px-4 md:px-0">
              {/* Only the avatar should overlap the banner (keeps name fully readable on desktop) */}
              <div className="relative flex-shrink-0 -mt-12 md:-mt-16">
                <img 
                  src={avatarPreview || profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=4f46e5&color=fff`}
                  alt="Profile" 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md object-cover"
                />
                {isEditing && isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="flex-1 min-w-0 w-full md:w-auto">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="w-full text-xl md:text-2xl font-bold text-slate-900 border-b-2 border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 break-words pr-2 leading-tight">{profile.displayName}</h1>
                )}
                <p className="text-slate-500 text-sm break-words pr-2">{profile.email}</p>
                {!isEditing && profile.college && (
                  <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-medium mt-1 flex-wrap">
                    <GraduationCap size={16} className="flex-shrink-0" />
                    <span className="break-words">{profile.college}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                {isOwnProfile ? (
                  isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarPreview('');
                          setBackgroundPreview('');
                        }}
                        className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-slate-50 touch-manipulation min-h-[44px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 md:flex-none bg-indigo-600 text-white px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                      >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-slate-50 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                      >
                        <Edit2 size={14} className="md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-slate-50 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                      >
                        <Share2 size={14} className="md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
                        <span className="sm:hidden">{linkCopied ? '✓' : 'Share'}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 md:flex-none bg-red-600 text-white px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                      >
                        <LogOut size={14} className="md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Logout</span>
                        <span className="sm:hidden">Out</span>
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/messages', { 
                        state: { 
                          userId: profile.uid, 
                          userName: profile.displayName,
                          userPhoto: profile.photoURL
                        } 
                      })}
                      className="flex-1 md:flex-none bg-indigo-600 text-white px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                    >
                      <MessageCircle size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Message</span>
                      <span className="sm:hidden">Msg</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm hover:bg-slate-50 flex items-center gap-1.5 md:gap-2 justify-center touch-manipulation min-h-[44px]"
                    >
                      <Share2 size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
                      <span className="sm:hidden">{linkCopied ? '✓' : 'Share'}</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-100 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="More options"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
                          <button
                            onClick={handleBlock}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 touch-manipulation min-h-[44px]"
                          >
                            <Ban size={16} />
                            {isBlocked ? 'Unblock User' : 'Block User'}
                          </button>
                          <button
                            onClick={handleReport}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600 touch-manipulation min-h-[44px]"
                          >
                            <AlertTriangle size={16} />
                            Report User
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {isEditing ? (
                <>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                  />
                  
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 text-slate-400" size={18} />
                    <div className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 flex items-center">
                      {editData.college === 'Other (Enter Your College)' ? editData.customCollege : editData.college || 'Not set'}
                      <span className="ml-2 text-xs text-slate-400">(Cannot be changed)</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        placeholder="Location"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        placeholder="Phone"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="relative md:col-span-2">
                      <Globe className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        type="url"
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        placeholder="Website"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editData.twitter}
                        onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                        placeholder="Twitter username"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={editData.linkedin}
                        onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                        placeholder="LinkedIn URL"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={editData.github}
                        onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                        placeholder="GitHub username"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={editData.instagram}
                        onChange={(e) => setEditData({ ...editData, instagram: e.target.value })}
                        placeholder="Instagram username"
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {profile.bio && (
                    <p className="text-slate-700 text-sm leading-relaxed">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    {profile.college && (
                      <div className="flex items-center gap-1">
                        <GraduationCap size={14} />
                        {profile.college}
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {profile.location}
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {profile.phone}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1 text-indigo-600">
                        <Globe size={14} />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {profile.socialLinks && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {profile.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${profile.socialLinks.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          @{profile.socialLinks.twitter}
                        </a>
                      )}
                      {profile.socialLinks.github && (
                        <a
                          href={`https://github.com/${profile.socialLinks.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && profile && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="user"
          targetId={profile.uid}
          targetUserId={profile.uid}
          targetName={profile.displayName}
        />
      )}
    </div>
  );
};

export default Profile;
