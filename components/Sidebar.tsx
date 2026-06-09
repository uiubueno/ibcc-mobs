'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { GlobalSearch } from './GlobalSearch'
import { 
  Home, PlusCircle, Package, Wrench, LayoutDashboard, LogOut,
  Users, ClipboardList, Bed, Warehouse, Camera, ChevronDown,
  FileText, Menu, X, RefreshCcw, ChevronLeft, ChevronRight
} from 'lucide-react'

export function Navbar({ userName, userRole }: { userName?: string | null, userRole?: string | null }) {
  const pathname = usePathname()
  
  // Controle da Sidebar Retrátil (Desktop) e Menu (Mobile)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  // Controle dos submenus (Accordions)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    entreposto: false,
    manutencao: false,
    painel: false
  })

  if (pathname === '/login') return null

  // Fecha o menu mobile ao mudar de página
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const toggleMenu = (menu: string) => {
    // Se estiver recolhida, expande a sidebar automaticamente ao clicar num submenu
    if (isCollapsed) setIsCollapsed(false)
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  // COMPONENTE DE LINK REUTILIZÁVEL (Adaptado para Sidebar)
  const NavLink = ({ href, icon: Icon, children }: any) => {
    const active = pathname.startsWith('/admin/inventario') && href.includes('/inventario') 
      ? true : pathname === href || (href !== '/' && pathname.startsWith(href))

    return (
      <Link 
        href={href} 
        title={isCollapsed ? children : undefined} // Mostra o nome ao passar o mouse se estiver recolhido
        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap overflow-hidden ${
          active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          {children}
        </span>
      </Link>
    )
  }

  return (
    <>
      {/* ========================================= */}
      {/* MENU MOBILE (Topo Fixo - Só aparece no celular) */}
      {/* ========================================= */}
      <div className="xl:hidden bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 flex items-center justify-between p-4">
        <Link href={userRole === 'ADMIN' ? "/" : "/solicitar"} className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image src="/logo-ibcc.png" alt="Logo IBCC" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white leading-none text-lg">IBCC</span>
            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Hotelaria</span>
          </div>
        </Link>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-slate-300">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="xl:hidden fixed inset-0 top-[65px] bg-[#0f172a] z-40 overflow-y-auto p-4 flex flex-col gap-2">
          {userRole === 'ADMIN' && <NavLink href="/" icon={Home}>Início</NavLink>}
          <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
          <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
          
          {userRole === 'ADMIN' && (
            <>
              <div className="h-px bg-slate-800 my-2" />
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              <NavLink href="/admin/inventario" icon={Camera}>Câmera (Lançar)</NavLink>
              <NavLink href="/admin/maintenance" icon={Wrench}>Oficina (Reparos)</NavLink>
              <NavLink href="/admin/requests" icon={LayoutDashboard}>Painel de Triagem</NavLink>
              <NavLink href="/admin/usuarios" icon={Users}>Usuários</NavLink>
            </>
          )}
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-auto flex items-center gap-3 p-3 bg-red-500/10 text-red-400 rounded-xl font-bold">
            <LogOut className="w-5 h-5" /> Sair do Sistema
          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* SIDEBAR DESKTOP (Lateral Esquerda Fixa) */}
      {/* ========================================= */}
      <aside 
        className={`hidden xl:flex flex-col bg-[#0f172a] border-r border-slate-800 h-screen sticky top-0 transition-all duration-300 z-50 ${
          isCollapsed ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        {/* TOPO DA SIDEBAR (Logo e Botão de Retrair) */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 h-[80px]">
          <Link href={userRole === 'ADMIN' ? "/" : "/solicitar"} className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'hidden' : 'flex'}`}>
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/logo-ibcc.png" alt="Logo IBCC" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white leading-none text-xl tracking-tighter">IBCC</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Hotelaria</span>
            </div>
          </Link>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0 mx-auto"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* ÁREA DE SCROLL DOS LINKS */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-1 custom-scrollbar">
          {userRole === 'ADMIN' ? (
            <>
              <NavLink href="/" icon={Home}>Início</NavLink>
              <NavLink href="/solicitar" icon={PlusCircle}>Nova Solicitação</NavLink>
              
              <div className="my-2 border-b border-slate-800" />
              
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              
              {/* ACCORDION ENTREPOSTO */}
              <div>
                <button onClick={() => toggleMenu('entreposto')} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${openMenus.entreposto && !isCollapsed ? 'bg-slate-800 text-white' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Warehouse className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>Entreposto</span>}
                  </div>
                  {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.entreposto ? 'rotate-180' : ''}`} />}
                </button>
                {openMenus.entreposto && !isCollapsed && (
                  <div className="pl-11 pr-2 py-2 flex flex-col gap-1">
                    <Link href="/admin/inventario/dashboard" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Painel Relatórios</Link>
                    <Link href="/admin/inventario" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Câmera Lançamento</Link>
                  </div>
                )}
              </div>

              {/* ACCORDION MANUTENÇÃO */}
              <div>
                <button onClick={() => toggleMenu('manutencao')} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${openMenus.manutencao && !isCollapsed ? 'bg-slate-800 text-white' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>Manutenção</span>}
                  </div>
                  {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.manutencao ? 'rotate-180' : ''}`} />}
                </button>
                {openMenus.manutencao && !isCollapsed && (
                  <div className="pl-11 pr-2 py-2 flex flex-col gap-1">
                    <Link href="/admin/maintenance" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Oficina (Reparos)</Link>
                    <Link href="/admin/emprestimos" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Emprestados</Link>
                  </div>
                )}
              </div>

              {/* ACCORDION PAINEL */}
              <div>
                <button onClick={() => toggleMenu('painel')} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${openMenus.painel && !isCollapsed ? 'bg-slate-800 text-white' : ''}`}>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>Painel</span>}
                  </div>
                  {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.painel ? 'rotate-180' : ''}`} />}
                </button>
                {openMenus.painel && !isCollapsed && (
                  <div className="pl-11 pr-2 py-2 flex flex-col gap-1">
                    <Link href="/admin/requests" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Triagem Pedidos</Link>
                    <Link href="/meus-pedidos" className="text-xs font-semibold text-slate-400 hover:text-white py-2">Meus Pedidos</Link>
                  </div>
                )}
              </div>

              <div className="my-2 border-b border-slate-800" />
              <NavLink href="/admin/usuarios" icon={Users}>Usuários do Sistema</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/solicitar" icon={PlusCircle}>Solicitar Material</NavLink>
              <NavLink href="/meus-pedidos" icon={ClipboardList}>Meus Pedidos</NavLink>
            </>
          )}
        </div>

        {/* RODAPÉ DA SIDEBAR (Usuário e Logout) */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          {!isCollapsed && userRole === 'ADMIN' && <GlobalSearch />}
          
          <div className={`flex items-center gap-3 bg-slate-900 rounded-xl overflow-hidden transition-all ${isCollapsed ? 'p-2 justify-center' : 'p-3'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logado como</span>
                <span className="text-xs text-white font-bold truncate">{userName}</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            title="Sair do sistema"
            className={`flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all ${isCollapsed ? 'p-3' : 'py-3 px-4'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  )
}