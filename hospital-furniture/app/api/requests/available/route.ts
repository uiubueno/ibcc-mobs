import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Agrupa os móveis pelo TIPO e SOMA as quantidades.
    // Ignora os status MANUTENCAO e CONDENADO.
    const groupedItems = await prisma.furniture.groupBy({
      by: ['type'],
      _sum: {
        quantity: true
      },
      where: {
        status: {
          in: ['NOVO', 'USADO']
        }
      }
    })

    // 2. Transforma o resultado no formato que a sua tela (frontend) espera.
    // E filtra para não mandar para a tela itens que têm 0 em estoque.
    const availableTypes = groupedItems
      .map(item => ({
        type: item.type,
        count: item._sum.quantity || 0
      }))
      .filter(item => item.count > 0)

    return NextResponse.json(availableTypes)
  } catch (error) {
    console.error("Erro ao buscar móveis disponíveis:", error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}