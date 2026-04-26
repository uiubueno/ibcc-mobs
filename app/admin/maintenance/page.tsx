"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // <-- IMPORTAÇÃO CORRIGIDA AQUI
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wrench,
  CheckCircle,
  Truck,
  PackagePlus,
  RefreshCcw,
  Search,
  Plus,
  Trash2,
  XCircle,
  Building2,
  PackageOpen,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MaintenanceCartItem {
  id: string;
  isNew: boolean;
  realId?: string;
  name: string;
  originSector: string;
}

export default function MaintenancePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openSendModal, setOpenSendModal] = useState(false);
  const [cart, setCart] = useState<MaintenanceCartItem[]>([]);

  const [customOrigin, setCustomOrigin] = useState("");
  const [customName, setCustomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/furniture");
      const data = await res.json();
      setInventory(data);
      setMaintenanceItems(data.filter((i: any) => i.status === "MANUTENCAO"));
    } catch (e) {
      toast.error("Erro ao buscar equipamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableStock = inventory.filter(
    (i) => (i.status === "NOVO" || i.status === "USADO") && i.quantity > 0,
  );

  // --- FUNÇÃO PARA GERAR O PDF CORRIGIDA ---
  const generatePDF = () => {
    if (maintenanceItems.length === 0) {
      return toast.error("Não há itens em manutenção para gerar a guia.");
    }

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("pt-BR");

    // Cabeçalho
    doc.setFontSize(22);
    doc.setTextColor(20, 50, 100); // Azul Escuro
    doc.text("IBCC ONCOLOGIA", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("DEPARTAMENTO DE HOTELARIA", 14, 26);
    doc.text(`Data de Emissão: ${date}`, 196, 26, { align: "right" });

    // Título do Documento
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("GUIA DE REMESSA PARA MANUTENÇÃO EXTERNA", 105, 45, {
      align: "center",
    });

    // Informações
    doc.setFontSize(11);
    doc.text(`Destinatário: CORR Hospitalar`, 14, 58);
    doc.text(`Origem: Unidade Central - Hotelaria`, 14, 64);

    // Tabela de Itens
    const tableRows = maintenanceItems.map((item) => [
      item.name,
      item.patrimony === "CTRL-TEMP"
        ? "ITEM DE SETOR"
        : item.patrimony || "S/N",
      item.location || "Não informado",
      "01",
    ]);

    // Chamada corrigida do autoTable
    autoTable(doc, {
      startY: 75,
      head: [
        ["Descrição do Mobiliário", "Patrimônio", "Setor de Origem", "Qtd"],
      ],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;

    // Campos de Assinatura
    doc.setFontSize(9);
    doc.line(14, finalY, 70, finalY);
    doc.text("Hotelaria (Emissor)", 14, finalY + 5);

    doc.line(120, finalY, 186, finalY);
    doc.text("Segurança / Portaria", 120, finalY + 5);

    doc.line(67, finalY + 25, 133, finalY + 25);
    doc.text("Transportador (CORR Hospitalar)", 100, finalY + 30, {
      align: "center",
    });

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "IBCC Oncologia - Gestão de Ativos e Logística Hospitalar",
      105,
      285,
      { align: "center" },
    );

    // Baixar o arquivo
    doc.save(`Guia_Remessa_CORR_${date.replace(/\//g, "-")}.pdf`);
    toast.success("Guia de Remessa gerada com sucesso!");
  };

  const handleAddCustom = () => {
    if (!customOrigin.trim() || !customName.trim()) {
      return toast.error("Preencha o local e o nome do móvel.");
    }
    const newItem: MaintenanceCartItem = {
      id: Math.random().toString(36).substr(2, 9),
      isNew: true,
      name: customName.trim(),
      originSector: customOrigin.trim(),
    };
    setCart([...cart, newItem]);
    setCustomName("");
    toast.success("Item do setor adicionado!");
  };

  const handleAddFromStock = (item: any) => {
    if (cart.some((c) => c.realId === item.id))
      return toast.error("Já está na remessa.");
    const newItem: MaintenanceCartItem = {
      id: Math.random().toString(36).substr(2, 9),
      isNew: false,
      realId: item.id,
      name: item.name,
      originSector: item.location || "Sem Local",
    };
    setCart([...cart, newItem]);
    toast.success("Item do estoque adicionado!");
  };

  const handleDispatch = async () => {
    toast.promise(
      (async () => {
        for (const item of cart) {
          if (item.isNew) {
            const createRes = await fetch("/api/furniture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                type: item.name,
                quantity: 1,
                location: item.originSector,
                patrimony: "CTRL-TEMP",
              }),
            });

            if (createRes.ok) {
              const createdItem = await createRes.json();
              await fetch(`/api/furniture/${createdItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "MANUTENCAO" }),
              });
            }
          } else {
            await fetch(`/api/furniture/${item.realId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "MANUTENCAO" }),
            });
          }
        }
      })(),
      {
        loading: "Despachando remessa...",
        success: () => {
          setOpenSendModal(false);
          setCart([]);
          setCustomName("");
          setCustomOrigin("");
          fetchData();
          return "Caminhão despachado! 🚚";
        },
        error: "Erro ao despachar o lote.",
      },
    );
  };

  const handleReturnFromCorr = async (
    item: any,
    newStatus: "USADO" | "CONDENADO",
  ) => {
    const isTemporary = item.patrimony === "CTRL-TEMP";
    const method = isTemporary && newStatus === "USADO" ? "DELETE" : "PATCH";
    const body =
      method === "PATCH" ? JSON.stringify({ status: newStatus }) : null;

    toast.promise(
      fetch(`/api/furniture/${item.id}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: body,
      }),
      {
        loading: "Processando retorno...",
        success: () => {
          fetchData();
          return isTemporary && newStatus === "USADO"
            ? "Controle Finalizado (Removido do Pátio). ✅"
            : "Status atualizado com sucesso! ✅";
        },
        error: "Erro ao processar retorno.",
      },
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER DA TELA - ATUALIZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Wrench className="text-orange-500 w-8 h-8" /> Pátio da CORR
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Controle de mobiliários em manutenção externa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* BOTÃO GERAR GUIA - AGORA BRANCO BEM CHAMATIVO */}
          <Button
            onClick={generatePDF}
            className="bg-white text-slate-900 hover:bg-slate-100 font-black h-12 px-6 rounded-xl shadow-lg transition-all"
          >
            <Printer className="w-5 h-5 mr-2 text-blue-600" />
            GERAR GUIA PDF
          </Button>

          <Button
            onClick={() => setOpenSendModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black h-12 px-6 rounded-xl shadow-lg shadow-orange-900/20"
          >
            <PackagePlus className="w-5 h-5 mr-2" /> NOVA REMESSA
          </Button>
        </div>
      </div>

      {/* LISTA DE ITENS */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-400">
            <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
            <p className="font-bold">Consultando pátio...</p>
          </div>
        ) : maintenanceItems.length === 0 ? (
          <Card className="border-dashed border-2 bg-orange-50/30">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <CheckCircle className="w-16 h-16 text-orange-200 mb-4" />
              <p className="text-orange-900/60 font-black text-lg uppercase tracking-widest">
                Pátio Limpo
              </p>
            </CardContent>
          </Card>
        ) : (
          maintenanceItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-2 border-orange-100 shadow-sm relative group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 pt-8 gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 p-3 rounded-xl shrink-0 shadow-inner">
                    <Truck className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900">
                      {item.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase">
                        Origem: {item.location || "Não informada"}
                      </span>
                      {item.patrimony === "CTRL-TEMP" ? (
                        <Badge className="bg-slate-900 text-white text-[9px]">
                          ITEM DE SETOR
                        </Badge>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase">
                          Patrimônio: {item.patrimony || "S/N"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <Button
                    onClick={() => handleReturnFromCorr(item, "USADO")}
                    className="bg-green-600 hover:bg-green-700 font-bold h-10 w-full md:w-auto shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> DEVOLVER À ORIGEM
                  </Button>
                  <Button
                    onClick={() => handleReturnFromCorr(item, "CONDENADO")}
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 font-bold h-10 text-xs"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> CONDENAR
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MODAL GIGANTE: NOVA REMESSA */}
      <Dialog open={openSendModal} onOpenChange={setOpenSendModal}>
        <DialogContent className="!max-w-[1200px] !w-[95vw] bg-slate-50 p-0 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-200 bg-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                <Truck className="text-orange-500 w-8 h-8" /> Montar Remessa
                para CORR
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-1 text-base">
                Cadastre ou selecione os móveis que o caminhão está levando
                agora.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 max-h-[75vh] overflow-y-auto overflow-x-hidden">
            {/* COLUNA ESQUERDA */}
            <div className="space-y-8">
              <div className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border-2 border-blue-100 space-y-5">
                <div className="flex items-center gap-3 text-blue-800">
                  <Building2 className="w-6 h-6" />
                  <Label className="font-black text-sm uppercase tracking-widest">
                    Recolhido de Setor (Somente Controle)
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Local (Ex: Recepção)"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    className="h-14 text-base bg-white shadow-sm"
                  />
                  <Input
                    placeholder="Móvel (Ex: Sofá)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-14 text-base bg-white shadow-sm"
                  />
                </div>
                <Button
                  onClick={handleAddCustom}
                  className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" /> ADICIONAR À REMESSA
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <PackageOpen className="w-6 h-6" />
                  <Label className="font-black text-sm uppercase tracking-widest">
                    Puxar do Estoque IBCC
                  </Label>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                  <Input
                    placeholder="Pesquise por nome ou patrimônio no almoxarifado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-base bg-white shadow-sm"
                  />
                </div>
                <div className="border-2 border-slate-200 rounded-2xl bg-white max-h-[300px] overflow-y-auto divide-y">
                  {availableStock
                    .filter(
                      (i) =>
                        i.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        (i.patrimony &&
                          i.patrimony
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-base">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 font-bold uppercase mt-1">
                            Pat: {item.patrimony || "S/N"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddFromStock(item)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6"
                        >
                          Selecionar
                        </Button>
                      </div>
                    ))}
                  {availableStock.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      Nenhum item disponível no estoque.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col h-full min-h-[500px]">
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                <Label className="font-black text-white text-sm uppercase tracking-widest">
                  Itens no Caminhão
                </Label>
                <Badge className="bg-orange-500 text-white text-sm">
                  {cart.length}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                    <Truck className="w-16 h-16" />
                    <p className="font-medium text-center">
                      A remessa está vazia.
                      <br />
                      Adicione itens na lateral.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="font-black text-white text-base">
                          {item.name}
                        </p>
                        <p className="text-xs text-orange-400 font-bold uppercase mt-1">
                          Origem: {item.originSector}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setCart(cart.filter((c) => c.id !== item.id))
                        }
                        className="text-white/30 hover:text-red-400 transition-colors p-2 bg-black/20 rounded-xl"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <Button
                  onClick={handleDispatch}
                  disabled={cart.length === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-orange-900/40 disabled:opacity-50"
                >
                  FECHAR LOTE E DESPACHAR
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setOpenSendModal(false)}
                  className="w-full mt-3 text-slate-400 hover:text-white hover:bg-white/5 font-bold"
                >
                  CANCELAR REMESSA
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
