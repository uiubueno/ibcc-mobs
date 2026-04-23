'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const [date, setDate] = useState<{ from?: Date; to?: Date } | undefined>({
    from: fromParam ? new Date(`${fromParam}T00:00:00`) : undefined,
    to: toParam ? new Date(`${toParam}T00:00:00`) : undefined,
  })

  // A MÁGICA DA CORREÇÃO ESTÁ AQUI: Só atualiza a URL quando você clica.
  const handleDateChange = (newDate: any) => {
    setDate(newDate) // Atualiza o estado visual

    // Atualiza a URL na mesma hora
    const params = new URLSearchParams(searchParams.toString())
    
    if (newDate?.from) {
      params.set('from', format(newDate.from, 'yyyy-MM-dd'))
    } else {
      params.delete('from')
    }

    if (newDate?.to) {
      params.set('to', format(newDate.to, 'yyyy-MM-dd'))
    } else {
      params.delete('to')
    }

    router.push(`/?${params.toString()}`)
  }

  const clearFilter = () => {
    setDate(undefined)
    router.push('/')
  }

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 px-3 border-r border-slate-100 mr-2 text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-wider">Período</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            className={cn(
              "justify-start text-left font-bold text-xs h-9 hover:bg-slate-50",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={{ from: date?.from, to: date?.to }}
            onSelect={handleDateChange} // <-- Agora chama a função segura!
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {date?.from && (
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] font-bold text-slate-400 hover:text-red-500 h-8 px-2"
          onClick={clearFilter}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}