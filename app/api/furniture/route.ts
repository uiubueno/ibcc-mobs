import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // Se o corpo for um Array, usamos criação em lote
    if (Array.isArray(body)) {
      const created = await prisma.furniture.createMany({
        data: body.map(item => ({
          name: item.name,
          type: item.type,
          quantity: 1, // Itens com patrimônio são sempre unitários
          status: item.status,
          location: item.location,
          patrimony: item.patrimony
        }))
      })
      return NextResponse.json(created)
    }

    // Se não for array, segue o fluxo normal (item único)
    const furniture = await prisma.furniture.create({
      data: {
        ...body,
        quantity: parseInt(body.quantity)
      }
    })

    return NextResponse.json(furniture)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao cadastrar' }, { status: 500 })
  }
}

// Mantemos o GET normal para listar tudo
export async function GET() {
  const furniture = await prisma.furniture.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(furniture)
}