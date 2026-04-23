import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await auth()
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { itemStatuses } = body 

    // 1. Buscamos o pedido com o usuário para poder mandar o e-mail depois
    const fullRequest = await prisma.request.findUnique({
      where: { id },
      include: { user: true, items: true }
    })

    if (!fullRequest) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    // 2. Atualizamos os itens um por um
    const updatePromises = Object.entries(itemStatuses).map(([itemId, status]) => {
      return prisma.requestItem.update({
        where: { id: itemId },
        data: { status: status as any }
      })
    })
    await prisma.$transaction(updatePromises)

    // 3. Atualiza o status do pedido pai para "Em Separação" (fluxo segue)
    await prisma.request.update({
      where: { id },
      data: { status: 'EM_SEPARACAO' }
    })

    // --- LÓGICA DE NOTIFICAÇÃO (Pós-Triagem) ---
    if (fullRequest.user?.email) {
      // Montamos um resumo do que aconteceu para o coordenador
      const itemsSummary = Object.entries(itemStatuses).map(([itemId, status]) => {
        const item = fullRequest.items.find(i => i.id === itemId)
        const statusText = status === 'EM_SEPARACAO' ? '✅ Aprovado (Em estoque)' : 
                          status === 'EM_COMPRA' ? '🛒 Enviado para Compra' : '❌ Recusado'
        return `<li><strong>${item?.quantity}x ${item?.type}</strong>: ${statusText}</li>`
      }).join('')

      try {
        await sendMail({
          to: fullRequest.user.email,
          subject: `📋 Resultado da Triagem: Pedido ${fullRequest.sector}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: #2563eb; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 20px;">Atualização do seu Pedido</h1>
              </div>
              <div style="padding: 30px; color: #334155;">
                <p>Olá, <strong>${fullRequest.user.name}</strong>,</p>
                <p>A Hotelaria realizou a triagem do seu pedido para o setor <strong>${fullRequest.sector}</strong>.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <ul style="padding-left: 20px; margin: 0;">${itemsSummary}</ul>
                </div>
                <p style="font-size: 14px; color: #64748b;">Itens em estoque serão entregues em breve. Itens para compra dependem do processo de Suprimentos.</p>
              </div>
            </div>
          `
        })
      } catch (err) {
        console.error("Erro ao enviar e-mail de triagem:", err)
      }
    }

    return NextResponse.json({ message: 'Triagem concluída e e-mail enviado.' })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao processar triagem' }, { status: 500 })
  }
}