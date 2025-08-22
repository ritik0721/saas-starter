'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Download, 
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { LeaveRequest, LeaveType, User, LeaveAllowance } from '@/lib/db/schema';
import useSWR from 'swr';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AnalyticsDashboardProps {
  className?: string;
}

interface LeaveRequestWithDetails extends LeaveRequest {
  user: User;
  leaveType: LeaveType;
}

interface MonthlyData {
  month: string;
  requests: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface CostData {
  leaveType: string;
  totalDays: number;
  estimatedCost: number;
  color: string;
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '12months'>('6months');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const { data: leaveRequests } = useSWR<LeaveRequestWithDetails[]>('/api/leave/requests/all', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const { data: teamMembers } = useSWR<User[]>('/api/team/members', fetcher);
  const { data: leaveAllowances } = useSWR<LeaveAllowance[]>('/api/leave/allowances/all', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);

  const isManager = user?.role === 'owner' || user?.role === 'admin';

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12);
    return { start, end };
  }, [timeRange]);

  // Filter data based on time range
  const filteredRequests = useMemo(() => {
    if (!leaveRequests) return [];
    
    return leaveRequests.filter(request => {
      const requestDate = new Date(request.createdAt);
      return requestDate >= dateRange.start && requestDate <= dateRange.end;
    });
  }, [leaveRequests, dateRange]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!filteredRequests || !teamMembers) return null;

    const totalRequests = filteredRequests.length;
    const approvedRequests = filteredRequests.filter(req => req.status === 'approved').length;
    const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected').length;
    const pendingRequests = filteredRequests.filter(req => req.status === 'pending').length;
    
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
    const averageProcessingTime = 2.5; // This would be calculated from actual data

    return {
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      approvalRate: Math.round(approvalRate * 10) / 10,
      averageProcessingTime
    };
  }, [filteredRequests, teamMembers]);

  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    if (!filteredRequests) return [];

    const months = eachMonthOfInterval(dateRange);
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthRequests = filteredRequests.filter(req => {
        const requestDate = new Date(req.createdAt);
        return requestDate >= monthStart && requestDate <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        requests: monthRequests.length,
        approved: monthRequests.filter(req => req.status === 'approved').length,
        rejected: monthRequests.filter(req => req.status === 'rejected').length,
        pending: monthRequests.filter(req => req.status === 'pending').length,
      };
    });
  }, [filteredRequests, dateRange]);

  // Calculate leave type distribution
  const leaveTypeDistribution = useMemo(() => {
    if (!filteredRequests || !leaveTypes) return [];

    const typeCounts = new Map<string, number>();
    leaveTypes.forEach(type => typeCounts.set(type.name, 0));
    
    filteredRequests.forEach(request => {
      const typeName = leaveTypes.find(t => t.id === request.leaveTypeId)?.name || 'Unknown';
      typeCounts.set(typeName, (typeCounts.get(typeName) || 0) + 1);
    });

    return Array.from(typeCounts.entries()).map(([name, count]) => ({
      name,
      value: count,
      color: leaveTypes.find(t => t.name === name)?.color || '#3B82F6'
    }));
  }, [filteredRequests, leaveTypes]);

  // Calculate cost analysis
  const costAnalysis = useMemo(() => {
    if (!filteredRequests || !leaveTypes) return [];

    const costData = new Map<string, CostData>();
    
    filteredRequests.forEach(request => {
      if (request.status === 'approved') {
        const leaveType = leaveTypes.find(t => t.id === request.leaveTypeId);
        if (leaveType && leaveType.isPaid) {
          const key = leaveType.name;
          const existing = costData.get(key);
          const days = Number(request.totalDays);
          const estimatedDailyCost = 150; // This would come from company settings
          
          if (existing) {
            existing.totalDays += days;
            existing.estimatedCost += days * estimatedDailyCost;
          } else {
            costData.set(key, {
              leaveType: key,
              totalDays: days,
              estimatedCost: days * estimatedDailyCost,
              color: leaveType.color
            });
          }
        }
      }
    });

    return Array.from(costData.values());
  }, [filteredRequests, leaveTypes]);

  // Calculate team utilization
  const teamUtilization = useMemo(() => {
    if (!leaveAllowances || !teamMembers) return [];

    return teamMembers.map(member => {
      const allowance = leaveAllowances.find(a => a.userId === member.id && a.year === selectedYear);
      if (!allowance) return null;

      const utilizationRate = allowance.totalDays > 0 ? (allowance.usedDays / allowance.totalDays) * 100 : 0;
      const remainingDays = allowance.totalDays - allowance.usedDays;

      return {
        name: member.name || 'Unknown',
        email: member.email,
        totalDays: allowance.totalDays,
        usedDays: allowance.usedDays,
        remainingDays,
        utilizationRate: Math.round(utilizationRate * 10) / 10
      };
    }).filter((member): member is NonNullable<typeof member> => member !== null);
  }, [leaveAllowances, teamMembers, selectedYear]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/leave/analytics/export?format=${format}&timeRange=${timeRange}&year=${selectedYear}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave-analytics-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (!isManager) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't have permission to view analytics.</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header Controls */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Leave Analytics Dashboard</CardTitle>
                <p className="text-sm text-gray-600">Comprehensive insights into team leave patterns and costs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Export Controls */}
              <div className="flex space-x-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
                <Button
                  onClick={() => handleExport(exportFormat)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.approvalRate}%</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.pendingRequests}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.averageProcessingTime} days</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Monthly Leave Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#3B82F6" name="Total Requests" />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                  <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leave Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Leave Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={leaveTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cost Analysis & Team Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cost Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costAnalysis.map((item, index) => (
                  <div key={item.leaveType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-900">{item.leaveType}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{item.totalDays} days</p>
                      <p className="font-semibold text-green-600">
                        ${item.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {costAnalysis.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No cost data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Team Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamUtilization.map((member, index) => (
                  <div key={member.email} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <Badge variant={member.utilizationRate > 80 ? 'default' : 'secondary'}>
                        {member.utilizationRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{member.usedDays}/{member.totalDays} days used</span>
                      <span>{member.remainingDays} remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(member.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Statistics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Change</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">Total Leave Days</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {filteredRequests.reduce((sum, req) => sum + Number(req.totalDays), 0)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">+12%</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Increasing
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">Average Request Size</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {filteredRequests.length > 0 
                        ? (filteredRequests.reduce((sum, req) => sum + Number(req.totalDays), 0) / filteredRequests.length).toFixed(1)
                        : 0
                      } days
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600">+5%</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Stable
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-900">Rejection Rate</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {metrics.totalRequests > 0 
                        ? Math.round((metrics.rejectedRequests / metrics.totalRequests) * 100 * 10) / 10
                        : 0
                      }%
                    </td>
                    <td className="text-right py-3 px-4 text-red-600">-8%</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Improving
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
