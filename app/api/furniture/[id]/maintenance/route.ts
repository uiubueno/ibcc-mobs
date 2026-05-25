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
    const body = await req.json()
    // Agora recebemos apenas o Setor e o Nome de quem levou a cadeira reserva
    const { status, maintenanceQuantity, borrowerName, borrowerSector } = body 

    if (status !== 'MANUTENCAO') {
      return NextResponse.json({ error: 'Status inválido para esta rota' }, { status: 400 })
    }

    const currentFurniture = await prisma.furniture.findUnique({
      where: { id }
    })

    if (!currentFurniture) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      
      // ----------------------------------------------------------------
      // PARTE 1: ENVIAR O ITEM ORIGINAL PARA MANUTENÇÃO
      // ----------------------------------------------------------------
      if (currentFurniture.patrimony || maintenanceQuantity === currentFurniture.quantity || !maintenanceQuantity) {
        await tx.furniture.update({
          where: { id },
          data: { status: 'MANUTENCAO' }
        })
      } else {
        const quantityToMove = parseInt(maintenanceQuantity, 10)
        if (quantityToMove >= currentFurniture.quantity || quantityToMove <= 0 || isNaN(quantityToMove)) {
          throw new Error('Quantidade inválida para divisão de manutenção')
        }

        await tx.furniture.update({
          where: { id },
          data: { quantity: currentFurniture.quantity - quantityToMove }
        })

        await tx.furniture.create({
          data: {
            name: currentFurniture.name,
            type: currentFurniture.type,
            quantity: quantityToMove,
            status: 'MANUTENCAO',
            location: currentFurniture.location,
          }
        })
      }

      await tx.movement.create({
        data: {
          furnitureId: id,
          type: 'MANUTENCAO',
          quantity: maintenanceQuantity ? parseInt(maintenanceQuantity, 10) : currentFurniture.quantity,
          description: `Item enviado para a oficina. Setor de origem: ${currentFurniture.location}`,
        }
      })

      // ----------------------------------------------------------------
      // PARTE 2: LÓGICA DO EMPRÉSTIMO RESERVA (SEM CADASTRO PRÉVIO)
      // ----------------------------------------------------------------
      if (borrowerName) {
        // Cria um item genérico "fantasma" no banco só para controle visual
        const newLoanedItem = await tx.furniture.create({
          data: {
            name: `Reserva Emprestada (${currentFurniture.name})`,
            type: currentFurniture.type,
            quantity: 0, // Fica com 0 para ir direto para a aba de "Em Uso"
            status: 'EMPRESTADO',
            location: borrowerSector || currentFurniture.location,
            borrower: borrowerName
          }
        })

        await tx.movement.create({
          data: {
            furnitureId: newLoanedItem.id,
            type: 'EMPRESTIMO',
            quantity: 1,
            description: `Item reserva de controle emprestado para o setor ${borrowerSector || currentFurniture.location}. Retirado por: ${borrowerName}`,
          }
        })
      }

      return { success: true }
    })

    return NextResponse.json({ message: "Manutenção registrada com sucesso!", result })

  } catch (error: any) {
    console.error("Erro ao processar manutenção:", error)
    return NextResponse.json({ error: error.message || 'Erro ao processar manutenção' }, { status: 500 })
  }
}