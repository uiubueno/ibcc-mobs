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
  MapPin,
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Bed className="text-[#5481D7] w-8 h-8" /> Gestão de Enxoval
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Controle de travesseiros e distribuição IBCC.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setOpenAdjustModal(true)} className="bg-transparent border-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-black h-12 px-6 rounded-xl transition-all">
            <Settings2 className="w-5 h-5 mr-2" /> AJUSTAR
          </Button>
          <Button onClick={() => setOpenLossModal(true)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-500/20 font-black h-12 px-6 rounded-xl transition-all">
            <Trash2 className="w-5 h-5 mr-2" /> BAIXA/PERDA
          </Button>
          <Button onClick={() => setOpenTransferModal(true)} className="bg-[#5481D7] hover:bg-blue-600 text-white font-black h-12 px-6 rounded-xl shadow-lg transition-all">
            <ArrowRightLeft className="w-5 h-5 mr-2" /> DISTRIBUIR
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 text-slate-400"><RefreshCcw className="w-10 h-10 animate-spin mb-4" /><p className="font-bold">Sincronizando dados...</p></div>
      ) : (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <Card className={`border-2 shadow-sm bg-white overflow-hidden relative flex-1 transition-colors ${isLowStock ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                    <div className="absolute top-0 right-0 p-6 opacity-5"><PackageOpen className="w-32 h-32" /></div>
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-4 rounded-2xl ${isLowStock ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-700'}`}>
                            {isLowStock ? <AlertTriangle className="w-8 h-8" /> : <PackageOpen className="w-8 h-8" />}
                          </div>
                          <div>
                              <p className={`text-sm font-bold uppercase tracking-widest ${isLowStock ? 'text-red-600' : 'text-slate-500'}`}>Estoque</p>
                              {isLowStock && <Badge className="mt-1 bg-red-600 text-white border-none text-[10px]">ESTOQUE CRÍTICO</Badge>}
                          </div>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                          <span className={`text-6xl font-black ${isLowStock ? 'text-red-700' : 'text-slate-900'}`}>{estoquePulmao}</span>
                          <span className="text-xl font-bold text-slate-400">unds</span>
                        </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#5481D7]/20 shadow-sm bg-blue-50/50 overflow-hidden relative flex-1">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-[#5481D7] p-4 rounded-2xl shadow-inner text-white"><Activity className="w-8 h-8" /></div>
                          <div><p className="text-sm font-bold text-[#5481D7] uppercase tracking-widest">Em Circulação</p></div>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                          <span className="text-6xl font-black text-[#5481D7]">{rodandoHospital}</span>
                          <span className="text-xl font-bold text-[#5481D7]/60">unds</span>
                        </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3"><BarChart3 className="text-[#5481D7] w-6 h-6" /><h2 className="text-xl font-black text-slate-900">Demanda por Setor</h2></div>
                  </div>
                  <div className="w-full min-h-[250px] mt-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}><XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} /><Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/><Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#5481D7" /></BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3"><History className="text-[#5481D7] w-6 h-6" /><h2 className="text-xl font-black text-slate-900">Histórico de Movimentações</h2></div>
                  
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border min-w-[170px]"><CalendarDays className="w-5 h-5 text-[#5481D7]" /><div className="flex flex-col w-full"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">DE</span><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-0 shadow-none h-5 p-0 text-sm font-bold text-slate-700 bg-transparent" /></div></div>
                    <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border min-w-[170px]"><CalendarDays className="w-5 h-5 text-[#5481D7]" /><div className="flex flex-col w-full"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ATÉ</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-0 shadow-none h-5 p-0 text-sm font-bold text-slate-700 bg-transparent" /></div></div>
                    <Button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-[52px] px-6 rounded-xl shadow-lg shadow-emerald-100"><Download className="w-5 h-5 mr-2" /> EXPORTAR EXCEL</Button>
                    {(startDate || endDate || filterSector !== "TODOS") && (<Button variant="ghost" onClick={clearFilters} className="text-red-500 hover:text-red-600 h-[52px] px-6 rounded-xl font-bold transition-all"><FilterX className="w-5 h-5 mr-2" /> LIMPAR</Button>)}
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-16 text-slate-400"><ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-medium text-lg">Nenhum registro encontrado.</p></div>
                    ) : (
                      filteredHistory.map((log) => (
                        <div key={log.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-6">
                            <div className={`border-2 font-black w-14 h-14 rounded-xl flex items-center justify-center text-xl shadow-sm bg-white ${log.type === 'PERDA' ? 'border-red-500 text-red-500' : 'border-[#5481D7] text-[#5481D7]'}`}>{log.quantity}</div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">{log.type === 'PERDA' ? log.reason : log.destination}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><User className="w-4 h-4" /> {log.type === 'PERDA' ? 'Baixa definitiva do patrimônio' : `Solicitante: ${log.requester}`}</p>
                            </div>
                            </div>
                            <div className="text-right">
                            <Badge className={`font-bold mb-2 border-none ${log.type === 'PERDA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-[#5481D7]'}`}>{log.type}</Badge>
                            <p className="text-xs font-bold text-slate-400">{new Date(log.date).toLocaleString("pt-BR")}</p>
                            </div>
                        </div>
                      ))
                    )}
                </div>
            </div>
        </>
      )}

      {/* MODAL DISTRIBUIÇÃO */}
      <Dialog open={openTransferModal} onOpenChange={setOpenTransferModal}>
        <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden rounded-3xl">
          <div className="p-6 md:p-8 border-b bg-slate-50"><DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900"><ArrowRightLeft className="text-[#5481D7] w-6 h-6" /> Despachar Enxoval</DialogTitle><DialogDescription className="hidden">Distribuir travesseiros</DialogDescription></div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs">Quantidade *</Label><Input type="number" min="1" max={estoquePulmao} value={transferQty} onChange={(e) => setTransferQty(e.target.value)} className="h-14 text-xl font-bold bg-slate-50" /></div>
            <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs">Unidade de Destino *</Label><Select value={selectedLocation} onValueChange={setSelectedLocation}><SelectTrigger className="h-14 bg-slate-50"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger><SelectContent>{UNIDADES_IBCC.map(u => <SelectItem key={u} value={u} className="py-3">{u}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs">Quem solicitou (Opcional)</Label><Input placeholder="Nome da pessoa" value={requester} onChange={(e) => setRequester(e.target.value)} className="h-14 bg-slate-50" /></div>
            <Button onClick={handleTransfer} className="w-full bg-[#5481D7] hover:bg-blue-600 text-white font-black h-16 rounded-2xl text-lg shadow-xl mt-4">CONFIRMAR DISTRIBUIÇÃO</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL BAIXA / PERDA */}
      <Dialog open={openLossModal} onOpenChange={setOpenLossModal}>
        <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden rounded-3xl">
          <div className="p-6 md:p-8 border-b bg-red-50"><DialogTitle className="text-2xl font-black flex items-center gap-3 text-red-900"><Trash2 className="text-red-600 w-6 h-6" /> Registrar Baixa / Perda</DialogTitle><DialogDescription className="hidden">Retirada permanente de circulação</DialogDescription></div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs text-red-600">Quantidade Perdida *</Label><Input type="number" min="1" max={rodandoHospital} value={lossQty} onChange={(e) => setLossQty(e.target.value)} className="h-14 text-xl font-bold bg-red-50" /></div>
            <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs text-red-600">Motivo do Descarte *</Label><Select value={lossReason} onValueChange={setLossReason}><SelectTrigger className="h-14 bg-red-50"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger><SelectContent>{MOTIVOS_BAIXA.map(m => <SelectItem key={m} value={m} className="py-3">{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 items-center text-orange-800 text-xs font-bold leading-tight"><AlertTriangle className="w-5 h-5 shrink-0" /> ATENÇÃO: Esta ação é irreversível e reduz o estoque total em circulação.</div>
            <Button onClick={handleLoss} className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-red-100 mt-2">REGISTRAR BAIXA DEFINITIVA</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AJUSTE */}
      <Dialog open={openAdjustModal} onOpenChange={setOpenAdjustModal}>
        <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden rounded-3xl">
          <div className="p-6 md:p-8 border-b bg-orange-50"><DialogTitle className="text-2xl font-black flex items-center gap-3 text-orange-900"><Settings2 className="text-orange-500 w-6 h-6" /> Ajustar Configurações</DialogTitle><DialogDescription className="hidden">Ajuste manual dos saldos e alertas.</DialogDescription></div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs">Saldo Pulmão</Label><Input type="number" value={newPulmao} onChange={(e) => setNewPulmao(e.target.value)} className="h-14 text-xl font-bold bg-white" /></div>
              <div className="space-y-2"><Label className="font-bold text-slate-700 uppercase text-xs">Circulação</Label><Input type="number" value={newRodando} onChange={(e) => setNewRodando(e.target.value)} className="h-14 text-xl font-bold bg-white" /></div>
            </div>
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Label className="font-black text-[#5481D7] uppercase text-xs flex items-center gap-2 mb-2"><Layers className="w-4 h-4" /> Alerta de Estoque Mínimo</Label><Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} className="h-12 text-lg font-bold bg-white" /><p className="text-[10px] text-slate-400 mt-2">O card do Pulmão ficará vermelho quando o estoque for menor ou igual a este valor.</p></div>
            <Button onClick={handleManualAdjust} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-16 rounded-2xl text-lg shadow-lg shadow-orange-100">SALVAR CONFIGURAÇÕES</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}