import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as any)?.role 
  const { pathname } = req.nextUrl

  // 1. Definimos o que é público e o que é restrito
  const isPublicPage = pathname === '/login'
  const isTryingToAccessAdmin = pathname.startsWith('/admin')

  // 2. BLOQUEIO GLOBAL: Se não estiver logado e não for a página de login, vai para o login
  // Isso protege o /solicitar, a home / e qualquer outra página nova
  if (!isLoggedIn && !isPublicPage) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  // 3. REGRA DO ADMIN: Se estiver logado mas tentar entrar no /admin sem ser ADMIN
  if (isTryingToAccessAdmin && userRole !== 'ADMIN') {
    return Response.redirect(new URL('/', req.nextUrl)) 
  }
})

export const config = {
  // Mantemos o matcher para ignorar arquivos de imagem, css e api
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}