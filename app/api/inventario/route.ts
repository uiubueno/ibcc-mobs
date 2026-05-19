import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// 1. GET (Buscar itens)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const items = await prisma.warehouseItem.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error("Erro ao buscar inventário:", error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

// 2. POST (Criar item)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, patrimony, unit, imageUrl, status } = body

    if (!name || !imageUrl) {
      return NextResponse.json({ error: 'Nome e foto são obrigatórios' }, { status: 400 })
    }

    const item = await prisma.warehouseItem.create({
      data: {
        name,
        patrimony: patrimony || null,
        unit: unit || 'Não possui',
        imageUrl,
        status: status || 'BOM'
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Erro ao salvar item do galpão:", error)
    return NextResponse.json({ error: 'Erro ao salvar item' }, { status: 500 })
  }
}

// 3. DELETE (Apagar item) ✅ FUNÇÃO NOVA
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Pega o ID da URL (ex: /api/inventario?id=123)
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    await prisma.warehouseItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar item do galpão:", error)
    return NextResponse.json({ error: 'Erro ao deletar item' }, { status: 500 })
  }
}