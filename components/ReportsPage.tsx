import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { IoTrendingUpOutline, IoCheckmarkDoneOutline, IoWaterOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { Member, Task, PathwayType, Stage, MemberStatus } from '../types';

interface ReportsPageProps {
  members: Member[];
  tasks: Task[];
  newcomerStages: Stage[];
  newBelieverStages: Stage[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ members, tasks, newcomerStages, newBelieverStages }) => {
  
  // --- 1. Follow-up Performance ---
  const completedTasks = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
  const pendingTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const taskData = [
    { name: 'Completed', value: completedTasks, color: '#10B981' }, // Success
    { name: 'Pending', value: pendingTasks, color: '#4A7FA7' },   // Ocean
    { name: 'Overdue', value: overdueTasks, color: '#F59E0B' },   // Warning
  ];

  // --- 2. New Believer Conversions ---
  const newBelievers = members.filter(m => m.pathway === PathwayType.NEW_BELIEVER);
  const totalDecisions = newBelievers.length;
  
  // Find index of 'Baptism' stage to count how many reached it or passed it
  const baptismStageIndex = newBelieverStages.findIndex(s => s.name.toLowerCase().includes('baptism'));
  const baptismsCount = newBelievers.filter(m => {
     const mStageIndex = newBelieverStages.findIndex(s => s.id === m.currentStageId);
     return mStageIndex >= baptismStageIndex && baptismStageIndex !== -1;
  }).length;
  
  const integratedNB = newBelievers.filter(m => m.status === MemberStatus.INTEGRATED).length;

  const conversionData = [
    { name: 'Decisions', count: totalDecisions },
    { name: 'Baptisms', count: baptismsCount },
    { name: 'Integrated', count: integratedNB },
  ];

  // --- 3. Newcomer Retention (Distribution) ---
  const newcomers = members.filter(m => m.pathway === PathwayType.NEWCOMER);
  const retentionData = newcomerStages.map(stage => ({
    name: stage.name,
    count: newcomers.filter(m => m.currentStageId === stage.id).length
  }));

  // Simple calculation: % of newcomers who are NOT in the first stage (moved forward)
  const movedForwardCount = newcomers.filter(m => m.currentStageId !== newcomerStages[0]?.id).length;
  const retentionRate = newcomers.length > 0 ? Math.round((movedForwardCount / newcomers.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Reporting Dashboard</h2>
        <p className="text-gray-500 text-sm">Key metrics on growth, retention, and team performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">Task Completion</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{completionRate}%</h3>
                <p className="text-xs text-gray-400 mt-1">Global follow-up rate</p>
            </div>
            <div className="p-3 bg-green-50 text-success rounded-lg">
                <IoCheckmarkDoneOutline size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">Retention Rate</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{retentionRate}%</h3>
                <p className="text-xs text-gray-400 mt-1">Moved past Stage 1</p>
            </div>
            <div className="p-3 bg-blue-50 text-primary rounded-lg">
                <IoTrendingUpOutline size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">Est. Baptisms</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{baptismsCount}</h3>
                <p className="text-xs text-gray-400 mt-1">Reached Baptism stage</p>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg">
                <IoWaterOutline size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{overdueTasks}</h3>
                <p className="text-xs text-gray-400 mt-1">Need immediate action</p>
            </div>
            <div className="p-3 bg-amber-50 text-warning rounded-lg">
                <IoAlertCircleOutline size={24} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Retention / Pipeline Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Newcomer Retention by Stage</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1A3D63" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#1A3D63" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="count" stroke="#1A3D63" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Task Performance Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Follow-Up Health</h3>
            <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={taskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {taskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* New Believer Conversions Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
             <h3 className="text-lg font-bold text-gray-800 mb-6">New Believer Milestones</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontWeight: 'bold', fill: '#4B5563'}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="count" barSize={30} radius={[0, 4, 4, 0]}>
                            {conversionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#B3CFE5' : index === 1 ? '#4A7FA7' : '#1A3D63'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;