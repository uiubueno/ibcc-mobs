'use client'

import { useState, useEffect } from 'react'
import { 
  Package2, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  CalendarDays,
  Info
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await fetch('/api/requests')
        const data = await res.json()
        setRequests(data)
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMyRequests()
  }, [])

  // Função para renderizar o visual de cada status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return { 
          color: 'bg-amber-100 text-amber-700 border-amber-200', 
          icon: <Clock className="w-4 h-4" />, 
          text: 'Aguardando Análise',
          bar: 'bg-amber-400 w-1/3'
        }
      case 'EM_SEPARACAO':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          icon: <Truck className="w-4 h-4" />, 
          text: 'Aprovado & Em Separação',
          bar: 'bg-blue-500 w-2/3'
        }
      case 'ENTREGUE':
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          icon: <CheckCircle2 className="w-4 h-4" />, 
          text: 'Entregue no Setor',
          bar: 'bg-green-500 w-full'
        }
      case 'RECUSADO':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: <XCircle className="w-4 h-4" />, 
          text: 'Solicitação Recusada',
          bar: 'bg-red-500 w-full'
        }
      default:
        return { 
          color: 'bg-slate-100 text-slate-700', 
          icon: <Info className="w-4 h-4" />, 
          text: status,
          bar: 'bg-slate-300 w-0'
        }
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="bg-slate-900 pt-12 pb-24 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package2 className="text-blue-500 w-8 h-8" />
              Meus Pedidos
            </h1>
            <p className="text-slate-400 font-medium">Acompanhe suas solicitações de mobiliário</p>
          </div>
        </div>
      </div>

      {/* LISTA DE PEDIDOS */}
      <div className="max-w-3xl mx-auto px-6 -mt-12 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm" />)
        ) : requests.length === 0 ? (
          <Card className="border-dashed shadow-sm p-12 text-center bg-white">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">Você ainda não fez nenhum pedido</h3>
            <p className="text-slate-500 mt-1">Vá até a tela de solicitação para pedir um mobiliário.</p>
          </Card>
        ) : (
          requests.map((req) => {
            const display = getStatusDisplay(req.status)
            return (
              <Card key={req.id} className="border-none shadow-xl shadow-slate-200/50 overflow-hidden hover:scale-[1.01] transition-transform">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    {/* Cabeçalho do Card */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-xl text-slate-900">{req.type}</h3>
                          <Badge className="bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">x{req.quantity}</Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Destino: <span className="text-slate-700">{req.sector}</span></p>
                      </div>
                      <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 font-bold ${display.color}`}>
                        {display.icon}
                        {display.text}
                      </Badge>
                    </div>

                    {/* Motivo e Data */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo do Pedido</p>
                        <p className="text-sm text-slate-700 italic">"{req.reason}"</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 whitespace-nowrap">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(new Date(req.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso visual (tipo iFood/Mercado Livre) */}
                  <div className="h-1.5 w-full bg-slate-100">
                    <div className={`h-full transition-all duration-1000 ${display.bar}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}