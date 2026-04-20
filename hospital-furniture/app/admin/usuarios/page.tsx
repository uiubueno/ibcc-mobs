'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Users, 
  ShieldCheck, 
  User, 
  Plus, 
  Mail, 
  Lock, 
  CheckCircle2 
} from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openNewUser, setOpenNewUser] = useState(false)

  // Estados do formulário
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('USER')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (e) {
      toast.error("Erro ao carregar lista de usuários.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    toast.promise(
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      }).then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Erro ao criar usuário')
        }
        return res.json()
      }),
      {
        loading: 'Criando credenciais...',
        success: () => {
          setOpenNewUser(false)
          setName(''); setEmail(''); setPassword(''); setRole('USER');
          fetchUsers()
          return 'Usuário criado com sucesso! Credenciais liberadas.'
        },
        error: (err) => err.message
      }
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Controle de Acessos
          </h1>
          <p className="text-slate-500 font-medium italic mt-1">Gestão de credenciais e permissões do hospital</p>
        </div>
        <Button 
          onClick={() => setOpenNewUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5 mr-2" /> Novo Acesso
        </Button>
      </header>

      {/* Lista de Usuários */}
      <Card className="border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Data de Criação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.role === 'ADMIN' ? (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 font-bold px-3 py-1 flex w-fit items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Gestor (Admin)
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 font-bold px-3 py-1 flex w-fit items-center gap-1">
                        <User className="w-3 h-3" /> Coordenador
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-400 font-medium">
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criação de Usuário */}
      <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Novo Acesso</DialogTitle>
            <DialogDescription className="font-medium">
              Crie uma credencial para um novo coordenador de setor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Silva" className="pl-9 bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail Corporativo</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@ibcc.org.br" className="pl-9 bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha Temporária</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 bg-slate-50 focus:bg-white" />
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nível de Permissão</Label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-700"
              >
                <option value="USER">Coordenador (Apenas solicita e acompanha pedidos)</option>
                <option value="ADMIN">Gestor Admin (Acesso total ao sistema e estoque)</option>
              </select>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Gerar Credencial
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}