import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, LabelList
} from 'recharts';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
    calculateKPIs,
    groupByChannel,
    groupByChannelWithStatus,
    getInterfaceStatus,
    getTopBrandsFollowUp,
    groupByTransporter,
    groupByWHLocWithIssues,
    extractHourlyData,
    buildFunnelData,
    getInvalidSKUByChannel,
    getInvalidSKUByBrand
} from './chartUtils';

const AnalyticsDashboard = ({ data, isDarkMode = false }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate all metrics
    const kpis = useMemo(() => calculateKPIs(data), [data]);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        return {
            channelData: groupByChannel(data),
            channelStatusData: groupByChannelWithStatus(data),
            interfaceStatus: getInterfaceStatus(data),
            topBrandsFollowUp: getTopBrandsFollowUp(data),
            transporterTotal: groupByTransporter(data, false),
            whLocIssues: groupByWHLocWithIssues(data),
            hourlyData: extractHourlyData(data),
            funnelData: buildFunnelData(data),
            invalidSKUChannel: getInvalidSKUByChannel(data),
            invalidSKUBrand: getInvalidSKUByBrand(data)
        };
    }, [data]);

    // Colors
    const COLORS = {
        blue: '#3b82f6',
        purple: '#8b5cf6',
        green: '#10b981',
        orange: '#f59e0b',
        red: '#ef4444',
        yellow: '#eab308',
        primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
    };

    // KPI Card Component
    const KPICard = ({ title, value, icon, color }) => {
        const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
            orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
            red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400',
            gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
        };

        return (
            <div className={`rounded-lg border-2 p-3 transition-all hover:shadow-lg ${colorClasses[color]}`}>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-medium">{title}</span>
                </div>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            </div>
        );
    };

    // Chart Card Wrapper
    const ChartCard = ({ title, children }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
            {children}
        </div>
    );

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) return null;
    if (!chartData) return null;

    return (
        <div className="mb-6">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                   text-white rounded-lg p-4 flex items-center justify-between mb-4 transition-all shadow-md"
            >
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">📊 Analytics Dashboard</span>
                    <span className="text-sm opacity-90">({data.length} orders)</span>
                </div>
                {isExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
            </button>

            {/* Analytics Content */}
            {isExpanded && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KPICard title="Total Orders" value={kpis.totalOrders} icon="📊" color="blue" />
                        <KPICard title="Follow Up" value={kpis.totalFollowUp} icon="⚠️" color="orange" />
                        <KPICard title="Invalid SKU" value={kpis.totalInvalidSKU} icon="❌" color="red" />
                        <KPICard title="Belum Interface" value={kpis.belumInterface} icon="⏳" color="yellow" />
                        <KPICard title="Belum XML" value={kpis.belumMasukXML} icon="📝" color="purple" />
                        <KPICard title="Diproses Flexo: False" value={kpis.diprosesFlexoFalse} icon="🏭" color="gray" />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 1. Order per Channel */}
                        <ChartCard title="📊 Order per Sales Channel">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.channelData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 2. Status SC per Channel */}
                        <ChartCard title="📈 Status SC per Channel">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.channelStatusData.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="Pending Verifikasi" stackId="a" fill={COLORS.green} />
                                    <Bar dataKey="Follow Up!" stackId="a" fill={COLORS.orange} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 3. Interface Status */}
                        <ChartCard title="🥧 Status Interfacing">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData.interfaceStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={70}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.interfaceStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.primary[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 4. Top Brands Follow Up */}
                        <ChartCard title="🏆 Top Brands Follow Up">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.topBrandsFollowUp} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis type="number" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 9 }} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill={COLORS.orange} radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 5. Transporter */}
                        <ChartCard title="🚚 Transporter Analysis">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.transporterTotal.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill={COLORS.purple} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 6. WH Loc Issues */}
                        <ChartCard title="🏭 WH Loc vs Issues">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.whLocIssues}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="issues" fill={COLORS.red} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 7. Hourly Timeline */}
                        <ChartCard title="⏰ Order per Jam">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="hour" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="total" stroke={COLORS.blue} strokeWidth={2} name="Total" />
                                    <Line type="monotone" dataKey="followUp" stroke={COLORS.orange} strokeWidth={2} name="Follow Up" />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 8. System Funnel */}
                        <ChartCard title="🔍 System Flow">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.funnelData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis type="number" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill={COLORS.green} radius={[0, 6, 6, 0]}>
                                        <LabelList dataKey="value" position="right" fill={isDarkMode ? '#9ca3af' : '#6b7280'} fontSize={10} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 9. Invalid SKU */}
                        <ChartCard title="❌ Invalid SKU per Channel">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.invalidSKUChannel}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                                    <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill={COLORS.red} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 10. Invalid SKU by Brand */}
                        <ChartCard title="❌ Invalid SKU per Brand">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.invalidSKUBrand} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                    <XAxis type="number" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 9 }} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill={COLORS.red} radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
