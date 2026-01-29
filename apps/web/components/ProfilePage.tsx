
import React, { useState } from 'react';
import { IoPersonOutline, IoLockClosedOutline, IoLogOutOutline,  IoPencil, IoEyeOutline, IoEyeOffOutline, IoShieldCheckmarkOutline, IoDesktopOutline, IoPhonePortraitOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';

const ProfilePage: React.FC = () => {
  const { currentUser, signOut } = useAppContext();
  
  const [formData, setFormData] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    phone: currentUser.phone,
    address: currentUser.address,
    location: currentUser.location,
    postalCode: currentUser.postalCode,
    dateOfBirth: currentUser.dateOfBirth,
    gender: currentUser.gender,
  });
  
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SECURITY'>('PERSONAL');

  // Security State
  const [securityForm, setSecurityForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: keyof typeof securityForm, value: string) => {
      setSecurityForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (securityForm.newPassword !== securityForm.confirmPassword) {
          alert("New passwords do not match.");
          return;
      }
      if (securityForm.newPassword.length < 6) {
          alert("Password must be at least 6 characters.");
          return;
      }
      // Simulate API call
      alert("Password updated successfully.");
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
      if(window.confirm('Are you sure you want to sign out?')) {
          signOut();
      }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-4 group cursor-pointer">
                      <img src={currentUser.avatar} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-90 transition-opacity" />
                      <div className="absolute bottom-1 right-1 bg-ocean text-white p-1.5 rounded-full border-2 border-white shadow-sm"><IoPencil size={14} /></div>
                  </div>
                  <h2 className="text-xl font-bold text-navy">{formData.firstName} {formData.lastName}</h2>
                  <p className="text-sm text-gray-500 font-medium">{currentUser.role}</p>

                  <div className="w-full mt-8 space-y-2">
                      <button onClick={() => setActiveTab('PERSONAL')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'PERSONAL' ? 'bg-blue-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}><IoPersonOutline size={18} /> Personal Information</button>
                      <button onClick={() => setActiveTab('SECURITY')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'SECURITY' ? 'bg-blue-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}><IoLockClosedOutline size={18} /> Login & Password</button>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"><IoLogOutOutline size={18} /> Log Out</button>
                  </div>
              </div>
          </div>

          <div className="w-full md:w-3/4">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  {activeTab === 'PERSONAL' ? (
                      <div className="animate-fade-in">
                          <h3 className="text-xl font-bold text-navy mb-8">Personal Information</h3>
                          <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label><input type="text" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" /></div>
                                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label><input type="text" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" /></div>
                              </div>
                              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Email</label><input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" /></div>
                              <div className="mt-10 flex gap-4"><button className="flex-1 px-6 py-3.5 border border-primary text-primary font-bold rounded-xl">Discard Changes</button><button className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg">Save Changes</button></div>
                          </div>
                      </div>
                  ) : (
                      <div className="animate-fade-in space-y-8">
                          <div>
                              <h3 className="text-xl font-bold text-navy mb-6">Change Password</h3>
                              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                      <div className="relative">
                                          <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={securityForm.currentPassword}
                                            onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" 
                                            placeholder="••••••••"
                                          />
                                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                              {showPassword ? <IoEyeOffOutline size={18}/> : <IoEyeOutline size={18}/>}
                                          </button>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                          <input 
                                            type="password" 
                                            value={securityForm.newPassword}
                                            onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" 
                                            placeholder="••••••••"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                                          <input 
                                            type="password" 
                                            value={securityForm.confirmPassword}
                                            onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" 
                                            placeholder="••••••••"
                                          />
                                      </div>
                                  </div>
                                  <div className="pt-2">
                                      <button type="submit" disabled={!securityForm.currentPassword || !securityForm.newPassword} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-navy transition-colors disabled:opacity-50">
                                          Update Password
                                      </button>
                                  </div>
                              </form>
                          </div>

                          <div className="pt-6 border-t border-gray-100">
                              <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2"><IoShieldCheckmarkOutline /> Two-Factor Authentication</h3>
                              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                                  <div>
                                      <p className="font-bold text-primary text-sm">Secure your account</p>
                                      <p className="text-xs text-blue-600/80 mt-1">Require a code from your mobile device when signing in.</p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" checked={is2FAEnabled} onChange={() => setIs2FAEnabled(!is2FAEnabled)} />
                                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                  </label>
                              </div>
                          </div>

                          <div className="pt-6 border-t border-gray-100">
                              <h3 className="text-lg font-bold text-navy mb-4">Login Activity</h3>
                              <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 rounded-xl border border-green-200 bg-green-50/50">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 border border-green-100 shadow-sm"><IoDesktopOutline size={20} /></div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-800">Chrome on macOS</p>
                                              <p className="text-xs text-gray-500">Atlanta, USA • Active now</p>
                                          </div>
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded">Current Session</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 border border-gray-200"><IoPhonePortraitOutline size={20} /></div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-800">Safari on iPhone 13</p>
                                              <p className="text-xs text-gray-500">Atlanta, USA • 2 hours ago</p>
                                          </div>
                                      </div>
                                      <button className="text-xs font-bold text-red-500 hover:underline">Log Out</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

export default ProfilePage;
