'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaintenance = async () => {
    const res = await fetch('/api/furniture')
    const data = await res.json()
    // Filtra apenas o que está em manutenção
    setItems(data.filter((i: any) => i.status === 'MANUTENCAO'))
    setLoading(false)
  }

  useEffect(() => { fetchMaintenance() }, [])

  const handleReturn = async (id: string) => {
    toast.promise(
      fetch(`/api/furniture/${id}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'USADO' })
      }),
      {
        loading: 'Devolvendo item ao estoque ativo...',
        success: () => {
          fetchMaintenance()
          return 'Item reparado e disponível! ✅'
        },
        error: 'Erro ao processar retorno.'
      }
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="text-orange-500" /> Oficina de Reparos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie equipamentos fora de operação.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-center py-10 text-slate-400">Consultando oficina...</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4 opacity-20" />
              <p className="text-slate-500 font-medium">Tudo operacional! Nenhum item na oficina.</p>
            </CardContent>
          </Card>
        ) : (
          items.map(item => (
            <Card key={item.id} className="overflow-hidden border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <AlertTriangle className="text-orange-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500">Patrimônio: {item.patrimony || 'S/N'} • Local: {item.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right mr-4">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Status</p>
                      <Badge className="bg-orange-100 text-orange-700">EM REPARO</Badge>
                   </div>
                   <Button onClick={() => handleReturn(item.id)} className="bg-green-600 hover:bg-green-700 font-bold">
                     Concluir Conserto
                   </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}