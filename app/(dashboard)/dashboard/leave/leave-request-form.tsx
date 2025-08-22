'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { LeaveType } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeaveRequestFormProps {
  onClose: () => void;
}

export default function LeaveRequestForm({ onClose }: LeaveRequestFormProps) {
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
  });

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    return differenceInDays(formData.endDate, formData.startDate) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const totalDays = calculateDays();
      
      const response = await fetch('/api/leave/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          leaveTypeId: parseInt(formData.leaveTypeId),
          startDate: formData.startDate?.toISOString().split('T')[0],
          endDate: formData.endDate?.toISOString().split('T')[0],
          totalDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create leave request');
      }

      setSuccess(true);
      mutate('/api/leave/requests');
      mutate('/api/leave/allowance');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.leaveTypeId;
      case 2: return formData.startDate && formData.endDate;
      case 3: return true;
      default: return false;
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          <motion.h3
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl font-semibold text-gray-900 mb-3"
          >
            Leave Request Submitted!
          </motion.h3>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-600"
          >
            Your request has been submitted and is pending approval.
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 bg-gradient-to-r from-orange-50 to-orange-100">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Request Leave</CardTitle>
            <p className="text-gray-600 mt-1">Fill out your leave request details</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 rounded-full hover:bg-orange-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Leave Type */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="leaveType" className="text-base font-medium text-gray-900">
                      What type of leave are you requesting? *
                    </Label>
                    <Select
                      value={formData.leaveTypeId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: value }))}
                    >
                      <SelectTrigger className="mt-2 h-12 text-left">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              <span>{type.name}</span>
                              {type.isPaid && (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                  Paid
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Dates */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-medium text-gray-900">Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mt-2 h-12 justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-base font-medium text-gray-900">End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mt-2 h-12 justify-start text-left font-normal"
                            disabled={!formData.startDate}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                            disabled={(date) => !formData.startDate || date < formData.startDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Days Calculation */}
                  {formData.startDate && formData.endDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Total days: <span className="text-lg font-bold">{calculateDays()}</span>
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Including both start and end dates
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-600">
                            {format(formData.startDate, 'MMM d')} - {format(formData.endDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Reason */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="reason" className="text-base font-medium text-gray-900">
                      Reason for leave (Optional)
                    </Label>
                    <textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={4}
                      className="w-full mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm resize-none"
                      placeholder="Brief reason for your leave request..."
                    />
                  </div>

                  {/* Summary */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-50 rounded-xl border"
                  >
                    <h4 className="font-medium text-gray-900 mb-3">Request Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Leave Type:</span>
                        <span className="font-medium">
                          {leaveTypes?.find(lt => lt.id.toString() === formData.leaveTypeId)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{calculateDays()} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium">
                          {formData.startDate && formData.endDate 
                            ? `${format(formData.startDate, 'MMM d')} - ${format(formData.endDate, 'MMM d, yyyy')}`
                            : 'Not set'
                          }
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6"
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                    </motion.div>
                  ) : null}
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}
