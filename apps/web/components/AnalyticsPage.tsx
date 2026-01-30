import React, { useState, useEffect } from 'react';
import {
    IoPeopleOutline, IoCheckmarkCircleOutline, IoTimeOutline, IoTrendingUpOutline,
    IoDownloadOutline, IoRefreshOutline, IoStatsChartOutline, IoPersonAddOutline,
    IoCheckmarkDoneOutline, IoFunnelOutline
} from 'react-icons/io5';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as analyticsApi from '../src/api/analytics';
import { useToast } from '../src/components/Toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const GENDER_COLORS = ['#3B82F6', '#EC4899', '#9CA3AF'];
const MARITAL_COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = ({
    title, value, icon, color, subtitle
}) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 font-medium">{title}</p>
                <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                {icon}
            </div>
        </div>
    </div>
);

const AnalyticsPage: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [overview, setOverview] = useState<any>(null);
    const [memberAnalytics, setMemberAnalytics] = useState<any>(null);
    const [taskAnalytics, setTaskAnalytics] = useState<any>(null);
    const [selectedPathway, setSelectedPathway] = useState<'NEWCOMER' | 'NEW_BELIEVER' | undefined>(undefined);

    useEffect(() => {
        loadAnalytics();
    }, [selectedPathway]);

    const loadAnalytics = async () => {
        try {
            const [overviewData, memberData, taskData] = await Promise.all([
                analyticsApi.getOverview(),
                analyticsApi.getMemberAnalytics(selectedPathway),
                analyticsApi.getTaskAnalytics(),
            ]);

            setOverview(overviewData);
            setMemberAnalytics(memberData);
            setTaskAnalytics(taskData);
        } catch (error) {
            showError('Failed to load analytics');
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadAnalytics();
    };

    const handleExport = async (type: 'members' | 'tasks') => {
        try {
            const data = await analyticsApi.exportData(type);

            const headers = Object.keys(data[0] || {});
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showSuccess(`${type} data exported successfully`);
        } catch (error) {
            showError(`Failed to export ${type}`);
            console.error(error);
        }
    };

    // Build funnel data from byStage
    const funnelData = (memberAnalytics?.byStage || [])
        .sort((a: any, b: any) => a.stageOrder - b.stageOrder)
        .map((stage: any, _index: number, arr: any[]) => {
            const maxCount = arr.reduce((max: number, s: any) => Math.max(max, s.count), 1);
            return {
                ...stage,
                percentage: Math.round((stage.count / maxCount) * 100),
            };
        });

    // Recent activity
    const recentMembers = overview?.recentActivity?.members || [];
    const recentTasks = overview?.recentActivity?.tasks || [];
    const allActivity = [
        ...recentMembers.map((m: any) => ({ ...m, type: 'member', date: m.joinedDate || m.createdAt })),
        ...recentTasks.map((t: any) => ({ ...t, type: 'task', date: t.completedAt || t.createdAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);

    if (isLoading) {
        return (
            <div className="p-8">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <IoStatsChartOutline className="text-blue-600" />
                        Analytics & Reports
                    </h1>
                    <p className="text-gray-600 mt-1">Track your church's growth and engagement</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        <IoRefreshOutline className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('members')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <IoDownloadOutline />
                            Export Members
                        </button>
                        <button
                            onClick={() => handleExport('tasks')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <IoDownloadOutline />
                            Export Tasks
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Members"
                    value={overview?.members?.total || 0}
                    icon={<IoPeopleOutline size={24} className="text-blue-600" />}
                    color="text-blue-600"
                    subtitle={`${overview?.members?.active || 0} active`}
                />
                <StatCard
                    title="Task Completion"
                    value={`${overview?.tasks?.completionRate || 0}%`}
                    icon={<IoCheckmarkCircleOutline size={24} className="text-green-600" />}
                    color="text-green-600"
                    subtitle={`${overview?.tasks?.completed || 0} completed`}
                />
                <StatCard
                    title="Pending Tasks"
                    value={overview?.tasks?.pending || 0}
                    icon={<IoTimeOutline size={24} className="text-orange-600" />}
                    color="text-orange-600"
                    subtitle={`${overview?.tasks?.overdue || 0} overdue`}
                />
                <StatCard
                    title="Team Members"
                    value={overview?.users?.total || 0}
                    icon={<IoTrendingUpOutline size={24} className="text-purple-600" />}
                    color="text-purple-600"
                />
            </div>

            {/* Pathway Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectedPathway(undefined)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${!selectedPathway ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    All Pathways
                </button>
                <button
                    onClick={() => setSelectedPathway('NEWCOMER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedPathway === 'NEWCOMER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Newcomers
                </button>
                <button
                    onClick={() => setSelectedPathway('NEW_BELIEVER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedPathway === 'NEW_BELIEVER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    New Believers
                </button>
            </div>

            {/* Pathway Funnel */}
            {funnelData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <IoFunnelOutline className="text-blue-600" />
                        Pathway Funnel
                    </h3>
                    <div className="space-y-3">
                        {funnelData.map((stage: any, index: number) => {
                            const barWidth = Math.max(stage.percentage, 8);
                            return (
                                <div key={stage.stageId || index} className="flex items-center gap-3">
                                    <div className="w-28 text-right">
                                        <span className="text-sm font-medium text-gray-700 truncate block">{stage.stageName}</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <div
                                            className="h-10 rounded-lg flex items-center justify-end pr-3 transition-all"
                                            style={{
                                                width: `${barWidth}%`,
                                                backgroundColor: COLORS[index % COLORS.length],
                                                minWidth: '40px',
                                            }}
                                        >
                                            <span className="text-sm font-bold text-white">{stage.count}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Member Analytics & Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Members by Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Members by Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={memberAnalytics?.byStatus || []}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry: any) => `${entry.status}: ${entry.count}`}
                                >
                                    {(memberAnalytics?.byStatus || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Members by Stage */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Members by Stage</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={memberAnalytics?.byStage || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="stageName" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Growth Trends + Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Trends - wider */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Growth (Last 12 Months)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={memberAnalytics?.joinedByMonth || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="New Members" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Demographics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">By Gender</h3>
                        {memberAnalytics?.demographics?.byGender && memberAnalytics.demographics.byGender.length > 0 ? (
                            <div style={{ width: '100%', height: 150 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={memberAnalytics.demographics.byGender}
                                            dataKey="count"
                                            nameKey="gender"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={60}
                                            label={(entry: any) => entry.gender}
                                        >
                                            {memberAnalytics.demographics.byGender.map((_: any, i: number) => (
                                                <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No gender data available</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">By Marital Status</h3>
                        {memberAnalytics?.demographics?.byMaritalStatus && memberAnalytics.demographics.byMaritalStatus.length > 0 ? (
                            <div style={{ width: '100%', height: 150 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={memberAnalytics.demographics.byMaritalStatus}
                                            dataKey="count"
                                            nameKey="status"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={60}
                                            label={(entry: any) => entry.status}
                                        >
                                            {memberAnalytics.demographics.byMaritalStatus.map((_: any, i: number) => (
                                                <Cell key={i} fill={MARITAL_COLORS[i % MARITAL_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No marital status data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks by Priority */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Priority</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={taskAnalytics?.byPriority || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="priority" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Assignees */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Team Member</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={taskAnalytics?.byAssignee || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="userName" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B5CF6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Task Completion Trend + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Completion Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Completion Trend (Last 30 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={taskAnalytics?.completedByDay || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Tasks Completed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    {allActivity.length > 0 ? (
                        <div className="space-y-3 max-h-[320px] overflow-y-auto">
                            {allActivity.map((item: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                        item.type === 'member' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                        {item.type === 'member' ? <IoPersonAddOutline size={14} /> : <IoCheckmarkDoneOutline size={14} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-700 truncate">
                                            {item.type === 'member'
                                                ? `${item.firstName || ''} ${item.lastName || ''} added`
                                                : `${item.description || 'Task'} completed`
                                            }
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {item.date ? new Date(item.date).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
