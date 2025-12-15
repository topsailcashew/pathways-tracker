
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
      case TaskPriority.HIGH: return 'text-red-500 bg-red-50 border-red-100';
      case TaskPriority.MEDIUM: return 'text-orange-500 bg-orange-50 border-orange-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  const isTaskOverdue = (task: Task) => !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Assigned Tasks</h2>
        
        <div className="flex flex-wrap gap-3">
            <div className="relative group">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300">
                    <IoSwapVerticalOutline />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-4">
                        <option value="DUE_DATE_ASC">Due Date (Earliest)</option>
                        <option value="DUE_DATE_DESC">Due Date (Latest)</option>
                        <option value="PRIORITY_HIGH">Priority (High First)</option>
                        <option value="PRIORITY_LOW">Priority (Low First)</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
            <div key={task.id} className={`p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${task.completed ? 'bg-gray-50 border-gray-200 opacity-60' : isOverdue ? 'bg-white border-red-200 shadow-sm hover:shadow-md' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-start gap-4">
                <button onClick={() => toggleTask(task.id)} className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${task.completed ? 'bg-success border-success text-white' : 'bg-white border-gray-300 text-transparent hover:border-primary'}`}>
                  <IoCheckboxOutline size={12} />
                </button>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1 gap-2">
                    <h3 className={`font-semibold text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.description}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                       {isOverdue && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded"><IoAlertCircleOutline size={12} /> Overdue</span>}
                       <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">For: <span className="font-medium text-primary">{getMemberName(task.memberId)}</span></p>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                      <div className={`flex items-center gap-4 text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-400 font-medium'}`}>
                        <div className="flex items-center gap-1"><IoCalendarOutline size={14} /><span>Due: {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); downloadTaskICS(task.description, `Priority: ${task.priority}`, task.dueDate); }} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-500 hover:text-primary hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                          <IoDownloadOutline size={14} /> Add to Calendar
                      </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {processedTasks.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300"><IoCheckboxOutline className="mx-auto text-gray-300 mb-3" size={32} /><p className="text-gray-500">No tasks found matching filters.</p></div>}
      </div>
    </div>
  );
};

export default TaskList;
