'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, MapPin, Tag, Box, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FurnitureHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/furniture/${id}`)
      .then(res => res.json())
      .then(data => {
        setItem(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="p-8 text-center text-slate-500">Rastreando patrimônio...</div>
  if (!item) return <div className="p-8 text-center text-red-500">Item não encontrado.</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/admin/furniture" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Voltar ao estoque
      </Link>

      {/* Cabeçalho do Item */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center text-xs text-slate-500 gap-1"><Tag className="w-3 h-3" /> {item.type}</span>
            <span className="flex items-center text-xs text-slate-500 gap-1"><Box className="w-3 h-3" /> Patrimônio: {item.patrimony || 'S/N'}</span>
            <span className="flex items-center text-xs text-slate-500 gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
          </div>
        </div>
        <Badge className="text-lg px-4 py-1">{item.quantity} un em estoque</Badge>
      </div>

      {/* Linha do Tempo de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {item.requests.length === 0 ? (
            <p className="text-center py-8 text-slate-400 italic">Nenhuma movimentação registrada para este item.</p>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
              {item.requests.map((req: any) => (
                <div key={req.id} className="relative flex items-start gap-6 group">
                  {/* Círculo da Linha do Tempo */}
                  <div className={`absolute left-0 mt-1.5 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white
                    ${req.status === 'ENTREGUE' ? 'bg-green-500' : 'bg-blue-500'}`}>
                    <Box className="w-4 h-4" />
                  </div>
                  
                  <div className="ml-12 bg-slate-50 p-4 rounded-lg border border-slate-100 flex-grow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-slate-800">{req.sector}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">{req.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Solicitado por: <span className="font-medium">{req.user.name}</span></p>
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">"{req.reason}"</p>
                    <div className="mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                      {new Date(req.createdAt).toLocaleDateString('pt-BR')} às {new Date(req.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}