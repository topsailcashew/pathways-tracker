import React, { useState, useEffect } from 'react';
import {
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoMailOutline,
    IoCallOutline,
    IoPersonAddOutline,
    IoTrophyOutline,
    IoCloseOutline,
} from 'react-icons/io5';
import * as membersApi from '../api/members';
import * as tasksApi from '../api/tasks';
import * as communicationsApi from '../api/communications';

interface TimelineEvent {
    id: string;
    type: 'milestone' | 'task' | 'communication' | 'status_change';
    date: Date;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface MemberJourneyTimelineProps {
    memberId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const MemberJourneyTimeline: React.FC<MemberJourneyTimelineProps> = ({
    memberId,
    isOpen,
    onClose,
}) => {
    const [member, setMember] = useState<any>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && memberId) {
            loadTimeline();
        }
    }, [isOpen, memberId]);

    const loadTimeline = async () => {
        setIsLoading(true);
        try {
            // Load member data
            const memberData = await membersApi.getMemberById(memberId);
            setMember(memberData);

            // Load related data
            const [tasks, messages] = await Promise.all([
                tasksApi.getTasks().then(tasks => tasks.filter(t => t.memberId === memberId)),
                communicationsApi.getMessageHistory(memberId),
            ]);

            // Build timeline
            const events: TimelineEvent[] = [];

            // Member joined
            events.push({
                id: 'joined',
                type: 'milestone',
                date: new Date(memberData.joinedDate),
                title: 'Member Joined',
                description: `${memberData.firstName} ${memberData.lastName} joined as ${memberData.pathway.replace('_', ' ')}`,
                icon: <IoPersonAddOutline size={20} className="text-blue-600" />,
                color: 'blue',
            });

            // Stage changes (if we have history)
            if (memberData.stageHistory && Array.isArray(memberData.stageHistory)) {
                memberData.stageHistory.forEach((stageChange: any) => {
                    events.push({
                        id: `stage-${stageChange.id}`,
                        type: 'milestone',
                        date: new Date(stageChange.changedAt),
                        title: `Advanced to ${stageChange.stageName}`,
                        description: `Moved to the ${stageChange.stageName} stage`,
                        icon: <IoTrophyOutline size={20} className="text-green-600" />,
                        color: 'green',
                    });
                });
            }

            // Tasks
            tasks.forEach(task => {
                if (task.status === 'COMPLETED' && task.completedAt) {
                    events.push({
                        id: `task-${task.id}`,
                        type: 'task',
                        date: new Date(task.completedAt),
                        title: `Completed: ${task.title}`,
                        description: task.description || 'Task completed',
                        icon: <IoCheckmarkCircleOutline size={20} className="text-green-600" />,
                        color: 'green',
                    });
                } else if (task.createdAt) {
                    events.push({
                        id: `task-created-${task.id}`,
                        type: 'task',
                        date: new Date(task.createdAt),
                        title: `Task Assigned: ${task.title}`,
                        description: task.description || 'New task assigned',
                        icon: <IoTimeOutline size={20} className="text-orange-600" />,
                        color: 'orange',
                    });
                }
            });

            // Communications
            messages.forEach(message => {
                const icon = message.channel === 'EMAIL'
                    ? <IoMailOutline size={20} className="text-purple-600" />
                    : <IoCallOutline size={20} className="text-purple-600" />;

                events.push({
                    id: `message-${message.id}`,
                    type: 'communication',
                    date: new Date(message.sentAt),
                    title: `${message.channel} ${message.direction === 'OUTBOUND' ? 'sent' : 'received'}`,
                    description: message.subject || message.content?.substring(0, 100) || 'Communication',
                    icon,
                    color: 'purple',
                });
            });

            // Sort by date (most recent first)
            events.sort((a, b) => b.date.getTime() - a.date.getTime());

            setTimeline(events);
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
            green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
            orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
            purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
            gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
        };
        return colors[color] || colors.gray;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Member Journey</h2>
                        {member && (
                            <p className="text-sm text-gray-600 mt-1">
                                {member.firstName} {member.lastName}'s pathway timeline
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <IoCloseOutline size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : timeline.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <IoTimeOutline size={64} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No timeline events yet</p>
                            <p className="text-sm mt-2">Events will appear as the member progresses</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                            {/* Timeline events */}
                            <div className="space-y-6">
                                {timeline.map((event) => {
                                    const colors = getColorClasses(event.color);
                                    return (
                                        <div key={event.id} className="relative flex gap-4">
                                            {/* Icon */}
                                            <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center`}>
                                                {event.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-6">
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className={`font-semibold ${colors.text}`}>
                                                            {event.title}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                                            {formatDate(event.date)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        {event.description}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="capitalize">{event.type.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span>{formatDateTime(event.date)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {!isLoading && member && (
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {timeline.filter(e => e.type === 'milestone').length}
                                </p>
                                <p className="text-sm text-gray-600">Milestones</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {timeline.filter(e => e.type === 'task' && e.title.includes('Completed')).length}
                                </p>
                                <p className="text-sm text-gray-600">Tasks Completed</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {timeline.filter(e => e.type === 'communication').length}
                                </p>
                                <p className="text-sm text-gray-600">Communications</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberJourneyTimeline;
