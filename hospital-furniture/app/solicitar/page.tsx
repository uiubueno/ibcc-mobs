'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { 
  Package2, 
  Send, 
  MapPin, 
  MessageSquare, 
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const SECTORS_IBCC = [
  "Diretoria Executiva", "Gerencia Apoio Tecnico", "Assuntos Regulatórios", "Central de Autorizações",
  "Recepção Imagem", "Call Center", "Recepção – TCTH", "Adm. Unidades de Internação", 
  "Adm. Enfermagem – Centros Cirurgicos", "Adm. TCTH", "Adm. SADT", "Adm. Serviços de Hotelaria", 
  "Adm. Serviços de Suprimentos – Farmácia", "PABX", "Central de Aquecimento", "Central de Ar Condicionado", 
  "Almoxarifado", "Adm. U.T.I e P.A", "Departamento de Pessoal", "Recursos Humanos", 
  "Adm. Ambulatórios/ Quimioterapia", "Assessoria Jurídica", "Controle de Acesso e Informação", 
  "Auditoria de Contas Medicas", "Financeiro", "Custos", "Assessoria Captação Recursos", "Faturamento", 
  "Engajamento Médico", "Contabilidade", "Adm. Engenharia/Obras", "Compras", 
  "Adm Apoio Serviços Assistenciais", "Central de Agendamento", "Tecnologia da Informação", 
  "Gerencia de Operações", "Gerencia de Engenharia e Manutenção", "Portaria/Segurança", 
  "Gerencia de Praticas Assistenciais", "SESMT", "SAC – Serviço Atendimento ao Consumidor", 
  "Arquivo e Estatística", "Centro de Estudos", "Centro de Pesquisa Clínica", 
  "Serviço de Educação Continuada", "Unidade Pompéia", "Unidade Santana", "Unidade Ipiranga", 
  "Unidade Granja Viana", "Recepção Internação", "Recurso de Glosas", "Departamento Comercial", 
  "Qualidade", "Segurança Paciente", "SCIH – Serviço Controle Infecção Hosp.", "Farmácia – Quimioterapia", 
  "Farmácia – Centro Cirúrgico", "Coordenação Administrativo Amb/Cirurg", "Coord Adm Gestão Acesso", 
  "CME – Central de Material esterelizado", "Diretoria Clínica", "Repasse Médico", "Manutenção", 
  "Gestão de Equipamentos", "Rouparia", "Costura", "Higiene e Limpeza", "Serviço de Nutrição e Dietética", 
  "Farmácia – Central", "Transporte Próprio", "Morgue", "Central de Gases Medicinais", "Serviço Social", 
  "Grupos Geradores", "Áreas Comuns", "Obras", "Paisagismo", "Raios- X", "Tomografia", 
  "Ressonância Magnética", "Ultrassonografia", "Mamografia", "Laboratório de Análises Clínicas", 
  "Quimioterapia", "Quimioterapia HSPM", "Radioterapia", "Medicina Nuclear", "PET – CT", 
  "Laboratório de Anatomia Patológica", "Fisioterapia", "Banco de Sangue", "Iodoterapia", 
  "TCTH – Onco – Hemato", "TCTH – Ambulatório /Day Hospital", "Fonoaudiologia", "Centro Cirúrgico", 
  "Centro Cirúrgico Ambulatorial", "Angiologia Intervencionista", "Ambulatório Convênio e Particular", 
  "U.I. 3º Andar – SUS, Conv. (Clín. Cirúr)", "U.I. 2º Andar – SUS, Conv (Clín. Médica)", 
  "U.I. 4º Andar – Conv, Part. (Méd. e Cir)", "Pronto Atendimento", "Terapia Ocupacional", 
  "U.I. 2º Andar – U.T.I.", "Lanchonete", "Estacionamento", "Ambulatório SUS", "Psicologia", 
  "Pastoral / Capela", "TCTH – Bloco A", "TCTH – UTI", "Serviço de Estomaterapia", 
  "Gerência Médica Estrategica", "Adm. Equipe Multi", "Gerenciamento de Leitos", "Comunicação", 
  "TCTH Bloco B", "Cuidados Paliativos", "TCTH – Onco Pediatria", "Corrida / Campanha"
].sort()

