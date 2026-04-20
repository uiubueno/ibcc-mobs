import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Lista as solicitações
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // ADMIN vê tudo. USER vê só os próprios pedidos.
  const isAdmin = session.user?.role === 'ADMIN'
  const where = isAdmin ? {} : { userId: session.user?.id }

  try {
    const requestsList = await prisma.request.findMany({
      where,
      include: {
        furniture: true, // Traz dados do móvel (se já tiver sido vinculado)
        user: { select: { name: true, email: true } } // Nome de quem pediu
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(requestsList)
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error)
    return NextResponse.json({ error: 'Erro ao buscar solicitações.' }, { status: 500 })
  }
}

// POST: Cria uma nova solicitação baseada no TIPO
export async function POST(req: NextRequest) {
  const session = await auth()
  
  // Verificação de segurança da sessão
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Você precisa estar logado para solicitar.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, sector, reason } = body

    // Validação de campos obrigatórios
    if (!type || !sector || !reason) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }

    // Criação da solicitação no banco
    // O furnitureId fica nulo (null) porque o William vai escolher o item depois
    const newRequest = await prisma.request.create({
      data: {
        userId: session.user.id,
        type: type,          // O que a enfermagem pediu (ex: "Maca")
        sector: sector,      // Onde entregar
        reason: reason,      // Por que pediu
        status: 'PENDENTE',  // Status inicial
        quantity: 1          // Valor padrão (pode ser ajustado se necessário)
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error("ERRO CRÍTICO NA API DE REQUESTS:", error)
    return NextResponse.json({ error: 'Erro interno ao processar sua solicitação.' }, { status: 500 })
  }
}