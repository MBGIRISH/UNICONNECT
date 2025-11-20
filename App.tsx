import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Navigation from './components/Navigation';
import Feed from './pages/Feed';
import Events from './pages/Events';
import Marketplace from './pages/Marketplace';
import StudyGroups from './pages/StudyGroups';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

// --- Auth Context ---
interface AuthContextType {
  user: FirebaseUser | { uid: string; displayName: string; photoURL: string; email?: string } | null;
  loading: boolean;
  loginDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, loginDemo: () => {} });

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setUser({
        uid: 'demo-user',
        displayName: 'Demo Student',
        photoURL: 'https://ui-avatars.com/api/?name=Demo+Student&background=4f46e5&color=fff',
        email: 'demo@university.edu'
      });
      setLoading(false);
      return;
    }

    // Fail-safe: If Auth doesn't initialize properly or takes too long, stop loading
    // This prevents the "white screen" if Firebase config is invalid
    const timeoutId = setTimeout(() => {
        if (loading) {
            console.warn("Auth check timed out - allowing app to load in guest/login state");
            setLoading(false);
        }
    }, 2500);

    let unsubscribe = () => {};
    try {
      // Check if auth is initialized (it might be undefined if firebaseConfig failed)
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, 
            (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            },
            (error) => {
                console.error("Auth Error:", error);
                setLoading(false);
            }
        );
      } else {
        console.warn("Firebase Auth service not available");
        setLoading(false);
      }
    } catch (e) {
      console.error("Auth Init Failed:", e);
      setLoading(false);
    }

    return () => {
        if (unsubscribe) unsubscribe();
        clearTimeout(timeoutId);
    };
  }, [isDemo]);

  const loginDemo = () => setIsDemo(true);

  return (
    <AuthContext.Provider value={{ user, loading, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Layouts ---

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isChat = location.pathname === '/groups';
  
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />
      <main className={`flex-1 md:ml-64 ${isChat ? 'h-screen overflow-hidden' : ''}`}>
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Feed />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/market" element={<Marketplace />} />
                  <Route path="/groups" element={<StudyGroups />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;