import { NextRequest, NextResponse } from "next/server";
// Certifique-se que o caminho para a importação está correto.
// Se você configurou aliases de caminho no seu `tsconfig.json` (ex: "@/lib/*"),
// pode usar `@/lib/google-tts`. Caso contrário, use o caminho relativo.
import { synthesizeSpeech } from "@/lib/google-tss";

export async function POST(req: NextRequest) {
  try {
    // Pega o texto do corpo da requisição
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Texto não fornecido" },
        { status: 400 }
      );
    }

    // Chama a função de síntese do nosso módulo lib
    const audioBuffer = await synthesizeSpeech(text);

    // Retorna a resposta com o content-type correto para áudio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Erro na rota da API de TTS:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
