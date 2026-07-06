import { generateText } from "ai";
import { groqModel } from "@/lib/groq";
import { z } from "zod";

export const maxDuration = 30;

const requestSchema = z.object({
  sector: z.string().min(1),
  items: z.array(
    z.object({
      quantity: z.number(),
      type: z.string(),
      reason: z.string(),
    })
  ),
});

const responseSchema = z.object({
  summary: z.string().max(80),
  isUrgent: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsedRequest = requestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return Response.json(
        {
          summary: "Requisição inválida.",
          isUrgent: false,
        },
        { status: 400 }
      );
    }

    const { sector, items } = parsedRequest.data;

    const itemsText = items
      .map(
        (item) =>
          `- ${item.quantity}x ${item.type}\nMotivo: ${item.reason}`
      )
      .join("\n\n");

const prompt = `
Você é um analista especialista em mobiliário hospitalar do IBCC Oncologia.

Sua função é analisar solicitações de mobiliário e decidir se elas realmente devem ser tratadas como URGENTES.

SETOR:
${sector}

ITENS SOLICITADOS:
${itemsText}

Sua resposta deve considerar exclusivamente o risco à segurança e ao funcionamento do hospital.

Considere "isUrgent": true APENAS quando houver uma condição que represente risco ou impeça a execução segura das atividades.

São considerados URGENTES:

• risco de queda do paciente;
• risco de queda do colaborador;
• risco à integridade física do paciente;
• risco à integridade física do colaborador;
• risco de infecção;
• risco de contaminação cruzada;
• mobiliário quebrado, instável ou danificado que impeça seu uso seguro;
• quebra total que impeça o funcionamento do setor;
• impacto direto na assistência em UTI, Centro Cirúrgico ou Quimioterapia;
• mobiliário inadequado que coloque em risco colaboradores, incluindo pessoas com deficiência (PCDs), durante a execução das atividades;
• qualquer situação que possa causar acidentes ou comprometer a segurança de pacientes ou colaboradores.

NÃO são considerados URGENTES:

• rasgos, manchas ou desgaste apenas estético;
• móveis antigos, porém ainda funcionais;
• pintura descascada;
• pequenas avarias sem risco à segurança;
• solicitações por conforto, padronização ou melhoria visual;
• troca por preferência do setor;
• qualquer situação que não apresente risco à segurança nem impeça o funcionamento do setor.

Na dúvida, priorize a segurança.

Se não houver risco ou impedimento operacional, responda "isUrgent": false.

Responda SOMENTE um JSON válido.

Formato obrigatório:

{
  "summary": "Resumo com no máximo 10 palavras",
  "isUrgent": true
}

Não utilize markdown.
Não utilize crases.
Não escreva explicações.
Não escreva texto antes ou depois do JSON.
`;

    const { text } = await generateText({
      model: groqModel,
      prompt,
      temperature: 0,
    });

    const clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(clean);
    } catch (error) {
      console.error("❌ JSON inválido retornado pela IA");
      console.error(clean);

      return Response.json({
        summary: "Pedido registrado.",
        isUrgent: false,
      });
    }

    const validated = responseSchema.safeParse(parsedResponse);

    if (!validated.success) {
      console.error("❌ Resposta fora do schema:");
      console.error(validated.error);

      return Response.json({
        summary: "Pedido registrado.",
        isUrgent: false,
      });
    }

    return Response.json(validated.data);
  } catch (error) {
    console.error("🚨 Erro na análise de urgência:", error);

    return Response.json(
      {
        summary: "Pedido registrado.",
        isUrgent: false,
      },
      {
        status: 200,
      }
    );
  }
}