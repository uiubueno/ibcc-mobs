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
  CheckCircle2,
  Pencil,
  Trash2,
  Key,
  AlertTriangle
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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para controle dos Modais
  const [openNewUser, setOpenNewUser] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [passwordUser, setPasswordUser] = useState<any>(null)

  // Estados do formulário de CRIAÇÃO
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('USER')

  // Estado para nova senha
  const [newPassword, setNewPassword] = useState('')

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

  // FUNÇÃO: CRIAR USUÁRIO
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.promise(
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar')
        return res.json()
      }),
      {
        loading: 'Criando credenciais...',
        success: () => {
          setOpenNewUser(false)
          setName(''); setEmail(''); setPassword(''); setRole('USER');
          fetchUsers()
          return 'Usuário criado com sucesso!'
        },
        error: (err) => err.message
      }
    )
  }

  // FUNÇÃO: ATUALIZAR DADOS
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    toast.promise(
      fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingUser.name, email: editingUser.email, role: editingUser.role })
      }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar')
        return res.json()
      }),
      {
        loading: 'Salvando alterações...',
        success: () => {
          setEditingUser(null)
          fetchUsers()
          return 'Cadastro atualizado com sucesso!'
        },
        error: (err) => err.message
      }
    )
  }

  // FUNÇÃO: TROCAR SENHA
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordUser || !newPassword) return

    toast.promise(
      fetch(`/api/users/${passwordUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erro ao trocar senha')
        return res.json()
      }),
      {
        loading: 'Criptografando e salvando nova senha...',
        success: () => {
          setPasswordUser(null)
          setNewPassword('')
          return 'Senha alterada com sucesso!'
        },
        error: (err) => err.message
      }
    )
  }

  // FUNÇÃO: DELETAR USUÁRIO
  const handleDeleteUser = async () => {
    if (!deletingUser) return

    toast.promise(
      fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erro ao deletar')
        return res.json()
      }),
      {
        loading: 'Removendo usuário do sistema...',
        success: () => {
          setDeletingUser(null)
          fetchUsers()
          return 'Usuário removido definitivamente.'
        },
        error: (err) => err.message
      }
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER RESPONSIVO: Quebra para a linha de baixo no celular */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 md:gap-3">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            Controle de Acessos
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic mt-1">Gestão de credenciais do hospital</p>
        </div>
        <Button 
          onClick={() => setOpenNewUser(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 h-12 md:h-10"
        >
          <Plus className="w-5 h-5 mr-2" /> Novo Acesso
        </Button>
      </header>

      {/* ÁREA DOS USUÁRIOS */}
      <Card className="border-none shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Carregando usuários...</div>
        ) : (
          <>
            {/* VISÃO DESKTOP: Tabela tradicional (Oculta no celular) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => (
                    <tr key={`desktop-${user.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                              Criado em {format(new Date(user.createdAt), "dd MMM yy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                      <td className="px-6 py-4">
                        {user.role === 'ADMIN' ? (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-bold px-3 py-1 flex w-fit items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Gestor (Admin)
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-3 py-1 flex w-fit items-center gap-1">
                            <User className="w-3 h-3" /> Coordenador
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingUser({ ...user })} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setPasswordUser({ ...user })} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Trocar Senha">
                            <Key className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingUser(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISÃO MOBILE: Cards interativos (Oculto no Desktop) */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map(user => (
                <div key={`mobile-${user.id}`} className="p-4 space-y-4 bg-white">
                  {/* Topo do Card: Avatar, Nome e Email */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 text-sm truncate">{user.name}</span>
                      <span className="text-xs text-slate-500 truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Meio do Card: Badge e Data */}
                  <div className="flex items-center justify-between">
                    {user.role === 'ADMIN' ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-bold px-2 py-0.5 flex w-fit items-center gap-1 text-[10px]">
                        <ShieldCheck className="w-3 h-3" /> Gestor
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2 py-0.5 flex w-fit items-center gap-1 text-[10px]">
                        <User className="w-3 h-3" /> Coordenador
                      </Badge>
                    )}
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                      Criado {format(new Date(user.createdAt), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Rodapé do Card: Ações em botões maiores para o toque */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => setEditingUser({ ...user })} 
                      className="flex-1 flex justify-center items-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button 
                      onClick={() => setPasswordUser({ ...user })} 
                      className="flex-1 flex justify-center items-center gap-2 py-2 bg-amber-50 text-amber-600 rounded-lg font-bold text-xs"
                    >
                      <Key className="w-3 h-3" /> Senha
                    </button>
                    <button 
                      onClick={() => setDeletingUser(user)} 
                      className="flex-1 flex justify-center items-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* OS MODAIS SE ADAPTAM SOZINHOS PELO "max-w-md / max-w-sm"    */}
      {/* Mas adicionei um 'w-[95vw]' no DialogContent por segurança. */}
      {/* ----------------------------------------------------------- */}

      {/* MODAL 1: CRIAR NOVO USUÁRIO */}
      <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black">Novo Acesso</DialogTitle>
            <DialogDescription className="font-medium text-xs md:text-sm">
              Crie uma credencial para um novo coordenador de setor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2 md:pt-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Silva" className="pl-9 h-10 md:h-12 bg-slate-50 focus:bg-white text-sm" />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">E-mail Corporativo</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@ibcc.org.br" className="pl-9 h-10 md:h-12 bg-slate-50 focus:bg-white text-sm" />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Senha Temporária</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 h-10 md:h-12 bg-slate-50 focus:bg-white text-sm" />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2 pb-2 md:pb-4">
              <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Nível de Permissão</Label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                className="flex h-10 md:h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-700"
              >
                <option value="USER">Coordenador</option>
                <option value="ADMIN">Gestor Admin</option>
              </select>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base rounded-xl">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Gerar Credencial
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR USUÁRIO */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black text-blue-900">Editar Cadastro</DialogTitle>
            <DialogDescription className="font-medium text-xs md:text-sm">
              Atualize os dados ou promova o usuário.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4 pt-2 md:pt-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Nome</Label>
                <Input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="h-10 md:h-12 text-sm" />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</Label>
                <Input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="h-10 md:h-12 text-sm" />
              </div>

              <div className="space-y-1.5 md:space-y-2 pb-2 md:pb-4">
                <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Nível de Permissão</Label>
                <select 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                  className="flex h-10 md:h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                >
                  <option value="USER">Coordenador</option>
                  <option value="ADMIN">Gestor Admin</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                Salvar Alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: TROCAR SENHA */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent className="max-w-sm w-[95vw] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black text-amber-600 flex items-center gap-2">
              <Key className="w-5 h-5" /> Redefinir Senha
            </DialogTitle>
            <DialogDescription className="font-medium text-xs md:text-sm">
              Criando nova senha para <strong>{passwordUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <div className="space-y-2 pb-2">
              <Input 
                required 
                type="password" 
                placeholder="Digite a nova senha..." 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                className="h-10 md:h-12 text-sm" 
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
              Salvar Nova Senha
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: DELETAR USUÁRIO */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="max-w-sm w-[95vw] sm:w-full border-red-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" /> Atenção!
            </DialogTitle>
            <DialogDescription className="text-slate-700 font-medium pt-2 text-sm">
              Você está prestes a excluir o acesso de <strong className="text-red-600">{deletingUser?.name}</strong>. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setDeletingUser(null)} className="w-full sm:w-auto h-12 md:h-10 rounded-xl md:rounded-md">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold h-12 md:h-10 rounded-xl md:rounded-md">
              Sim, Excluir Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        <p className="text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-6 md:mt-8 pb-4">
          IBCC ONCOLOGIA • HOTELARIA
        </p>
    </div>
  )
}