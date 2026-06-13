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
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#6B6960] hover:bg-[#FAF8F4] rounded-full transition-colors focus:outline-none"
      >
        <IoNotificationsOutline size={22} />
        {totalBadgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B42626] text-white text-[10px] font-bold flex items-center justify-center">
            {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-lg border border-[#E5E0D2] w-96 z-50 overflow-hidden animate-fade-in origin-top-right">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E5E0D2] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#14213D]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#6B6960] hover:text-[#14213D] flex items-center gap-1 transition-colors"
              >
                <IoCheckmarkDoneOutline size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Tabs — underline style */}
          <div className="flex border-b border-[#E5E0D2] px-5">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-3 text-xs font-medium mr-6 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-[#FCA311] text-[#14213D] font-medium'
                  : 'text-[#6B6960] hover:text-[#14213D]'
              }`}
            >
              Inbox {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FEECD0] text-[#B8732A] rounded-full text-[10px] font-semibold">{unreadCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-3 text-xs font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'border-b-2 border-[#FCA311] text-[#14213D] font-medium'
                  : 'text-[#6B6960] hover:text-[#14213D]'
              }`}
            >
              Due Soon {upcomingTasks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FEECD0] text-[#B8732A] rounded-full text-[10px] font-semibold">{upcomingTasks.length}</span>
              )}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'notifications' ? (
              <>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#9E9D95] text-sm flex flex-col items-center">
                    <IoCheckmarkCircleOutline size={32} className="mb-2 text-[#4F7E50] opacity-40" />
                    <p>No notifications.</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && handleMarkRead(notif.id)}
                        className={`px-5 py-4 border-b border-[#E5E0D2] hover:bg-[#FAF8F4] flex items-start gap-3 cursor-pointer transition-colors ${!notif.read ? 'bg-[#FEF6E8]/40' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'SERVE_TEAM_REFERRAL' ? 'bg-[#Ace5d6]/30' : 'bg-[#EFEBE0]'
                        }`}>
                          {notif.type === 'SERVE_TEAM_REFERRAL' ? (
                            <IoHandLeftOutline size={14} className="text-[#14213D]" />
                          ) : (
                            <IoNotificationsOutline size={14} className="text-[#6B6960]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[#14213D] line-clamp-1">{notif.title}</p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-[#FCA311] shrink-0 mt-1.5 self-start" />}
                          </div>
                          <p className="text-xs text-[#6B6960] line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-[#9E9D95] mt-1">{getTimeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              upcomingTasks.length === 0 ? (
                <div className="p-8 text-center text-[#9E9D95] text-sm flex flex-col items-center">
                  <IoCheckmarkCircleOutline size={32} className="mb-2 text-[#4F7E50] opacity-40" />
                  <p>No tasks due in the next 48h.</p>
                </div>
              ) : (
                <div>
                  {upcomingTasks.map(task => {
                    const member = (members || []).find(m => m.id === task.memberId);
                    return (
                      <div key={task.id} className="px-5 py-4 border-b border-[#E5E0D2] hover:bg-[#FAF8F4] transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-semibold text-[#14213D] line-clamp-1">{task.description}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ml-2 ${
                            task.dueDate === todayStr
                              ? 'bg-[#FBE5E5] text-[#B42626]'
                              : 'bg-[#FEECD0] text-[#B8732A]'
                          }`}>
                            {task.dueDate === todayStr ? 'Today' : 'Tomorrow'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6960] mb-3">
                          Member: <span className="font-medium text-[#1F2D52]">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</span>
                        </p>
                        <button
                          onClick={() => handleSendReminder(task)}
                          className="w-full flex items-center justify-center gap-2 text-xs bg-white border border-[#D8D2C2] text-[#14213D] py-1.5 rounded-lg hover:bg-[#FAF8F4] transition-colors font-semibold"
                        >
                          <IoMailOutline size={14} /> Send Email Reminder
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
