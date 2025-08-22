'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeavePolicy, LeaveType, CompanySettings } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PolicyManagerProps {
  className?: string;
}

export default function PolicyManager({ className }: PolicyManagerProps) {
  const [isEditingPolicy, setIsEditingPolicy] = useState<LeavePolicy | null>(null);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaveTypeId: '',
    minNoticeDays: 0,
    maxConsecutiveDays: '',
    maxRequestsPerYear: '',
    requiresApproval: true,
  });

  const { data: policies } = useSWR<LeavePolicy[]>('/api/leave/policies', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const { data: companySettings } = useSWR<CompanySettings>('/api/company/settings', fetcher);
  const { data: user } = useSWR('/api/user', fetcher);

  const isManager = user?.role === 'owner' || user?.role === 'admin';

  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('/api/leave/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxConsecutiveDays: formData.maxConsecutiveDays ? parseInt(formData.maxConsecutiveDays) : null,
          maxRequestsPerYear: formData.maxRequestsPerYear ? parseInt(formData.maxRequestsPerYear) : null,
        }),
      });

      if (response.ok) {
        mutate('/api/leave/policies');
        setIsCreatingPolicy(false);
        setFormData({
          name: '',
          description: '',
          leaveTypeId: '',
          minNoticeDays: 0,
          maxConsecutiveDays: '',
          maxRequestsPerYear: '',
          requiresApproval: true,
        });
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!isEditingPolicy) return;

    try {
      const response = await fetch(`/api/leave/policies/${isEditingPolicy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxConsecutiveDays: formData.maxConsecutiveDays ? parseInt(formData.maxConsecutiveDays) : null,
          maxRequestsPerYear: formData.maxRequestsPerYear ? parseInt(formData.maxRequestsPerYear) : null,
        }),
      });

      if (response.ok) {
        mutate('/api/leave/policies');
        setIsEditingPolicy(null);
        setFormData({
          name: '',
          description: '',
          leaveTypeId: '',
          minNoticeDays: 0,
          maxConsecutiveDays: '',
          maxRequestsPerYear: '',
          requiresApproval: true,
        });
      }
    } catch (error) {
      console.error('Error updating policy:', error);
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`/api/leave/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate('/api/leave/policies');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const startEditPolicy = (policy: LeavePolicy) => {
    setIsEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      leaveTypeId: policy.leaveTypeId?.toString() || '',
      minNoticeDays: policy.minNoticeDays,
      maxConsecutiveDays: policy.maxConsecutiveDays?.toString() || '',
      maxRequestsPerYear: policy.maxRequestsPerYear?.toString() || '',
      requiresApproval: policy.requiresApproval,
    });
  };

  const cancelEdit = () => {
    setIsEditingPolicy(null);
    setIsCreatingPolicy(false);
    setFormData({
      name: '',
      description: '',
      leaveTypeId: '',
      minNoticeDays: 0,
      maxConsecutiveDays: '',
      maxRequestsPerYear: '',
      requiresApproval: true,
    });
  };

  if (!isManager) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Policy Manager</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't have permission to manage leave policies.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Company Settings */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Company Settings</CardTitle>
                <p className="text-sm text-gray-600">Configure company-wide leave policies</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditingCompany(!isEditingCompany)}
              className="text-blue-700 border-blue-300"
            >
              {isEditingCompany ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              {isEditingCompany ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">
                Company Name
              </Label>
              <Input
                id="company-name"
                value={companySettings?.companyName || ''}
                disabled={!isEditingCompany}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="default-leave" className="text-sm font-medium text-gray-700">
                Default Annual Leave Days
              </Label>
              <Input
                id="default-leave"
                type="number"
                value={companySettings?.defaultAnnualLeaveDays || 25}
                disabled={!isEditingCompany}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fiscal-year" className="text-sm font-medium text-gray-700">
                Fiscal Year Start
              </Label>
              <Input
                id="fiscal-year"
                value={companySettings?.fiscalYearStart || '01-01'}
                disabled={!isEditingCompany}
                className="mt-1"
                placeholder="MM-DD"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="carry-over"
                checked={companySettings?.allowCarryOver || false}
                disabled={!isEditingCompany}
              />
              <Label htmlFor="carry-over" className="text-sm font-medium text-gray-700">
                Allow Leave Carry Over
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Policies */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Leave Policies</CardTitle>
                <p className="text-sm text-gray-600">Configure rules for different leave types</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreatingPolicy(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Policy Form */}
          <AnimatePresence>
            {(isCreatingPolicy || isEditingPolicy) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isCreatingPolicy ? 'Create New Policy' : 'Edit Policy'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy-name">Policy Name</Label>
                    <Input
                      id="policy-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Annual Leave Policy"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leave-type">Leave Type</Label>
                    <select
                      id="leave-type"
                      value={formData.leaveTypeId}
                      onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes?.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="min-notice">Minimum Notice (Days)</Label>
                    <Input
                      id="min-notice"
                      type="number"
                      value={formData.minNoticeDays}
                      onChange={(e) => setFormData({ ...formData, minNoticeDays: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-consecutive">Max Consecutive Days</Label>
                    <Input
                      id="max-consecutive"
                      type="number"
                      value={formData.maxConsecutiveDays}
                      onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: e.target.value })}
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-requests">Max Requests Per Year</Label>
                    <Input
                      id="max-requests"
                      type="number"
                      value={formData.maxRequestsPerYear}
                      onChange={(e) => setFormData({ ...formData, maxRequestsPerYear: e.target.value })}
                      placeholder="No limit"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires-approval"
                      checked={formData.requiresApproval}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                    />
                    <Label htmlFor="requires-approval">Requires Approval</Label>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of this policy..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    onClick={isCreatingPolicy ? handleCreatePolicy : handleUpdatePolicy}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreatingPolicy ? 'Create Policy' : 'Update Policy'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Policies List */}
          <div className="space-y-4">
            <AnimatePresence>
              {policies?.map((policy, index) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                            <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {policy.description && (
                            <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Min Notice:</span>
                              <span className="ml-2 font-medium">{policy.minNoticeDays} days</span>
                            </div>
                            {policy.maxConsecutiveDays && (
                              <div>
                                <span className="text-gray-500">Max Consecutive:</span>
                                <span className="ml-2 font-medium">{policy.maxConsecutiveDays} days</span>
                              </div>
                            )}
                            {policy.maxRequestsPerYear && (
                              <div>
                                <span className="text-gray-500">Max Per Year:</span>
                                <span className="ml-2 font-medium">{policy.maxRequestsPerYear}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Approval:</span>
                              <span className="ml-2 font-medium">
                                {policy.requiresApproval ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditPolicy(policy)}
                            className="text-blue-700 border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="text-red-700 border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {policies?.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No policies configured</h3>
                <p className="text-gray-600">Create your first leave policy to get started.</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
