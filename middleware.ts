import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // On regarde si l'utilisateur a le cookie de connexion
  const authCookie = request.cookies.get('lorth_auth');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // S'il n'est pas connecté et qu'il essaie d'aller ailleurs que sur /login
  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // S'il est DÉJÀ connecté et qu'il va sur /login, on le renvoie au Dashboard
  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// On définit ici les routes que le middleware doit surveiller
export const config = {
  // Applique le blocage PARTOUT, sauf sur les fichiers statiques (logos, favicon, etc.) et les requêtes internes
  matcher: ['/((?!api/login|_next/static|_next/image|favicon.svg|logo-lorth.svg|apple-touch-icon.png|manifest.json).*)'],
}