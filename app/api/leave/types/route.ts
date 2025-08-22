import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveTypes } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const types = await db.select().from(leaveTypes).orderBy(leaveTypes.name);
    
    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave types' },
      { status: 500 }
    );
  }
}
