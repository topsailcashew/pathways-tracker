
import React, { useState } from 'react';
import { 
    IoServerOutline, IoPeopleOutline, IoAlertCircleOutline, IoPulseOutline, 
    IoSearchOutline, IoShieldCheckmarkOutline, IoTerminalOutline, IoBusinessOutline,
    IoCheckmarkCircleOutline, IoWarningOutline, IoCloseCircleOutline, IoStopCircleOutline,
    IoCardOutline, IoCashOutline, IoSettingsOutline, IoToggle, IoMegaphoneOutline, IoReceiptOutline,
    IoArrowBack, IoLocationOutline, IoMailOutline, IoCallOutline, IoPersonOutline, IoKeyOutline, IoGlobeOutline,
    IoTimeOutline, IoCalendarOutline, IoFilterOutline
} from 'react-icons/io5';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Tenant } from '../types';

const SuperAdminDashboard: React.FC = () => {
  const { tenants, systemLogs, updateTenantStatus } = useAppContext();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TENANTS' | 'BILLING' | 'LOGS' | 'SETTINGS'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  
  // Drill-down state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantView, setTenantView] = useState<'DETAILS' | 'USERS' | 'DATABASE'>('DETAILS');
  const [subSearch, setSubSearch] = useState('');

  // --- Mock System Settings State ---
  const [sysSettings, setSysSettings] = useState({
      maintenanceMode: false,
      betaFeatures: true,
      registrationsOpen: true,
      announcement: ''
  });

  // --- Mock Billing Data ---
  const transactions = [
      { id: 'tx-101', tenant: 'Grace Community', amount: 99.00, date: '2023-11-02', status: 'Success', plan: 'Pro' },
      { id: 'tx-102', tenant: 'The Rock Church', amount: 499.00, date: '2023-11-02', status: 'Success', plan: 'Enterprise' },
      { id: 'tx-103', tenant: 'Valley Life', amount: 99.00, date: '2023-11-01', status: 'Success', plan: 'Pro' },
      { id: 'tx-104', tenant: 'City Hill', amount: 99.00, date: '2023-10-31', status: 'Failed', plan: 'Pro' },
      { id: 'tx-105', tenant: 'Lighthouse Chapel', amount: 0.00, date: '2023-10-30', status: 'Success', plan: 'Free' },
  ];

  const revenueData = [
      { month: 'Jun', amount: 12500 },
      { month: 'Jul', amount: 13200 },
      { month: 'Aug', amount: 14800 },
      { month: 'Sep', amount: 14100 },
      { month: 'Oct', amount: 15900 },
      { month: 'Nov', amount: 17200 },
  ];

  // Stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'Active').length;
  const totalMembers = tenants.reduce((sum, t) => sum + t.memberCount, 0);
  const criticalErrors = systemLogs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length;
  const monthlyRevenue = 17200; // Mock MRR

  // Filtered Lists
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = systemLogs.filter(l => 
      logFilter === 'ALL' || l.level === logFilter
  ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Chart Data (Mock generated based on tenants)
  const growthData = [
    { name: 'Jan', value: 120 },
    { name: 'Feb', value: 340 },
    { name: 'Mar', value: 450 },
    { name: 'Apr', value: 890 },
    { name: 'May', value: 1200 },
    { name: 'Jun', value: totalMembers },
  ];

  const loadData = [
    { time: '00:00', req: 120 }, { time: '04:00', req: 80 }, { time: '08:00', req: 850 },
    { time: '12:00', req: 1200 }, { time: '16:00', req: 980 }, { time: '20:00', req: 450 },
  ];

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'bg-green-100 text-green-700 border-green-200';
          case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  const getLogLevelColor = (level: string) => {
      switch(level) {
          case 'ERROR': return 'text-red-500 font-bold';
          case 'CRITICAL': return 'text-red-700 font-bold bg-red-100 px-1 rounded';
          case 'WARN': return 'text-orange-500';
          default: return 'text-blue-500';
      }
  };

  const navButtonClass = (tab: typeof activeTab) => 
      `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-secondary hover:text-white'}`;

  // --- Generate Mock Data for Selected Tenant ---
  const getMockTenantData = (tenant: Tenant, countUsers = 15, countMembers = 40) => {
      // Users
      const users = Array.from({ length: countUsers }).map((_, i) => ({
          id: `u-${i}`,
          name: ['Sarah Shepard', 'Mike Jones', 'Jessica Lee', 'Tom Wilson', 'David Clark', 'Emma Hall'][i % 6] + (i > 5 ? ` ${i}` : ''),
          email: `user${i}@${tenant.domain}.org`,
          role: i === 0 ? 'Super Admin' : i < 3 ? 'Admin' : i < 8 ? 'Staff' : 'Volunteer',
          lastLogin: new Date(Date.now() - Math.random() * 86400000 * 10).toISOString(),
          status: i === 4 ? 'Inactive' : 'Active'
      }));

      // Members
      const members = Array.from({ length: countMembers }).map((_, i) => ({
          id: `tm-${i}`,
          firstName: ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Frank', 'Grace'][i % 8],
          lastName: ['Doe', 'Smith', 'Brown', 'Davis', 'Miller', 'Evans', 'Green', 'Hill'][i % 8] + `-${i}`,
          email: `member${i}@example.com`,
          phone: `555-01${i.toString().padStart(2, '0')}`,
          pathway: i % 3 === 0 ? 'Newcomer' : 'New Believer',
          status: i % 5 === 0 ? 'Integrated' : i % 10 === 0 ? 'Inactive' : 'Active',
          currentStage: 'Stage ' + (Math.floor(Math.random() * 4) + 1),
          joinedDate: new Date(Date.now() - Math.random() * 86400000 * 120).toISOString()
      }));

      return { users, members };
  };

  // --- Render Tenant Detail View ---
  if (selectedTenant) {
      const { users, members } = getMockTenantData(selectedTenant, tenantView === 'USERS' ? 25 : 4, tenantView === 'DATABASE' ? 50 : 8);

      // --- VIEW: ALL USERS ---
      if (tenantView === 'USERS') {
          const filteredUsers = users.filter(u => u.name.toLowerCase().includes(subSearch.toLowerCase()) || u.email.toLowerCase().includes(subSearch.toLowerCase()));
          return (
              <div className="space-y-6 animate-fade-in pb-10">
                  <div className="flex items-center justify-between">
                      <button onClick={() => setTenantView('DETAILS')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                          <IoArrowBack /> Back to {selectedTenant.name}
                      </button>
                      <button onClick={() => { setSelectedTenant(null); setTenantView('DETAILS'); }} className="text-sm font-bold text-gray-400 hover:text-gray-600">Close</button>
                  </div>
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                          <div>
                              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 text-primary rounded-xl"><IoPersonOutline /></div>
                                  Staff & Users
                              </h2>
                              <p className="text-gray-500 text-sm mt-1">Manage access for {selectedTenant.name}</p>
                          </div>
                          <div className="relative w-full md:w-64">
                              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" placeholder="Search users..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full">
                              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                  <tr>
                                      <th className="px-6 py-4 text-left">User</th>
                                      <th className="px-6 py-4 text-left">Role</th>
                                      <th className="px-6 py-4 text-left">Status</th>
                                      <th className="px-6 py-4 text-left">Last Login</th>
                                      <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {filteredUsers.map(u => (
                                      <tr key={u.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{u.name.charAt(0)}</div>
                                                  <div><p className="text-sm font-bold text-gray-800">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4"><span className="bg-blue-50 text-primary px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                                          <td className="px-6 py-4">
                                              <span className={`flex items-center gap-1 text-xs font-bold ${u.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>
                                                  <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></span> {u.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-500"><div className="flex items-center gap-1"><IoTimeOutline /> {new Date(u.lastLogin).toLocaleDateString()}</div></td>
                                          <td className="px-6 py-4 text-right"><button className="text-xs font-bold text-primary hover:underline">Edit</button></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          );
      }

      // --- VIEW: DATABASE ---
      if (tenantView === 'DATABASE') {
          const filteredMembers = members.filter(m => (m.firstName + ' ' + m.lastName).toLowerCase().includes(subSearch.toLowerCase()) || m.email.toLowerCase().includes(subSearch.toLowerCase()));
          return (
              <div className="space-y-6 animate-fade-in pb-10">
                  <div className="flex items-center justify-between">
                      <button onClick={() => setTenantView('DETAILS')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                          <IoArrowBack /> Back to {selectedTenant.name}
                      </button>
                      <button onClick={() => { setSelectedTenant(null); setTenantView('DETAILS'); }} className="text-sm font-bold text-gray-400 hover:text-gray-600">Close</button>
                  </div>
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                          <div>
                              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                  <div className="p-2 bg-green-50 text-green-700 rounded-xl"><IoPeopleOutline /></div>
                                  Full Database
                              </h2>
                              <p className="text-gray-500 text-sm mt-1">View all people records for {selectedTenant.name}</p>
                          </div>
                          <div className="relative w-full md:w-64">
                              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" placeholder="Search people..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full">
                              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                  <tr>
                                      <th className="px-6 py-4 text-left">Name</th>
                                      <th className="px-6 py-4 text-left">Contact</th>
                                      <th className="px-6 py-4 text-left">Pathway</th>
                                      <th className="px-6 py-4 text-left">Status</th>
                                      <th className="px-6 py-4 text-left">Joined</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {filteredMembers.map(m => (
                                      <tr key={m.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 font-bold text-gray-800">{m.firstName} {m.lastName}</td>
                                          <td className="px-6 py-4 text-sm text-gray-600">
                                              <div className="flex flex-col">
                                                  <span className="flex items-center gap-1"><IoMailOutline className="text-gray-400"/> {m.email}</span>
                                                  <span className="flex items-center gap-1"><IoCallOutline className="text-gray-400"/> {m.phone}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${m.pathway === 'Newcomer' ? 'bg-blue-50 text-primary' : 'bg-purple-50 text-purple-700'}`}>{m.pathway}</span><div className="text-[10px] text-gray-400 mt-1">{m.currentStage}</div></td>
                                          <td className="px-6 py-4">
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${m.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                  {m.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-500"><div className="flex items-center gap-1"><IoCalendarOutline /> {new Date(m.joinedDate).toLocaleDateString()}</div></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          );
      }

      // --- VIEW: DETAILS (Dashboard) ---
      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <button 
                  onClick={() => setSelectedTenant(null)} 
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
              >
                  <IoArrowBack /> Back to Dashboard
              </button>

              {/* Header Card */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-navy text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                              {selectedTenant.name.charAt(0)}
                          </div>
                          <div>
                              <h1 className="text-3xl font-bold text-gray-800">{selectedTenant.name}</h1>
                              <div className="flex items-center gap-3 mt-1">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(selectedTenant.status)} flex items-center gap-1`}>
                                      {selectedTenant.status === 'Active' ? <IoCheckmarkCircleOutline /> : <IoStopCircleOutline />}
                                      {selectedTenant.status}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                      <IoGlobeOutline /> {selectedTenant.domain}.pathwaytracker.app
                                  </span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => updateTenantStatus(selectedTenant.id, selectedTenant.status === 'Active' ? 'Suspended' : 'Active')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${selectedTenant.status === 'Active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                          >
                              {selectedTenant.status === 'Active' ? 'Suspend Access' : 'Reactivate Access'}
                          </button>
                          <button className="px-4 py-2 bg-navy text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primary transition-colors flex items-center gap-2">
                              <IoKeyOutline /> Login as Admin
                          </button>
                      </div>
                  </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Organization Details */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                      <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Organization</h3>
                      
                      <div className="space-y-4">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Contact</p>
                              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                  <IoMailOutline className="text-primary"/> {selectedTenant.adminEmail}
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Location</p>
                              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                  <IoLocationOutline className="text-primary"/> Atlanta, GA (US East)
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Subscription</p>
                              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                                  <div>
                                      <p className="text-sm font-bold text-navy">{selectedTenant.plan} Plan</p>
                                      <p className="text-xs text-blue-600">Renews Nov 30, 2023</p>
                                  </div>
                                  <IoCardOutline className="text-blue-400" size={24} />
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Database Stats</p>
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                      <p className="text-lg font-bold text-gray-800">{selectedTenant.memberCount}</p>
                                      <p className="text-[10px] text-gray-500 uppercase">People</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                      <p className="text-lg font-bold text-gray-800">42GB</p>
                                      <p className="text-[10px] text-gray-500 uppercase">Storage</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Column 2: Users Snapshot */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Staff & Users</h3>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-bold text-gray-600">{users.length} (Sample)</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3">
                          {users.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                          {u.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-gray-800">{u.name}</p>
                                          <p className="text-xs text-gray-500">{u.email}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">{u.role}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button 
                        onClick={() => { setSubSearch(''); setTenantView('USERS'); }}
                        className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                      >
                          <IoPersonOutline /> View All Users
                      </button>
                  </div>

                  {/* Column 3: People/Members Snapshot */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Recent People</h3>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-bold text-gray-600">{selectedTenant.memberCount}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3">
                          {members.map(m => (
                              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/30 transition-colors">
                                  <div>
                                      <p className="text-sm font-bold text-gray-800">{m.firstName} {m.lastName}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-[10px] uppercase font-bold ${m.pathway === 'Newcomer' ? 'text-blue-500' : 'text-purple-500'}`}>{m.pathway}</span>
                                          <span className="text-[10px] text-gray-400">• {new Date(m.joinedDate).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                                  <span className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                              </div>
                          ))}
                      </div>
                      <button 
                        onClick={() => { setSubSearch(''); setTenantView('DATABASE'); }}
                        className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                      >
                          <IoPeopleOutline /> View Database
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="bg-navy rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
             <div>
                 <div className="flex items-center gap-2 mb-2 text-ocean font-bold uppercase tracking-wider text-xs">
                    <IoShieldCheckmarkOutline /> System Administration
                 </div>
                 <h1 className="text-2xl md:text-3xl font-bold mb-2">Super Admin Console</h1>
                 <p className="text-secondary/80 max-w-xl text-sm md:text-base">
                    Overview of all registered churches, billing, user activity, and system health status.
                 </p>
             </div>
             <div className="flex flex-wrap gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
                 <button onClick={() => setActiveTab('OVERVIEW')} className={navButtonClass('OVERVIEW')}>Overview</button>
                 <button onClick={() => setActiveTab('TENANTS')} className={navButtonClass('TENANTS')}>Churches</button>
                 <button onClick={() => setActiveTab('BILLING')} className={navButtonClass('BILLING')}>Billing</button>
                 <button onClick={() => setActiveTab('LOGS')} className={navButtonClass('LOGS')}>Logs</button>
                 <button onClick={() => setActiveTab('SETTINGS')} className={navButtonClass('SETTINGS')}>Settings</button>
             </div>
         </div>
      </div>

      {activeTab === 'OVERVIEW' && (
          <div className="animate-fade-in space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div><p className="text-xs font-bold text-gray-500 uppercase">Total Churches</p><h3 className="text-2xl md:text-3xl font-bold text-navy">{totalTenants}</h3><p className="text-[10px] text-green-600 font-bold mt-1 bg-green-50 px-2 py-0.5 rounded-full inline-block">+2 this week</p></div>
                      <div className="p-3 bg-blue-50 text-primary rounded-xl"><IoBusinessOutline size={24}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div><p className="text-xs font-bold text-gray-500 uppercase">Global Members</p><h3 className="text-2xl md:text-3xl font-bold text-navy">{totalMembers.toLocaleString()}</h3><p className="text-[10px] text-gray-400 font-bold mt-1">Across all instances</p></div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><IoPeopleOutline size={24}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab('BILLING')}>
                      <div><p className="text-xs font-bold text-gray-500 uppercase">MRR (Est.)</p><h3 className="text-2xl md:text-3xl font-bold text-green-600">${monthlyRevenue.toLocaleString()}</h3><p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1"><IoPulseOutline/> +8.4% vs last mo</p></div>
                      <div className="p-3 bg-green-50 text-green-600 rounded-xl"><IoCashOutline size={24}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-red-200 transition-colors" onClick={() => setActiveTab('LOGS')}>
                      <div><p className="text-xs font-bold text-gray-500 uppercase">System Alerts</p><h3 className="text-2xl md:text-3xl font-bold text-red-600">{criticalErrors}</h3><p className="text-[10px] text-red-400 font-bold mt-1">Requires attention</p></div>
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl"><IoAlertCircleOutline size={24}/></div>
                  </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-6">Total Member Growth</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1A3D63" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#1A3D63" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Area type="monotone" dataKey="value" stroke="#1A3D63" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-6">System Load (Req/Min)</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={loadData}>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Bar dataKey="req" radius={[4, 4, 0, 0]} barSize={40}>
                                    {loadData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.req > 1000 ? '#EF4444' : '#4A7FA7'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'TENANTS' && (
          <div className="animate-fade-in bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                      <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search churches or domains..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary" 
                      />
                  </div>
                  <div className="flex gap-2">
                      <span className="text-xs font-bold uppercase text-gray-400 self-center">Showing {filteredTenants.length} of {totalTenants}</span>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                          <tr>
                              <th className="px-6 py-4 text-left">Church Name</th>
                              <th className="px-6 py-4 text-left">Admin Email</th>
                              <th className="px-6 py-4 text-left">Plan</th>
                              <th className="px-6 py-4 text-left">Members</th>
                              <th className="px-6 py-4 text-left">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredTenants.map(tenant => (
                              <tr 
                                key={tenant.id} 
                                onClick={() => { setSelectedTenant(tenant); setTenantView('DETAILS'); }}
                                className="hover:bg-blue-50/10 cursor-pointer transition-colors"
                              >
                                  <td className="px-6 py-4">
                                      <p className="font-bold text-gray-800">{tenant.name}</p>
                                      <p className="text-xs text-gray-400">{tenant.domain}.pathwaytracker.app</p>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{tenant.adminEmail}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tenant.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : tenant.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {tenant.plan}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{tenant.memberCount.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tenant.status)}`}>
                                          {tenant.status === 'Active' ? <IoCheckmarkCircleOutline /> : <IoStopCircleOutline />}
                                          {tenant.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                      {tenant.status === 'Active' ? (
                                          <button onClick={() => updateTenantStatus(tenant.id, 'Suspended')} className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                                              Suspend
                                          </button>
                                      ) : (
                                          <button onClick={() => updateTenantStatus(tenant.id, 'Active')} className="text-xs font-bold text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-green-100 transition-colors">
                                              Activate
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'BILLING' && (
          <div className="animate-fade-in space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2 text-green-600">
                          <IoCashOutline size={20} />
                          <span className="text-xs font-bold uppercase tracking-wider">Monthly Revenue</span>
                      </div>
                      <h3 className="text-3xl font-bold text-navy">${monthlyRevenue.toLocaleString()}</h3>
                      <p className="text-xs text-gray-400 mt-1">Based on active subscriptions</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2 text-primary">
                          <IoCardOutline size={20} />
                          <span className="text-xs font-bold uppercase tracking-wider">Active Subscriptions</span>
                      </div>
                      <h3 className="text-3xl font-bold text-navy">{activeTenants}</h3>
                      <p className="text-xs text-gray-400 mt-1">Paying customers</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2 text-orange-500">
                          <IoWarningOutline size={20} />
                          <span className="text-xs font-bold uppercase tracking-wider">Failed Payments</span>
                      </div>
                      <h3 className="text-3xl font-bold text-navy">2</h3>
                      <p className="text-xs text-gray-400 mt-1">Requires follow-up</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend (6 Months)</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(val) => `$${val/1000}k`} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Transaction List */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-96">
                      <div className="p-6 border-b border-gray-100">
                          <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                          {transactions.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50">
                                  <div>
                                      <p className="text-sm font-bold text-gray-800">{tx.tenant}</p>
                                      <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.plan}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-bold text-gray-800">${tx.amount}</p>
                                      <span className={`text-[10px] uppercase font-bold ${tx.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}>{tx.status}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                          <button className="text-xs font-bold text-primary hover:underline">View All Transactions</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'SETTINGS' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <IoSettingsOutline /> Global Configuration
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Manage system-wide settings that affect all tenants.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      {/* Maintenance Mode */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex gap-4">
                              <div className="p-3 bg-red-100 text-red-600 rounded-lg h-fit"><IoStopCircleOutline size={24} /></div>
                              <div>
                                  <h4 className="font-bold text-gray-800">Maintenance Mode</h4>
                                  <p className="text-xs text-gray-500 max-w-sm mt-1">Prevents non-admin users from logging in. Use for system upgrades.</p>
                              </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={sysSettings.maintenanceMode} onChange={() => setSysSettings({...sysSettings, maintenanceMode: !sysSettings.maintenanceMode})} />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </label>
                      </div>

                      {/* Feature Flags */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feature Flags</h4>
                          
                          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                              <div>
                                  <p className="font-bold text-gray-800 text-sm">Enable Beta AI Features</p>
                                  <p className="text-xs text-gray-500">Rolls out new Gemini 2.5 models to all tenants.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={sysSettings.betaFeatures} onChange={() => setSysSettings({...sysSettings, betaFeatures: !sysSettings.betaFeatures})} />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                          </div>

                          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                              <div>
                                  <p className="font-bold text-gray-800 text-sm">Allow New Registrations</p>
                                  <p className="text-xs text-gray-500">Public sign-up page visibility.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={sysSettings.registrationsOpen} onChange={() => setSysSettings({...sysSettings, registrationsOpen: !sysSettings.registrationsOpen})} />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                          </div>
                      </div>

                      {/* System Announcement */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">System Announcement Banner</label>
                          <div className="relative">
                              <IoMegaphoneOutline className="absolute left-3 top-3 text-gray-400" />
                              <input 
                                type="text" 
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary"
                                placeholder="e.g. Scheduled maintenance on Sunday at 2 AM..."
                                value={sysSettings.announcement}
                                onChange={(e) => setSysSettings({...sysSettings, announcement: e.target.value})}
                              />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">This message will appear at the top of every tenant's dashboard.</p>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                      <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-navy transition-colors">Save Configuration</button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="animate-fade-in bg-navy rounded-2xl border border-navy shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-mono">
                      <IoTerminalOutline /> System Logs
                  </div>
                  <div className="flex gap-2">
                      {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(f => (
                          <button 
                            key={f} 
                            onClick={() => setLogFilter(f)}
                            className={`px-3 py-1 rounded text-xs font-bold font-mono ${logFilter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              {f}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs bg-[#0F172A] text-gray-300 scrollbar-thin">
                  {filteredLogs.map(log => (
                      <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded">
                          <span className="text-gray-500 w-36 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className={`w-16 shrink-0 ${getLogLevelColor(log.level)}`}>{log.level}</span>
                          <span className="text-purple-400 w-16 shrink-0">[{log.module}]</span>
                          <span className="flex-1 text-gray-200">{log.message}</span>
                          <span className="text-gray-600 w-24 text-right truncate">{log.ip}</span>
                          <span className="text-gray-500 w-16 text-right">{log.latency}ms</span>
                      </div>
                  ))}
                  {filteredLogs.length === 0 && (
                      <div className="text-center py-10 text-gray-600 italic">No logs found matching filter.</div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
