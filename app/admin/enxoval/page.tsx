"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bed,
  ArrowRightLeft,
  PackageOpen,
  Activity,
  User,
  History,
  ClipboardList,
  Settings2,
  Save,
  RefreshCcw,
  MapPin,
  CalendarDays,
  FilterX,
  BarChart3
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const UNIDADES_IBCC = [
  "1º andar TMO",
  "1º andar UTI TMO",
  "2º andar UTI",
  "2º andar internação",
  "3º andar internação",
  "4º andar internação",
  "5º andar centro cirúrgico"
];

interface MovementLog {
  id: string;
  date: string;
  quantity: number;
  destination: string;
  requester: string;
}

export default function EnxovalPage() {
  const [loading, setLoading] = useState(true);
  const [estoquePulmao, setEstoquePulmao] = useState(0);
  const [rodandoHospital, setRodandoHospital] = useState(0);
  const [history, setHistory] = useState<MovementLog[]>([]);

  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [openAdjustModal, setOpenAdjustModal] = useState(false);

  const [transferQty, setTransferQty] = useState("1");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [requester, setRequester] = useState("");
  const [newPulmao, setNewPulmao] = useState("0");
  const [newRodando, setNewRodando] = useState("0");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterSector, setFilterSector] = useState("TODOS");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/enxoval");
      const data = await res.json();
      if (data.inventory) {
        setEstoquePulmao(data.inventory.stockLung);
        setRodandoHospital(data.inventory.stockCirculating);
        setNewPulmao(data.inventory.stockLung.toString());
        setNewRodando(data.inventory.stockCirculating.toString());
      }
      if (data.movements) {
        setHistory(data.movements);
      }
    } catch (e) {
      toast.error("Erro ao carregar dados do banco.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTransfer = async () => {
    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) return toast.error("Quantidade inválida.");
    if (qty > estoquePulmao) return toast.error("Saldo insuficiente no pulmão!");
    
    if (!selectedLocation) {
      return toast.error("Selecione a unidade de destino.");
    }

    const finalRequester = requester.trim() || "Não informado";

    toast.promise(
      fetch("/api/enxoval", {
        method: "POST",
        body: JSON.stringify({
          action: "MOVE",
          quantity: qty,
          destination: selectedLocation,
          requester: finalRequester
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        fetchData();
        setOpenTransferModal(false);
        setTransferQty("1"); 
        setSelectedLocation(""); 
        setRequester("");
      }),
      {
        loading: "Registrando saída...",
        success: "Saída registrada com sucesso!",
        error: "Erro ao salvar movimentação."
      }
    );
  };

  const handleManualAdjust = async () => {
    toast.promise(
      fetch("/api/enxoval", {
        method: "POST",
        body: JSON.stringify({
          action: "ADJUST",
          stockLung: newPulmao,
          stockCirculating: newRodando
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        fetchData();
        setOpenAdjustModal(false);
      }),
      {
        loading: "Atualizando inventário...",
        success: "Inventário real atualizado!",
        error: "Erro ao atualizar estoque."
      }
    );
  };

  const filteredHistory = history.filter((log) => {
    const matchSector = filterSector === "TODOS" || log.destination === filterSector;
    
    const logDateString = new Date(log.date).toISOString().split('T')[0];
    let matchStartDate = true;
    let matchEndDate = true;

    if (startDate) {
      matchStartDate = logDateString >= startDate;
    }
    if (endDate) {
      matchEndDate = logDateString <= endDate;
    }

    return matchSector && matchStartDate && matchEndDate;
  });

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterSector("TODOS");
  };

  const chartData = UNIDADES_IBCC.map(unidade => {
    const totalDespachado = filteredHistory
      .filter(log => log.destination === unidade)
      .reduce((soma, log) => soma + log.quantity, 0);
    
    return {
      nome: unidade
        .replace(" andar", "")
        .replace(" internação", " Int.")
        .replace(" centro cirúrgico", " CC"),
      total: totalDespachado
    };
  }).filter(item => item.total > 0); 

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Bed className="text-[#5481D7] w-8 h-8" /> Gestão de Enxoval (Travesseiros)
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Controle de saldo e distribuição IBCC.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setOpenAdjustModal(true)}
            className="bg-transparent border-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-black h-12 px-6 rounded-xl transition-all"
          >
            <Settings2 className="w-5 h-5 mr-2" /> AJUSTAR TOTAIS
          </Button>
          <Button
            onClick={() => setOpenTransferModal(true)}
            className="bg-[#5481D7] hover:bg-blue-600 text-white font-black h-12 px-6 rounded-xl shadow-lg transition-all"
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" /> REGISTRAR SAÍDA
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 text-slate-400">
            <RefreshCcw className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">Sincronizando com o banco...</p>
        </div>
      ) : (
        <>
            {/* LINHA 1: INDICADORES E GRÁFICO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* BLOCO DA ESQUERDA: KPIs */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <Card className="border-2 border-slate-200 shadow-sm bg-white overflow-hidden relative flex-1">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><PackageOpen className="w-32 h-32 text-slate-900" /></div>
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-slate-100 p-4 rounded-2xl"><PackageOpen className="w-8 h-8 text-slate-700" /></div>
                          <div>
                              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Estoque</p>
                              <Badge variant="outline" className="mt-1 border-slate-300 text-slate-500">Reserva</Badge>
                          </div>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                          <span className="text-6xl font-black text-slate-900">{estoquePulmao}</span>
                          <span className="text-xl font-bold text-slate-400">unds</span>
                        </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#5481D7]/20 shadow-sm bg-blue-50/50 overflow-hidden relative flex-1">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Activity className="w-32 h-32 text-[#5481D7]" /></div>
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-[#5481D7] p-4 rounded-2xl shadow-inner"><Activity className="w-8 h-8 text-white" /></div>
                          <div>
                              <p className="text-sm font-bold text-[#5481D7] uppercase tracking-widest">Circulação</p>
                              <Badge className="mt-1 bg-[#5481D7]/10 text-[#5481D7] border-none">Nos Setores</Badge>
                          </div>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                          <span className="text-6xl font-black text-[#5481D7]">{rodandoHospital}</span>
                          <span className="text-xl font-bold text-[#5481D7]/60">unds</span>
                        </div>
                    </CardContent>
                  </Card>
                </div>

                {/* BLOCO DA DIREITA: GRÁFICO */}
                <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="text-[#5481D7] w-6 h-6" />
                      <h2 className="text-xl font-black text-slate-900">Demanda por Setor</h2>
                    </div>
                  </div>
                  
                  {chartData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium">Nenhum dado no período.</p>
                      <p className="text-sm">Ajuste os filtros para visualizar.</p>
                    </div>
                  ) : (
                    <div className="w-full min-h-[250px] mt-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis 
                            dataKey="nome" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#94a3b8' }} 
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#5481D7" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
            </div>

            {/* LINHA 2: HISTÓRICO COM FILTROS */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <History className="text-[#5481D7] w-6 h-6" />
                    <h2 className="text-xl font-black text-slate-900">Histórico de Saídas</h2>
                  </div>
                  
                  {/* NOVA ÁREA DE FILTROS: GRID RESPONSIVO E ELEGANTE */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    
                    {/* Filtro DE */}
                    <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 min-w-[200px]">
                      <CalendarDays className="w-5 h-5 text-[#5481D7]" />
                      <div className="flex flex-col w-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">A partir de</span>
                        <Input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="border-0 shadow-none focus-visible:ring-0 h-5 p-0 text-sm font-bold text-slate-700 bg-transparent w-full"
                        />
                      </div>
                    </div>

                    {/* Filtro ATÉ */}
                    <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 min-w-[200px]">
                      <CalendarDays className="w-5 h-5 text-[#5481D7]" />
                      <div className="flex flex-col w-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Até o dia</span>
                        <Input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="border-0 shadow-none focus-visible:ring-0 h-5 p-0 text-sm font-bold text-slate-700 bg-transparent w-full"
                        />
                      </div>
                    </div>

                    {/* Filtro SETOR */}
                    <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 min-w-[200px]">
                      <MapPin className="w-5 h-5 text-[#5481D7]" />
                      <div className="flex flex-col w-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unidade</span>
                        <Select value={filterSector} onValueChange={setFilterSector}>
                          <SelectTrigger className="border-0 shadow-none focus:ring-0 h-5 p-0 text-sm font-bold text-slate-700 bg-transparent w-full [&>span]:line-clamp-1">
                            <SelectValue placeholder="Todos os Setores" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODOS">Todos os Setores</SelectItem>
                            {UNIDADES_IBCC.map(u => (
                              <SelectItem key={`filter-${u}`} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botão Limpar */}
                    {(startDate || endDate || filterSector !== "TODOS") && (
                      <Button 
                        variant="ghost" 
                        onClick={clearFilters}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-[52px] px-6 rounded-xl font-bold border border-red-100 shrink-0 shadow-sm"
                        title="Limpar Filtros"
                      >
                        <FilterX className="w-5 h-5 mr-2" /> LIMPAR
                      </Button>
                    )}
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg">Nenhum registro encontrado.</p>
                    <p className="text-sm">Tente ajustar os filtros acima.</p>
                </div>
                ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {filteredHistory.map((log) => (
                    <div key={log.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-6">
                        <div className="bg-white border-2 border-[#5481D7] text-[#5481D7] font-black w-14 h-14 rounded-xl flex items-center justify-center text-xl shadow-sm">{log.quantity}</div>
                        <div>
                            <p className="font-bold text-slate-900 text-lg">{log.destination}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><User className="w-4 h-4" /> Solicitante: {log.requester}</p>
                        </div>
                        </div>
                        <div className="text-right">
                        <Badge className="bg-slate-200 text-slate-700 font-bold mb-2">SAÍDA</Badge>
                        <p className="text-xs font-bold text-slate-400">{new Date(log.date).toLocaleString("pt-BR")}</p>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </>
      )}

      {/* MODAL DE SAÍDA PADRONIZADO */}
      <Dialog open={openTransferModal} onOpenChange={setOpenTransferModal}>
        <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
              <ArrowRightLeft className="text-[#5481D7] w-6 h-6" /> Despachar Enxoval
            </DialogTitle>
            <DialogDescription className="hidden">
              Selecione a unidade de destino para o despacho.
            </DialogDescription>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-xs">Quantidade *</Label>
              <Input type="number" min="1" max={estoquePulmao} value={transferQty} onChange={(e) => setTransferQty(e.target.value)} className="h-14 text-xl font-bold bg-slate-50" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-xs flex items-center gap-2">
                <MapPin className="w-4 h-4"/> Unidade de Destino *
              </Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-14 bg-slate-50 text-base">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_IBCC.map((unidade) => (
                    <SelectItem key={unidade} value={unidade} className="py-3">
                      {unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-xs flex items-center gap-2">
                <User className="w-4 h-4"/> Quem solicitou (Opcional)
              </Label>
              <Input placeholder="Nome da pessoa" value={requester} onChange={(e) => setRequester(e.target.value)} className="h-14 bg-slate-50" />
            </div>
            
            <Button onClick={handleTransfer} className="w-full bg-[#5481D7] hover:bg-blue-600 text-white font-black h-16 rounded-2xl text-lg mt-4 shadow-xl">
              CONFIRMAR DESPACHO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AJUSTE */}
      <Dialog open={openAdjustModal} onOpenChange={setOpenAdjustModal}>
        <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-orange-50">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-orange-900">
              <Settings2 className="text-orange-500 w-6 h-6" /> Ajustar Inventário Real
            </DialogTitle>
            <DialogDescription className="hidden">Ajuste manual dos saldos.</DialogDescription>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-xs">Novo Saldo Pulmão</Label>
              <Input type="number" value={newPulmao} onChange={(e) => setNewPulmao(e.target.value)} className="h-14 text-xl font-bold bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-xs">Novo Saldo em Circulação</Label>
              <Input type="number" value={newRodando} onChange={(e) => setNewRodando(e.target.value)} className="h-14 text-xl font-bold bg-white" />
            </div>
            <Button onClick={handleManualAdjust} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-16 rounded-2xl text-lg">SALVAR NO BANCO</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}