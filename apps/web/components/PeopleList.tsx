
import React, { useState, useMemo } from 'react';
import { IoSearchOutline, IoAddOutline, IoChevronForwardOutline, IoChatbubbleEllipsesOutline, IoChevronBackOutline, IoCallOutline, IoMailOutline, IoCloseCircle, IoGridOutline, IoListOutline, IoEllipsisHorizontal, IoInformationCircleOutline } from 'react-icons/io5';
import { Member, PathwayType, MemberStatus } from '../types';
import AddMemberModal from './AddMemberModal';
import MemberDetail from './MemberDetail';
import { useAppContext } from '../context/AppContext';

const PeopleList: React.FC = () => {
  const { members, addMembers, updateMember, newcomerStages, newBelieverStages, churchSettings } = useAppContext();

  const [viewMode, setViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPathway, setFilterPathway] = useState<PathwayType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Board View DnD State
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);

  const itemsPerPage = 8;

  // Optimized Filtering with useMemo
  // EXCLUDE members who are officially Church Members from this view
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Exclude confirmed church members from the "Pathway" view
      if (member.isChurchMember) return false;

      const matchesSearch = (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPathway = filterPathway === 'ALL' || member.pathway === filterPathway;
      const matchesStatus = filterStatus === 'ALL' || member.status === filterStatus;
      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [members, searchTerm, filterPathway, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const displayedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Ensure modal receives the latest version of the member from context
  const activeMember = selectedMember ? members.find(m => m.id === selectedMember.id) || selectedMember : null;

  const stats = useMemo(() => ({
      total: members.filter(m => !m.isChurchMember).length,
      activeNewcomers: members.filter(m => !m.isChurchMember && m.pathway === PathwayType.NEWCOMER && m.status === MemberStatus.ACTIVE).length,
      activeNewBelievers: members.filter(m => !m.isChurchMember && m.pathway === PathwayType.NEW_BELIEVER && m.status === MemberStatus.ACTIVE).length,
  }), [members]);

  // Board View Helpers
  const boardPathway = filterPathway === 'ALL' ? PathwayType.NEWCOMER : filterPathway;
  const boardStages = boardPathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;

  const getStageName = (member: Member) => {
    const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
    return stages.find(s => s.id === member.currentStageId)?.name || 'Unknown';
  };

  const handleQuickAction = (e: React.MouseEvent, type: 'call' | 'email', value: string) => {
    e.stopPropagation();
    window.location.href = type === 'call' ? `tel:${value}` : `mailto:${value}`;
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, memberId: string) => {
    setDraggedMemberId(memberId);
    e.dataTransfer.setData('text/plain', memberId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('text/plain');

    if (memberId) {
        const member = members.find(m => m.id === memberId);
        // Only allow drop if it matches the current board pathway
        if (member && member.pathway === boardPathway && member.currentStageId !== targetStageId) {
            const updatedMember = {
                ...member,
                currentStageId: targetStageId,
                notes: [`[System] Moved to stage: ${boardStages.find(s => s.id === targetStageId)?.name} via board`, ...(member.notes || [])]
            };
            updateMember(updatedMember);
        }
    }
    setDraggedMemberId(null);
  };

  return (
    <div className={`space-y-6 animate-fade-in ${viewMode === 'BOARD' ? 'h-[calc(100vh-140px)] flex flex-col' : ''}`}>
      {/* Top Stats - Only visible in List View */}
      {viewMode === 'LIST' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D2] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Total Walkers</p>
                  <p className="text-2xl font-bold text-[#14213D]">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#FAF8F4] text-[#14213D] flex items-center justify-center font-bold text-sm">All</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D2] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Active Newcomers</p>
                  <p className="text-2xl font-bold text-[#14213D]">{stats.activeNewcomers}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-sm">NC</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D2] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Active New Believers</p>
                  <p className="text-2xl font-bold text-[#14213D]">{stats.activeNewBelievers}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#EFEBE0] text-[#4F7E50] flex items-center justify-center font-bold text-sm">NB</div>
            </div>
        </div>
      )}

      <div className={`bg-white rounded-2xl shadow-sm border border-[#E5E0D2] overflow-hidden flex flex-col ${viewMode === 'BOARD' ? 'flex-1' : ''}`}>
        {/* Controls */}
        <div className="p-4 md:p-6 border-b border-[#E5E0D2] flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-lg md:text-xl font-bold text-[#14213D]">Pathway Walkers</h2>
              {/* View Toggle */}
              <div className="bg-[#FAF8F4] rounded-full p-1 inline-flex">
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'LIST' ? 'bg-white border border-[#D8D2C2] text-[#14213D] shadow-sm' : 'text-[#6B6960] hover:text-[#14213D]'}`}
                    title="List View"
                  >
                      <IoListOutline size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('BOARD')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'BOARD' ? 'bg-white border border-[#D8D2C2] text-[#14213D] shadow-sm' : 'text-[#6B6960] hover:text-[#14213D]'}`}
                    title="Board View"
                  >
                      <IoGridOutline size={18} />
                  </button>
              </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-64">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" size={18} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-10 bg-white border border-[#D8D2C2] rounded-lg py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9D95] hover:text-[#6B6960]">
                  <IoCloseCircle size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                <select
                  className="flex-1 md:flex-none bg-white border border-[#D8D2C2] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                  value={filterPathway}
                  onChange={(e) => { setFilterPathway(e.target.value as PathwayType | 'ALL'); setCurrentPage(1); }}
                >
                    <option value="ALL">All Pathways</option>
                    <option value={PathwayType.NEWCOMER}>Newcomers</option>
                    <option value={PathwayType.NEW_BELIEVER}>New Believers</option>
                </select>
                <select
                  className="flex-1 md:flex-none bg-white border border-[#D8D2C2] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value as MemberStatus | 'ALL'); setCurrentPage(1); }}
                >
                    <option value="ALL">All Statuses</option>
                    <option value={MemberStatus.ACTIVE}>Active</option>
                    <option value={MemberStatus.INTEGRATED}>Integrated</option>
                    <option value={MemberStatus.INACTIVE}>Inactive</option>
                </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-[#14213D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#1F2D52] transition-colors w-full md:w-auto"
            >
              <IoAddOutline size={18} /> Add
            </button>
          </div>
        </div>

        {/* --- LIST VIEW --- */}
        {viewMode === 'LIST' && (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E0D2]">
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Name</th>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Pathway</th>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Current Stage</th>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Joined</th>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Tags</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMembers.map((member) => (
                        <tr key={member.id} onClick={() => setSelectedMember(member)} className="border-b border-[#E5E0D2] hover:bg-[#FAF8F4] cursor-pointer transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-sm shrink-0">
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-[#14213D]">{member.firstName} {member.lastName}</p>
                                <p className="text-xs text-[#6B6960]">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
                              {member.pathway === PathwayType.NEWCOMER ? 'Newcomer' : 'New Believer'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#1F2D52]">{getStageName(member)}</span>
                                <span className={`text-[10px] uppercase font-bold mt-0.5 ${member.status === MemberStatus.INACTIVE ? 'text-[#B42626]' : 'text-[#9E9D95]'}`}>{member.status}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#6B6960] font-medium">{new Date(member.joinedDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(member.tags || []).slice(0, 2).map(tag => (
                                <span key={tag} className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">{tag}</span>
                              ))}
                              {(member.tags || []).length > 2 && (
                                <span className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">+{(member.tags || []).length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-[#9E9D95] hover:text-[#14213D] hover:bg-[#FAF8F4] rounded-full transition-colors" title="Quick Message">
                                  <IoChatbubbleEllipsesOutline size={18} />
                                </button>
                                <button className="p-2 text-[#9E9D95] hover:text-[#14213D] hover:bg-[#FAF8F4] rounded-full transition-colors">
                                  <IoChevronForwardOutline size={18} />
                                </button>
                              </div>
                          </td>
                        </tr>
                      ))}
                      {displayedMembers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#9E9D95]">
                            <IoSearchOutline size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>No members found.</p>
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
                                        <p className="font-semibold text-[#14213D]">{member.firstName} {member.lastName}</p>
                                        <p className="text-xs text-[#6B6960]">{member.email}</p>
                                     </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pl-[52px]">
                                <button
                                  onClick={(e) => handleQuickAction(e, 'call', member.phone)}
                                  className="flex-1 py-2 bg-white border border-[#D8D2C2] rounded-lg text-xs font-semibold text-[#14213D] hover:bg-[#FAF8F4] transition-colors"
                                >
                                  <IoCallOutline className="inline mr-1"/> Call
                                </button>
                                <button
                                  onClick={(e) => handleQuickAction(e, 'email', member.email)}
                                  className="flex-1 py-2 bg-white border border-[#D8D2C2] rounded-lg text-xs font-semibold text-[#14213D] hover:bg-[#FAF8F4] transition-colors"
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
                        <span className="text-xs text-[#6B6960]">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-[#E5E0D2] bg-white hover:bg-[#FAF8F4] disabled:opacity-30 transition-colors"
                            >
                              <IoChevronBackOutline size={16} />
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-[#E5E0D2] bg-white hover:bg-[#FAF8F4] disabled:opacity-30 transition-colors"
                            >
                              <IoChevronForwardOutline size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* --- BOARD VIEW --- */}
        {viewMode === 'BOARD' && (
           <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-[#FAF8F4]">
              <div className="flex gap-4 min-w-max h-full">
                  {boardStages.map(stage => {
                      const stageMembers = filteredMembers.filter(m => m.currentStageId === stage.id && m.pathway === boardPathway);

                      return (
                          <div key={stage.id} className="w-80 flex flex-col h-full max-h-full" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.id)}>
                              <div className="flex items-center justify-between mb-3 px-1">
                                  <div className="flex items-center gap-2 group relative">
                                      <span className="font-bold text-[#14213D] text-sm">{stage.name}</span>
                                      {stage.description && (
                                          <div className="relative z-50">
                                              <IoInformationCircleOutline className="text-[#9E9D95] cursor-help hover:text-[#14213D] transition-colors" size={16} />
                                              <div className="absolute left-0 top-6 w-48 p-2 bg-[#14213D] text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">{stage.description}</div>
                                          </div>
                                      )}
                                      <span className="bg-[#EFEBE0] text-[#6B6960] px-2 py-0.5 rounded-full text-xs font-bold">{stageMembers.length}</span>
                                  </div>
                              </div>
                              <div className={`bg-white rounded-2xl border p-2 flex-1 overflow-y-auto space-y-2 transition-colors scrollbar-thin ${draggedMemberId ? 'border-[#FCA311]/40 bg-[#FEECD0]/10' : 'border-[#E5E0D2]'}`}>
                                  {stageMembers.map(member => (
                                      <div
                                        key={member.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, member.id)}
                                        onClick={() => setSelectedMember(member)}
                                        className="bg-white p-3 rounded-xl shadow-sm border border-[#E5E0D2] hover:shadow-md cursor-grab active:cursor-grabbing group relative animate-fade-in transition-shadow"
                                      >
                                          <div className="flex justify-between items-start mb-2">
                                              <div className="flex items-center gap-2 min-w-0">
                                                  {member.photoUrl ? (
                                                    <img src={member.photoUrl} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                                                  ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center text-[10px] font-bold shrink-0">
                                                      {member.firstName.charAt(0)}
                                                    </div>
                                                  )}
                                                  <span className="font-semibold text-[#14213D] text-sm truncate block">{member.firstName} {member.lastName}</span>
                                              </div>
                                              {member.status === MemberStatus.INTEGRATED && (
                                                <span className="shrink-0 flex items-center gap-1 ml-2">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F7E50]" />
                                                  <span className="text-[10px] text-[#4F7E50] font-semibold">Done</span>
                                                </span>
                                              )}
                                          </div>
                                          <div className="flex flex-wrap gap-1 mb-2">
                                              {(member.tags || []).slice(0, 3).map(tag => (
                                                <span key={tag} className="bg-[#EFEBE0] text-[#6B6960] text-[9px] font-semibold rounded-[4px] px-1.5 py-0.5">{tag}</span>
                                              ))}
                                          </div>
                                          <div className="flex justify-between items-center text-[10px] text-[#9E9D95]">
                                            <span>{new Date(member.joinedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                            <IoEllipsisHorizontal className="opacity-0 group-hover:opacity-100" />
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
           </div>
        )}
      </div>

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onAddMembers={addMembers} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} churchSettings={churchSettings} existingMembers={members} />}
      {activeMember && <MemberDetail member={activeMember} onClose={() => setSelectedMember(null)} onUpdateMember={updateMember} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />}
    </div>
  );
};

export default PeopleList;
