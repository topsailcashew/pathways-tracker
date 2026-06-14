
import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoCallOutline, IoMailOutline, IoSparklesOutline, IoPulseOutline, IoWarningOutline, IoCheckmarkCircleOutline, IoCalendarOutline,  IoPersonOutline, IoArrowForwardOutline, IoFlagOutline, IoAddCircleOutline, IoPencilOutline, IoTrashOutline, IoBookOutline, IoLinkOutline, IoLocationOutline, IoCalendarNumberOutline, IoMaleFemaleOutline, IoHeartOutline, IoEarthOutline, IoMedkitOutline, IoIdCardOutline, IoPeopleCircleOutline, IoUnlinkOutline, IoSearchOutline, IoPersonAddOutline, IoHandLeftOutline } from 'react-icons/io5';
import { Member, PathwayType, Stage, MemberStatus, Resource } from '../types';
import { analyzeMemberJourney, JourneyAnalysis } from '../services/geminiService';
import CommunicationLog from './CommunicationLog';
import { useAppContext } from '../context/AppContext';
import { advanceMemberStage, addMemberNote } from '../src/api/members';
import { getServeTeams, referMemberToServeTeam } from '../src/api/serve-teams';
import { inviteMember } from '../src/api/users';
import type { ServeTeam } from '../types';

interface MemberDetailProps {
  member: Member;
  onClose: () => void;
  onUpdateMember?: (updated: Member) => void;
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
}

