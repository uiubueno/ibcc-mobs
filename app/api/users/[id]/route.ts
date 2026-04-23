import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Atualizar um usuário (Nome, E-mail, Role ou Senha)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  try {
    const data = await request.json()
    const { id } = await params

    const updateData: any = {}

    // Se veio nome, atualiza
    if (data.name) updateData.name = data.name
    // Se veio e-mail, atualiza
    if (data.email) updateData.email = data.email
    // Se veio role, atualiza
    if (data.role) updateData.role = data.role
    
    // Se veio uma nova senha, criptografa ela antes de salvar
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true } // Não retorna a senha pro painel
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Deletar um usuário
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params

    // Segurança extra: O Admin não pode deletar a si mesmo por engano
    if (id === session?.user?.id) {
       return NextResponse.json({ error: "Você não pode deletar sua própria conta." }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: "Usuário removido com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: "Erro ao deletar. O usuário pode ter solicitações atreladas a ele." }, { status: 500 })
  }
}