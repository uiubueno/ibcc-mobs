import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DashboardAlerts } from '@/components/DashboardAlerts'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, ArrowRight, CheckCircle2, Truck, Package } from 'lucide-react'
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

  // 🔥 BUSCA OS LIMITES JUNTO COM OS OUTROS DADOS
  const [totalItems, stockByType, allRequests, dbLimits] = await Promise.all([
    prisma.furniture.aggregate({ _sum: { quantity: true } }),
    prisma.furniture.groupBy({ 
      by: ['type'], 
      _sum: { quantity: true },
      where: { status: { in: ['NOVO', 'USADO'] } } 
    }),
    prisma.request.findMany({ 
      where: dateFilter,
      include: { items: true } 
    }),
    prisma.stockLimit.findMany()
  ])

  const pendingRequests = allRequests.filter(r => r.status === 'PENDENTE').length
  const separationRequests = allRequests.filter(r => r.status === 'EM_SEPARACAO').length
  const deliveredRequests = allRequests.filter(r => r.status === 'ENTREGUE').length

  const statusCounts = allRequests.reduce((acc: any, req) => {
    const statusName = req.status.replace('_', ' ')
    acc[statusName] = (acc[statusName] || 0) + 1
    return acc
  }, {})

  const statusData = Object.keys(statusCounts).map(name => ({
    name,
    value: statusCounts[name]
  }))

  const sectorCounts = allRequests
    .filter(req => req.status === 'ENTREGUE') 
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4 md:pb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Dashboard IBCC</h1>
          <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Olá, {session?.user?.name?.split(' ')[0] || 'Gestor'}.</p>
        </div>
        <Suspense fallback={<div className="h-10 w-full sm:w-48 bg-slate-100 animate-pulse rounded-xl" />}>
          <div className="w-full sm:w-auto">
            <DateRangeFilter />
          </div>
        </Suspense>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Pendentes</CardTitle>
            <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{pendingRequests}</div>
            <Link href="/admin/requests" className="text-xs text-blue-600 hover:underline flex items-center mt-2 font-medium">
              Ver Triagem <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-600 uppercase tracking-wider">Em Separação</CardTitle>
            <Truck className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-purple-900">{separationRequests}</div>
            <p className="text-[9px] md:text-[10px] text-purple-600/70 mt-2 font-bold uppercase tracking-wider">Aguardando entrega</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-blue-500/10 bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-100 uppercase tracking-wider">Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{deliveredRequests}</div>
            <p className="text-[9px] md:text-[10px] text-blue-200 mt-2 font-bold uppercase tracking-wider">Pedidos concluídos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Estoque Total</CardTitle>
            <Package className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{totalItems._sum.quantity || 0}</div>
            <p className="text-[9px] md:text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Itens catalogados</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white shadow-lg sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300 uppercase tracking-wider">Ação Rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/solicitar" className="block">
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 md:py-3 rounded-lg text-sm font-bold transition-all shadow-md">
                Novo Pedido
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts statusData={statusData} sectorData={sectorData} />

      {/* 🔥 PASSAMOS OS LIMITES DO BANCO DE DADOS PARA O COMPONENTE */}
      <DashboardAlerts stockByType={stockByType} dbLimits={dbLimits} />

      <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
        IBCC ONCOLOGIA • HOTELARIA
      </p>
    </div>
  )
}