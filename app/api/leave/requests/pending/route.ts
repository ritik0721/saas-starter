import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveRequests, users, leaveTypes } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending leave requests with user and leave type details
    const requests = await db
      .select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        leaveTypeId: leaveRequests.leaveTypeId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        rejectionReason: leaveRequests.rejectionReason,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        leaveType: {
          id: leaveTypes.id,
          name: leaveTypes.name,
          color: leaveTypes.color,
          isPaid: leaveTypes.isPaid,
          requiresApproval: leaveTypes.requiresApproval,
        },
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending leave requests' },
      { status: 500 }
    );
  }
}
