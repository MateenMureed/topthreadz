// Dynamic favicon route: serves the admin-uploaded favicon slot as real
// .ico bytes (Cloudinary f_icl conversion) with proper Content-Type and
// caching — the most compatible approach across browsers. Falls back to the
// bundled favicon when no favicon slot is uploaded.
import { fetchServerSiteLogo } from '@/lib/serverData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { protocol, host } = new URL(request.url);

  try {
    const logo = await fetchServerSiteLogo();
    const icoUrl = logo?.faviconIco;
    if (icoUrl) {
      const upstream = await fetch(icoUrl, { next: { revalidate: 3600 } });
      if (upstream.ok) {
        const bytes = await upstream.arrayBuffer();
        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/x-icon',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        });
      }
    }
  } catch {
    // fall through to bundled favicon
  }

  // No uploaded favicon (or upstream failed): serve the bundled one.
  return Response.redirect(`${protocol}//${host}/favicon.ico`, 307);
}
