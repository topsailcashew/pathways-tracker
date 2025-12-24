import React, { useState } from 'react';
import { IoMailOutline, IoChatbubblesOutline, IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import * as communicationsApi from '../src/api/communications';
import { useToast } from '../src/components/Toast';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

interface BulkActionsProps {
    selectedMembers: Member[];
    onComplete: () => void;
    onCancel: () => void;
}

export const BulkCommunications: React.FC<BulkActionsProps> = ({
    selectedMembers,
    onComplete,
    onCancel,
}) => {
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState({ sent: 0, total: 0 });

    const [emailData, setEmailData] = useState({
        subject: '',
        content: '',
    });

    const [smsData, setSmsData] = useState({
        content: '',
    });

    const membersWithEmail = selectedMembers.filter(m => m.email);
    const membersWithPhone = selectedMembers.filter(m => m.phone);

    const handleSendBulkEmail = async () => {
        if (!emailData.subject || !emailData.content) {
            showError('Please fill in all fields');
            return;
        }

        if (membersWithEmail.length === 0) {
            showError('No members with email addresses selected');
            return;
        }

        setIsSending(true);
        setProgress({ sent: 0, total: membersWithEmail.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < membersWithEmail.length; i++) {
            const member = membersWithEmail[i];
            try {
                await communicationsApi.sendEmail({
                    memberId: member.id,
                    subject: emailData.subject,
                    content: personalizeMessage(emailData.content, member),
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to send email to ${member.firstName} ${member.lastName}:`, error);
                failCount++;
            }
            setProgress({ sent: i + 1, total: membersWithEmail.length });
        }

        setIsSending(false);

        if (successCount > 0) {
            showSuccess(`Sent ${successCount} email${successCount > 1 ? 's' : ''} successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
        }
        if (failCount > 0 && successCount === 0) {
            showError(`Failed to send all ${failCount} emails`);
        }

        onComplete();
    };

    const handleSendBulkSMS = async () => {
        if (!smsData.content) {
            showError('Please enter a message');
            return;
        }

        if (membersWithPhone.length === 0) {
            showError('No members with phone numbers selected');
            return;
        }

        if (smsData.content.length > 1600) {
            showError('SMS message is too long (max 1600 characters)');
            return;
        }

        setIsSending(true);
        setProgress({ sent: 0, total: membersWithPhone.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < membersWithPhone.length; i++) {
            const member = membersWithPhone[i];
            try {
                await communicationsApi.sendSMS({
                    memberId: member.id,
                    content: personalizeMessage(smsData.content, member),
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to send SMS to ${member.firstName} ${member.lastName}:`, error);
                failCount++;
            }
            setProgress({ sent: i + 1, total: membersWithPhone.length });
        }

        setIsSending(false);

        if (successCount > 0) {
            showSuccess(`Sent ${successCount} SMS${successCount > 1 ? ' messages' : ''} successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
        }
        if (failCount > 0 && successCount === 0) {
            showError(`Failed to send all ${failCount} SMS messages`);
        }

        onComplete();
    };

    const personalizeMessage = (message: string, member: Member): string => {
        return message
            .replace(/\[First Name\]/g, member.firstName)
            .replace(/\[Last Name\]/g, member.lastName)
            .replace(/\[Full Name\]/g, `${member.firstName} ${member.lastName}`);
    };

    const insertPlaceholder = (placeholder: string) => {
        if (activeTab === 'email') {
            setEmailData({
                ...emailData,
                content: emailData.content + `[${placeholder}]`,
            });
        } else {
            setSmsData({
                content: smsData.content + `[${placeholder}]`,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Bulk Communications
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Send messages to {selectedMembers.length} selected member{selectedMembers.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isSending}
                    >
                        <IoCloseOutline size={28} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                            activeTab === 'email'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <IoMailOutline size={20} />
                        Email ({membersWithEmail.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sms')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                            activeTab === 'sms'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <IoChatbubblesOutline size={20} />
                        SMS ({membersWithPhone.length})
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'email' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    value={emailData.subject}
                                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                    placeholder="Enter email subject"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    value={emailData.content}
                                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                                    placeholder="Enter your message..."
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSending}
                                />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <span className="text-sm text-gray-600">Personalize:</span>
                                <button
                                    onClick={() => insertPlaceholder('First Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [First Name]
                                </button>
                                <button
                                    onClick={() => insertPlaceholder('Last Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [Last Name]
                                </button>
                                <button
                                    onClick={() => insertPlaceholder('Full Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [Full Name]
                                </button>
                            </div>

                            {membersWithEmail.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    None of the selected members have email addresses.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message * <span className="text-xs text-gray-500">({smsData.content.length}/1600)</span>
                                </label>
                                <textarea
                                    value={smsData.content}
                                    onChange={(e) => setSmsData({ content: e.target.value })}
                                    placeholder="Enter your SMS message..."
                                    rows={8}
                                    maxLength={1600}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSending}
                                />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <span className="text-sm text-gray-600">Personalize:</span>
                                <button
                                    onClick={() => insertPlaceholder('First Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [First Name]
                                </button>
                                <button
                                    onClick={() => insertPlaceholder('Last Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [Last Name]
                                </button>
                                <button
                                    onClick={() => insertPlaceholder('Full Name')}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                    disabled={isSending}
                                >
                                    [Full Name]
                                </button>
                            </div>

                            {membersWithPhone.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    None of the selected members have phone numbers.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress */}
                    {isSending && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="text-sm font-medium text-blue-800">
                                    Sending... {progress.sent} of {progress.total}
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        disabled={isSending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={activeTab === 'email' ? handleSendBulkEmail : handleSendBulkSMS}
                        disabled={isSending || (activeTab === 'email' ? membersWithEmail.length === 0 : membersWithPhone.length === 0)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline size={20} />
                                Send {activeTab === 'email' ? 'Emails' : 'SMS Messages'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkCommunications;
