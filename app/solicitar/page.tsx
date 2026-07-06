"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Building2,
  SendHorizonal,
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
  ChevronDown,
  ClipboardList,
  PlusSquare,
  MinusSquare,
  Trash2,
  Bot,
  Loader2,
  FileText,
  GripVertical
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const SECTORS_IBCC = [
  "100 - Diretoria Executiva", "101 - Gerencia Apoio Tecnico", "105 - Assuntos Regulatórios",
  "111 - Central de Autorizações", "115 - Recepção Imagem", "118 - Call Center",
  "119 - Recepção – TCTH", "121 - Adm. Unidades de Internação", "122 - Adm. Enfermagem – Centros Cirurgicos",
  "123 - Adm. TCTH", "124 - Adm. SADT", "127 - Adm. Serviços de Hotelaria",
  "128 - Adm. Serviços de Suprimentos – Farmácia", "130 - PABX", "131 - Central de Aquecimento",
  "132 - Central de Ar Condicionado", "133 - Almoxarifado", "135 - Adm. U.T.I e P.A",
  "136 - Departamento de Pessoal", "137 - Recursos Humanos", "138 - Adm. Ambulatórios/ Quimioterapia",
  "139 - Assessoria Jurídica", "140 - Controle de Acesso e Informação", "142 - Auditoria de Contas Medicas",
  "145 - Financeiro", "150 - Custos", "152 - Assessoria Captação Recursos",
  "154 - Faturamento", "156 - Engajamento Médico", "157 - Contabilidade",
  "158 - Adm. Engenharia/Obras", "160 - Compras", "162 - Adm Apoio Serviços Assistenciais",
  "163 - Central de Agendamento", "166 - Tecnologia da Informação", "167 - Gerencia de Operações",
  "168 - Gerencia de Engenharia e Manutenção", "169 - Portaria/Segurança", "171 - Gerencia de Praticas Assistenciais",
  "172 - SESMT", "174 - SAC – Serviço Atendimento ao Consumidor", "175 - Arquivo e Estatística",
  "178 - Centro de Estudos", "179 - Centro de Pesquisa Clínica", "180 - Serviço de Educação Continuada",
  "181 - Unidade Pompéia", "182 - Unidade Santana", "183 - Unidade Ipiranga",
  "184 - Unidade Granja Viana", "196 - Recepção Internação", "197 - Recurso de Glosas",
  "199 - Departamento Comercial", "200 - Qualidade", "202 - Segurança Paciente",
  "203 - SCIH – Serviço Controle Infecção Hosp.", "204 - Farmácia – Quimioterapia",
  "205 - Farmácia – Centro Cirúrgico", "207 - Coordenação Administrativo Amb/Cirurg",
  "208 - Coord Adm Gestão Acesso", "218 - CME – Central de Material esterelizado",
  "221 - Diretoria Clínica", "225 - Repasse Médico", "227 - Manutenção",
  "228 - Gestão de Equipamentos", "236 - Rouparia", "239 - Costura",
  "242 - Higiene e Limpeza", "245 - Serviço de Nutrição e Dietética", "251 - Farmácia – Central",
  "257 - Transporte Próprio", "263 - Morgue", "266 - Central de Gases Medicinais",
  "272 - Serviço Social", "273 - Grupos Geradores", "274 - Áreas Comuns",
  "276 - Obras", "277 - Paisagismo", "300 - Raios- X",
  "305 - Tomografia", "310 - Ressonância Magnética", "315 - Ultrassonografia",
  "325 - Mamografia", "330 - Laboratório de Análises Clínicas", "360 - Quimioterapia",
  "361 - Quimioterapia HSPM", "365 - Radioterapia", "375 - Medicina Nuclear",
  "376 - PET – CT", "380 - Laboratório de Anatomia Patológica", "381 - Fisioterapia",
  "385 - Banco de Sangue", "388 - Iodoterapia", "389 - TCTH – Onco – Hemato",
  "390 - TCTH – Ambulatório /Day Hospital", "391 - Fonoaudiologia", "400 - Centro Cirúrgico",
  "401 - Centro Cirúrgico Ambulatorial", "402 - Angiologia Intervencionista", "500 - Ambulatório Convênio e Particular",
  "516 - U.I. 3º Andar – SUS, Conv. (Clín. Cirúr)", "517 - U.I. 2º Andar – SUS, Conv (Clín. Médica)",
  "518 - U.I. 4º Andar – Conv, Part. (Méd. e Cir)", "545 - Pronto Atendimento", "546 - Terapia Ocupacional",
  "550 - U.I. 2º Andar – U.T.I.", "560 - Lanchonete", "565 - Estacionamento",
  "570 - Ambulatório SUS", "585 - Psicologia", "587 - Pastoral / Capela",
  "588 - TCTH – Bloco A", "589 - TCTH – UTI", "590 - Serviço de Estomaterapia",
  "592 - Gerência Médica Estrategica", "594 - Adm. Equipe Multi", "597 - Gerenciamento de Leitos",
  "599 - Comunicação", "603 - TCTH Bloco B", "604 - Cuidados Paliativos", "606 - TCTH – Onco Pediatria"
].sort();

