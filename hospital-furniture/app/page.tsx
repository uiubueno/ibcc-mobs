import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, ClipboardList, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage(props: { 
  searchParams: Promise<{ from?: string, to?: string }> 
}) {
  const session = await auth()
  const searchParams = await props.searchParams
  const { from, to } = searchParams

  // Filtro de data para o Prisma
  const dateFilter = from && to ? {
    createdAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    }
  } : {}

  // Buscas simultâneas
  const [totalItems, lowStockItems, allRequests] = await Promise.all([
    prisma.furniture.aggregate({ _sum: { quantity: true } }),
    prisma.furniture.findMany({ where: { quantity: { lte: 2 } }, take: 4 }),
    prisma.request.findMany({ 
      where: dateFilter,
      include: { furniture: true } 
    })
  ])

  // Processamento de dados
  const pendingRequests = allRequests.filter(r => r.status === 'PENDENTE').length
  const deliveredRequests = allRequests.filter(r => r.status === 'ENTREGUE').length

  const statusCounts = allRequests.reduce((acc: any, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key.replace('_', ' '),
    value: statusCounts[key]
  }))

  const sectorCounts = allRequests.reduce((acc: any, req) => {
    acc[req.sector] = (acc[req.sector] || 0) + 1
    return acc
  }, {})

  const sectorData = Object.keys(sectorCounts)
    .map(key => ({ name: key, total: sectorCounts[key] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard IBCC</h1>
          <p className="text-slate-500 mt-2 text-lg">Olá, {session?.user?.name}. Aqui está a inteligência operacional de hoje.</p>
        </div>
        
        {/* Suspense evita o travamento da Navbar */}
        <Suspense fallback={<div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />}>
          <DateRangeFilter />
        </Suspense>
      </header>

      {/* Cards de KPIs (Agora com 4 colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Pendentes</CardTitle>
            <ClipboardList className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests}</div>
            <Link href="/admin/requests" className="text-xs text-blue-600 hover:underline flex items-center mt-2 font-medium">
              Acessar fila <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* NOVO CARD: ENTREGUES */}
        <Card className="border-none shadow-xl shadow-blue-500/10 bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 uppercase">Entregues</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveredRequests}</div>
            <p className="text-[10px] text-blue-200 mt-2 font-bold uppercase tracking-wider">Sucesso no período</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Estoque Total</CardTitle>
            <Package className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems._sum.quantity || 0}</div>
            <Link href="/admin/furniture" className="text-xs text-blue-600 hover:underline flex items-center mt-2 font-medium">
              Ver inventário <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 uppercase">Ação Rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-tight">
              Registrar movimentação de mobiliário.
            </p>
            <Link href="/solicitar">
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-md text-sm font-bold transition-all">
                Nova Solicitação
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts statusData={statusData} sectorData={sectorData} />

      <Card className="border-red-100 shadow-sm">
        <CardHeader className="bg-red-50/50 flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-base text-red-800">Alertas de Reposição Crítica</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-tighter">Patrimônio: {item.patrimony || 'S/N'}</p>
                  </div>
                  <Badge variant="destructive" className="font-mono">{item.quantity} un</Badge>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-slate-400 italic">Nenhum item com estoque baixo no momento.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}