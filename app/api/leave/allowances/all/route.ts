import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveAllowances, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all leave allowances for the current year
    const currentYear = new Date().getFullYear();
    const allowances = await db
      .select({
        id: leaveAllowances.id,
        userId: leaveAllowances.userId,
        year: leaveAllowances.year,
        totalDays: leaveAllowances.totalDays,
        usedDays: leaveAllowances.usedDays,
        carriedOver: leaveAllowances.carriedOver,
        createdAt: leaveAllowances.createdAt,
        updatedAt: leaveAllowances.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(leaveAllowances)
      .innerJoin(users, eq(leaveAllowances.userId, users.id))
      .where(eq(leaveAllowances.year, currentYear))
      .orderBy(leaveAllowances.userId);

    return NextResponse.json(allowances);
  } catch (error) {
    console.error('Error fetching all leave allowances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave allowances' },
      { status: 500 }
    );
  }
}
