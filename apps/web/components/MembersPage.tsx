
import React, { useState, useMemo } from 'react';
import { IoSearchOutline, IoChevronForwardOutline, IoChatbubbleEllipsesOutline, IoChevronBackOutline, IoCallOutline, IoMailOutline, IoCloseCircle, IoIdCardOutline, IoPeopleOutline } from 'react-icons/io5';
import { Member, PathwayType, MemberStatus } from '../types';
import MemberDetail from './MemberDetail';
import { useAppContext } from '../context/AppContext';

const MembersPage: React.FC = () => {
  const { members, updateMember, newcomerStages, newBelieverStages, churchSettings } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'MEMBERS'>('ALL');

  const memberLabel = churchSettings.memberTerm || 'Members';
  const itemsPerPage = 10;

  // Summary stats
  const stats = useMemo(() => {
    const total = members.length;
    const churchMembers = members.filter(m => m.isChurchMember).length;
    const active = members.filter(m => m.status === MemberStatus.ACTIVE || String(m.status).toUpperCase() === 'ACTIVE').length;
    const newcomers = members.filter(m => m.pathway === PathwayType.NEWCOMER || (m as any).pathway === 'NEWCOMER').length;
    const newBelievers = members.filter(m => m.pathway === PathwayType.NEW_BELIEVER || (m as any).pathway === 'NEW_BELIEVER').length;
    return { total, churchMembers, active, newcomers, newBelievers };
  }, [members]);

  // Filter based on tab and search
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Tab filter
      if (filterTab === 'MEMBERS' && !member.isChurchMember) return false;

      // Search filter
      const matchesSearch = (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.titheNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [members, searchTerm, filterTab]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const displayedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Ensure modal receives the latest version of the member from context
  const activeMember = selectedMember ? members.find(m => m.id === selectedMember.id) || selectedMember : null;

  const handleQuickAction = (e: React.MouseEvent, type: 'call' | 'email', value: string) => {
    e.stopPropagation();
    window.location.href = type === 'call' ? `tel:${value}` : `mailto:${value}`;
  };

  const getPathwayBadge = (member: Member) => {
    const pathway = member.pathway;
    const isNewcomer = pathway === PathwayType.NEWCOMER || pathway === ('NEWCOMER' as any);
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
        isNewcomer ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
      }`}>
        {isNewcomer ? 'Newcomer' : 'New Believer'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Total People</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">{memberLabel}</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats.churchMembers}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Newcomers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.newcomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">New Believers</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.newBelievers}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Controls */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
              <IoPeopleOutline size={24} />
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Church Database</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button
                onClick={() => { setFilterTab('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filterTab === 'ALL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All People ({stats.total})
              </button>
              <button
                onClick={() => { setFilterTab('MEMBERS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filterTab === 'MEMBERS' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {memberLabel} ({stats.churchMembers})
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by name, email, or tithe #..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-primary" />
              {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><IoCloseCircle size={18} /></button>}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Phone</th>
                <th className="px-6 py-4 text-left">Pathway</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedMembers.map((member) => (
                <tr key={member.id} onClick={() => setSelectedMember(member)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-sm">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{member.firstName} {member.lastName}</p>
                          {member.isChurchMember && <IoIdCardOutline size={14} className="text-primary" title={memberLabel} />}
                        </div>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                  <td className="px-6 py-4">{getPathwayBadge(member)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                      String(member.status).toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      String(member.status).toUpperCase() === 'INTEGRATED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-full border border-transparent hover:border-gray-200 shadow-sm" title="Quick Message"><IoChatbubbleEllipsesOutline size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-gray-800 hover:bg-white rounded-full border border-transparent hover:border-gray-200 shadow-sm"><IoChevronForwardOutline size={18} /></button>
                      </div>
                  </td>
                </tr>
              ))}
              {displayedMembers.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><IoPeopleOutline size={32} className="mx-auto mb-2 opacity-50"/><p>No people found.</p></td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
            {displayedMembers.map((member) => (
                <div key={member.id} onClick={() => setSelectedMember(member)} className="p-4 active:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-sm">
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                             </div>
                             <div>
                                <div className="flex items-center gap-1">
                                  <p className="font-semibold text-gray-800">{member.firstName} {member.lastName}</p>
                                  {member.isChurchMember && <IoIdCardOutline size={12} className="text-primary" />}
                                </div>
                                <p className="text-xs text-gray-500">{member.email}</p>
                             </div>
                        </div>
                        {getPathwayBadge(member)}
                    </div>
                    <div className="flex gap-2 pl-[52px]">
                        <button onClick={(e) => handleQuickAction(e, 'call', member.phone)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600"><IoCallOutline className="inline mr-1"/> Call</button>
                        <button onClick={(e) => handleQuickAction(e, 'email', member.email)} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600"><IoMailOutline className="inline mr-1"/> Email</button>
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} people (Page {currentPage} of {totalPages})</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 disabled:opacity-30"><IoChevronBackOutline size={16} /></button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 disabled:opacity-30"><IoChevronForwardOutline size={16} /></button>
                </div>
            </div>
        )}
      </div>

      {activeMember && <MemberDetail member={activeMember} onClose={() => setSelectedMember(null)} onUpdateMember={updateMember} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />}
    </div>
  );
};

export default MembersPage;
