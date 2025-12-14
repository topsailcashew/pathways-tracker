import React, { useState } from 'react';
import { User } from '../types';
import { IoPersonOutline, IoLockClosedOutline, IoLogOutOutline, IoCheckmarkCircle, IoPencil, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

interface ProfilePageProps {
  user: User;
  assignedTasksCount: number;
  assignedMembersCount: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  // Local state for form management
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    location: user.location,
    postalCode: user.postalCode,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
  });
  
  const [securityData, setSecurityData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SECURITY'>('PERSONAL');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: keyof typeof securityData, value: string) => {
      setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  const renderPersonal = () => (
      <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-navy mb-8">Personal Information</h3>

          <div className="space-y-6">
              
              {/* Gender Radio Buttons */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
                  <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.gender === 'Male' ? 'border-primary' : 'border-gray-300'}`}>
                              {formData.gender === 'Male' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                          </div>
                          <input 
                            type="radio" 
                            name="gender" 
                            value="Male" 
                            checked={formData.gender === 'Male'} 
                            onChange={() => handleChange('gender', 'Male')}
                            className="hidden" 
                          />
                          <span className={`text-sm ${formData.gender === 'Male' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Male</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.gender === 'Female' ? 'border-primary' : 'border-gray-300'}`}>
                              {formData.gender === 'Female' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                          </div>
                          <input 
                            type="radio" 
                            name="gender" 
                            value="Female" 
                            checked={formData.gender === 'Female'}
                            onChange={() => handleChange('gender', 'Female')}
                            className="hidden" 
                          />
                          <span className={`text-sm ${formData.gender === 'Female' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Female</span>
                      </label>
                  </div>
              </div>

              {/* Name Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                  </div>
              </div>

              {/* Email (Verified) */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative">
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-24"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                          <IoCheckmarkCircle size={14} /> Verified
                      </div>
                  </div>
              </div>

              {/* Address */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                      <input 
                        type="date" 
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                  </div>
              </div>

               {/* Location Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <select 
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                          <option>Atlanta, USA</option>
                          <option>New York, USA</option>
                          <option>London, UK</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                      <input 
                        type="text" 
                        value={formData.postalCode}
                        onChange={(e) => handleChange('postalCode', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                  </div>
              </div>

          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex gap-4">
              <button className="flex-1 px-6 py-3.5 border border-primary text-primary font-bold rounded-xl hover:bg-blue-50 transition-colors">
                  Discard Changes
              </button>
              <button className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-navy transition-colors shadow-lg shadow-primary/30">
                  Save Changes
              </button>
          </div>
      </div>
  );

  const renderSecurity = () => (
    <div className="animate-fade-in">
         <h3 className="text-xl font-bold text-navy mb-8">Login & Password</h3>
         <div className="space-y-6 max-w-2xl">
            <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                 <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={securityData.currentPassword}
                        onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                     <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                         {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                     </button>
                 </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={securityData.newPassword}
                        onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                <h4 className="text-sm font-bold text-primary mb-2">Password Requirements</h4>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    <li>Minimum 8 characters long</li>
                    <li>At least one uppercase character</li>
                    <li>At least one number or symbol</li>
                </ul>
            </div>
         </div>

         <div className="mt-10 flex gap-4 max-w-2xl">
              <button className="flex-1 px-6 py-3.5 border border-primary text-primary font-bold rounded-xl hover:bg-blue-50 transition-colors">
                  Cancel
              </button>
              <button className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-navy transition-colors shadow-lg shadow-primary/30">
                  Update Password
              </button>
          </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
       {/* Main Layout: Split into Left Sidebar and Right Content */}
       <div className="flex flex-col md:flex-row gap-6">
          
          {/* LEFT COLUMN: Sidebar Card */}
          <div className="w-full md:w-1/4 flex flex-col gap-6">
              
              {/* Profile Overview Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-4 group cursor-pointer">
                      <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-90 transition-opacity" 
                      />
                      <div className="absolute bottom-1 right-1 bg-ocean text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                          <IoPencil size={14} />
                      </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-navy">{formData.firstName} {formData.lastName}</h2>
                  <p className="text-sm text-gray-500 font-medium">{user.role}</p>

                  {/* Navigation Menu */}
                  <div className="w-full mt-8 space-y-2">
                      <button 
                        onClick={() => setActiveTab('PERSONAL')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'PERSONAL' 
                            ? 'bg-blue-50 text-primary' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                          <IoPersonOutline size={18} />
                          Personal Information
                      </button>

                      <button 
                        onClick={() => setActiveTab('SECURITY')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'SECURITY' 
                            ? 'bg-blue-50 text-primary' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                          <IoLockClosedOutline size={18} />
                          Login & Password
                      </button>

                      <div className="h-px bg-gray-100 my-2"></div>

                      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                          <IoLogOutOutline size={18} />
                          Log Out
                      </button>
                  </div>
              </div>
          </div>

          {/* RIGHT COLUMN: Detailed Form */}
          <div className="w-full md:w-3/4">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  {activeTab === 'PERSONAL' ? renderPersonal() : renderSecurity()}
              </div>
          </div>

       </div>
    </div>
  );
};

export default ProfilePage;