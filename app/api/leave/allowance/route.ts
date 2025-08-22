import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveAllowances } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();
    
    // Get or create leave allowance for current year
    let allowance = await db
      .select()
      .from(leaveAllowances)
      .where(
        and(
          eq(leaveAllowances.userId, user.id),
          eq(leaveAllowances.year, currentYear)
        )
      )
      .limit(1);

    if (allowance.length === 0) {
      // Create default allowance (25 days for new users)
      const [newAllowance] = await db
        .insert(leaveAllowances)
        .values({
          userId: user.id,
          year: currentYear,
          totalDays: 25,
          usedDays: 0,
          carriedOver: 0,
        })
        .returning();
      
      allowance = [newAllowance];
    }

    return NextResponse.json(allowance[0]);
  } catch (error) {
    console.error('Error fetching leave allowance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave allowance' },
      { status: 500 }
    );
  }
}
