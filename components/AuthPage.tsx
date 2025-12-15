
import React, { useState } from 'react';
import { IoArrowForward, IoLogoGoogle, IoCheckmarkCircle } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';

const AuthPage: React.FC = () => {
  const { login } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth delay
    setTimeout(() => {
        login(formData.name, formData.email, isSignUp);
    }, 600);
  };

  const handleDemoLogin = () => {
      login("Sarah Shepard", "sarah.shepard@church.org", false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="bg-navy p-8 text-center text-white">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-black/20">
            P
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

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
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
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-navy transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    {isSignUp ? 'Get Started' : 'Sign In'} <IoArrowForward />
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
