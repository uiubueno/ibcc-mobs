import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { limits } = await req.json()
    
    // O Prisma upsert atualiza o limite se o tipo já existir, ou cria se for novo
    for (const item of limits) {
      await prisma.stockLimit.upsert({
        where: { type: item.type },
        update: { minLimit: item.minLimit },
        create: { type: item.type, minLimit: item.minLimit }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar limites:", error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}