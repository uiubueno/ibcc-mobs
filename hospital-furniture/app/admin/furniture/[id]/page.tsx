'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, MapPin, Tag, Box, ArrowLeft, PlusCircle, MinusCircle, Wrench } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function FurnitureHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/furniture/${id}`)
        
        // Se o servidor retornar erro (404, 405, 500), não tentamos ler o JSON
        if (!res.ok) {
          throw new Error('Falha ao carregar dados do servidor')
        }

        const data = await res.json()
        setItem(data)
      } catch (error) {
        console.error("Erro no rastreamento:", error)
        toast.error("Não foi possível carregar o histórico deste item.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) return (
    <div className="p-8 text-center space-y-4">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      <p className="text-slate-500 font-medium">Rastreando patrimônio no banco de dados...</p>
    </div>
  )

  if (!item) return (
    <div className="p-8 text-center space-y-4">
      <p className="text-red-500 font-bold text-lg">Item não encontrado ou erro na API.</p>
      <Link href="/admin/furniture" className="text-blue-600 underline text-sm">Voltar ao estoque</Link>
    </div>
  )

  // Função para definir ícone e cor por tipo de movimentação
  const getMovementStyle = (type: string) => {
    switch (type) {
      case 'ENTRADA': return { bg: 'bg-green-500', icon: <PlusCircle className="w-4 h-4" />, label: 'Entrada' }
      case 'SAIDA': return { bg: 'bg-red-500', icon: <MinusCircle className="w-4 h-4" />, label: 'Saída/Entrega' }
      case 'MANUTENCAO': return { bg: 'bg-amber-500', icon: <Wrench className="w-4 h-4" />, label: 'Manutenção' }
      default: return { bg: 'bg-blue-500', icon: <Box className="w-4 h-4" />, label: type }
    }
  }

  const movements = item.movements || []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/admin/furniture" className="text-sm font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase tracking-tighter transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao controle de estoque
      </Link>

      {/* Cabeçalho do Item */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border shadow-xl shadow-slate-200/50">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{item.name}</h1>
          <div className="flex flex-wrap gap-4 pt-2">
            <span className="flex items-center text-[10px] font-black text-slate-400 uppercase gap-1.5"><Tag className="w-3.5 h-3.5 text-blue-500" /> {item.type}</span>
            <span className="flex items-center text-[10px] font-black text-slate-400 uppercase gap-1.5"><Box className="w-3.5 h-3.5 text-blue-500" /> Patrimônio: <span className="text-slate-900">{item.patrimony || 'S/N'}</span></span>
            <span className="flex items-center text-[10px] font-black text-slate-400 uppercase gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {item.location}</span>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-xl text-center min-w-[120px]">
          <p className="text-[9px] font-black uppercase opacity-60 mb-1">Saldo Atual</p>
          <p className="text-2xl font-black">{item.quantity} <span className="text-xs">un</span></p>
        </div>
      </div>

      {/* Linha do Tempo de Movimentações (LOG REAL) */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
          <CardTitle className="flex items-center gap-3 text-slate-800 font-black uppercase text-sm tracking-widest">
            <History className="w-5 h-5 text-blue-600" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {movements.length === 0 ? (
            <div className="text-center py-16 space-y-3">
               <History className="w-12 h-12 text-slate-100 mx-auto" />
               <p className="text-slate-400 italic font-medium">Nenhuma movimentação registrada para este ativo.</p>
            </div>
          ) : (
            <div className="relative space-y-10 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
              {movements.map((mov: any) => {
                const style = getMovementStyle(mov.type)
                return (
                  <div key={mov.id} className="relative flex items-start gap-8 group">
                    {/* Círculo da Linha do Tempo */}
                    <div className={`absolute left-0 mt-1.5 w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white z-10 transition-transform group-hover:scale-110 ${style.bg}`}>
                      {style.icon}
                    </div>
                    
                    <div className="ml-12 bg-white p-6 rounded-2xl border border-slate-100 flex-grow hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: mov.type === 'ENTRADA' ? '#22c55e' : mov.type === 'SAIDA' ? '#ef4444' : '#f59e0b' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{style.label}</span>
                        <Badge variant="outline" className="font-mono text-xs text-blue-700 bg-blue-50 border-blue-100">
                          {mov.quantity > 0 && mov.type === 'ENTRADA' ? `+${mov.quantity}` : mov.quantity} itens
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        "{mov.description}"
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          Log de Auditoria
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          {new Date(mov.createdAt).toLocaleDateString('pt-BR')} às {new Date(mov.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center space-y-2">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
          Hotelaria • IBCC Oncologia
        </p>
      </div>
    </div>
  )
}