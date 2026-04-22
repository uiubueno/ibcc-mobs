import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await auth()
  
  // Garantindo que pegamos o ID, seja o params uma Promise ou um Objeto
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status } = body

    if (status === 'RECUSADO') {
      // 1. Atualizamos o Pedido (Envelope)
      const requestWithUser = await prisma.request.update({
        where: { id },
        data: { status: 'RECUSADO' },
        include: { user: true } 
      })

      // 2. Atualizamos os itens (se existirem)
      await prisma.requestItem.updateMany({
        where: { requestId: id },
        data: { status: 'RECUSADO' }
      })

      // 3. E-mail de notificação (O seu "Shopee" Vermelho)
      if (requestWithUser.user?.email) {
        try {
          await sendMail({
            to: requestWithUser.user.email,
            subject: `❌ Atualização sobre seu pedido - ${requestWithUser.sector}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: #dc2626; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">Pedido Recusado</h1>
                </div>
                <div style="padding: 30px; color: #334155;">
                  <p>Olá, <strong>${requestWithUser.user.name}</strong>,</p>
                  <p>Infelizmente sua solicitação para o setor <strong>${requestWithUser.sector}</strong> não pôde ser atendida pela Hotelaria.</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">IBCC Oncologia</p>
                </div>
              </div>
            `
          })
        } catch (mailErr) {
          console.error("Erro ao enviar e-mail:", mailErr)
        }
      }

      return NextResponse.json({ message: 'Recusado com sucesso' })
    }
    
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error("ERRO NA ROTA DE RECUSA:", error) // OLHE O SEU TERMINAL QUANDO DER ERRO!
    return NextResponse.json({ error: 'Erro interno ao recusar' }, { status: 500 })
  }
}