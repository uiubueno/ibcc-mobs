import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail' // O "carteiro" que envia o e-mail

// GET: Lista as solicitações
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = session.user?.role === 'ADMIN'
  const where = isAdmin ? {} : { userId: session.user?.id }

  try {
    const requestsList = await prisma.request.findMany({
      where,
      include: {
        furniture: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(requestsList)
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error)
    return NextResponse.json({ error: 'Erro ao buscar solicitações.' }, { status: 500 })
  }
}

// POST: Cria uma nova solicitação e NOTIFICA o William
export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Você precisa estar logado para solicitar.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, sector, reason } = body

    if (!type || !sector || !reason) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }

    const newRequest = await prisma.request.create({
      data: {
        userId: session.user.id,
        type: type,
        sector: sector,
        reason: reason,
        status: 'PENDENTE',
        quantity: 1
      }
    })

    // --- FEATURE INSANA: NOTIFICAÇÃO POR E-MAIL ---
    // Enviando para o seu e-mail de trabalho
    try {
      await sendMail({
        to: 'william.peixoto@ibcc.org.br', // Ajuste para o seu e-mail exato do trabalho
        subject: `🚨 Nova Solicitação: ${type} - ${sector}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Nova Solicitação de Mobiliário</h2>
            <p>O coordenador <strong>${session.user.name}</strong> acabou de abrir um chamado.</p>
            <hr />
            <p><strong>Item:</strong> ${type}</p>
            <p><strong>Setor:</strong> ${sector}</p>
            <p><strong>Motivo:</strong> "${reason}"</p>
            <hr />
            <a href="${process.env.NEXTAUTH_URL}/admin/requests" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Analisar no Painel
            </a>
          </div>
        `
      })
    } catch (mailError) {
      // Se o e-mail falhar, logamos o erro mas não travamos o pedido do usuário
      console.error("Erro ao enviar e-mail de notificação:", mailError)
    }

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error("ERRO CRÍTICO NA API DE REQUESTS:", error)
    return NextResponse.json({ error: 'Erro interno ao processar sua solicitação.' }, { status: 500 })
  }
}