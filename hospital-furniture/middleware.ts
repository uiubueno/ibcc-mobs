import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  // Se o cara tentar acessar qualquer coisa que não seja o login e não estiver logado
  if (!isLoggedIn && nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Se ele já estiver logado e tentar ir pra tela de login, manda pra home
  if (isLoggedIn && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  return NextResponse.next()
})

// Aqui dizemos em quais rotas o porteiro deve atuar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}