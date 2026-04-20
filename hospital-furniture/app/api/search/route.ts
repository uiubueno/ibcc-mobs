import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json([])

  const [furniture, requests] = await Promise.all([
    prisma.furniture.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { patrimony: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 5
    }),
    prisma.request.findMany({
      where: {
        OR: [
          { sector: { contains: query, mode: 'insensitive' } },
          { reason: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: { furniture: true },
      take: 5
    })
  ])

  return NextResponse.json({ furniture, requests })
}