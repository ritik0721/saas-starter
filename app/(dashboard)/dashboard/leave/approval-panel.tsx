'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isManager) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Approval Panel</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't have permission to approve leave requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Approval Panel Header */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Leave Approval Panel</CardTitle>
                <p className="text-sm text-gray-600">Review and manage team leave requests</p>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              {pendingRequests.length} pending
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Requests */}
      <div className="space-y-4">
        <AnimatePresence>
          {pendingRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.user.name}</h3>
                          <p className="text-sm text-gray-500">{request.user.email}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: request.leaveType.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {request.leaveType.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{request.totalDays}</span> days
                        </div>
                      </div>

                      {request.reason && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Submitted {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                        <span>Duration: {differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1} days</span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 px-4 py-2"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {pendingRequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending leave requests to review.</p>
          </motion.div>
        )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Leave Request
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting {selectedRequest.user.name}'s leave request.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
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
