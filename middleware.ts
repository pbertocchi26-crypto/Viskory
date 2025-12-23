import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request);

  const intlResponse = intlMiddleware(request);

  if (intlResponse) {
    supabaseResponse.headers.forEach((value, key) => {
      intlResponse.headers.set(key, value);
    });

    supabaseResponse.cookies.getAll().forEach(cookie => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });

    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
