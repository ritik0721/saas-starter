'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, CalendarDays, Settings, BarChart3, FileText, Shield } from 'lucide-react';
import useSWR from 'swr';
import { LeaveRequest, LeaveType, LeaveAllowance } from '@/lib/db/schema';
import LeaveRequestForm from './leave-request-form';
import TeamCalendar from './team-calendar';
import ApprovalPanel from './approval-panel';
import PolicyManager from './policy-manager';
import AnalyticsDashboard from './analytics-dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: Calendar, color: 'from-blue-500 to-indigo-600' },
  { id: 'requests', label: 'My Requests', icon: FileText, color: 'from-green-500 to-emerald-600' },
  { id: 'approvals', label: 'Approvals', icon: Shield, color: 'from-purple-500 to-violet-600' },
  { id: 'policies', label: 'Policies', icon: Settings, color: 'from-orange-500 to-red-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-teal-500 to-cyan-600' },
  { id: 'calendar', label: 'Team Calendar', icon: Users, color: 'from-pink-500 to-rose-600' },
];

export default function LeavePage() {
  const { data: leaveRequests } = useSWR<LeaveRequest[]>('/api/leave/requests', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const { data: leaveAllowance } = useSWR<LeaveAllowance>('/api/leave/allowance', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);
  const [isRequestingLeave, setIsRequestingLeave] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isManager = user?.role === 'owner' || user?.role === 'admin';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leave Allowance Card */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 hover:from-green-100 hover:via-emerald-100 hover:to-teal-100">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20"></div>
              <div className="relative flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Annual Leave</CardTitle>
                <CalendarDays className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {leaveAllowance ? leaveAllowance.totalDays - leaveAllowance.usedDays : 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {leaveAllowance?.totalDays || 0} days
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${leaveAllowance ? ((leaveAllowance.totalDays - leaveAllowance.usedDays) / leaveAllowance.totalDays) * 100 : 0}%`
                    }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Requests Card */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 hover:from-yellow-100 hover:via-amber-100 hover:to-orange-100">
            <CardHeader className="pb-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-500/20"></div>
              <div className="relative flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {leaveRequests?.filter(req => req.status === 'pending').length || 0}
                </div>
                <div className="text-sm text-gray-500">awaiting approval</div>
                <div className="mt-3 text-xs text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  Action Required
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Leave Card */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20"></div>
              <div className="relative flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Upcoming Leave</CardTitle>
                <TrendingUp className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {leaveRequests?.filter(req => 
                    req.status === 'approved' && 
                    new Date(req.startDate) > new Date()
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-500">approved requests</div>
                <div className="mt-3 text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full inline-block font-medium">
                  Confirmed
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 hover:from-purple-100 hover:via-violet-100 hover:to-fuchsia-100">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-500/20"></div>
              <div className="relative flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Plus className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <div className="relative space-y-3">
                <Button
                  onClick={() => setIsRequestingLeave(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-sm py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-sm py-2 rounded-lg transition-all duration-300"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Leave Requests */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Leave Requests</CardTitle>
            <div className="text-sm text-gray-500">
              {leaveRequests?.length || 0} total requests
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leaveRequests && leaveRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Dates</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Days</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {leaveRequests.slice(0, 5).map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ backgroundColor: '#f8fafc' }}
                        className="border-b border-gray-100 transition-colors duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3 shadow-sm"
                              style={{
                                backgroundColor: leaveTypes?.find(lt => lt.id === request.leaveTypeId)?.color || '#3B82F6'
                              }}
                            />
                            <span className="font-medium text-gray-900">
                              {leaveTypes?.find(lt => lt.id === request.leaveTypeId)?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {format(new Date(request.startDate), 'MMM d, yyyy')}
                            </div>
                            <div className="text-gray-500">
                              to {format(new Date(request.endDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {request.totalDays} days
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-2 capitalize">{request.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 truncate">
                              {request.reason || 'No reason provided'}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center py-16 text-gray-500"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests yet</h3>
              <p className="text-gray-600 mb-6">Start by requesting some time off</p>
              <Button
                onClick={() => setIsRequestingLeave(true)}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Request Your First Leave
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'requests':
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900">My Leave Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Enhanced requests view */}
                <div className="space-y-4">
                  {leaveRequests?.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{
                              backgroundColor: leaveTypes?.find(lt => lt.id === request.leaveTypeId)?.color || '#3B82F6'
                            }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {leaveTypes?.find(lt => lt.id === request.leaveTypeId)?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-2 capitalize">{request.status}</span>
                          </span>
                          <span className="text-sm text-gray-500">{request.totalDays} days</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'approvals':
        return <ApprovalPanel />;
      case 'policies':
        return <PolicyManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'calendar':
        return <TeamCalendar />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Leave Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your time off and leave requests</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsRequestingLeave(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            Request Leave
          </Button>
        </motion.div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = (tab.id === 'approvals' || tab.id === 'policies' || tab.id === 'analytics') && !isManager;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }
                `}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* Leave Request Form */}
      {isRequestingLeave && (
        <LeaveRequestForm onClose={() => setIsRequestingLeave(false)} />
      )}
    </div>
  );
}
