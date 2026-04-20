'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Search,
  ArrowRight,
  PackageSearch
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para o Modal de Entrega
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [openDeliver, setOpenDeliver] = useState(false)

  const fetchData = async () => {
    const [resReq, resInv] = await Promise.all([
      fetch('/api/requests'),
      fetch('/api/furniture')
    ])
    setRequests(await resReq.json())
    setInventory(await resInv.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDeliver = async (furnitureId: string) => {
    toast.promise(
      fetch(`/api/requests/${selectedRequest.id}/deliver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ furnitureId })
      }),
      {
        loading: 'Vinculando patrimônio e atualizando setor...',
        success: () => {
          setOpenDeliver(false)
          fetchData()
          return 'Item entregue e rastreado com sucesso! 🚚'
        },
        error: 'Erro ao finalizar entrega.'
      }
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDENTE')
  const completedRequests = requests.filter(r => r.status === 'ENTREGUE')

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Atendimento</h1>
          <p className="text-slate-500 font-medium italic">Gestão de Fluxo Hospitalar IBCC</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-2 px-4 rounded-lg font-bold">
            {pendingRequests.length} PENDENTES
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-2 px-4 rounded-lg font-bold">
            {completedRequests.length} ENTREGUES
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        
        {/* SOLICITAÇÕES PENDENTES */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="w-4 h-4" /> Aguardando Atendimento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingRequests.length === 0 && (
              <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center bg-slate-50/50">
                <CheckCircle2 className="w-12 h-12 text-green-500/20 mb-4" />
                <p className="text-slate-400 font-bold italic">Nenhuma solicitação pendente. Tudo em ordem!</p>
              </Card>
            )}

            {pendingRequests.map((req) => (
              <Card key={req.id} className="group hover:shadow-2xl transition-all duration-300 border-l-4 border-l-amber-500">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-slate-100 text-slate-600 mb-2 uppercase text-[9px] font-black">{req.type}</Badge>
                      <h3 className="font-black text-xl text-slate-900 leading-tight">{req.sector}</h3>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                      <Truck className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    "{req.reason}"
                  </p>

                  <Button 
                    onClick={() => { setSelectedRequest(req); setOpenDeliver(true); }}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold transition-colors group"
                  >
                    Atender Pedido
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* HISTÓRICO RECENTE */}
        <section className="space-y-4 pt-8 border-t border-slate-200">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Entregas Recentes
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4">Setor</th>
                  <th className="px-6 py-4">Item Entregue</th>
                  <th className="px-6 py-4">Patrimônio</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {completedRequests.slice(0, 5).map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-700">{req.sector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{req.type}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-blue-600 border-blue-100 bg-blue-50">
                        {req.furniture?.patrimony || 'S/N'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-black text-[9px]">CONCLUÍDO</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL DE SELEÇÃO DE PATRIMÔNIO (O SEGREDO DO SUCESSO) */}
      <Dialog open={openDeliver} onOpenChange={setOpenDeliver}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Vincular Ativo</DialogTitle>
            <DialogDescription className="font-medium">
              Selecione qual <span className="text-blue-600">{selectedRequest?.type}</span> será enviada para o setor <span className="font-black text-slate-900">{selectedRequest?.sector}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Filtrar por patrimônio ou modelo..."
              />
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2">
              {inventory
                .filter(i => i.type === selectedRequest?.type && (i.status === 'NOVO' || i.status === 'USADO'))
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleDeliver(item.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div>
                      <p className="font-black text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Patrimônio: <span className="font-mono font-bold text-blue-600">{item.patrimony || 'Sem número'}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Badge variant="outline" className="text-[9px] font-bold">{item.status}</Badge>
                       <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                         <PackageSearch className="w-4 h-4" />
                       </div>
                    </div>
                  </button>
                ))
              }
              {inventory.filter(i => i.type === selectedRequest?.type && (i.status === 'NOVO' || i.status === 'USADO')).length === 0 && (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-red-600 font-bold text-sm">Atenção: Não há {selectedRequest?.type} disponíveis no momento!</p>
                  <p className="text-xs text-red-400 mt-1">Verifique o estoque ou a oficina de manutenção.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}