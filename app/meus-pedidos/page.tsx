'use client'

import { useState, useEffect } from 'react'
import { 
  Package2, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  CalendarDays,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShoppingBag,
  MapPin,
  User
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados do Modal de Rastreamento
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isTrackingOpen, setIsTrackingOpen] = useState(false)

  // Estados de Busca e Paginação
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await fetch('/api/requests')
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMyRequests()
  }, [])

  const filteredRequests = requests.filter(req => 
    req.id.toLowerCase().includes(search.toLowerCase()) ||
    req.sector.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  )

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return { 
          color: 'bg-amber-100 text-amber-700 border-amber-200', 
          icon: <Clock className="w-3 h-3 md:w-4 md:h-4" />, 
          text: 'Aguardando Análise',
          bar: 'bg-amber-400 w-1/3'
        }
      case 'EM_SEPARACAO':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          icon: <Truck className="w-3 h-3 md:w-4 md:h-4" />, 
          text: 'Em Separação',
          bar: 'bg-blue-500 w-2/3'
        }
      case 'EM_COMPRA':
        return { 
          color: 'bg-purple-100 text-purple-700 border-purple-200', 
          icon: <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />, 
          text: 'Em Compras',
          bar: 'bg-purple-500 w-2/3'
        }
      case 'ENTREGUE':
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          icon: <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />, 
          text: 'Entregue no Setor',
          bar: 'bg-green-500 w-full'
        }
      case 'RECUSADO':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: <XCircle className="w-3 h-3 md:w-4 md:h-4" />, 
          text: 'Solicitação Recusada',
          bar: 'bg-red-500 w-full'
        }
      default:
        return { color: 'bg-slate-100 text-slate-700', icon: <Info className="w-3 h-3 md:w-4 md:h-4" />, text: status, bar: 'bg-slate-300 w-0' }
    }
  }

  const generateTimeline = (req: any) => {
    if (!req) return []
    const isCompra = req.items?.some((i: any) => i.status === 'EM_COMPRA')
    
    const steps = [
      {
        title: "Pedido Recebido",
        description: "A solicitação chegou para a equipe de Hotelaria.",
        date: req.createdAt,
        completed: true,
        current: false,
        icon: FileText
      }
    ]

    if (req.status === 'RECUSADO') {
      steps.push({
        title: "Pedido Recusado",
        description: req.rejectionReason || "A solicitação foi negada pela coordenação.",
        date: req.updatedAt,
        completed: false,
        current: true,
        isError: true,
        icon: XCircle
      })
      return steps
    }

    const isTriagemDone = req.status !== 'PENDENTE'
    steps.push({
      title: isTriagemDone ? "Análise Concluída" : "Em Análise",
      description: isTriagemDone ? "Pedido aprovado e encaminhado." : "A Hotelaria está avaliando sua solicitação.",
      date: isTriagemDone ? req.updatedAt : null,
      completed: isTriagemDone,
      current: req.status === 'PENDENTE',
      icon: Clock
    })

    if (isTriagemDone) {
      const isSeparationDone = req.status === 'ENTREGUE'
      steps.push({
        title: isCompra ? "Aguardando Compras" : "Em Separação",
        description: isSeparationDone 
          ? "Itens preparados para o envio." 
          : (isCompra ? "Processo de aquisição em andamento." : "A equipe está separando os itens no estoque."),
        date: isSeparationDone ? null : req.updatedAt,
        completed: isSeparationDone,
        current: req.status === 'EM_SEPARACAO' || req.status === 'EM_COMPRA',
        icon: isCompra ? ShoppingBag : Truck
      })

      steps.push({
        title: "Entregue no Setor",
        description: isSeparationDone ? "O mobiliário foi entregue com sucesso!" : "Aguardando transporte até o local.",
        date: isSeparationDone ? req.updatedAt : null,
        completed: isSeparationDone,
        current: false,
        icon: MapPin
      })
    } else {
      steps.push({
        title: "Logística",
        description: "Separação ou aquisição dos itens.",
        date: null,
        completed: false,
        current: false,
        icon: Truck
      })
      steps.push({
        title: "Entrega",
        description: "Chegada do item ao setor.",
        date: null,
        completed: false,
        current: false,
        icon: MapPin
      })
    }

    return steps
  }

  const openTracking = (req: any) => {
    setSelectedRequest(req)
    setIsTrackingOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      
      {/* HEADER RESPONSIVO */}
      <div className="bg-slate-900 pt-8 pb-20 md:pt-12 md:pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
              <Package2 className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />
              Meus Pedidos
            </h1>
            <p className="text-slate-400 font-medium italic text-xs md:text-sm">IBCC Oncologia • Gestão de Mobiliário</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 md:left-4 top-3.5 w-4 h-4 md:w-5 md:h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Buscar por ID do pedido ou Setor..." 
              className="pl-10 md:pl-12 h-11 md:h-12 bg-white/10 border-white/10 text-white placeholder:text-slate-500 text-sm md:text-base rounded-xl md:rounded-2xl focus:bg-white focus:text-slate-900 transition-all shadow-xl md:shadow-2xl"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-8 md:-mt-10 space-y-4 md:space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-40 md:h-48 bg-white rounded-2xl md:rounded-3xl animate-pulse shadow-sm" />)
        ) : paginatedRequests.length === 0 ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 p-8 md:p-16 text-center bg-white rounded-2xl md:rounded-3xl">
            <div className="bg-slate-50 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Search className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
            </div>
            <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tight">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 mt-2 font-medium text-xs md:text-sm">Tente ajustar sua busca ou inicie uma nova solicitação.</p>
          </Card>
        ) : (
          <>
            {paginatedRequests.map((req) => {
              const display = getStatusDisplay(req.status)
              return (
                <Card 
                  key={req.id} 
                  onClick={() => openTracking(req)}
                  className="border-none shadow-xl shadow-slate-200/60 overflow-hidden hover:scale-[1.01] hover:shadow-2xl transition-all rounded-2xl md:rounded-3xl group cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                               Pedido #{req.id.slice(-5).toUpperCase()}
                             </span>
                          </div>
                          <h3 className="font-black text-lg md:text-2xl text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                            {req.sector}
                          </h3>
                        </div>
                        <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 font-black text-[9px] md:text-[10px] uppercase shadow-sm ${display.color}`}>
                          {display.icon}
                          {display.text}
                        </Badge>
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        {req.items?.map((item: any) => (
                          <div key={item.id} className="bg-slate-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-slate-100 font-black text-blue-600 text-xs shrink-0 shadow-sm">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs md:text-sm">{item.type}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic line-clamp-1">"{item.reason || 'Necessidade de setor'}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {format(new Date(req.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <span className="text-blue-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Ver rastreio <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 md:h-2 w-full bg-slate-100">
                      <div className={`h-full transition-all duration-1000 ease-in-out ${display.bar}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-md border border-slate-100 gap-3 sm:gap-0">
              <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="rounded-lg md:rounded-xl hover:bg-slate-100 text-xs md:text-sm"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mr-1" /> Anterior
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="rounded-lg md:rounded-xl hover:bg-slate-100 text-xs md:text-sm"
                >
                  Próxima <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
        IBCC ONCOLOGIA • HOTELARIA
      </p>

      {/* --- MODAL LADO A LADO (SPLIT VIEW NO DESKTOP) --- */}
      <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[1000px] md:h-[650px] rounded-3xl p-0 overflow-hidden bg-slate-50 shadow-2xl flex flex-col md:flex-row">
          
          {/* COLUNA ESQUERDA: Resumo do Pedido (35% da largura) */}
          <div className="bg-slate-900 p-6 md:p-10 text-white md:w-[35%] flex flex-col max-h-[40vh] md:max-h-full overflow-y-auto shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-black text-white text-left tracking-tight">Detalhes do Envio</DialogTitle>
              <DialogDescription className="sr-only">
                Acompanhe o status e a linha do tempo da sua solicitação.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="mt-6 space-y-4 flex flex-col h-full">
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Pedido #{selectedRequest.id.slice(-5).toUpperCase()}</p>
                  
                  {/* INFORMAÇÃO DO SOLICITANTE */}
                  <p className="text-sm font-medium mt-4 text-slate-400 flex items-center gap-1.5 mb-1">
                    <User className="w-4 h-4" /> Solicitante:
                  </p>
                  <span className="text-white font-bold text-base md:text-lg block mb-4">
                    {selectedRequest.user?.name || 'Usuário IBCC'}
                  </span>

                  {/* DESTINO */}
                  <p className="text-sm font-medium text-slate-400">Destino:<br/>
                    <span className="text-white font-black text-xl md:text-2xl tracking-tight leading-none mt-1 block">
                      {selectedRequest.sector}
                    </span>
                  </p>
                </div>
                
                <div className="pt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2 mb-3">Itens Solicitados</h4>
                  {selectedRequest.items?.map((item: any) => (
                    <div key={item.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                      <p className="font-bold text-slate-200 text-base">{item.quantity}x {item.type}</p>
                      <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed">
                        "{item.reason || 'Sem justificativa informada.'}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: Timeline (65% da largura) */}
          <div className="md:w-[65%] flex flex-col h-full bg-slate-50">
            <div className="p-6 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
              {/* LINHA CONECTORA CENTRALIZADA (Ajustada com -translate-x-px e left-7) */}
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-6 md:before:left-7 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {generateTimeline(selectedRequest).map((step, idx, array) => {
                  const Icon = step.icon
                  
                  let ringColor = "ring-slate-200 bg-white text-slate-300"
                  let textColor = "text-slate-400"
                  let titleColor = "text-slate-500"
                  
                  if (step.completed) {
                    ringColor = "ring-green-500 bg-green-500 text-white"
                    titleColor = "text-green-700"
                  } else if (step.current) {
                    ringColor = step.isError ? "ring-red-500 bg-red-100 text-red-500 ring-4" : "ring-blue-500 bg-blue-100 text-blue-600 ring-4 animate-pulse"
                    titleColor = step.isError ? "text-red-600" : "text-blue-700"
                    textColor = "text-slate-600"
                  }

                  return (
                    <div key={idx} className="relative flex items-start gap-4 md:gap-6">
                      {/* LINHA CONECTORA MANUAL AJUSTADA PARA O CENTRO DO ÍCONE */}
                      {idx !== array.length - 1 && (
                        <div className={`absolute left-6 md:left-7 top-12 md:top-14 bottom-[-32px] w-0.5 -translate-x-px z-0 ${step.completed ? 'bg-green-500' : 'bg-slate-200'}`} />
                      )}
                      
                      {/* ÍCONES MAIORES */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 shrink-0 shadow-sm ${ringColor}`}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      
                      <div className="flex flex-col min-w-0 pb-1 pt-1 md:pt-2">
                        {/* TÍTULOS E DESCRIÇÕES MAIORES */}
                        <h4 className={`text-base md:text-xl font-black ${titleColor}`}>{step.title}</h4>
                        <p className={`text-sm md:text-base mt-1.5 leading-relaxed font-medium ${textColor}`}>
                          {step.description}
                        </p>
                        {step.date && (
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mt-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(step.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 md:p-8 border-t bg-white shrink-0">
              <Button 
                onClick={() => setIsTrackingOpen(false)} 
                className="w-full font-black bg-slate-900 hover:bg-slate-800 text-white h-12 md:h-14 text-sm md:text-base rounded-xl"
              >
                FECHAR RASTREAMENTO
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}