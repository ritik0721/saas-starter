import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, type NewUser, type NewTeamMember, type NewTeam } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) throw new Error('Failed to exchange code for tokens');
  return res.json() as Promise<{ id_token: string; access_token: string }>;
}

async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch Google user');
  return res.json() as Promise<{ id: string; email: string; name?: string; picture?: string }>;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get('oauth_state')?.value || '';
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || '';
    const code = url.searchParams.get('code');
    if (!code || state !== stateCookie) {
      return new Response('Invalid OAuth state', { status: 400 });
    }

    const baseUrl = process.env.BASE_URL!;
    const { access_token } = await exchangeCodeForTokens(code, `${baseUrl}/api/auth/google/callback`);
    const profile = await getGoogleUserInfo(access_token);

    // Find or create user by email
    const found = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
    let user = found[0];
    if (!user) {
      const newUser: NewUser = {
        email: profile.email,
        passwordHash: null,
        authProvider: 'google',
        name: profile.name || null,
        role: 'owner'
      } as any;
      const [created] = await db.insert(users).values(newUser).returning();
      user = created;

      // Create a team for the new user
      const teamName = `${profile.email}'s Team`;
      const newTeam: NewTeam = { name: teamName } as any;
      const [createdTeam] = await db.insert(teams).values(newTeam).returning();
      const newMember: NewTeamMember = {
        userId: user.id,
        teamId: createdTeam.id,
        role: 'owner'
      } as any;
      await db.insert(teamMembers).values(newMember);
    }

    await setSession(user as any);

    const redirect = cookieStore.get('oauth_redirect')?.value || '';
    const priceId = cookieStore.get('oauth_priceId')?.value || '';
    // Clean cookies
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_redirect');
    cookieStore.delete('oauth_priceId');
    cookieStore.delete('oauth_inviteId');

    if (redirect === 'checkout' && priceId) {
      // Redirect to pricing page with same query to trigger checkout flow
      return Response.redirect(`${baseUrl}/pricing?redirect=checkout&priceId=${encodeURIComponent(priceId)}`);
    }

    return Response.redirect(`${baseUrl}/dashboard`);
  } catch (e) {
    return new Response('OAuth error', { status: 500 });
  }
}


