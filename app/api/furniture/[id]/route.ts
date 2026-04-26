import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: any }) {
  const session = await auth();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const furniture = await prisma.furniture.findUnique({
      where: { id },
      include: {
        movements: { orderBy: { createdAt: "desc" } },
        requestItems: {
          include: {
            request: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!furniture)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    return NextResponse.json(furniture);
  } catch (error) {
    console.error("Erro no GET furniture:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await auth();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quantity, location, status, patrimony } = body;

    const current = await prisma.furniture.findUnique({ where: { id } });
    if (!current)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (location !== undefined) dataToUpdate.location = location;
    if (patrimony !== undefined) dataToUpdate.patrimony = patrimony;
    if (quantity !== undefined) dataToUpdate.quantity = quantity;

    const updated = await prisma.furniture.update({
      where: { id: id },
      data: dataToUpdate,
    });

    if (quantity !== undefined) {
      const diff = quantity - current.quantity;
      if (diff !== 0) {
        await prisma.movement.create({
          data: {
            furnitureId: id,
            type: diff > 0 ? "ENTRADA" : "SAIDA",
            quantity: Math.abs(diff),
            description: `Ajuste manual de estoque (Saldo: ${current.quantity} -> ${quantity})`,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro no PATCH furniture:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// NOVA FUNÇÃO: DELETAR ITEM (Para limpar itens de controle temporário)
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const session = await auth();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.furniture.delete({ where: { id } });
    return NextResponse.json({
      message: "Controle finalizado e item removido.",
    });
  } catch (error) {
    console.error("Erro no DELETE furniture:", error);
    return NextResponse.json(
      { error: "Erro ao remover item" },
      { status: 500 },
    );
  }
}
