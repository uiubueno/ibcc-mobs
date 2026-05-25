import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const resolvedParams = await params
  const id = resolvedParams.id // ID do item que estava emprestado

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const loanItem = await prisma.furniture.findUnique({
      where: { id }
    })

    if (!loanItem) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Remove o prefixo do nome para voltar ao original
    const cleanName = loanItem.name.replace("Empréstimo: ", "")

    // Atualiza limpando tudo e voltando para o estoque central
    const updatedItem = await prisma.furniture.update({
      where: { id },
      data: {
        name: cleanName,
        status: 'USADO',
        quantity: 1,
        location: 'Sala 12',
        borrower: null // Deleta o nome do responsável do banco de dados
      }
    })

    // Registra o log histórico da devolução
    await prisma.movement.create({
      data: {
        furnitureId: id,
        type: 'ENTRADA',
        quantity: 1,
        description: `Item devolvido do setor ${loanItem.location}. Responsável anterior: ${loanItem.borrower || 'Não informado'}`,
      }
    })

    return NextResponse.json({ success: true, updatedItem })
  } catch (error) {
    console.error("Erro ao baixar empréstimo:", error)
    return NextResponse.json({ error: 'Erro ao processar devolução' }, { status: 500 })
  }
}