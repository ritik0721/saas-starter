import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveRequests, users, leaveTypes } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { EmailService } from '@/lib/emails/email-service';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

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

    const body = await request.json();
    const validatedData = rejectSchema.parse(body);

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

    // Update leave request status to rejected
    await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        rejectionReason: validatedData.reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId));

    // Send rejection notification email
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
      await EmailService.sendLeaveRequestRejected({
        to: userDetails.email,
        userName: userDetails.name || 'User',
        leaveType: leaveTypeDetails.name,
        startDate: new Date(leaveRequest.startDate).toLocaleDateString(),
        endDate: new Date(leaveRequest.endDate).toLocaleDateString(),
        totalDays: Number(leaveRequest.totalDays),
        reason: leaveRequest.reason || undefined,
        rejectedBy: user.name || 'Manager',
        rejectionReason: validatedData.reason,
        companyName: 'Your Company',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      { error: 'Failed to reject leave request' },
      { status: 500 }
    );
  }
}
