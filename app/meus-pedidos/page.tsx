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
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
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

  // --- LÓGICA DE FILTRAGEM E PAGINAÇÃO ---
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
          text: 'Aprovado & Em Separação',
          bar: 'bg-blue-500 w-2/3'
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

          {/* BARRA DE BUSCA RESPONSIVA */}
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
                <Card key={req.id} className="border-none shadow-xl shadow-slate-200/60 overflow-hidden hover:scale-[1.01] transition-all rounded-2xl md:rounded-3xl group">
                  <CardContent className="p-0">
                    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                      
                      {/* TOPO DO CARD: Ajustado para quebrar no mobile, alinhado no desktop */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                               Pedido #{req.id.slice(-5).toUpperCase()}
                             </span>
                          </div>
                          <h3 className="font-black text-lg md:text-2xl text-slate-900 tracking-tight leading-tight">
                            {req.sector}
                          </h3>
                        </div>
                        <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 font-black text-[9px] md:text-[10px] uppercase shadow-sm ${display.color}`}>
                          {display.icon}
                          {display.text}
                        </Badge>
                      </div>

                      {/* ITENS DO PEDIDO */}
                      <div className="space-y-2 md:space-y-3">
                        {req.items?.map((item: any) => (
                          <div key={item.id} className="bg-slate-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-slate-100 font-black text-blue-600 text-xs shrink-0">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs md:text-sm">{item.type}</p>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic line-clamp-1">"{item.reason || 'Necessidade de setor'}"</p>
                              </div>
                            </div>
                            <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest self-end sm:self-auto pl-8 sm:pl-0">
                               {item.status.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* RODAPÉ DO CARD: Data e Hora */}
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-50">
                        <CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {format(new Date(req.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    {/* BARRA DE PROGRESSO NO RODAPÉ */}
                    <div className="h-1.5 md:h-2 w-full bg-slate-100">
                      <div className={`h-full transition-all duration-1000 ease-in-out ${display.bar}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* CONTROLES DE PAGINAÇÃO RESPONSIVOS */}
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

      <p className="text-center text-slate-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] mt-8 md:mt-12 pb-4">
        IBCC Oncologia • Setor de Hotelaria
      </p>
    </div>
  )
}