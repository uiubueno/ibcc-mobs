'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Package2, 
  Send, 
  MapPin, 
  MessageSquare, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function RequestPage() {
  const [availableTypes, setAvailableTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedType, setSelectedType] = useState('')
  const [sector, setSector] = useState('')
  const [reason, setReason] = useState('')

  const fetchAvailable = async () => {
    try {
      const res = await fetch('/api/requests/available')
      const data = await res.json()
      setAvailableTypes(data)
    } catch (e) {
      toast.error("Erro ao carregar estoque disponível.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAvailable() }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return toast.error("Por favor, selecione um item no catálogo!")

    toast.promise(
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, sector, reason })
      }),
      {
        loading: 'Processando seu pedido...',
        success: () => {
          setSector(''); setReason(''); setSelectedType('');
          fetchAvailable();
          return 'Pedido enviado com sucesso! 🏥'
        },
        error: 'Erro ao enviar. Tente novamente.'
      }
    )
  }

  return (
    // Adicionado o efeito de animação no container principal
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="bg-slate-900 pt-12 pb-24 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package2 className="text-blue-500 w-8 h-8" />
              Solicitar Mobiliário
            </h1>
            <p className="text-slate-400 font-medium">Hotelaria IBCC Oncologia</p>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1 px-3 hidden sm:flex">
            Sincronizado em tempo real
          </Badge>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (COM SLIDE-UP SMOOTH) */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <form onSubmit={handleRequest} className="space-y-6">
          
          {/* PASSO 1: CATÁLOGO */}
          <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span>
                Selecione o que você precisa
              </h2>
              {selectedType && (
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-bounce">
                  Selecionado
                </span>
              )}
            </div>
            
            <CardContent className="p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />)
                ) : availableTypes.length === 0 ? (
                  <div className="col-span-full py-12 text-center">
                    <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Nenhum item disponível no momento.</p>
                  </div>
                ) : (
                  availableTypes.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedType(item.type)}
                      className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-300 active:scale-95 ${
                        selectedType === item.type 
                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'border-white bg-white hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {selectedType === item.type && (
                        <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-blue-600 animate-in zoom-in duration-300" />
                      )}
                      
                      <div className="flex flex-col h-full justify-between gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedType === item.type ? 'text-blue-600' : 'text-slate-400'}`}>
                          Mobiliário
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight mb-1">{item.type}</p>
                          <p className="text-xs text-slate-500">
                            <span className="font-black text-slate-900">{item.count}</span> disponíveis
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASSO 2: DETALHES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Onde entregar?</Label>
                </div>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    required 
                    value={sector} 
                    onChange={e => setSector(e.target.value)} 
                    placeholder="Ex: UTI Adulto - Leito 12" 
                    className="h-12 pl-10 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Qual o motivo?</Label>
                </div>
                <div className="relative group">
                  <MessageSquare className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    required 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="Ex: Admissão de urgência" 
                    className="h-12 pl-10 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BOTÃO DE AÇÃO FINAL */}
          <Button 
            type="submit" 
            disabled={!selectedType || loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            <Send className="w-5 h-5 mr-3" />
            FINALIZAR SOLICITAÇÃO
            <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
          </Button>
        </form>

        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          IBCC ONCOLOGIA • HOTELARIA SUPREMA 2.0
        </p>
      </div>
    </div>
  )
}