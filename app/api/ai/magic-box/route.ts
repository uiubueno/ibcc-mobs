import { generateText } from "ai";
import { groqModel } from "@/lib/groq";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text, sectors } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Texto não informado." },
        { status: 400 }
      );
    }

    if (!Array.isArray(sectors) || sectors.length === 0) {
      return Response.json(
        { error: "Lista de setores inválida." },
        { status: 400 }
      );
    }

    const prompt = `
Você é um extrator de informações do hospital IBCC Oncologia.

Sua única função é converter uma solicitação de mobiliário em JSON.

IMPORTANTE:

- Nunca converse.
- Nunca explique.
- Nunca escreva markdown.
- Nunca utilize crases.
- Nunca escreva texto antes ou depois do JSON.
- Retorne SOMENTE um JSON válido.

Texto da solicitação:

"${text}"

Lista de setores válidos:

${sectors.join(", ")}

Regras:

1. "sector" deve ser exatamente um dos setores acima.
2. Escolha o setor mais próximo semanticamente.
3. "items" deve conter TODOS os móveis encontrados.
4. "quantity" deve ser um número inteiro.
5. Caso a quantidade não seja informada, utilize 1.
6. "reason" deve conter somente o motivo da solicitação.
7. Não invente informações.

Formato obrigatório:

{
  "sector": "138 - Adm. Ambulatórios/ Quimioterapia",
  "items": [
    {
      "type": "Cadeira de Rodas",
      "quantity": 2,
      "reason": "As antigas quebraram e estão sem condições de uso"
    }
  ]
}
`;

    const { text: generatedText } = await generateText({
      model: groqModel,
      prompt,
      temperature: 0,
    });

    const cleanText = generatedText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Resposta da IA:");
      console.error(cleanText);

      return Response.json(
        {
          error: "A IA não retornou um JSON válido.",
        },
        {
          status: 500,
        }
      );
    }

    let parsedData;

    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("Erro ao interpretar JSON:");
      console.error(cleanText);

      return Response.json(
        {
          error: "Falha ao interpretar o JSON retornado pela IA.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      typeof parsedData.sector !== "string" ||
      !Array.isArray(parsedData.items)
    ) {
      return Response.json(
        {
          error: "JSON retornado pela IA está incompleto.",
        },
        {
          status: 500,
        }
      );
    }

    parsedData.items = parsedData.items.map((item: any) => ({
      type: String(item.type ?? ""),
      quantity: Number(item.quantity ?? 1),
      reason: String(item.reason ?? ""),
    }));

    return Response.json(parsedData);
  } catch (error) {
    console.error("🚨 ERRO NA CAIXA MÁGICA:", error);

    return Response.json(
      {
        error: "Falha ao processar o texto.",
      },
      {
        status: 500,
      }
    );
  }
}