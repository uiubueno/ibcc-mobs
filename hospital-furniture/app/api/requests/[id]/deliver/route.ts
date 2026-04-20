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
    const { furnitureId } = await req.json()

    // Usamos uma transação para garantir que ou muda tudo ou não muda nada
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza a solicitação
      const request = await tx.request.update({
        where: { id },
        data: { 
          status: 'ENTREGUE',
          furnitureId: furnitureId
        }
      })

      // 2. Atualiza o móvel (muda a localização para o setor que pediu)
      await tx.furniture.update({
        where: { id: furnitureId },
        data: { location: request.sector }
      })

      return request
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao entregar item' }, { status: 500 })
  }
}