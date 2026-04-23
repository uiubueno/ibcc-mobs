'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Chama o NextAuth para tentar logar
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    // Se deu certo, manda o usuário para a página inicial
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100">
        
        {/* CABEÇALHO COM LOGO OFICIAL */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-24 h-24 mb-4">
            <Image 
              src="/logo-ibcc.png" 
              alt="Logo IBCC Oncologia" 
              fill
              className="object-contain" 
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Hotelaria
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestão de Mobiliário e Ativos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
              E-mail Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition-all font-medium"
              placeholder="seu.email@ibcc.org.br"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 mt-4"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>

      <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-12">
        IBCC Oncologia • Hotelaria
      </p>
    </div>
  )
}