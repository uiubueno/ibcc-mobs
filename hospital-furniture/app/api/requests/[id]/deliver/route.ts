import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { furnitureId, status } = await req.json()

    // 1. TRIAGEM (Aprovar ou Recusar)
    if (status === 'RECUSADO' || status === 'EM_SEPARACAO') {
      const request = await prisma.request.update({
        where: { id },
        data: { status: status }
      })
      return NextResponse.json(request)
    }

    // 2. ENTREGA FINAL (Dar Baixa no Estoque)
    if (furnitureId) {
      const result = await prisma.$transaction(async (tx) => {
        // Atualiza a solicitação para ENTREGUE
        const request = await tx.request.update({
          where: { id },
          data: { 
            status: 'ENTREGUE',
            furnitureId: furnitureId
          }
        })

        // Atualiza o móvel: muda o setor e DÁ A BAIXA na quantidade
        await tx.furniture.update({
          where: { id: furnitureId },
          data: { 
            location: request.sector,
            quantity: { decrement: request.quantity } // Aqui a mágica da baixa acontece!
          }
        })

        // BÔNUS: Registra a movimentação no histórico do hospital
        await tx.movement.create({
          data: {
            furnitureId: furnitureId,
            type: 'TRANSFERENCIA', // ou SAIDA, conforme sua preferência
            quantity: request.quantity,
            description: `Triagem aprovada. Item entregue para o setor: ${request.sector}`
          }
        })

        return request
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Dados incompletos para a ação' }, { status: 400 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 })
  }
}