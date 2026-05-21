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
  Package2,
  MapPin,
  Trash2
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
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
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

  // NOVA AÇÃO: Apagar Registro
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este mobiliário? Esta ação não pode ser desfeita.")) return

    toast.promise(
      fetch(`/api/furniture/${id}`, {
        method: 'DELETE',
      }),
      {
        loading: 'Apagando registro...',
        success: () => {
          fetchData()
          return 'Mobiliário excluído com sucesso!'
        },
        error: 'Erro ao tentar apagar.'
      }
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER RESPONSIVO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-4 border-b pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Gestão de Estoque</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic mt-1">IBCC Oncologia • Controle de Patrimônio e Lotes</p>
        </div>
      </header>

      {/* GRID RESPONSIVO: Empilha no celular, divide em 3 colunas no desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* COLUNA 1: CADASTRO */}
        <div className="xl:col-span-1">
          <Card className="shadow-lg border-slate-200 xl:sticky xl:top-8">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs md:text-sm font-black flex items-center gap-2 uppercase">
                  <Plus className="w-4 h-4 text-blue-600" /> Novo Registro
                </CardTitle>
                <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <Label htmlFor="bulk-mode" className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Lote</Label>
                  <Switch id="bulk-mode" checked={isBulk} onCheckedChange={(val) => { setIsBulk(val); if (val) handleQuantityChange(quantity); }} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Tipo</Label>
                    <Popover open={openTypeSuggest} onOpenChange={setOpenTypeSuggest}>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Sugestões
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[90vw] md:w-64" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar tipos..." className="h-9 md:h-8 text-sm" />
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
                  <Input required value={type} onChange={e => setType(e.target.value)} placeholder="Ex: Cadeira, Maca..." className="h-10 md:h-9 text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Nome do Modelo</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Giratória Standard" className="h-10 md:h-9 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 md:h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOVO">Novo</SelectItem>
                        <SelectItem value="USADO">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Qtd</Label>
                    <Input type="number" min="1" required value={quantity} onChange={e => handleQuantityChange(e.target.value)} className="h-10 md:h-9 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Localização Base</Label>
                  <Input required value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Entreposto" className="h-10 md:h-9 text-sm" />
                </div>

                <div className="pt-2">
                  <Label className="text-[10px] md:text-xs font-black uppercase text-blue-600 flex items-center gap-1.5 mb-2">
                    <Layers className="w-3 h-3 md:w-4 md:h-4" /> Patrimônios
                  </Label>
                  <div className={`space-y-2 ${isBulk ? 'max-h-[150px] overflow-y-auto pr-2' : ''}`}>
                    {bulkPatrimonies.map((pat, idx) => (
                      <Input 
                        key={idx} 
                        required={isBulk} 
                        value={pat} 
                        onChange={(e) => { const n = [...bulkPatrimonies]; n[idx] = e.target.value; setBulkPatrimonies(n) }} 
                        placeholder="Patrimônio (Opcional)" 
                        className="h-10 md:h-8 text-xs font-mono bg-slate-50" 
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs md:text-sm h-12 md:h-10 mt-2">
                  Salvar no Estoque
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2: LISTAGEM COM BUSCA E PAGINAÇÃO */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          
          {/* BARRA DE PESQUISA */}
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-3 md:top-3.5 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <Input 
              placeholder="Procurar por modelo, patrimônio, tipo ou localização..." 
              className="pl-10 md:pl-12 h-10 md:h-12 bg-white border-slate-200 shadow-sm rounded-xl text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              
              {/* VISÃO DESKTOP (Tabela Completa) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase pl-6 py-4">Item / Localização</TableHead>
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
                        <TableRow key={`desk-${item.id}`} className="group hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {/* Localização e Tipo na mesma coluna */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.type}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <MapPin className="w-3 h-3" /> {item.location}
                                </span>
                              )}
                            </div>
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
                                title="Ajustar Saldo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" size="sm" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                onClick={() => { setMaintenanceItem(item); setMaintenanceQty('1'); }}
                                title="Enviar para Oficina"
                              >
                                <Wrench className="w-4 h-4" />
                              </Button>
                              <Link href={`/admin/furniture/${item.id}`} title="Ver Histórico">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                                  <History className="w-4 h-4" />
                                </Button>
                              </Link>
                              {/* NOVO BOTAO AQUI */}
                              <Button 
                                variant="ghost" size="sm" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(item.id)}
                                title="Apagar Registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* VISÃO MOBILE (Lista de Cards) */}
              <div className="md:hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="py-16 text-center text-slate-400 italic text-sm">Carregando inventário...</div>
                ) : paginatedItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 italic text-sm">Nenhum item encontrado.</div>
                ) : (
                  paginatedItems.map((item) => (
                    <div key={`mob-${item.id}`} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-base truncate">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-[9px] font-black uppercase bg-slate-100 text-slate-500">
                              {item.type}
                            </Badge>
                            {item.location && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400">
                                <MapPin className="w-3 h-3" /> {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`text-[9px] font-black uppercase shrink-0 ${item.status === 'NOVO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.status}
                          </Badge>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="Apagar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">QTD:</span>
                          <span className="font-black text-sm text-slate-700">{item.quantity}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[9px] bg-white text-slate-500">
                          PAT: {item.patrimony || 'S/N'}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-50">
                        <Button 
                          variant="ghost" 
                          className="flex-1 h-9 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100"
                          onClick={() => { setEditingItem(item); setEditQty(item.quantity); setOpenEdit(true); }}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" /> SALDO
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 h-9 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100"
                          onClick={() => { setMaintenanceItem(item); setMaintenanceQty('1'); }}
                        >
                          <Wrench className="w-3.5 h-3.5 mr-1.5" /> OFICINA
                        </Button>
                        <Link href={`/admin/furniture/${item.id}`} className="flex-1">
                          <Button variant="ghost" className="w-full h-9 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                            <History className="w-3.5 h-3.5 mr-1.5" /> LOG
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* PAGINAÇÃO RESPONSIVA */}
              <div className="p-3 md:p-4 bg-slate-50 border-t flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="flex gap-1.5 md:gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 md:h-9">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="h-8 md:h-9">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODAIS RESPONSIVOS --- */}

      {/* MODAL DE EDIÇÃO RÁPIDA DE QUANTIDADE */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl md:rounded-lg p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black uppercase text-center md:text-left">
              Ajustar Saldo: <br className="md:hidden" /> {editingItem?.name}
            </DialogTitle>
            <DialogDescription className="font-medium text-center md:text-left text-xs md:text-sm">
              O sistema registrará um log de alteração manual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 md:py-8 flex flex-col items-center gap-4 md:gap-6">
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1 md:mb-2">Saldo Atual</p>
               <h2 className="text-5xl md:text-7xl font-black text-blue-600">{editQty}</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <button onClick={() => setEditQty(q => Math.max(0, q - 1))} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">-</button>
               <Input type="number" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-16 md:w-20 text-center text-xl md:text-2xl font-black border-none focus:ring-0 bg-transparent" />
               <button onClick={() => setEditQty(q => q + 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl font-bold hover:bg-green-50 hover:text-green-600 transition-all shadow-sm">+</button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => setOpenEdit(false)} className="w-full sm:w-auto h-12 md:h-10 text-xs md:text-sm order-2 sm:order-1">Cancelar</Button>
            <Button onClick={handleEditSubmit} className="bg-blue-600 text-white font-black w-full sm:w-auto h-12 md:h-10 text-xs md:text-sm order-1 sm:order-2">SALVAR ALTERAÇÃO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE MANUTENÇÃO */}
      <Dialog open={!!maintenanceItem} onOpenChange={(open) => !open && setMaintenanceItem(null)}>
        <DialogContent className="max-w-sm w-[95vw] rounded-2xl md:rounded-lg p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black text-amber-600 uppercase flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Reparo de Estoque
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Label className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest text-center block">
              Qtd a enviar para a oficina
            </Label>
            <div className="flex items-center justify-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Input type="number" min="1" max={maintenanceItem?.quantity} value={maintenanceQty} onChange={e => setMaintenanceQty(e.target.value)} className="font-black text-center h-12 w-20 text-xl border-slate-200" />
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">de {maintenanceItem?.quantity} un</span>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button onClick={confirmMaintenance} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-12 md:h-10 text-xs md:text-sm rounded-xl md:rounded-md shadow-lg shadow-amber-500/20">
              CONFIRMAR ENVIO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
    </div>
  )
}