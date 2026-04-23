import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET: Lista todos os usuários (Só ADMIN pode ver)
export async function GET() {
  const session = await auth()
  
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

// POST: Cria um novo usuário (Só ADMIN pode criar)
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
    }

    // Verifica se o e-mail já existe no banco
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso no sistema.' }, { status: 400 })
    }

    // Criptografa a senha antes de salvar (Nunca salve senhas em texto puro!)
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER', // Se não mandar cargo, por padrão é USER (Coordenador)
      }
    })

    // Retorna o usuário criado (sem a senha, por segurança)
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}