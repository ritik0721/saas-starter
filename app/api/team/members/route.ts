import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, teams } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const userTeam = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (userTeam.length === 0) {
      return NextResponse.json({ error: 'User not part of any team' }, { status: 404 });
    }

    const teamId = userTeam[0].teamId;

    // Get all team members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
