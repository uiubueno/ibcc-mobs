'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']

export function DashboardCharts({ statusData, sectorData }: { statusData: any[], sectorData: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Gráfico de Pizza: Status das Solicitações */}
      <Card className="shadow-sm border-slate-200 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Distribuição de Status</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pb-6">
          
          {/* CURA DEFINITIVA: height com número fixo (240) sem aspas, width com % */}
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legenda Customizada */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  {entry.name}: <span className="text-slate-900">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras: Top Setores */}
      <Card className="shadow-sm border-slate-200 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Top 5 Setores Solicitantes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4 pb-6">
          
          {/* CURA DEFINITIVA: height com número fixo (280) */}
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
          
        </CardContent>
      </Card>

    </div>
  )
}