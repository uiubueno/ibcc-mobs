'use client'

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
  ClipboardList 
} from 'lucide-react'

export function Navbar({ userName, userRole }: { userName?: string | null, userRole?: string | null }) {
  const pathname = usePathname()

  if (pathname === '/login') return null

  const NavLink = ({ href, icon: Icon, children }: any) => {
    const active = pathname === href
    return (
      <Link 
        href={href} 
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
        
        {/* LOGO OFICIAL + TEXTO (Ajustado o espaçamento) */}
        <Link 
          href={userRole === 'ADMIN' ? "/" : "/solicitar"} 
          className="flex items-center gap-4 shrink-0 hover:opacity-80 transition-opacity"
        >
          {/* Caixa da imagem ajustada para formato quadrado (w-11 h-11) */}
          <div className="relative w-11 h-11">
            <Image 
              src="/logo-ibcc.png" 
              alt="Logo IBCC Oncologia" 
              fill
              className="object-contain" 
              priority
            />
          </div>
          
          {/* Divisória e Texto */}
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
            
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 group"
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}