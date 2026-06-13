
import React, { useState } from 'react';
import { IoChatbubbleOutline, IoSendOutline, IoPhonePortraitOutline, IoMailOutline, IoSparklesOutline, IoReturnDownBackOutline, IoCloseOutline } from 'react-icons/io5';
import { Member, MessageLog } from '../types';
import { generateFollowUpMessage } from '../services/geminiService';
import { sendEmail, sendSMS } from '../services/communicationService';
import { CURRENT_USER } from '../constants';
import { useAppContext } from '../context/AppContext';

interface CommunicationLogProps {
  member: Member;
  onUpdateMember: (updated: Member) => void;
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ member, onUpdateMember }) => {
  const { churchSettings } = useAppContext();
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'SMS' | 'EMAIL'>('SMS');
  const [emailSubject, setEmailSubject] = useState('Checking in');

  // Inbound Reply State
  const [isLoggingReply, setIsLoggingReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const hasMessages = member.messageLog && member.messageLog.length > 0;

  const handleGenerateMessage = async () => {
    setIsLoading(true);
    const msg = await generateFollowUpMessage(member, churchSettings.name);
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
              notes: [newNote, ...(member.notes || [])],
              messageLog: [logEntry, ...(member.messageLog || [])]
          };

          onUpdateMember(updatedMember);
          setGeneratedMessage('');
          setEmailSubject('Checking in');
      }
      setIsSending(false);
  };

  const handleLogReply = () => {
      if (!replyContent.trim()) return;

      const timestamp = new Date().toISOString();
      const logEntry: MessageLog = {
          id: `reply-${Date.now()}`,
          channel: messageChannel,
          direction: 'INBOUND',
          timestamp: timestamp,
          content: replyContent,
          sentBy: member.firstName
      };

      const noteTimestamp = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newNote = `[${noteTimestamp}] Received Reply: "${replyContent.substring(0, 30)}..."`;

      const updatedMember = {
          ...member,
          notes: [newNote, ...(member.notes || [])],
          messageLog: [logEntry, ...(member.messageLog || [])]
      };

      onUpdateMember(updatedMember);
      setReplyContent('');
      setIsLoggingReply(false);
  };

  return (
    <div className={`bg-white p-4 md:p-6 rounded-2xl border border-[#E5E0D2] shadow-sm flex flex-col ${hasMessages ? 'h-[60vh] md:h-[600px]' : ''}`}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E5E0D2] shrink-0">
            <h3 className="text-lg font-bold text-[#14213D] flex items-center gap-2">
                {hasMessages ? <><IoChatbubbleOutline /> Communication Log</> : <><IoSendOutline /> Send Message</>}
            </h3>
            <div className="flex gap-2">
                {!isLoggingReply && (
                    <button
                        onClick={() => setIsLoggingReply(true)}
                        className="text-xs flex items-center gap-1 bg-[#EFEBE0] text-[#6B6960] px-3 py-1.5 rounded-full font-semibold hover:bg-[#E0D9C8] transition-colors"
                    >
                        <IoReturnDownBackOutline /> Log Reply
                    </button>
                )}
            </div>
        </div>

        {/* Chat Feed */}
        {hasMessages && (
            <div className="flex-1 overflow-y-auto space-y-4 px-2 mb-4 scrollbar-thin">
                {member.messageLog && member.messageLog.length > 0 ? (
                    [...member.messageLog].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((log) => {
                        const isOutbound = log.direction === 'OUTBOUND' || !log.direction;
                        return (
                            <div key={log.id} className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                                    isOutbound
                                      ? 'bg-[#FAF8F4] border-[#E5E0D2] rounded-br-none'
                                      : 'bg-white border-[#E5E0D2] rounded-bl-none'
                                }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${isOutbound ? 'text-[#14213D]' : 'text-[#6B6960]'}`}>
                                            {isOutbound ? `Sent by ${log.sentBy}` : `${member.firstName} (Reply)`}
                                        </span>
                                        <span className="text-[10px] text-[#9E9D95]">
                                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#14213D] leading-relaxed whitespace-pre-wrap">{log.content}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#9E9D95]">
                                        {log.channel === 'SMS' ? <IoPhonePortraitOutline size={10} /> : <IoMailOutline size={10} />}
                                        <span>{log.channel}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 text-[#9E9D95] flex flex-col items-center">
                        <IoChatbubbleOutline size={32} className="mb-2 opacity-50" />
                        <p>No messages found. Start the conversation!</p>
                    </div>
                )}
            </div>
        )}

        {/* Input Area */}
        <div className="shrink-0">
            {isLoggingReply ? (
                <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#E5E0D2] animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960]">Log Inbound Reply</h4>
                        <button onClick={() => setIsLoggingReply(false)} className="text-[#9E9D95] hover:text-[#14213D] transition-colors">
                          <IoCloseOutline />
                        </button>
                    </div>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`What did ${member.firstName} say?`}
                        className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311] mb-2 resize-none"
                        rows={3}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleLogReply}
                            disabled={!replyContent.trim()}
                            className="bg-[#4F7E50] text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-[#255f40] transition-colors disabled:opacity-50"
                        >
                            Save Reply
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Channel Toggle & AI Gen */}
                    <div className="flex items-center gap-2">
                        <div className="bg-[#FAF8F4] rounded-full p-1 inline-flex">
                            <button
                                onClick={() => setMessageChannel('SMS')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                                    messageChannel === 'SMS'
                                      ? 'bg-white border border-[#D8D2C2] text-[#14213D] shadow-sm'
                                      : 'text-[#6B6960] hover:text-[#14213D]'
                                }`}
                            >
                                <IoPhonePortraitOutline size={12}/> SMS
                            </button>
                            <button
                                onClick={() => setMessageChannel('EMAIL')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                                    messageChannel === 'EMAIL'
                                      ? 'bg-white border border-[#D8D2C2] text-[#14213D] shadow-sm'
                                      : 'text-[#6B6960] hover:text-[#14213D]'
                                }`}
                            >
                                <IoMailOutline size={12}/> Email
                            </button>
                        </div>

                        {!generatedMessage && (
                            <button
                                onClick={handleGenerateMessage}
                                disabled={isLoading}
                                className="text-xs bg-[#FEECD0] text-[#B8732A] px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#F5D9A0] transition-colors disabled:opacity-50 ml-auto"
                            >
                                <IoSparklesOutline size={12} />
                                Smart Draft
                            </button>
                        )}
                    </div>

                    {messageChannel === 'EMAIL' && generatedMessage && (
                        <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311]"
                            placeholder="Subject..."
                        />
                    )}

                    <div className="relative">
                        <textarea
                            className="bg-white border border-[#D8D2C2] rounded-lg px-3 py-2.5 pr-14 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[rgba(46,102,229,0.20)] focus:border-[#FCA311] transition-all resize-none"
                            rows={2}
                            value={generatedMessage}
                            onChange={(e) => setGeneratedMessage(e.target.value)}
                            placeholder={`Message to ${member.firstName}...`}
                        />
                        <div className="absolute right-2 bottom-2">
                            <button
                                onClick={handleSendMessage}
                                disabled={isSending || !generatedMessage.trim()}
                                className="p-2 bg-[#14213D] text-white rounded-lg hover:bg-[#1F2D52] transition-colors disabled:opacity-50"
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
  );
};

export default CommunicationLog;
