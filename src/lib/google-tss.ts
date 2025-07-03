// Importa o cliente específico para Text-to-Speech
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Instancia o cliente. A autenticação ocorrerá automaticamente
// se a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS estiver configurada corretamente.
const ttsClient = new TextToSpeechClient();

/**
 * Sintetiza o texto em áudio usando a API Google Text-to-Speech.
 * @param text O texto a ser convertido em fala.
 * @returns Um Buffer contendo o áudio em formato MP3.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  try {
    // Monta a requisição para a API
    const request = {
      input: { text },
      // Veja a lista de vozes disponíveis: https://cloud.google.com/text-to-speech/docs/voices
      voice: { languageCode: "pt-BR", name: "pt-BR-Standard-A" },
      // Seleciona o tipo de áudio
      audioConfig: { audioEncoding: "MP3" as const },
    };

    // Chama a API para sintetizar a fala
    const [response] = await ttsClient.synthesizeSpeech(request);

    // Verifica se o conteúdo de áudio foi recebido
    if (!response.audioContent) {
      throw new Error("Nenhum conteúdo de áudio recebido da API.");
    }

    // O audioContent já é um Uint8Array, que é compatível com Buffer.
    // O Next.js/Node.js vai converter para Buffer.
    return Buffer.from(response.audioContent);
  } catch (error) {
    console.error("Erro na síntese de fala:", error);
    // Lança o erro para ser tratado pela rota da API
    throw new Error("Falha ao sintetizar a fala.");
  }
}
