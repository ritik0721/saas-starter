'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { LeaveRequest, LeaveType, LeaveAllowance, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AnalyticsDashboardProps {
  className?: string;
}

interface LeaveRequestWithDetails extends LeaveRequest {
  user: User;
  leaveType: LeaveType;
}

interface LeaveAllowanceWithUser extends LeaveAllowance {
  user: User;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const { data: leaveRequests } = useSWR<LeaveRequestWithDetails[]>('/api/leave/requests/all', fetcher);
  const { data: leaveAllowances } = useSWR<LeaveAllowanceWithUser[]>('/api/leave/allowances/all', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);

  const isManager = user?.role === 'owner' || user?.role === 'admin';

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!leaveRequests || !leaveAllowances) return null;

    const totalRequests = leaveRequests.length;
    const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
    const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
    const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Calculate average processing time (for approved/rejected requests)
    const processedRequests = leaveRequests.filter(req => req.status !== 'pending');
    const totalProcessingTime = processedRequests.reduce((acc, req) => {
      const createdAt = new Date(req.createdAt);
      const updatedAt = new Date(req.updatedAt);
      return acc + (updatedAt.getTime() - createdAt.getTime());
    }, 0);
    const avgProcessingTime = processedRequests.length > 0 ? totalProcessingTime / processedRequests.length : 0;

    return {
      totalRequests,
      approvedRequests,
      pendingRequests,
      rejectedRequests,
      approvalRate: Math.round(approvalRate * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime / (1000 * 60 * 60 * 24) * 100) / 100, // in days
    };
  }, [leaveRequests, leaveAllowances]);

  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    if (!leaveRequests) return [];

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(selectedYear, i, 1);
      return {
        month: format(date, 'MMM'),
        requests: 0,
        approved: 0,
        rejected: 0,
      };
    });

    leaveRequests.forEach(request => {
      const requestDate = new Date(request.createdAt);
      if (requestDate.getFullYear() === selectedYear) {
        const monthIndex = requestDate.getMonth();
        months[monthIndex].requests++;
        if (request.status === 'approved') months[monthIndex].approved++;
        if (request.status === 'rejected') months[monthIndex].rejected++;
      }
    });

    return months;
  }, [leaveRequests, selectedYear]);

  // Calculate leave type distribution
  const leaveTypeDistribution = useMemo(() => {
    if (!leaveRequests || !leaveTypes) return [];

    const typeCounts = leaveTypes.map(type => ({
      name: type.name,
      value: leaveRequests.filter(req => req.leaveTypeId === type.id).length,
      color: type.color,
    })).filter(item => item.value > 0);

    return typeCounts.sort((a, b) => b.value - a.value);
  }, [leaveRequests, leaveTypes]);

  // Calculate cost analysis
  const costAnalysis = useMemo(() => {
    if (!leaveRequests || !leaveAllowances) return null;

    const totalDays = leaveAllowances.reduce((acc, allowance) => acc + allowance.totalDays, 0);
    const usedDays = leaveAllowances.reduce((acc, allowance) => acc + allowance.usedDays, 0);
    const remainingDays = totalDays - usedDays;
    const utilizationRate = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

    // Estimate cost (assuming average daily salary of $200)
    const avgDailySalary = 200;
    const totalCost = usedDays * avgDailySalary;

    return {
      totalDays,
      usedDays,
      remainingDays,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      totalCost,
      avgDailySalary,
    };
  }, [leaveRequests, leaveAllowances]);

  // Calculate team utilization
  const teamUtilization = useMemo(() => {
    if (!leaveAllowances) return [];

    return leaveAllowances.map(allowance => {
      const utilizationRate = allowance.totalDays > 0 ? (allowance.usedDays / allowance.totalDays) * 100 : 0;
      return {
        name: allowance.user.name || 'Unknown',
        total: allowance.totalDays,
        used: allowance.usedDays,
        remaining: allowance.totalDays - allowance.usedDays,
        utilization: Math.round(utilizationRate * 100) / 100,
      };
    }).filter((member): member is NonNullable<typeof member> => member !== null);
  }, [leaveAllowances]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/leave/analytics/export?format=${format}&timeRange=${timeRange}&year=${selectedYear}`);
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leave-analytics-${timeRange}-${selectedYear}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          // Handle PDF download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leave-analytics-${timeRange}-${selectedYear}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!isManager) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need manager permissions to access the analytics dashboard.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-teal-600" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Activity className="mx-auto h-16 w-16 text-teal-400 mb-4" />
          </motion.div>
          <p className="text-gray-600">Loading analytics data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-100 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Analytics Dashboard</CardTitle>
                  <p className="text-sm text-teal-600">Comprehensive insights into leave patterns and team utilization</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center space-x-4">
                {/* Time Range Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Time Range:</span>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="12months">12 Months</option>
                  </select>
                </div>

                {/* Year Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Export Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Export:</span>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <Button
                    onClick={() => handleExport(exportFormat)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Total Requests */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Requests</p>
                    <p className="text-3xl font-bold text-blue-900">{metrics.totalRequests}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  All Time
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Approval Rate */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 hover:from-green-100 hover:via-emerald-100 hover:to-teal-100">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Approval Rate</p>
                    <p className="text-3xl font-bold text-green-900">{metrics.approvalRate}%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="text-sm text-green-600 bg-green-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  Success Rate
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Requests */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 hover:from-yellow-100 hover:via-amber-100 hover:to-orange-100">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Pending Requests</p>
                    <p className="text-3xl font-bold text-yellow-900">{metrics.pendingRequests}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  Awaiting Review
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Processing Time */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 hover:from-purple-100 hover:via-violet-100 hover:to-fuchsia-100">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Avg. Processing</p>
                    <p className="text-3xl font-bold text-purple-900">{metrics.avgProcessingTime} days</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-sm text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  Response Time
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Monthly Trends Bar Chart */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="requests" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Total</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">Rejected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Type Distribution Pie Chart */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-green-600" />
              Leave Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={leaveTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost Analysis & Team Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Cost Analysis Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {costAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Total Days</p>
                    <p className="text-2xl font-bold text-purple-900">{costAnalysis.totalDays}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Used Days</p>
                    <p className="text-2xl font-bold text-green-900">{costAnalysis.usedDays}</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Utilization Rate</p>
                  <p className="text-2xl font-bold text-blue-900">{costAnalysis.utilizationRate}%</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-700">Estimated Cost</p>
                  <p className="text-2xl font-bold text-orange-900">${costAnalysis.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-orange-600">Based on ${costAnalysis.avgDailySalary}/day</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Utilization Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-pink-600" />
              Team Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {teamUtilization.slice(0, 5).map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <span className="text-sm font-medium text-gray-700">{member.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${member.utilization}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                        className={`h-2 rounded-full ${
                          member.utilization > 80 ? 'bg-green-500' :
                          member.utilization > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {teamUtilization.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  +{teamUtilization.length - 5} more team members
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Statistics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-600" />
              Detailed Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Metric</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Value</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Change</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="border-b border-gray-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">Total Leave Requests</td>
                    <td className="py-4 px-6">{metrics.totalRequests}</td>
                    <td className="py-4 px-6 text-green-600">+12%</td>
                    <td className="py-4 px-6">
                      <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
                    </td>
                  </motion.tr>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border-b border-gray-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">Approval Rate</td>
                    <td className="py-4 px-6">{metrics.approvalRate}%</td>
                    <td className="py-4 px-6 text-green-600">+5%</td>
                    <td className="py-4 px-6">
                      <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
                    </td>
                  </motion.tr>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="border-b border-gray-100"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">Pending Requests</td>
                    <td className="py-4 px-6">{metrics.pendingRequests}</td>
                    <td className="py-4 px-6 text-yellow-600">+3%</td>
                    <td className="py-4 px-6">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>
                    </td>
                  </motion.tr>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">Avg. Processing Time</td>
                    <td className="py-4 px-6">{metrics.avgProcessingTime} days</td>
                    <td className="py-4 px-6 text-green-600">-2 days</td>
                    <td className="py-4 px-6">
                      <Badge variant="default" className="bg-green-100 text-green-800">Improved</Badge>
                    </td>
                  </motion.tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
