import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// Importe o seu mail.ts (Ajuste o caminho se ele não estiver dentro da pasta lib)
import { sendMail } from '@/lib/mail' 

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  
  // 1. Aguarda o ID ser resolvido
  const { id } = await params;

 if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, notes, rejectionReason } = body 
    
    // Busca os dados atuais da solicitação
    const requestData = await prisma.request.findUnique({ 
      where: { id: id }, 
      include: { items: true } 
    })
    
    if (!requestData) {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    // Lógica de Aprovação e Baixa de Estoque (Mantida)
    if (requestData.status === 'PENDENTE' && status === 'EM_SEPARACAO') {
      const updatedRequest = await prisma.request.update({
        where: { id: id },
        data: { 
          status, 
          notes, 
          rejectionReason, 
          reviewedAt: new Date(),
          // 🔥 CASCATA: Atualiza os itens também!
          items: {
            updateMany: {
              where: { requestId: id },
              data: { status: status }
            }
          }
        }
      })
      return NextResponse.json(updatedRequest)
    }

    // Atualização simples de status (Trânsito, Entregue, Recusado)
    const updatedRequest = await prisma.request.update({
      where: { id: id },
      data: { 
        status, 
        notes, 
        rejectionReason, 
        reviewedAt: new Date(),
        // 🔥 A MÁGICA AQUI: Cascata de status para os itens
        items: {
          updateMany: {
            where: { requestId: id },
            data: { status: status }
          }
        }
      },
      // Precisamos trazer o "user" aqui para saber para qual e-mail enviar!
      include: { user: true } 
    })

    // ==========================================
    // DISPARO DE E-MAIL DE RECUSA
    // ==========================================
    if (status === 'RECUSADO' && updatedRequest.user?.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Solicitação Recusada</h2>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Olá, <strong>${updatedRequest.user.name}</strong>.</p>
            <p style="font-size: 16px; line-height: 1.5;">Infelizmente, a solicitação de mobiliário para o setor <strong>${updatedRequest.sector}</strong> não pôde ser atendida neste momento pela equipe de Hotelaria.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Justificativa Técnica:</h4>
              <p style="margin: 0; color: #7f1d1d; font-size: 15px; font-style: italic;">"${rejectionReason}"</p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              Caso precise de mais esclarecimentos, por favor, entre em contato com a Hotelaria.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
              IBCC Oncologia &bull; Gestão de Ativos
            </p>
          </div>
        </div>
      `;

      // Chama a sua função de enviar e-mail
      await sendMail({
        to: updatedRequest.user.email,
        subject: `[IBCC Hotelaria] Atualização do Pedido - Setor ${updatedRequest.sector}`,
        html: emailHtml
      });
    }

    return NextResponse.json(updatedRequest)

  } catch (error: any) {
    console.error("ERRO NA LOGÍSTICA:", error)
    return NextResponse.json({ error: 'Erro interno ao processar movimentação.' }, { status: 500 })
  }
}