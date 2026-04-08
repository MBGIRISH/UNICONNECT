import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Loader2 } from 'lucide-react';

// Pages
import Navigation from './components/Navigation';
import Feed from './pages/Feed';
import Events from './pages/Events';
import Marketplace from './pages/Marketplace';
import StudyGroups from './pages/StudyGroups';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Messages from './pages/Messages';
import Timetable from './pages/Timetable';
import Resources from './pages/Resources';
import TimetableReminderEngine from './components/TimetableReminderEngine';

// Auth Context
interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Layout component
const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isChat = location.pathname === '/groups' || location.pathname === '/messages';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <TimetableReminderEngine />
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${isChat ? 'h-screen overflow-hidden' : ''} lg:pt-16`}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

// Onboarding Guard - checks if user has completed onboarding
const OnboardingGuard = ({ children }: { children: React.ReactElement }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || location.pathname === '/onboarding') {
        setChecking(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If user doesn't have college set, they need onboarding
          if (!userData.college) {
            setNeedsOnboarding(true);
          }
        } else {
          // User document doesn't exist, needs onboarding
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, location.pathname]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // STRICT: Block ALL unverified password-based accounts from accessing app
  // Users MUST click verification link in email to access the app
  if (
    !user.emailVerified && 
    user.providerData[0]?.providerId === 'password'
  ) {
    // Only redirect if not already on login page (to prevent loops)
    if (location.pathname !== '/login' && location.pathname !== '/onboarding') {
      return <Navigate to="/login?verify=true" replace />;
    }
    // If already on login, show verification prompt (handled by Login component)
  }

  return children;
};

// Public Route component (redirect to home if already logged in)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  // Only redirect if user is verified (or Google sign-in which is auto-verified)
  // Allow unverified users to stay on login page to see verification prompt
  if (user) {
    const isVerified = user.emailVerified || user.providerData[0]?.providerId !== 'password';
    if (isVerified && location.pathname === '/login') {
      return <Navigate to="/" replace />;
    }
    // If unverified and on login, allow them to stay (they'll see verification prompt)
    if (isVerified && location.pathname !== '/login') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Onboarding route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Feed />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/groups" element={<StudyGroups />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                  </Routes>
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
