import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const resolvedParams = await params;
  const id = resolvedParams.id; 

  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { furnitureId, status, customPatrimony } = body; // <--- Recebe o customPatrimony

    if (status !== "ENTREGUE") {
      return NextResponse.json(
        { error: "Status inválido para entrega." },
        { status: 400 },
      );
    }

    const requestItem = await prisma.requestItem.findUnique({
      where: { id },
      include: { request: { include: { user: true } } },
    });

    if (!requestItem)
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 },
      );

    await prisma.$transaction(async (tx) => {
      let finalFurnitureId = furnitureId;

      // 🔥 MÁGICA: Se for entrega direta MAS tem patrimônio informado (Cria no banco na hora)
      if (!furnitureId && customPatrimony) {
        const newFurniture = await tx.furniture.create({
          data: {
            name: requestItem.type, 
            type: requestItem.type,
            quantity: requestItem.quantity, // Dá entrada para poder dar saída logo abaixo
            status: "NOVO",
            location: "Estoque Central", 
            patrimony: customPatrimony,
          }
        });

        // Log de entrada
        await tx.movement.create({
          data: {
            furnitureId: newFurniture.id,
            type: "ENTRADA",
            quantity: requestItem.quantity,
            description: "Entrada automática via compra direta com plaqueta de patrimônio.",
          },
        });

        finalFurnitureId = newFurniture.id;
      }

      // Atualiza o status do item
      await tx.requestItem.update({
        where: { id },
        data: { status: "ENTREGUE", furnitureId: finalFurnitureId || null },
      });

      // Se veio do estoque (ou se acabou de ser criado pela mágica acima)
      if (finalFurnitureId) {
        const currentFurniture = await tx.furniture.findUnique({
          where: { id: finalFurnitureId },
        });

        if (
          currentFurniture &&
          currentFurniture.quantity >= requestItem.quantity
        ) {
          await tx.furniture.update({
            where: { id: finalFurnitureId },
            data: {
              location: requestItem.request.sector,
              quantity: currentFurniture.quantity - requestItem.quantity,
            },
          });

          await tx.movement.create({
            data: {
              furnitureId: finalFurnitureId,
              type: "SAIDA",
              quantity: requestItem.quantity,
              description: `Entrega aprovada para o setor: ${requestItem.request.sector}`,
            },
          });
        } else {
          throw new Error("Quantidade insuficiente no estoque.");
        }
      }

      // Checa se todos os itens do carrinho já foram entregues
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

    // E-mail verde (Entrega)
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
        console.error("Erro ao enviar e-mail de entrega:", err);
      }
    }

    return NextResponse.json({ message: "Entrega registrada com sucesso!" });
  } catch (error: any) {
    console.error("ERRO NA ROTA DE ENTREGA:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno." },
      { status: 500 },
    );
  }
}