
import React, { useState } from 'react';
import { Member, PathwayType, Stage, MemberStatus } from '../types';
import { IoSearchOutline, IoEllipsisHorizontal } from 'react-icons/io5';

interface PathwaysPageProps {
  members: Member[];
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
  onSelectMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
}

const PathwaysPage: React.FC<PathwaysPageProps> = ({ members, newcomerStages, newBelieverStages, onSelectMember, onUpdateMember }) => {
  const [activePathway, setActivePathway] = useState<PathwayType>(PathwayType.NEWCOMER);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);

  const currentStages = activePathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;

  // Filter members by pathway and search
  const filteredMembers = members.filter(m => 
    m.pathway === activePathway && 
    m.status !== MemberStatus.INACTIVE &&
    (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // DnD Handlers
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
                  // Optionally add a note about the move
                  notes: [`[System] Moved to stage: ${currentStages.find(s => s.id === targetStageId)?.name} via board`, ...member.notes]
              };
              onUpdateMember(updatedMember);
          }
      }
      setDraggedMemberId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">Pathways</h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActivePathway(PathwayType.NEWCOMER)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathway === PathwayType.NEWCOMER ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Newcomer
                  </button>
                  <button 
                    onClick={() => setActivePathway(PathwayType.NEW_BELIEVER)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activePathway === PathwayType.NEW_BELIEVER ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      New Believer
                  </button>
              </div>
          </div>

          <div className="relative w-full md:w-64">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search people..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full shadow-sm"
              />
          </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full">
              {currentStages.map(stage => {
                  const stageMembers = filteredMembers.filter(m => m.currentStageId === stage.id);
                  
                  return (
                      <div 
                        key={stage.id} 
                        className="w-80 flex flex-col h-full max-h-full"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-3 px-1">
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-700 text-sm">{stage.name}</span>
                                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{stageMembers.length}</span>
                              </div>
                          </div>

                          {/* Cards Container */}
                          {/* Added scrollbar hiding utility or custom scrollbar for better aesthetics */}
                          <div className={`
                                bg-gray-100/50 rounded-xl p-2 flex-1 overflow-y-auto border space-y-2 transition-colors 
                                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                                ${draggedMemberId ? 'border-primary/20 bg-blue-50/30' : 'border-gray-200/50'}
                          `}>
                              {stageMembers.map(member => (
                                  <div 
                                    key={member.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, member.id)}
                                    onClick={() => onSelectMember(member)}
                                    className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all group relative"
                                  >
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                              {member.photoUrl ? (
                                                  <img src={member.photoUrl} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                                              ) : (
                                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                      {member.firstName.charAt(0)}
                                                  </div>
                                              )}
                                              <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-gray-800 text-sm truncate block">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                              </div>
                                          </div>
                                          {member.status === MemberStatus.INTEGRATED && (
                                              <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold ml-2">Done</span>
                                          )}
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1 mb-2">
                                          {member.tags.slice(0, 3).map(tag => (
                                              <span key={tag} className="text-[9px] bg-gray-50 border border-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                  {tag}
                                              </span>
                                          ))}
                                      </div>

                                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                                          <span>{new Date(member.joinedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                          <IoEllipsisHorizontal className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                  </div>
                              ))}
                              
                              {stageMembers.length === 0 && (
                                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs pointer-events-none">
                                      Drop Here
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default PathwaysPage;
