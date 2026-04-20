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
} from "@/components/ui/dialog"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<{furniture: any[], requests: any[]}>({furniture: [], requests: []})
  const router = useRouter()

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
    setQuery('') // Limpa a busca ao fechar
    router.push(path)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-all w-48 lg:w-64"
      >
        <Search className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
        <span className="truncate">Busca rápida...</span>
        <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl border-slate-200">
          {/* O segredo está no shouldFilter={false} abaixo */}
          <Command className="rounded-lg border-none" shouldFilter={false}>
            <CommandInput 
              placeholder="Digite o patrimônio, setor ou nome..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[400px]">
              {query.length >= 2 && results.furniture.length === 0 && results.requests.length === 0 && (
                <CommandEmpty>Nenhum resultado para "{query}".</CommandEmpty>
              )}
              
              {results.furniture.length > 0 && (
                <CommandGroup heading="Mobiliário e Patrimônio">
                  {results.furniture.map((item) => (
                    <CommandItem 
                      key={item.id} 
                      value={item.id}
                      onSelect={() => runCommand(`/admin/furniture/${item.id}`)}
                      className="cursor-pointer py-3"
                    >
                      <Package className="mr-3 h-4 w-4 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-500">Patrimônio: {item.patrimony || 'Sem número'}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.requests.length > 0 && (
                <CommandGroup heading="Movimentações Recentes">
                  {results.requests.map((req) => (
                    <CommandItem 
                      key={req.id} 
                      value={req.id}
                      onSelect={() => runCommand(`/admin/requests`)}
                      className="cursor-pointer py-3"
                    >
                      <ClipboardList className="mr-3 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{req.sector}</span>
                        <span className="text-xs text-slate-500">{req.furniture.name} • {req.status}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              <CommandSeparator />
              <CommandGroup heading="Atalhos">
                <CommandItem onSelect={() => runCommand('/')} className="cursor-pointer">
                   <History className="mr-3 h-4 w-4" />
                   Ir para o Dashboard
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}