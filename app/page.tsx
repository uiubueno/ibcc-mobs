import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, ClipboardList, ArrowRight, CheckCircle2, Truck } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage(props: { 
  searchParams: Promise<{ from?: string, to?: string }> 
}) {
  const session = await auth()

  if (!session) redirect('/login')
  if (!session || (session.user as any)?.role !== "ADMIN") redirect('/solicitar')

  const searchParams = await props.searchParams
  const { from, to } = searchParams

  const dateFilter = from && to ? {
    createdAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    }
  } : {}

  const [totalItems, stockByType, allRequests] = await Promise.all([
    prisma.furniture.aggregate({ _sum: { quantity: true } }),
    prisma.furniture.groupBy({ 
      by: ['type'], 
      _sum: { quantity: true },
      where: { status: { in: ['NOVO', 'USADO'] } } 
    }),
    prisma.request.findMany({ 
      where: dateFilter,
      include: { items: true } 
    })
  ])

  const CRITICAL_THRESHOLD = 5;
  const lowStockItems = stockByType
    .filter(item => (item._sum.quantity || 0) <= CRITICAL_THRESHOLD)
    .sort((a, b) => (a._sum.quantity || 0) - (b._sum.quantity || 0))
    .slice(0, 5)

  // Contadores do topo (mantemos todos para você ver o volume de trabalho)
  const pendingRequests = allRequests.filter(r => r.status === 'PENDENTE').length
  const separationRequests = allRequests.filter(r => r.status === 'EM_SEPARACAO').length
  const deliveredRequests = allRequests.filter(r => r.status === 'ENTREGUE').length

  // Gráfico de Pizza: Mostra o status de tudo o que aconteceu no período
  const statusCounts = allRequests.reduce((acc: any, req) => {
    const statusName = req.status.replace('_', ' ')
    acc[statusName] = (acc[statusName] || 0) + 1
    return acc
  }, {})

  const statusData = Object.keys(statusCounts).map(name => ({
    name,
    value: statusCounts[name]
  }))

  // --- AQUI ESTÁ A MUDANÇA ---
  // Gráfico de Barras: Agora só conta setores que tiveram pedidos FINALIZADOS (ENTREGUE)
  const sectorCounts = allRequests
    .filter(req => req.status === 'ENTREGUE') // <--- SÓ ENTRA NO RANKING SE FOI ENTREGUE
    .reduce((acc: any, req) => {
      acc[req.sector] = (acc[req.sector] || 0) + 1
      return acc
    }, {})

  const sectorData = Object.keys(sectorCounts)
    .map(name => ({ 
      name, 
      total: sectorCounts[name] 
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard IBCC</h1>
          <p className="text-slate-500 mt-2 text-lg">Olá, {session?.user?.name}.</p>
        </div>
        <Suspense fallback={<div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />}>
          <DateRangeFilter />
        </Suspense>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Card 1: Pendentes */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Pendentes</CardTitle>
            <ClipboardList className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests}</div>
            <Link href="/admin/requests" className="text-xs text-blue-600 hover:underline flex items-center mt-2 font-medium">
              Ver Triagem <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Em Separação */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase">Em Separação</CardTitle>
            <Truck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{separationRequests}</div>
            <p className="text-[10px] text-purple-600/70 mt-2 font-bold uppercase tracking-wider">Aguardando entrega</p>
          </CardContent>
        </Card>

        {/* Card 3: Entregues */}
        <Card className="border-none shadow-xl shadow-blue-500/10 bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 uppercase">Entregues</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveredRequests}</div>
            <p className="text-[10px] text-blue-200 mt-2 font-bold uppercase tracking-wider">Pedidos concluídos</p>
          </CardContent>
        </Card>

        {/* Card 4: Estoque Total */}
        <Card className="border-l-4 border-l-slate-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Estoque Total</CardTitle>
            <Package className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems._sum.quantity || 0}</div>
          </CardContent>
        </Card>

        {/* Card 5: Ação Rápida */}
        <Card className="bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 uppercase">Ação Rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/solicitar">
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-md text-sm font-bold transition-all">
                Novo Pedido
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Os gráficos agora refletem a realidade: Status geral no Pizza e Consumo Real no Barras */}
      <DashboardCharts statusData={statusData} sectorData={sectorData} />

      <Card className="border-red-100 shadow-sm">
        <CardHeader className="bg-red-50/50 flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-base text-red-800">Alertas de Reposição Crítica</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <p className="font-bold text-slate-800 text-lg">{item.type}</p>
                  <Badge variant="destructive" className="font-mono text-sm px-3 py-1">
                    {item._sum.quantity} no total
                  </Badge>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-slate-400 italic">Estoque saudável.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}