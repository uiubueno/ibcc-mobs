'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  ArrowRight,
  PackageSearch,
  XCircle,
  Settings2,
  ShoppingCart,
  MessageSquareWarning
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from "@/components/ui/dialog"

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [openTriage, setOpenTriage] = useState(false)
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({})

  const [selectedItemToDeliver, setSelectedItemToDeliver] = useState<any>(null)
  const [openDeliver, setOpenDeliver] = useState(false)

  // --- NOVOS ESTADOS PARA O MODAL DE RECUSA ---
  const [openRejectModal, setOpenRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [requestToReject, setRequestToReject] = useState<any>(null)

  const fetchData = async () => {
    try {
      const [resReq, resInv] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/furniture')
      ])
      const reqData = await resReq.json()
      const invData = await resInv.json()
      
      setRequests(Array.isArray(reqData) ? reqData : [])
      setInventory(Array.isArray(invData) ? invData : [])
    } catch (e) {
      toast.error("Erro ao carregar dados do painel.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openTriageModal = (req: any) => {
    setSelectedRequest(req)
    const initialStatuses: Record<string, string> = {}
    req.items?.forEach((item: any) => {
      initialStatuses[item.id] = 'EM_SEPARACAO' 
    })
    setItemStatuses(initialStatuses)
    setOpenTriage(true)
  }

  const handleUpdateItemStatus = (itemId: string, status: string) => {
    setItemStatuses(prev => ({ ...prev, [itemId]: status }))
  }

  const confirmTriage = async () => {
    toast.promise(
      (async () => {
        const res = await fetch(`/api/requests/${selectedRequest.id}/triage`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemStatuses }) 
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Falha na triagem')
        }
        return res.json()
      })(),
      {
        loading: 'Processando triagem e enviando e-mail...',
        success: () => {
          setOpenTriage(false)
          fetchData()
          return 'Triagem finalizada! O coordenador foi notificado.'
        },
        error: (err) => `Erro: ${err.message}`
      }
    )
  }

  // --- NOVA FUNÇÃO QUE ABRE O MODAL DE RECUSA ---
  const handleOpenRejectModal = (req: any) => {
    setRequestToReject(req)
    setRejectReason('') // Limpa a caixa de texto
    setOpenRejectModal(true)
  }

  // --- NOVA FUNÇÃO QUE ENVIA A RECUSA COM MOTIVO ---
  const confirmRejection = async () => {
    if (!rejectReason.trim()) {
      toast.error('Você precisa informar um motivo para a recusa.')
      return
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/requests/${requestToReject.id}`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'RECUSADO',
            rejectionReason: rejectReason 
          })
        })
        if (!res.ok) throw new Error('Erro ao recusar')
        return res.json()
      })(),
      {
        loading: 'Registrando recusa e notificando setor...',
        success: () => { 
          setOpenRejectModal(false)
          fetchData()
          return 'Pedido recusado com justificativa!' 
        },
        error: 'Erro ao recusar pedido.'
      }
    )
  }

  const handleDeliver = async (furnitureId: string) => {
    toast.promise(
      (async () => {
        const res = await fetch(`/api/requests/items/${selectedItemToDeliver.id}/deliver`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ furnitureId, status: 'ENTREGUE' }) 
        })
        if (!res.ok) throw new Error('Erro na entrega')
        return res.json()
      })(),
      {
        loading: 'Vinculando e atualizando estoque...',
        success: () => {
          setOpenDeliver(false)
          fetchData()
          return 'Item entregue com sucesso! 🚚'
        },
        error: (err) => `Erro: ${err.message}`
      }
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDENTE')
  
  const separationItems = requests.flatMap(req => 
    (req.items || []).filter((item: any) => item.status === 'EM_SEPARACAO')
      .map((item: any) => ({ ...item, sector: req.sector }))
  )

  const purchaseItems = requests.flatMap(req => 
    (req.items || []).filter((item: any) => item.status === 'EM_COMPRA')
      .map((item: any) => ({ ...item, sector: req.sector, requestId: req.id }))
  )
  
  const completedItems = requests.flatMap(req => 
    (req.items || []).filter((item: any) => item.status === 'ENTREGUE')
      .map((item: any) => ({ ...item, sector: req.sector }))
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Painel Hotelaria</h1>
          <p className="text-slate-500 font-medium italic mt-1">Gestão de Fluxo Hospitalar IBCC</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-amber-500 text-white py-2 px-4 rounded-lg font-bold shadow-md">
            {pendingRequests.length} NOVOS PEDIDOS
          </Badge>
          <Badge className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold shadow-md">
            {separationItems.length} P/ ENTREGAR
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        
        {/* PASSO 1: TRIAGEM */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Passo 1: Triagem de Pedidos
          </h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pendingRequests.length === 0 && (
              <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center bg-slate-50/50">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-slate-400 font-bold italic">Nenhum pedido novo no radar.</p>
              </Card>
            )}

            {pendingRequests.map((req) => (
              <Card key={req.id} className="group hover:shadow-xl transition-all border-l-8 border-l-amber-500 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-xl text-slate-900 uppercase">{req.sector}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Solicitante: {req.user?.name}</p>
                    </div>
                    <Badge className="bg-slate-900 text-white px-3 py-1">{req.items?.length || 0} ITENS NO CARRINHO</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {req.items?.map((item: any) => (
                      <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.quantity}x {item.type}</span>
                        <span className="text-[10px] text-slate-400 italic">"{item.reason}"</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {/* BOTÃO ALTERADO PARA ABRIR O MODAL NOVO */}
                    <Button onClick={() => handleOpenRejectModal(req)} variant="ghost" className="text-red-500 hover:bg-red-50 font-bold">
                      <XCircle className="w-4 h-4 mr-2" /> Recusar Tudo
                    </Button>
                    <Button onClick={() => openTriageModal(req)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black">
                      ANALISAR PEDIDO <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PASSO 2: SEPARAÇÃO */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-500" /> Passo 2: Fila de Separação (Estoque)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {separationItems.length === 0 && (
              <Card className="col-span-full border-dashed p-10 flex flex-col items-center justify-center bg-slate-50/50">
                <PackageSearch className="w-8 h-8 text-slate-200" />
                <p className="text-slate-400 font-bold italic text-xs">Nada para despachar no momento.</p>
              </Card>
            )}

            {separationItems.map((item: any) => (
              <Card key={item.id} className="border-l-4 border-l-blue-600 bg-white shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-blue-50 text-blue-700 mb-1 font-black text-[9px] uppercase border-blue-100">{item.sector}</Badge>
                      <h3 className="font-black text-lg text-slate-900">{item.quantity}x {item.type}</h3>
                    </div>
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <Button onClick={() => { setSelectedItemToDeliver(item); setOpenDeliver(true); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    VINCULAR PATRIMÔNIO
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PASSO 3: COMPRAS */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" /> Passo 3: Itens Aguardando Compra
          </h2>
          <Card className="border-2 border-amber-100 bg-amber-50/30 overflow-hidden shadow-sm">
            {purchaseItems.length === 0 ? (
              <p className="p-8 text-center text-slate-400 italic text-sm">Não há pendências de compra.</p>
            ) : (
              <div className="divide-y divide-amber-100">
                {purchaseItems.map((item: any) => (
                  <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{item.quantity}x {item.type}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">SETOR: {item.sector}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg"
                      onClick={async () => {
                         const res = await fetch(`/api/requests/${item.requestId}/triage`, {
                            method: 'PATCH',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ itemStatuses: { [item.id]: 'EM_SEPARACAO' } })
                         })
                         if (res.ok) {
                           fetchData()
                           toast.success("Item movido para Separação!")
                         }
                      }}
                    >
                      CHEGOU DA COMPRA
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* PASSO 4: HISTÓRICO */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Entregas Recentes
          </h2>
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Setor</th>
                  <th className="px-6 py-4">Mobiliário</th>
                  <th className="px-6 py-4">Patrimônio</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {completedItems.slice(0, 10).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.sector}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.quantity}x {item.type}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-100">
                        {item.furniture?.patrimony || 'S/N'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge className="bg-green-100 text-green-700 font-black text-[9px]">ENTREGUE</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      </div>

      {/* --- NOVO MODAL: JUSTIFICATIVA DE RECUSA --- */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent className="max-w-lg border-red-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-red-600 flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5" /> Recusar Solicitação
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-600 mt-2">
              Por favor, informe ao setor <span className="font-bold text-slate-900">{requestToReject?.sector}</span> o motivo da recusa deste pedido.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Justificativa Técnica
            </label>
            <Textarea 
              placeholder="Ex: Item fora do padrão do hospital, ou verba não aprovada..."
              className="min-h-[120px] resize-none focus-visible:ring-red-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setOpenRejectModal(false)} className="text-slate-500">
              CANCELAR
            </Button>
            <Button onClick={confirmRejection} className="bg-red-600 hover:bg-red-700 text-white font-black">
              CONFIRMAR RECUSA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TRIAGEM (MANTIDO) */}
      <Dialog open={openTriage} onOpenChange={setOpenTriage}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Análise de Itens</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              O coordenador será notificado por e-mail com a decisão final de cada item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {selectedRequest?.items?.map((item: any) => (
              <div key={item.id} className={`p-4 rounded-xl border-2 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors ${itemStatuses[item.id] === 'EM_SEPARACAO' ? 'bg-green-50 border-green-200' : itemStatuses[item.id] === 'EM_COMPRA' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex-1">
                  <p className="font-black text-slate-900 leading-tight">{item.quantity}x {item.type}</p>
                  <p className="text-[11px] text-slate-500 italic mt-1">Motivo: {item.reason}</p>
                </div>
                <div className="flex gap-1 bg-white p-1 rounded-xl border shadow-sm h-fit">
                  {['EM_SEPARACAO', 'EM_COMPRA', 'RECUSADO'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateItemStatus(item.id, st)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${itemStatuses[item.id] === st ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      {st === 'EM_SEPARACAO' ? 'ESTOQUE' : st === 'EM_COMPRA' ? 'COMPRAR' : 'RECUSAR'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setOpenTriage(false)}>CANCELAR</Button>
            <Button onClick={confirmTriage} className="bg-blue-600 text-white font-black px-8">FINALIZAR TRIAGEM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL VINCULAR PATRIMÔNIO (MANTIDO) */}
      <Dialog open={openDeliver} onOpenChange={setOpenDeliver}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Entrega de Ativo</DialogTitle>
            <DialogDescription className="font-medium">
              Escolha qual patrimônio de <span className="text-blue-600 font-bold">{selectedItemToDeliver?.type}</span> será despachado agora.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2">
              {inventory
                .filter(i => i.type === selectedItemToDeliver?.type && (i.status === 'NOVO' || i.status === 'USADO') && i.quantity > 0)
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleDeliver(item.id)}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-black text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Patrimônio: <span className="font-mono font-bold text-blue-600">{item.patrimony || 'S/N'}</span></p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase">{item.status}</Badge>
                  </button>
                ))
              }
              {inventory.filter(i => i.type === selectedItemToDeliver?.type && (i.status === 'NOVO' || i.status === 'USADO')).length === 0 && (
                <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-red-600 font-black text-sm uppercase">Estoque Esgotado!</p>
                  <p className="text-[10px] text-red-400 mt-1">Nenhum ativo disponível no momento.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}