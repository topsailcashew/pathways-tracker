
import React from 'react';
import { IoTrophyOutline, IoPeopleOutline, IoStar, IoCheckmarkDoneCircle, IoTrendingUp, IoFlameOutline } from 'react-icons/io5';
import { Member, Task, MemberStatus } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamLeaderDashboardProps {
  members: Member[];
  tasks: Task[];
}

const TeamLeaderDashboard: React.FC<TeamLeaderDashboardProps> = ({ members, tasks }) => {
  // Mock Data for "Team Impact" calculations
  const totalTasksCompleted = tasks.filter(t => t.completed).length;
  const activeMembersManaged = members.filter(m => m.status === MemberStatus.ACTIVE).length;
  
  // Mock "Moves" - In a real app, calculate from logs. Here, simplified.
  const livesImpacted = Math.floor(totalTasksCompleted * 1.5) + members.length;
  
  // Gamification Level
  const teamLevel = Math.floor(totalTasksCompleted / 10) + 1;
  const progressToNextLevel = (totalTasksCompleted % 10) * 10;

  const data = [
    { name: 'Completed', value: totalTasksCompleted, color: '#10B981' },
    { name: 'Remaining', value: tasks.length - totalTasksCompleted, color: '#E2E8F0' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy to-primary rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-10" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                 <div className="flex items-center gap-2 mb-2 text-ocean font-bold uppercase tracking-wider text-xs">
                    <IoTrophyOutline /> Team Leader View
                 </div>
                 <h1 className="text-3xl font-bold mb-2">Team Impact Dashboard</h1>
                 <p className="text-secondary/80 max-w-lg">
                    See how your team is changing lives. Track progress, celebrate wins, and keep the momentum going!
                 </p>
             </div>
             
             {/* Level Badge */}
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center min-w-[140px]">
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

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:transform hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-3xl">
                  <IoFlameOutline />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-400 uppercase">Lives Impacted</p>
                  <p className="text-4xl font-bold text-gray-800">{livesImpacted}</p>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:transform hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-3xl">
                  <IoCheckmarkDoneCircle />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-400 uppercase">Tasks Crushed</p>
                  <p className="text-4xl font-bold text-gray-800">{totalTasksCompleted}</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:transform hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-primary flex items-center justify-center text-3xl">
                  <IoTrendingUp />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-400 uppercase">Active Pipeline</p>
                  <p className="text-4xl font-bold text-gray-800">{activeMembersManaged}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Wins */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <IoTrophyOutline className="text-yellow-500" /> Recent Wins
              </h3>
              <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                  {/* Mock Wins */}
                  {[
                      { title: "John Doe integrated!", desc: "Moved to 'Serve' stage yesterday.", color: "bg-green-100 text-green-700" },
                      { title: "Weekly Goal Met", desc: "Team completed 15+ tasks this week.", color: "bg-blue-100 text-blue-700" },
                      { title: "New Baptisms", desc: "2 New Believers scheduled for baptism.", color: "bg-indigo-100 text-indigo-700" }
                  ].map((win, idx) => (
                      <div key={idx} className="relative pl-10">
                          <div className={`absolute left-2 top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm -translate-x-1/2 mt-1 ${idx === 0 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h4 className="font-bold text-gray-800 text-sm mb-1">{win.title}</h4>
                              <p className="text-xs text-gray-500">{win.desc}</p>
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${win.color}`}>
                                  Celebration
                              </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Leaderboard / Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center">
               <h3 className="text-xl font-bold text-gray-800 mb-2">Team Activity Ratio</h3>
               <p className="text-sm text-gray-400 mb-6">Task Completion vs Pending</p>
               
               <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                   </ResponsiveContainer>
               </div>
               <div className="text-center mt-4">
                   <p className="text-2xl font-bold text-gray-800">{Math.round((totalTasksCompleted / tasks.length) * 100) || 0}%</p>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
               </div>
          </div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;
