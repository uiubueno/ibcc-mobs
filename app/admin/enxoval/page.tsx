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
  RefreshCcw,
  CalendarDays,
  FilterX,
  BarChart3,
  Trash2,
  Download,
  AlertTriangle,
  Layers
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
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

const MOTIVOS_BAIXA = [
  "Contaminação Biológica",
  "Desgaste Natural (Rasgado)",
  "Extravio / Sumiço"
];

interface MovementLog {
  id: string;
  date: string;
  quantity: number;
  destination: string;
  requester: string;
  type: "SAIDA" | "PERDA";
  reason?: string;
}

export default function EnxovalPage() {
  const [loading, setLoading] = useState(true);
  const [estoquePulmao, setEstoquePulmao] = useState(0);
  const [rodandoHospital, setRodandoHospital] = useState(0);
  const [minimumStock, setMinimumStock] = useState(20);
  const [history, setHistory] = useState<MovementLog[]>([]);

  // Estados dos Modais
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [openAdjustModal, setOpenAdjustModal] = useState(false);
  const [openLossModal, setOpenLossModal] = useState(false);

  // Estados dos Formulários
  const [transferQty, setTransferQty] = useState("1");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [requester, setRequester] = useState("");
  
  const [lossQty, setLossQty] = useState("1");
  const [lossReason, setLossReason] = useState("");

  const [newPulmao, setNewPulmao] = useState("0");
  const [newRodando, setNewRodando] = useState("0");
  const [newMinStock, setNewMinStock] = useState("20");

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
        setMinimumStock(data.inventory.minimumStock);
        setNewPulmao(data.inventory.stockLung.toString());
        setNewRodando(data.inventory.stockCirculating.toString());
        setNewMinStock(data.inventory.minimumStock.toString());
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
    if (!selectedLocation) return toast.error("Selecione a unidade de destino.");

    toast.promise(
      fetch("/api/enxoval", {
        method: "POST",
        body: JSON.stringify({
          action: "MOVE",
          quantity: qty,
          destination: selectedLocation,
          requester: requester.trim() || "Não informado"
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        fetchData();
        setOpenTransferModal(false);
        setTransferQty("1"); setSelectedLocation(""); setRequester("");
      }),
      { loading: "Registrando saída...", success: "Despachado!", error: "Erro ao salvar." }
    );
  };

  const handleLoss = async () => {
    const qty = parseInt(lossQty);
    if (isNaN(qty) || qty <= 0) return toast.error("Quantidade inválida.");
    if (qty > rodandoHospital) return toast.error("Quantidade maior que o estoque em uso!");
    if (!lossReason) return toast.error("Selecione o motivo da baixa.");

    toast.promise(
      fetch("/api/enxoval", {
        method: "POST",
        body: JSON.stringify({
          action: "LOSS",
          quantity: qty,
          reason: lossReason
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        fetchData();
        setOpenLossModal(false);
        setLossQty("1"); setLossReason("");
      }),
      { loading: "Registrando baixa...", success: "Baixa efetuada!", error: "Erro ao registrar perda." }
    );
  };

  const handleManualAdjust = async () => {
    toast.promise(
      fetch("/api/enxoval", {
        method: "POST",
        body: JSON.stringify({
          action: "ADJUST",
          stockLung: newPulmao,
          stockCirculating: newRodando,
          minimumStock: newMinStock
        })
      }).then(res => {
        if (!res.ok) throw new Error();
        fetchData();
        setOpenAdjustModal(false);
      }),
      { loading: "Sincronizando...", success: "Ajustado com sucesso!", error: "Erro no banco." }
    );
  };

  const exportToExcel = () => {
    const headers = ["Data", "Tipo", "Quantidade", "Destino/Motivo", "Solicitante"];
    const rows = filteredHistory.map(log => [
      new Date(log.date).toLocaleString("pt-BR"),
      log.type === "PERDA" ? "BAIXA/PERDA" : "DISTRIBUIÇÃO",
      log.quantity,
      log.type === "PERDA" ? log.reason : log.destination,
      log.requester || "-"
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_enxoval_ibcc_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório gerado com sucesso!");
  };

  const filteredHistory = history.filter((log) => {
    const matchSector = filterSector === "TODOS" || log.destination === filterSector;
    const logDateString = new Date(log.date).toISOString().split('T')[0];
    const matchStart = !startDate || logDateString >= startDate;
    const matchEnd = !endDate || logDateString <= endDate;
    return matchSector && matchStart && matchEnd;
  });

  const clearFilters = () => { setStartDate(""); setEndDate(""); setFilterSector("TODOS"); };

  const chartData = UNIDADES_IBCC.map(unidade => ({
    nome: unidade.replace(" andar", "").replace(" internação", " Int.").replace(" centro cirúrgico", " CC"),
    total: filteredHistory.filter(log => log.destination === unidade && log.type === "SAIDA").reduce((soma, log) => soma + log.quantity, 0)
  })).filter(item => item.total > 0);

  const isLowStock = estoquePulmao <= minimumStock;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3">
            <Bed className="text-[#5481D7] w-6 h-6 md:w-8 md:h-8" /> Gestão de Enxoval
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 font-medium">Controle de travesseiros e distribuição IBCC.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          <Button variant="outline" onClick={() => setOpenAdjustModal(true)} className="w-full sm:w-auto bg-transparent border-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl transition-all text-xs md:text-sm">
            <Settings2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> AJUSTAR
          </Button>
          <Button onClick={() => setOpenLossModal(true)} className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-500/20 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl transition-all text-xs md:text-sm">
            <Trash2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> BAIXA/PERDA
          </Button>
          <Button onClick={() => setOpenTransferModal(true)} className="w-full sm:w-auto bg-[#5481D7] hover:bg-blue-600 text-white font-black h-10 md:h-12 px-4 md:px-6 rounded-xl shadow-lg transition-all text-xs md:text-sm">
            <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> DISTRIBUIR
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 text-slate-400">
          <RefreshCcw className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
          <p className="font-bold text-sm md:text-base">Sincronizando dados...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                
                {/* CARDS DE RESUMO */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                  <Card className={`border-2 shadow-sm bg-white overflow-hidden relative flex-1 transition-colors ${isLowStock ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                    <div className="absolute top-0 right-0 p-4 md:p-6 opacity-5"><PackageOpen className="w-24 h-24 md:w-32 md:h-32" /></div>
                    <CardContent className="p-5 md:p-8">
                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isLowStock ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-700'}`}>
                            {isLowStock ? <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" /> : <PackageOpen className="w-6 h-6 md:w-8 md:h-8" />}
                          </div>
                          <div>
                              <p className={`text-xs md:text-sm font-bold uppercase tracking-widest ${isLowStock ? 'text-red-600' : 'text-slate-500'}`}>Estoque</p>
                              {isLowStock && <Badge className="mt-1 bg-red-600 text-white border-none text-[9px] md:text-[10px]">CRÍTICO</Badge>}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-6 flex items-baseline gap-1 md:gap-2">
                          <span className={`text-5xl md:text-6xl font-black ${isLowStock ? 'text-red-700' : 'text-slate-900'}`}>{estoquePulmao}</span>
                          <span className="text-lg md:text-xl font-bold text-slate-400">un</span>
                        </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#5481D7]/20 shadow-sm bg-blue-50/50 overflow-hidden relative flex-1">
                    <CardContent className="p-5 md:p-8">
                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                          <div className="bg-[#5481D7] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-inner text-white"><Activity className="w-6 h-6 md:w-8 md:h-8" /></div>
                          <div><p className="text-xs md:text-sm font-bold text-[#5481D7] uppercase tracking-widest">Em Circulação</p></div>
                        </div>
                        <div className="mt-4 md:mt-6 flex items-baseline gap-1 md:gap-2">
                          <span className="text-5xl md:text-6xl font-black text-[#5481D7]">{rodandoHospital}</span>
                          <span className="text-lg md:text-xl font-bold text-[#5481D7]/60">un</span>
                        </div>
                    </CardContent>
                  </Card>
                </div>

                {/* GRÁFICO */}
                <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-slate-100 pb-3 md:pb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <BarChart3 className="text-[#5481D7] w-5 h-5 md:w-6 md:h-6" />
                      <h2 className="text-lg md:text-xl font-black text-slate-900">Demanda por Setor</h2>
                    </div>
                  </div>
                  <div className="w-full min-h-[200px] md:min-h-[250px] mt-2 md:mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#5481D7" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>

            {/* HISTÓRICO E FILTROS */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 md:gap-6 mb-6 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
                  
                  <div className="flex items-center gap-2 md:gap-3">
                    <History className="text-[#5481D7] w-5 h-5 md:w-6 md:h-6" />
                    <h2 className="text-lg md:text-xl font-black text-slate-900">Histórico</h2>
                  </div>
                  
                  {/* Filtros Responsivos */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 md:gap-4 w-full lg:w-auto bg-slate-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-200">
                    <div className="flex-1 flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl border sm:min-w-[150px]">
                      <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-[#5481D7]" />
                      <div className="flex flex-col w-full">
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">DE</span>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-0 shadow-none h-4 md:h-5 p-0 text-xs md:text-sm font-bold text-slate-700 bg-transparent" />
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl border sm:min-w-[150px]">
                      <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-[#5481D7]" />
                      <div className="flex flex-col w-full">
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ATÉ</span>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-0 shadow-none h-4 md:h-5 p-0 text-xs md:text-sm font-bold text-slate-700 bg-transparent" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button onClick={exportToExcel} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 md:h-[52px] px-4 md:px-6 rounded-lg md:rounded-xl shadow-md text-xs md:text-sm">
                        <Download className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> EXCEL
                      </Button>
                      {(startDate || endDate || filterSector !== "TODOS") && (
                        <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto text-red-500 hover:text-red-600 h-10 md:h-[52px] px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-xs md:text-sm">
                          <FilterX className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> LIMPAR
                        </Button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Lista de Registros */}
                <div className="space-y-3 md:space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-12 md:py-16 text-slate-400">
                        <ClipboardList className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-20" />
                        <p className="font-medium text-sm md:text-lg">Nenhum registro encontrado.</p>
                      </div>
                    ) : (
                      filteredHistory.map((log) => (
                        <div key={log.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors gap-3 sm:gap-0">
                            
                            <div className="flex items-start sm:items-center gap-3 md:gap-6">
                              <div className={`border-2 font-black w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-xl shadow-sm bg-white shrink-0 ${log.type === 'PERDA' ? 'border-red-500 text-red-500' : 'border-[#5481D7] text-[#5481D7]'}`}>
                                {log.quantity}
                              </div>
                              <div className="min-w-0">
                                  <p className="font-bold text-slate-900 text-sm md:text-lg truncate">{log.type === 'PERDA' ? log.reason : log.destination}</p>
                                  <p className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 truncate">
                                    <User className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> 
                                    <span className="truncate">{log.type === 'PERDA' ? 'Baixa definitiva' : `Por: ${log.requester}`}</span>
                                  </p>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0 mt-1 sm:mt-0">
                              <Badge className={`font-bold border-none text-[9px] md:text-xs mb-0 sm:mb-2 ${log.type === 'PERDA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-[#5481D7]'}`}>
                                {log.type}
                              </Badge>
                              <p className="text-[10px] md:text-xs font-bold text-slate-400">
                                {new Date(log.date).toLocaleString("pt-BR", { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>

                        </div>
                      ))
                    )}
                </div>
            </div>
        </>
      )}

      {/* --- MODAIS RESPONSIVOS --- */}

      {/* MODAL DISTRIBUIÇÃO */}
      <Dialog open={openTransferModal} onOpenChange={setOpenTransferModal}>
        <DialogContent className="max-w-md w-[95vw] bg-white p-0 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="p-4 md:p-8 border-b bg-slate-50">
            <DialogTitle className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-3 text-slate-900">
              <ArrowRightLeft className="text-[#5481D7] w-5 h-5 md:w-6 md:h-6" /> Despachar Enxoval
            </DialogTitle>
            <DialogDescription className="hidden">Distribuir travesseiros</DialogDescription>
          </div>
          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs">Quantidade *</Label>
              <Input type="number" min="1" max={estoquePulmao} value={transferQty} onChange={(e) => setTransferQty(e.target.value)} className="h-12 md:h-14 text-lg md:text-xl font-bold bg-slate-50" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs">Unidade de Destino *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12 md:h-14 bg-slate-50 text-sm md:text-base">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_IBCC.map(u => <SelectItem key={u} value={u} className="py-2 md:py-3 text-sm md:text-base">{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs">Quem solicitou (Opc.)</Label>
              <Input placeholder="Nome da pessoa" value={requester} onChange={(e) => setRequester(e.target.value)} className="h-12 md:h-14 bg-slate-50 text-sm md:text-base" />
            </div>
            <Button onClick={handleTransfer} className="w-full bg-[#5481D7] hover:bg-blue-600 text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl text-sm md:text-lg shadow-xl mt-2 md:mt-4">
              CONFIRMAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL BAIXA / PERDA */}
      <Dialog open={openLossModal} onOpenChange={setOpenLossModal}>
        <DialogContent className="max-w-md w-[95vw] bg-white p-0 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="p-4 md:p-8 border-b bg-red-50">
            <DialogTitle className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-3 text-red-900">
              <Trash2 className="text-red-600 w-5 h-5 md:w-6 md:h-6" /> Registrar Baixa / Perda
            </DialogTitle>
            <DialogDescription className="hidden">Retirada permanente de circulação</DialogDescription>
          </div>
          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs text-red-600">Quantidade Perdida *</Label>
              <Input type="number" min="1" max={rodandoHospital} value={lossQty} onChange={(e) => setLossQty(e.target.value)} className="h-12 md:h-14 text-lg md:text-xl font-bold bg-red-50" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs text-red-600">Motivo *</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger className="h-12 md:h-14 bg-red-50 text-sm md:text-base">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_BAIXA.map(m => <SelectItem key={m} value={m} className="py-2 md:py-3 text-sm md:text-base">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 md:p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-2 md:gap-3 items-center text-orange-800 text-[10px] md:text-xs font-bold leading-tight">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> 
              ATENÇÃO: Ação irreversível. Reduz o estoque em circulação.
            </div>
            <Button onClick={handleLoss} className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl text-sm md:text-lg shadow-xl mt-2">
              REGISTRAR BAIXA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AJUSTE */}
      <Dialog open={openAdjustModal} onOpenChange={setOpenAdjustModal}>
        <DialogContent className="max-w-md w-[95vw] bg-white p-0 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="p-4 md:p-8 border-b bg-orange-50">
            <DialogTitle className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-3 text-orange-900">
              <Settings2 className="text-orange-500 w-5 h-5 md:w-6 md:h-6" /> Ajustar Configurações
            </DialogTitle>
            <DialogDescription className="hidden">Ajuste manual dos saldos e alertas.</DialogDescription>
          </div>
          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs">Pulmão</Label>
                <Input type="number" value={newPulmao} onChange={(e) => setNewPulmao(e.target.value)} className="h-12 md:h-14 text-lg md:text-xl font-bold bg-white" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="font-bold text-slate-700 uppercase text-[10px] md:text-xs">Circulação</Label>
                <Input type="number" value={newRodando} onChange={(e) => setNewRodando(e.target.value)} className="h-12 md:h-14 text-lg md:text-xl font-bold bg-white" />
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
              <Label className="font-black text-[#5481D7] uppercase text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Layers className="w-3 h-3 md:w-4 md:h-4" /> Estoque Mínimo
              </Label>
              <Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} className="h-10 md:h-12 text-base md:text-lg font-bold bg-white" />
              <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 md:mt-2">O card ficará vermelho quando o estoque for menor ou igual a este valor.</p>
            </div>
            <Button onClick={handleManualAdjust} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl text-sm md:text-lg shadow-lg shadow-orange-100 mt-2">
              SALVAR CONFIGURAÇÕES
            </Button>
          </div>
        </DialogContent>
      </Dialog>
              <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
    </div>
  );
}