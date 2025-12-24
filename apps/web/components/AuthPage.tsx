
import React, { useState } from 'react';
import { IoArrowForward, IoGitNetworkOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';

const AuthPage: React.FC = () => {
  const { login, register } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await login("demo@church.org", "demo123");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsLoading(false);
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
            <div className="flex gap-4 mb-8 bg-gray-50 p-1 rounded-xl">
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

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

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
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-navy transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Please wait...' : isSignUp ? 'Get Started' : 'Sign In'} {!isLoading && <IoArrowForward />}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button 
                    onClick={handleDemoLogin}
                    className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-wide"
                >
                    Or try with Demo Account
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
