'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Users, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { LeaveRequest, LeaveType, User } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamCalendarProps {
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  leaveRequests: (LeaveRequest & { user: User; leaveType: LeaveType })[];
}

export default function TeamCalendar({ className }: TeamCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const { data: teamMembers } = useSWR<User[]>('/api/team/members', fetcher);
  const { data: leaveRequests } = useSWR<LeaveRequest[]>('/api/leave/requests', fetcher);
  const { data: leaveTypes } = useSWR<LeaveType[]>('/api/leave/types', fetcher);

  const calendarDays = useMemo(() => {
    if (!leaveRequests || !teamMembers || !leaveTypes) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map(day => {
      const dayLeaveRequests = leaveRequests.filter(request => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        
        // Check if the day falls within the leave request period
        const isWithinRequest = isWithinInterval(day, { start: requestStart, end: requestEnd });
        
        // Apply leave type filter
        if (selectedLeaveType !== 'all') {
          return isWithinRequest && request.leaveTypeId.toString() === selectedLeaveType;
        }
        
        return isWithinRequest;
      }).map(request => ({
        ...request,
        user: teamMembers.find(member => member.id === request.userId)!,
        leaveType: leaveTypes.find(type => type.id === request.leaveTypeId)!
      }));

      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentMonth),
        leaveRequests: dayLeaveRequests
      };
    });
  }, [currentMonth, leaveRequests, teamMembers, leaveTypes, selectedLeaveType]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getDayClassName = (day: CalendarDay) => {
    const baseClasses = "h-24 border-r border-b border-gray-200 p-2 relative";
    const monthClasses = day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400";
    const todayClasses = isSameDay(day.date, new Date()) ? "ring-2 ring-orange-500 ring-inset" : "";
    
    return `${baseClasses} ${monthClasses} ${todayClasses}`;
  };

  const getLeaveRequestStyle = (leaveType: LeaveType) => ({
    backgroundColor: leaveType.color + '20',
    borderLeft: `4px solid ${leaveType.color}`,
    color: leaveType.color
  });

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Team Calendar</CardTitle>
              <p className="text-sm text-gray-600">See who's off when across the team</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="text-xs"
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="text-xs"
              >
                Week
              </Button>
            </div>

            {/* Leave Type Filter */}
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Leave Types</option>
              {leaveTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <motion.h2
              key={currentMonth.toISOString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-semibold text-gray-900 min-w-[200px] text-center"
            >
              {format(currentMonth, 'MMMM yyyy')}
            </motion.h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-100 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={day.date.toISOString()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01, duration: 0.2 }}
                  className={getDayClassName(day)}
                >
                  {/* Date Number */}
                  <div className="text-sm font-medium mb-2">
                    {format(day.date, 'd')}
                  </div>

                  {/* Leave Requests */}
                  <div className="space-y-1">
                    <AnimatePresence>
                      {day.leaveRequests.slice(0, 3).map((request, reqIndex) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: reqIndex * 0.1, duration: 0.2 }}
                          className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={getLeaveRequestStyle(request.leaveType)}
                          title={`${request.user.name} - ${request.leaveType.name}`}
                        >
                          <div className="font-medium truncate">
                            {request.user.name}
                          </div>
                          <div className="text-xs opacity-75 truncate">
                            {request.leaveType.name}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* More indicator */}
                    {day.leaveRequests.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{day.leaveRequests.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Leave Types:</span>
              {leaveTypes?.map(type => (
                <div key={type.id} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-gray-600">{type.name}</span>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-500">
              {leaveRequests?.filter(req => req.status === 'approved').length || 0} approved requests
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
