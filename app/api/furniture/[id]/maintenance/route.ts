import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  // AQUI ESTÁ O AJUSTE QUE LIBERA O DEPLOY NA VERCEL
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, maintenanceQuantity } = body 

    // Primeiro, vamos ver como está esse item no banco hoje
    const currentFurniture = await prisma.furniture.findUnique({
      where: { id }
    })

    if (!currentFurniture) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Se ele tem patrimônio (ou seja, a quantidade é 1) OU a quantidade enviada é igual ao total,
    // a gente só atualiza a linha inteira normal.
    if (currentFurniture.patrimony || maintenanceQuantity === currentFurniture.quantity || !maintenanceQuantity) {
      const updated = await prisma.furniture.update({
        where: { id },
        data: { status }
      })
      return NextResponse.json(updated)
    }

    // AGORA A MÁGICA DA DIVISÃO (SPLIT):
    // Se não tem patrimônio e pediram pra mandar SÓ UMA PARTE pra manutenção...
    const quantityToMove = parseInt(maintenanceQuantity, 10)
    
    if (quantityToMove >= currentFurniture.quantity || quantityToMove <= 0 || isNaN(quantityToMove)) {
      return NextResponse.json({ error: 'Quantidade inválida para divisão' }, { status: 400 })
    }

    // Usamos uma Transação ($transaction) para garantir que ou faz tudo, ou não faz nada.
    const [updatedOriginal, newMaintenanceItem] = await prisma.$transaction([
      // 1. Subtrai a quantidade do item original (o que ficou bom)
      prisma.furniture.update({
        where: { id },
        data: { quantity: currentFurniture.quantity - quantityToMove }
      }),
      // 2. Cria um novo registro filhote idêntico, mas com o status de MANUTENÇÃO e a quantidade quebrada
      prisma.furniture.create({
        data: {
          name: currentFurniture.name,
          type: currentFurniture.type,
          quantity: quantityToMove,
          status: 'MANUTENCAO',
          location: currentFurniture.location,
          // Não copia o patrimônio pois se ele está sendo dividido, ele não tinha patrimônio único.
        }
      })
    ])

    return NextResponse.json({ message: "Divisão realizada com sucesso", updatedOriginal, newMaintenanceItem })

  } catch (error) {
    console.error("Erro ao processar manutenção:", error)
    return NextResponse.json({ error: 'Erro ao processar manutenção' }, { status: 500 })
  }
}

// empurrando para a vercel ler o codigo novo