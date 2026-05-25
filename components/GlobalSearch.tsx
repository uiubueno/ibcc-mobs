'use client'

import * as React from 'react'
import { Search, Package, ClipboardList, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<{furniture: any[], requests: any[]}>({furniture: [], requests: []})
  const [isMac, setIsMac] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()

  // Detecta o Sistema Operacional e previne erro de hidratação no Next.js
  React.useEffect(() => {
    setMounted(true)
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent))
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  React.useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ furniture: [], requests: [] })
        return
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error("Erro na busca:", error)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query])

  const runCommand = (path: string) => {
    setOpen(false)
    setQuery('') 
    router.push(path)
  }

  return (
    <>
      {/* BOTÃO COM ATALHO DINÂMICO (Mac vs Windows) */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 px-3 py-2.5 md:py-1.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg md:rounded-md border border-slate-700 transition-all w-full md:w-48 lg:w-64 shadow-sm"
      >
        <Search className="w-4 h-4 md:w-4 md:h-4 group-hover:text-blue-400 transition-colors shrink-0" />
        <span className="truncate">Busca rápida...</span>
        
        {/* Renderiza o atalho correto de acordo com o OS do usuário */}
        {mounted && (
          <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500 shrink-0">
            <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>K
          </kbd>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl border-slate-200 w-[95vw] max-w-lg sm:w-full rounded-2xl md:rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Busca Global de Ativos</DialogTitle>
          </DialogHeader>

          <Command className="rounded-lg border-none" shouldFilter={false}>
            <CommandInput 
              placeholder="Digite o patrimônio, setor ou nome..." 
              value={query}
              onValueChange={setQuery}
              className="text-base md:text-sm h-12 md:h-11" 
            />
            <CommandList className="max-h-[50vh] md:max-h-[400px]">
              {query.length >= 2 && results.furniture.length === 0 && results.requests.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm">Nenhum resultado para "{query}".</CommandEmpty>
              )}
              
              {results.furniture.length > 0 && (
                <CommandGroup heading="Mobiliário e Patrimônio">
                  {results.furniture.map((item) => (
                    <CommandItem 
                      key={item.id} 
                      value={item.id}
                      onSelect={() => runCommand(`/admin/furniture/${item.id}`)}
                      className="cursor-pointer py-3 md:py-2"
                    >
                      <Package className="mr-3 h-5 w-5 md:h-4 md:w-4 text-blue-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 text-sm md:text-sm truncate">{item.name}</span>
                        <span className="text-xs text-slate-500 truncate">Patrimônio: {item.patrimony || 'Sem número'}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.requests.length > 0 && (
                <CommandGroup heading="Pedidos e Movimentações">
                  {results.requests.map((req) => (
                    <CommandItem 
                      key={req.id} 
                      value={req.id}
                      onSelect={() => runCommand(`/admin/requests`)}
                      className="cursor-pointer py-3 md:py-2"
                    >
                      <ClipboardList className="mr-3 h-5 w-5 md:h-4 md:w-4 text-amber-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 text-sm md:text-sm truncate">{req.sector}</span>
                        <span className="text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-tighter truncate">
                          {req.items?.length > 0 
                            ? `${req.items[0].quantity}x ${req.items[0].type}${req.items.length > 1 ? '...' : ''}` 
                            : 'Pedido Geral'} • {req.status}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              <CommandSeparator />
              <CommandGroup heading="Atalhos">
                <CommandItem onSelect={() => runCommand('/')} className="cursor-pointer py-3 md:py-2">
                   <History className="mr-3 h-5 w-5 md:h-4 md:w-4 text-slate-400" />
                   <span className="text-sm md:text-sm text-slate-700">Ir para o Dashboard</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}