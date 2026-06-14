
import React, { useState } from 'react';
import {
     IoPeopleOutline, IoAlertCircleOutline, IoPulseOutline,
    IoSearchOutline, IoShieldCheckmarkOutline, IoTerminalOutline, IoBusinessOutline,
    IoWarningOutline,  IoStopCircleOutline,
    IoCardOutline, IoCashOutline, IoSettingsOutline, IoMegaphoneOutline,
    IoArrowBack, IoLocationOutline, IoMailOutline, IoCallOutline, IoPersonOutline, IoKeyOutline, IoGlobeOutline,
    IoTimeOutline, IoCalendarOutline
} from 'react-icons/io5';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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

  const getStatusDot = (status: string) => status === 'Active' ? 'bg-[#4F7E50]' : 'bg-[#B42626]';
  const getStatusText = (status: string) => status === 'Active' ? 'text-[#4F7E50]' : 'text-[#B42626]';

  const getLogLevelColor = (level: string) => {
      switch(level) {
          case 'ERROR': return 'text-[#B42626] font-bold';
          case 'CRITICAL': return 'text-[#B42626] font-bold bg-[#FBE5E5] px-1 rounded';
          case 'WARN': return 'text-[#B8732A]';
          default: return 'text-[#6B6960]';
      }
  };

  const navButtonClass = (tab: typeof activeTab) =>
      `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'bg-white text-[#14213D] shadow-sm' : 'text-white/70 hover:text-white'}`;

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
                      <button onClick={() => setTenantView('DETAILS')} className="flex items-center gap-2 text-sm font-semibold text-[#6B6960] hover:text-[#14213D] transition-colors">
                          <IoArrowBack /> Back to {selectedTenant.name}
                      </button>
                      <button onClick={() => { setSelectedTenant(null); setTenantView('DETAILS'); }} className="text-sm font-semibold text-[#9E9D95] hover:text-[#6B6960]">Close</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                          <div>
                              <h2 className="text-[2.125rem] font-bold tracking-tight text-[#14213D] flex items-center gap-3">
                                  <div className="p-2 bg-[#FAF8F4] text-[#14213D] rounded-xl"><IoPersonOutline /></div>
                                  Staff &amp; Users
                              </h2>
                              <p className="text-sm text-[#6B6960] mt-1">Manage access for {selectedTenant.name}</p>
                          </div>
                          <div className="relative w-full md:w-64">
                              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" />
                              <input type="text" placeholder="Search users..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="w-full pl-9 pr-4 bg-white border border-[#D8D2C2] rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]" />
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full">
                              <thead>
                                  <tr>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">User</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Role</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Status</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Last Login</th>
                                      <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredUsers.map(u => (
                                      <tr key={u.id} className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4]">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-[#EFEBE0] flex items-center justify-center text-xs font-bold text-[#14213D]">{u.name.charAt(0)}</div>
                                                  <div><p className="text-sm font-semibold text-[#14213D]">{u.name}</p><p className="text-xs text-[#6B6960]">{u.email}</p></div>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4"><span className="bg-[#EFEBE0] text-[#14213D] px-2 py-1 rounded text-xs font-semibold">{u.role}</span></td>
                                          <td className="px-6 py-4">
                                              <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.status === 'Active' ? 'text-[#4F7E50]' : 'text-[#9E9D95]'}`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-[#4F7E50]' : 'bg-[#9E9D95]'}`}></span> {u.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-[#6B6960]"><div className="flex items-center gap-1"><IoTimeOutline /> {new Date(u.lastLogin).toLocaleDateString()}</div></td>
                                          <td className="px-6 py-4 text-right"><button className="text-xs font-semibold text-[#14213D] hover:underline">Edit</button></td>
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
                      <button onClick={() => setTenantView('DETAILS')} className="flex items-center gap-2 text-sm font-semibold text-[#6B6960] hover:text-[#14213D] transition-colors">
                          <IoArrowBack /> Back to {selectedTenant.name}
                      </button>
                      <button onClick={() => { setSelectedTenant(null); setTenantView('DETAILS'); }} className="text-sm font-semibold text-[#9E9D95] hover:text-[#6B6960]">Close</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                          <div>
                              <h2 className="text-[2.125rem] font-bold tracking-tight text-[#14213D] flex items-center gap-3">
                                  <div className="p-2 bg-[#FAF8F4] text-[#4F7E50] rounded-xl"><IoPeopleOutline /></div>
                                  Full Database
                              </h2>
                              <p className="text-sm text-[#6B6960] mt-1">View all people records for {selectedTenant.name}</p>
                          </div>
                          <div className="relative w-full md:w-64">
                              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" />
                              <input type="text" placeholder="Search people..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="w-full pl-9 pr-4 bg-white border border-[#D8D2C2] rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]" />
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full">
                              <thead>
                                  <tr>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Name</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Contact</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Pathway</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Status</th>
                                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Joined</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredMembers.map(m => (
                                      <tr key={m.id} className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4]">
                                          <td className="px-6 py-4 font-semibold text-[#14213D]">{m.firstName} {m.lastName}</td>
                                          <td className="px-6 py-4 text-sm text-[#1F2D52]">
                                              <div className="flex flex-col gap-0.5">
                                                  <span className="flex items-center gap-1"><IoMailOutline className="text-[#9E9D95]"/> {m.email}</span>
                                                  <span className="flex items-center gap-1"><IoCallOutline className="text-[#9E9D95]"/> {m.phone}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${m.pathway === 'Newcomer' ? 'bg-[#EFEBE0] text-[#14213D]' : 'bg-[#FAF8F4] text-[#1F2D52]'}`}>{m.pathway}</span>
                                              <div className="text-[10px] text-[#9E9D95] mt-1">{m.currentStage}</div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`flex items-center gap-1.5 text-xs font-semibold ${m.status === 'Active' ? 'text-[#4F7E50]' : 'text-[#9E9D95]'}`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-[#4F7E50]' : 'bg-[#9E9D95]'}`} />
                                                  {m.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-[#6B6960]"><div className="flex items-center gap-1"><IoCalendarOutline /> {new Date(m.joinedDate).toLocaleDateString()}</div></td>
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
                  className="flex items-center gap-2 text-sm font-semibold text-[#6B6960] hover:text-[#14213D] transition-colors"
              >
                  <IoArrowBack /> Back to Dashboard
              </button>

              {/* Header Card */}
              <div className="bg-gradient-to-br from-[#14213D] to-[#1F2D52] rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                              {selectedTenant.name.charAt(0)}
                          </div>
                          <div>
                              <h1 className="text-2xl font-bold text-white">{selectedTenant.name}</h1>
                              <div className="flex items-center gap-3 mt-1">
                                  <span className={`flex items-center gap-1.5 text-sm font-semibold ${selectedTenant.status === 'Active' ? 'text-[#4F7E50]' : 'text-[#B42626]'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${selectedTenant.status === 'Active' ? 'bg-[#4F7E50]' : 'bg-[#B42626]'}`} />
                                      {selectedTenant.status}
                                  </span>
                                  <span className="text-sm text-white/60 flex items-center gap-1">
                                      <IoGlobeOutline /> {selectedTenant.domain}.shepherd.app
                                  </span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button
                            onClick={() => updateTenantStatus(selectedTenant.id, selectedTenant.status === 'Active' ? 'Suspended' : 'Active')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selectedTenant.status === 'Active' ? 'border-[#B42626]/40 text-[#B42626] bg-[#FBE5E5]/10 hover:bg-[#FBE5E5]/20' : 'border-[#4F7E50]/40 text-[#4F7E50] bg-white/10 hover:bg-white/20'}`}
                          >
                              {selectedTenant.status === 'Active' ? 'Suspend Access' : 'Reactivate Access'}
                          </button>
                          <button className="bg-[#1F2D52] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#2A3654] inline-flex items-center gap-2">
                              <IoKeyOutline /> Login as Admin
                          </button>
                      </div>
                  </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Organization Details */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 space-y-6">
                      <h3 className="text-sm font-semibold text-[#6B6960] uppercase tracking-[0.08em] border-b border-[#E5E0D2] pb-2">Organization</h3>

                      <div className="space-y-4">
                          <div>
                              <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em] mb-1">Contact</p>
                              <div className="flex items-center gap-2 text-sm text-[#1F2D52] font-medium">
                                  <IoMailOutline className="text-[#9E9D95]"/> {selectedTenant.adminEmail}
                              </div>
                          </div>
                          <div>
                              <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em] mb-1">Location</p>
                              <div className="flex items-center gap-2 text-sm text-[#1F2D52] font-medium">
                                  <IoLocationOutline className="text-[#9E9D95]"/> Atlanta, GA (US East)
                              </div>
                          </div>
                          <div>
                              <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em] mb-1">Subscription</p>
                              <div className="flex items-center justify-between bg-[#FAF8F4] p-3 rounded-xl border border-[#E5E0D2]">
                                  <div>
                                      <p className="text-sm font-semibold text-[#14213D]">{selectedTenant.plan} Plan</p>
                                      <p className="text-xs text-[#6B6960]">Renews Nov 30, 2023</p>
                                  </div>
                                  <IoCardOutline className="text-[#9E9D95]" size={24} />
                              </div>
                          </div>
                          <div>
                              <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em] mb-1">Database Stats</p>
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-[#FAF8F4] p-2 rounded-lg text-center">
                                      <p className="text-lg font-bold text-[#14213D]">{selectedTenant.memberCount}</p>
                                      <p className="text-[10px] text-[#6B6960] uppercase tracking-[0.08em]">People</p>
                                  </div>
                                  <div className="bg-[#FAF8F4] p-2 rounded-lg text-center">
                                      <p className="text-lg font-bold text-[#14213D]">42GB</p>
                                      <p className="text-[10px] text-[#6B6960] uppercase tracking-[0.08em]">Storage</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Column 2: Users Snapshot */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex flex-col">
                      <div className="flex justify-between items-center border-b border-[#E5E0D2] pb-2 mb-4">
                          <h3 className="text-sm font-semibold text-[#14213D]">Staff &amp; Users</h3>
                          <span className="text-xs bg-[#EFEBE0] px-2 py-1 rounded font-semibold text-[#6B6960]">{users.length} (Sample)</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2">
                          {users.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#EFEBE0] flex items-center justify-center text-xs font-bold text-[#14213D]">
                                          {u.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-sm font-semibold text-[#14213D]">{u.name}</p>
                                          <p className="text-xs text-[#6B6960]">{u.email}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-xs font-semibold text-[#14213D] bg-[#EFEBE0] px-2 py-0.5 rounded">{u.role}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button
                        onClick={() => { setSubSearch(''); setTenantView('USERS'); }}
                        className="mt-4 w-full py-2 border border-dashed border-[#D8D2C2] rounded-xl text-[#6B6960] text-sm font-semibold hover:border-[#FCA311] hover:text-[#14213D] transition-colors flex items-center justify-center gap-2"
                      >
                          <IoPersonOutline /> View All Users
                      </button>
                  </div>

                  {/* Column 3: People/Members Snapshot */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex flex-col">
                      <div className="flex justify-between items-center border-b border-[#E5E0D2] pb-2 mb-4">
                          <h3 className="text-sm font-semibold text-[#14213D]">Recent People</h3>
                          <span className="text-xs bg-[#EFEBE0] px-2 py-1 rounded font-semibold text-[#6B6960]">{selectedTenant.memberCount}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2">
                          {members.map(m => (
                              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors">
                                  <div>
                                      <p className="text-sm font-semibold text-[#14213D]">{m.firstName} {m.lastName}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-[10px] uppercase font-semibold ${m.pathway === 'Newcomer' ? 'text-[#14213D]' : 'text-[#1F2D52]'}`}>{m.pathway}</span>
                                          <span className="text-[10px] text-[#9E9D95]">• {new Date(m.joinedDate).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                                  <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-[#4F7E50]' : 'bg-[#9E9D95]'}`} />
                              </div>
                          ))}
                      </div>
                      <button
                        onClick={() => { setSubSearch(''); setTenantView('DATABASE'); }}
                        className="mt-4 w-full py-2 border border-dashed border-[#D8D2C2] rounded-xl text-[#6B6960] text-sm font-semibold hover:border-[#FCA311] hover:text-[#14213D] transition-colors flex items-center justify-center gap-2"
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
      <div className="bg-gradient-to-br from-[#14213D] to-[#1F2D52] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
             <div>
                 <div className="flex items-center gap-2 mb-2 text-[#FCA311] font-semibold uppercase tracking-[0.08em] text-[11px]">
                    <IoShieldCheckmarkOutline /> System Administration
                 </div>
                 <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Super Admin Console</h1>
                 <p className="text-white/70 max-w-xl text-sm md:text-base">
                    Overview of all registered churches, billing, user activity, and system health status.
                 </p>
             </div>
             <div className="flex flex-wrap gap-1 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
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
              {/* Stats Grid — KPI tile pattern */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex items-center justify-between">
                      <div>
                          <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em]">Total Churches</p>
                          <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-1">{totalTenants}</h3>
                          <p className="text-[10px] text-[#4F7E50] font-semibold mt-2">+2 this week</p>
                      </div>
                      <div className="p-3 bg-[#FAF8F4] text-[#14213D] rounded-xl"><IoBusinessOutline size={24}/></div>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex items-center justify-between">
                      <div>
                          <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em]">Global Members</p>
                          <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-1">{totalMembers.toLocaleString()}</h3>
                          <p className="text-[10px] text-[#9E9D95] font-semibold mt-2">Across all instances</p>
                      </div>
                      <div className="p-3 bg-[#FAF8F4] text-[#1F2D52] rounded-xl"><IoPeopleOutline size={24}/></div>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('BILLING')}>
                      <div>
                          <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em]">MRR (Est.)</p>
                          <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#4F7E50] mt-1">${monthlyRevenue.toLocaleString()}</h3>
                          <p className="text-[10px] text-[#4F7E50] font-semibold mt-2 flex items-center gap-1"><IoPulseOutline/> +8.4% vs last mo</p>
                      </div>
                      <div className="p-3 bg-[#FAF8F4] text-[#4F7E50] rounded-xl"><IoCashOutline size={24}/></div>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('LOGS')}>
                      <div>
                          <p className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em]">System Alerts</p>
                          <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#B42626] mt-1">{criticalErrors}</h3>
                          <p className="text-[10px] text-[#B42626] font-semibold mt-2">Requires attention</p>
                      </div>
                      <div className="p-3 bg-[#FBE5E5] text-[#B42626] rounded-xl"><IoAlertCircleOutline size={24}/></div>
                  </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 h-96 flex flex-col">
                      <h3 className="text-sm font-semibold text-[#14213D] mb-6">Total Member Growth</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14213D" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#14213D" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Area type="monotone" dataKey="value" stroke="#14213D" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 h-96 flex flex-col">
                      <h3 className="text-sm font-semibold text-[#14213D] mb-6">System Load (Req/Min)</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={loadData}>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} />
                                <Tooltip cursor={{fill: '#FAF8F4'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Bar dataKey="req" radius={[4, 4, 0, 0]} barSize={40}>
                                    {loadData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.req > 1000 ? '#B42626' : '#1F2D52'} />
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
          <div className="animate-fade-in bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E5E0D2] flex justify-between items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                      <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" />
                      <input
                        type="text"
                        placeholder="Search churches or domains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D8D2C2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                      />
                  </div>
                  <div className="flex gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9D95] self-center">Showing {filteredTenants.length} of {totalTenants}</span>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead>
                          <tr>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Church Name</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Admin Email</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Plan</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Members</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Status</th>
                              <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] border-b border-[#E5E0D2]">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredTenants.map(tenant => (
                              <tr
                                key={tenant.id}
                                onClick={() => { setSelectedTenant(tenant); setTenantView('DETAILS'); }}
                                className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4] cursor-pointer transition-colors"
                              >
                                  <td className="px-6 py-4">
                                      <p className="font-semibold text-[#14213D]">{tenant.name}</p>
                                      <p className="text-xs text-[#9E9D95]">{tenant.domain}.shepherd.app</p>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-[#1F2D52]">{tenant.adminEmail}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${tenant.plan === 'Enterprise' ? 'bg-[#EFEBE0] text-[#14213D]' : tenant.plan === 'Pro' ? 'bg-[#FAF8F4] text-[#1F2D52]' : 'bg-[#FAF8F4] text-[#6B6960]'}`}>
                                          {tenant.plan}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-[#1F2D52]">{tenant.memberCount.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${getStatusText(tenant.status)}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(tenant.status)}`} />
                                          {tenant.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                      {tenant.status === 'Active' ? (
                                          <button onClick={() => updateTenantStatus(tenant.id, 'Suspended')} className="text-xs font-semibold text-[#B42626] hover:bg-[#FBE5E5] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#B42626]/20 transition-colors">
                                              Suspend
                                          </button>
                                      ) : (
                                          <button onClick={() => updateTenantStatus(tenant.id, 'Active')} className="text-xs font-semibold text-[#4F7E50] hover:bg-[#FAF8F4] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#4F7E50]/20 transition-colors">
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
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-2 text-[#4F7E50]">
                          <IoCashOutline size={20} />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Monthly Revenue</span>
                      </div>
                      <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D]">${monthlyRevenue.toLocaleString()}</h3>
                      <p className="text-xs text-[#9E9D95] mt-1">Based on active subscriptions</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-2">
                          <IoCardOutline size={20} className="text-[#6B6960]" />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Active Subscriptions</span>
                      </div>
                      <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D]">{activeTenants}</h3>
                      <p className="text-xs text-[#9E9D95] mt-1">Paying customers</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-2 text-[#B8732A]">
                          <IoWarningOutline size={20} />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Failed Payments</span>
                      </div>
                      <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D]">2</h3>
                      <p className="text-xs text-[#9E9D95] mt-1">Requires follow-up</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-6 h-96 flex flex-col">
                      <h3 className="text-sm font-semibold text-[#14213D] mb-6">Revenue Trend (6 Months)</h3>
                      <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F7E50" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#4F7E50" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9E9D95'}} tickFormatter={(val) => `$${val/1000}k`} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                <Area type="monotone" dataKey="amount" stroke="#4F7E50" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Transaction List */}
                  <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden flex flex-col h-96">
                      <div className="p-6 border-b border-[#E5E0D2]">
                          <h3 className="text-sm font-semibold text-[#14213D]">Recent Transactions</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                          {transactions.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between p-4 border-b border-[#E5E0D2] hover:bg-[#FAF8F4]">
                                  <div>
                                      <p className="text-sm font-semibold text-[#14213D]">{tx.tenant}</p>
                                      <p className="text-xs text-[#6B6960]">{new Date(tx.date).toLocaleDateString()} • {tx.plan}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-semibold text-[#14213D]">${tx.amount}</p>
                                      <span className={`text-[10px] uppercase font-semibold ${tx.status === 'Success' ? 'text-[#4F7E50]' : 'text-[#B42626]'}`}>{tx.status}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="p-4 bg-[#FAF8F4] text-center border-t border-[#E5E0D2]">
                          <button className="text-xs font-semibold text-[#14213D] hover:underline">View All Transactions</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'SETTINGS' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#E5E0D2] bg-[#FAF8F4]">
                      <h3 className="text-sm font-semibold text-[#14213D] flex items-center gap-2">
                          <IoSettingsOutline /> Global Configuration
                      </h3>
                      <p className="text-sm text-[#6B6960] mt-1">Manage system-wide settings that affect all tenants.</p>
                  </div>

                  <div className="p-6 space-y-6">
                      {/* Maintenance Mode */}
                      <div className="flex items-center justify-between p-4 bg-[#FBE5E5]/40 rounded-xl border border-[#B42626]/10">
                          <div className="flex gap-4">
                              <div className="p-3 bg-[#FBE5E5] text-[#B42626] rounded-lg h-fit"><IoStopCircleOutline size={24} /></div>
                              <div>
                                  <h4 className="font-semibold text-[#14213D]">Maintenance Mode</h4>
                                  <p className="text-xs text-[#6B6960] max-w-sm mt-1">Prevents non-admin users from logging in. Use for system upgrades.</p>
                              </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={sysSettings.maintenanceMode} onChange={() => setSysSettings({...sysSettings, maintenanceMode: !sysSettings.maintenanceMode})} />
                              <div className="w-11 h-6 bg-[#EFEBE0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B42626]"></div>
                          </label>
                      </div>

                      {/* Feature Flags */}
                      <div className="space-y-4">
                          <h4 className="text-[11px] font-semibold text-[#6B6960] uppercase tracking-[0.08em]">Feature Flags</h4>

                          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D2]">
                              <div>
                                  <p className="font-semibold text-[#14213D] text-sm">Enable Beta AI Features</p>
                                  <p className="text-xs text-[#6B6960]">Rolls out new Gemini 2.5 models to all tenants.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={sysSettings.betaFeatures} onChange={() => setSysSettings({...sysSettings, betaFeatures: !sysSettings.betaFeatures})} />
                                  <div className="w-9 h-5 bg-[#EFEBE0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FCA311]"></div>
                              </label>
                          </div>

                          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D2]">
                              <div>
                                  <p className="font-semibold text-[#14213D] text-sm">Allow New Registrations</p>
                                  <p className="text-xs text-[#6B6960]">Public sign-up page visibility.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={sysSettings.registrationsOpen} onChange={() => setSysSettings({...sysSettings, registrationsOpen: !sysSettings.registrationsOpen})} />
                                  <div className="w-9 h-5 bg-[#EFEBE0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FCA311]"></div>
                              </label>
                          </div>
                      </div>

                      {/* System Announcement */}
                      <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] block mb-1.5">System Announcement Banner</label>
                          <div className="relative">
                              <IoMegaphoneOutline className="absolute left-3 top-3 text-[#9E9D95]" />
                              <input
                                type="text"
                                className="bg-white border border-[#D8D2C2] rounded-lg pl-9 pr-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                                placeholder="e.g. Scheduled maintenance on Sunday at 2 AM..."
                                value={sysSettings.announcement}
                                onChange={(e) => setSysSettings({...sysSettings, announcement: e.target.value})}
                              />
                          </div>
                          <p className="text-[10px] text-[#9E9D95] mt-1">This message will appear at the top of every tenant's dashboard.</p>
                      </div>
                  </div>
                  <div className="p-4 bg-[#FAF8F4] border-t border-[#E5E0D2] text-right">
                      <button className="bg-[#14213D] text-white rounded-lg px-6 py-2 text-sm font-semibold hover:bg-[#1F2D52] transition-colors">Save Configuration</button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="animate-fade-in bg-[#14213D] rounded-2xl border border-[#1F2D52] shadow-lg overflow-hidden flex flex-col h-[600px]">
              <div className="bg-[#0A1220] p-4 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#4F7E50] text-sm font-mono">
                      <IoTerminalOutline /> System Logs
                  </div>
                  <div className="flex gap-1">
                      {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setLogFilter(f)}
                            className={`px-3 py-1 rounded text-xs font-semibold font-mono transition-colors ${logFilter === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                          >
                              {f}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs bg-[#0A1220] text-gray-300 scrollbar-thin">
                  {filteredLogs.map(log => (
                      <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded">
                          <span className="text-white/30 w-36 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className={`w-16 shrink-0 ${getLogLevelColor(log.level)}`}>{log.level}</span>
                          <span className="text-[#FCA311]/70 w-16 shrink-0">[{log.module}]</span>
                          <span className="flex-1 text-white/80">{log.message}</span>
                          <span className="text-white/20 w-24 text-right truncate">{log.ip}</span>
                          <span className="text-white/30 w-16 text-right">{log.latency}ms</span>
                      </div>
                  ))}
                  {filteredLogs.length === 0 && (
                      <div className="text-center py-10 text-white/20 italic">No logs found matching filter.</div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
