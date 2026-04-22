'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { 
  History, 
  Plus, 
  Package, 
  ChevronRight,
  Wrench,
  Layers,
  Check,
  BookOpen,
  AlertTriangle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty, CommandInput } from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function FurniturePage() {
  const [furnitureList, setFurnitureList] = useState<any[]>([])
  const [existingTypes, setExistingTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [openTypeSuggest, setOpenTypeSuggest] = useState(false)

  // Estados do Formulário
  const [name, setName] = useState('')
  const [type, setType] = useState('') 
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState('NOVO')
  const [location, setLocation] = useState('')
  
  // Estados para o MODO LOTE
  const [isBulk, setIsBulk] = useState(false)
  const [bulkPatrimonies, setBulkPatrimonies] = useState<string[]>([''])

  // Estados para o Modal de Manutenção
  const [maintenanceItem, setMaintenanceItem] = useState<any>(null)
  const [maintenanceQty, setMaintenanceQty] = useState('1')

  const fetchData = async () => {
    try {
      const [resFurn, resTypes] = await Promise.all([
        fetch('/api/furniture'),
        fetch('/api/furniture/types')
      ])
      setFurnitureList(await resFurn.json())
      setExistingTypes(await resTypes.json())
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleQuantityChange = (val: string) => {
    setQuantity(val)
    if (isBulk) {
      const num = parseInt(val) || 1
      const newPats = Array(num).fill('').map((_, i) => bulkPatrimonies[i] || '')
      setBulkPatrimonies(newPats)
    }
  }

  // NOVA LÓGICA DE MANUTENÇÃO (Disparada de dentro do Modal)
  const confirmMaintenance = async () => {
    if (!maintenanceItem) return

    toast.promise(
      fetch(`/api/furniture/${maintenanceItem.id}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'MANUTENCAO', 
          maintenanceQuantity: parseInt(maintenanceQty, 10) // Manda a quantidade escolhida pro back-end
        })
      }).then(async (res) => {
        if (!res.ok) throw new Error('Erro ao processar')
        return res.json()
      }),
      {
        loading: 'Enviando para a oficina...',
        success: () => { 
          setMaintenanceItem(null)
          fetchData() 
          return 'Estoque atualizado! Item em reparo. 🛠️' 
        },
        error: 'Ops! Falha ao atualizar manutenção.'
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!type.trim()) {
      return toast.error("O campo 'Tipo' é obrigatório!")
    }
    
    let payload;
    if (isBulk) {
      payload = bulkPatrimonies.map(p => ({
        name, type, status, location, patrimony: p
      }))
    } else {
      payload = { name, type, quantity, status, location, patrimony: bulkPatrimonies[0] }
    }
    
    toast.promise(
      fetch('/api/furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async (res) => {
        if (!res.ok) throw new Error('Erro ao salvar')
        return res.json()
      }),
      {
        loading: isBulk ? `Cadastrando lote de ${bulkPatrimonies.length}...` : 'Salvando no estoque...',
        success: () => {
          setName(''); setType(''); setQuantity('1'); setLocation(''); setBulkPatrimonies([''])
          fetchData()
          return 'Cadastro realizado! 🚀'
        },
        error: 'Ops! Falha ao cadastrar.'
      }
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Estoque</h1>
          <p className="text-slate-500 mt-1">Controle de ativos individuais, lotes e padronização.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA DE CADASTRO */}
        <div className="xl:col-span-1">
          <Card className="shadow-lg border-slate-200 sticky top-24">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" /> Cadastro
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="bulk-mode" className="text-[10px] font-bold uppercase text-slate-500 cursor-pointer">Modo Lote</Label>
                  <Switch 
                    id="bulk-mode" 
                    checked={isBulk} 
                    onCheckedChange={(val) => {
                      setIsBulk(val)
                      if (val) handleQuantityChange(quantity)
                    }} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* CAMPO TIPO */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo do Mobiliário</Label>
                    <Popover open={openTypeSuggest} onOpenChange={setOpenTypeSuggest}>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Sugestões
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-64" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar tipos..." className="h-8" />
                          <CommandList>
                            <CommandEmpty className="p-3 text-xs text-slate-500 italic">Nenhum tipo cadastrado ainda.</CommandEmpty>
                            <CommandGroup heading="Tipos em uso no IBCC">
                              {existingTypes.map((t) => (
                                <CommandItem 
                                  key={t} 
                                  onSelect={() => { setType(t); setOpenTypeSuggest(false) }}
                                  className="cursor-pointer"
                                >
                                  <Check className={`mr-2 h-3 w-3 ${type === t ? 'opacity-100' : 'opacity-0'}`} />
                                  {t}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input 
                    required 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    placeholder="Digite ou use as sugestões ao lado..." 
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Modelo</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cama Fawler Elétrica" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOVO">Novo</SelectItem>
                        <SelectItem value="USADO">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade</Label>
                    <Input type="number" min="1" required value={quantity} onChange={e => handleQuantityChange(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização Base</Label>
                  <Input required value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Almoxarifado Central" />
                </div>

                {/* PATRIMÔNIOS */}
                <div className="pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 mb-3">
                    <Layers className="w-3 h-3" />
                    {isBulk ? `Listar ${quantity} Patrimônios:` : 'Patrimônio (Opcional):'}
                  </Label>
                  <div className={`space-y-2 ${isBulk ? 'max-h-[160px] overflow-y-auto pr-2' : ''}`}>
                    {bulkPatrimonies.map((pat, idx) => (
                      <Input 
                        key={idx}
                        required={isBulk}
                        value={pat}
                        onChange={(e) => {
                          const n = [...bulkPatrimonies]; n[idx] = e.target.value; setBulkPatrimonies(n)
                        }}
                        placeholder={isBulk ? `Patrimônio ${idx + 1}` : "Ex: IBCC-1234"}
                        className="h-9 text-sm font-mono bg-slate-50/50"
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-lg h-12 transition-all active:scale-[0.98]">
                  {isBulk ? `Cadastrar ${quantity} Itens Individuais` : 'Salvar no Estoque'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DE LISTAGEM */}
        <div className="xl:col-span-2">
          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30 px-6">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Package className="w-5 h-5 text-slate-400" />
                  Inventário Ativo
                </CardTitle>
                <CardDescription>Visualização em tempo real do mobiliário.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-slate-400 py-24 text-center italic animate-pulse font-medium">Sincronizando com o banco de dados...</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold pl-6 py-4">Item / Tipo</TableHead>
                      <TableHead className="font-bold text-center">Patrimônio</TableHead>
                      <TableHead className="text-center font-bold">Qtd</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold pr-8">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {furnitureList.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                        <TableCell className="pl-6 py-4">
                          <div className="font-extrabold text-slate-900 leading-none mb-1">{item.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{item.type}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.patrimony ? (
                            <Badge variant="outline" className="font-mono text-slate-600 bg-white border-slate-200">
                              {item.patrimony}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300 italic">S/N</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-black text-slate-700">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Badge className={`
                            font-black text-[9px] uppercase px-2 py-0.5
                            ${item.status === 'NOVO' && 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200'}
                            ${item.status === 'USADO' && 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200'}
                            ${item.status === 'MANUTENCAO' && 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200'}
                          `} variant="outline">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/admin/furniture/${item.id}`}>
                              <Button variant="ghost" size="sm" title="Ver Histórico" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100">
                                <History className="w-4 h-4" />
                              </Button>
                            </Link>
                            {item.status !== 'MANUTENCAO' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Enviar para Reparo"
                                className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100"
                                onClick={() => {
                                  // Ao invés de disparar o update direto, abre o Modal e seta a qtd inicial como 1
                                  setMaintenanceItem(item)
                                  setMaintenanceQty('1')
                                }}
                              >
                                <Wrench className="w-4 h-4" />
                              </Button>
                            )}
                            <ChevronRight className="w-3 h-3 text-slate-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MODAL DE ENVIO PARA MANUTENÇÃO (NOVO) */}
      {/* ----------------------------------------------------------- */}
      <Dialog open={!!maintenanceItem} onOpenChange={(open) => !open && setMaintenanceItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-amber-600 flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Reparo de Estoque
            </DialogTitle>
            <DialogDescription className="font-medium">
              Movimentar <strong>{maintenanceItem?.name}</strong> para o status de Manutenção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Se tiver só 1 item ou for patrimoniado, não deixa escolher a quantidade, apenas avisa */}
            {maintenanceItem?.quantity === 1 || maintenanceItem?.patrimony ? (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-tight">
                  Este item será movido integralmente para manutenção.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quantidade a ser reparada
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max={maintenanceItem?.quantity} 
                    value={maintenanceQty} 
                    onChange={e => setMaintenanceQty(e.target.value)} 
                    className="font-bold text-center"
                  />
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                    de {maintenanceItem?.quantity} disponíveis
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setMaintenanceItem(null)}>Cancelar</Button>
            <Button onClick={confirmMaintenance} className="bg-amber-500 hover:bg-amber-600 font-bold text-white">
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}