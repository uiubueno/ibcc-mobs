import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { name, sector, type, items } = await req.json();

    const itemsText =
      items?.length
        ? items
            .map(
              (i: any) =>
                `- ${i.quantity}x ${i.type} (Motivo informado pelo setor: "${i.reason}")`
            )
            .join("\n")
        : "Itens não especificados.";

    const contexts: Record<string, string> = {
      padrao:
        "O item solicitado não faz parte da padronização aprovada para o IBCC.",
      estoque:
        "O item solicitado está com o estoque zerado e sem previsão imediata de reposição.",
      verba:
        "O pedido foi negado neste momento devido às restrições orçamentárias vigentes.",
    };

    const context =
      contexts[type] ??
      "O pedido não pôde ser aprovado neste momento.";

    const prompt = `
Você é responsável pelo setor de Hotelaria do hospital IBCC Oncologia.

Escreva um e-mail profissional recusando uma solicitação interna de mobiliário.

Dados da solicitação:

Solicitante: ${name}
Setor: ${sector}

Itens solicitados:
${itemsText}

Motivo da recusa:
${context}

Regras obrigatórias:

- Responda em português do Brasil.
- Demonstre empatia pela necessidade do setor.
- Explique a recusa utilizando apenas o motivo informado.
- Não invente informações.
- Não utilize markdown.
- Não utilize listas.
- Seja objetivo.
- Utilize no máximo dois parágrafos curtos.
- Finalize com:

Atenciosamente,

Equipe de Hotelaria
IBCC Oncologia
`;

    const models = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ];

    let lastError: unknown;

    for (const model of models) {
      try {
        console.log(`🤖 Utilizando modelo ${model}`);

        const result = await streamText({
          model: groq(model),
          prompt,
          temperature: 0.5,
        });

        return result.toTextStreamResponse();
      } catch (error) {
        console.error(`❌ ${model} falhou`, error);
        lastError = error;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("🚨 Erro ao gerar resposta da IA:", error);

    return new Response(
      JSON.stringify({
        error:
          "Não foi possível gerar o texto automaticamente. Tente novamente em alguns instantes.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}