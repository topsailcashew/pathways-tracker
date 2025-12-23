import React, { useState, useEffect } from 'react';
import {
    IoPeopleOutline, IoCheckmarkCircleOutline, IoTimeOutline, IoTrendingUpOutline,
    IoDownloadOutline, IoRefreshOutline, IoStatsChartOutline
} from 'react-icons/io5';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as analyticsApi from '../src/api/analytics';
import { useToast } from '../src/components/Toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
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

            // Convert to CSV
            const headers = Object.keys(data[0] || {});
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ].join('\n');

            // Download
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

    if (isLoading) {
        return (
            <div className="p-8">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <IoStatsChartOutline className="text-blue-600" />
                        Analytics & Reports
                    </h1>
                    <p className="text-gray-600 mt-2">Track your church's growth and engagement</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setSelectedPathway(undefined)}
                    className={`px-4 py-2 rounded-lg ${!selectedPathway ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    All Pathways
                </button>
                <button
                    onClick={() => setSelectedPathway('NEWCOMER')}
                    className={`px-4 py-2 rounded-lg ${selectedPathway === 'NEWCOMER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Newcomers
                </button>
                <button
                    onClick={() => setSelectedPathway('NEW_BELIEVER')}
                    className={`px-4 py-2 rounded-lg ${selectedPathway === 'NEW_BELIEVER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    New Believers
                </button>
            </div>

            {/* Member Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Members by Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Members by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={memberAnalytics?.byStatus || []}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(entry) => `${entry.status}: ${entry.count}`}
                            >
                                {(memberAnalytics?.byStatus || []).map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Members by Stage */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Members by Stage</h3>
                    <ResponsiveContainer width="100%" height={300}>
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

            {/* Growth Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Growth (Last 12 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
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

            {/* Task Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Tasks by Priority */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={taskAnalytics?.byPriority || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="priority" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Assignees */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Team Member</h3>
                    <ResponsiveContainer width="100%" height={300}>
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

            {/* Task Completion Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Completion Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
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
    );
};

export default AnalyticsPage;
