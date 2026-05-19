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
  X 
} from 'lucide-react'

export function Navbar({ userName, userRole }: { userName?: string | null, userRole?: string | null }) {
  const pathname = usePathname()
  const [isEntrepostoOpen, setIsEntrepostoOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) 
  const menuRef = useRef<HTMLDivElement>(null)

  if (pathname === '/login') return null

  // Fecha o menu desktop se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEntrepostoOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fecha os menus ao mudar de página
  useEffect(() => {
    setIsEntrepostoOpen(false)
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
        className={`flex items-center gap-2 px-4 py-3 xl:py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-5 h-5 xl:w-4 xl:h-4" />
        {children}
      </Link>
    )
  }

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3 max-w-[1600px] mx-auto flex items-center justify-between gap-4 xl:gap-8">
        
        {/* LOGO OFICIAL + TEXTO */}
        <Link 
          href={userRole === 'ADMIN' ? "/" : "/solicitar"} 
          className="flex items-center gap-3 xl:gap-4 shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-10 h-10 xl:w-11 xl:h-11">
            <Image src="/logo-ibcc.png" alt="Logo IBCC Oncologia" fill className="object-contain" priority />
          </div>
          <div className="w-px h-6 xl:h-8 bg-slate-700" />
          <div className="flex flex-col justify-center">
            <span className="font-black text-white leading-none text-lg xl:text-xl tracking-tighter">IBCC</span>
            <span className="text-[9px] xl:text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Hotelaria</span>
          </div>
        </Link>

        {/* NAVEGAÇÃO DESKTOP (Oculta no celular) */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
          {userRole === 'ADMIN' && <NavLink href="/" icon={Home}>Início</NavLink>}
          
          <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
          <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
          
          {userRole === 'ADMIN' && (
            <>
              <div className="w-px h-4 bg-slate-800 mx-2" />
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              
              {/* DROPDOWN ENTREPOSTO (Desktop) */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsEntrepostoOpen(!isEntrepostoOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith('/admin/inventario')
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Warehouse className="w-4 h-4" />
                  Entreposto
                  <ChevronDown className={`w-3 h-3 transition-transform ${isEntrepostoOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEntrepostoOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-[60]">
                    <Link href="/admin/inventario/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                      <FileText className="w-4 h-4 text-blue-400" /> Painel e Relatório
                    </Link>
                    <Link href="/admin/inventario" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                      <Camera className="w-4 h-4 text-green-400" /> Câmera (Lançar)
                    </Link>
                  </div>
                )}
              </div>
              
              <NavLink href="/admin/maintenance" icon={Wrench}>Manutenção</NavLink>
              <NavLink href="/admin/requests" icon={LayoutDashboard}>Painel</NavLink>
              <NavLink href="/admin/usuarios" icon={Users}>Usuários</NavLink>
            </>
          )}
        </div>

        {/* BUSCA, USUÁRIO E BOTÃO MENU MOBILE */}
        <div className="flex items-center gap-2 xl:gap-6 shrink-0 justify-end">
          <div className="hidden md:block">
            {userRole === 'ADMIN' && <GlobalSearch />}
          </div>

          <div className="hidden xl:flex items-center gap-4 border-l border-slate-800 pl-6">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Usuário</span>
              <span className="text-sm text-slate-200 font-bold">{userName}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group" title="Sair do sistema">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* BOTÃO HAMBÚRGUER (Aparece só no celular/tablet) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MENU RETRÁTIL MOBILE */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-[#0f172a] border-t border-slate-800 px-4 py-4 space-y-2 flex flex-col shadow-inner">
          {userRole === 'ADMIN' && <NavLink href="/" icon={Home}>Início</NavLink>}
          <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
          <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
          
          {userRole === 'ADMIN' && (
            <>
              <div className="h-px bg-slate-800 my-2" />
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              
              {/* Entreposto Expandido no Mobile */}
              <div className="pl-2 border-l-2 border-blue-500/30 my-1 space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block pl-4 mb-1 mt-2">Entreposto</span>
                <NavLink href="/admin/inventario/dashboard" icon={FileText}>Painel e Relatório</NavLink>
                <NavLink href="/admin/inventario" icon={Camera}>Câmera (Lançar)</NavLink>
              </div>

              <div className="h-px bg-slate-800 my-2" />
              <NavLink href="/admin/maintenance" icon={Wrench}>Manutenção</NavLink>
              <NavLink href="/admin/requests" icon={LayoutDashboard}>Painel</NavLink>
              <NavLink href="/admin/usuarios" icon={Users}>Usuários</NavLink>
            </>
          )}

          <div className="h-px bg-slate-800 my-2" />
          
          {/* Rodapé do Menu Mobile: Nome do Usuário e Logout */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl mt-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Logado como</span>
              <span className="text-xs text-slate-300 font-bold">{userName}</span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors px-3 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}