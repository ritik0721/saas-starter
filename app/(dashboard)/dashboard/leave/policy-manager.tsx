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
  Clock,
  Shield,
  Building,
  Zap,
  CheckCircle
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
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-gray-600" />
            Policy Management
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
            <p className="text-gray-600">You need manager permissions to access policy management.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Company Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Company Settings</CardTitle>
                  <p className="text-sm text-blue-600">Configure global leave policies and company defaults</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditingCompany(!isEditingCompany)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isEditingCompany ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditingCompany ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isEditingCompany ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name</Label>
                    <Input
                      id="companyName"
                      defaultValue={companySettings?.companyName || 'Your Company'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultAnnualLeave" className="text-sm font-medium text-gray-700">Default Annual Leave Days</Label>
                    <Input
                      id="defaultAnnualLeave"
                      type="number"
                      defaultValue={companySettings?.defaultAnnualLeaveDays || 25}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxCarryOver" className="text-sm font-medium text-gray-700">Max Carry Over Days</Label>
                    <Input
                      id="maxCarryOver"
                      type="number"
                      defaultValue={companySettings?.maxCarryOverDays || 5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fiscalYearStart" className="text-sm font-medium text-gray-700">Fiscal Year Start</Label>
                    <Input
                      id="fiscalYearStart"
                      defaultValue={companySettings?.fiscalYearStart || '01-01'}
                      placeholder="MM-DD"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="allowCarryOver" defaultChecked={companySettings?.allowCarryOver} />
                    <Label htmlFor="allowCarryOver" className="text-sm font-medium text-gray-700">Allow Carry Over</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditingCompany(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Company</p>
                  <p className="text-lg font-bold text-blue-900">{companySettings?.companyName || 'Your Company'}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">Annual Leave</p>
                  <p className="text-lg font-bold text-green-900">{companySettings?.defaultAnnualLeaveDays || 25} days</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">Carry Over</p>
                  <p className="text-lg font-bold text-purple-900">{companySettings?.maxCarryOverDays || 5} days</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-700">Fiscal Year</p>
                  <p className="text-lg font-bold text-orange-900">{companySettings?.fiscalYearStart || '01-01'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave Policies Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Leave Policies</CardTitle>
                <p className="text-sm text-orange-600">Define and manage leave policies for different types</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreatingPolicy(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
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
                className="mb-8 p-6 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-red-50"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCreatingPolicy ? 'Create New Policy' : 'Edit Policy'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="policyName" className="text-sm font-medium text-gray-700">Policy Name</Label>
                    <Input
                      id="policyName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Annual Leave Policy"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaveType" className="text-sm font-medium text-gray-700">Leave Type</Label>
                    <select
                      id="leaveType"
                      value={formData.leaveTypeId}
                      onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes?.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="minNotice" className="text-sm font-medium text-gray-700">Minimum Notice (Days)</Label>
                    <Input
                      id="minNotice"
                      type="number"
                      value={formData.minNoticeDays}
                      onChange={(e) => setFormData({ ...formData, minNoticeDays: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxConsecutive" className="text-sm font-medium text-gray-700">Max Consecutive Days</Label>
                    <Input
                      id="maxConsecutive"
                      type="number"
                      value={formData.maxConsecutiveDays}
                      onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: e.target.value })}
                      placeholder="Optional"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRequests" className="text-sm font-medium text-gray-700">Max Requests Per Year</Label>
                    <Input
                      id="maxRequests"
                      type="number"
                      value={formData.maxRequestsPerYear}
                      onChange={(e) => setFormData({ ...formData, maxRequestsPerYear: e.target.value })}
                      placeholder="Optional"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresApproval"
                      checked={formData.requiresApproval}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                    />
                    <Label htmlFor="requiresApproval" className="text-sm font-medium text-gray-700">Requires Approval</Label>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the policy details..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={cancelEdit} className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    Cancel
                  </Button>
                  <Button
                    onClick={isCreatingPolicy ? handleCreatePolicy : handleUpdatePolicy}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
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
                  transition={{ delay: index * 0.1 }}
                  className="p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Shield className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{policy.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {leaveTypes?.find(lt => lt.id === policy.leaveTypeId)?.name || 'Unknown Type'}
                            </Badge>
                            {policy.requiresApproval && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                Requires Approval
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {policy.description && (
                        <p className="text-gray-600 mb-4">{policy.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Min Notice:</span>
                          <span className="ml-2 font-medium text-gray-900">{policy.minNoticeDays} days</span>
                        </div>
                        {policy.maxConsecutiveDays && (
                          <div>
                            <span className="text-gray-500">Max Consecutive:</span>
                            <span className="ml-2 font-medium text-gray-900">{policy.maxConsecutiveDays} days</span>
                          </div>
                        )}
                        {policy.maxRequestsPerYear && (
                          <div>
                            <span className="text-gray-500">Max Per Year:</span>
                            <span className="ml-2 font-medium text-gray-900">{policy.maxRequestsPerYear}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <Badge 
                            variant={policy.isActive ? "default" : "secondary"}
                            className={`ml-2 ${policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {policy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditPolicy(policy)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePolicy(policy.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {policies?.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-center py-16 text-gray-500"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No policies configured</h3>
                <p className="text-gray-600 mb-6">Start by creating your first leave policy</p>
                <Button
                  onClick={() => setIsCreatingPolicy(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Policy
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
