import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublic = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/auth',
  ].some((path) => req.nextUrl.pathname.startsWith(path))

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}