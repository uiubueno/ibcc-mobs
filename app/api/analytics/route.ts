import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 🔥 O 'req: Request' VOLTOU! Precisamos dele para ler a URL.
export async function GET(req: Request) { 
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // 1. Pega os parâmetros da URL que o Frontend enviou
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // 2. Monta o filtro de data flexível
    let dateFilter: any = {}
    
    if (from && to) {
      // Se o usuário filtrou, pega o período exato (do minuto 00:00 até 23:59)
      dateFilter = {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T23:59:59.999Z`)
      }
    } else {
      // Se não tem filtro na URL, o padrão é mostrar os últimos 30 dias
      const trintaDiasAtras = new Date()
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
      dateFilter = { gte: trintaDiasAtras }
    }

    // 3. Busca os pedidos cruzando com o nosso dateFilter dinâmico
    const completedRequests = await prisma.request.findMany({
      where: {
        status: 'ENTREGUE',
        createdAt: dateFilter
      },
      include: { items: true }
    })

    const totalRequests = await prisma.request.count({
      where: { createdAt: dateFilter }
    })

    let totalHours = 0
    const sectorStats: Record<string, { count: number, totalTime: number }> = {}

    completedRequests.forEach(req => {
      // Calcula a diferença em horas entre a criação e a última atualização (entrega)
      const diffMs = new Date(req.updatedAt).getTime() - new Date(req.createdAt).getTime()
      const diffHrs = diffMs / (1000 * 60 * 60)
      
      totalHours += diffHrs

      if (!sectorStats[req.sector]) {
        sectorStats[req.sector] = { count: 0, totalTime: 0 }
      }
      sectorStats[req.sector].count += 1
      sectorStats[req.sector].totalTime += diffHrs
    })

    const averageSla = completedRequests.length > 0 ? (totalHours / completedRequests.length).toFixed(1) : "0"

    // Formata o ranking de setores mais rápidos/lentos
    const sectorRanking = Object.keys(sectorStats).map(sector => ({
      sector,
      requests: sectorStats[sector].count,
      avgTime: (sectorStats[sector].totalTime / sectorStats[sector].count).toFixed(1)
    })).sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime))

    return NextResponse.json({ 
      averageSla, 
      completedCount: completedRequests.length,
      totalRequests,
      completionRate: totalRequests > 0 ? Math.round((completedRequests.length / totalRequests) * 100) : 0,
      sectorRanking
    })
  } catch (error) {
    console.error("Erro ao gerar analytics:", error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}