interface CartItem {
  type: string;
  quantity: number;
  reason: string;
}

export default function RequestPage() {
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sector, setSector] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCustomRequest, setIsCustomRequest] = useState(false);
  const [customItemName, setCustomItemName] = useState("");

  const [magicText, setMagicText] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const fetchAvailable = async () => {
    try {
      const res = await fetch("/api/requests/available");
      const data = await res.json();
      setAvailableTypes(data);
    } catch (e) {
      toast.error("Erro ao carregar banco de ativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMagicBox = async () => {
    if (!magicText.trim()) return toast.error("Por favor, descreva a necessidade.");
    
    setIsMagicLoading(true);
    try {
      const res = await fetch("/api/ai/magic-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: magicText, sectors: SECTORS_IBCC }),
      });

      if (!res.ok) throw new Error("Falha na interpretação via IA.");

      const data = await res.json();

      if (data.sector) {
        setSector(data.sector);
        setSearchQuery(data.sector);
      }

      if (data.items && Array.isArray(data.items)) {
        setCart(prev => [...prev, ...data.items]);
      }

      setMagicText("");
      toast.success("Formulário preenchido automaticamente com sucesso.");

    } catch (error) {
      toast.error("Não foi possível interpretar o texto. Preencha manualmente.");
    } finally {
      setIsMagicLoading(false);
    }
  };

  const addToCart = (type: string) => {
    const formattedType = type.trim();
    if (!formattedType) return;

    const existing = cart.find((item) => item.type.toLowerCase() === formattedType.toLowerCase());
    if (existing) {
      setCart(cart.map((item) => item.type.toLowerCase() === formattedType.toLowerCase() ? { ...item, quantity: item.quantity + 1 } : item));
      toast.success(`${formattedType} incrementado.`);
    } else {
      setCart([...cart, { type: formattedType, quantity: 1, reason: "" }]);
      toast.success(`${formattedType} inserido na requisição.`);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      toast.error("Especifique o ativo antes de inserir.");
      return;
    }
    addToCart(customItemName);
    setCustomItemName("");
    setIsCustomRequest(false); 
  };

  const updateCartItemReason = (type: string, newReason: string) => {
    setCart(cart.map((item) => item.type === type ? { ...item, reason: newReason } : item));
  };

  const updateCartItemQuantity = (type: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.type === type) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (type: string) => {
    setCart(cart.filter((item) => item.type !== type));
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("A requisição está vazia. Adicione ativos.");
    if (!sector) return toast.error("Selecione o setor de destino.");
    if (cart.some((item) => !item.reason.trim())) return toast.error("A justificativa técnica é obrigatória para todos os itens.");

    toast.promise(
      (async () => {
        let aiSummary = "Solicitação registrada";
        let isUrgent = false;

        try {
          const aiResponse = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sector, items: cart }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSummary = aiData.summary || aiSummary;
            isUrgent = aiData.isUrgent || false;
          }
        } catch (error) {
          console.warn("Análise preditiva indisponível temporariamente.", error);
        }

        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            items: cart, 
            sector,
            aiSummary,
            isUrgent
          }),
        });

        if (!res.ok) throw new Error("Falha de comunicação com o servidor.");
        return res.json();
      })(),
      {
        loading: "Registrando solicitação no sistema...",
        success: () => {
          setSector("");
          setSearchQuery("");
          setCart([]);
          return "Solicitação registrada com sucesso.";
        },
        error: "Falha no registro. Tente novamente.",
      },
    );
  };

  const filteredSectors = SECTORS_IBCC.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      
      {/* HEADER CORPORATIVO */}
      <div className="bg-slate-900 pt-10 pb-20 md:pt-12 md:pb-24 px-4 md:px-6 border-b-4 border-blue-600">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Building2 className="text-blue-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />
              Requisição de Ativos
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">
              Departamento de Hotelaria • IBCC Oncologia
            </p>
          </div>
          {cart.length > 0 && (
            <Badge className="bg-slate-800 text-slate-200 border-slate-700 py-1.5 px-4 flex items-center gap-2 w-fit self-start sm:self-auto text-xs font-bold">
              <ClipboardList className="w-4 h-4 text-blue-400" />
              {cart.length} {cart.length === 1 ? "ativo listado" : "ativos listados"}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-8 md:-mt-12 space-y-6">
        
        {/* PASSO 0: ASSISTENTE INTELIGENTE */}
        <Card className="border border-slate-200 shadow-md bg-white">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <div className="bg-blue-100 p-1.5 rounded-md">
              <Bot className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm md:text-base">Assistente Virtual de Preenchimento</h2>
              <p className="text-xs text-slate-500">Descreva a necessidade do seu setor e a IA estruturará a requisição.</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Textarea
                placeholder="Ex: É necessário o envio de 2 cadeiras giratórias para o setor de Hotelaria devido a quebra dos equipamentos atuais..."
                value={magicText}
                onChange={(e) => setMagicText(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-700 resize-none min-h-[60px] rounded-lg focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm"
              />
              {/* 🔥 BOTÃO COM EFEITO PREMIUM DA IA */}
              <Button 
                onClick={handleMagicBox}
                disabled={isMagicLoading || !magicText.trim()}
                className="group relative overflow-hidden bg-slate-900 hover:bg-blue-600 text-white font-bold py-5 px-6 rounded-lg shadow-sm hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 w-full sm:w-auto shrink-0 flex items-center gap-2"
              >
                {isMagicLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                ) : (
                  <Bot className="w-4 h-4 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                )}
                <span className="relative z-10">PROCESSAR TEXTO</span>
                {/* Brilho animado de fundo no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleRequest} className="space-y-6">
          
          {/* PASSO 1: O DESTINO (🔥 Ajustado z-index e overflow para o dropdown não ser cortado) */}
          <Card className="border-slate-200 shadow-sm relative z-[9999] !overflow-visible">
            <CardContent className="p-6 space-y-4 !overflow-visible">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0">1</span>
                <Label className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-wide">
                  Setor de Destino
                </Label>
              </div>

              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 md:top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Pesquise o código ou nome do setor (ex: 128)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setSector("");
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="h-12 pl-10 pr-10 border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium rounded-lg text-sm"
                  />
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-[10000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredSectors.length > 0 ? (
                      filteredSectors.map((s) => (
                        <div
                          key={s}
                          onClick={() => {
                            setSector(s);
                            setSearchQuery(s);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-4 py-3 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-0 transition-colors ${sector === s ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          {s}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-sm text-slate-400 text-center italic">
                        Nenhum registro encontrado.
                      </div>
                    )}
                  </div>
                )}

                {sector && (
                  <div className="mt-2 text-[11px] md:text-xs font-bold text-green-600 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Destino validado no sistema.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASSO 2: CATÁLOGO DE ATIVOS */}
          <Card className="border-slate-200 shadow-sm relative z-10">
            <div className="bg-slate-50 border-b border-slate-100 p-5 md:p-6 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0">2</span>
              <h2 className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-wide">
                Relação de Ativos
              </h2>
            </div>

            <CardContent className="p-5 md:p-6">
              {!isCustomRequest ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {loading ? (
                      [1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg border border-slate-200" />)
                    ) : availableTypes.length === 0 ? (
                      <div className="col-span-full py-8 text-center">
                        <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-medium text-sm">Nenhum ativo disponível no momento.</p>
                      </div>
                    ) : (
                      availableTypes.map((item) => {
                        const inCart = cart.some((c) => c.type === item.type);
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => addToCart(item.type)}
                            className={`flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 text-left ${
                              inCart 
                                ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`font-bold text-sm ${inCart ? "text-blue-800" : "text-slate-700"}`}>
                              {item.type}
                            </span>
                            {inCart ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <PlusSquare className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {!loading && (
                    <div className="mt-6 text-right">
                      <button
                        type="button"
                        onClick={() => setIsCustomRequest(true)}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Solicitar ativo não listado
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 animate-in fade-in duration-300">
                  <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 block">
                    Especificação do Ativo
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Descreva o mobiliário desejado..."
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="h-10 bg-white border-slate-300 text-sm"
                      autoFocus
                    />
                    <Button type="button" onClick={handleAddCustomItem} className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 rounded-md">
                      INSERIR
                    </Button>
                  </div>
                  <button type="button" onClick={() => setIsCustomRequest(false)} className="mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Voltar para a relação padrão
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASSO 3: RESUMO DA REQUISIÇÃO (Visual Formulário) */}
          {cart.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
              <div className="flex items-center gap-2 text-slate-800 px-1">
                <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0">3</span>
                <h3 className="font-bold text-sm md:text-base uppercase tracking-wide">
                  Resumo da Requisição
                </h3>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 p-3 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-5 pl-2">Ativo</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-4">Justificativa Técnica</div>
                  <div className="col-span-1 text-center">Ação</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.type} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 items-start md:items-center">
                      
                      {/* Ativo */}
                      <div className="col-span-5 w-full md:w-auto flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 hidden md:block" />
                        <p className="font-bold text-slate-800 text-sm">{item.type}</p>
                      </div>

                      {/* Quantidade */}
                      <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:justify-center border border-slate-200 rounded-md p-1 bg-slate-50">
                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase ml-2">Qtd:</span>
                        <div className="flex items-center">
                          <button type="button" onClick={() => updateCartItemQuantity(item.type, -1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
                            <MinusSquare className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm w-8 text-center text-slate-800">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartItemQuantity(item.type, 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
                            <PlusSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Justificativa */}
                      <div className="col-span-4 w-full">
                        <Label className="md:hidden text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                          Justificativa Técnica:
                        </Label>
                        <Input
                          required
                          value={item.reason}
                          onChange={(e) => updateCartItemReason(item.type, e.target.value)}
                          placeholder="Informe a necessidade..."
                          className="bg-white border-slate-200 h-9 text-xs focus-visible:ring-blue-500"
                        />
                      </div>

                      {/* Remover */}
                      <div className="col-span-1 w-full md:w-auto flex justify-end md:justify-center mt-2 md:mt-0">
                        <button type="button" onClick={() => removeFromCart(item.type)} className="text-slate-400 hover:text-red-600 transition-colors p-1 flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> <span className="md:hidden text-xs font-bold">Remover</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={cart.length === 0 || loading}
              className="w-full h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-black shadow-md transition-all active:scale-[0.98] disabled:opacity-50 tracking-wide flex items-center justify-center"
            >
              <SendHorizonal className="w-4 h-4 mr-2" />
              REGISTRAR SOLICITAÇÃO
            </Button>
          </div>
        </form>

        <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest pt-8 pb-4">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
      </div>
    </div>
  );
}