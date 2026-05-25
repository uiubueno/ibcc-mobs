'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { GlobalSearch } from './GlobalSearch'
import { 
  Home, 
  PlusCircle, 
  Package, 
  Wrench, 
  LayoutDashboard, 
  LogOut,
  Users,
  ClipboardList,
  Bed,
  Warehouse,
  Camera,
  ChevronDown,
  FileText,
  Menu,
  X,
  RefreshCcw
} from 'lucide-react'

export function Navbar({ userName, userRole }: { userName?: string | null, userRole?: string | null }) {
  const pathname = usePathname()
  
  const [isEntrepostoOpen, setIsEntrepostoOpen] = useState(false)
  const [isManutencaoOpen, setIsManutencaoOpen] = useState(false) 
  const [isPainelOpen, setIsPainelOpen] = useState(false) 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) 
  
  const entrepostoRef = useRef<HTMLDivElement>(null)
  const manutencaoRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  if (pathname === '/login') return null

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (entrepostoRef.current && !entrepostoRef.current.contains(event.target as Node)) {
        setIsEntrepostoOpen(false)
      }
      if (manutencaoRef.current && !manutencaoRef.current.contains(event.target as Node)) {
        setIsManutencaoOpen(false)
      }
      if (painelRef.current && !painelRef.current.contains(event.target as Node)) {
        setIsPainelOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setIsEntrepostoOpen(false)
    setIsManutencaoOpen(false)
    setIsPainelOpen(false)
    setIsMobileMenuOpen(false)
  }, [pathname])

  const NavLink = ({ href, icon: Icon, children, onClick }: any) => {
    const active = pathname.startsWith('/admin/inventario') && href.includes('/inventario') 
      ? true 
      : pathname === href || (href !== '/' && pathname.startsWith(href))

    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
          active 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
      </Link>
    )
  }

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50">
      <div className="px-4 py-3 max-w-[1600px] mx-auto flex items-center justify-between gap-4 w-full">
        
        <div className="flex shrink-0">
          <Link 
            href={userRole === 'ADMIN' ? "/" : "/solicitar"} 
            className="flex items-center gap-3 lg:gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10">
              <Image src="/logo-ibcc.png" alt="Logo IBCC" fill className="object-contain" priority />
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex flex-col justify-center">
              <span className="font-black text-white leading-none text-xl tracking-tighter">IBCC</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Hotelaria</span>
            </div>
          </Link>
        </div>

        <div className="hidden xl:flex flex-1 items-center justify-center min-w-0">
          <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/50 whitespace-nowrap">
            
            {userRole === 'ADMIN' ? (
              <>
                <NavLink href="/" icon={Home}>Início</NavLink>
                <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
                
                <div className="w-px h-5 bg-slate-800 mx-2" />
                
                <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
                <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
                
                <div className="relative" ref={entrepostoRef}>
                  <button
                    onClick={() => setIsEntrepostoOpen(!isEntrepostoOpen)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      pathname.startsWith('/admin/inventario')
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>Entreposto</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isEntrepostoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEntrepostoOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-[60]">
                      <Link href="/admin/inventario/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <FileText className="w-4 h-4 text-blue-400" /> Painel Relatórios
                      </Link>
                      <Link href="/admin/inventario" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <Camera className="w-4 h-4 text-green-400" /> Câmera (Lançar)
                      </Link>
                    </div>
                  )}
                </div>

                <div className="relative" ref={manutencaoRef}>
                  <button
                    onClick={() => setIsManutencaoOpen(!isManutencaoOpen)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      pathname.startsWith('/admin/maintenance') || pathname.startsWith('/admin/emprestimos')
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Manutenção</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isManutencaoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isManutencaoOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-[60]">
                      <Link href="/admin/maintenance" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <Wrench className="w-4 h-4 text-amber-400" /> Oficina (Reparos)
                      </Link>
                      <Link href="/admin/emprestimos" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <RefreshCcw className="w-4 h-4 text-purple-400" /> Emprestados
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="relative" ref={painelRef}>
                  <button
                    onClick={() => setIsPainelOpen(!isPainelOpen)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      pathname.startsWith('/admin/requests') || pathname.startsWith('/meus-pedidos')
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Painel</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isPainelOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isPainelOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-[60]">
                      <Link href="/admin/requests" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-blue-400" /> Triagem de Pedidos
                      </Link>
                      <Link href="/meus-pedidos" className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <ClipboardList className="w-4 h-4 text-amber-400" /> Meus Pedidos
                      </Link>
                    </div>
                  )}
                </div>

                <NavLink href="/admin/usuarios" icon={Users}>Usuários</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/solicitar" icon={PlusCircle}>Solicitar Material</NavLink>
                <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 justify-end">
          
          <div className="hidden xl:block">
            {userRole === 'ADMIN' && <GlobalSearch />}
          </div>

          <div className="hidden xl:flex items-center gap-4 border-l border-slate-800 pl-4">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logado como</span>
              {/* O userName completo volta a ser exibido aqui */}
              <span className="text-sm text-slate-200 font-bold truncate max-w-[150px]" title={userName || ''}>
                {userName || 'Usuário'}
              </span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })} 
              className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group" 
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="xl:hidden bg-[#0f172a] border-t border-slate-800 px-4 py-4 space-y-2 flex flex-col shadow-inner max-h-[85vh] overflow-y-auto">
          {userRole === 'ADMIN' && <NavLink href="/" icon={Home}>Início</NavLink>}
          <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
          <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
          
          {userRole === 'ADMIN' && (
            <>
              <div className="h-px bg-slate-800 my-2" />
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              
              <div className="pl-2 border-l-2 border-blue-500/30 my-1 space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block pl-4 mb-1 mt-2">Entreposto</span>
                <NavLink href="/admin/inventario/dashboard" icon={FileText}>Painel e Relatório</NavLink>
                <NavLink href="/admin/inventario" icon={Camera}>Câmera (Lançar)</NavLink>
              </div>

              <div className="pl-2 border-l-2 border-amber-500/30 my-1 space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block pl-4 mb-1 mt-2">Manutenção</span>
                <NavLink href="/admin/maintenance" icon={Wrench}>Oficina (Reparos)</NavLink>
                <NavLink href="/admin/emprestimos" icon={RefreshCcw}>Emprestados</NavLink>
              </div>

              <div className="h-px bg-slate-800 my-2" />
              <NavLink href="/admin/requests" icon={LayoutDashboard}>Painel de Triagem</NavLink>
              <NavLink href="/admin/usuarios" icon={Users}>Usuários</NavLink>
            </>
          )}

          <div className="h-px bg-slate-800 my-2" />
          
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl mt-2">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Logado como</span>
              <span className="text-xs text-slate-300 font-bold truncate">{userName}</span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors px-3 py-2 rounded-lg shrink-0"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}