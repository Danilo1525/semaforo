import { NextRequest, NextResponse } from "next/server";
// Certifique-se que o caminho para a importação está correto.
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
  } catch (error: unknown) {
    // CORREÇÃO: 'any' trocado por 'unknown'
    console.error("Erro na rota da API de TTS:", error);

    // Verificação de tipo para acessar a mensagem de erro com segurança
    let errorMessage = "Ocorreu um erro inesperado";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
