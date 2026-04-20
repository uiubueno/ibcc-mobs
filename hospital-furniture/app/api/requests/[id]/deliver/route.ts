import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { furnitureId, status } = await req.json()
    let requestWithUser: any;

    // 1. TRIAGEM (Aprovar ou Recusar)
    if (status === 'RECUSADO' || status === 'EM_SEPARACAO') {
      requestWithUser = await prisma.request.update({
        where: { id },
        data: { status: status },
        include: { user: true } // Incluímos o user para pegar o e-mail do solicitante
      })
    }

    // 2. ENTREGA FINAL (Dar Baixa no Estoque)
    else if (furnitureId) {
      requestWithUser = await prisma.$transaction(async (tx) => {
        const request = await tx.request.update({
          where: { id },
          data: { 
            status: 'ENTREGUE',
            furnitureId: furnitureId
          },
          include: { user: true }
        })

        await tx.furniture.update({
          where: { id: furnitureId },
          data: { 
            location: request.sector,
            quantity: { decrement: request.quantity }
          }
        })

        await tx.movement.create({
          data: {
            furnitureId: furnitureId,
            type: 'TRANSFERENCIA',
            quantity: request.quantity,
            description: `Triagem aprovada. Item entregue para o setor: ${request.sector}`
          }
        })

        return request
      })
    }

    // --- LOGICA DE NOTIFICAÇÃO ESTILO SHOPEE ---
    if (requestWithUser && requestWithUser.user?.email) {
      let subject = "";
      let statusColor = "";
      let statusMessage = "";

      // Definindo a "cara" do e-mail baseado no que você clicou
      switch (requestWithUser.status) {
        case 'EM_SEPARACAO':
          subject = `🚚 Seu pedido de ${requestWithUser.type} foi APROVADO!`;
          statusColor = "#2563eb"; // Azul
          statusMessage = "A Hotelaria já aprovou sua solicitação e o item está em fase de separação no almoxarifado.";
          break;
        case 'ENTREGUE':
          subject = `✅ Item Entregue: ${requestWithUser.type}`;
          statusColor = "#16a34a"; // Verde
          statusMessage = "O mobiliário solicitado acaba de ser entregue no seu setor. Confira o recebimento!";
          break;
        case 'RECUSADO':
          subject = `❌ Atualização sobre sua solicitação`;
          statusColor = "#dc2626"; // Vermelho
          statusMessage = "Infelizmente sua solicitação não pôde ser atendida neste momento pela Hotelaria.";
          break;
      }

      if (subject) {
        try {
          await sendMail({
            to: requestWithUser.user.email,
            subject: subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: ${statusColor}; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">Status do Pedido</h1>
                </div>
                <div style="padding: 30px; color: #334155;">
                  <p>Olá, <strong>${requestWithUser.user.name}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6;">${statusMessage}</p>
                  <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Item:</strong> ${requestWithUser.type}</p>
                    <p style="margin: 5px 0;"><strong>Setor:</strong> ${requestWithUser.sector}</p>
                  </div>
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
                    IBCC Oncologia - Gestão de Fluxo Hospitalar
                  </p>
                </div>
              </div>
            `
          })
        } catch (err) {
          console.error("Erro ao enviar e-mail pro coordenador:", err)
        }
      }
    }

    return NextResponse.json(requestWithUser)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 })
  }
}