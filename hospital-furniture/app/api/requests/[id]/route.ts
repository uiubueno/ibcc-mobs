import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  
  // 1. Aguarda o ID ser resolvido (essencial nas versões novas do Next.js)
  const { id } = await params;

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, notes } = body 
    
    // Busca os dados atuais da solicitação
    const requestData = await prisma.request.findUnique({ 
      where: { id: id }, 
      include: { furniture: true } 
    })
    
    if (!requestData) {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    // Lógica de Aprovação e Baixa de Estoque
    if (requestData.status === 'PENDENTE' && status === 'EM_SEPARACAO') {
      
      if (requestData.furniture.quantity < requestData.quantity) {
        return NextResponse.json({ error: 'Estoque insuficiente no momento da aprovação.' }, { status: 400 })
      }

      const transaction = await prisma.$transaction([
        prisma.furniture.update({
          where: { id: requestData.furnitureId },
          data: { quantity: { decrement: requestData.quantity } }
        }),
        prisma.request.update({
          where: { id: id },
          data: { status, notes, reviewedAt: new Date() }
        })
      ])
      return NextResponse.json(transaction[1])
    }

    // Atualização simples de status (Trânsito, Entregue, Recusado)
    const updatedRequest = await prisma.request.update({
      where: { id: id },
      data: { status, notes, reviewedAt: new Date() }
    })

    return NextResponse.json(updatedRequest)

  } catch (error: any) {
    // Esse console.error vai mostrar o erro real no seu terminal do VS Code!
    console.error("ERRO NA LOGÍSTICA:", error)
    return NextResponse.json({ error: 'Erro interno ao processar movimentação.' }, { status: 500 })
  }
}