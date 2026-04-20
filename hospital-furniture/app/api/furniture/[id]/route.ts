import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const furniture = await prisma.furniture.findUnique({
      where: { id },
      include: {
        requests: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!furniture) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

    return NextResponse.json(furniture)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}