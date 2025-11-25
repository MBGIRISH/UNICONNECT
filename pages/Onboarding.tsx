import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Globe, Phone, Loader2, Upload, X, GraduationCap } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { updateUserProfile } from '../services/profileService';
import { uploadAndUpdateAvatar } from '../services/profileService';

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

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    college: '',
    customCollege: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: '',
    instagram: ''
  });
  const navigate = useNavigate();

  const user = auth.currentUser;

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

  const handleNext = () => {
    // Validate step 2 (college selection) before proceeding
    if (step === 2) {
      const finalCollege = formData.college === 'Other (Enter Your College)' ? formData.customCollege : formData.college;
      if (!finalCollege || finalCollege.trim() === '') {
        alert('Please select or enter your college before continuing.');
        return;
      }
    }
    
    // Validate step 3 (bio, location, phone) - all required
    if (step === 3) {
      if (!formData.bio || formData.bio.trim() === '') {
        alert('Please enter your bio. This field is required.');
        return;
      }
      if (!formData.location || formData.location.trim() === '') {
        alert('Please enter your location. This field is required.');
        return;
      }
      if (!formData.phone || formData.phone.trim() === '') {
        alert('Please enter your phone number. This field is required.');
        return;
      }
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };


  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Upload avatar if provided (optional - don't fail if upload fails)
      if (avatarFile) {
        try {
          await uploadAndUpdateAvatar(user.uid, avatarFile);
        } catch (avatarError: any) {
          console.warn('Avatar upload failed, continuing without avatar:', avatarError);
          // Continue without avatar - user can add it later
        }
      }

      // Determine final college name
      const finalCollege = formData.college === 'Other (Enter Your College)' ? formData.customCollege : formData.college;

      // Validate required fields
      if (!finalCollege || finalCollege.trim() === '') {
        throw new Error('Please select or enter your college');
      }
      
      // Validate required fields: bio, location, phone
      if (!formData.bio || formData.bio.trim() === '') {
        throw new Error('Please enter your bio. This field is required.');
      }
      if (!formData.location || formData.location.trim() === '') {
        throw new Error('Please enter your location. This field is required.');
      }
      if (!formData.phone || formData.phone.trim() === '') {
        throw new Error('Please enter your phone number. This field is required.');
      }

      // Update other profile fields
      await updateUserProfile(user.uid, {
        college: finalCollege,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        socialLinks: {
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          github: formData.github,
          instagram: formData.instagram
        }
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      alert(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-indigo-100 mt-1">Step {step} of 4</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-white' : 'bg-indigo-400'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Avatar */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Add a Profile Photo</h2>
                <p className="text-slate-500">Help others recognize you</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-3xl font-bold">
                        {user?.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {avatarPreview && (
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview('');
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <label className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <Upload size={18} />
                  Choose Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 2: College Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Choose Your College</h2>
                <p className="text-slate-500">This helps you connect with your campus community</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    College
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value, customCollege: '' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Select your college...</option>
                      {POPULAR_COLLEGES.map((college) => (
                        <option key={college} value={college}>
                          {college}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.college === 'Other (Enter Your College)' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Custom College Name
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        required
                        type="text"
                        value={formData.customCollege}
                        onChange={(e) => setFormData({ ...formData, customCollege: e.target.value })}
                        placeholder="Enter your college name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
                  <p className="font-medium mb-1">🎓 Why choose a college?</p>
                  <ul className="text-xs space-y-1 text-indigo-700">
                    <li>• See events at your campus first</li>
                    <li>• Connect with your classmates</li>
                    <li>• Find study groups at your college</li>
                    <li>• Discover nearby events at other colleges</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Basic Info */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Tell us about yourself</h2>
                <p className="text-slate-500">Share some basic information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bio <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">This field is required</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Location (e.g., Boston, MA)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">This field is required</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">This field is required</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Website"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Social Links */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Your Socials</h2>
                <p className="text-slate-500">Optional: Link your social media profiles</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="Twitter username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="LinkedIn profile URL"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="GitHub username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="Instagram username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

