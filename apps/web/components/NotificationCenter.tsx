import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoNotificationsOutline, IoMailOutline, IoCheckmarkCircleOutline, IoHandLeftOutline, IoCheckmarkDoneOutline } from 'react-icons/io5';
import { Task, Member } from '../types';
import { sendEmail } from '../services/communicationService';
import { getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from '../src/api/notifications';

interface NotificationCenterProps {
  tasks: Task[];
  members: Member[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ tasks, members }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications'>('notifications');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // DB Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently fail — user may not be authenticated yet
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate upcoming tasks (Due Today or Tomorrow)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const upcomingTasks = (tasks || []).filter(task => {
    if (task.completed) return false;
    return task.dueDate === todayStr || task.dueDate === tomorrowStr;
  });

  const totalBadgeCount = upcomingTasks.length + unreadCount;

  const handleSendReminder = async (task: Task) => {
      const member = (members || []).find(m => m.id === task.memberId);
      if (!member || !member.email) return;

      const success = await sendEmail(
          member.email,
          `Reminder: ${task.description}`,
          `Hi ${member.firstName},\n\nThis is a friendly reminder about: ${task.description}.\n\nDue Date: ${task.dueDate}\n\nBest,\nPathway Team`
      );

      if(success) {
        alert(`Reminder sent to ${member.email}`);
      }
  };

  const handleMarkRead = async (id: string) => {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
  };

  const getTimeAgo = (dateStr: string) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <IoNotificationsOutline size={24} />
        {totalBadgeCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'notifications'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Notifications {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px]">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'tasks'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Due Soon {upcomingTasks.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px]">{upcomingTasks.length}</span>}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'notifications' ? (
              <>
                {/* Mark all read header */}
                {unreadCount > 0 && (
                  <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-50 flex justify-end">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <IoCheckmarkDoneOutline size={12} /> Mark all read
                    </button>
                  </div>
                )}
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                    <IoCheckmarkCircleOutline size={32} className="mb-2 text-green-400 opacity-50"/>
                    <p>No notifications.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && handleMarkRead(notif.id)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'SERVE_TEAM_REFERRAL' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {notif.type === 'SERVE_TEAM_REFERRAL' ? (
                              <IoHandLeftOutline size={14} className="text-blue-600" />
                            ) : (
                              <IoNotificationsOutline size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-800 line-clamp-1">{notif.title}</p>
                              {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{getTimeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Tasks Tab */
              upcomingTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                    <IoCheckmarkCircleOutline size={32} className="mb-2 text-green-400 opacity-50"/>
                    <p>No tasks due in the next 48h.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                    {upcomingTasks.map(task => {
                        const member = (members || []).find(m => m.id === task.memberId);
                        return (
                            <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{task.description}</p>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${task.dueDate === todayStr ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {task.dueDate === todayStr ? 'Today' : 'Tomorrow'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    Member: <span className="font-medium text-gray-700">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</span>
                                </p>
                                <button
                                    onClick={() => handleSendReminder(task)}
                                    className="w-full flex items-center justify-center gap-2 text-xs bg-white border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors font-medium group"
                                >
                                    <IoMailOutline size={14} className="group-hover:animate-pulse" /> Send Email Reminder
                                </button>
                            </div>
                        );
                    })}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
