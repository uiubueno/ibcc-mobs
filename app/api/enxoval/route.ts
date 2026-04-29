import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Busca o inventário ou cria com o estoque mínimo padrão (20)
    let inventory = await prisma.pillowInventory.findFirst();
    
    if (!inventory) {
      inventory = await prisma.pillowInventory.create({
        data: { 
          stockLung: 0, 
          stockCirculating: 114,
          minimumStock: 20 // Valor padrão inicial
        }
      });
    }

    // Busca os últimos 100 movimentos (aumentamos para o relatório ficar mais completo)
    const movements = await prisma.pillowMovement.findMany({
      orderBy: { date: 'desc' },
      take: 100
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
    const { 
      action, 
      quantity, 
      destination, 
      requester, 
      reason, // Novo campo para perdas
      stockLung, 
      stockCirculating, 
      minimumStock // Novo campo para ajuste
    } = body;

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
            requester,
            type: "SAIDA" // Identifica que é uma saída comum
          }
        })
      ]);

      return NextResponse.json(result);
    }

    // Ação 2: Registrar Baixa/Perda (Retira da Circulação definitivamente)
    if (action === "LOSS") {
      if (currentInventory.stockCirculating < quantity) {
        return NextResponse.json({ error: "Quantidade de perda maior que o estoque em circulação" }, { status: 400 });
      }

      const result = await prisma.$transaction([
        prisma.pillowInventory.update({
          where: { id: currentInventory.id },
          data: {
            stockCirculating: { decrement: quantity }
          }
        }),
        prisma.pillowMovement.create({
          data: {
            quantity,
            type: "PERDA", // Identifica como perda no histórico
            reason,        // Grava o motivo (Contaminação, Rasgado, etc)
            destination: "BAIXA DEFINITIVA"
          }
        })
      ]);

      return NextResponse.json(result);
    }

    // Ação 3: Ajuste Manual (Inventário Real + Estoque Mínimo)
    if (action === "ADJUST") {
      const updated = await prisma.pillowInventory.update({
        where: { id: currentInventory.id },
        data: {
          stockLung: parseInt(stockLung),
          stockCirculating: parseInt(stockCirculating),
          minimumStock: parseInt(minimumStock) // Agora atualiza o limite de alerta também
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