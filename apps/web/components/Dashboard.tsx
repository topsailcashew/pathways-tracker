
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IoPeopleOutline, IoGitNetworkOutline, IoCheckboxOutline, IoWaterOutline,  IoTrophyOutline, IoStar, IoFlameOutline } from 'react-icons/io5';
import { PathwayType, MemberStatus, Member } from '../types';
import { useAppContext } from '../context/AppContext';
import MemberDetail from './MemberDetail';

const Dashboard: React.FC = () => {
  const { members, tasks, newcomerStages, newBelieverStages, updateMember } = useAppContext();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Ensure modal receives the latest version of the member from context
  const activeMember = selectedMember ? members.find(m => m.id === selectedMember.id) || selectedMember : null;

  // --- Data Processing ---

  // 1. KPI Counts
  const totalMembers = members.length;
  const newComers = members.filter(m => m.pathway === PathwayType.NEWCOMER && m.status === MemberStatus.ACTIVE).length;
  const newBelievers = members.filter(m => m.pathway === PathwayType.NEW_BELIEVER).length;

  // Tasks
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
  const pendingTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Gamification Stats
  const livesImpacted = Math.floor(completedTasksCount * 1.5) + members.length;
  const teamLevel = Math.floor(completedTasksCount / 10) + 1;
  const progressToNextLevel = (completedTasksCount % 10) * 10;

  // 2. Pipeline Data
  const pipelineData = newcomerStages.map(stage => ({
    name: stage.name,
    count: members.filter(m => m.pathway === PathwayType.NEWCOMER && m.currentStageId === stage.id).length
  }));

  // 3. New Believer Funnel
  const nbTotal = newBelievers;
  const baptismStageIndex = newBelieverStages.findIndex(s => s.name.toLowerCase().includes('baptism'));
  const nbBaptisms = members.filter(m => {
     if(m.pathway !== PathwayType.NEW_BELIEVER) return false;
     const mStageIndex = newBelieverStages.findIndex(s => s.id === m.currentStageId);
     return mStageIndex >= baptismStageIndex && baptismStageIndex !== -1;
  }).length;
  const nbIntegrated = members.filter(m => m.pathway === PathwayType.NEW_BELIEVER && m.status === MemberStatus.INTEGRATED).length;

  const conversionData = [
    { name: 'Decisions', count: nbTotal, color: '#FCA311' },
    { name: 'Baptisms', count: nbBaptisms, color: '#14213D' },
    { name: 'Integrated', count: nbIntegrated, color: '#4F7E50' },
  ];

  // 4. Task Pie Data
  const taskData = [
    { name: 'Completed', value: completedTasksCount, color: '#4F7E50' },
    { name: 'To Do', value: pendingTasks, color: '#EFEBE0' },
    { name: 'Overdue', value: overdueTasks, color: '#FCA311' },
  ];

  // 5. Dynamic Activity Feed
  const recentActivity = useMemo(() => {
    const activities: { id: string, date: Date, type: 'JOIN' | 'NOTE', member: any, content: string }[] = [];

    members.forEach(member => {
        // A. Join Event
        activities.push({
            id: `join-${member.id}`,
            date: new Date(member.joinedDate),
            type: 'JOIN',
            member: member,
            content: `Joined the ${member.pathway} pathway`
        });

        // B. Note Events
        (member.notes || []).forEach((note: string, idx: number) => {
            const match = note.match(/^\[(.*?)\]\s*(.*)/);
            let noteDate = new Date(member.joinedDate);
            let noteContent = note;

            if (match) {
                const possibleDate = new Date(match[1]!);
                if (!isNaN(possibleDate.getTime())) {
                    noteDate = possibleDate;
                }
                noteContent = match[2]!;
            } else if (note.startsWith('System:')) {
                noteContent = note.replace('System:', '').trim();
            }

            if (match || noteContent.includes('Moved to') || noteContent.includes('Completed')) {
                 activities.push({
                    id: `note-${member.id}-${idx}`,
                    date: noteDate,
                    type: 'NOTE',
                    member: member,
                    content: noteContent
                });
            }
        });
    });

    return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 8);
  }, [members]);

  const getTimeAgo = (date: Date) => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return "Just now";
  };

  const KPICard = ({ label, value, subLabel, icon: Icon, highlighted }: any) => (
    highlighted ? (
      <div className="bg-[#FCA311] text-[#14213D] rounded-2xl p-6 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#14213D]/70 mb-3">{label}</p>
          <h3 className="text-[3rem] font-semibold leading-none tabular-nums">{value}</h3>
          {subLabel && <p className="text-xs mt-2 font-medium text-[#14213D]/70">{subLabel}</p>}
        </div>
        <div className="p-3 bg-[#14213D]/10 rounded-lg text-[#14213D]">
          <Icon size={22} />
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D2] p-6 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mb-3">{label}</p>
          <h3 className="text-[3rem] font-semibold leading-none tabular-nums text-[#14213D]">{value}</h3>
          {subLabel && <p className="text-xs mt-2 font-medium text-[#6B6960]">{subLabel}</p>}
        </div>
        <div className="p-3 bg-[#FAF8F4] rounded-lg text-[#6B6960]">
          <Icon size={22} />
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* 1. Hero Banner */}
      <div className="bg-[#14213D] rounded-2xl p-8 text-white shadow-sm relative overflow-hidden">
         <div className="absolute right-0 top-0 h-full w-1/3 bg-white/[0.03] skew-x-12 transform translate-x-10 pointer-events-none" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                 <div className="flex items-center gap-2 mb-3 text-[#FCA311] text-[11px] font-semibold uppercase tracking-[0.08em]">
                    <IoTrophyOutline /> Team Overview
                 </div>
                 <h1 className="text-[2.125rem] font-bold leading-10 tracking-tight mb-2">Team Impact Dashboard</h1>
                 <p className="text-sm text-white/60 max-w-lg">
                    See how your team is changing lives. Track progress and keep the momentum going!
                 </p>
                 <div className="flex items-center gap-6 mt-6">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded-lg text-[#FCA311]"><IoFlameOutline size={20}/></div>
                         <div>
                             <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Lives Impacted</p>
                             <p className="text-xl font-bold tabular-nums">{livesImpacted}</p>
                         </div>
                     </div>
                     <div className="w-px h-10 bg-white/10" />
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded-lg text-[#4F7E50]"><IoCheckboxOutline size={20}/></div>
                         <div>
                             <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Tasks Crushed</p>
                             <p className="text-xl font-bold tabular-nums">{completedTasksCount}</p>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Level Badge */}
             <div className="bg-white/[0.07] backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center min-w-[140px] w-full md:w-auto">
                 <div className="text-[#FCA311] text-3xl mb-1">
                     <IoStar />
                 </div>
                 <span className="text-2xl font-bold tabular-nums">Lvl {teamLevel}</span>
                 <div className="w-full bg-black/20 h-1.5 rounded-full mt-3 overflow-hidden">
                     <div className="bg-[#FCA311] h-full transition-all duration-1000" style={{ width: `${progressToNextLevel}%` }} />
                 </div>
                 <span className="text-[10px] mt-1.5 text-white/40">{progressToNextLevel}% to Level {teamLevel + 1}</span>
             </div>
         </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            label="Total People"
            value={totalMembers}
            subLabel=""
            icon={IoPeopleOutline}
            highlighted={false}
          />
          <KPICard
            label="Active Pipeline"
            value={newComers}
            subLabel="Newcomers in progress"
            icon={IoGitNetworkOutline}
            highlighted={true}
          />
          <KPICard
            label="New Believers"
            value={newBelievers}
            subLabel={`${nbBaptisms} Baptisms scheduled`}
            icon={IoWaterOutline}
            highlighted={false}
          />
          <KPICard
            label="Pending Tasks"
            value={pendingTasks + overdueTasks}
            subLabel={`${overdueTasks} Overdue`}
            icon={IoCheckboxOutline}
            highlighted={false}
          />
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D2] flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-xl font-semibold text-[#14213D]">Newcomer Pathway Flow</h3>
                      <p className="text-sm text-[#6B6960] mt-1">Distribution of active newcomers by stage</p>
                  </div>
              </div>
              <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEBE0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6B6960'}} interval={0} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#6B6960'}} />
                          <Tooltip cursor={{fill: '#FAF8F4'}} contentStyle={{borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.06)'}} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                            {pipelineData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#14213D' : '#FCA311'} />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D2] flex flex-col hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-[#14213D] mb-1">Task Pulse</h3>
              <p className="text-sm text-[#6B6960] mb-4">Your task completion rate this period.</p>
              <div className="flex-1 flex items-center gap-6">
                {/* Donut */}
                <div className="relative shrink-0" style={{width: 140, height: 140}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskData} cx="50%" cy="50%" innerRadius={44} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                        {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold leading-none tabular-nums text-[#14213D]">{completionRate}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6960] mt-0.5">Done</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-3 flex-1">
                  {taskData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background: entry.color}} />
                        <span className="text-sm text-[#6B6960] truncate">{entry.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[#14213D] shrink-0">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>
      </div>

      {/* 4. Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D2] hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-[#14213D] mb-6">Faith Journey Milestones</h3>
                <div className="space-y-6">
                    {conversionData.map((item) => (
                        <div key={item.name} className="relative">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-semibold text-[#1F2D52]">{item.name}</span>
                                <span className="text-sm font-semibold tabular-nums text-[#14213D]">{item.count}</span>
                            </div>
                            <div className="h-3 w-full bg-[#EFEBE0] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${nbTotal > 0 ? (item.count / nbTotal) * 100 : 0}%`, backgroundColor: item.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D2] max-h-[400px] overflow-y-auto hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-[#14213D] mb-6">Recent Activity</h3>
                <div className="space-y-5 pl-1">
                    {recentActivity.map(activity => (
                        <div key={activity.id} className="flex gap-4 items-start relative group cursor-pointer" onClick={() => setSelectedMember(activity.member)}>
                             <div className="absolute left-[3.5px] top-4 bottom-[-20px] w-px bg-[#EFEBE0]" />
                             <div className={`w-2 h-2 rounded-full mt-2 shrink-0 z-10 ${activity.type === 'JOIN' ? 'bg-[#4F7E50]' : 'bg-[#FCA311]'}`}></div>
                             <div className="pb-1 w-full">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[4px] ${activity.type === 'JOIN' ? 'bg-[#E8F0E9] text-[#4F7E50]' : 'bg-[#EFEBE0] text-[#6B6960]'}`}>
                                            {activity.type === 'JOIN' ? 'New Member' : 'Update'}
                                        </span>
                                        <span className="text-xs text-[#9E9D95] font-medium">{getTimeAgo(activity.date)}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-[#1F2D52] leading-relaxed group-hover:text-[#14213D] transition-colors">
                                    {activity.type === 'JOIN' ? (
                                        <span><span className="font-semibold text-[#14213D]">{activity.member.firstName} {activity.member.lastName}</span> joined {activity.member.pathway}.</span>
                                    ) : (
                                        <span>{activity.content.length > 80 ? activity.content.substring(0, 80) + '...' : activity.content} for <span className="font-semibold text-[#14213D]">{activity.member.firstName}</span>.</span>
                                    )}
                                </div>
                             </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && <p className="text-sm text-[#9E9D95] italic">No recent activity.</p>}
                </div>
           </div>
      </div>

      {activeMember && <MemberDetail member={activeMember} onClose={() => setSelectedMember(null)} onUpdateMember={updateMember} newcomerStages={newcomerStages} newBelieverStages={newBelieverStages} />}
    </div>
  );
};

export default Dashboard;
