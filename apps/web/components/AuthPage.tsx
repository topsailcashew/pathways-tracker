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
    <div className="min-h-screen bg-[#FAF8F4] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#14213D] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <IoGitNetworkOutline size={20} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-white">Shepherd</span>
          </div>
          <p className="text-white/70 text-sm mt-3">Church Integration Platform</p>
        </div>

        <div className="space-y-5">
          {[
            'Track newcomers through every step of integration',
            'Automate follow-ups and pathway progression',
            'Coordinate serve teams and ministry connections',
          ].map((feat) => (
            <div key={feat} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FCA311] mt-1.5 shrink-0" />
              <p className="text-white/70 text-sm">{feat}</p>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} Shepherd</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-8 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <IoGitNetworkOutline size={22} className="text-[#14213D]" />
            <span className="text-xl font-bold text-[#14213D]">Shepherd</span>
          </div>

          <h2 className="text-2xl font-bold text-[#14213D] mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-[#6B6960] mb-6">
            {isSignUp ? 'Get your church set up in minutes.' : 'Sign in to continue to Shepherd.'}
          </p>

          {error && (
            <div className="mb-5 bg-[#FBE5E5] border border-[#B42626]/20 text-[#B42626] rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="bg-white border border-[#D8D2C2] rounded-lg w-full py-2.5 text-sm font-semibold text-[#14213D] hover:bg-[#FAF8F4] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoLogoGoogle size={18} className="text-red-500" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E0D2]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">
                Or Email
              </span>
            </div>
          </div>

          {/* Sign In / Sign Up tabs */}
          <div className="bg-[#FAF8F4] rounded-full p-1 inline-flex w-full mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 rounded-full text-sm py-1.5 font-medium transition-colors ${
                !isSignUp
                  ? 'bg-white border border-[#D8D2C2] text-[#14213D] font-medium'
                  : 'text-[#6B6960] hover:text-[#14213D]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 rounded-full text-sm py-1.5 font-medium transition-colors ${
                isSignUp
                  ? 'bg-white border border-[#D8D2C2] text-[#14213D] font-medium'
                  : 'text-[#6B6960] hover:text-[#14213D]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">First Name</label>
                  <input
                    required
                    type="text"
                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                    placeholder="e.g. John"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">Last Name</label>
                  <input
                    required
                    type="text"
                    className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">Email Address</label>
              <input
                required
                type="email"
                className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                placeholder="name@church.org"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">Password</label>
              <input
                required
                type="password"
                className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                placeholder="••••••••"
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              {isSignUp && (
                <p className="text-xs text-[#9E9D95] mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#14213D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#1F2D52] transition-colors w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : isSignUp ? 'Get Started' : 'Sign In'}
              {!isLoading && <IoArrowForward size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
