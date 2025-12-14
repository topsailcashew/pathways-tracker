
import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoCallOutline, IoMailOutline, IoSparklesOutline, IoChatbubbleOutline, IoSendOutline, IoPulseOutline, IoWarningOutline, IoCheckmarkCircleOutline, IoCalendarOutline, IoPricetagsOutline, IoPersonOutline, IoPhonePortraitOutline, IoArrowForwardOutline, IoFlagOutline, IoDocumentTextOutline, IoAddCircleOutline, IoPencilOutline, IoTrashOutline, IoTimeOutline, IoBookOutline, IoLinkOutline, IoReturnDownBackOutline } from 'react-icons/io5';
import { Member, PathwayType, Stage, MemberStatus, MessageLog, Resource } from '../types';
import { generateFollowUpMessage, analyzeMemberJourney, JourneyAnalysis } from '../services/geminiService';
import { sendEmail, sendSMS } from '../services/communicationService';
import { CURRENT_USER } from '../constants';

interface MemberDetailProps {
  member: Member;
  onClose: () => void;
  onUpdateMember?: (updated: Member) => void;
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
}

const MemberDetail: React.FC<MemberDetailProps> = ({ member, onClose, onUpdateMember, newcomerStages, newBelieverStages }) => {
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [analysis, setAnalysis] = useState<JourneyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'SMS' | 'EMAIL'>('SMS');
  const [emailSubject, setEmailSubject] = useState('Checking in');
  
  // Note state
  const [newNote, setNewNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Resource State
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  
  // Inbound Reply State
  const [isLoggingReply, setIsLoggingReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const stages = member.pathway === PathwayType.NEWCOMER ? newcomerStages : newBelieverStages;
  const currentStageIndex = stages.findIndex(s => s.id === member.currentStageId);
  const nextStage = stages[currentStageIndex + 1];
  const isLastStage = currentStageIndex === stages.length - 1;

  // Fetch AI analysis on mount
  useEffect(() => {
     const fetchAnalysis = async () => {
         setIsAnalyzing(true);
         const result = await analyzeMemberJourney(member, stages);
         setAnalysis(result);
         setIsAnalyzing(false);
     }
     fetchAnalysis();
  }, [member, stages]);

  const handleGenerateMessage = async () => {
    setIsLoading(true);
    const msg = await generateFollowUpMessage(member);
    setGeneratedMessage(msg);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
      if (!generatedMessage.trim()) return;
      
      setIsSending(true);
      let success = false;

      if (messageChannel === 'EMAIL') {
          success = await sendEmail(member.email, emailSubject, generatedMessage);
      } else {
          success = await sendSMS(member.phone, generatedMessage);
      }

      if (success) {
          const timestamp = new Date().toISOString();
          
          // Create structured message log entry
          const logEntry: MessageLog = {
              id: Date.now().toString(),
              channel: messageChannel,
              direction: 'OUTBOUND',
              timestamp: timestamp,
              content: generatedMessage,
              sentBy: CURRENT_USER.firstName
          };

          const noteTimestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const newNote = `[${noteTimestamp}] Sent ${messageChannel === 'EMAIL' ? 'Email' : 'SMS'}: "${generatedMessage.substring(0, 30)}..."`;
          
          const updatedMember = {
              ...member,
              notes: [newNote, ...member.notes],
              messageLog: [logEntry, ...(member.messageLog || [])]
          };
          
          if (onUpdateMember) {
              onUpdateMember(updatedMember);
          }
          
          setGeneratedMessage('');
          setEmailSubject('Checking in');
      }
      setIsSending(false);
  };

  const handleLogReply = () => {
      if (!replyContent.trim() || !onUpdateMember) return;

      const timestamp = new Date().toISOString();
      const logEntry: MessageLog = {
          id: `reply-${Date.now()}`,
          channel: messageChannel, // Assume same channel as current toggle or default
          direction: 'INBOUND',
          timestamp: timestamp,
          content: replyContent,
          sentBy: member.firstName
      };

      const noteTimestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newNote = `[${noteTimestamp}] Received Reply: "${replyContent.substring(0, 30)}..."`;

      const updatedMember = {
          ...member,
          notes: [newNote, ...member.notes],
          messageLog: [logEntry, ...(member.messageLog || [])]
      };

      onUpdateMember(updatedMember);
      setReplyContent('');
      setIsLoggingReply(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content - Fullscreen on mobile, rounded/centered on tablet+ */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-background md:rounded-2xl shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shrink-0">
           <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-base md:text-xl shrink-0 border-2 border-white shadow-sm">
                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{member.firstName} {member.lastName}</h2>
                <div className="flex gap-2 mt-0.5 md:mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-medium uppercase tracking-wider ${
                        member.pathway === PathwayType.NEWCOMER ? 'bg-secondary/30 text-primary' : 'bg-green-100 text-green-700'
                    }`}>
                        {member.pathway}
                    </span>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
             <IoCloseOutline size={24} className="text-gray-500" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
            
            {/* 1. Personal Details & Contact */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
                    <IoPersonOutline /> Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                     {/* Contact Info */}
                     <div className="space-y-4">
                         <div className="flex items-start gap-3 text-gray-600">
                             <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                 <IoMailOutline size={16} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Email</p>
                                 <a href={`mailto:${member.email}`} className="text-sm font-medium text-gray-800 hover:text-primary hover:underline truncate block transition-colors">
                                     {member.email}
                                 </a>
                             </div>
                         </div>
                         <div className="flex items-start gap-3 text-gray-600">
                             <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                 <IoCallOutline size={16} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Phone</p>
                                 <a href={`tel:${member.phone}`} className="text-sm font-medium text-gray-800 hover:text-primary hover:underline transition-colors">
                                     {member.phone}
                                 </a>
                             </div>
                         </div>
                     </div>

                     {/* Meta Info */}
                     <div className="space-y-4">
                         <div className="flex items-start gap-3 text-gray-600">
                             <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                 <IoCalendarOutline size={16} />
                             </div>
                             <div className="flex-1">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Joined Date</p>
                                 <p className="text-sm font-medium text-gray-800">
                                     {new Date(member.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-start gap-3 text-gray-600">
                             <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                 <IoCheckmarkCircleOutline size={16} />
                             </div>
                             <div className="flex-1">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Status</p>
                                 <span className={`inline-flex mt-0.5 items-center px-2 py-0.5 rounded text-xs font-bold ${
                                     member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                 }`}>
                                     {member.status}
                                 </span>
                             </div>
                         </div>
                     </div>
                </div>
                
                {/* Tags */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <IoPricetagsOutline className="text-gray-400" size={18} />
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1.5">
                            {member.tags.length > 0 ? member.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                                    {tag}
                                </span>
                            )) : <span className="text-sm text-gray-400 italic">No tags assigned</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Pathway Progress */}
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

            {/* 3. Discipleship Resources */}
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

            {/* 4. AI Journey Analysis */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-secondary/20 to-background p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-navy font-bold text-sm">
                        <IoSparklesOutline size={16} />
                        Gemini Journey Tracker
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
                        <p className="text-sm text-gray-500">Analysis unavailable.</p>
                    )}
                </div>
            </div>

            {/* 5. Message Logs & Chat */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[60vh] md:h-[600px]">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <IoChatbubbleOutline /> Communication Log
                    </h3>
                    <div className="flex gap-2">
                        {!isLoggingReply && (
                            <button 
                                onClick={() => setIsLoggingReply(true)}
                                className="text-xs flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-bold hover:bg-green-100 transition-colors"
                            >
                                <IoReturnDownBackOutline /> Log Reply
                            </button>
                        )}
                    </div>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto space-y-4 px-2 mb-4 scrollbar-thin">
                    {member.messageLog && member.messageLog.length > 0 ? (
                        // Sort by timestamp if not already sorted, though typically appended chronologically
                         [...member.messageLog].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((log) => {
                             const isOutbound = log.direction === 'OUTBOUND' || !log.direction;
                             return (
                                 <div key={log.id} className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                                         isOutbound ? 'bg-blue-50 border-blue-100 rounded-br-none' : 'bg-gray-50 border-gray-200 rounded-bl-none'
                                     }`}>
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className={`text-[10px] font-bold uppercase tracking-wide ${isOutbound ? 'text-primary' : 'text-gray-600'}`}>
                                                 {isOutbound ? `Sent by ${log.sentBy}` : `${member.firstName} (Reply)`}
                                             </span>
                                             <span className="text-[10px] text-gray-400">
                                                 {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </span>
                                         </div>
                                         <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{log.content}</p>
                                         <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                                             {log.channel === 'SMS' ? <IoPhonePortraitOutline size={10} /> : <IoMailOutline size={10} />}
                                             <span>{log.channel}</span>
                                         </div>
                                     </div>
                                 </div>
                             );
                         })
                    ) : (
                        <div className="text-center py-20 text-gray-300 flex flex-col items-center">
                            <IoChatbubbleOutline size={32} className="mb-2 opacity-50" />
                            <p>No messages found. Start the conversation!</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="shrink-0">
                    {isLoggingReply ? (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-gray-600">Log Inbound Reply</h4>
                                <button onClick={() => setIsLoggingReply(false)} className="text-gray-400 hover:text-gray-600"><IoCloseOutline /></button>
                            </div>
                            <textarea 
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`What did ${member.firstName} say?`}
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-500 mb-2"
                                rows={3}
                            />
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleLogReply}
                                    disabled={!replyContent.trim()}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                                >
                                    Save Reply
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Channel Toggle & AI Gen (Existing functionality preserved but compressed) */}
                            <div className="flex items-center gap-2">
                                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                                    <button 
                                        onClick={() => setMessageChannel('SMS')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                                            messageChannel === 'SMS' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <IoPhonePortraitOutline size={12}/> SMS
                                    </button>
                                    <button 
                                        onClick={() => setMessageChannel('EMAIL')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                                            messageChannel === 'EMAIL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <IoMailOutline size={12}/> Email
                                    </button>
                                </div>
                                
                                {!generatedMessage && (
                                    <button 
                                        onClick={handleGenerateMessage}
                                        disabled={isLoading}
                                        className="text-xs bg-secondary/20 text-navy px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-secondary/40 disabled:opacity-50 ml-auto"
                                    >
                                        <IoSparklesOutline size={12} />
                                        AI Draft
                                    </button>
                                )}
                            </div>

                            {messageChannel === 'EMAIL' && generatedMessage && (
                                <input 
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary"
                                    placeholder="Subject..."
                                />
                            )}

                            <div className="relative">
                                <textarea 
                                    className="w-full p-4 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    rows={2}
                                    value={generatedMessage}
                                    onChange={(e) => setGeneratedMessage(e.target.value)}
                                    placeholder={`Message to ${member.firstName}...`}
                                />
                                <div className="absolute right-2 bottom-2">
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={isSending || !generatedMessage.trim()}
                                        className="p-2 bg-primary text-white rounded-lg hover:bg-navy disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                                    >
                                        {isSending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                        ) : (
                                            <IoSendOutline size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 7. Notes Log - Preserved */}
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
