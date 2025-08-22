import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveRequests, leaveAllowances, users, leaveTypes } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { EmailService } from '@/lib/emails/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Get the leave request
    const [leaveRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request is not pending' }, { status: 400 });
    }

    // Update leave request status to approved
    await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId));

    // Update leave allowance (deduct used days)
    const currentYear = new Date().getFullYear();
    const [allowance] = await db
      .select()
      .from(leaveAllowances)
      .where(
        and(
          eq(leaveAllowances.userId, leaveRequest.userId),
          eq(leaveAllowances.year, currentYear)
        )
      )
      .limit(1);

    if (allowance) {
      await db
        .update(leaveAllowances)
        .set({
          usedDays: allowance.usedDays + Number(leaveRequest.totalDays),
          updatedAt: new Date(),
        })
        .where(eq(leaveAllowances.id, allowance.id));
    }

    // Send approval notification email
    const [userDetails] = await db
      .select()
      .from(users)
      .where(eq(users.id, leaveRequest.userId))
      .limit(1);

    const [leaveTypeDetails] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, leaveRequest.leaveTypeId))
      .limit(1);

    if (userDetails && leaveTypeDetails) {
      await EmailService.sendLeaveRequestApproved({
        to: userDetails.email,
        userName: userDetails.name || 'User',
        leaveType: leaveTypeDetails.name,
        startDate: new Date(leaveRequest.startDate).toLocaleDateString(),
        endDate: new Date(leaveRequest.endDate).toLocaleDateString(),
        totalDays: Number(leaveRequest.totalDays),
        reason: leaveRequest.reason || undefined,
        approvedBy: user.name || 'Manager',
        companyName: 'Your Company',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving leave request:', error);
    return NextResponse.json(
      { error: 'Failed to approve leave request' },
      { status: 500 }
    );
  }
}
