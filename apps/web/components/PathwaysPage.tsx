
import React, { useState } from 'react';
import { Member, PathwayType, MemberStatus } from '../types';
import { IoSearchOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';
import MemberDetail from './MemberDetail';

const PathwaysPage: React.FC = () => {
  const { members, newcomerStages, newBelieverStages, updateMember } = useAppContext();

  const [activePathway, setActivePathway] = useState<PathwayType>(PathwayType.NEWCOMER);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const currentStages = activePathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;

  // Filter members for columns
  const filteredMembers = members.filter(m =>
    m.pathway === activePathway &&
    m.status !== MemberStatus.INACTIVE &&
    (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ensure modal receives the latest version of the member from context
  const activeMember = selectedMember ? members.find(m => m.id === selectedMember.id) || selectedMember : null;

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
          if (member && member.currentStageId !== targetStageId) {
              const updatedMember = {
                  ...member,
                  currentStageId: targetStageId,
                  notes: [`[System] Moved to stage: ${currentStages.find(s => s.id === targetStageId)?.name} via board`, ...(member.notes || [])]
              };
              updateMember(updatedMember);
          }
      }
      setDraggedMemberId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Page header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#14213D]">Pathways</h2>
              {/* Pathway pill tabs */}
              <div className="flex bg-[#FAF8F4] p-1 rounded-full">
                  <button
                      onClick={() => setActivePathway(PathwayType.NEWCOMER)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          activePathway === PathwayType.NEWCOMER
                              ? 'bg-white text-[#14213D] shadow-sm'
                              : 'text-[#6B6960] hover:text-[#1F2D52]'
                      }`}
                  >
                      Newcomer
                  </button>
                  <button
                      onClick={() => setActivePathway(PathwayType.NEW_BELIEVER)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          activePathway === PathwayType.NEW_BELIEVER
                              ? 'bg-white text-[#14213D] shadow-sm'
                              : 'text-[#6B6960] hover:text-[#1F2D52]'
                      }`}
                  >
                      New Believer
                  </button>
              </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9D95]" size={16} />
              <input
                  type="text"
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-[#D8D2C2] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
              />
          </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4">
          <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden h-full flex flex-col">
              <div className="flex gap-0 min-w-max h-full flex-1 overflow-x-auto p-4 gap-3">
                  {currentStages.map((stage) => {
                      const stageMembers = filteredMembers.filter(m => m.currentStageId === stage.id);
                      return (
                          <div
                              key={stage.id}
                              className="min-w-[280px] max-w-[280px] flex flex-col h-full"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, stage.id)}
                          >
                              {/* Column header */}
                              <div className="px-4 py-3 flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 group relative">
                                      <span className="text-sm font-semibold text-[#14213D]">{stage.name}</span>
                                      {stage.description && (
                                          <div className="relative z-50">
                                              <IoInformationCircleOutline className="text-[#9E9D95] cursor-help hover:text-[#6B6960]" size={14} />
                                              <div className="absolute left-0 top-6 w-48 p-2 bg-[#14213D] text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                                  {stage.description}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                                  <span className="bg-[#14213D] text-white text-xs font-semibold rounded-full px-2.5 py-0.5">
                                      {stageMembers.length}
                                  </span>
                              </div>

                              {/* Column body */}
                              <div className={`bg-[#EFEBE0] rounded-xl p-2 flex-1 overflow-y-auto space-y-2 transition-colors scrollbar-thin ${
                                  draggedMemberId ? 'ring-2 ring-[#FCA311]/30' : ''
                              }`}>
                                  {stageMembers.map(member => {
                                      // Days in stage
                                      const joinDays = member.lastStageChangeDate
                                          ? Math.floor((Date.now() - new Date(member.lastStageChangeDate).getTime()) / 86400000)
                                          : Math.floor((Date.now() - new Date(member.joinedDate).getTime()) / 86400000);
                                      const isStalled = joinDays > 30;

                                      return (
                                          <div
                                              key={member.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, member.id)}
                                              onClick={() => setSelectedMember(member)}
                                              className="bg-white rounded-xl border border-[#E5E0D2] shadow-sm p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow group"
                                          >
                                              <div className="flex items-center gap-2.5 mb-2.5">
                                                  {member.photoUrl ? (
                                                      <img src={member.photoUrl} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                                                  ) : (
                                                      <div className="w-8 h-8 rounded-full bg-[#EFEBE0] text-[#6B6960] text-xs font-semibold flex items-center justify-center shrink-0">
                                                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                                      </div>
                                                  )}
                                                  <span className="font-semibold text-sm text-[#14213D] truncate flex-1">
                                                      {member.firstName} {member.lastName}
                                                  </span>
                                                  {member.status === MemberStatus.INTEGRATED && (
                                                      <span className="shrink-0 text-[10px] bg-[#F0FAF5] text-[#4F7E50] px-2 py-0.5 rounded-[4px] font-semibold">Done</span>
                                                  )}
                                              </div>

                                              {/* Tags */}
                                              {(member.tags || []).length > 0 && (
                                                  <div className="flex flex-wrap gap-1 mb-2.5">
                                                      {(member.tags || []).slice(0, 3).map(tag => (
                                                          <span key={tag} className="bg-[#EFEBE0] text-[#6B6960] text-[11px] font-semibold rounded-[4px] px-2 py-0.5">
                                                              {tag}
                                                          </span>
                                                      ))}
                                                  </div>
                                              )}

                                              {/* Meta row */}
                                              <div className="flex items-center justify-between">
                                                  <span className="text-[11px] text-[#6B6960]">
                                                      {joinDays}d in stage
                                                  </span>
                                                  {isStalled && (
                                                      <span className="bg-[#F7E8D8] text-[#B8732A] text-xs font-medium rounded-[4px] px-2 py-0.5">
                                                          Stalled
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })}

                                  {stageMembers.length === 0 && (
                                      <div className="flex items-center justify-center h-16 text-[11px] text-[#9E9D95] italic">
                                          No people here
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {activeMember && (
          <MemberDetail
              member={activeMember}
              onClose={() => setSelectedMember(null)}
              onUpdateMember={updateMember}
              newcomerStages={newcomerStages}
              newBelieverStages={newBelieverStages}
          />
      )}
    </div>
  );
};

export default PathwaysPage;
