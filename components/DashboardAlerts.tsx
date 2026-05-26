'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // <--- O IMPORT QUE FALTAVA AQUI 🔥
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { AlertTriangle, Settings, CheckCircle2, Save } from 'lucide-react'
import { toast } from 'sonner'

export function DashboardAlerts({ stockByType, dbLimits }: { stockByType: any[], dbLimits: any[] }) {
  const router = useRouter()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [limitsConfig, setLimitsConfig] = useState<Record<string, number>>({})

  // Mescla os limites do banco de dados com os tipos de móveis que existem
  useEffect(() => {
    const initialConfig: Record<string, number> = {}
    stockByType.forEach(item => {
      // Procura no DB se já tem um limite salvo, senão usa 5 como padrão
      const dbLimit = dbLimits.find(l => l.type === item.type)
      initialConfig[item.type] = dbLimit ? dbLimit.minLimit : 5
    })
    setLimitsConfig(initialConfig)
  }, [stockByType, dbLimits])

  const saveConfiguration = async () => {
    const payload = Object.keys(limitsConfig).map(type => ({
      type,
      minLimit: limitsConfig[type]
    }))

    toast.promise(
      fetch('/api/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits: payload })
      }),
      {
        loading: 'Salvando no banco de dados...',
        success: () => {
          setIsConfigOpen(false)
          router.refresh() // Atualiza os dados da tela
          return 'Limites atualizados com sucesso!'
        },
        error: 'Erro ao salvar limites.'
      }
    )
  }

  const handleLimitChange = (type: string, value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0) {
      setLimitsConfig(prev => ({ ...prev, [type]: num }))
    }
  }

  // A mágica acontece aqui: filtramos cada item contra o seu limite específico!
  const lowStockItems = stockByType
    .filter(item => {
      const specificLimit = limitsConfig[item.type] !== undefined ? limitsConfig[item.type] : 5
      return (item._sum.quantity || 0) <= specificLimit
    })
    .sort((a, b) => (a._sum.quantity || 0) - (b._sum.quantity || 0))

  return (
    <>
      <Card className="border-red-100 shadow-sm overflow-hidden relative">
        <CardHeader className="bg-red-50/50 flex flex-row items-center justify-between py-4 border-b border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            <CardTitle className="text-sm md:text-base text-red-800">
              Alertas de Reposição Crítica
            </CardTitle>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors shadow-sm text-xs font-bold uppercase tracking-widest"
          >
            <Settings className="w-3.5 h-3.5" /> Ajustar Limites
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, idx) => {
                const limit = limitsConfig[item.type] !== undefined ? limitsConfig[item.type] : 5
                return (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 hover:bg-red-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <p className="font-bold text-slate-800 text-sm md:text-base">{item.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline-block">
                        Alerta ativado (≤ {limit})
                      </span>
                      <Badge variant="destructive" className="font-mono text-xs px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 border-none">
                        Estoque Atual: {item._sum.quantity}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-center">Estoque saudável. Nenhum item abaixo do limite configurado.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl md:rounded-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 md:p-6 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-slate-800 font-black">
              <Settings className="w-5 h-5 text-blue-500" /> Parâmetros de Alerta
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Defina a quantidade mínima aceitável no estoque para cada tipo de mobiliário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-slate-50/50">
            {stockByType.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <Label className="font-bold text-sm text-slate-700 truncate pr-4">
                  {item.type}
                </Label>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase text-slate-400">Mínimo:</span>
                  <Input 
                    type="number" 
                    min="0"
                    value={limitsConfig[item.type] !== undefined ? limitsConfig[item.type] : 5}
                    onChange={(e) => handleLimitChange(item.type, e.target.value)}
                    className="w-20 text-center font-bold"
                  />
                </div>
              </div>
            ))}
            {stockByType.length === 0 && (
              <p className="text-center text-slate-400 italic text-sm">Nenhum item cadastrado no estoque ainda.</p>
            )}
          </div>

          <DialogFooter className="p-4 md:p-6 border-t bg-white flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="w-full sm:w-auto font-bold">Cancelar</Button>
            <Button onClick={saveConfiguration} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-bold gap-2">
              <Save className="w-4 h-4" /> SALVAR LIMITES
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}