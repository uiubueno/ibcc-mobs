"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  PackagePlus,
  RefreshCcw,
  Search,
  Trash2,
  PackageOpen,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LoanCartItem {
  id: string;
  realId: string;
  name: string;
  patrimony?: string;
  quantity: number;
  maxStock: number;
}

export default function LoansPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loanedItems, setLoanedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);

  // Estados do Modal
  const [openLoanModal, setOpenLoanModal] = useState(false);
  const [cart, setCart] = useState<LoanCartItem[]>([]);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerSector, setBorrowerSector] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 

  // Busca e Paginação
  const [loanSearch, setLoanSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const fetchData = async () => {
    try {
      const res = await fetch("/api/furniture");
      const data = await res.json();
      setInventory(data);
      // Filtra apenas o que está emprestado com saldo ativo
      setLoanedItems(data.filter((i: any) => i.status === "EMPRESTADO" && i.quantity > 0));
    } catch (e) {
      toast.error("Erro ao buscar equipamentos.");
    } finally {
      // CORRIGIDO: Agora escrito corretamente com dois 'l' ✅
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [loanSearch]);

  const availableStock = inventory.filter(
    (i) => (i.status === "NOVO" || i.status === "USADO") && i.quantity > 0,
  );

  const filteredLoans = loanedItems.filter((item) => {
    const searchLower = loanSearch.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(searchLower);
    const originMatch = (item.location || "").toLowerCase().includes(searchLower);
    const borrowerMatch = (item.borrower || "").toLowerCase().includes(searchLower);
    const patrimonyMatch = (item.patrimony || "").toLowerCase().includes(searchLower);
    return nameMatch || originMatch || borrowerMatch || patrimonyMatch;
  });

  // Agrupamento por responsável
  const groupedLoansMap = filteredLoans.reduce((acc: any, item: any) => {
    const key = item.borrower || "Responsável Não Identificado";
    if (!acc[key]) {
      acc[key] = {
        borrower: key,
        sector: item.location || "Sem Setor",
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const groupedLoansArray = Object.values(groupedLoansMap) as any[];

  const totalPages = Math.ceil(groupedLoansArray.length / itemsPerPage) || 1;
  const currentLoanGroups = groupedLoansArray.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const loadImageProportional = (url: string): Promise<{ base64: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            base64: canvas.toDataURL('image/png'),
            width: img.width,
            height: img.height
          });
        } else {
          reject(new Error("Falha ao criar canvas context"));
        }
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const generatePDF = async (itemsToPrint: any[] = loanedItems, isIndividual = false) => {
    if (itemsToPrint.length === 0) {
      return toast.error("Não há itens para gerar relatório.");
    }

    const toastId = toast.loading("Gerando PDF, aguarde...");

    try {
      const doc = new jsPDF();
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const time = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
      const ibccPurple = [147, 51, 234] as [number, number, number];

      try {
        const logoData = await loadImageProportional("/logo-ibcc.png");
        const pdfWidth = 45; 
        const pdfHeight = (logoData.height * pdfWidth) / logoData.width;
        doc.addImage(logoData.base64, 'PNG', 14, 15, pdfWidth, pdfHeight);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        const headerTextY = 15 + pdfHeight + 10;
        doc.text("DEPARTAMENTO DE HOTELARIA", 14, headerTextY);
        doc.text(`Data de Emissão: ${date} às ${time}`, 196, headerTextY, { align: "right" });

        doc.setDrawColor(220);
        const lineY = headerTextY + 5;
        doc.line(14, lineY, 196, lineY);
        doc.setFontSize(16);
        doc.setTextColor(ibccPurple[0], ibccPurple[1], ibccPurple[2]);
        doc.setFont("helvetica", "bold");
        const titleY = lineY + 15;
        doc.text("TERMO DE RESPONSABILIDADE", 105, titleY, { align: "center" });
      } catch (err) {
        console.error("Erro no logo do PDF.", err);
      }

      const tableRows = itemsToPrint.map((item) => [
        item.quantity || 1, 
        item.name.replace("Empréstimo: ", ""),
        item.patrimony || "S/N",
        item.location || "Não informado",
      ]);

      autoTable(doc, {
        startY: 65,
        head: [["Qtd", "Descrição do Mobiliário", "Patrimônio", "Setor Destino"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: ibccPurple, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 9, cellPadding: 5, halign: "center" },
        columnStyles: {
          0: { halign: "center", cellWidth: 20 },
          1: { halign: "left" },
          2: { halign: "center", cellWidth: 35 },
          3: { halign: "center", cellWidth: 40 },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 35;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);

      doc.line(20, finalY, 80, finalY);
      doc.text("Hotelaria (Emissor)", 50, finalY + 5, { align: "center" });

      const borrowerNameLine = isIndividual && itemsToPrint[0].borrower ? itemsToPrint[0].borrower : "Solicitante / Responsável";
      doc.line(130, finalY, 190, finalY);
      doc.text(borrowerNameLine, 160, finalY + 5, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("IBCC Oncologia - Gestão de Ativos e Logística Hospitalar", 105, 285, { align: "center" });

      const fileName = isIndividual && itemsToPrint[0].borrower 
        ? `Termo_Emprestimo_${itemsToPrint[0].borrower.replace(/ /g, "_")}.pdf` 
        : `Termo_Emprestimos_Geral_${date.replace(/\//g, "-")}.pdf`;

      doc.save(fileName);
      toast.success("Relatório gerado com sucesso!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handlePrintByBorrower = (borrowerName: string) => {
    if (!borrowerName) return toast.error("Este item não possui responsável vinculado.");
    const borrowerItems = loanedItems.filter(item => item.borrower === borrowerName);
    generatePDF(borrowerItems, true);
  };

  const handleAddFromStock = (item: any) => {
    if (cart.some((c) => c.realId === item.id))
      return toast.error("Já está na lista de empréstimo.");
      
    const newItem: LoanCartItem = {
      id: Math.random().toString(36).substr(2, 9),
      realId: item.id,
      name: item.name,
      patrimony: item.patrimony,
      quantity: 1, 
      maxStock: item.quantity 
    };
    setCart([...cart, newItem]);
    toast.success("Item adicionado ao empréstimo!");
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQ = c.quantity + delta;
        if (newQ > 0 && newQ <= c.maxStock) {
          return { ...c, quantity: newQ };
        }
      }
      return c;
    }));
  };

  const handleDispatch = async () => {
    if (!borrowerName.trim() || !borrowerSector.trim()) {
      return toast.error("Preencha o setor e o nome do responsável pela retirada.");
    }

    toast.promise(
      (async () => {
        for (const item of cart) {
          const res = await fetch(`/api/furniture/${item.realId}/loan`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              borrowerName, 
              borrowerSector,
              quantity: item.quantity 
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erro ao registrar item.");
          }
        }
      })(),
      {
        loading: "Registrando empréstimos no sistema...",
        success: () => {
          setOpenLoanModal(false);
          setCart([]);
          setBorrowerName("");
          setBorrowerSector("");
          fetchData();
          return "Empréstimo registrado com sucesso! 🤝";
        },
        error: (err) => `Falha: ${err.message}`,
      },
    );
  };

const handleReturnGroup = async (groupItems: any[]) => {
    if (isReturning) return;
    setIsReturning(true);

    toast.promise(
      (async () => {
        for (const item of groupItems) {
          const res = await fetch(`/api/furniture/${item.id}/return-loan`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
          });
          if (!res.ok) {
            // Agora ele lê o erro exato que a API mandar
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Falha ao devolver um dos itens.");
          }
        }
      })(),
      {
        loading: "Processando devoluções no banco de dados...",
        success: () => {
          fetchData();
          setIsReturning(false);
          return "Todos os itens foram retornados ao estoque! ✅";
        },
        error: (err) => {
          setIsReturning(false);
          return `Erro: ${err.message}`;
        },
      },
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3">
            <RefreshCcw className="text-purple-500 w-6 h-6 md:w-8 md:h-8" /> Controle de Empréstimos
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 font-medium">
            Mobiliários cedidos temporariamente para outros setores.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
          <Button
            disabled={isReturning}
            onClick={() => generatePDF(loanedItems, false)}
            className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-black h-12 px-4 md:px-6 rounded-xl shadow-lg text-xs md:text-sm"
          >
            <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600" />
            RELATÓRIO GERAL
          </Button>

          <Button
            disabled={isReturning}
            onClick={() => setOpenLoanModal(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-black h-12 px-4 md:px-6 rounded-xl shadow-lg shadow-purple-900/20 text-xs md:text-sm"
          >
            <PackagePlus className="w-4 h-4 md:w-5 md:h-5 mr-2" /> NOVO EMPRÉSTIMO
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-3.5 md:top-4 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
        <Input
          placeholder="Pesquisar por nome, setor, patrimônio ou responsável..."
          value={loanSearch}
          onChange={(e) => setLoanSearch(e.target.value)}
          className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base bg-white shadow-sm border-2 rounded-xl md:rounded-2xl focus-visible:ring-purple-500"
        />
      </div>

      {/* LISTA UNIFICADA POR RESPONSÁVEL */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-400">
            <RefreshCcw className="w-6 h-6 md:w-8 md:h-8 animate-spin mb-4 text-purple-500" />
            <p className="font-bold text-sm md:text-base">Buscando registros...</p>
          </div>
        ) : groupedLoansArray.length === 0 ? (
          <Card className="border-dashed border-2 bg-purple-50/30">
            <CardContent className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-purple-200 mb-4" />
              <p className="text-purple-900/60 font-black text-sm md:text-lg uppercase tracking-widest">
                {loanSearch ? "Nenhum responsável encontrado" : "Nenhum empréstimo ativo"}
              </p>
            </CardContent>
          </Card>
        ) : (
          currentLoanGroups.map((group, idx) => (
            <Card key={idx} className="overflow-hidden border-2 border-purple-100 shadow-sm">
              <div className="bg-slate-50 border-b border-purple-100 p-4 md:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 text-white p-2.5 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 uppercase">
                      {group.borrower}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500">
                      <Building2 className="w-3.5 h-3.5" /> Setor: {group.sector}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    disabled={isReturning}
                    onClick={() => generatePDF(group.items, true)}
                    className="font-bold text-slate-600 hover:text-purple-700 hover:bg-purple-50 border-slate-200 h-10 w-full sm:w-auto text-xs"
                  >
                    <Printer className="w-4 h-4 mr-2" /> TERMO DO RESPONSÁVEL
                  </Button>
                  
                  <Button
                    disabled={isReturning}
                    onClick={() => handleReturnGroup(group.items)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 w-full sm:w-auto text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> 
                    {isReturning ? "DEVOLVENDO..." : `DEVOLVER TUDO (${group.items.length})`}
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item: any) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-slate-50/50 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-200 text-slate-700 font-black text-[10px] px-2 py-1 rounded">
                        {item.quantity || 1}x
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {item.name.replace("Empréstimo: ", "")}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                          Patrimônio: {item.patrimony || "S/N"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {!loading && groupedLoansArray.length > itemsPerPage && (
        <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1 || isReturning}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="font-bold border-slate-200 text-xs h-10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <span className="font-bold text-slate-500 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages || isReturning}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="font-bold border-slate-200 text-xs h-10"
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* MODAL: NOVO EMPRÉSTIMO */}
      <Dialog open={openLoanModal} onOpenChange={setOpenLoanModal}>
        <DialogContent className="!max-w-[1000px] w-[95vw] md:w-[90vw] bg-slate-50 p-0 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="p-4 md:p-6 lg:p-8 border-b border-slate-200 bg-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3 text-slate-900">
                <RefreshCcw className="text-purple-600 w-6 h-6 md:w-8 md:h-8" /> Ceder Material
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-1 text-xs md:text-base">
                Selecione os itens do estoque e indique o responsável pela retirada.
              </DialogDescription>
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 md:gap-8 max-h-[75vh] overflow-y-auto overflow-x-hidden">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 md:gap-3 text-slate-700">
                <PackageOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                <Label className="font-black text-[10px] md:text-sm uppercase tracking-widest">
                  Estoque Disponível
                </Label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-3.5 md:top-4 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
                <Input
                  placeholder="Buscar cadeira, maca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base bg-white shadow-sm rounded-xl border-slate-200"
                />
              </div>
              <div className="border-2 border-slate-200 rounded-xl md:rounded-2xl bg-white max-h-[300px] md:max-h-[400px] overflow-y-auto divide-y">
                {availableStock
                  .filter((i) =>
                      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (i.patrimony && i.patrimony.toLowerCase().includes(searchQuery.toLowerCase())),
                  )
                  .map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 md:p-4 hover:bg-slate-50 transition-colors gap-2 sm:gap-0">
                      <div>
                        <p className="font-bold text-slate-900 text-sm md:text-base truncate">{item.name}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase mt-0.5 md:mt-1">
                          Pat: {item.patrimony || "S/N"} • Estoque: {item.quantity}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddFromStock(item)}
                        className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 font-bold px-4 h-8 md:h-10 text-xs md:text-sm rounded-lg shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  ))}
                {availableStock.length === 0 && (
                  <div className="p-6 md:p-8 text-center text-slate-400 font-medium text-xs md:text-sm">
                    Nenhum item disponível no estoque.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col h-full min-h-[400px] lg:min-h-[500px]">
              <div className="space-y-4 mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="space-y-1.5">
                  <Label className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Setor de Destino</Label>
                  <Input placeholder="Ex: UTI Adulto" value={borrowerSector} onChange={(e) => setBorrowerSector(e.target.value)} className="h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Nome do Responsável</Label>
                  <Input placeholder="Ex: Enfermeira Joana" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} className="h-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-white/10 pb-3 md:pb-4 mb-4">
                <Label className="font-black text-white text-[10px] md:text-sm uppercase tracking-widest">Itens Selecionados</Label>
                <Badge className="bg-purple-500 text-white text-xs md:text-sm">{cart.length}</Badge>
              </div>

              <div className="space-y-2 md:space-y-3 flex-1 overflow-y-auto pr-1 md:pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-3 md:space-y-4 py-8">
                    <PackageOpen className="w-12 h-12 md:w-16 md:h-16" />
                    <p className="font-medium text-center text-xs md:text-base">A lista está vazia.<br />Adicione itens do estoque.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-black text-white text-sm truncate">{item.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate">Patrimônio: {item.patrimony || "S/N"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                          <button type="button" onClick={() => updateCartQuantity(item.id, -1)} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                          <span className="text-white font-bold text-xs md:text-sm w-4 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(item.id, 1)} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent" disabled={item.quantity >= item.maxStock}><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                        </div>
                        <button type="button" onClick={() => setCart(cart.filter((c) => c.id !== item.id))} className="text-white/30 hover:text-red-400 transition-colors p-2 bg-black/20 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-white/10">
                <Button onClick={handleDispatch} disabled={cart.length === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black h-12 md:h-14 rounded-xl text-xs md:text-sm shadow-xl disabled:opacity-50">CONFIRMAR EMPRÉSTIMO</Button>
                <Button variant="ghost" onClick={() => setOpenLoanModal(false)} className="w-full mt-2 md:mt-3 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs md:text-sm h-10 rounded-xl">CANCELAR</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
        IBCC ONCOLOGIA • HOTELARIA
      </p>
    </div>
  );
}