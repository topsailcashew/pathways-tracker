
import React, { useState } from 'react';
import { IoPersonOutline, IoLockClosedOutline, IoLogOutOutline,  IoPencil, IoEyeOutline, IoEyeOffOutline, IoShieldCheckmarkOutline, IoDesktopOutline, IoPhonePortraitOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';

const ProfilePage: React.FC = () => {
  const { currentUser, signOut } = useAppContext();

  if (!currentUser) return null;

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

  const inputCls = "bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5";

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       <div className="flex flex-col md:flex-row gap-6">

          {/* Left sidebar */}
          <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-6 flex flex-col items-center text-center">
                  <div className="relative mb-4 group cursor-pointer">
                      <img
                          src={currentUser.avatar}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute bottom-1 right-1 bg-[#14213D] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                          <IoPencil size={12} />
                      </div>
                  </div>
                  <h2 className="text-base font-bold text-[#14213D]">{formData.firstName} {formData.lastName}</h2>
                  <span className="mt-1 bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
                      {currentUser.role}
                  </span>

                  <div className="w-full mt-6 space-y-1">
                      <button
                          onClick={() => setActiveTab('PERSONAL')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'PERSONAL' ? 'bg-[#FEF6E8] text-[#14213D] font-semibold' : 'text-[#6B6960] hover:bg-[#FAF8F4] hover:text-[#14213D]'}`}
                      >
                          <IoPersonOutline size={16} /> Personal Information
                      </button>
                      <button
                          onClick={() => setActiveTab('SECURITY')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'SECURITY' ? 'bg-[#FEF6E8] text-[#14213D] font-semibold' : 'text-[#6B6960] hover:bg-[#FAF8F4] hover:text-[#14213D]'}`}
                      >
                          <IoLockClosedOutline size={16} /> Login & Password
                      </button>
                      <div className="h-px bg-black/[0.08] my-2" />
                      <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#6B6960] hover:bg-[#FAF8F4] hover:text-[#14213D] transition-colors"
                      >
                          <IoLogOutOutline size={16} /> Log Out
                      </button>
                  </div>
              </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-6">
                  {activeTab === 'PERSONAL' ? (
                      <div className="animate-fade-in">
                          <h3 className="text-base font-semibold text-[#14213D] pb-4 border-b border-[#E5E0D2] mb-6">
                              Personal Information
                          </h3>
                          <div className="space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                      <label className={labelCls}>First Name</label>
                                      <input
                                          type="text"
                                          value={formData.firstName}
                                          onChange={(e) => handleChange('firstName', e.target.value)}
                                          className={inputCls}
                                      />
                                  </div>
                                  <div>
                                      <label className={labelCls}>Last Name</label>
                                      <input
                                          type="text"
                                          value={formData.lastName}
                                          onChange={(e) => handleChange('lastName', e.target.value)}
                                          className={inputCls}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className={labelCls}>Email</label>
                                  <input
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) => handleChange('email', e.target.value)}
                                      className={inputCls}
                                  />
                              </div>
                              <div className="mt-8 flex gap-3 pt-4 border-t border-[#E5E0D2]">
                                  <button className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F4] transition-colors">
                                      Discard Changes
                                  </button>
                                  <button className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors">
                                      Save Changes
                                  </button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="animate-fade-in space-y-8">
                          <div>
                              <h3 className="text-base font-semibold text-[#14213D] pb-4 border-b border-[#E5E0D2] mb-6">
                                  Change Password
                              </h3>
                              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                                  <div>
                                      <label className={labelCls}>Current Password</label>
                                      <div className="relative">
                                          <input
                                              type={showPassword ? "text" : "password"}
                                              value={securityForm.currentPassword}
                                              onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                                              className={inputCls}
                                              placeholder="••••••••"
                                          />
                                          <button
                                              type="button"
                                              onClick={() => setShowPassword(!showPassword)}
                                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9D95] hover:text-[#6B6960]"
                                          >
                                              {showPassword ? <IoEyeOffOutline size={16}/> : <IoEyeOutline size={16}/>}
                                          </button>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className={labelCls}>New Password</label>
                                          <input
                                              type="password"
                                              value={securityForm.newPassword}
                                              onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                                              className={inputCls}
                                              placeholder="••••••••"
                                          />
                                      </div>
                                      <div>
                                          <label className={labelCls}>Confirm Password</label>
                                          <input
                                              type="password"
                                              value={securityForm.confirmPassword}
                                              onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                                              className={inputCls}
                                              placeholder="••••••••"
                                          />
                                      </div>
                                  </div>
                                  <div className="pt-2">
                                      <button
                                          type="submit"
                                          disabled={!securityForm.currentPassword || !securityForm.newPassword}
                                          className="bg-[#14213D] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
                                      >
                                          Update Password
                                      </button>
                                  </div>
                              </form>
                          </div>

                          <div className="pt-6 border-t border-[#E5E0D2]">
                              <h3 className="text-base font-semibold text-[#14213D] mb-4 flex items-center gap-2">
                                  <IoShieldCheckmarkOutline size={18} /> Two-Factor Authentication
                              </h3>
                              <div className="flex items-center justify-between bg-[#FEF6E8] p-4 rounded-xl border border-[#FCA311]/20">
                                  <div>
                                      <p className="font-semibold text-[#14213D] text-sm">Secure your account</p>
                                      <p className="text-xs text-[#6B6960] mt-1">Require a code from your mobile device when signing in.</p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" checked={is2FAEnabled} onChange={() => setIs2FAEnabled(!is2FAEnabled)} />
                                      <div className="w-11 h-6 bg-black/[0.14] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14213D]"></div>
                                  </label>
                              </div>
                          </div>

                          <div className="pt-6 border-t border-[#E5E0D2]">
                              <h3 className="text-base font-semibold text-[#14213D] mb-4">Login Activity</h3>
                              <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#4F7E50]/20 bg-[#4F7E50]/5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#4F7E50] border border-[#E5E0D2] shadow-sm">
                                              <IoDesktopOutline size={18} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-[#14213D]">Chrome on macOS</p>
                                              <p className="text-xs text-[#6B6960]">Atlanta, USA • Active now</p>
                                          </div>
                                      </div>
                                      <span className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
                                          Current
                                      </span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D2]">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-[#FAF8F4] rounded-full flex items-center justify-center text-[#6B6960] border border-[#E5E0D2]">
                                              <IoPhonePortraitOutline size={18} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-[#14213D]">Safari on iPhone 13</p>
                                              <p className="text-xs text-[#6B6960]">Atlanta, USA • 2 hours ago</p>
                                          </div>
                                      </div>
                                      <button className="text-xs font-semibold text-[#B42626] hover:underline">Log Out</button>
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
