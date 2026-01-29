
import React, { useState } from 'react';
import { IoChatbubbleOutline, IoSendOutline, IoPhonePortraitOutline, IoMailOutline, IoSparklesOutline, IoReturnDownBackOutline, IoCloseOutline } from 'react-icons/io5';
import { Member, MessageLog } from '../types';
import { generateFollowUpMessage } from '../services/geminiService';
import { sendEmail, sendSMS } from '../services/communicationService';
import { CURRENT_USER } from '../constants';

interface CommunicationLogProps {
  member: Member;
  onUpdateMember: (updated: Member) => void;
}

const CommunicationLog: React.FC<CommunicationLogProps> = ({ member, onUpdateMember }) => {
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
    <div className={`bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col ${hasMessages ? 'h-[60vh] md:h-[600px]' : ''}`}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 shrink-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {hasMessages ? <><IoChatbubbleOutline /> Communication Log</> : <><IoSendOutline /> Send Message</>}
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
        {hasMessages && (
            <div className="flex-1 overflow-y-auto space-y-4 px-2 mb-4 scrollbar-thin">
                {member.messageLog && member.messageLog.length > 0 ? (
                    // Sort by timestamp if not already sorted
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
        )}

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
                    {/* Channel Toggle & AI Gen */}
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
                                Smart Draft
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
  );
};

export default CommunicationLog;
