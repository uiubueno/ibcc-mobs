import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Agrupa por tipo e conta quantos estão disponíveis (NOVO ou USADO)
    const available = await prisma.furniture.groupBy({
      by: ['type'],
      _count: {
        _all: true
      },
      where: {
        status: { in: ['NOVO', 'USADO'] }
      }
    })

    return NextResponse.json(available.map(item => ({
      type: item.type,
      count: item._count._all
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar disponíveis' }, { status: 500 })
  }
}