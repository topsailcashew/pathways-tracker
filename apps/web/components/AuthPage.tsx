import React, { useState } from 'react';
import { IoArrowForward, IoGitNetworkOutline, IoLogoGoogle } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';

const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error: contextError, isLoading: contextLoading } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Combine local and context errors
  const error = localError || contextError;
  const isLoading = localLoading || contextLoading;

  const handleGoogleSignIn = async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in">

        {/* Header */}
        <div className="bg-navy p-8 text-center text-white flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 border border-white/20 shadow-2xl backdrop-blur-sm">
            <IoGitNetworkOutline size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1">Pathway Tracker</h1>
          <p className="text-secondary/80 text-sm">Church Integration Platform</p>
        </div>

        {/* Form */}
        <div className="p-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Google Sign In - Primary */}
            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <IoLogoGoogle size={20} className="text-red-500" />
                Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-400 font-medium">or continue with email</span>
                </div>
            </div>

            {/* Email/Password Tabs */}
            <div className="flex gap-4 mb-6 bg-gray-50 p-1 rounded-xl">
                <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Create Account
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <>
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                                placeholder="e.g. John"
                                value={formData.firstName}
                                onChange={e => setFormData({...formData, firstName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                                placeholder="e.g. Doe"
                                value={formData.lastName}
                                onChange={e => setFormData({...formData, lastName: e.target.value})}
                            />
                        </div>
                    </>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                        placeholder="name@church.org"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                    <input
                        required
                        type="password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                        placeholder="••••••••"
                        minLength={6}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    {isSignUp && (
                        <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-navy transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Please wait...' : isSignUp ? 'Get Started' : 'Sign In'} {!isLoading && <IoArrowForward />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
