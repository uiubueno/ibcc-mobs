import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const resolvedParams = await params
  const id = resolvedParams.id // ID do item original no estoque central

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { borrowerName, borrowerSector, quantity } = body

    // 1. Validação da quantidade recebida do formulário
    const loanQuantity = Number(quantity)
    if (isNaN(loanQuantity) || loanQuantity <= 0) {
      return NextResponse.json({ error: 'Quantidade inválida para empréstimo.' }, { status: 400 })
    }

    // 2. Busca o item original no estoque para conferir disponibilidade
    const stockItem = await prisma.furniture.findUnique({
      where: { id }
    })

    if (!stockItem) {
      return NextResponse.json({ error: 'Item não encontrado no estoque.' }, { status: 404 })
    }

    // Trava de segurança: impede empréstimo acima do saldo disponível
    if (stockItem.quantity < loanQuantity) {
      return NextResponse.json({ 
        error: `Estoque insuficiente para ${stockItem.name}. Disponível: ${stockItem.quantity}, Solicitado: ${loanQuantity}` 
      }, { status: 400 })
    }

    const isBulk = !stockItem.patrimony || stockItem.patrimony.trim() === ""

    if (!isBulk) {
      // Item único com patrimônio
      await prisma.furniture.update({
        where: { id },
        data: {
          name: `Empréstimo: ${stockItem.name}`,
          status: 'EMPRESTADO',
          location: borrowerSector,
          borrower: borrowerName,
        }
      })
    } else {
      // Item em lote sem patrimônio: deduz do principal e gera registro do empréstimo com a quantidade real
      await prisma.furniture.update({
        where: { id },
        data: {
          quantity: { decrement: loanQuantity }
        }
      })

      await prisma.furniture.create({
        data: {
          name: `Empréstimo: ${stockItem.name}`,
          type: stockItem.type,
          status: 'EMPRESTADO',
          quantity: loanQuantity, // Salva a quantidade exata informada
          location: borrowerSector,
          borrower: borrowerName,
          patrimony: null
        }
      })
    }

    // Registra o log histórico da movimentação de saída
    await prisma.movement.create({
      data: {
        furnitureId: id,
        type: 'SAIDA',
        quantity: loanQuantity,
        description: `Material cedido para o setor ${borrowerSector}. Responsável pela retirada: ${borrowerName}`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar empréstimo no servidor:", error)
    return NextResponse.json({ error: 'Erro interno ao processar empréstimo.' }, { status: 500 })
  }
}