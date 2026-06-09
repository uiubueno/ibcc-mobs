"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  PackageSearch,
  XCircle,
  Settings2,
  ShoppingCart,
  MessageSquareWarning,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [openTriage, setOpenTriage] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  // NOVO: Estado para guardar as justificativas individuais
  const [itemRejectReasons, setItemRejectReasons] = useState<Record<string, string>>({});

  const [selectedItemToDeliver, setSelectedItemToDeliver] = useState<any>(null);
  const [openDeliver, setOpenDeliver] = useState(false);
  const [customPatrimony, setCustomPatrimony] = useState("");

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [resReq, resInv] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/furniture"),
      ]);
      const reqData = await resReq.json();
      const invData = await resInv.json();

      setRequests(Array.isArray(reqData) ? reqData : []);
      setInventory(Array.isArray(invData) ? invData : []);
    } catch (e) {
      toast.error("Erro ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função auxiliar: Verifica se um tipo específico de item existe e tem quantidade no estoque
  const hasItemInStock = (itemType: string) => {
    const matchingItems = inventory.filter(
      (inv) => inv.type === itemType && (inv.status === "NOVO" || inv.status === "USADO") && inv.quantity > 0
    );
    return matchingItems.length > 0;
  };

  const openTriageModal = (req: any) => {
    setSelectedRequest(req);
    const initialStatuses: Record<string, string> = {};
    
    req.items?.forEach((item: any) => {
      // Se tiver no estoque, a primeira opção é "EM_SEPARACAO". 
      // Se não tiver, o padrão forçado vira "EM_COMPRA" para não dar erro.
      initialStatuses[item.id] = hasItemInStock(item.type) ? "EM_SEPARACAO" : "EM_COMPRA";
    });
    
    setItemStatuses(initialStatuses);
    setItemRejectReasons({}); // Limpa as justificativas antigas
    setOpenTriage(true);
  };

  const handleUpdateItemStatus = (itemId: string, status: string) => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }));
  };

  const confirmTriage = async () => {
    // TRAVA DE SEGURANÇA: Verifica se tem algum item recusado sem justificativa
    const missingReason = selectedRequest.items.some(
      (item: any) => itemStatuses[item.id] === "RECUSADO" && !itemRejectReasons[item.id]?.trim()
    );

    if (missingReason) {
      toast.error("Preencha a justificativa para todos os itens recusados.");
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/requests/${selectedRequest.id}/triage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Envia também as justificativas para a API salvar e mandar no e-mail
          body: JSON.stringify({ itemStatuses, itemRejectReasons }), 
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Falha na triagem");
        }
        return res.json();
      })(),
      {
        loading: "Processando triagem e enviando e-mail...",
        success: () => {
          setOpenTriage(false);
          fetchData();
          return "Triagem finalizada! O colaborador foi notificado.";
        },
        error: (err) => `Erro: ${err.message}`,
      },
    );
  };

  const handleOpenRejectModal = (req: any) => {
    setRequestToReject(req);
    setRejectReason("");
    setOpenRejectModal(true);
  };

  const confirmRejection = async () => {
    if (!rejectReason.trim()) {
      toast.error("Você precisa informar um motivo para a recusa.");
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/requests/${requestToReject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "RECUSADO",
            rejectionReason: rejectReason,
          }),
        });
        if (!res.ok) throw new Error("Erro ao recusar");
        return res.json();
      })(),
      {
        loading: "Registrando recusa e notificando setor...",
        success: () => {
          setOpenRejectModal(false);
          fetchData();
          return "Pedido recusado com justificativa!";
        },
        error: "Erro ao recusar pedido.",
      },
    );
  };

  const handleDeliver = async (furnitureId: string | null = null) => {
    toast.promise(
      (async () => {
        const res = await fetch(
          `/api/requests/items/${selectedItemToDeliver.id}/deliver`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              furnitureId, 
              status: "ENTREGUE",
              customPatrimony: !furnitureId ? customPatrimony : null
            }),
          },
        );
        if (!res.ok) throw new Error("Erro na entrega");
        return res.json();
      })(),
      {
        loading: "Registrando entrega...",
        success: () => {
          setOpenDeliver(false);
          fetchData();
          return furnitureId
            ? "Item vinculado e entregue! 🚚"
            : customPatrimony 
              ? "Cadastrado e entregue com sucesso! 🚚" 
              : "Entrega direta realizada com sucesso! 🚚";
        },
        error: (err) => `Erro: ${err.message}`,
      },
    );
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDENTE");

  const separationItems = requests.flatMap((req) =>
    (req.items || [])
      .filter((item: any) => item.status === "EM_SEPARACAO")
      .map((item: any) => ({ ...item, sector: req.sector })),
  );

  const purchaseItems = requests.flatMap((req) =>
    (req.items || [])
      .filter((item: any) => item.status === "EM_COMPRA")
      .map((item: any) => ({ ...item, sector: req.sector, requestId: req.id })),
  );

  const completedItems = requests.flatMap((req) =>
    (req.items || [])
      .filter((item: any) => item.status === "ENTREGUE")
      .map((item: any) => ({ ...item, sector: req.sector, furniture: item.furniture })),
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-700">
      {/* HEADER RESPONSIVO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Painel Hotelaria
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic mt-1">
            Gestão de Fluxo Hospitalar IBCC
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <Badge className="bg-amber-500 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-bold shadow-md text-xs md:text-sm flex-1 md:flex-none justify-center">
            {pendingRequests.length} NOVOS
          </Badge>
          <Badge className="bg-blue-600 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-bold shadow-md text-xs md:text-sm flex-1 md:flex-none justify-center">
            {separationItems.length} SEPARAR
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 md:gap-12">
        {/* PASSO 1: TRIAGEM */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /> Passo 1: Triagem de Pedidos
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {pendingRequests.length === 0 && (
              <Card className="col-span-full border-dashed p-8 md:p-12 flex flex-col items-center justify-center bg-slate-50/50">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-slate-200 mb-2" />
                <p className="text-slate-400 font-bold italic text-sm md:text-base text-center">
                  Nenhum pedido novo no radar.
                </p>
              </Card>
            )}

            {pendingRequests.map((req) => (
              <Card
                key={req.id}
                className="group hover:shadow-xl transition-all border-l-4 md:border-l-8 border-l-amber-500 shadow-sm"
              >
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-3 md:pb-4 gap-2 sm:gap-0">
                    <div>
                      <h3 className="font-black text-lg md:text-xl text-slate-900 uppercase leading-tight">
                        {req.sector}
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Solicitante: {req.user?.name}
                      </p>
                    </div>
                    <Badge className="bg-slate-900 text-white px-2 py-1 text-[10px] md:text-xs self-start sm:self-auto">
                      {req.items?.length || 0} ITENS
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {req.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4"
                      >
                        <span className="font-bold text-slate-800 text-xs md:text-sm">
                          {item.quantity}x {item.type}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-slate-400 italic line-clamp-2 sm:line-clamp-1 sm:text-right">
                          "{item.reason}"
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      onClick={() => handleOpenRejectModal(req)}
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 font-bold text-xs md:text-sm w-full sm:w-auto"
                    >
                      <XCircle className="w-4 h-4 mr-1 md:mr-2" /> Recusar Tudo
                    </Button>
                    <Button
                      onClick={() => openTriageModal(req)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm w-full"
                    >
                      ANALISAR PEDIDO <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PASSO 2: SEPARAÇÃO */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <Settings2 className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /> Passo 2: Fila de Separação
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {separationItems.length === 0 && (
              <Card className="col-span-full border-dashed p-8 md:p-10 flex flex-col items-center justify-center bg-slate-50/50">
                <PackageSearch className="w-6 h-6 md:w-8 md:h-8 text-slate-200" />
                <p className="text-slate-400 font-bold italic text-[10px] md:text-xs mt-2 text-center">
                  Nada para despachar no momento.
                </p>
              </Card>
            )}

            {separationItems.map((item: any) => (
              <Card
                key={item.id}
                className="border-l-4 border-l-blue-600 bg-white shadow-md hover:shadow-lg transition-all"
              >
                <CardContent className="p-4 md:p-5 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Badge className="bg-blue-50 text-blue-700 mb-1 font-black text-[8px] md:text-[9px] uppercase border-blue-100 truncate max-w-full">
                        {item.sector}
                      </Badge>
                      <h3 className="font-black text-base md:text-lg text-slate-900 truncate">
                        {item.quantity}x {item.type}
                      </h3>
                    </div>
                    <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-600 shrink-0 mt-1" />
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedItemToDeliver(item);
                      setCustomPatrimony("");
                      setOpenDeliver(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm h-10 md:h-10"
                  >
                    ENTREGAR / VINCULAR
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PASSO 3: COMPRAS */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 text-amber-600" /> Passo 3: Aguardando Compra
          </h2>
          <Card className="border-2 border-amber-100 bg-amber-50/30 overflow-hidden shadow-sm">
            {purchaseItems.length === 0 ? (
              <p className="p-6 md:p-8 text-center text-slate-400 italic text-xs md:text-sm">
                Não há pendências de compra.
              </p>
            ) : (
              <div className="divide-y divide-amber-100">
                {purchaseItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-white transition-colors gap-3 sm:gap-0"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="bg-amber-100 p-2 md:p-2.5 rounded-lg md:rounded-xl text-amber-600 shrink-0">
                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm md:text-base">
                          {item.quantity}x {item.type}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase truncate max-w-[200px] md:max-w-none">
                          SETOR: {item.sector}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] md:text-[10px] rounded-lg h-8 md:h-9"
                      onClick={async () => {
                        const res = await fetch(
                          `/api/requests/${item.requestId}/triage`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              itemStatuses: { [item.id]: "EM_SEPARACAO" },
                            }),
                          },
                        );
                        if (res.ok) {
                          fetchData();
                          toast.success("Item movido para Separação!");
                        }
                      }}
                    >
                      CHEGOU DA COMPRA
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* PASSO 4: HISTÓRICO (Tabela adaptada para Mobile) */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> Entregas Recentes
          </h2>
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            
            {/* Desktop View (Tabela) */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Setor</th>
                    <th className="px-6 py-4">Mobiliário</th>
                    <th className="px-6 py-4">Patrimônio</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {completedItems.slice(0, 10).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                        {item.sector}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {item.quantity}x {item.type}
                      </td>
                      <td className="px-6 py-4">
                        {item.furniture?.patrimony ? (
                          <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-100">
                            {item.furniture.patrimony}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-slate-400 bg-slate-50 border-slate-200">
                            A DEFINIR
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge className="bg-green-100 text-green-700 font-black text-[9px]">
                          ENTREGUE
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden divide-y divide-slate-100">
              {completedItems.slice(0, 10).map((item: any) => (
                <div key={item.id} className="p-4 space-y-2 bg-white">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 text-sm">{item.quantity}x {item.type}</p>
                    <Badge className="bg-green-100 text-green-700 font-black text-[8px] px-2 py-0.5">
                      ENTREGUE
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-slate-600 font-medium truncate">Setor: {item.sector}</p>
                    <div>
                      {item.furniture?.patrimony ? (
                        <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-100 text-[9px]">
                          Pat: {item.furniture.patrimony}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono text-slate-400 bg-slate-50 border-slate-200 text-[9px]">
                          S/ PATRIMÔNIO
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {completedItems.length === 0 && (
                <p className="p-6 text-center text-slate-400 italic text-xs">Nenhuma entrega recente.</p>
              )}
            </div>

          </Card>
        </section>
      </div>

      {/* --- MODAIS COM RESPONSIVIDADE --- */}
      
      {/* MODAL RECUSA (RECUSAR TUDO) */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent className="max-w-lg w-[95vw] border-red-200 rounded-2xl md:rounded-xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black text-red-600 flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5" /> Recusar Solicitação Inteira
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-600 mt-2 text-xs md:text-sm">
              Informe ao setor <span className="font-bold text-slate-900">{requestToReject?.sector}</span> o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 md:py-4">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Justificativa Técnica
            </label>
            <Textarea
              placeholder="Ex: Pedido fora do padrão..."
              className="min-h-[100px] md:min-h-[120px] resize-none focus-visible:ring-red-500 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpenRejectModal(false)} className="text-slate-500 w-full sm:w-auto order-2 sm:order-1">
              CANCELAR
            </Button>
            <Button onClick={confirmRejection} className="bg-red-600 hover:bg-red-700 text-white font-black w-full sm:w-auto order-1 sm:order-2">
              CONFIRMAR RECUSA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TRIAGEM */}
      <Dialog open={openTriage} onOpenChange={setOpenTriage}>
        <DialogContent className="max-w-3xl w-[95vw] rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black">Análise de Itens</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-xs md:text-sm">
              O colaborador será notificado por e-mail com as decisões abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 md:py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedRequest?.items?.map((item: any) => {
              const inStock = hasItemInStock(item.type);
              const options = inStock 
                ? ["EM_SEPARACAO", "EM_COMPRA", "RECUSADO"] 
                : ["EM_COMPRA", "RECUSADO"];

              return (
                <div
                  key={item.id}
                  className={`p-3 md:p-5 rounded-xl border-2 flex flex-col gap-3 transition-colors ${itemStatuses[item.id] === "EM_SEPARACAO" ? "bg-green-50 border-green-200" : itemStatuses[item.id] === "EM_COMPRA" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between">
                      <p className="font-black text-slate-900 leading-tight text-base md:text-lg">
                        {item.quantity}x {item.type}
                      </p>
                      {!inStock && (
                        <Badge className="bg-red-100 text-red-600 border-red-200 text-[9px] uppercase font-bold shrink-0">
                          Estoque Zerado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-3">
                      Motivo: {item.reason}
                    </p>
                  </div>
                  
                  <div className={`grid ${inStock ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-white/80 p-1 rounded-lg border border-slate-200 shadow-sm w-full mt-1`}>
                    {options.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateItemStatus(item.id, st)}
                        className={`py-2 px-1 rounded-md text-[9px] md:text-[10px] font-black transition-all text-center flex flex-col items-center justify-center ${itemStatuses[item.id] === st ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        {st === "EM_SEPARACAO" ? "ESTOQUE" : st === "EM_COMPRA" ? "COMPRAR" : "RECUSAR"}
                      </button>
                    ))}
                  </div>

                  {/* NOVO: TEXTAREA SELECIONADO RECUSAR */}
                  {itemStatuses[item.id] === "RECUSADO" && (
                    <div className="mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1.5 ml-1">
                        Justificativa da Recusa *
                      </label>
                      <Textarea
                        placeholder="Ex: Item não faz parte da padronização..."
                        className="text-xs min-h-[60px] resize-none focus-visible:ring-red-500 bg-white border-red-200"
                        value={itemRejectReasons[item.id] || ""}
                        onChange={(e) =>
                          setItemRejectReasons((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
          
          <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setOpenTriage(false)} className="w-full sm:w-auto order-2 sm:order-1 font-bold h-11 md:h-10">
              CANCELAR
            </Button>
            <Button onClick={confirmTriage} className="bg-blue-600 hover:bg-blue-700 text-white font-black w-full sm:w-auto md:px-8 order-1 sm:order-2 h-11 md:h-10 tracking-widest text-sm">
              FINALIZAR TRIAGEM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 MODAL ENTREGA ATUALIZADO 🔥 */}
      <Dialog open={openDeliver} onOpenChange={setOpenDeliver}>
        <DialogContent className="max-w-2xl w-[95vw] bg-slate-50 border-slate-200 rounded-2xl md:rounded-xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black text-slate-900">
              Entrega de Ativo
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-xs md:text-sm">
              Despachando: <span className="text-blue-600 font-bold">{selectedItemToDeliver?.type}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4 md:space-y-6">
            
            {/* ENTREGA DIRETA COM CAMPO OPCIONAL */}
            <div className="bg-slate-900 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-4 opacity-10 hidden md:block">
                <PackageSearch className="w-24 h-24 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div className="bg-blue-500/20 p-2 md:p-2.5 rounded-lg md:rounded-xl border border-blue-500/30 shrink-0">
                    <Truck className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs md:text-sm uppercase tracking-wider">
                      Entrega Direta
                    </h4>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-1 font-medium leading-relaxed max-w-full md:max-w-[80%]">
                      Para itens recém comprados. Preencha o patrimônio para cadastrá-lo no estoque na hora.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <label className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">
                      Patrimônio (Opcional)
                    </label>
                    <Input
                      placeholder="Ex: 123456"
                      value={customPatrimony}
                      onChange={(e) => setCustomPatrimony(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-10 text-sm font-mono"
                    />
                  </div>

                  <Button
                    onClick={() => handleDeliver(null)}
                    className={`w-full text-white font-black h-11 md:h-12 rounded-lg md:rounded-xl transition-all shadow-lg text-[10px] md:text-xs ${
                      customPatrimony ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    CONFIRMAR ENTREGA {customPatrimony ? "C/ PATRIMÔNIO" : "(S/ ETIQUETA)"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-[9px] md:text-[10px] uppercase tracking-widest">
                <span className="bg-slate-50 px-2 md:px-3 text-slate-400 font-black text-center">
                  Ou escolha do estoque
                </span>
              </div>
            </div>

            {/* LISTA DE ESTOQUE */}
            <div className="grid grid-cols-1 gap-2 md:gap-3 max-h-[40vh] md:max-h-[220px] overflow-y-auto pr-1 md:pr-2">
              {inventory
                .filter(i => i.type === selectedItemToDeliver?.type && (i.status === "NOVO" || i.status === "USADO") && i.quantity > 0)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDeliver(item.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-800 hover:bg-slate-900 hover:text-white transition-all group text-left gap-2 sm:gap-0"
                  >
                    <div>
                      <p className="font-black text-inherit text-sm md:text-base">{item.name}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 group-hover:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                        Patrimônio: 
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 group-hover:bg-slate-800 group-hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors">
                          {item.patrimony || "S/N"}
                        </span>
                      </p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors text-[9px] md:text-xs w-fit">
                      {item.status}
                    </Badge>
                  </button>
                ))}

              {inventory.filter(i => i.type === selectedItemToDeliver?.type && (i.status === "NOVO" || i.status === "USADO")).length === 0 && (
                <div className="p-6 md:p-8 text-center bg-white rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest">
                    Sem correspondência
                  </p>
                  <p className="text-[9px] md:text-[11px] text-slate-400 mt-1 md:mt-2 font-medium">
                    Use o botão azul acima para concluir a entrega.
                  </p>
                </div>
              )}
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