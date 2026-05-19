'use client'

import { useState, useRef, useEffect } from 'react' // Adicionado hooks para o menu
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
  ChevronDown, // Ícone para indicar o menu
  FileText
} from 'lucide-react'

export function Navbar({ userName, userRole }: { userName?: string | null, userRole?: string | null }) {
  const pathname = usePathname()
  const [isEntrepostoOpen, setIsEntrepostoOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  if (pathname === '/login') return null

  // Fecha o menu se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEntrepostoOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fecha o menu quando mudar de página
  useEffect(() => {
    setIsEntrepostoOpen(false)
  }, [pathname])

  const NavLink = ({ href, icon: Icon, children, onClick }: any) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href))
    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Icon className="w-4 h-4" />
        {children}
      </Link>
    )
  }

  return (
    <nav className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
        
        {/* LOGO OFICIAL */}
        <Link 
          href={userRole === 'ADMIN' ? "/" : "/solicitar"} 
          className="flex items-center gap-4 shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-11 h-11">
            <Image src="/logo-ibcc.png" alt="Logo IBCC Oncologia" fill className="object-contain" priority />
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex flex-col justify-center">
            <span className="font-black text-white leading-none text-xl tracking-tighter">IBCC</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Hotelaria</span>
          </div>
        </Link>

        {/* NAVEGAÇÃO CENTRAL */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
          {userRole === 'ADMIN' && <NavLink href="/" icon={Home}>Início</NavLink>}
          
          <NavLink href="/solicitar" icon={PlusCircle}>Solicitar</NavLink>
          <NavLink href="/meus-pedidos" icon={ClipboardList}>Acompanhamento</NavLink>
          
          {userRole === 'ADMIN' && (
            <>
              <div className="w-px h-4 bg-slate-800 mx-2" />
              <NavLink href="/admin/furniture" icon={Package}>Estoque</NavLink>
              <NavLink href="/admin/enxoval" icon={Bed}>Enxoval</NavLink>
              
              {/* ✅ MENU DROPDOWN DO ENTREPOSTO */}
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
                    <Link 
                      href="/admin/inventario/dashboard"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      Painel e Relatório
                    </Link>
                    <Link 
                      href="/admin/inventario"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                    >
                      <Camera className="w-4 h-4 text-green-400" />
                      Câmera (Lançar)
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

        {/* BUSCA E USUÁRIO */}
        <div className="flex items-center gap-6 grow justify-end">
          {userRole === 'ADMIN' && <GlobalSearch />}
          <div className="flex items-center gap-4 border-l border-slate-800 pl-6 shrink-0">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Usuário</span>
              <span className="text-sm text-slate-200 font-bold">{userName}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 transition-all group" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}