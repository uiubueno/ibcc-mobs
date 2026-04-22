import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// FUNÇÃO 1: BUSCAR HISTÓRICO (GET)
export async function GET(req: NextRequest, { params }: { params: any }) {
  const session = await auth()
  const { id } = await params

  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const furniture = await prisma.furniture.findUnique({
      where: { id },
      include: {
        movements: { orderBy: { createdAt: 'desc' } },
        requestItems: {
          include: {
            request: { include: { user: { select: { name: true } } } }
          }
        }
      }
    })

    if (!furniture) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    return NextResponse.json(furniture)
  } catch (error) {
    console.error("Erro no GET furniture:", error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}

// FUNÇÃO 2: EDITAR QUANTIDADE (PATCH)
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { quantity, location, status } = await req.json()

    const current = await prisma.furniture.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

    const diff = quantity - current.quantity

    const updated = await prisma.furniture.update({
      where: { id },
      data: { quantity, location, status }
    })

    // Registra no histórico a mudança manual
    if (diff !== 0) {
      await prisma.movement.create({
        data: {
          furnitureId: id,
          type: diff > 0 ? 'ENTRADA' : 'SAIDA',
          quantity: Math.abs(diff),
          description: `Ajuste manual de estoque (Saldo: ${current.quantity} -> ${quantity})`
        }
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erro no PATCH furniture:", error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}