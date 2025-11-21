import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Search, Filter, X, Loader2, Calendar, User, BookOpen } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../App';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  department: string;
  year: string;
  subject: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderPhoto?: string;
  createdAt: any;
  downloads: number;
}

const Resources: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const departments = [
    'All', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 
    'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry'
  ];

  const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  // Fetch resources
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];
      
      setResources(resourcesData);
      setFilteredResources(resourcesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching resources:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter resources
  useEffect(() => {
    let filtered = resources;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by department
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter((r) => r.department === selectedDepartment);
    }

    // Filter by year
    if (selectedYear !== 'All') {
      filtered = filtered.filter((r) => r.year === selectedYear);
    }

    setFilteredResources(filtered);
  }, [searchQuery, selectedDepartment, selectedYear, resources]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        alert('Please select a PDF file');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !department || !year || !subject) {
      alert('Please fill all required fields and select a PDF file');
      return;
    }

    setUploading(true);

    try {
      // Get user profile for uploader info
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user?.uid)));
      const userData = userDoc.docs[0]?.data();

      // Upload file to Cloudinary as raw file (PDF)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'uniconnect_uploads');
      formData.append('folder', 'uniconnect/resources');
      formData.append('resource_type', 'raw'); // Explicitly set resource type for PDFs
      formData.append('format', 'pdf');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dlnlwudgr/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Failed to upload file: ${errorData.error?.message || 'Unknown error'}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      
      console.log('Cloudinary upload successful:', cloudinaryData.secure_url);

      // Save resource metadata to Firestore
      const docRef = await addDoc(collection(db, 'resources'), {
        title,
        description,
        fileUrl: cloudinaryData.secure_url,
        fileName: file.name,
        fileSize: file.size,
        department,
        year,
        subject,
        uploadedBy: user?.uid,
        uploaderName: userData?.displayName || 'Anonymous',
        uploaderPhoto: userData?.photoURL || '',
        createdAt: serverTimestamp(),
        downloads: 0,
      });
      
      console.log('Resource saved to Firestore with ID:', docRef.id);

      // Reset form
      setTitle('');
      setDescription('');
      setDepartment('');
      setYear('');
      setSubject('');
      setFile(null);
      setShowUploadModal(false);
      alert('Resource uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header title="Resources" />

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Upload size={18} />
              Upload
            </button>
          </div>

          {/* Active Filters */}
          {(selectedDepartment !== 'All' || selectedYear !== 'All') && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedDepartment !== 'All' && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {selectedDepartment}
                  <button onClick={() => setSelectedDepartment('All')}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedYear !== 'All' && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {selectedYear}
                  <button onClick={() => setSelectedYear('All')}>
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No resources found</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or be the first to upload!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                {/* Resource Icon & Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <FileText size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{resource.title}</h3>
                    <p className="text-sm text-slate-500">{resource.fileName}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium">
                    {resource.department}
                  </span>
                  <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-medium">
                    {resource.year}
                  </span>
                  <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs font-medium">
                    {resource.subject}
                  </span>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{resource.uploaderName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(resource.createdAt)}</span>
                  </div>
                </div>

                {/* File Info & Download */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">{formatFileSize(resource.fileSize)}</span>
                  <a
                    href={resource.fileUrl}
                    download={resource.fileName}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                    onClick={(e) => {
                      // Force download by fetching the file and creating a blob
                      e.preventDefault();
                      fetch(resource.fileUrl)
                        .then(res => res.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = resource.fileName;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        })
                        .catch(err => {
                          console.error('Download error:', err);
                          // Fallback: open in new tab
                          window.open(resource.fileUrl, '_blank');
                        });
                    }}
                  >
                    <Download size={14} />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Upload Resource</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Data Structures Notes - Unit 1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the resource..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.slice(1).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Year *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                >
                  <option value="">Select Year</option>
                  {years.slice(1).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Data Structures, Physics, Mathematics"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  PDF File *
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={32} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600 font-medium">
                      {file ? file.name : 'Click to upload PDF'}
                    </span>
                    {file && (
                      <span className="text-xs text-slate-500 mt-1">
                        {formatFileSize(file.size)}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Resource
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;

