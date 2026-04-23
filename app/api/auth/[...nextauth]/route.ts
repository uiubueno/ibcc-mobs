import { handlers } from '@/lib/auth'

// Exportamos o GET e o POST separadamente para garantir que o Next.js 
// identifique os métodos corretamente e evite erros de permissão (como o 405).
export const GET = handlers.GET
export const POST = handlers.POST