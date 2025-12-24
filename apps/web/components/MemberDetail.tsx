
import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoCallOutline, IoMailOutline, IoSparklesOutline, IoPulseOutline, IoWarningOutline, IoCheckmarkCircleOutline, IoCalendarOutline,  IoPersonOutline, IoArrowForwardOutline, IoFlagOutline, IoDocumentTextOutline, IoAddCircleOutline, IoPencilOutline, IoTrashOutline, IoBookOutline, IoLinkOutline, IoLocationOutline, IoCalendarNumberOutline, IoMaleFemaleOutline, IoHeartOutline, IoEarthOutline, IoMedkitOutline, IoIdCardOutline, IoPeopleCircleOutline, IoCopyOutline, IoUnlinkOutline, IoRefreshOutline, IoSearchOutline, IoPersonAddOutline } from 'react-icons/io5';
import { Member, PathwayType, Stage, MemberStatus, Resource } from '../types';
import { analyzeMemberJourney, JourneyAnalysis } from '../services/geminiService';
import CommunicationLog from './CommunicationLog';
import { useAppContext } from '../context/AppContext';

interface MemberDetailProps {
  member: Member;
  onClose: () => void;
  onUpdateMember?: (updated: Member) => void;
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
}

const MemberDetail: React.FC<MemberDetailProps> = ({ member, onClose, onUpdateMember, newcomerStages, newBelieverStages }) => {
  const { members, churchSettings, updateMember: globalUpdateMember } = useAppContext();
  // AI State
  const [analysis, setAnalysis] = useState<JourneyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Note state
  const [newNote, setNewNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Resource State
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');

  // Family Linking State
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [familySearchTerm, setFamilySearchTerm] = useState('');

  // Personal Details Edit State
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      address: member.address || '',
      city: member.city || '',
      state: member.state || '',
      zip: member.zip || '',
      dateOfBirth: member.dateOfBirth || '',
      gender: member.gender || '',
      maritalStatus: member.maritalStatus || '',
      status: member.status,
      // New Fields
      nationality: member.nationality || '',
      emergencyContact: member.emergencyContact || '',
      spouseName: member.spouseName || '',
      spouseDob: member.spouseDob || '',
      titheNumber: member.titheNumber || '',
      joinedDate: member.joinedDate, // Allow editing joined date
      // Family Fields
      familyRole: member.familyRole || ''
  });

  const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
  const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
  const nextStage = stages[currentStageIndex + 1];
  const isLastStage = currentStageIndex === stages.length - 1;

  // Family Logic
  const familyMembers = member.familyId 
    ? members.filter(m => m.familyId === member.familyId && m.id !== member.id)
    : [];

  const linkableMembers = members.filter(m => {
      // Exclude self
      if (m.id === member.id) return false;
      // Exclude already in family
      if (member.familyId && m.familyId === member.familyId) return false;
      // Filter by search
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      return fullName.includes(familySearchTerm.toLowerCase());
  }).slice(0, 5); // Limit to 5 results

  const isMoreThan3Months = () => {
      const join = new Date(member.joinedDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - join.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 90;
  };

  // Fetch AI analysis on mount or member update
  useEffect(() => {
     const fetchAnalysis = async () => {
         setIsAnalyzing(true);
         const result = await analyzeMemberJourney(member, stages);
         setAnalysis(result);
         setIsAnalyzing(false);
     }
     fetchAnalysis();
  }, [member, stages]);

  const handleStartEditing = () => {
      setEditForm({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          address: member.address || '',
          city: member.city || '',
          state: member.state || '',
          zip: member.zip || '',
          dateOfBirth: member.dateOfBirth || '',
          gender: member.gender || '',
          maritalStatus: member.maritalStatus || '',
          status: member.status,
          nationality: member.nationality || '',
          emergencyContact: member.emergencyContact || '',
          spouseName: member.spouseName || '',
          spouseDob: member.spouseDob || '',
          titheNumber: member.titheNumber || '',
          joinedDate: member.joinedDate,
          familyRole: member.familyRole || ''
      });
      setIsEditingDetails(true);
  };

  const handleSaveDetails = () => {
      if (!onUpdateMember) return;
      const updatedMember: Member = {
          ...member,
          ...editForm,
          familyRole: (editForm.familyRole as 'Head' | 'Spouse' | 'Child' | 'Other' | undefined)
      };
      
      updatedMember.notes = [`[System] Personal details updated on ${new Date().toLocaleDateString()}`, ...member.notes];
      
      onUpdateMember(updatedMember);
      setIsEditingDetails(false);
  };

  const handleLinkToMember = (targetMember: Member) => {
      if (!onUpdateMember) return;

      // Scenario 1: Target has a family ID. We join it.
      if (targetMember.familyId) {
          const updatedCurrent = {
              ...member,
              familyId: targetMember.familyId,
              familyRole: member.familyRole || 'Other' as const // Default role if none
          };
          onUpdateMember(updatedCurrent);
      } 
      // Scenario 2: Target has NO family ID. We create one and assign to both.
      else {
          const newFamilyId = `fam-${Date.now()}`;
          
          // Update the target member via global context
          const updatedTarget = {
              ...targetMember,
              familyId: newFamilyId,
              familyRole: 'Head' as const // Default target to Head if starting new family
          };
          globalUpdateMember(updatedTarget);

          // Update current member
          const updatedCurrent = {
              ...member,
              familyId: newFamilyId,
              familyRole: 'Spouse' as const // Default current to Spouse/Other
          };
          onUpdateMember(updatedCurrent);
      }
      setIsLinkingFamily(false);
      setFamilySearchTerm('');
  };

  const handleUnlinkFamily = () => {
      if(!onUpdateMember || !window.confirm("Are you sure you want to remove this person from their household?")) return;
      
      const updatedMember = {
          ...member,
          familyId: undefined,
          familyRole: undefined,
          notes: [`[System] Unlinked from household on ${new Date().toLocaleDateString()}`, ...member.notes]
      };
      onUpdateMember(updatedMember);
  };

  const handlePromoteToMember = () => {
      if (!onUpdateMember || !window.confirm(`Are you sure you want to set ${member.firstName} as a ${churchSettings.memberTerm || 'Church Member'}?`)) return;
      
      const updatedMember = {
          ...member,
          isChurchMember: true,
          status: MemberStatus.INTEGRATED,
          notes: [`[System] Promoted to ${churchSettings.memberTerm || 'Church Member'} on ${new Date().toLocaleDateString()}`, ...member.notes]
      };
      onUpdateMember(updatedMember);
  };

  const handleAdvanceStage = () => {
      if (!onUpdateMember) return;

      const timestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      let updatedMember: Member;

      if (isLastStage) {
          // Complete the pathway
           updatedMember = {
              ...member,
              status: MemberStatus.INTEGRATED,
              notes: [`[${timestamp}] 🎉 Completed Pathway: ${member.pathway}`, ...member.notes]
          };
      } else if (nextStage) {
          // Move to next stage
          updatedMember = {
              ...member,
              currentStageId: nextStage.id,
              notes: [`[${timestamp}] Moved to stage: ${nextStage.name}`, ...member.notes]
          };
      } else {
          return;
      }

      onUpdateMember(updatedMember);
  };
  
  // Note Handlers
  const handleAddNote = () => {
      if (!newNote.trim() || !onUpdateMember) return;
      
      const timestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const noteEntry = `[${timestamp}] ${newNote.trim()}`;
      
      const updatedMember = {
          ...member,
          notes: [noteEntry, ...member.notes]
      };
      onUpdateMember(updatedMember);
      setNewNote('');
  };

  const startEditingNote = (index: number) => {
      setEditingNoteIndex(index);
      setEditingNoteText(member.notes[index]);
  };

  const saveEditedNote = () => {
      if (editingNoteIndex === null || !onUpdateMember) return;
      
      const updatedNotes = [...member.notes];
      updatedNotes[editingNoteIndex] = editingNoteText;
      
      onUpdateMember({ ...member, notes: updatedNotes });
      setEditingNoteIndex(null);
      setEditingNoteText('');
  };

  const deleteNote = (index: number) => {
      if (!onUpdateMember || !window.confirm('Are you sure you want to delete this note?')) return;
      const updatedNotes = member.notes.filter((_, i) => i !== index);
      onUpdateMember({ ...member, notes: updatedNotes });
  };
  
  const parseNoteContent = (note: string) => {
      const match = note.match(/^\[(.*?)\]\s*(.*)/s);
      if (match) {
          return (
              <div>
                  <span className="block text-[10px] uppercase tracking-wide font-bold text-gray-400 mb-1">{match[1]}</span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{match[2]}</p>
              </div>
          );
      }
      return <p className="text-sm text-gray-700 whitespace-pre-wrap">{note}</p>;
  };

  // Resource Handlers
  const handleAddResource = () => {
      if (!newResourceTitle.trim() || !onUpdateMember) return;

      const newResource: Resource = {
          id: `res-${Date.now()}`,
          title: newResourceTitle,
          url: newResourceUrl || '#',
          type: 'LINK',
          dateAdded: new Date().toISOString()
      };

      const updatedMember = {
          ...member,
          resources: [...(member.resources || []), newResource]
      };

      onUpdateMember(updatedMember);
      setNewResourceTitle('');
      setNewResourceUrl('');
      setIsAddingResource(false);
  };

  const handleDeleteResource = (id: string) => {
      if (!onUpdateMember) return;
      const updatedResources = (member.resources || []).filter(r => r.id !== id);
      onUpdateMember({ ...member, resources: updatedResources });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'On Track': return 'bg-green-50 text-green-700 border-green-200';
        case 'Needs Attention': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Stalled': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'On Track': return <IoCheckmarkCircleOutline size={16} />;
          case 'Needs Attention': return <IoWarningOutline size={16} />;
          case 'Stalled': return <IoPulseOutline size={16} />;
          default: return <IoSparklesOutline size={16} />;
      }
  }

  // Reusable Detail Item View
  const DetailItem = ({ icon: Icon, label, value, subValue }: any) => (
      <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 mt-1">
              <Icon size={14} />
          </div>
          <div className="min-w-0">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-gray-800 break-words">{value || <span className="text-gray-300 italic">Not set</span>}</p>
              {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content - Fullscreen on mobile, rounded/centered on tablet+ */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-background md:rounded-2xl shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shrink-0">
           <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xl md:text-2xl shrink-0 border-4 border-white shadow-sm">
                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">{member.firstName} {member.lastName}</h2>
                    {member.isChurchMember && <span className="bg-primary/10 text-primary p-1 rounded-full"><IoIdCardOutline title="Official Member" /></span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-medium uppercase tracking-wider ${
                        member.pathway === PathwayType.NEWCOMER ? 'bg-secondary/30 text-primary' : 'bg-green-100 text-green-700'
                    }`}>
                        {member.pathway}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-medium uppercase tracking-wider ${
                        member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {member.status}
                    </span>
                    {isMoreThan3Months() && <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-medium uppercase tracking-wider bg-purple-100 text-purple-700">3+ Months</span>}
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
               {!member.isChurchMember && (
                   <button 
                       onClick={handlePromoteToMember}
                       className="hidden md:flex items-center gap-1 text-xs font-bold bg-gray-100 hover:bg-green-50 hover:text-green-700 px-3 py-2 rounded-lg transition-colors border border-gray-200"
                   >
                       <IoCheckmarkCircleOutline size={16} /> Set as Member
                   </button>
               )}
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                 <IoCloseOutline size={24} className="text-gray-500" />
               </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
            
            {/* 1. Personal Details & Contact */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <IoPersonOutline /> Personal Details
                    </h3>
                    {!isEditingDetails ? (
                        <button onClick={handleStartEditing} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                            <IoPencilOutline size={16} /> Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditingDetails(false)} className="text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold">Cancel</button>
                            <button onClick={handleSaveDetails} className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-navy transition-colors">Save Changes</button>
                        </div>
                    )}
                </div>
                
                {isEditingDetails ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">First Name</label><input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Last Name</label><input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Phone</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                        </div>
                        <div className="border-t border-gray-100 my-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Street Address</label><input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="text-xs font-bold text-gray-400 uppercase">City</label><input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase">State</label><input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase">Zip</label><input type="text" value={editForm.zip} onChange={e => setEditForm({...editForm, zip: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">DOB</label><input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Joined</label><input type="date" value={editForm.joinedDate} onChange={e => setEditForm({...editForm, joinedDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Gender</label><select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none bg-white"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Marital Status</label><select value={editForm.maritalStatus} onChange={e => setEditForm({...editForm, maritalStatus: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none bg-white"><option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option><option value="Divorced">Divorced</option></select></div>
                        </div>
                        <div className="border-t border-gray-100 my-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Nationality</label><input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Tithe #</label><input type="text" value={editForm.titheNumber} onChange={e => setEditForm({...editForm, titheNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Emergency Contact</label><input type="text" value={editForm.emergencyContact} onChange={e => setEditForm({...editForm, emergencyContact: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Spouse Name</label><input type="text" value={editForm.spouseName} onChange={e => setEditForm({...editForm, spouseName: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Spouse DOB</label><input type="date" value={editForm.spouseDob} onChange={e => setEditForm({...editForm, spouseDob: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                        </div>
                        
                        {/* Family Role (Moved here from household block for consistency in edit mode) */}
                        <div className="border-t border-gray-100 my-4"></div>
                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Family Role</label>
                             <select 
                                value={editForm.familyRole} 
                                onChange={e => setEditForm({...editForm, familyRole: e.target.value})} 
                                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                             >
                                 <option value="">Select Role...</option>
                                 <option value="Head">Head of Household</option>
                                 <option value="Spouse">Spouse</option>
                                 <option value="Child">Child</option>
                                 <option value="Other">Other</option>
                             </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                         {/* Column 1 */}
                         <div className="space-y-6">
                             <DetailItem icon={IoMailOutline} label="Email" value={member.email} />
                             <DetailItem icon={IoCallOutline} label="Phone" value={member.phone} />
                             <DetailItem icon={IoLocationOutline} label="Address" value={[member.address, member.city, member.state].filter(Boolean).join(', ')} />
                             <DetailItem icon={IoMedkitOutline} label="Emergency Contact" value={member.emergencyContact} />
                         </div>

                         {/* Column 2 */}
                         <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={IoMaleFemaleOutline} label="Gender" value={member.gender} />
                                <DetailItem icon={IoHeartOutline} label="Marital Status" value={member.maritalStatus} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={IoCalendarNumberOutline} label="Date of Birth" value={member.dateOfBirth} />
                                <DetailItem 
                                    icon={IoCalendarOutline} 
                                    label="Joined Date" 
                                    value={new Date(member.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} 
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={IoEarthOutline} label="Nationality" value={member.nationality} />
                                <DetailItem icon={IoIdCardOutline} label="Tithe Number" value={member.titheNumber} />
                             </div>
                             {member.spouseName && (
                                 <DetailItem icon={IoPersonOutline} label="Spouse" value={member.spouseName} subValue={member.spouseDob ? `Born: ${member.spouseDob}` : undefined} />
                             )}
                         </div>
                    </div>
                )}
            </div>

            {/* 2. Family Unit (Enhanced) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <IoPeopleCircleOutline /> Household Members
                    </h3>
                    {member.familyId && (
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setIsLinkingFamily(true)}
                                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                                <IoPersonAddOutline size={14} /> Add Member
                            </button>
                            <button 
                                onClick={handleUnlinkFamily}
                                className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors ml-2"
                                title="Unlink from this household"
                            >
                                <IoUnlinkOutline size={14} /> Leave
                            </button>
                        </div>
                    )}
                </div>

                {member.familyId ? (
                    <div className="space-y-3">
                         {/* Existing Family List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {familyMembers.length > 0 ? familyMembers.map(fm => (
                                <div key={fm.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-sm text-gray-600">
                                        {fm.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{fm.firstName} {fm.lastName}</p>
                                        <p className="text-xs text-gray-500">{fm.familyRole || 'Family Member'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 italic">No other members in this household.</p>
                                </div>
                            )}
                        </div>

                        {/* Search Interface for Adding Members */}
                        {isLinkingFamily && (
                             <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-fade-in">
                                 <div className="flex justify-between items-center mb-2">
                                     <h4 className="text-xs font-bold text-blue-800 uppercase">Search People to Link</h4>
                                     <button onClick={() => setIsLinkingFamily(false)} className="text-gray-400 hover:text-gray-600"><IoCloseOutline size={16}/></button>
                                 </div>
                                 <div className="relative">
                                     <IoSearchOutline className="absolute left-3 top-2.5 text-gray-400" />
                                     <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Start typing name..." 
                                        value={familySearchTerm}
                                        onChange={e => setFamilySearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                                     />
                                 </div>
                                 {familySearchTerm && (
                                     <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm max-h-40 overflow-y-auto">
                                         {linkableMembers.length > 0 ? linkableMembers.map(m => (
                                             <button 
                                                key={m.id}
                                                onClick={() => handleLinkToMember(m)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
                                             >
                                                 <span className="font-medium text-gray-700">{m.firstName} {m.lastName}</span>
                                                 <span className="text-xs text-primary opacity-0 group-hover:opacity-100 font-bold">Link</span>
                                             </button>
                                         )) : (
                                             <p className="px-4 py-2 text-sm text-gray-400 italic">No matching people found.</p>
                                         )}
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>
                ) : (
                    // No Family State
                    <div>
                         {isLinkingFamily ? (
                             <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
                                 <div className="flex justify-between items-center mb-4">
                                     <div>
                                        <h4 className="font-bold text-gray-800">Create Household</h4>
                                        <p className="text-xs text-gray-500">Search for a spouse or family member to link with {member.firstName}.</p>
                                     </div>
                                     <button onClick={() => setIsLinkingFamily(false)} className="text-gray-400 hover:text-gray-600"><IoCloseOutline size={20}/></button>
                                 </div>
                                 
                                 <div className="relative">
                                     <IoSearchOutline className="absolute left-3 top-3 text-gray-400" />
                                     <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Search existing members..." 
                                        value={familySearchTerm}
                                        onChange={e => setFamilySearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                                     />
                                 </div>

                                 <div className="mt-3 space-y-1">
                                     {familySearchTerm && linkableMembers.map(m => (
                                         <div key={m.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-colors group cursor-pointer" onClick={() => handleLinkToMember(m)}>
                                             <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xs">
                                                     {m.firstName.charAt(0)}
                                                 </div>
                                                 <div>
                                                     <p className="font-bold text-sm text-gray-800">{m.firstName} {m.lastName}</p>
                                                     <p className="text-[10px] text-gray-500">{m.email}</p>
                                                 </div>
                                             </div>
                                             <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                 Link
                                             </button>
                                         </div>
                                     ))}
                                     {familySearchTerm && linkableMembers.length === 0 && (
                                         <p className="text-center text-sm text-gray-400 py-4">No members found.</p>
                                     )}
                                 </div>
                             </div>
                         ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500 mb-3">Not part of a household yet.</p>
                                <button 
                                    onClick={() => setIsLinkingFamily(true)} 
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm font-bold rounded-xl hover:border-primary hover:text-primary transition-all"
                                >
                                    <IoPersonAddOutline /> Create or Join Household
                                </button>
                            </div>
                         )}
                    </div>
                )}
            </div>

            {/* 3. Pathway Progress */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>Integration Pathway</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {Math.round(((currentStageIndex + 1) / stages.length) * 100)}%
                        </span>
                    </h3>

                    {/* Advance Action Button */}
                    {member.status !== MemberStatus.INTEGRATED && (
                        <button 
                            onClick={handleAdvanceStage}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all ${
                                isLastStage 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-primary text-white hover:bg-navy'
                            }`}
                        >
                            {isLastStage ? (
                                <>
                                    <IoFlagOutline size={16} /> Complete Pathway
                                </>
                            ) : (
                                <>
                                    Advance to {nextStage?.name} <IoArrowForwardOutline size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    {/* Progress Bar Background Line */}
                    <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-gray-100" />

                    <div className="space-y-6 relative">
                        {stages.map((stage, index) => {
                            const isCompleted = index <= currentStageIndex;
                            const isCurrent = index === currentStageIndex;
                            
                            return (
                                <div key={stage.id} className="flex items-start gap-4 relative">
                                    {/* Indicator */}
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white transition-colors duration-300
                                        ${isCompleted ? 'border-primary bg-primary text-white' : 'border-gray-200 text-transparent'}
                                        ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                                    `}>
                                        {isCompleted && <IoCheckmarkCircleOutline size={14} className="text-white" />}
                                    </div>
                                    
                                    {/* Text */}
                                    <div className={`transition-all duration-300 ${isCurrent ? 'translate-x-1' : ''}`}>
                                        <h4 className={`font-bold text-sm ${isCurrent ? 'text-primary text-base' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {stage.name}
                                        </h4>
                                        {isCurrent && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-xs bg-secondary/30 text-primary px-2 py-0.5 rounded font-medium">
                                                    Current Stage
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 4. Discipleship Resources */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                         <IoBookOutline /> Discipleship Track
                     </h3>
                     {!isAddingResource && (
                        <button 
                            onClick={() => setIsAddingResource(true)}
                            className="text-xs flex items-center gap-1 text-primary font-bold hover:underline"
                        >
                            <IoAddCircleOutline size={16} /> Add Resource
                        </button>
                     )}
                </div>

                {isAddingResource && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 animate-fade-in">
                        <div className="space-y-2">
                            <input 
                                type="text"
                                placeholder="Resource Title (e.g. Gospel Guide)"
                                value={newResourceTitle}
                                onChange={(e) => setNewResourceTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <input 
                                type="text"
                                placeholder="URL (Optional)"
                                value={newResourceUrl}
                                onChange={(e) => setNewResourceUrl(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                            />
                            <div className="flex gap-2 justify-end pt-1">
                                <button onClick={() => setIsAddingResource(false)} className="text-xs text-gray-500 font-bold px-2 py-1">Cancel</button>
                                <button onClick={handleAddResource} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                     {member.resources && member.resources.length > 0 ? (
                         member.resources.map(res => (
                             <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-primary">
                                         <IoLinkOutline size={16} />
                                     </div>
                                     <div className="min-w-0">
                                         <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-800 hover:text-primary hover:underline truncate block">
                                             {res.title}
                                         </a>
                                         <p className="text-[10px] text-gray-400">Added {new Date(res.dateAdded).toLocaleDateString()}</p>
                                     </div>
                                 </div>
                                 <button onClick={() => handleDeleteResource(res.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <IoTrashOutline size={16} />
                                 </button>
                             </div>
                         ))
                     ) : (
                         <p className="text-sm text-gray-400 italic">No resources assigned to this member.</p>
                     )}
                </div>
            </div>

            {/* 5. Journey Analysis */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-secondary/20 to-background p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-navy font-bold text-sm">
                        <IoSparklesOutline size={16} />
                        Journey Insights
                    </div>
                </div>
                
                <div className="p-4 md:p-6">
                    {isAnalyzing ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        </div>
                    ) : analysis ? (
                        <div className="flex flex-col gap-4">
                             <div className="flex items-start justify-between">
                                 <div>
                                     <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                                     <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(analysis.status)}`}>
                                         {getStatusIcon(analysis.status)}
                                         {analysis.status}
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Suggested Action</p>
                                     <p className="text-sm font-medium text-gray-800">{analysis.suggestedAction}</p>
                                 </div>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 italic border border-gray-100">
                                 "{analysis.reasoning}"
                             </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Insights unavailable.</p>
                    )}
                </div>
            </div>

            {/* 6. Communication */}
            <CommunicationLog member={member} onUpdateMember={onUpdateMember || (() => {})} />

            {/* 7. Notes */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <IoDocumentTextOutline /> Notes & Activity
                </h3>

                {/* Add Note Input */}
                <div className="mb-6 flex gap-2">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a new note..."
                        className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                        rows={2}
                    />
                    <button 
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-6 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors shadow-lg shadow-primary/30"
                    >
                        <IoAddCircleOutline size={20} />
                        Add
                    </button>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    {member.notes.map((note, idx) => (
                        <div key={idx} className="group relative bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            {editingNoteIndex === idx ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editingNoteText}
                                        onChange={(e) => setEditingNoteText(e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingNoteIndex(null)} className="text-xs text-gray-500 hover:text-gray-800">Cancel</button>
                                        <button onClick={saveEditedNote} className="text-xs bg-success text-white px-3 py-1 rounded hover:bg-green-600">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="pr-8 md:pr-16">
                                       {parseNoteContent(note)}
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditingNote(idx)} className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                            <IoPencilOutline size={14} />
                                        </button>
                                        <button onClick={() => deleteNote(idx)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                                            <IoTrashOutline size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                     {member.notes.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">No notes recorded.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetail;
