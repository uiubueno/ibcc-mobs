import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

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
        items: { include: { furniture: true } }, // Agora ele puxa a lista de itens dentro do pedido
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

// POST: Cria o "Envelope" de solicitação com vários itens dentro
export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Você precisa estar logado para solicitar.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { sector, items } = body // 'items' é o Array do carrinho

    if (!sector || !items || items.length === 0) {
      return NextResponse.json({ error: 'Preencha o setor e adicione itens ao pedido.' }, { status: 400 })
    }

    // Cria o Pedido (Envelope) e os Itens de uma vez só
    const newRequest = await prisma.request.create({
      data: {
        userId: session.user.id,
        sector: sector,
        status: 'PENDENTE',
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            quantity: item.quantity,
            reason: item.reason
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Monta uma listinha em HTML para o seu e-mail
    const itemsHtmlList = items.map((item: any) => 
      `<li><strong>${item.quantity}x ${item.type}</strong> <br/> <em>Motivo: ${item.reason}</em></li>`
    ).join('')

    // --- FEATURE INSANA: NOTIFICAÇÃO POR E-MAIL ---
    try {
      await sendMail({
        to: 'william.peixoto@ibcc.org.br',
        subject: `🚨 Novo Pedido Múltiplo: ${sector}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Novo Pedido de Mobiliário</h2>
            <p>O coordenador <strong>${session.user.name}</strong> acabou de abrir um chamado para o setor <strong>${sector}</strong>.</p>
            <hr />
            <h3>Itens Solicitados:</h3>
            <ul>
              ${itemsHtmlList}
            </ul>
            <hr />
            <br />
            <a href="${process.env.NEXTAUTH_URL}/admin/requests" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Analisar no Painel
            </a>
          </div>
        `
      })
    } catch (mailError) {
      console.error("Erro ao enviar e-mail de notificação:", mailError)
    }

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error("ERRO CRÍTICO NA API DE REQUESTS:", error)
    return NextResponse.json({ error: 'Erro interno ao processar sua solicitação.' }, { status: 500 })
  }
}