export default function RequestPage() {
  const [availableTypes, setAvailableTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedType, setSelectedType] = useState('')
  const [sector, setSector] = useState('')
  const [reason, setReason] = useState('')

  // Estados para a busca inteligente de setor
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchAvailable = async () => {
    try {
      const res = await fetch('/api/requests/available')
      const data = await res.json()
      setAvailableTypes(data)
    } catch (e) {
      toast.error("Erro ao carregar estoque disponível.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAvailable() }, [])

  // Fechar o dropdown de busca se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return toast.error("Por favor, selecione um item no catálogo!")
    if (!sector) return toast.error("Por favor, pesquise e selecione o setor de destino!")

    toast.promise(
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, sector, reason })
      }),
      {
        loading: 'Processando seu pedido...',
        success: () => {
          setSector('')
          setSearchQuery('')
          setReason('')
          setSelectedType('')
          fetchAvailable()
          return 'Pedido enviado com sucesso! 🏥'
        },
        error: 'Erro ao enviar. Tente novamente.'
      }
    )
  }

  // Lógica para filtrar a lista com base no que a pessoa digita
  const filteredSectors = SECTORS_IBCC.filter(s => 
    s.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="bg-slate-900 pt-12 pb-24 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package2 className="text-blue-500 w-8 h-8" />
              Solicitar Mobiliário
            </h1>
            <p className="text-slate-400 font-medium">Hotelaria IBCC Oncologia</p>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1 px-3 hidden sm:flex">
            Sincronizado em tempo real
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <form onSubmit={handleRequest} className="space-y-6">
          
          {/* PASSO 1: CATÁLOGO */}
          <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span>
                Selecione o que você precisa
              </h2>
              {selectedType && (
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-bounce">
                  Selecionado
                </span>
              )}
            </div>
            
            <CardContent className="p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />)
                ) : availableTypes.length === 0 ? (
                  <div className="col-span-full py-12 text-center">
                    <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Nenhum item disponível no momento.</p>
                  </div>
                ) : (
                  availableTypes.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedType(item.type)}
                      className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-300 active:scale-95 ${
                        selectedType === item.type 
                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'border-white bg-white hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {selectedType === item.type && (
                        <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-blue-600 animate-in zoom-in duration-300" />
                      )}
                      
                      <div className="flex flex-col h-full justify-between gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedType === item.type ? 'text-blue-600' : 'text-slate-400'}`}>
                          Mobiliário
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight mb-1">{item.type}</p>
                          <p className="text-xs text-slate-500">
                            <span className="font-black text-slate-900">{item.count}</span> disponíveis
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASSO 2 E 3: DETALHES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
            {/* Adicionamos 'relative z-50' e 'overflow-visible' neste Card para ele pular pra frente */}
            <Card className="border-none shadow-xl relative z-50 overflow-visible">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Qual o Setor?</Label>
                </div>
                
                {/* CAMPO DE BUSCA INTELIGENTE */}
                <div className="relative z-50" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <Input 
                      type="text"
                      placeholder="Pesquise o setor..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setIsDropdownOpen(true)
                        setSector('') 
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="h-12 pl-10 pr-10 border-slate-200 bg-white focus:bg-white transition-all font-medium rounded-xl text-slate-700 relative z-10"
                    />
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none z-20" />
                  </div>

                  {/* CAIXA SUSPENSA COM Z-INDEX 999 PRA FICAR NA FRENTE DE TUDO */}
                  {isDropdownOpen && (
                    <div className="absolute z-[999] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      {filteredSectors.length > 0 ? (
                        filteredSectors.map((s) => (
                          <div 
                            key={s}
                            onClick={() => {
                              setSector(s)
                              setSearchQuery(s) 
                              setIsDropdownOpen(false) 
                            }}
                            className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-700 ${sector === s ? 'bg-blue-100 text-blue-800' : 'text-slate-600'}`}
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
                  
                  {/* Confirmação visual discreta se o setor tá gravado na variável final */}
                  {sector && (
                    <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Setor confirmado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl relative z-10">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Qual o motivo?</Label>
                </div>
                <div className="relative group">
                  <MessageSquare className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    required 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="Ex: Admissão de urgência" 
                    className="h-12 pl-10 border-slate-200 bg-white focus:bg-white transition-all font-medium rounded-xl text-slate-700"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button 
            type="submit" 
            disabled={!selectedType || loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            <Send className="w-5 h-5 mr-3" />
            FINALIZAR SOLICITAÇÃO
            <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
          </Button>
        </form>

        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          IBCC ONCOLOGIA • HOTELARIA SUPREMA 2.0
        </p>
      </div>
    </div>
  )
}