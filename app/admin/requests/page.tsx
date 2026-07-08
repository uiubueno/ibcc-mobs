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
  Loader2,
  AlertTriangle,
  Building2,
  ChevronRight,
  GripVertical
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
  const [generatingAITriage, setGeneratingAITriage] = useState<Record<string, boolean>>({}); // Controle de IA por item

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
    setGeneratingAITriage({});
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
  
  // 🔥 IA: Recusa Total do Pedido
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

      if (!res.ok) throw new Error(await res.text()); 

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
      toast.error(`Erro IA: ${error.message}`); 
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 🔥 IA: Recusa de Item Específico na Triagem
  const handleGenerateAITriage = async (itemId: string, type: string, itemTypeStr: string) => {
    if (generatingAITriage[itemId]) return;
    
    setGeneratingAITriage(prev => ({ ...prev, [itemId]: true }));
    setItemRejectReasons(prev => ({ ...prev, [itemId]: "" }));

    const name = selectedRequest?.user?.name?.split(" ")[0] || "colaborador(a)";
    const sector = selectedRequest?.sector || "setor";
    // Manda só o item atual para a IA focar nele
    const items = [{ type: itemTypeStr, quantity: 1, reason: "" }];

    try {
      const res = await fetch("/api/ai/rejection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sector, type, items }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setItemRejectReasons(prev => ({ ...prev, [itemId]: text }));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro IA: ${error.message}`);
    } finally {
      setGeneratingAITriage(prev => ({ ...prev, [itemId]: false }));
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER DASHBOARD */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              Gestão de Fluxo Hospitalar
            </h1>
            <p className="text-slate-500 font-medium mt-1 ml-9">
              Controle Operacional de Ativos • Hotelaria IBCC
            </p>
          </div>
          
          {loading ? (
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="h-12 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
              <div className="h-12 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
              <div className="h-12 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
            </div>
          ) : (
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
              <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[140px] flex-1 md:flex-none">
                <div className="bg-amber-100 p-2 rounded-lg"><Clock className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Novos</p>
                  <p className="text-xl font-black leading-none">{pendingRequests.length}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[140px] flex-1 md:flex-none">
                <div className="bg-blue-100 p-2 rounded-lg"><Settings2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Separar</p>
                  <p className="text-xl font-black leading-none">{separationItems.length}</p>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-100 text-purple-700 px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[140px] flex-1 md:flex-none">
                <div className="bg-purple-100 p-2 rounded-lg"><ShoppingCart className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Compras</p>
                  <p className="text-xl font-black leading-none">{purchaseItems.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA: TRIAGEM */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-100 p-1.5 rounded-md"><Clock className="w-5 h-5 text-amber-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">1. Triagem de Pedidos</h2>
              </div>

              {pendingRequests.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-white text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-center">A fila de triagem está limpa.<br/>Nenhum pedido pendente no momento.</p>
                </div>
              )}

              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <Card key={req.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white relative">
                    
                    {req.isUrgent && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                    )}

                    <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 truncate max-w-[300px]" title={req.sector}>
                            {req.sector}
                          </h3>
                          {req.isUrgent && (
                            <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2 h-5">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> {req.user?.name || 'Não identificado'}
                        </p>
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetails(req)} className="h-8 text-xs font-semibold text-slate-600 bg-white">
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Detalhes Completos
                      </Button>
                    </div>

                    <CardContent className="p-0">
                      {req.aiSummary && (
                        <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 mb-0.5">Diagnóstico IA</p>
                            <p className="text-sm text-blue-900 font-medium leading-snug">"{req.aiSummary}"</p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        {req.items?.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold shrink-0">
                              {item.quantity}x
                            </Badge>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{item.type}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={item.reason}>
                                Motivo: {item.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenRejectModal(req)}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Recusar
                      </Button>
                      <Button
                        onClick={() => openTriageModal(req)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                      >
                        Triagem <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: SEPARAÇÃO E COMPRAS */}
            <div className="lg:col-span-5 space-y-10">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-1.5 rounded-md"><Settings2 className="w-5 h-5 text-blue-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">2. Fila de Separação</h2>
                </div>

                {separationItems.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl p-6 text-center bg-white text-slate-400">
                    <p className="text-sm font-medium">Nenhum item aguardando despacho.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {separationItems.map((item: any) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-400 mb-1 truncate">{item.sector}</p>
                          <p className="font-semibold text-slate-800 text-sm truncate">{item.quantity}x {item.type}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedItemToDeliver(item);
                            setCustomPatrimony("");
                            setOpenDeliver(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 font-medium text-xs h-8"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1.5" /> Entregar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-100 p-1.5 rounded-md"><ShoppingCart className="w-5 h-5 text-purple-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">3. Aguardando Compra</h2>
                </div>

                {purchaseItems.length === 0 ? (
                  <div className="border border-slate-200 rounded-xl p-6 text-center bg-white text-slate-400">
                    <p className="text-sm font-medium">Nenhum item pendente de suprimentos.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {purchaseItems.map((item: any) => (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{item.quantity}x {item.type}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">Para: {item.sector}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-medium text-xs h-8 shrink-0 w-full sm:w-auto"
                            onClick={async () => {
                              const res = await fetch(`/api/requests/${item.requestId}/triage`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ itemStatuses: { [item.id]: "EM_SEPARACAO" } }),
                              });
                              if (res.ok) {
                                fetchData();
                                toast.success("Movido para separação!");
                              }
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Chegou
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* PASSO 4: HISTÓRICO DE ENTREGAS */}
        {!loading && completedItems.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-1.5 rounded-md"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
              <h2 className="text-lg font-bold text-slate-800">Histórico de Entregas</h2>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Destino</th>
                      <th className="px-6 py-4">Ativo Entregue</th>
                      <th className="px-6 py-4">Patrimônio</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedItems.slice(0, 10).map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 truncate max-w-[200px]">
                          {item.sector}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                          {item.quantity}x {item.type}
                        </td>
                        <td className="px-6 py-4">
                          {item.furniture?.patrimony ? (
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {item.furniture.patrimony}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">S/N</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                            Entregue
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAIS MANTIDOS INTACTOS COM PEQUENOS AJUSTES DE ESTILO --- */}

      {/* MODAL VER DETALHES */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-3xl w-[95vw] rounded-2xl p-0 overflow-hidden bg-white border-slate-200">
          <div className="bg-slate-50 p-6 md:p-8 border-b border-slate-100 flex items-start gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hidden sm:block">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Detalhes da Requisição
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                Solicitante: <span className="text-slate-800">{detailsRequest?.user?.name || 'N/A'}</span>
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Setor Destino</p>
              <p className="text-lg font-semibold text-slate-800">{detailsRequest?.sector}</p>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itens e Justificativas</p>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {detailsRequest?.items?.map((item: any) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="font-bold">{item.quantity}x</Badge>
                    <p className="font-semibold text-slate-800 text-base">{item.type}</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                    "{item.reason || 'Nenhuma justificativa informada.'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
            <Button variant="outline" onClick={() => setOpenDetails(false)} className="font-semibold">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RECUSA COM IA */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent className="max-w-xl w-[95vw] border-slate-200 rounded-2xl p-0 overflow-hidden bg-white">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-red-500" /> Motivo da Recusa
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-2 text-sm">
                Informe ao setor <span className="font-bold text-slate-800">{requestToReject?.sector}</span> a justificativa técnica para o cancelamento.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-3">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" /> Autocompletar com IA
              </label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => generateAIReason("padrao")} disabled={isGeneratingAI} className="bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-medium">
                  Fora do Padrão
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateAIReason("estoque")} disabled={isGeneratingAI} className="bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-medium">
                  Estoque Zerado
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateAIReason("verba")} disabled={isGeneratingAI} className="bg-purple-50/50 border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-medium">
                  Sem Verba
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50/50 relative">
            <Textarea
              placeholder="Digite a justificativa técnica..."
              className={`min-h-[140px] resize-none text-sm transition-all bg-white border-slate-200 focus-visible:ring-slate-400 ${isGeneratingAI ? 'opacity-50' : ''}`}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isGeneratingAI}
            />
            {isGeneratingAI && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-blue-700">Gerando texto...</span>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 md:p-6 bg-white border-t border-slate-100 gap-2">
            <Button variant="outline" onClick={() => setOpenRejectModal(false)} className="font-semibold">Cancelar</Button>
            <Button onClick={confirmRejection} disabled={isGeneratingAI || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TRIAGEM */}
      <Dialog open={openTriage} onOpenChange={setOpenTriage}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Análise de Ativos</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Defina o destino de cada item solicitado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedRequest?.items?.map((item: any) => {
              const inStock = hasItemInStock(item.type);
              const options = inStock ? ["EM_SEPARACAO", "EM_COMPRA", "RECUSADO"] : ["EM_COMPRA", "RECUSADO"];

              return (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800 text-base">{item.quantity}x {item.type}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={item.reason}>Motivo: {item.reason}</p>
                    </div>
                    {!inStock && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] shrink-0">Sem Estoque</Badge>}
                  </div>
                  
                  <div className="flex gap-2">
                    {options.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateItemStatus(item.id, st)}
                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors border ${
                          itemStatuses[item.id] === st 
                            ? st === "EM_SEPARACAO" ? "bg-blue-600 text-white border-blue-600" 
                            : st === "EM_COMPRA" ? "bg-purple-600 text-white border-purple-600"
                            : "bg-red-600 text-white border-red-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st === "EM_SEPARACAO" ? "Estoque" : st === "EM_COMPRA" ? "Comprar" : "Recusar"}
                      </button>
                    ))}
                  </div>

                  {/* 🔥 ÁREA DE RECUSA DO ITEM (AGORA COM BOTÕES DA IA E TEXTAREA) */}
                  {itemStatuses[item.id] === "RECUSADO" && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest block">
                          Justificativa da Recusa *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] font-semibold text-slate-500">IA:</span>
                          <button onClick={() => handleGenerateAITriage(item.id, 'padrao', item.type)} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 border border-blue-100 transition-colors">Padrão</button>
                          <button onClick={() => handleGenerateAITriage(item.id, 'estoque', item.type)} className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded hover:bg-amber-100 border border-amber-100 transition-colors">Estoque</button>
                          <button onClick={() => handleGenerateAITriage(item.id, 'verba', item.type)} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded hover:bg-purple-100 border border-purple-100 transition-colors">Verba</button>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Textarea
                          placeholder="Justificativa técnica da recusa..."
                          className={`text-sm min-h-[80px] bg-white border-red-200 focus-visible:ring-red-500 resize-none ${generatingAITriage[item.id] ? 'opacity-50' : ''}`}
                          value={itemRejectReasons[item.id] || ""}
                          onChange={(e) => setItemRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          disabled={generatingAITriage[item.id]}
                        />
                        {generatingAITriage[item.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-md">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setOpenTriage(false)} className="font-semibold">Cancelar</Button>
            <Button onClick={confirmTriage} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
              Salvar Análise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ENTREGA */}
      <Dialog open={openDeliver} onOpenChange={setOpenDeliver}>
        <DialogContent className="max-w-md w-[95vw] bg-white border-slate-200 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Despachar Ativo</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Confirmar entrega de: <span className="font-bold text-slate-800">{selectedItemToDeliver?.type}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Cadastrar e Entregar</h4>
              <p className="text-xs text-blue-700/80 mb-3">Se o item é novo, insira a etiqueta de patrimônio para registrá-lo automaticamente no banco de dados.</p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Nº Patrimônio (Opcional)"
                  value={customPatrimony}
                  onChange={(e) => setCustomPatrimony(e.target.value)}
                  className="bg-white border-blue-200 focus-visible:ring-blue-500 font-mono text-sm"
                />
                <Button onClick={() => handleDeliver(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir
                </Button>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink-0 px-3 text-xs text-slate-400 font-medium uppercase">Ou selecione do estoque</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {inventory
                .filter(i => i.type === selectedItemToDeliver?.type && (i.status === "NOVO" || i.status === "USADO") && i.quantity > 0)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDeliver(item.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">Pat: {item.patrimony || "S/N"}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
                  </button>
                ))}

              {inventory.filter(i => i.type === selectedItemToDeliver?.type && (i.status === "NOVO" || i.status === "USADO")).length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4 font-medium">
                  Nenhum item com este nome cadastrado no estoque físico.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 🏥 RODAPÉ DE VOLTA AO SEU DEVIDO LUGAR! */}
      <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-8 pb-6">
        HOSPITAL IBCC ONCOLOGIA • DEPARTAMENTO DE HOTELARIA
      </p>
    </div>
  );
}