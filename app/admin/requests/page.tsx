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
  User,
  FileText,
  Eye,
  Sparkles,
  Loader2
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

  // Estados para o Modal de "Ver Detalhes"
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<any>(null);

  // Estados para Triagem
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [openTriage, setOpenTriage] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  const [itemRejectReasons, setItemRejectReasons] = useState<Record<string, string>>({});

  // Estados para Entrega
  const [selectedItemToDeliver, setSelectedItemToDeliver] = useState<any>(null);
  const [openDeliver, setOpenDeliver] = useState(false);
  const [customPatrimony, setCustomPatrimony] = useState("");

  // Estados para Recusa Total e IA
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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

  const hasItemInStock = (itemType: string) => {
    const matchingItems = inventory.filter(
      (inv) => inv.type === itemType && (inv.status === "NOVO" || inv.status === "USADO") && inv.quantity > 0
    );
    return matchingItems.length > 0;
  };

  const handleOpenDetails = (req: any) => {
    setDetailsRequest(req);
    setOpenDetails(true);
  };

  const openTriageModal = (req: any) => {
    setSelectedRequest(req);
    const initialStatuses: Record<string, string> = {};
    
    req.items?.forEach((item: any) => {
      initialStatuses[item.id] = hasItemInStock(item.type) ? "EM_SEPARACAO" : "EM_COMPRA";
    });
    
    setItemStatuses(initialStatuses);
    setItemRejectReasons({}); 
    setOpenTriage(true);
  };

  const handleUpdateItemStatus = (itemId: string, status: string) => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }));
  };

  const confirmTriage = async () => {
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
  
  // 🔥 IA REAL CONECTADA
  const generateAIReason = async (type: string) => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    setRejectReason(""); 

    const name = requestToReject?.user?.name?.split(" ")[0] || "colaborador(a)";
    const sector = requestToReject?.sector || "setor";
    const items = requestToReject?.items || []; 

    try {
      const res = await fetch("/api/ai/rejection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sector, type, items }),
      });

      // 🔥 SE DER ERRO, ELE PEGA O MOTIVO EXATO AQUI
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText); 
      }

      const reader = res.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setRejectReason(text);
      }
    } catch (error: any) {
      console.error(error);
      // 🔥 O TOAST AGORA GRITA O ERRO NA SUA CARA
      toast.error(`Erro IA: ${error.message}`); 
    } finally {
      setIsGeneratingAI(false);
    }
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
        
        {loading ? (
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <div className="h-8 md:h-9 w-24 md:w-28 bg-slate-200 animate-pulse rounded-lg flex-1 md:flex-none"></div>
            <div className="h-8 md:h-9 w-24 md:w-28 bg-slate-200 animate-pulse rounded-lg flex-1 md:flex-none"></div>
            <div className="h-8 md:h-9 w-24 md:w-28 bg-slate-200 animate-pulse rounded-lg flex-1 md:flex-none"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <Badge className="bg-amber-500 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-bold shadow-md text-xs md:text-sm flex-1 md:flex-none justify-center">
              {pendingRequests.length} NOVOS
            </Badge>
            <Badge className="bg-blue-600 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-bold shadow-md text-xs md:text-sm flex-1 md:flex-none justify-center">
              {separationItems.length} SEPARAR
            </Badge>
            <Badge className="bg-purple-600 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-lg font-bold shadow-md text-xs md:text-sm flex-1 md:flex-none justify-center">
              {purchaseItems.length} EM COMPRAS
            </Badge>
          </div>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:gap-12">
          {/* Skeleton Triagem */}
          <section className="space-y-3 md:space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
              ))}
            </div>
          </section>

          {/* Skeleton Separação */}
          <section className="space-y-3 md:space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
              ))}
            </div>
          </section>

          {/* Skeleton Compras e Entregas */}
          <section className="space-y-3 md:space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-32 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
          </section>
        </div>
      ) : (
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
                  onClick={() => handleOpenDetails(req)}
                  className="group hover:shadow-xl transition-all border-l-4 md:border-l-8 border-l-amber-500 shadow-sm cursor-pointer relative"
                >
                  <CardContent className="p-4 md:p-6 space-y-4">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 md:pb-4 gap-3 sm:gap-0">
                      <div className="min-w-0 pr-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg md:text-xl text-slate-900 uppercase leading-tight group-hover:text-amber-600 transition-colors truncate">
                            {req.sector}
                          </h3>
                          {/* 🔥 O ALERTA PISCANDO DA IA APARECE AQUI SE FOR URGENTE */}
                          {req.isUrgent && (
                            <Badge className="bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.6)] border-none text-[9px] font-black uppercase tracking-widest shrink-0">
                              🚨 URGENTE
                            </Badge>
                          )}
                        </div>
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">
                          Solicitante: {req.user?.name || 'Não identificado'}
                        </p>
                        {/* 🔥 O RESUMO DA IA APARECE AQUI */}
                        {req.aiSummary && (
                          <p className="text-[10px] md:text-xs text-blue-600 font-bold bg-blue-50/80 p-1.5 rounded border border-blue-100 mt-2 inline-block">
                            🤖 Resumo IA: {req.aiSummary}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-1.5 text-amber-700 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm border border-amber-200/50">
                          <Eye className="w-3.5 h-3.5" /> Detalhes
                        </div>
                        <Badge className="bg-slate-900 text-white px-3 py-1 text-[10px] md:text-xs">
                          {req.items?.length || 0} {req.items?.length === 1 ? 'ITEM' : 'ITENS'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {req.items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4"
                        >
                          <span className="font-bold text-slate-800 text-xs md:text-sm shrink-0">
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
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleOpenRejectModal(req);
                        }}
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 font-bold text-xs md:text-sm w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1 md:mr-2" /> Recusar Tudo
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          openTriageModal(req);
                        }}
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

          {/* PASSO 4: HISTÓRICO */}
          <section className="space-y-3 md:space-y-4">
            <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> Entregas Recentes
            </h2>
            <Card className="border-none shadow-sm overflow-hidden bg-white">
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
      )}

      {/* --- MODAIS DE AÇÃO E VISUALIZAÇÃO --- */}

      {/* MODAL PARA VER DETALHES COMPLETOS DA JUSTIFICATIVA (LAYOUT HORIZONTAL) */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="w-[95vw] sm:max-w-[1000px] md:h-[600px] rounded-3xl p-0 overflow-hidden bg-slate-50 shadow-2xl flex flex-col md:flex-row">
          
          <div className="bg-slate-900 p-6 md:p-10 text-white md:w-[35%] flex flex-col max-h-[40vh] md:max-h-full overflow-y-auto shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-black text-white text-left tracking-tight flex items-center gap-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-amber-500 shrink-0" />
                Detalhes
              </DialogTitle>
              <DialogDescription className="sr-only">
                Visualize os detalhes completos e justificativas do pedido.
              </DialogDescription>
            </DialogHeader>
            
            {detailsRequest && (
              <div className="mt-8 space-y-4 flex flex-col h-full">
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                    Pedido #{detailsRequest.id.slice(-5).toUpperCase()}
                  </p>
                  
                  <p className="text-sm font-medium mt-6 text-slate-400 flex items-center gap-1.5 mb-1">
                    <User className="w-4 h-4" /> Solicitante:
                  </p>
                  <span className="text-white font-bold text-base md:text-xl block mb-6 leading-tight">
                    {detailsRequest.user?.name || 'Usuário IBCC'}
                  </span>

                  <p className="text-sm font-medium text-slate-400">Destino:<br/>
                    <span className="text-white font-black text-2xl md:text-3xl tracking-tight leading-none mt-2 block">
                      {detailsRequest.sector}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="md:w-[65%] flex flex-col h-full bg-slate-50">
            <div className="p-6 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <PackageSearch className="w-4 h-4" /> Itens e Justificativas
              </h4>
              <div className="space-y-6">
                {detailsRequest?.items?.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl p-5 md:p-6 border-2 border-slate-100 shadow-sm">
                    <p className="font-black text-slate-800 text-lg md:text-xl">{item.quantity}x {item.type}</p>
                    <div className="mt-4 bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Justificativa do Setor:</p>
                      <p className="text-sm md:text-base text-slate-600 italic leading-relaxed">
                        "{item.reason || 'Nenhuma justificativa informada.'}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-8 border-t bg-white shrink-0">
              <Button 
                onClick={() => setOpenDetails(false)} 
                className="w-full font-black bg-slate-900 hover:bg-slate-800 text-white h-12 md:h-14 text-sm md:text-base rounded-xl"
              >
                FECHAR DETALHES
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 MODAL RECUSA COM IA (ATUALIZADO) 🔥 */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent className="max-w-xl w-[95vw] border-slate-200 rounded-2xl md:rounded-3xl p-0 overflow-hidden bg-slate-50">
          
          <div className="bg-white p-6 md:p-8 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquareWarning className="w-6 h-6 text-red-500" /> Recusar Solicitação
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-2 text-sm leading-relaxed">
                Informe a <span className="font-bold text-slate-900">{requestToReject?.user?.name?.split(' ')[0] || 'solicitante'}</span> do setor <span className="font-bold text-slate-900">{requestToReject?.sector}</span> o motivo da recusa.
              </DialogDescription>
            </DialogHeader>

            {/* BOTÕES MÁGICOS DA IA */}
            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Gerar Resposta com IA
              </label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => generateAIReason("padrao")}
                  disabled={isGeneratingAI}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-full"
                >
                  Fora do Padrão
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => generateAIReason("estoque")}
                  disabled={isGeneratingAI}
                  className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-full"
                >
                  Estoque Zerado
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => generateAIReason("verba")}
                  disabled={isGeneratingAI}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-full"
                >
                  Sem Verba
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50">
            <div className="relative">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Texto a ser enviado
              </label>
              <Textarea
                placeholder="Escreva sua justificativa ou use a IA acima..."
                className={`min-h-[140px] resize-none text-sm transition-all bg-white border-slate-200 ${isGeneratingAI ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : 'focus-visible:ring-red-500'}`}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={isGeneratingAI}
              />
              {isGeneratingAI && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-white/80 p-3 rounded-xl backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">IA Formulando...</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 md:p-6 bg-white border-t border-slate-100 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpenRejectModal(false)} className="text-slate-500 w-full sm:w-auto order-2 sm:order-1 font-bold">
              CANCELAR
            </Button>
            <Button 
              onClick={confirmRejection} 
              disabled={isGeneratingAI || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-black w-full sm:w-auto order-1 sm:order-2 px-8"
            >
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
          
          <div className="py-2 md:py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
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
                    <p className="text-xs text-slate-500 italic mt-1.5 leading-relaxed">
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

      {/* MODAL ENTREGA */}
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