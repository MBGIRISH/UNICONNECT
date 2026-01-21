import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { signUp, signIn, signInWithGoogle, sendPasswordResetCode, confirmPasswordResetWithActionCode, resendVerificationEmail, verifyEmailWithActionCode } from '../services/authService';
import { auth } from '../firebaseConfig';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [storedActionCode, setStoredActionCode] = useState<string | null>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if we have action code from email link
  const actionCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  const verifyParam = searchParams.get('verify');
  
  // Handle email verification from email link
  useEffect(() => {
    // Check if user clicked verification link from email
    if (actionCode && mode === 'verifyEmail') {
      setLoading(true);
      setError('');
      setSuccess('');
      
      verifyEmailWithActionCode(actionCode)
        .then(() => {
          setSuccess('✅ Email verified successfully! You can now sign in to access the app.');
          setShowVerificationPrompt(false);
          setSearchParams({});
          
          // Reload user to get updated verification status
          auth.currentUser?.reload().then(() => {
            if (auth.currentUser?.emailVerified) {
              // User is now verified, they can sign in
              setEmail(auth.currentUser.email || '');
            }
          });
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to verify email. Please try again.');
          setSearchParams({});
        })
        .finally(() => {
          setLoading(false);
        });
    }
    
    // Check if user needs to verify email (redirected from protected route)
    if (verifyParam === 'true' && auth.currentUser && !auth.currentUser.emailVerified) {
      setShowVerificationPrompt(true);
      setEmail(auth.currentUser.email || '');
    }
  }, [actionCode, mode, verifyParam, searchParams, setSearchParams]);
  
  // Separate effect for periodic verification check (only when prompt is shown)
  useEffect(() => {
    if (!showVerificationPrompt || !auth.currentUser) return;
    
    // Check if email was verified (in case user verified in another tab)
    const checkInterval = setInterval(() => {
      auth.currentUser?.reload().then(() => {
        if (auth.currentUser?.emailVerified) {
          setSuccess('Email verified! Redirecting...');
          setShowVerificationPrompt(false);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          clearInterval(checkInterval);
        }
      }).catch(() => {});
    }, 5000); // Check every 5 seconds (less frequent to avoid issues)
    
    return () => clearInterval(checkInterval);
  }, [showVerificationPrompt]);
  
  // Handle action code from email link - show password reset form
  useEffect(() => {
    if (actionCode && mode === 'resetPassword') {
      // User clicked email link - show password reset form
      setIsForgotPassword(true);
      setResetStep('password');
      
      // Get email from URL
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
      
      // Store action code in state (persists across re-renders)
      setStoredActionCode(actionCode);
      // Also store in window as backup
      (window as any).__resetActionCode = actionCode;
      
      // Clear URL params but keep action code in state
      setSearchParams({});
      
      setSuccess('Please enter your new password below.');
    }
  }, [actionCode, mode, searchParams, setSearchParams]);
  
  // Handle password reset with action code
  const handlePasswordResetWithActionCode = async (newPass: string) => {
    // Get action code from state (preferred) or window (backup)
    const codeToUse = storedActionCode || (window as any).__resetActionCode || actionCode;
    
    if (!codeToUse) {
      throw new Error('Reset link is invalid or expired. Please request a new password reset.');
    }
    
    // Verify action code format
    if (codeToUse.length < 20) {
      throw new Error('Invalid reset link. Please request a new password reset.');
    }
    
    console.log('Attempting password reset with action code...');
    
    // Call Firebase to actually update the password
    try {
      await confirmPasswordResetWithActionCode(codeToUse, newPass);
      console.log('Password reset successful!');
      
      // Clear the stored action code after successful reset
      setStoredActionCode(null);
      (window as any).__resetActionCode = null;
    } catch (error: any) {
      console.error('Password reset error:', error);
      // Clear invalid action code
      if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
        setStoredActionCode(null);
        (window as any).__resetActionCode = null;
      }
      throw error;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (resetStep === 'email') {
          // Step 1: Send password reset email
          if (!email || !email.trim()) {
            throw new Error('Please enter your email address');
          }

          await sendPasswordResetCode(email);
          setSuccess('Password reset email sent! Please check your email inbox or spam folder and click the reset link. You will be able to enter your new password on that page.');
          setError('');
          // Don't change step - user needs to click email link
        } else if (resetStep === 'password') {
          // Reset password using action code from email link
          if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }

          if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
          }

          // Get action code from state or window
          const codeToUse = storedActionCode || (window as any).__resetActionCode || actionCode;
          if (!codeToUse) {
            throw new Error('Reset link is invalid or expired. Please request a new password reset.');
          }

          // Reset password immediately using action code
          try {
            console.log('Resetting password with action code...');
            await handlePasswordResetWithActionCode(newPassword);
            
            console.log('Password reset completed successfully!');
            setSuccess('Password reset successful! Your new password is now active. Redirecting to login...');
            
            // Clear all reset-related state
            setStoredActionCode(null);
            (window as any).__resetActionCode = null;
            
            // Wait a moment for Firebase to propagate the password change
            // Then redirect to login after 2 seconds
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setTimeout(() => {
              setIsForgotPassword(false);
              setResetStep('email');
              setEmail('');
              setNewPassword('');
              setConfirmPassword('');
              setSuccess('');
              setSearchParams({});
              // IMPORTANT: App uses HashRouter, so use react-router navigation (avoids Vercel 404 on /login)
              navigate('/login');
            }, 2000);
          } catch (resetError: any) {
            console.error('Password reset failed:', resetError);
            // Re-throw to be caught by outer catch block
            throw resetError;
          }
        }
      } else if (isLogin) {
        try {
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
        } catch (signInError: any) {
          if (signInError.message === 'EMAIL_NOT_VERIFIED') {
            setShowVerificationPrompt(true);
            throw new Error('Please verify your email address before signing in. Check your inbox for the verification email.');
          }
          throw signInError;
        }
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your name');
        }
        const user = await signUp(email, password, displayName);
        
        // Sign out user immediately after signup - they must verify email first
        await auth.signOut();
        
        setSuccess('✅ Account created! Please check your email inbox or spam and then enter. A verification email has been sent to your email address. Please click the link in the email to verify your account and access the app.');
        setIsLogin(true);
        setEmail(email);
        setPassword('');
        setDisplayName('');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage.replace('Firebase: ', '').replace('auth/', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setResendingEmail(true);
    try {
      await resendVerificationEmail();
      setSuccess('Verification email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      
      // Google accounts are automatically verified, so no check needed
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

          {/* Email Verification Prompt */}
          {showVerificationPrompt && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 text-sm mb-1">Email Verification Required</h3>
                  <p className="text-amber-800 text-xs mb-3">
                    Please verify your email address before signing in. Check your inbox for the verification email.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                      className="px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {resendingEmail ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          Resend Verification Email
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerificationPrompt(false);
                        auth.signOut();
                        setEmail('');
                        setPassword('');
                      }}
                      className="px-4 py-2 bg-white text-amber-700 text-xs font-medium rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors"
                    >
                      Use Different Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

            {/* New Password fields - shown when user clicks email link */}
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
                        ? 'Send Reset Link' 
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
                {resetStep === 'password' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetStep('email');
                      setEmail('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                      setSuccess('');
                      setStoredActionCode(null);
                      (window as any).__resetActionCode = null;
                      setSearchParams({});
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
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                    (window as any).__resetActionCode = null;
                    setSearchParams({});
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
