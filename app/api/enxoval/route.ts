import { prisma } from "@/lib/prisma"; // Verifique se o seu prisma export está aqui mesmo
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Busca o inventário (pega o primeiro registro ou cria um padrão se não existir)
    let inventory = await prisma.pillowInventory.findFirst();
    
    if (!inventory) {
      inventory = await prisma.pillowInventory.create({
        data: { stockLung: 0, stockCirculating: 114 }
      });
    }

    // Busca os últimos 50 movimentos
    const movements = await prisma.pillowMovement.findMany({
      orderBy: { date: 'desc' },
      take: 50
    });

    return NextResponse.json({ inventory, movements });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar dados do enxoval" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, quantity, destination, requester, stockLung, stockCirculating } = body;

    const currentInventory = await prisma.pillowInventory.findFirst();
    if (!currentInventory) return NextResponse.json({ error: "Inventário não inicializado" }, { status: 400 });

    // Ação 1: Registrar Saída (Pulmão -> Circulação)
    if (action === "MOVE") {
      if (currentInventory.stockLung < quantity) {
        return NextResponse.json({ error: "Saldo insuficiente no pulmão" }, { status: 400 });
      }

      const result = await prisma.$transaction([
        prisma.pillowInventory.update({
          where: { id: currentInventory.id },
          data: {
            stockLung: { decrement: quantity },
            stockCirculating: { increment: quantity }
          }
        }),
        prisma.pillowMovement.create({
          data: {
            quantity,
            destination,
            requester
          }
        })
      ]);

      return NextResponse.json(result);
    }

    // Ação 2: Ajuste Manual (Inventário Real)
    if (action === "ADJUST") {
      const updated = await prisma.pillowInventory.update({
        where: { id: currentInventory.id },
        data: {
          stockLung: parseInt(stockLung),
          stockCirculating: parseInt(stockCirculating)
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar movimentação" }, { status: 500 });
  }
}