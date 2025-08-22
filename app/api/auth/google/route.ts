import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '';
  const priceId = url.searchParams.get('priceId') || '';
  const inviteId = url.searchParams.get('inviteId') || '';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.BASE_URL;
  if (!clientId || !baseUrl) {
    return new Response('Google OAuth not configured', { status: 500 });
  }

  const state = Math.random().toString(36).slice(2);
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax' });
  cookieStore.set('oauth_redirect', redirect, { httpOnly: true, secure: true, sameSite: 'lax' });
  if (priceId) cookieStore.set('oauth_priceId', priceId, { httpOnly: true, secure: true, sameSite: 'lax' });
  if (inviteId) cookieStore.set('oauth_inviteId', inviteId, { httpOnly: true, secure: true, sameSite: 'lax' });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return Response.redirect(authUrl);
}