const MemberDetail: React.FC<MemberDetailProps> = ({ member, onClose, onUpdateMember, newcomerStages, newBelieverStages }) => {
  const { members, churchSettings, updateMember: globalUpdateMember, currentUser } = useAppContext();

  // Tab state
  const [activeTab, setActiveTab] = useState<'journey' | 'notes' | 'messages' | 'tasks'>('journey');

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

  // Invitation State
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Serve Team Referral State
  const [showReferModal, setShowReferModal] = useState(false);
  const [serveTeams, setServeTeams] = useState<ServeTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [referringTeamId, setReferringTeamId] = useState<string | null>(null);

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
      nationality: member.nationality || '',
      emergencyContact: member.emergencyContact || '',
      spouseName: member.spouseName || '',
      spouseDob: member.spouseDob || '',
      titheNumber: member.titheNumber || '',
      joinedDate: member.joinedDate,
      familyRole: member.familyRole || ''
  });

  const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
  const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
  const currentStage = stages[currentStageIndex];
  const nextStage = stages[currentStageIndex + 1];
  const isLastStage = currentStageIndex === stages.length - 1;
  const isServeStage = currentStage?.name?.toLowerCase().includes('serve');
  const isAdminOrLeader = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TEAM_LEADER';

  // Family Logic
  const familyMembers = member.familyId
    ? members.filter(m => m.familyId === member.familyId && m.id !== member.id)
    : [];

  const linkableMembers = members.filter(m => {
      if (m.id === member.id) return false;
      if (member.familyId && m.familyId === member.familyId) return false;
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      return fullName.includes(familySearchTerm.toLowerCase());
  }).slice(0, 5);

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
      updatedMember.notes = [`[System] Personal details updated on ${new Date().toLocaleDateString()}`, ...(member.notes || [])];
      onUpdateMember(updatedMember);
      setIsEditingDetails(false);
  };

  const handleLinkToMember = (targetMember: Member) => {
      if (!onUpdateMember) return;
      if (targetMember.familyId) {
          const updatedCurrent = { ...member, familyId: targetMember.familyId, familyRole: member.familyRole || 'Other' as const };
          onUpdateMember(updatedCurrent);
      } else {
          const newFamilyId = `fam-${Date.now()}`;
          const updatedTarget = { ...targetMember, familyId: newFamilyId, familyRole: 'Head' as const };
          globalUpdateMember(updatedTarget);
          const updatedCurrent = { ...member, familyId: newFamilyId, familyRole: 'Spouse' as const };
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
          notes: [`[System] Unlinked from household on ${new Date().toLocaleDateString()}`, ...(member.notes || [])]
      };
      onUpdateMember(updatedMember);
  };

  const handlePromoteToMember = () => {
      if (!onUpdateMember || !window.confirm(`Are you sure you want to set ${member.firstName} as a ${churchSettings.memberTerm || 'Church Member'}?`)) return;
      const updatedMember = {
          ...member,
          isChurchMember: true,
          status: MemberStatus.INTEGRATED,
          notes: [`[System] Promoted to ${churchSettings.memberTerm || 'Church Member'} on ${new Date().toLocaleDateString()}`, ...(member.notes || [])]
      };
      onUpdateMember(updatedMember);
  };

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvanceStage = async () => {
      if (!onUpdateMember) return;
      if (isLastStage) {
          const updatedMember: Member = { ...member, status: MemberStatus.INTEGRATED };
          onUpdateMember(updatedMember);
      } else if (nextStage) {
          setIsAdvancing(true);
          try {
              await advanceMemberStage(member.id, nextStage.id);
              const updatedMember: Member = {
                  ...member,
                  currentStageId: nextStage.id,
                  lastStageChangeDate: new Date().toISOString().split('T')[0],
              };
              onUpdateMember(updatedMember);
          } catch (err: any) {
              alert(err.message || 'Failed to advance stage');
          } finally {
              setIsAdvancing(false);
          }
      }
  };

  const handleOpenReferModal = async () => {
      setShowReferModal(true);
      setLoadingTeams(true);
      try {
          const teams = await getServeTeams({ isActive: true });
          setServeTeams(teams);
      } catch (err: any) {
          alert(err.message || 'Failed to load serve teams');
      } finally {
          setLoadingTeams(false);
      }
  };

  const handleReferToTeam = async (teamId: string) => {
      setReferringTeamId(teamId);
      try {
          const memberName = `${member.firstName} ${member.lastName}`;
          const result = await referMemberToServeTeam(teamId, member.id, memberName);
          alert(`Referral sent to ${result.notifiedCount} team leader(s)`);
          setShowReferModal(false);
      } catch (err: any) {
          alert(err.message || 'Failed to send referral');
      } finally {
          setReferringTeamId(null);
      }
  };

  const handleInviteToApp = async () => {
      setIsInviting(true);
      try {
          const result = await inviteMember(member.id);
          setInviteSent(true);
          alert(`Invitation sent to ${result.email}`);
      } catch (err: any) {
          alert(err.message || 'Failed to send invitation');
      } finally {
          setIsInviting(false);
      }
  };

  const hasLinkedUser = !!(member as any).linkedUser;

  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
      if (!newNote.trim() || !onUpdateMember) return;
      setIsAddingNote(true);
      try {
          await addMemberNote(member.id, newNote.trim());
          const timestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const noteEntry = `[${timestamp}] ${newNote.trim()}`;
          const updatedMember = { ...member, notes: [noteEntry, ...(member.notes || [])] };
          onUpdateMember(updatedMember);
          setNewNote('');
      } catch (err: any) {
          alert(err.message || 'Failed to add note');
      } finally {
          setIsAddingNote(false);
      }
  };

  const startEditingNote = (index: number) => {
      setEditingNoteIndex(index);
      setEditingNoteText((member.notes || [])[index] ?? '');
  };

  const saveEditedNote = () => {
      if (editingNoteIndex === null || !onUpdateMember) return;
      const updatedNotes = [...(member.notes || [])];
      updatedNotes[editingNoteIndex] = editingNoteText;
      onUpdateMember({ ...member, notes: updatedNotes });
      setEditingNoteIndex(null);
      setEditingNoteText('');
  };

  const deleteNote = (index: number) => {
      if (!onUpdateMember || !window.confirm('Are you sure you want to delete this note?')) return;
      const updatedNotes = (member.notes || []).filter((_, i) => i !== index);
      onUpdateMember({ ...member, notes: updatedNotes });
  };

  const parseNoteContent = (note: string) => {
      const match = note.match(/^\[(.*?)\]\s*(.*)/s);
      if (match) {
          return (
              <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mb-1">{match[1]}</span>
                  <p className="text-sm text-[#1F2D52] whitespace-pre-wrap">{match[2]}</p>
              </div>
          );
      }
      return <p className="text-sm text-[#1F2D52] whitespace-pre-wrap">{note}</p>;
  };

  const handleAddResource = () => {
      if (!newResourceTitle.trim() || !onUpdateMember) return;
      const newResource: Resource = {
          id: `res-${Date.now()}`,
          title: newResourceTitle,
          url: newResourceUrl || '#',
          type: 'LINK',
          dateAdded: new Date().toISOString()
      };
      const updatedMember = { ...member, resources: [...(member.resources || []), newResource] };
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
        case 'On Track': return 'bg-[#F0FAF5] text-[#4F7E50] border-[#4F7E50]/20';
        case 'Needs Attention': return 'bg-[#F7E8D8] text-[#B8732A] border-[#B8732A]/20';
        case 'Stalled': return 'bg-[#FBE9E9] text-[#B42626] border-[#B42626]/20';
        default: return 'bg-[#FAF8F4] text-[#6B6960] border-[#E5E0D2]';
    }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'On Track': return <IoCheckmarkCircleOutline size={16} />;
          case 'Needs Attention': return <IoWarningOutline size={16} />;
          case 'Stalled': return <IoPulseOutline size={16} />;
          default: return <IoSparklesOutline size={16} />;
      }
  };

  // Shared style tokens
  const inputCls = "bg-white border border-[#D8D2C2] rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]";
  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]";

  const DetailItem = ({ icon: Icon, label, value, subValue }: any) => (
      <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F4] text-[#9E9D95] flex items-center justify-center shrink-0 mt-1">
              <Icon size={14} />
          </div>
          <div className="min-w-0">
              <p className={labelCls}>{label}</p>
              <p className="text-sm font-medium text-[#14213D] break-words">{value || <span className="text-[#9E9D95] italic">Not set</span>}</p>
              {subValue && <p className="text-xs text-[#6B6960] mt-0.5">{subValue}</p>}
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white md:rounded-xl shadow-xl flex flex-col animate-zoom-in overflow-hidden mx-auto">

        {/* ── Header ── */}
        <div className="bg-white border-b border-[#E5E0D2] px-6 py-5 shrink-0">
          {/* Row 1: Avatar + name + close */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#EFEBE0] flex items-center justify-center text-base font-semibold text-[#6B6960] shrink-0">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h2 className="text-xl font-bold text-[#14213D] leading-tight">{member.firstName} {member.lastName}</h2>
                {member.isChurchMember && (
                  <span className="bg-[#FEF6E8] text-[#B8732A] p-1 rounded-full mt-0.5 shrink-0">
                    <IoIdCardOutline title="Official Member" size={14} />
                  </span>
                )}
              </div>
              {/* Status row */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  member.status === 'Active' ? 'bg-[#4F7E50]' :
                  member.status === MemberStatus.INTEGRATED ? 'bg-[#FCA311]' : 'bg-[#9E9D95]'
                }`} />
                <span className="text-xs font-medium text-[#6B6960]">{member.status}</span>
                {isMoreThan3Months() && (
                  <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-[0.08em] bg-[#FEECD0] text-[#B8732A]">3+ Months</span>
                )}
              </div>
            </div>
            {/* Close button — top right */}
            <button onClick={onClose} className="p-1.5 hover:bg-[#FAF8F4] rounded-lg transition-colors shrink-0">
              <IoCloseOutline size={20} className="text-[#6B6960]" />
            </button>
          </div>

          {/* Row 2: Action buttons */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {member.phone && (
              <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 text-xs font-semibold bg-[#FAF8F4] border border-[#E5E0D2] text-[#1F2D52] rounded-md px-3 py-1.5 hover:border-[#D8D2C2] hover:bg-[#EFEBE0] transition-colors">
                <IoCallOutline size={14} /> Call
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-xs font-semibold bg-[#FAF8F4] border border-[#E5E0D2] text-[#1F2D52] rounded-md px-3 py-1.5 hover:border-[#D8D2C2] hover:bg-[#EFEBE0] transition-colors">
                <IoMailOutline size={14} /> Email
              </a>
            )}
            {isAdminOrLeader && member.email && !hasLinkedUser && !inviteSent && (
              <button
                onClick={handleInviteToApp}
                disabled={isInviting}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[#FAF8F4] border border-[#E5E0D2] text-[#1F2D52] rounded-md px-3 py-1.5 hover:border-[#D8D2C2] hover:bg-[#EFEBE0] transition-colors disabled:opacity-50"
              >
                <IoMailOutline size={14} /> {isInviting ? 'Sending...' : 'Invite to App'}
              </button>
            )}
            {inviteSent && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#4F7E50] bg-[#E8F0E9] px-3 py-1.5 rounded-md">
                <IoCheckmarkCircleOutline size={14} /> Invite Sent
              </span>
            )}
            {!member.isChurchMember && (
              <button
                onClick={handlePromoteToMember}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[#FAF8F4] border border-[#E5E0D2] text-[#1F2D52] rounded-md px-3 py-1.5 hover:border-[#D8D2C2] hover:bg-[#EFEBE0] transition-colors"
              >
                <IoCheckmarkCircleOutline size={14} /> Set as Member
              </button>
            )}
          </div>
        </div>

        {/* ── Stage Timeline ── */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mb-3">Pathway Progress</p>
          <div className="relative flex items-start">
            {/* Track line */}
            <div className="absolute top-[10px] left-0 right-0 h-0.5 bg-[#EFEBE0] z-0" />
            {/* Filled progress line */}
            {currentStageIndex > 0 && stages.length > 1 && (
              <div
                className="absolute top-[10px] left-0 h-0.5 bg-[#FCA311] z-0 transition-all duration-500"
                style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
              />
            )}
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <div key={stage.id} className="relative flex flex-col items-center flex-1 z-10">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                    ${isCurrent ? 'bg-[#FCA311] border-[#FCA311] shadow-[0_0_0_3px_rgba(245,165,36,0.20)]' : ''}
                    ${isCompleted ? 'bg-[#FCA311] border-[#FCA311]' : ''}
                    ${!isCurrent && !isCompleted ? 'bg-white border-[#D1C9BA]' : ''}
                  `}>
                    {isCompleted && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center leading-tight px-0.5 max-w-[52px] font-medium ${isCurrent ? 'text-[#B8732A]' : isCompleted ? 'text-[#6B6960]' : 'text-[#9E9D95]'}`}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Advance / Refer buttons ── */}
        <div className="px-8 pb-4 flex flex-wrap gap-2 shrink-0">
          {member.status !== MemberStatus.INTEGRATED && (
            <button
              onClick={handleAdvanceStage}
              disabled={isAdvancing}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                isLastStage
                  ? 'bg-[#4F7E50] text-white hover:bg-[#256644]'
                  : 'bg-[#14213D] text-white hover:bg-[#1F2D52]'
              }`}
            >
              {isLastStage ? (
                <><IoFlagOutline size={15} /> Complete Pathway</>
              ) : (
                <>Advance to {nextStage?.name} <IoArrowForwardOutline size={15} /></>
              )}
            </button>
          )}
          {isServeStage && isAdminOrLeader && (
            <button
              onClick={handleOpenReferModal}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#FCA311] text-[#14213D] hover:bg-[#E09416] transition-all"
            >
              <IoHandLeftOutline size={15} /> Refer to Serve Team
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-[#E5E0D2] px-8 shrink-0 flex gap-6 overflow-x-auto">
          {(['journey', 'notes', 'messages', 'tasks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize text-sm pb-3 whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#FCA311] text-[#14213D] font-medium'
                  : 'text-[#6B6960] hover:text-[#14213D]'
              }`}
            >
              {tab === 'journey' ? 'Journey' : tab === 'notes' ? 'Notes' : tab === 'messages' ? 'Messages' : 'Tasks'}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#FAF8F4] space-y-5">

          {/* ─ Journey tab ─ */}
          {activeTab === 'journey' && (
            <>
              {/* Personal Details */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E0D2] shadow-sm">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#EFEBE0]">
                  <h3 className="text-base font-semibold text-[#14213D] flex items-center gap-2">
                    <IoPersonOutline /> Personal Details
                  </h3>
                  {!isEditingDetails ? (
                    <button onClick={handleStartEditing} className="text-[#6B6960] hover:text-[#14213D] hover:bg-[#FAF8F4] p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-[#E5E0D2]">
                      <IoPencilOutline size={13} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingDetails(false)} className="bg-white border border-[#D8D2C2] text-[#14213D] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#FAF8F4]">Cancel</button>
                      <button onClick={handleSaveDetails} className="bg-[#14213D] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1F2D52]">Save Changes</button>
                    </div>
                  )}
                </div>

                {isEditingDetails ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>First Name</label><input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Last Name</label><input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className={`${inputCls} mt-1`} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Phone</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={`${inputCls} mt-1`} /></div>
                    </div>
                    <div className="border-t border-[#EFEBE0]" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className={labelCls}>Street Address</label><input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={labelCls}>City</label><input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className={`${inputCls} mt-1`} /></div>
                        <div><label className={labelCls}>State</label><input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className={`${inputCls} mt-1`} /></div>
                        <div><label className={labelCls}>Zip</label><input type="text" value={editForm.zip} onChange={e => setEditForm({...editForm, zip: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className={labelCls}>DOB</label><input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Joined</label><input type="date" value={editForm.joinedDate} onChange={e => setEditForm({...editForm, joinedDate: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Gender</label><select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className={`${inputCls} mt-1`}><option value="Male">Male</option><option value="Female">Female</option></select></div>
                      <div><label className={labelCls}>Marital Status</label><select value={editForm.maritalStatus} onChange={e => setEditForm({...editForm, maritalStatus: e.target.value})} className={`${inputCls} mt-1`}><option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option><option value="Divorced">Divorced</option></select></div>
                    </div>
                    <div className="border-t border-[#EFEBE0]" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className={labelCls}>Nationality</label><input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Tithe #</label><input type="text" value={editForm.titheNumber} onChange={e => setEditForm({...editForm, titheNumber: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Emergency Contact</label><input type="text" value={editForm.emergencyContact} onChange={e => setEditForm({...editForm, emergencyContact: e.target.value})} className={`${inputCls} mt-1`} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Spouse Name</label><input type="text" value={editForm.spouseName} onChange={e => setEditForm({...editForm, spouseName: e.target.value})} className={`${inputCls} mt-1`} /></div>
                      <div><label className={labelCls}>Spouse DOB</label><input type="date" value={editForm.spouseDob} onChange={e => setEditForm({...editForm, spouseDob: e.target.value})} className={`${inputCls} mt-1`} /></div>
                    </div>
                    <div className="border-t border-[#EFEBE0]" />
                    <div>
                      <label className={labelCls}>Family Role</label>
                      <select value={editForm.familyRole} onChange={e => setEditForm({...editForm, familyRole: e.target.value})} className={`${inputCls} mt-1`}>
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
                    <div className="space-y-6">
                      <DetailItem icon={IoMailOutline} label="Email" value={member.email} />
                      <DetailItem icon={IoCallOutline} label="Phone" value={member.phone} />
                      <DetailItem icon={IoLocationOutline} label="Address" value={[member.address, member.city, member.state].filter(Boolean).join(', ')} />
                      <DetailItem icon={IoMedkitOutline} label="Emergency Contact" value={member.emergencyContact} />
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem icon={IoMaleFemaleOutline} label="Gender" value={member.gender} />
                        <DetailItem icon={IoHeartOutline} label="Marital Status" value={member.maritalStatus} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem icon={IoCalendarNumberOutline} label="Date of Birth" value={member.dateOfBirth} />
                        <DetailItem icon={IoCalendarOutline} label="Joined Date" value={new Date(member.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
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

              {/* Household */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E0D2] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-semibold text-[#14213D] flex items-center gap-2">
                    <IoPeopleCircleOutline /> Household Members
                  </h3>
                  {member.familyId && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsLinkingFamily(true)} className="flex items-center gap-1 text-[11px] font-semibold text-[#14213D] hover:bg-[#FAF8F4] px-2 py-1 rounded-lg border border-[#E5E0D2] transition-colors">
                        <IoPersonAddOutline size={13} /> Add Member
                      </button>
                      <button onClick={handleUnlinkFamily} className="flex items-center gap-1 text-[11px] font-semibold text-[#B42626] hover:bg-[#FBE9E9] px-2 py-1 rounded-lg border border-[#E5E0D2] transition-colors">
                        <IoUnlinkOutline size={13} /> Leave
                      </button>
                    </div>
                  )}
                </div>

                {member.familyId ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {familyMembers.length > 0 ? familyMembers.map(fm => (
                        <div key={fm.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E0D2] bg-[#FAF8F4]">
                          <div className="w-10 h-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-sm">
                            {fm.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#14213D]">{fm.firstName} {fm.lastName}</p>
                            <p className="text-xs text-[#6B6960]">{fm.familyRole || 'Family Member'}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center py-4 bg-[#FAF8F4] rounded-xl border border-dashed border-[#D8D2C2]">
                          <p className="text-sm text-[#9E9D95] italic">No other members in this household.</p>
                        </div>
                      )}
                    </div>
                    {isLinkingFamily && (
                      <div className="mt-4 p-4 bg-[#FEF6E8] rounded-xl border border-[#FCA311]/20 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#14213D]">Search People to Link</h4>
                          <button onClick={() => setIsLinkingFamily(false)} className="text-[#6B6960] hover:text-[#14213D]"><IoCloseOutline size={16}/></button>
                        </div>
                        <div className="relative">
                          <IoSearchOutline className="absolute left-3 top-2.5 text-[#9E9D95]" />
                          <input type="text" autoFocus placeholder="Start typing name..." value={familySearchTerm} onChange={e => setFamilySearchTerm(e.target.value)} className={`${inputCls} pl-9`} />
                        </div>
                        {familySearchTerm && (
                          <div className="mt-2 bg-white rounded-lg border border-[#E5E0D2] shadow-sm max-h-40 overflow-y-auto">
                            {linkableMembers.length > 0 ? linkableMembers.map(m => (
                              <button key={m.id} onClick={() => handleLinkToMember(m)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FAF8F4] flex items-center justify-between group">
                                <span className="font-medium text-[#1F2D52]">{m.firstName} {m.lastName}</span>
                                <span className="text-xs text-[#FCA311] opacity-0 group-hover:opacity-100 font-semibold">Link</span>
                              </button>
                            )) : (
                              <p className="px-4 py-2 text-sm text-[#9E9D95] italic">No matching people found.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isLinkingFamily ? (
                      <div className="p-4 bg-[#FAF8F4] rounded-xl border border-[#E5E0D2] animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-semibold text-[#14213D]">Create Household</h4>
                            <p className="text-xs text-[#6B6960]">Search for a spouse or family member to link with {member.firstName}.</p>
                          </div>
                          <button onClick={() => setIsLinkingFamily(false)} className="text-[#6B6960] hover:text-[#14213D]"><IoCloseOutline size={20}/></button>
                        </div>
                        <div className="relative">
                          <IoSearchOutline className="absolute left-3 top-3 text-[#9E9D95]" />
                          <input type="text" autoFocus placeholder="Search existing members..." value={familySearchTerm} onChange={e => setFamilySearchTerm(e.target.value)} className={`${inputCls} pl-9`} />
                        </div>
                        <div className="mt-3 space-y-1">
                          {familySearchTerm && linkableMembers.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg border border-transparent hover:border-[#E5E0D2] transition-colors group cursor-pointer" onClick={() => handleLinkToMember(m)}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center font-bold text-xs">{m.firstName.charAt(0)}</div>
                                <div>
                                  <p className="font-semibold text-sm text-[#14213D]">{m.firstName} {m.lastName}</p>
                                  <p className="text-[10px] text-[#6B6960]">{m.email}</p>
                                </div>
                              </div>
                              <button className="text-xs bg-[#14213D] text-white px-3 py-1.5 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Link</button>
                            </div>
                          ))}
                          {familySearchTerm && linkableMembers.length === 0 && (
                            <p className="text-center text-sm text-[#9E9D95] py-4">No members found.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#FAF8F4] rounded-xl border border-dashed border-[#D8D2C2]">
                        <p className="text-sm text-[#6B6960] mb-3">Not part of a household yet.</p>
                        <button onClick={() => setIsLinkingFamily(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D8D2C2] shadow-sm text-[#1F2D52] text-sm font-semibold rounded-xl hover:border-[#FCA311] hover:text-[#14213D] transition-all">
                          <IoPersonAddOutline /> Create or Join Household
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discipleship Track */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E0D2] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#14213D] flex items-center gap-2">
                    <IoBookOutline /> Discipleship Track
                  </h3>
                  {!isAddingResource && (
                    <button onClick={() => setIsAddingResource(true)} className="text-xs flex items-center gap-1 text-[#6B6960] hover:text-[#14213D] font-semibold border border-[#E5E0D2] hover:bg-[#FAF8F4] px-2 py-1 rounded-lg transition-colors">
                      <IoAddCircleOutline size={14} /> Add Resource
                    </button>
                  )}
                </div>

                {isAddingResource && (
                  <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#E5E0D2] mb-4 animate-fade-in">
                    <div className="space-y-2">
                      <input type="text" placeholder="Resource Title (e.g. Gospel Guide)" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} className={inputCls} />
                      <input type="text" placeholder="URL (Optional)" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} className={inputCls} />
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setIsAddingResource(false)} className="text-xs text-[#6B6960] font-semibold px-2 py-1 hover:text-[#14213D]">Cancel</button>
                        <button onClick={handleAddResource} className="text-xs bg-[#14213D] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#1F2D52]">Save</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {member.resources && member.resources.length > 0 ? (
                    member.resources.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-[#FAF8F4] rounded-lg border border-[#E5E0D2] hover:border-[#D8D2C2] transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center">
                            <IoLinkOutline size={15} />
                          </div>
                          <div className="min-w-0">
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#14213D] hover:text-[#FCA311] hover:underline truncate block">
                              {res.title}
                            </a>
                            <p className="text-[10px] text-[#9E9D95]">Added {new Date(res.dateAdded).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteResource(res.id)} className="text-[#9E9D95] hover:text-[#B42626] opacity-0 group-hover:opacity-100 transition-opacity">
                          <IoTrashOutline size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#9E9D95] italic">No resources assigned to this member.</p>
                  )}
                </div>
              </div>

              {/* Journey Insights */}
              <div className="bg-white rounded-2xl border border-[#E5E0D2] shadow-sm overflow-hidden">
                <div className="bg-[#FAF8F4] px-5 py-4 border-b border-[#EFEBE0] flex items-center gap-2 text-[#14213D] font-semibold text-sm">
                  <IoSparklesOutline size={15} /> Journey Insights
                </div>
                <div className="p-5">
                  {isAnalyzing ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-[#EFEBE0] rounded w-1/4" />
                      <div className="h-4 bg-[#EFEBE0] rounded w-3/4" />
                    </div>
                  ) : analysis ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`${labelCls} mb-1`}>Status</p>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(analysis.status)}`}>
                            {getStatusIcon(analysis.status)}
                            {analysis.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`${labelCls} mb-1`}>Suggested Action</p>
                          <p className="text-sm font-medium text-[#14213D]">{analysis.suggestedAction}</p>
                        </div>
                      </div>
                      <div className="bg-[#FAF8F4] p-4 rounded-xl text-sm text-[#6B6960] italic border border-[#E5E0D2]">
                        "{analysis.reasoning}"
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#9E9D95]">Insights unavailable.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─ Notes tab ─ */}
          {activeTab === 'notes' && (
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D2] shadow-sm">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mb-4">Notes & Activity</h3>

              {/* Add Note */}
              <div className="mb-6 flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note..."
                  className="flex-1 p-3 bg-[#FAF8F4] border border-[#D8D2C2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311] resize-none transition-all"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                  className="px-4 bg-[#14213D] text-white rounded-xl hover:bg-[#1F2D52] disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors"
                >
                  <IoAddCircleOutline size={18} />
                  Add
                </button>
              </div>

              {/* Notes list */}
              <div className="space-y-3">
                {(member.notes || []).map((note, idx) => (
                  <div key={idx} className="group relative bg-[#FAF8F4] p-4 rounded-xl border border-[#E5E0D2] hover:border-[#D8D2C2] transition-colors">
                    {editingNoteIndex === idx ? (
                      <div className="space-y-2">
                        <textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} className={`${inputCls} resize-none`} rows={3} />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingNoteIndex(null)} className="text-xs text-[#6B6960] hover:text-[#14213D] font-semibold">Cancel</button>
                          <button onClick={saveEditedNote} className="text-xs bg-[#14213D] text-white px-3 py-1 rounded-lg font-semibold hover:bg-[#1F2D52]">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="pr-12">{parseNoteContent(note)}</div>
                        <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditingNote(idx)} className="p-1 text-[#9E9D95] hover:text-[#14213D] rounded hover:bg-[#EFEBE0]"><IoPencilOutline size={13} /></button>
                          <button onClick={() => deleteNote(idx)} className="p-1 text-[#9E9D95] hover:text-[#B42626] rounded hover:bg-[#FBE9E9]"><IoTrashOutline size={13} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {(member.notes || []).length === 0 && (
                  <p className="text-[#9E9D95] italic text-sm text-center py-4">No notes recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* ─ Messages tab ─ */}
          {activeTab === 'messages' && (
            <CommunicationLog member={member} onUpdateMember={onUpdateMember || (() => {})} />
          )}

          {/* ─ Tasks tab ─ */}
          {activeTab === 'tasks' && (
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D2] shadow-sm">
              <p className="text-sm text-[#9E9D95] italic text-center py-6">No tasks yet for this member.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Refer to Serve Team sub-modal ── */}
      {showReferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowReferModal(false)}>
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#E5E0D2] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#14213D]">Refer to Serve Team</h3>
              <button onClick={() => setShowReferModal(false)} className="p-1 hover:bg-[#FAF8F4] rounded-full transition-colors">
                <IoCloseOutline size={20} className="text-[#6B6960]" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#6B6960] mb-4">
                Select a serve team to refer <span className="font-semibold text-[#14213D]">{member.firstName} {member.lastName}</span> to. Team leaders will be notified.
              </p>
              {loadingTeams ? (
                <div className="py-8 text-center text-[#9E9D95] text-sm">Loading teams...</div>
              ) : serveTeams.length === 0 ? (
                <div className="py-8 text-center text-[#9E9D95] text-sm">No active serve teams found.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {serveTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleReferToTeam(team.id)}
                      disabled={referringTeamId === team.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E5E0D2] hover:bg-[#FEF6E8] hover:border-[#FCA311]/30 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EFEBE0] text-[#6B6960] flex items-center justify-center flex-shrink-0">
                        <IoHandLeftOutline size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#14213D] truncate">{team.name}</p>
                        {team.description && <p className="text-xs text-[#6B6960] truncate">{team.description}</p>}
                      </div>
                      {referringTeamId === team.id && (
                        <span className="text-xs text-[#FCA311] font-semibold">Sending...</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
