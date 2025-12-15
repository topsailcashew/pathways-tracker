
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IoPeopleOutline, IoGitNetworkOutline, IoCheckboxOutline, IoWaterOutline, IoTimeOutline, IoArrowForwardOutline, IoTrophyOutline, IoStar, IoFlameOutline } from 'react-icons/io5';
import { PathwayType, MemberStatus } from '../types';
import { useAppContext } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { members, tasks, newcomerStages, newBelieverStages } = useAppContext();

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
    { name: 'Decisions', count: nbTotal, color: '#B3CFE5' },
    { name: 'Baptisms', count: nbBaptisms, color: '#4A7FA7' },
    { name: 'Integrated', count: nbIntegrated, color: '#1A3D63' },
  ];

  // 4. Task Pie Data
  const taskData = [
    { name: 'Completed', value: completedTasksCount, color: '#10B981' },
    { name: 'To Do', value: pendingTasks, color: '#E2E8F0' },
    { name: 'Overdue', value: overdueTasks, color: '#F59E0B' },
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
        member.notes.forEach((note: string, idx: number) => {
            const match = note.match(/^\[(.*?)\]\s*(.*)/);
            let noteDate = new Date(member.joinedDate);
            let noteContent = note;

            if (match) {
                const possibleDate = new Date(match[1]);
                if (!isNaN(possibleDate.getTime())) {
                    noteDate = possibleDate;
                }
                noteContent = match[2];
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

  const KPICard = ({ label, value, subLabel, icon: Icon, colorClass, bgClass }: any) => (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">{label}</p>
              <h3 className="text-3xl font-bold text-navy">{value}</h3>
              {subLabel && <p className="text-xs text-gray-400 mt-1 font-medium">{subLabel}</p>}
          </div>
          <div className={`p-4 rounded-xl ${bgClass} ${colorClass}`}>
              <Icon size={24} />
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-r from-navy to-primary rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-10 pointer-events-none" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                 <div className="flex items-center gap-2 mb-2 text-ocean font-bold uppercase tracking-wider text-xs">
                    <IoTrophyOutline /> Team Overview
                 </div>
                 <h1 className="text-3xl font-bold mb-2">Team Impact Dashboard</h1>
                 <p className="text-secondary/80 max-w-lg">
                    See how your team is changing lives. Track progress and keep the momentum going!
                 </p>
                 <div className="flex items-center gap-6 mt-6">
                     <div className="flex items-center gap-2">
                         <div className="p-2 bg-white/10 rounded-lg text-orange-400"><IoFlameOutline size={20}/></div>
                         <div>
                             <p className="text-xs text-secondary font-bold uppercase">Lives Impacted</p>
                             <p className="text-xl font-bold">{livesImpacted}</p>
                         </div>
                     </div>
                     <div className="w-px h-10 bg-white/10" />
                     <div className="flex items-center gap-2">
                         <div className="p-2 bg-white/10 rounded-lg text-green-400"><IoCheckboxOutline size={20}/></div>
                         <div>
                             <p className="text-xs text-secondary font-bold uppercase">Tasks Crushed</p>
                             <p className="text-xl font-bold">{completedTasksCount}</p>
                         </div>
                     </div>
                 </div>
             </div>
             
             {/* Level Badge */}
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center min-w-[140px] w-full md:w-auto">
                 <div className="text-yellow-400 text-3xl mb-1">
                     <IoStar />
                 </div>
                 <span className="text-2xl font-bold">Lvl {teamLevel}</span>
                 <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden">
                     <div className="bg-yellow-400 h-full transition-all duration-1000" style={{ width: `${progressToNextLevel}%` }} />
                 </div>
                 <span className="text-[10px] mt-1 text-gray-300">{progressToNextLevel}% to Level {teamLevel + 1}</span>
             </div>
         </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Total People" 
            value={totalMembers} 
            subLabel="+4 this week"
            icon={IoPeopleOutline} 
            colorClass="text-primary" 
            bgClass="bg-blue-50"
          />
          <KPICard 
            label="Active Pipeline" 
            value={newComers} 
            subLabel="Newcomers in progress"
            icon={IoGitNetworkOutline} 
            colorClass="text-ocean" 
            bgClass="bg-sky-50"
          />
          <KPICard 
            label="New Believers" 
            value={newBelievers} 
            subLabel={`${nbBaptisms} Baptisms scheduled`}
            icon={IoWaterOutline} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50"
          />
          <KPICard 
            label="Pending Tasks" 
            value={pendingTasks + overdueTasks} 
            subLabel={`${overdueTasks} Overdue`}
            icon={IoCheckboxOutline} 
            colorClass={overdueTasks > 0 ? "text-orange-500" : "text-green-600"} 
            bgClass={overdueTasks > 0 ? "bg-orange-50" : "bg-green-50"}
          />
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-navy">Newcomer Pathway Flow</h3>
                      <p className="text-sm text-gray-500 mt-1">Distribution of active newcomers by stage</p>
                  </div>
              </div>
              <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} interval={0} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                            {pipelineData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1A3D63' : '#4A7FA7'} />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-lg font-bold text-navy mb-1">Task Pulse</h3>
              <p className="text-sm text-gray-500 mb-6">You have completed {completionRate}% of assigned tasks.</p>
              <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
                   <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-bold text-navy">{completionRate}%</span>
                       <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">Done</span>
                   </div>
              </div>
          </div>
      </div>

      {/* 4. Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-navy mb-6">Faith Journey Milestones</h3>
                <div className="space-y-8">
                    {conversionData.map((item) => (
                        <div key={item.name} className="relative">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-gray-700">{item.name}</span>
                                <span className="text-sm font-bold text-navy">{item.count}</span>
                            </div>
                            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${nbTotal > 0 ? (item.count / nbTotal) * 100 : 0}%`, backgroundColor: item.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
           </div>

           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto">
                <h3 className="text-lg font-bold text-navy mb-6">Recent Activity</h3>
                <div className="space-y-6 pl-1">
                    {recentActivity.map(activity => (
                        <div key={activity.id} className="flex gap-4 items-start relative">
                             <div className="absolute left-[3.5px] top-4 bottom-[-24px] w-px bg-gray-100" />
                             <div className={`w-2 h-2 rounded-full mt-2 shrink-0 z-10 ${activity.type === 'JOIN' ? 'bg-green-500' : 'bg-ocean'}`}></div>
                             <div className="pb-1 w-full">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${activity.type === 'JOIN' ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                                            {activity.type === 'JOIN' ? 'New Member' : 'Update'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">{getTimeAgo(activity.date)}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    {activity.type === 'JOIN' ? (
                                        <span><span className="font-bold text-gray-900">{activity.member.firstName} {activity.member.lastName}</span> joined {activity.member.pathway}.</span>
                                    ) : (
                                        <span>{activity.content.length > 80 ? activity.content.substring(0, 80) + '...' : activity.content} for <span className="font-bold text-gray-900">{activity.member.firstName}</span>.</span>
                                    )}
                                </div>
                             </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && <p className="text-sm text-gray-400 italic">No recent activity.</p>}
                </div>
           </div>
      </div>
    </div>
  );
};

export default Dashboard;
