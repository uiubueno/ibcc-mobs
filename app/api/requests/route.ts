import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

// GET: Lista as solicitações
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

 const isAdmin = (session.user as any)?.role === 'ADMIN'
  const where = isAdmin ? {} : { userId: session.user?.id }

  try {
    const requestsList = await prisma.request.findMany({
      where,
      include: {
        items: { include: { furniture: true } },
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
    // Pegando os dados da IA que o Frontend mandou
    const { sector, items, aiSummary, isUrgent } = body 

    if (!sector || !items || items.length === 0) {
      return NextResponse.json({ error: 'Preencha o setor e adicione itens ao pedido.' }, { status: 400 })
    }

    // Cria o Pedido salvando o resumo e a urgência
    const newRequest = await prisma.request.create({
      data: {
        userId: session.user.id,
        sector: sector,
        status: 'PENDENTE',
        aiSummary: aiSummary || null,  
        isUrgent: isUrgent || false,   
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

    const itemsHtmlList = items.map((item: any) => 
      `<li><strong>${item.quantity}x ${item.type}</strong> <br/> <em>Motivo: ${item.reason}</em></li>`
    ).join('')

    // Monta o alerta vermelho no e-mail caso seja urgente
    const alertHtml = isUrgent 
      ? `<div style="background-color: #fee2e2; color: #dc2626; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-weight: bold; border: 1px solid #f87171;">🚨 ALERTA: A IA classificou este pedido como URGENTE.</div>` 
      : '';

    // --- NOTIFICAÇÃO POR E-MAIL (SEM AWAIT PARA A TELA NÃO TRAVAR) ---
    sendMail({
      to: 'william.peixoto@ibcc.org.br',
      subject: `${isUrgent ? '🚨 URGENTE: ' : ''}Novo Pedido - ${sector}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563eb;">Novo Pedido de Mobiliário</h2>
          ${alertHtml}
          <p>O colaborador <strong>${session.user.name}</strong> acabou de abrir um chamado para o setor <strong>${sector}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 10px; border-left: 4px solid #2563eb; margin: 15px 0;">
            <strong>🤖 Resumo da IA:</strong> ${aiSummary || 'Não gerado'}
          </div>

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
    }).catch((mailError) => console.error("Erro ao enviar e-mail de notificação:", mailError));

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error("ERRO CRÍTICO NA API DE REQUESTS:", error)
    return NextResponse.json({ error: 'Erro interno ao processar sua solicitação.' }, { status: 500 })
  }
}