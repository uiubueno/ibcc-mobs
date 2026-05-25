import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quantity, location, status } = body;

    const currentFurniture = await prisma.furniture.findUnique({
      where: { id },
    });

    if (!currentFurniture) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Atualiza o status, localização e devolve a quantidade para o estoque
      await tx.furniture.update({
        where: { id },
        data: {
          quantity: currentFurniture.quantity + Number(quantity),
          location: location || "Estoque Central",
          status: status || "USADO",
        },
      });

      // 2. Gera o log perfeito de Logística Reversa para auditoria
      await tx.movement.create({
        data: {
          furnitureId: id,
          type: "ENTRADA",
          quantity: Number(quantity),
          description: `Logística Reversa / Devolução. Origem anterior: ${currentFurniture.location || "Setor não informado"}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na devolução:", error);
    return NextResponse.json({ error: "Erro ao registrar devolução." }, { status: 500 });
  }
}