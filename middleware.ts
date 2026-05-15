import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Aqui tá o pulo do gato: puxando só o arquivo leve pra Vercel não reclamar do tamanho!
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as any)?.role 
  const isTryingToAccessAdmin = req.nextUrl.pathname.startsWith('/admin')

  // Se o cara tentar entrar na área da Hotelaria (/admin)
  if (isTryingToAccessAdmin) {
    // 1. Não tá logado? Vai pro login.
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl))
    }

    // 2. Tá logado, mas NÃO é ADMIN (ou seja, é Coordenador Solicitante)? 
    // Chuta ele de volta pra tela inicial de solicitar/acompanhar.
    if (userRole !== 'ADMIN') {
      return Response.redirect(new URL('/', req.nextUrl)) 
    }
  }
})

// Aqui a gente avisa o porteiro quais portas ele deve vigiar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}