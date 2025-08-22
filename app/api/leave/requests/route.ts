import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveRequests, leaveTypes, users, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { EmailService } from '@/lib/emails/email-service';

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, user.id))
      .orderBy(desc(leaveRequests.createdAt));
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLeaveRequestSchema.parse(body);

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check leave type exists
    const leaveType = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, validatedData.leaveTypeId))
      .limit(1);

    if (leaveType.length === 0) {
      return NextResponse.json(
        { error: 'Invalid leave type' },
        { status: 400 }
      );
    }

    // Create leave request
    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        userId: user.id,
        leaveTypeId: validatedData.leaveTypeId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: validatedData.totalDays.toString(),
        reason: validatedData.reason,
        status: 'pending',
      })
      .returning();

    // Get user details for email
    const [userDetails] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Get leave type details for email
    const [leaveTypeDetails] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, validatedData.leaveTypeId))
      .limit(1);

    // Get team manager for notification
    const [teamManager] = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(
        and(
          eq(teamMembers.teamId, (await db.select().from(teamMembers).where(eq(teamMembers.userId, user.id)).limit(1))[0]?.teamId || 0),
          eq(teamMembers.role, 'owner')
        )
      )
      .limit(1);

    // Send email notifications
    if (userDetails && leaveTypeDetails) {
      // Send confirmation to user
      await EmailService.sendLeaveRequestSubmitted({
        to: userDetails.email,
        userName: userDetails.name || 'User',
        leaveType: leaveTypeDetails.name,
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
        totalDays: validatedData.totalDays,
        reason: validatedData.reason,
        managerName: teamManager?.name || 'Your Manager',
        companyName: 'Your Company',
      });

      // Send notification to manager
      if (teamManager && teamManager.email !== userDetails.email) {
        await EmailService.sendManagerNotification({
          to: teamManager.email,
          userName: userDetails.name || 'User',
          leaveType: leaveTypeDetails.name,
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          totalDays: validatedData.totalDays,
          reason: validatedData.reason,
          companyName: 'Your Company',
          requestId: newRequest.id,
        });
      }
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
