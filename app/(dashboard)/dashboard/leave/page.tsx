'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, CalendarDays } from 'lucide-react';
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

export default function LeavePage() {
  const { data: leaveRequests } = useSWR<LeaveRequest[]>('/api/leave/requests', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const { data: leaveAllowance } = useSWR<LeaveAllowance>('/api/leave/allowance', fetcher);
  const [isRequestingLeave, setIsRequestingLeave] = useState(false);

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

  return (
    <div className="flex-1 p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-between items-center mb-8"
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Leave Allowance Card */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Annual Leave</CardTitle>
                <CalendarDays className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
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
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Requests Card */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader className="pb-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {leaveRequests?.filter(req => req.status === 'pending').length || 0}
              </div>
              <div className="text-sm text-gray-500">awaiting approval</div>
              <div className="mt-3 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full inline-block">
                Action Required
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Leave Card */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Upcoming Leave</CardTitle>
                <TrendingUp className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {leaveRequests?.filter(req => 
                  req.status === 'approved' && 
                  new Date(req.startDate) > new Date()
                ).length || 0}
              </div>
              <div className="text-sm text-gray-500">approved requests</div>
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                Confirmed
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Leave Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
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
                      {leaveRequests.map((request, index) => (
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
                              <span className="ml-2 capitalize font-medium">{request.status}</span>
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
      </motion.div>

      {/* Approval Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8"
      >
        <ApprovalPanel />
      </motion.div>

      {/* Policy Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-8"
      >
        <PolicyManager />
      </motion.div>

      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-8"
      >
        <AnalyticsDashboard />
      </motion.div>

      {/* Team Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="mt-8"
      >
        <TeamCalendar />
      </motion.div>

      {/* Leave Request Form */}
      {isRequestingLeave && (
        <LeaveRequestForm onClose={() => setIsRequestingLeave(false)} />
      )}
    </div>
  );
}
