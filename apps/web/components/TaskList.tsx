
import React, { useState } from 'react';
import { IoCalendarOutline, IoCheckboxOutline, IoAlertCircleOutline, IoDownloadOutline, IoSwapVerticalOutline } from 'react-icons/io5';
import { Task, TaskPriority } from '../types';
import { downloadTaskICS } from '../services/calendarService';
import { useAppContext } from '../context/AppContext';

const TaskList: React.FC = () => {
  const { tasks, members, toggleTask } = useAppContext();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [sortBy, setSortBy] = useState<'DUE_DATE_ASC' | 'DUE_DATE_DESC' | 'PRIORITY_HIGH' | 'PRIORITY_LOW'>('DUE_DATE_ASC');

  const priorityScore = (p: TaskPriority) => {
      switch(p) {
          case TaskPriority.HIGH: return 3;
          case TaskPriority.MEDIUM: return 2;
          case TaskPriority.LOW: return 1;
          default: return 0;
      }
  };

  const processedTasks = tasks
    .filter(task => {
        if (filter === 'PENDING') return !task.completed;
        if (filter === 'COMPLETED') return task.completed;
        return true;
    })
    .sort((a, b) => {
        switch(sortBy) {
            case 'DUE_DATE_ASC': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'DUE_DATE_DESC': return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            case 'PRIORITY_HIGH': return priorityScore(b.priority) - priorityScore(a.priority) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'PRIORITY_LOW': return priorityScore(a.priority) - priorityScore(b.priority);
            default: return 0;
        }
    });

  const getMemberName = (id: string) => {
    const m = members.find(mem => mem.id === id);
    return m ? `${m.firstName} ${m.lastName}` : 'Unknown Member';
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.HIGH: return 'text-[#B42626] bg-[#FDE8E8] border-[#F5C6C6]';
      case TaskPriority.MEDIUM: return 'text-[#B8732A] bg-[#FEF6E8] border-[#FEECD0]';
      default: return 'text-[#6B6960] bg-[#FAF8F4] border-[#EFEBE0]';
    }
  };

  const isTaskOverdue = (task: Task) => !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-[2.125rem] font-bold tracking-tight text-[#14213D]">Assigned Tasks</h2>

        <div className="flex flex-wrap gap-3">
            <div className="relative group">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#D8D2C2] text-sm text-[#1F2D52] hover:bg-[#FAF8F4] transition-colors">
                    <IoSwapVerticalOutline className="text-[#6B6960]" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-4 text-[#1F2D52]">
                        <option value="DUE_DATE_ASC">Due Date (Earliest)</option>
                        <option value="DUE_DATE_DESC">Due Date (Latest)</option>
                        <option value="PRIORITY_HIGH">Priority (High First)</option>
                        <option value="PRIORITY_LOW">Priority (Low First)</option>
                    </select>
                </div>
            </div>

            <div className="flex bg-[#FAF8F4] p-1 rounded-full">
                {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                            filter === f
                                ? 'bg-white border border-[#D8D2C2] text-[#14213D]'
                                : 'text-[#6B6960]'
                        }`}
                    >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid gap-3">
        {processedTasks.map((task) => {
          const isOverdue = isTaskOverdue(task);
          return (
            <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                    task.completed
                        ? 'bg-[#FAF8F4] border-[#E5E0D2] opacity-60'
                        : isOverdue
                        ? 'bg-white border-[#B42626]/30 shadow-sm hover:shadow-md'
                        : 'bg-white border-[#E5E0D2] shadow-sm hover:shadow-md'
                }`}
            >
              <div className="flex items-start gap-4">
                <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        task.completed
                            ? 'bg-[#4F7E50] border-[#4F7E50] text-white'
                            : 'bg-white border-[#D8D2C2] text-transparent hover:border-[#14213D]'
                    }`}
                >
                  <IoCheckboxOutline size={12} />
                </button>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1 gap-2">
                    <h3 className={`font-semibold text-[#14213D] ${task.completed ? 'line-through text-[#9E9D95]' : ''}`}>
                        {task.description}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                       {isOverdue && (
                           <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B42626] bg-[#FDE8E8] px-2 py-0.5 rounded-[4px]">
                               <IoAlertCircleOutline size={12} /> Overdue
                           </span>
                       )}
                       <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                           {task.priority}
                       </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#6B6960] mb-3">
                      For: <span className="font-medium text-[#14213D]">{getMemberName(task.memberId)}</span>
                  </p>

                  <div className="flex items-center justify-between border-t border-[#EFEBE0] pt-3 mt-1">
                      <div className={`flex items-center gap-4 text-xs ${isOverdue ? 'text-[#B42626] font-bold' : 'text-[#9E9D95] font-medium'}`}>
                        <div className="flex items-center gap-1">
                            <IoCalendarOutline size={14} />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      <button
                          onClick={(e) => { e.stopPropagation(); downloadTaskICS(task.description, `Priority: ${task.priority}`, task.dueDate); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#6B6960] hover:text-[#14213D] hover:bg-[#FAF8F4] px-2 py-1 rounded-lg transition-colors"
                      >
                          <IoDownloadOutline size={14} /> Add to Calendar
                      </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {processedTasks.length === 0 && (
            <div className="text-center py-12 bg-[#FAF8F4] rounded-xl border border-dashed border-[#E5E0D2]">
                <IoCheckboxOutline className="mx-auto text-[#9E9D95] mb-3" size={32} />
                <p className="text-sm text-[#6B6960]">No tasks found matching filters.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
