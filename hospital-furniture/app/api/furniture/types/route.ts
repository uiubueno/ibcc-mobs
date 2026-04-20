import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Busca apenas os tipos únicos que já estão cadastrados no banco
    const types = await prisma.furniture.findMany({
      select: { type: true },
      distinct: ['type'],
    })
    
    return NextResponse.json(types.map(t => t.type))
  } catch (error) {
    return NextResponse.json([])
  }
}