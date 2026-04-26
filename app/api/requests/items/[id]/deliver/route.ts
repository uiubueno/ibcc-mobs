import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params; // ID DO ITEM

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { furnitureId, status } = body;

    // REMOVIDO: a trava que exigia o furnitureId
    if (status !== "ENTREGUE") {
      return NextResponse.json(
        { error: "Status inválido para entrega." },
        { status: 400 },
      );
    }

    // 1. Busca o item que está sendo entregue e o "Envelope" pai
    const requestItem = await prisma.requestItem.findUnique({
      where: { id },
      include: { request: { include: { user: true } } },
    });

    if (!requestItem)
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 },
      );

    // 2. Transação para atualizar tudo com segurança
    await prisma.$transaction(async (tx) => {
      // Atualiza o status do item. Se não tiver etiqueta, grava como nulo.
      await tx.requestItem.update({
        where: { id },
        data: { status: "ENTREGUE", furnitureId: furnitureId || null },
      });

      // SE vier um móvel do estoque, faz a logística de baixa e movimentação
      if (furnitureId) {
        const currentFurniture = await tx.furniture.findUnique({
          where: { id: furnitureId },
        });

        if (
          currentFurniture &&
          currentFurniture.quantity >= requestItem.quantity
        ) {
          await tx.furniture.update({
            where: { id: furnitureId },
            data: {
              location: requestItem.request.sector,
              quantity: currentFurniture.quantity - requestItem.quantity,
            },
          });

          await tx.movement.create({
            data: {
              furnitureId: furnitureId,
              type: "SAIDA",
              quantity: requestItem.quantity,
              description: `Entrega de item aprovada via carrinho para o setor: ${requestItem.request.sector}`,
            },
          });
        } else {
          throw new Error(
            "Quantidade insuficiente no estoque para realizar esta entrega.",
          );
        }
      }

      // Checa se TODOS os itens do carrinho já foram entregues ou recusados.
      // Se sim, marca o Envelope inteiro como ENTREGUE
      const allItems = await tx.requestItem.findMany({
        where: { requestId: requestItem.requestId },
      });
      const allDelivered = allItems.every(
        (i) => i.status === "ENTREGUE" || i.status === "RECUSADO",
      );
      if (allDelivered) {
        await tx.request.update({
          where: { id: requestItem.requestId },
          data: { status: "ENTREGUE" },
        });
      }
    });

    // --- NOTIFICAÇÃO ESTILO SHOPEE (VERDE) ---
    if (requestItem.request.user?.email) {
      try {
        await sendMail({
          to: requestItem.request.user.email,
          subject: `✅ Item Entregue: ${requestItem.quantity}x ${requestItem.type}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: #16a34a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Item Entregue!</h1>
              </div>
              <div style="padding: 30px; color: #334155;">
                <p>Olá, <strong>${requestItem.request.user.name}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">O mobiliário solicitado acaba de ser entregue no seu setor. Confira o recebimento!</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Item:</strong> ${requestItem.quantity}x ${requestItem.type}</p>
                  <p style="margin: 5px 0;"><strong>Setor:</strong> ${requestItem.request.sector}</p>
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
                  IBCC Oncologia - Gestão de Fluxo Hospitalar
                </p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error("Erro ao enviar e-mail pro coordenador:", err);
      }
    }

    return NextResponse.json({ message: "Entrega registrada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao processar entrega de item:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno." },
      { status: 500 },
    );
  }
}
