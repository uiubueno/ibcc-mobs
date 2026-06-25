"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  FileText, 
  Building2,
  RefreshCcw,
  Target
} from "lucide-react"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openReportModal, setOpenReportModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics')
        const json = await res.json()
        setData(json)
      } catch (e) {
        toast.error("Erro ao carregar métricas.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
          resolve({ base64: canvas.toDataURL('image/png'), width: img.width, height: img.height });
        } else {
          reject(new Error("Falha no canvas"));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const generateReportPDF = async () => {
    if (!data) return
    const toastId = toast.loading("Gerando PDF...")

    try {
      const doc = new jsPDF()
      const now = new Date()
      const date = now.toLocaleDateString("pt-BR")
      const time = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
      const ibccPurple = [147, 51, 234] as [number, number, number]

      const logoData = await loadImageProportional("/logo-ibcc.png")
      const pdfWidth = 45; 
      const pdfHeight = (logoData.height * pdfWidth) / logoData.width;
      doc.addImage(logoData.base64, 'PNG', 14, 15, pdfWidth, pdfHeight);

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text("DEPARTAMENTO DE HOTELARIA", 14, 15 + pdfHeight + 10)
      doc.text(`Emissão: ${date} às ${time}`, 196, 15 + pdfHeight + 10, { align: "right" })

      doc.setDrawColor(220)
      doc.line(14, 15 + pdfHeight + 15, 196, 15 + pdfHeight + 15)

      doc.setFontSize(16)
      doc.setTextColor(ibccPurple[0], ibccPurple[1], ibccPurple[2])
      doc.setFont("helvetica", "bold")
      doc.text("RELATÓRIO DE DESEMPENHO E TEMPO DE RESPOSTA", 105, 15 + pdfHeight + 30, { align: "center" })

      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.setFont("helvetica", "bold")
      doc.text("Equipe responsável: William Bueno, Giliane Oliveira e Paulo Dias", 14, 15 + pdfHeight + 45)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo Operacional (Últimos 30 dias):", 14, 15 + pdfHeight + 60)
      doc.setFont("helvetica", "normal")
      doc.text(`• Total de Solicitações: ${data.totalRequests}`, 14, 15 + pdfHeight + 68)
      doc.text(`• Solicitações Concluídas: ${data.completedCount} (${data.completionRate}%)`, 14, 15 + pdfHeight + 74)
      doc.text(`• Tempo Médio Global: ${data.averageSla} horas`, 14, 15 + pdfHeight + 80)

      const tableRows = data.sectorRanking.map((s: any) => {
        const timeHrs = parseFloat(s.avgTime)
        let status = "NO MESMO DIA"
        if (timeHrs > 24 && timeHrs <= 72) status = "PRAZO MÉDIO"
        else if (timeHrs > 72) status = "ENVOLVE COMPRAS"
        
        return [s.sector, s.requests.toString(), `${s.avgTime} h`, status]
      })

      autoTable(doc, {
        startY: 15 + pdfHeight + 90,
        head: [["Setor Solicitante", "Volume", "Tempo Médio", "Perfil do Pedido"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: ibccPurple, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: { 0: { halign: "left" }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
      })

      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text("IBCC Oncologia - Gestão de Ativos e Logística Hospitalar", 105, 285, { align: "center" })

      doc.save(`Desempenho_Hotelaria_${date.replace(/\//g, "-")}.pdf`)
      setOpenReportModal(false)
      toast.success("Relatório gerado!", { id: toastId })
    } catch (error) {
      toast.error("Erro ao gerar PDF", { id: toastId })
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><RefreshCcw className="animate-spin w-8 h-8 text-purple-500" /></div>

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Desempenho & Resposta</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic mt-1">Métricas de logística (Últimos 30 dias)</p>
        </div>
        <Button onClick={() => setOpenReportModal(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-black h-12 px-6 rounded-xl shadow-lg">
          <FileText className="w-4 h-4 mr-2" /> GERAR RELATÓRIO
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Média Global</CardTitle>
            <Clock className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{data?.averageSla} <span className="text-lg text-slate-400 font-medium">horas</span></div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Taxa de Conclusão</CardTitle>
            <Target className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-black text-slate-800">{data?.completionRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Pico de Demanda</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-black text-slate-800 truncate">{data?.sectorRanking[0]?.sector || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 uppercase text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" /> Desempenho por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Setor</th>
                  <th className="px-6 py-4 text-center">Volume</th>
                  <th className="px-6 py-4 text-center">Tempo Médio</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.sectorRanking.map((item: any, idx: number) => {
                  const timeHrs = parseFloat(item.avgTime)
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.sector}</td>
                      <td className="px-6 py-4 text-center font-medium">{item.requests} pedidos</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{item.avgTime}h</td>
                      <td className="px-6 py-4 text-right">
                        {timeHrs <= 24 ? <Badge className="bg-emerald-100 text-emerald-700 font-black text-[9px]">NO MESMO DIA</Badge>
                        : timeHrs <= 72 ? <Badge className="bg-blue-100 text-blue-700 font-black text-[9px]">PRAZO MÉDIO</Badge>
                        : <Badge className="bg-amber-100 text-amber-700 font-black text-[9px]">ENVOLVE COMPRAS</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

{/* MODAL DE RELATÓRIO CORRIGIDO */}
<Dialog open={openReportModal} onOpenChange={setOpenReportModal}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
          <div className="p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" /> Confirmar Exportação
              </DialogTitle>
              <DialogDescription className="text-sm mt-2 text-slate-500">
                Gerar PDF do relatório de desempenho para o Departamento de Hotelaria?
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <DialogFooter className="bg-slate-50 p-6 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpenReportModal(false)} 
              className="w-full sm:w-auto font-bold bg-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={generateReportPDF} 
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-black shadow-sm"
            >
              CONFIRMAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}