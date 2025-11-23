import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Key, CheckCircle } from 'lucide-react';
import { signUp, signIn, signInWithGoogle, sendPasswordResetCode, verifyResetCode, resetPasswordWithCode, confirmPasswordResetWithActionCode } from '../services/authService';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email'); // New: multi-step reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if we have action code from email link
  const actionCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  
  // Handle action code from email link
  useEffect(() => {
    if (actionCode && mode === 'resetPassword') {
      setIsForgotPassword(true);
      setResetStep('password');
      // Store action code for later use
      (window as any).__resetActionCode = actionCode;
      // Get email from URL
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
        
        // Try to get stored password from Firestore
        const getStoredPassword = async () => {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../firebaseConfig');
            const codeDoc = await getDoc(doc(db, 'passwordResetCodes', emailParam.toLowerCase()));
            if (codeDoc.exists()) {
              const codeData = codeDoc.data();
              if (codeData.newPassword && codeData.waitingForActionCode) {
                // We have stored password, user can just confirm it
                setNewPassword(codeData.newPassword);
                setConfirmPassword(codeData.newPassword);
                setSuccess('Password found. Please confirm and click "Reset Password" to complete.');
              }
            }
          } catch (err) {
            console.error('Error getting stored password:', err);
            // Continue without stored password - user will enter it manually
          }
        };
        getStoredPassword();
      }
      // Clear URL params but keep action code
      setSearchParams({ oobCode: actionCode, mode: 'resetPassword' });
    }
  }, [actionCode, mode, searchParams, setSearchParams]);
  
  // Handle password reset with action code
  const handlePasswordResetWithActionCode = async (newPass: string) => {
    const storedActionCode = (window as any).__resetActionCode || actionCode;
    if (!storedActionCode) {
      throw new Error('Reset link is invalid or expired');
    }
    await confirmPasswordResetWithActionCode(storedActionCode, newPass);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (resetStep === 'email') {
          // Step 1: Send verification code
          if (!email || !email.trim()) {
            throw new Error('Please enter your email address');
          }

          await sendPasswordResetCode(email);
          setCodeSent(true);
          setResetStep('code');
          setSuccess('Verification code sent to your email! Please check your inbox and spam folder.');
          setError('');
        } else if (resetStep === 'code') {
          // Step 2: Verify code
          if (!resetCode || resetCode.trim().length !== 6) {
            throw new Error('Please enter the 6-digit code');
          }

          await verifyResetCode(email, resetCode);
          setResetStep('password');
          setSuccess('Code verified! Please enter your new password.');
          setError('');
        } else if (resetStep === 'password') {
          // Step 3: Reset password
          if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }

          if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
          }

          // Check if we have action code from email link
          const storedActionCode = (window as any).__resetActionCode || actionCode;
          if (storedActionCode) {
            // Direct reset with action code (user clicked email link)
            await handlePasswordResetWithActionCode(newPassword);
            setSuccess('Password reset successful! You can now sign in with your new password.');
          } else {
            // Code-based reset - send email with reset link
            await resetPasswordWithCode(email, resetCode, newPassword);
            setSuccess('Password reset email sent! Please check your email and click the reset link to complete the process. Your new password has been saved and will be applied when you click the link.');
          }
          
          setTimeout(() => {
            setIsForgotPassword(false);
            setResetStep('email');
            setEmail('');
            setResetCode('');
            setNewPassword('');
            setConfirmPassword('');
            setCodeSent(false);
            setSuccess('');
            (window as any).__resetActionCode = null;
            setSearchParams({});
          }, storedActionCode ? 3000 : 6000);
        }
      } else if (isLogin) {
        const user = await signIn(email, password);
        
        // Check if user needs onboarding
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebaseConfig');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // If user doesn't have college set, they need onboarding
          if (!userData.college) {
            navigate('/onboarding');
          } else {
            navigate('/');
          }
        } else {
          // User document doesn't exist, go to onboarding
          navigate('/onboarding');
        }
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your name');
        }
        await signUp(email, password, displayName);
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage.replace('Firebase: ', '').replace('auth/', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      
      // Check if user needs onboarding (no college set means new user)
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebaseConfig');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If user doesn't have college set, they need onboarding
        if (!userData.college) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      } else {
        // User document doesn't exist, go to onboarding
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message.replace('Firebase: ', '').replace('auth/', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-3xl">U</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">UniConnect</h1>
            <p className="text-slate-500 mt-2">
              {isForgotPassword 
                ? 'Reset your password' 
                : isLogin 
                ? 'Welcome back!' 
                : 'Join your campus community'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Name field (Sign up only) */}
            {!isLogin && !isForgotPassword && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email field */}
            {(resetStep === 'email' || !isForgotPassword) && (
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  type="email"
                  placeholder={isForgotPassword ? "Enter your registered email" : "University Email"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  required
                  autoComplete="email"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  disabled={resetStep !== 'email' && isForgotPassword}
                />
                {isForgotPassword && resetStep === 'email' && (
                  <p className="text-xs text-slate-500 mt-1 ml-1">
                    Enter the email address associated with your account
                  </p>
                )}
              </div>
            )}

            {/* Verification Code field (Step 2) */}
            {isForgotPassword && resetStep === 'code' && (
              <div className="relative">
                <Key className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-2xl font-mono tracking-widest"
                  value={resetCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setResetCode(value);
                    setError('');
                  }}
                  required
                  maxLength={6}
                  autoComplete="off"
                />
                <p className="text-xs text-slate-500 mt-1 ml-1 text-center">
                  Check your email for the verification code
                </p>
                {codeSent && (
                  <p className="text-xs text-indigo-600 mt-1 ml-1 text-center flex items-center justify-center gap-1">
                    <CheckCircle size={12} />
                    Code sent to {email}
                  </p>
                )}
              </div>
            )}

            {/* New Password fields (Step 3) */}
            {isForgotPassword && resetStep === 'password' && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}

            {/* Password field */}
            {!isForgotPassword && (
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {/* Forgot password link */}
            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isForgotPassword 
                    ? (resetStep === 'email' 
                        ? 'Send Verification Code' 
                        : resetStep === 'code' 
                        ? 'Verify Code' 
                        : 'Reset Password')
                    : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {!isForgotPassword && (
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-slate-100"></div>
              <span className="px-4 text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 border-t border-slate-100"></div>
            </div>
          )}

          {/* Google sign in */}
          {!isForgotPassword && (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl border-2 border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {/* Toggle auth mode */}
          <div className="mt-6 text-center">
            {isForgotPassword ? (
              <div className="space-y-2">
                {resetStep !== 'email' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (resetStep === 'code') {
                        setResetStep('email');
                        setResetCode('');
                        setCodeSent(false);
                      } else if (resetStep === 'password') {
                        setResetStep('code');
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                      setError('');
                      setSuccess('');
                    }}
                    className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetStep('email');
                    setEmail('');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setCodeSent(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors block w-full"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
