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
  AlertTriangle,
  Search,
  Edit3,
  ChevronLeft,
  Package2
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

  // Estados de Busca e Paginação
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Estados do Formulário de Cadastro
  const [name, setName] = useState('')
  const [type, setType] = useState('') 
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState('NOVO')
  const [location, setLocation] = useState('')
  const [isBulk, setIsBulk] = useState(false)
  const [bulkPatrimonies, setBulkPatrimonies] = useState<string[]>([''])

  // Estados para Edição Rápida de Quantidade
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editQty, setEditQty] = useState(0)
  const [openEdit, setOpenEdit] = useState(false)

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

  useEffect(() => { fetchData() }, [])

  // --- LÓGICA DE BUSCA E PAGINAÇÃO ---
  const filteredItems = furnitureList.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.patrimony && item.patrimony.toLowerCase().includes(search.toLowerCase())) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // --- AÇÕES ---
  const handleEditSubmit = async () => {
    toast.promise(
      fetch(`/api/furniture/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quantity: Number(editQty),
          location: editingItem.location,
          status: editingItem.status
        })
      }),
      {
        loading: 'Atualizando saldo no sistema...',
        success: () => {
          setOpenEdit(false)
          fetchData()
          return 'Saldo atualizado e log de estoque registrado!'
        },
        error: 'Erro ao atualizar quantidade.'
      }
    )
  }

  const handleQuantityChange = (val: string) => {
    setQuantity(val)
    if (isBulk) {
      const num = parseInt(val) || 1
      const newPats = Array(num).fill('').map((_, i) => bulkPatrimonies[i] || '')
      setBulkPatrimonies(newPats)
    }
  }

  const confirmMaintenance = async () => {
    if (!maintenanceItem) return
    toast.promise(
      fetch(`/api/furniture/${maintenanceItem.id}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'MANUTENCAO', 
          maintenanceQuantity: parseInt(maintenanceQty, 10)
        })
      }),
      {
        loading: 'Enviando para reparo...',
        success: () => { setMaintenanceItem(null); fetchData(); return 'Status atualizado!' },
        error: 'Falha na manutenção.'
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let payload = isBulk 
      ? bulkPatrimonies.map(p => ({ name, type, status, location, patrimony: p }))
      : { name, type, quantity, status, location, patrimony: bulkPatrimonies[0] }
    
    toast.promise(
      fetch('/api/furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
      {
        loading: 'Cadastrando...',
        success: () => {
          setName(''); setType(''); setQuantity('1'); setLocation(''); fetchData()
          return 'Cadastro realizado! 🚀'
        },
        error: 'Erro ao salvar.'
      }
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestão de Estoque</h1>
        <p className="text-slate-500 font-medium italic">IBCC Oncologia • Controle de Patrimônio e Lotes</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA 1: CADASTRO */}
        <div className="xl:col-span-1">
          <Card className="shadow-lg border-slate-200 sticky top-8">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase">
                  <Plus className="w-4 h-4 text-blue-600" /> Novo Registro
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="bulk-mode" className="text-[9px] font-black uppercase text-slate-400">Modo Lote</Label>
                  <Switch id="bulk-mode" checked={isBulk} onCheckedChange={(val) => { setIsBulk(val); if (val) handleQuantityChange(quantity); }} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Tipo</Label>
                    <Popover open={openTypeSuggest} onOpenChange={setOpenTypeSuggest}>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Sugestões
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-64" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar tipos..." className="h-8" />
                          <CommandList>
                            <CommandGroup heading="Em uso">
                              {existingTypes.map((t) => (
                                <CommandItem key={t} onSelect={() => { setType(t); setOpenTypeSuggest(false) }}>{t}</CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input required value={type} onChange={e => setType(e.target.value)} placeholder="Ex: Cadeira, Maca..." className="h-9" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Nome do Modelo</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Giratória Standard" className="h-9" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOVO">Novo</SelectItem>
                        <SelectItem value="USADO">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Qtd</Label>
                    <Input type="number" min="1" required value={quantity} onChange={e => handleQuantityChange(e.target.value)} className="h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Localização Base</Label>
                  <Input required value={location} onChange={e => setLocation(e.target.value)} placeholder="Almoxarifado" className="h-9" />
                </div>

                <div className="pt-2">
                  <Label className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1 mb-2">
                    <Layers className="w-3 h-3" /> Patrimônios
                  </Label>
                  <div className={`space-y-2 ${isBulk ? 'max-h-[120px] overflow-y-auto pr-2' : ''}`}>
                    {bulkPatrimonies.map((pat, idx) => (
                      <Input key={idx} required={isBulk} value={pat} onChange={(e) => { const n = [...bulkPatrimonies]; n[idx] = e.target.value; setBulkPatrimonies(n) }} placeholder="Patrimônio (Opcional)" className="h-8 text-xs font-mono bg-slate-50" />
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs h-10">
                  Salvar no Estoque
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2: LISTAGEM COM BUSCA E PAGINAÇÃO */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* BARRA DE PESQUISA */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Procurar por modelo, patrimônio ou tipo..." 
              className="pl-10 h-10 bg-white border-slate-200 shadow-sm rounded-xl"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase pl-6 py-4">Item / Tipo</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-center">Patrimônio</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-center">Qtd</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">Carregando inventário...</TableCell></TableRow>
                  ) : paginatedItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">Nenhum item encontrado.</TableCell></TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{item.type}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono text-[10px] bg-white text-slate-500">
                            {item.patrimony || 'S/N'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-black text-slate-700">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] font-black uppercase ${item.status === 'NOVO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => { setEditingItem(item); setEditQty(item.quantity); setOpenEdit(true); }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => { setMaintenanceItem(item); setMaintenanceQty('1'); }}
                            >
                              <Wrench className="w-4 h-4" />
                            </Button>
                            <Link href={`/admin/furniture/${item.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                                <History className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* PAGINAÇÃO */}
              <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO RÁPIDA DE QUANTIDADE */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Ajustar Saldo: {editingItem?.name}</DialogTitle>
            <DialogDescription className="font-medium">O sistema registrará um log de alteração manual.</DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center gap-6">
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Saldo Atual</p>
               <h2 className="text-7xl font-black text-blue-600">{editQty}</h2>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setEditQty(q => Math.max(0, q - 1))} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all">-</button>
               <Input type="number" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-20 text-center text-2xl font-black border-none focus:ring-0" />
               <button onClick={() => setEditQty(q => q + 1)} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold hover:bg-green-50 hover:text-green-600 transition-all">+</button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleEditSubmit} className="bg-blue-600 text-white font-black">SALVAR ALTERAÇÃO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE MANUTENÇÃO */}
      <Dialog open={!!maintenanceItem} onOpenChange={(open) => !open && setMaintenanceItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-amber-600 uppercase flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Reparo de Estoque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label className="text-[10px] font-black uppercase text-slate-400">Quantidade a enviar para a oficina</Label>
            <div className="flex items-center gap-4">
              <Input type="number" min="1" max={maintenanceItem?.quantity} value={maintenanceQty} onChange={e => setMaintenanceQty(e.target.value)} className="font-bold text-center h-12 text-xl" />
              <span className="text-xs font-bold text-slate-400">de {maintenanceItem?.quantity} un</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmMaintenance} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black">CONFIRMAR ENVIO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}