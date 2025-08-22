'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, AlertTriangle, Shield, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { LeaveRequest, LeaveType, User as UserType } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ApprovalPanelProps {
  className?: string;
}

interface LeaveRequestWithDetails extends LeaveRequest {
  user: UserType;
  leaveType: LeaveType;
}

export default function ApprovalPanel({ className }: ApprovalPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: leaveRequests } = useSWR<LeaveRequestWithDetails[]>('/api/leave/requests/pending', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);

  const pendingRequests = leaveRequests?.filter(req => req.status === 'pending') || [];
  const isManager = user?.role === 'owner' || user?.role === 'admin';

  const handleApprove = async (requestId: number) => {
    if (!isManager) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/leave/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        mutate('/api/leave/requests');
        mutate('/api/leave/requests/pending');
        mutate('/api/leave/allowance');
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!isManager || !rejectionReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/leave/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        mutate('/api/leave/requests');
        mutate('/api/leave/requests/pending');
        mutate('/api/leave/allowance');
        setSelectedRequest(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isManager) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-gray-600" />
            Approval Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need manager permissions to access the approval panel.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Approval Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending leave requests to approve at the moment.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* Total Pending */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingRequests.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Requests */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Urgent Requests</p>
                <p className="text-2xl font-bold text-red-900">
                  {pendingRequests.filter(req => 
                    differenceInDays(new Date(req.startDate), new Date()) <= 7
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">This Week</p>
                <p className="text-2xl font-bold text-blue-900">
                  {pendingRequests.filter(req => 
                    differenceInDays(new Date(req.startDate), new Date()) <= 7
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Approval Panel */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Pending Approvals</CardTitle>
                <p className="text-sm text-purple-600">Review and manage leave requests from your team</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              {pendingRequests.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Request Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.user.name}</p>
                            <p className="text-sm text-gray-500">{request.user.email}</p>
                          </div>
                        </div>
                        <div className="hidden lg:block w-px h-8 bg-gray-200"></div>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: request.leaveType.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {request.leaveType.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{request.totalDays} days</span>
                        </div>
                        {request.reason && (
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="max-w-xs truncate">{request.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Urgency Indicator */}
                      {differenceInDays(new Date(request.startDate), new Date()) <= 7 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">
                            Urgent: Request starts in {differenceInDays(new Date(request.startDate), new Date())} days
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-2 rounded-lg transition-all duration-300"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Leave Request</h3>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedRequest.user.name}</strong> requested {selectedRequest.totalDays} days of {selectedRequest.leaveType.name}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedRequest.startDate), 'MMM d')} - {format(new Date(selectedRequest.endDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject Request'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
