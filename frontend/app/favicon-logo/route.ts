// Dynamic favicon: redirects to the admin-uploaded logo (favicon variant)
// or the bundled favicon when none is set. Route handlers can redirect,
// which browsers follow for <link rel="icon"> requests.
import { fetchServerSiteLogo } from '@/lib/serverData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logo = await fetchServerSiteLogo();
    if (logo?.favicon || logo?.url) {
      return Response.redirect(logo.favicon || logo.url, 302);
    }
  } catch {
    // fall through to bundled favicon
  }
  return Response.redirect(new URL('/favicon.png', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.topthreadz.com.pk'), 302);
}
