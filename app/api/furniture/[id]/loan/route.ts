import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { borrowerName, borrowerSector } = await req.json()

    const itemOrigem = await prisma.furniture.findUnique({ where: { id } })
    
    if (!itemOrigem || itemOrigem.quantity <= 0) {
      return NextResponse.json({ error: 'Item indisponível no estoque' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let loanedItem;

      // 🔥 REGRA NOVA: Se for um item único (como móveis com patrimônio), apenas ATUALIZA o mesmo item.
      if (itemOrigem.quantity === 1) {
        loanedItem = await tx.furniture.update({
          where: { id },
          data: {
            name: `Empréstimo: ${itemOrigem.name}`,
            status: 'EMPRESTADO',
            location: borrowerSector,
            borrower: borrowerName
          }
        })
      } 
      // Se for um Lote (ex: quantidade 10), aí sim ele divide o lote e cria um item separado
      else {
        await tx.furniture.update({
          where: { id },
          data: { quantity: itemOrigem.quantity - 1 }
        })

        loanedItem = await tx.furniture.create({
          data: {
            name: `Empréstimo: ${itemOrigem.name}`,
            type: itemOrigem.type,
            quantity: 1,
            status: 'EMPRESTADO',
            location: borrowerSector,
            borrower: borrowerName,
            patrimony: itemOrigem.patrimony
          }
        })
      }

      // Registra o movimento no histórico
      await tx.movement.create({
        data: {
          furnitureId: loanedItem.id,
          type: 'EMPRESTIMO',
          quantity: 1,
          description: `Item emprestado para o setor: ${borrowerSector}. Retirado por: ${borrowerName}`,
        }
      })

      return loanedItem
    })

    return NextResponse.json({ success: true, item: result })
  } catch (error) {
    console.error("Erro ao registrar empréstimo:", error)
    return NextResponse.json({ error: 'Erro ao registrar empréstimo' }, { status: 500 })
  }
}