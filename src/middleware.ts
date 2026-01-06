import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tenantMatch = pathname.match(/^\/t\/([^/]+)/);
  if (!tenantMatch) {
    return NextResponse.next();
  }

  const tenantSlug = tenantMatch[1];
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', tenantSlug);
  return response;
}

export const config = {
  matcher: ['/t/:path*']
};
