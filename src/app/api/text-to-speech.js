import { google } from "googleapis";

export default async function handler(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Gere um token de acesso (usando o código de autorização)
  const { tokens } = await oauth2Client.getToken(req.query.code);
  oauth2Client.setCredentials(tokens);

  // Use a API Text-to-Speech
  const textToSpeech = google.texttospeech({
    version: "v1",
    auth: oauth2Client,
  });
  const response = await textToSpeech.text.synthesize({
    input: { text: "Olá, mundo!" },
    voice: { languageCode: "pt-BR", ssmlGender: "FEMALE" },
    audioConfig: { audioEncoding: "MP3" },
  });

  res.status(200).json({ audio: response.data.audioContent });
}
