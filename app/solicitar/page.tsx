"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Package2,
  Send,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
  ChevronDown,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const SECTORS_IBCC = [
  "100 - Diretoria Executiva",
  "101 - Gerencia Apoio Tecnico",
  "105 - Assuntos Regulatórios",
  "111 - Central de Autorizações",
  "115 - Recepção Imagem",
  "118 - Call Center",
  "119 - Recepção – TCTH",
  "121 - Adm. Unidades de Internação",
  "122 - Adm. Enfermagem – Centros Cirurgicos",
  "123 - Adm. TCTH",
  "124 - Adm. SADT",
  "127 - Adm. Serviços de Hotelaria",
  "128 - Adm. Serviços de Suprimentos – Farmácia",
  "130 - PABX",
  "131 - Central de Aquecimento",
  "132 - Central de Ar Condicionado",
  "133 - Almoxarifado",
  "135 - Adm. U.T.I e P.A",
  "136 - Departamento de Pessoal",
  "137 - Recursos Humanos",
  "138 - Adm. Ambulatórios/ Quimioterapia",
  "139 - Assessoria Jurídica",
  "140 - Controle de Acesso e Informação",
  "142 - Auditoria de Contas Medicas",
  "145 - Financeiro",
  "150 - Custos",
  "152 - Assessoria Captação Recursos",
  "154 - Faturamento",
  "156 - Engajamento Médico",
  "157 - Contabilidade",
  "158 - Adm. Engenharia/Obras",
  "160 - Compras",
  "162 - Adm Apoio Serviços Assistenciais",
  "163 - Central de Agendamento",
  "166 - Tecnologia da Informação",
  "167 - Gerencia de Operações",
  "168 - Gerencia de Engenharia e Manutenção",
  "169 - Portaria/Segurança",
  "171 - Gerencia de Praticas Assistenciais",
  "172 - SESMT",
  "174 - SAC – Serviço Atendimento ao Consumidor",
  "175 - Arquivo e Estatística",
  "178 - Centro de Estudos",
  "179 - Centro de Pesquisa Clínica",
  "180 - Serviço de Educação Continuada",
  "181 - Unidade Pompéia",
  "182 - Unidade Santana",
  "183 - Unidade Ipiranga",
  "184 - Unidade Granja Viana",
  "196 - Recepção Internação",
  "197 - Recurso de Glosas",
  "199 - Departamento Comercial",
  "200 - Qualidade",
  "202 - Segurança Paciente",
  "203 - SCIH – Serviço Controle Infecção Hosp.",
  "204 - Farmácia – Quimioterapia",
  "205 - Farmácia – Centro Cirúrgico",
  "207 - Coordenação Administrativo Amb/Cirurg",
  "208 - Coord Adm Gestão Acesso",
  "218 - CME – Central de Material esterelizado",
  "221 - Diretoria Clínica",
  "225 - Repasse Médico",
  "227 - Manutenção",
  "228 - Gestão de Equipamentos",
  "236 - Rouparia",
  "239 - Costura",
  "242 - Higiene e Limpeza",
  "245 - Serviço de Nutrição e Dietética",
  "251 - Farmácia – Central",
  "257 - Transporte Próprio",
  "263 - Morgue",
  "266 - Central de Gases Medicinais",
  "272 - Serviço Social",
  "273 - Grupos Geradores",
  "274 - Áreas Comuns",
  "276 - Obras",
  "277 - Paisagismo",
  "300 - Raios- X",
  "305 - Tomografia",
  "310 - Ressonância Magnética",
  "315 - Ultrassonografia",
  "325 - Mamografia",
  "330 - Laboratório de Análises Clínicas",
  "360 - Quimioterapia",
  "361 - Quimioterapia HSPM",
  "365 - Radioterapia",
  "375 - Medicina Nuclear",
  "376 - PET – CT",
  "380 - Laboratório de Anatomia Patológica",
  "381 - Fisioterapia",
  "385 - Banco de Sangue",
  "388 - Iodoterapia",
  "389 - TCTH – Onco – Hemato",
  "390 - TCTH – Ambulatório /Day Hospital",
  "391 - Fonoaudiologia",
  "400 - Centro Cirúrgico",
  "401 - Centro Cirúrgico Ambulatorial",
  "402 - Angiologia Intervencionista",
  "500 - Ambulatório Convênio e Particular",
  "516 - U.I. 3º Andar – SUS, Conv. (Clín. Cirúr)",
  "517 - U.I. 2º Andar – SUS, Conv (Clín. Médica)",
  "518 - U.I. 4º Andar – Conv, Part. (Méd. e Cir)",
  "545 - Pronto Atendimento",
  "546 - Terapia Ocupacional",
  "550 - U.I. 2º Andar – U.T.I.",
  "560 - Lanchonete",
  "565 - Estacionamento",
  "570 - Ambulatório SUS",
  "585 - Psicologia",
  "587 - Pastoral / Capela",
  "588 - TCTH – Bloco A",
  "589 - TCTH – UTI",
  "590 - Serviço de Estomaterapia",
  "592 - Gerência Médica Estrategica",
  "594 - Adm. Equipe Multi",
  "597 - Gerenciamento de Leitos",
  "599 - Comunicação",
  "603 - TCTH Bloco B",
  "604 - Cuidados Paliativos",
  "606 - TCTH – Onco Pediatria",
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

  // --- NOVOS ESTADOS PARA O ITEM PERSONALIZADO ---
  const [isCustomRequest, setIsCustomRequest] = useState(false);
  const [customItemName, setCustomItemName] = useState("");

  const fetchAvailable = async () => {
    try {
      const res = await fetch("/api/requests/available");
      const data = await res.json();
      setAvailableTypes(data);
    } catch (e) {
      toast.error("Erro ao carregar catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToCart = (type: string) => {
    // Formata o texto para evitar espaços extras no começo e no fim
    const formattedType = type.trim();

    if (!formattedType) return;

    const existing = cart.find(
      (item) => item.type.toLowerCase() === formattedType.toLowerCase(),
    );
    if (existing) {
      setCart(
        cart.map((item) =>
          item.type.toLowerCase() === formattedType.toLowerCase()
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
      toast.success(`${formattedType} adicionado!`, { icon: "🛒" });
    } else {
      setCart([...cart, { type: formattedType, quantity: 1, reason: "" }]);
      toast.success(`${formattedType} adicionado ao pedido!`, { icon: "🛒" });
    }
  };

  // --- FUNÇÃO PARA LIDAR COM A ADIÇÃO DO ITEM PERSONALIZADO ---
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      toast.error("Digite o nome do mobiliário antes de adicionar.");
      return;
    }
    addToCart(customItemName);
    setCustomItemName("");
    setIsCustomRequest(false); // Volta para o catálogo padrão
  };

  const updateCartItemReason = (type: string, newReason: string) => {
    setCart(
      cart.map((item) =>
        item.type === type ? { ...item, reason: newReason } : item,
      ),
    );
  };

  const updateCartItemQuantity = (type: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.type === type) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (type: string) => {
    setCart(cart.filter((item) => item.type !== type));
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0)
      return toast.error("Seu pedido está vazio! Adicione itens do catálogo.");
    if (!sector)
      return toast.error("Por favor, pesquise e selecione o setor de destino!");

    if (cart.some((item) => !item.reason.trim())) {
      return toast.error(
        "Por favor, preencha o motivo para todos os itens do pedido.",
      );
    }

    toast.promise(
      fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, sector }),
      }),
      {
        loading: "Processando seu pedido múltiplo...",
        success: () => {
          setSector("");
          setSearchQuery("");
          setCart([]);
          return "Pedido enviado com sucesso! 🏥";
        },
        error: "Erro ao enviar. Tente novamente.",
      },
    );
  };

  const filteredSectors = SECTORS_IBCC.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      {/* HEADER PREMIUM */}
      <div className="bg-slate-900 pt-12 pb-24 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package2 className="text-blue-500 w-8 h-8" />
              Solicitação de Mobiliário
            </h1>
            <p className="text-slate-400 font-medium">
              Hotelaria IBCC Oncologia
            </p>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1.5 px-4 hidden sm:flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {cart.length}{" "}
            {cart.length === 1 ? "item no pedido" : "itens no pedido"}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12">
        <form onSubmit={handleRequest} className="space-y-6">
          {/* PASSO 1: O DESTINO */}
          <Card className="border-none shadow-2xl shadow-slate-200/60 !overflow-visible relative z-[9999]">
            <CardContent className="p-6 space-y-4 !overflow-visible">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                  1
                </span>
                <Label className="font-bold text-slate-800">
                  Para qual setor é este pedido?
                </Label>
              </div>

              <div className="relative z-50" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Pesquise o setor ou o centro de custo (ex: 128)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setSector("");
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="h-12 pl-10 pr-10 border-slate-200 bg-slate-50 focus:bg-white transition-all font-medium rounded-xl text-slate-700 relative z-10"
                  />
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none z-20" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-[999] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {filteredSectors.length > 0 ? (
                      filteredSectors.map((s) => (
                        <div
                          key={s}
                          onClick={() => {
                            setSector(s);
                            setSearchQuery(s);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-700 ${sector === s ? "bg-blue-100 text-blue-800" : "text-slate-600"}`}
                        >
                          {s}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-sm text-slate-400 text-center italic">
                        Nenhum setor encontrado.
                      </div>
                    )}
                  </div>
                )}

                {sector && (
                  <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3 h-3" /> Setor confirmado para
                    entrega
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASSO 2: CATÁLOGO OU ITEM PERSONALIZADO */}
          <Card className="border-none shadow-xl shadow-slate-200/40 overflow-hidden relative z-10">
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                  2
                </span>
                Selecione os itens do catálogo
              </h2>
            </div>

            <CardContent className="p-6 bg-slate-50/30">
              {!isCustomRequest ? (
                <>
                  {/* GRADE DE CATÁLOGO PADRÃO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 bg-slate-100 animate-pulse rounded-2xl"
                        />
                      ))
                    ) : availableTypes.length === 0 ? (
                      <div className="col-span-full py-8 text-center">
                        <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-medium">
                          Catálogo indisponível no momento.
                        </p>
                      </div>
                    ) : (
                      availableTypes.map((item) => {
                        const inCart = cart.some((c) => c.type === item.type);
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => addToCart(item.type)}
                            className={`group p-4 rounded-2xl border-2 text-left transition-all duration-300 active:scale-95 ${
                              inCart
                                ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-900/5"
                                : "border-white bg-white hover:border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex flex-col h-full justify-between gap-2">
                              <div className="flex justify-between items-start">
                                <span
                                  className={`text-[10px] font-black uppercase tracking-widest ${inCart ? "text-blue-600" : "text-slate-400"}`}
                                >
                                  Mobiliário
                                </span>
                                {inCart ? (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                )}
                              </div>
                              <p
                                className={`font-bold leading-tight ${inCart ? "text-blue-900" : "text-slate-900"}`}
                              >
                                {item.type}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* BOTÃO PARA ABRIR SOLICITAÇÃO PERSONALIZADA */}
                  {!loading && (
                    <div className="mt-8 text-center border-t border-slate-200/60 pt-6">
                      <button
                        type="button"
                        onClick={() => setIsCustomRequest(true)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-4 transition-colors"
                      >
                        Seu mobiliário não está na lista? Faça uma solicitação
                        personalizada.
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* ÁREA DO ITEM PERSONALIZADO */
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
                    <Label className="text-sm font-bold text-slate-800 mb-2 block">
                      Qual é o nome do mobiliário desejado?
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        placeholder="Ex: Cadeira de Rodas Bariátrica..."
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shrink-0"
                      >
                        <Plus className="w-5 h-5 mr-2" /> Adicionar
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCustomRequest(false)}
                      className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                      para o catálogo
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASSO 3: O CARRINHO DE COMPRAS */}
          {cart.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
              <h3 className="font-black text-slate-800 pl-2 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Itens no seu Pedido
              </h3>

              {cart.map((item) => (
                <Card
                  key={item.type}
                  className="border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="bg-slate-50 p-4 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col justify-center">
                      <p className="font-bold text-slate-900 mb-3">
                        {item.type}
                      </p>

                      <div className="flex items-center gap-3 bg-white w-fit px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.type, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-sm w-4 text-center text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.type, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:w-2/3 relative flex flex-col justify-center gap-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Qual a justificativa para{" "}
                        {item.quantity === 1 ? "este item" : "estes itens"}?
                      </Label>
                      <Input
                        required
                        value={item.reason}
                        onChange={(e) =>
                          updateCartItemReason(item.type, e.target.value)
                        }
                        placeholder={`Ex: Necessário para atendimento...`}
                        className="bg-slate-50 border-slate-100"
                      />

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.type)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                        title="Remover do pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button
            type="submit"
            disabled={cart.length === 0 || loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0 relative z-10 mt-8"
          >
            <Send className="w-5 h-5 mr-3" />
            FINALIZAR PEDIDO
            <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
          </Button>
        </form>

        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
      </div>
    </div>
  );
}
