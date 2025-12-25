import React, { useState, useRef, useEffect } from 'react';
import { IoNotificationsOutline, IoMailOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Task, Member } from '../types';
import { sendEmail } from '../services/communicationService';

interface NotificationCenterProps {
  tasks: Task[];
  members: Member[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ tasks, members }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <IoNotificationsOutline size={24} />
        {upcomingTasks.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {upcomingTasks.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Due Soon (48h)</h3>
            <span className="text-xs text-white bg-primary px-2 py-0.5 rounded-full">{upcomingTasks.length}</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;