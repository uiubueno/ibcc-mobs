'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  const pathname = usePathname() // Identifica a página atual

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const [date, setDate] = useState<{ from?: Date; to?: Date } | undefined>({
    from: fromParam ? new Date(`${fromParam}T00:00:00`) : undefined,
    to: toParam ? new Date(`${toParam}T00:00:00`) : undefined,
  })

  const handleDateChange = (newDate: any) => {
    setDate(newDate)

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

    // Aplica o filtro na mesma página onde o usuário está
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilter = () => {
    setDate(undefined)
    // Limpa o filtro e permanece na mesma página
    router.push(pathname)
  }

  return (
    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto">
      
      <div className="hidden sm:flex items-center gap-2 px-3 border-r border-slate-100 text-slate-400">
        <Filter className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase tracking-wider">Período</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            className={cn(
              "flex-1 justify-start text-left font-bold text-[10px] md:text-xs h-9 hover:bg-slate-50 px-2",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4 text-blue-600 shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "dd/MM/yy", { locale: ptBR })} - ${format(date.to, "dd/MM/yy", { locale: ptBR })}`
                ) : (
                  format(date.from, "dd/MM/yy", { locale: ptBR })
                )
              ) : (
                "Selecionar período"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0 z-[60]" align="end">
          <div className="md:hidden">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={{ from: date?.from, to: date?.to }}
              onSelect={handleDateChange}
              numberOfMonths={1}
              locale={ptBR}
            />
          </div>
          <div className="hidden md:block">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={{ from: date?.from, to: date?.to }}
              onSelect={handleDateChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </PopoverContent>
      </Popover>

      {date?.from && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
          onClick={clearFilter}
        >
          <X className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      )}
    </div>
  )
}