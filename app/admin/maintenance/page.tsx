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
  ChevronLeft,
  ChevronRight
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
  patrimony?: string;
  quantity: number;
}

export default function MaintenancePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Remessa
  const [openSendModal, setOpenSendModal] = useState(false);
  const [cart, setCart] = useState<MaintenanceCartItem[]>([]);
  const [customOrigin, setCustomOrigin] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPatrimony, setCustomPatrimony] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [searchQuery, setSearchQuery] = useState(""); 

  // Estados: Busca e Paginação do Pátio
  const [patioSearch, setPatioSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

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

  useEffect(() => {
    setCurrentPage(1);
  }, [patioSearch]);

  const availableStock = inventory.filter(
    (i) => (i.status === "NOVO" || i.status === "USADO") && i.quantity > 0,
  );

  const filteredPatio = maintenanceItems.filter((item) => {
    const searchLower = patioSearch.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(searchLower);
    const originMatch = (item.location || "").toLowerCase().includes(searchLower);
    const patrimonyMatch = (item.patrimony || "").toLowerCase().includes(searchLower);
    return nameMatch || originMatch || patrimonyMatch;
  });

  const totalPages = Math.ceil(filteredPatio.length / itemsPerPage) || 1;
  const currentPatioItems = filteredPatio.slice(
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

  const generatePDF = async () => {
    if (maintenanceItems.length === 0) {
      return toast.error("Não há itens em manutenção para gerar a guia.");
    }

    const toastId = toast.loading("Gerando PDF, aguarde...");

    try {
      const doc = new jsPDF();
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const time = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

      const ibccBlue = [84, 129, 215] as [number, number, number];

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
        doc.setTextColor(ibccBlue[0], ibccBlue[1], ibccBlue[2]);
        doc.setFont("helvetica", "bold");
        const titleY = lineY + 15;
        doc.text("GUIA DE REMESSA PARA MANUTENÇÃO EXTERNA", 105, titleY, {
          align: "center",
        });

        doc.setFontSize(11);
        doc.setTextColor(0);
        const destinatarrioY = titleY + 15;
        doc.setFont("helvetica", "bold");
        doc.text(`Destinatário:`, 14, destinatarrioY);
        doc.setFont("helvetica", "normal");
        doc.text(`CORR Hospitalar`, 42, destinatarrioY);

        const origemY = destinatarrioY + 8;
        doc.setFont("helvetica", "bold");
        doc.text(`Origem:`, 14, origemY);
        doc.setFont("helvetica", "normal");
        doc.text(`Hotelaria`, 42, origemY);

        const tableStartY = origemY + 15;

        const tableRows = maintenanceItems.map((item) => [
          item.name,
          item.patrimony
            ? item.patrimony.replace(" [CTRL]", "").replace("CTRL-TEMP", "S/N")
            : "S/N",
          item.location || "Não informado",
          item.quantity ? String(item.quantity).padStart(2, "0") : "01",
        ]);

        autoTable(doc, {
          startY: tableStartY,
          head: [
            ["Descrição do Mobiliário", "Patrimônio", "Setor de Origem", "Qtd"],
          ],
          body: tableRows,
          theme: "grid",
          headStyles: {
            fillColor: ibccBlue,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
          styles: { fontSize: 9, cellPadding: 5, halign: "center" },
          columnStyles: {
            0: { halign: "left", cellWidth: 70 },
            1: { halign: "left" },
            2: { halign: "left" },
            3: { halign: "center", cellWidth: 20 },
          },
        });

      } catch (err) {
        console.error("Erro no logo do PDF.", err);
      }

      const finalY = (doc as any).lastAutoTable.finalY + 35;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);

      doc.line(14, finalY, 70, finalY);
      doc.text("Hotelaria (Emissor)", 14, finalY + 5);

      doc.line(120, finalY, 186, finalY);
      doc.text("Segurança / Portaria", 120, finalY + 5);

      const motoristaY = finalY + 25;
      doc.line(67, motoristaY, 133, motoristaY);
      doc.text("Transportador (CORR Hospitalar)", 100, motoristaY + 5, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        "IBCC Oncologia - Gestão de Ativos e Logística Hospitalar",
        105,
        285,
        { align: "center" },
      );

      doc.save(`Guia_Remessa_CORR_${date.replace(/\//g, "-")}.pdf`);
      toast.success("Guia de Remessa gerada com sucesso!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao gerar PDF.", { id: toastId });
      console.error(error);
    }
  };

  const handleAddCustom = () => {
    if (!customOrigin.trim() || !customName.trim()) {
      return toast.error("Preencha o local e o nome do móvel.");
    }
    const qty = customPatrimony.trim() !== "" ? 1 : (parseInt(customQty) || 1);
    const newItem: MaintenanceCartItem = {
      id: Math.random().toString(36).substr(2, 9),
      isNew: true,
      name: customName.trim(),
      originSector: customOrigin.trim(),
      patrimony: customPatrimony.trim(),
      quantity: qty,
    };
    setCart([...cart, newItem]);
    setCustomName("");
    setCustomPatrimony("");
    setCustomQty("1");
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
      patrimony: item.patrimony,
      quantity: 1,
    };
    setCart([...cart, newItem]);
    toast.success("Item do estoque adicionado!");
  };

  const handleDispatch = async () => {
    toast.promise(
      (async () => {
        for (const item of cart) {
          if (item.isNew) {
            const secretPatrimony = `${item.patrimony || "S/N"} [CTRL]`;
            const createRes = await fetch("/api/furniture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                type: item.name,
                quantity: item.quantity,
                location: item.originSector,
                patrimony: secretPatrimony,
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
          setCustomPatrimony("");
          setCustomQty("1");
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
    const isTemporary = item.patrimony && item.patrimony.includes("[CTRL]");
    const method = isTemporary && newStatus === "USADO" ? "DELETE" : "PATCH";
    const body = method === "PATCH" ? JSON.stringify({ status: newStatus }) : null;

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER DA TELA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3">
            <Wrench className="text-orange-500 w-6 h-6 md:w-8 md:h-8" /> Pátio da CORR
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 font-medium">
            Controle de mobiliários em manutenção externa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
          <Button
            onClick={generatePDF}
            className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-black h-12 px-4 md:px-6 rounded-xl shadow-lg text-xs md:text-sm"
          >
            <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
            GERAR GUIA PDF
          </Button>

          <Button
            onClick={() => setOpenSendModal(true)}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black h-12 px-4 md:px-6 rounded-xl shadow-lg shadow-orange-900/20 text-xs md:text-sm"
          >
            <PackagePlus className="w-4 h-4 md:w-5 md:h-5 mr-2" /> NOVA REMESSA
          </Button>
        </div>
      </div>

      {/* BARRA DE PESQUISA DO PÁTIO */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-3.5 md:top-4 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
        <Input
          placeholder="Pesquisar no pátio..."
          value={patioSearch}
          onChange={(e) => setPatioSearch(e.target.value)}
          className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base bg-white shadow-sm border-2 rounded-xl md:rounded-2xl focus-visible:ring-orange-500"
        />
      </div>

      {/* LISTA DE ITENS PAGINADA */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-400">
            <RefreshCcw className="w-6 h-6 md:w-8 md:h-8 animate-spin mb-4" />
            <p className="font-bold text-sm md:text-base">Consultando pátio...</p>
          </div>
        ) : filteredPatio.length === 0 ? (
          <Card className="border-dashed border-2 bg-orange-50/30">
            <CardContent className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-orange-200 mb-4" />
              <p className="text-orange-900/60 font-black text-sm md:text-lg uppercase tracking-widest">
                {patioSearch ? "Nenhum item encontrado" : "Pátio Limpo"}
              </p>
            </CardContent>
          </Card>
        ) : (
          currentPatioItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-2 border-orange-100 shadow-sm relative group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 md:pt-8 gap-4 md:gap-6">
                
                {/* Informações do Item */}
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-orange-500 p-2 md:p-3 rounded-lg md:rounded-xl shrink-0 shadow-inner mt-1 md:mt-0">
                    <Truck className="text-white w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-base md:text-xl text-slate-900 truncate">
                      {item.name}
                      <span className="text-xs md:text-sm font-medium text-slate-400 ml-1 md:ml-2">
                        (Qtd: {item.quantity || 1})
                      </span>
                    </h3>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-1 md:gap-2 mt-2 text-[10px] md:text-xs font-bold">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit uppercase">
                        Origem: {item.location || "Não informada"}
                      </span>
                      {item.patrimony && item.patrimony.includes("[CTRL]") ? (
                        <Badge className="bg-slate-900 text-white text-[8px] md:text-[9px] w-fit">
                          SETOR: {item.patrimony.replace(" [CTRL]", "")}
                        </Badge>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded w-fit uppercase">
                          Patrimônio: {item.patrimony || "S/N"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                  <Button
                    onClick={() => handleReturnFromCorr(item, "USADO")}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 font-bold h-10 shadow-sm text-[10px] md:text-xs px-2"
                  >
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> DEVOLVER
                  </Button>
                  <Button
                    onClick={() => handleReturnFromCorr(item, "CONDENADO")}
                    variant="ghost"
                    className="flex-1 md:flex-none text-red-500 hover:bg-red-50 font-bold h-10 text-[10px] md:text-xs px-2"
                  >
                    <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> CONDENAR
                  </Button>
                </div>

              </div>
            </Card>
          ))
        )}
      </div>

      {/* CONTROLES DE PAGINAÇÃO */}
      {!loading && filteredPatio.length > itemsPerPage && (
        <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="font-bold border-slate-200 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Anterior
          </Button>
          <span className="font-bold text-slate-500 text-[10px] md:text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="font-bold border-slate-200 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
          >
            Próxima <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* MODAL GIGANTE: NOVA REMESSA */}
      <Dialog open={openSendModal} onOpenChange={setOpenSendModal}>
        <DialogContent className="!max-w-[1200px] w-[95vw] md:w-[90vw] bg-slate-50 p-0 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="p-4 md:p-6 lg:p-8 border-b border-slate-200 bg-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3 text-slate-900">
                <Truck className="text-orange-500 w-6 h-6 md:w-8 md:h-8" /> Montar Remessa
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-1 text-xs md:text-base">
                Cadastre ou selecione os móveis que o caminhão está levando.
              </DialogDescription>
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 md:gap-8 max-h-[75vh] overflow-y-auto overflow-x-hidden">
            
            {/* COLUNA ESQUERDA (FORMULÁRIOS) */}
            <div className="space-y-4 md:space-y-8">
              
              {/* Form de Setor */}
              <div className="bg-blue-50/50 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border-2 border-blue-100 space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3 text-blue-800">
                  <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                  <Label className="font-black text-[10px] md:text-sm uppercase tracking-widest">
                    Recolhido de Setor
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Input
                    placeholder="Local (Ex: Recepção)"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    className="h-12 md:h-14 text-sm md:text-base bg-white shadow-sm"
                  />
                  <Input
                    placeholder="Móvel (Ex: Sofá)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-12 md:h-14 text-sm md:text-base bg-white shadow-sm"
                  />
                </div>
                <div className="flex gap-2 md:gap-4 mt-2">
                  <Input
                    placeholder="Patrimônio (Opc.)"
                    value={customPatrimony}
                    onChange={(e) => {
                      setCustomPatrimony(e.target.value);
                      if (e.target.value.trim() !== "") setCustomQty("1");
                    }}
                    className="h-12 md:h-14 text-sm md:text-base bg-white shadow-sm flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    disabled={customPatrimony.trim() !== ""}
                    className="h-12 md:h-14 text-sm md:text-base bg-white shadow-sm w-16 md:w-24 text-center disabled:opacity-50"
                  />
                </div>
                <Button
                  onClick={handleAddCustom}
                  className="w-full h-12 md:h-14 text-xs md:text-base bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md mt-2 rounded-xl"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" /> ADICIONAR À REMESSA
                </Button>
              </div>

              {/* Busca no Estoque */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3 text-slate-700">
                  <PackageOpen className="w-5 h-5 md:w-6 md:h-6" />
                  <Label className="font-black text-[10px] md:text-sm uppercase tracking-widest">
                    Puxar do Estoque IBCC
                  </Label>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 md:left-4 top-3.5 md:top-4 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
                  <Input
                    placeholder="Pesquise no almoxarifado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base bg-white shadow-sm rounded-xl"
                  />
                </div>
                <div className="border-2 border-slate-200 rounded-xl md:rounded-2xl bg-white max-h-[250px] md:max-h-[300px] overflow-y-auto divide-y">
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
                            Pat: {item.patrimony || "S/N"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddFromStock(item)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 md:px-6 h-8 md:h-10 text-xs md:text-sm rounded-lg"
                        >
                          Selecionar
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
            </div>

            {/* COLUNA DIREITA (CARRINHO) */}
            <div className="bg-slate-900 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col h-full min-h-[400px] lg:min-h-[500px]">
              <div className="flex justify-between items-end border-b border-white/10 pb-3 md:pb-4 mb-4 md:mb-6">
                <Label className="font-black text-white text-[10px] md:text-sm uppercase tracking-widest">
                  Itens no Caminhão
                </Label>
                <Badge className="bg-orange-500 text-white text-xs md:text-sm">
                  {cart.length}
                </Badge>
              </div>

              <div className="space-y-2 md:space-y-3 flex-1 overflow-y-auto pr-1 md:pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-3 md:space-y-4 py-8">
                    <Truck className="w-12 h-12 md:w-16 md:h-16" />
                    <p className="font-medium text-center text-xs md:text-base">
                      A remessa está vazia.<br />Adicione itens.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/10">
                      <div className="min-w-0 pr-2">
                        <p className="font-black text-white text-sm md:text-base truncate">
                          {item.name} <span className="text-orange-400 ml-1">(x{item.quantity})</span>
                        </p>
                        <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase mt-1 truncate">
                          Origem: {item.originSector}
                        </p>
                        {item.patrimony && (
                          <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 truncate">
                            Pat: {item.patrimony}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setCart(cart.filter((c) => c.id !== item.id))}
                        className="text-white/30 hover:text-red-400 transition-colors p-2 md:p-2.5 bg-black/20 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-white/10">
                <Button
                  onClick={handleDispatch}
                  disabled={cart.length === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl text-xs md:text-lg shadow-xl disabled:opacity-50"
                >
                  FECHAR LOTE E DESPACHAR
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setOpenSendModal(false)}
                  className="w-full mt-2 md:mt-3 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs md:text-sm h-10 md:h-12 rounded-xl"
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