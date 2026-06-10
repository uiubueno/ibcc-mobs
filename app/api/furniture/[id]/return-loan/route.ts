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
    const loanItem = await prisma.furniture.findUnique({
      where: { id }
    })

    if (!loanItem) {
      return NextResponse.json({ error: 'Item não encontrado no banco' }, { status: 404 })
    }

    // Trava inteligente: Se já não estiver emprestado, ignora (evita crash por duplo clique)
    if (loanItem.status !== 'EMPRESTADO') {
      return NextResponse.json({ success: true, message: 'Item já devolvido' })
    }

    const cleanName = loanItem.name.replace("Empréstimo: ", "").trim()
    
    // Identifica se é lote tratando strings nulas, vazias ou "S/N"
    const isBulk = !loanItem.patrimony || loanItem.patrimony.trim() === "" || loanItem.patrimony === "S/N"
    const currentQuantity = (loanItem.quantity && loanItem.quantity > 0) ? loanItem.quantity : 1

    let targetMovementId = id; // Define qual ID vai receber o log de histórico

    if (!isBulk) {
      // CAMINHO 1: Item Único (Com Patrimônio real)
      await prisma.furniture.update({
        where: { id },
        data: {
          name: cleanName,
          status: 'USADO',
          location: 'Estoque Central',
          borrower: null
        }
      })
    } else {
      // CAMINHO 2: Item em Lote (Sem Patrimônio)
      const mainStockItem = await prisma.furniture.findFirst({
        where: {
          name: cleanName,
          status: { in: ['NOVO', 'USADO'] },
          OR: [
            { patrimony: null },
            { patrimony: '' },
            { patrimony: 'S/N' }
          ]
        }
      })

      if (mainStockItem) {
        // Soma a quantidade de volta no lote principal
        await prisma.furniture.update({
          where: { id: mainStockItem.id },
          data: { quantity: { increment: currentQuantity } }
        })
        
        // Deleta o clone do empréstimo de forma segura
        await prisma.furniture.delete({
          where: { id }
        })
        
        // O log de movimentação AGORA aponta para o lote principal (Isso evita o crash!)
        targetMovementId = mainStockItem.id
      } else {
        // Se o lote sumiu, o clone assume o lugar dele
        await prisma.furniture.update({
          where: { id },
          data: {
            name: cleanName,
            status: 'USADO',
            location: 'Estoque Central',
            borrower: null
          }
        })
      }
    }

    // Cria o histórico com o ID correto e seguro
    await prisma.movement.create({
      data: {
        furnitureId: targetMovementId,
        type: 'ENTRADA',
        quantity: currentQuantity,
        description: `Devolução de empréstimo. Setor: ${loanItem.location || 'N/A'}. Responsável: ${loanItem.borrower || 'N/A'}`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro CRÍTICO na devolução:", error)
    // Devolve o erro real para o frontend poder ler
    return NextResponse.json({ error: error.message || 'Erro interno no banco de dados' }, { status: 500 })
  }
}