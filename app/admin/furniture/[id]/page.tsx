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
      <p className="text-slate-500 font-medium text-sm md:text-base">Rastreando patrimônio no banco de dados...</p>
    </div>
  )

  if (!item) return (
    <div className="p-8 text-center space-y-4">
      <p className="text-red-500 font-bold text-base md:text-lg">Item não encontrado ou erro na API.</p>
      <Link href="/admin/furniture" className="text-blue-600 font-bold underline text-sm">Voltar ao estoque</Link>
    </div>
  )

  // Função para definir ícone e cor por tipo de movimentação
  const getMovementStyle = (type: string) => {
    switch (type) {
      case 'ENTRADA': return { bg: 'bg-green-500', icon: <PlusCircle className="w-3 h-3 md:w-4 md:h-4" />, label: 'Entrada' }
      case 'SAIDA': return { bg: 'bg-red-500', icon: <MinusCircle className="w-3 h-3 md:w-4 md:h-4" />, label: 'Saída/Entrega' }
      case 'MANUTENCAO': return { bg: 'bg-amber-500', icon: <Wrench className="w-3 h-3 md:w-4 md:h-4" />, label: 'Manutenção' }
      default: return { bg: 'bg-blue-500', icon: <Box className="w-3 h-3 md:w-4 md:h-4" />, label: type }
    }
  }

  const movements = item.movements || []

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* BOTÃO VOLTAR */}
      <Link href="/admin/furniture" className="text-xs md:text-sm font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase tracking-tighter transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Voltar ao estoque
      </Link>

      {/* CABEÇALHO DO ITEM (Card Topo) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 md:p-8 rounded-2xl border shadow-lg shadow-slate-200/50">
        <div className="space-y-2 md:space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</h1>
          <div className="flex flex-wrap gap-2 md:gap-4 pt-1 md:pt-2">
            <span className="flex items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase gap-1 bg-slate-50 px-2 py-1 rounded-md">
              <Tag className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" /> {item.type}
            </span>
            <span className="flex items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase gap-1 bg-slate-50 px-2 py-1 rounded-md">
              <Box className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" /> Patrimônio: <span className="text-slate-900">{item.patrimony || 'S/N'}</span>
            </span>
            <span className="flex items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase gap-1 bg-slate-50 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" /> {item.location}
            </span>
          </div>
        </div>
        
        {/* Bloco de Saldo */}
        <div className="bg-slate-900 text-white p-3 md:p-4 rounded-xl text-center w-full sm:w-auto sm:min-w-[120px] shadow-md mt-2 sm:mt-0">
          <p className="text-[8px] md:text-[9px] font-black uppercase opacity-60 mb-0.5 md:mb-1 tracking-widest">Saldo Atual</p>
          <p className="text-xl md:text-2xl font-black">{item.quantity} <span className="text-[10px] md:text-xs">un</span></p>
        </div>
      </div>

      {/* LINHA DO TEMPO DE MOVIMENTAÇÕES (LOG REAL) */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50 p-4 md:px-8 md:py-6">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-800 font-black uppercase text-xs md:text-sm tracking-widest">
            <History className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-8">
          {movements.length === 0 ? (
            <div className="text-center py-12 md:py-16 space-y-2 md:space-y-3">
               <History className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto" />
               <p className="text-slate-400 italic font-medium text-xs md:text-sm">Nenhuma movimentação registrada para este ativo.</p>
            </div>
          ) : (
            // A linha vertical de fundo fica ancorada à esquerda no mobile (ml-4) e afasta no desktop (ml-5)
            <div className="relative space-y-6 md:space-y-10 before:absolute before:inset-0 before:ml-[19px] md:before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
              {movements.map((mov: any) => {
                const style = getMovementStyle(mov.type)
                return (
                  <div key={mov.id} className="relative flex items-start gap-3 md:gap-8 group">
                    
                    {/* Círculo da Linha do Tempo */}
                    <div className={`absolute left-0 mt-1 md:mt-1.5 w-10 h-10 rounded-full border-[3px] md:border-4 border-white shadow flex items-center justify-center text-white z-10 transition-transform group-hover:scale-110 ${style.bg} shrink-0`}>
                      {style.icon}
                    </div>
                    
                    {/* Conteúdo do Log */}
                    <div 
                      className="ml-12 md:ml-16 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 w-full hover:shadow-md transition-all border-l-4" 
                      style={{ borderLeftColor: mov.type === 'ENTRADA' ? '#22c55e' : mov.type === 'SAIDA' ? '#ef4444' : '#f59e0b' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2 md:mb-3">
                        <span className="font-black text-slate-800 uppercase text-[9px] md:text-[10px] tracking-widest leading-tight">{style.label}</span>
                        <Badge variant="outline" className="font-mono text-[10px] md:text-xs text-blue-700 bg-blue-50 border-blue-100 self-start sm:self-auto w-fit">
                          {mov.quantity > 0 && mov.type === 'ENTRADA' ? `+${mov.quantity}` : mov.quantity} itens
                        </Badge>
                      </div>
                      
                      <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed italic line-clamp-3 sm:line-clamp-none">
                        "{mov.description}"
                      </p>

                      <div className="mt-4 md:mt-5 pt-3 md:pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                        <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
                          Log de Auditoria
                        </span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 bg-slate-50 px-2 md:px-3 py-1 rounded-md md:rounded-full border border-slate-100 w-fit">
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
      
      {/* RODAPÉ */}
      <div className="text-center pb-4 pt-4">
        <p className="text-slate-300 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">
          Hotelaria • IBCC Oncologia
        </p>
      </div>

    </div>
  )
}