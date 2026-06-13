
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
      <span className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
        {isNewcomer ? 'Newcomer' : 'New Believer'}
      </span>
    );
  };

  const getStatusDot = (status: MemberStatus | string) => {
    const s = String(status).toUpperCase();
    if (s === 'ACTIVE') return { color: '#4F7E50', label: 'Active' };
    if (s === 'INTEGRATED') return { color: '#4F7E50', label: 'Integrated' };
    return { color: '#8B8B8B', label: String(status) };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Total People</p>
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">{memberLabel}</p>
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-2">{stats.churchMembers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Active</p>
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-[#4F7E50] mt-2">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Newcomers</p>
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-2">{stats.newcomers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">New Believers</p>
          <p className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D] mt-2">{stats.newBelievers}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] overflow-hidden">
        {/* Controls */}
        <div className="p-4 md:p-6 border-b border-[#E5E0D2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#14213D]">
              <IoPeopleOutline size={24} />
              <h2 className="text-xl font-semibold text-[#14213D]">Church Database</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Filter Tabs */}
            <div className="flex bg-[#FAF8F4] rounded-full p-1">
              <button
                onClick={() => { setFilterTab('ALL'); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  filterTab === 'ALL'
                    ? 'bg-white border border-[#D8D2C2] text-[#14213D]'
                    : 'text-[#6B6960]'
                }`}
              >
                All People ({stats.total})
              </button>
              <button
                onClick={() => { setFilterTab('MEMBERS'); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  filterTab === 'MEMBERS'
                    ? 'bg-white border border-[#D8D2C2] text-[#14213D]'
                    : 'text-[#6B6960]'
                }`}
              >
                {memberLabel} ({stats.churchMembers})
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or tithe #..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-10 py-2.5 bg-[#FAF8F4] border border-[#E5E0D2] rounded-lg text-sm text-[#1F2D52] w-full focus:outline-none focus:border-[#14213D] placeholder:text-[#9E9D95]"
              />
              {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9D95]">
                      <IoCloseCircle size={18} />
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E0D2]">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Name</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Phone</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Pathway</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Joined</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedMembers.map((member) => {
                const statusInfo = getStatusDot(member.status);
                return (
                  <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-sm shrink-0">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-[#1F2D52]">{member.firstName} {member.lastName}</p>
                            {member.isChurchMember && <IoIdCardOutline size={14} className="text-[#6B6960]" title={memberLabel} />}
                          </div>
                          <p className="text-xs text-[#9E9D95]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6960]">{member.phone}</td>
                    <td className="px-6 py-4">{getPathwayBadge(member)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusInfo.color }} />
                        <span className="text-sm text-[#1F2D52]">{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6960]">{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-[#9E9D95] hover:text-[#14213D] hover:bg-[#EFEBE0] rounded-full transition-colors" title="Quick Message">
                              <IoChatbubbleEllipsesOutline size={18} />
                          </button>
                          <button className="p-2 text-[#9E9D95] hover:text-[#14213D] hover:bg-[#EFEBE0] rounded-full transition-colors">
                              <IoChevronForwardOutline size={18} />
                          </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
              {displayedMembers.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#9E9D95]">
                          <IoPeopleOutline size={32} className="mx-auto mb-2 opacity-50"/>
                          <p className="text-sm">No people found.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-[#E5E0D2]">
            {displayedMembers.map((member) => (
                <div key={member.id} onClick={() => setSelectedMember(member)} className="p-4 active:bg-[#FAF8F4]">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-sm shrink-0">
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                             </div>
                             <div>
                                <div className="flex items-center gap-1">
                                  <p className="font-semibold text-sm text-[#1F2D52]">{member.firstName} {member.lastName}</p>
                                  {member.isChurchMember && <IoIdCardOutline size={12} className="text-[#6B6960]" />}
                                </div>
                                <p className="text-xs text-[#9E9D95]">{member.email}</p>
                             </div>
                        </div>
                        {getPathwayBadge(member)}
                    </div>
                    <div className="flex gap-2 pl-[52px]">
                        <button
                            onClick={(e) => handleQuickAction(e, 'call', member.phone)}
                            className="flex-1 py-2 bg-white border border-[#D8D2C2] rounded-lg text-xs font-semibold text-[#1F2D52] hover:bg-[#FAF8F4] transition-colors"
                        >
                            <IoCallOutline className="inline mr-1"/> Call
                        </button>
                        <button
                            onClick={(e) => handleQuickAction(e, 'email', member.email)}
                            className="flex-1 py-2 bg-white border border-[#D8D2C2] rounded-lg text-xs font-semibold text-[#1F2D52] hover:bg-[#FAF8F4] transition-colors"
                        >
                            <IoMailOutline className="inline mr-1"/> Email
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E0D2] bg-[#FAF8F4] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#6B6960]">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} people (Page {currentPage} of {totalPages})
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-transparent hover:bg-white hover:border-[#D8D2C2] disabled:opacity-30 text-[#1F2D52] transition-colors"
                    >
                        <IoChevronBackOutline size={16} />
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-transparent hover:bg-white hover:border-[#D8D2C2] disabled:opacity-30 text-[#1F2D52] transition-colors"
                    >
                        <IoChevronForwardOutline size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {activeMember && <MemberDetail member={activeMember} onClose={() => setSelectedMember(null)} onUpdateMember={updateMember} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />}
    </div>
  );
};

export default MembersPage;
