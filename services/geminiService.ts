
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

export async function fetchIndustryAnalysis(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: API_KEY! });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response;
}

export async function generatePodcastSpeech(text: string) {
  const ai = new GoogleGenAI({ apiKey: API_KEY! });
  
  /**
   * El modelo gemini-2.5-flash-preview-tts requiere una estructura clara de diálogo 
   * para la configuración multi-speaker. Evitamos metadatos innecesarios y forzamos
   * un formato directo de conversación.
   */
  const podcastPrompt = `Genera un audio de podcast donde Joe y Jane conversan sobre estas noticias. 
Usa exclusivamente este formato de diálogo:
Joe: [texto]
Jane: [texto]

Noticias a discutir: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: podcastPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Joe',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }
              }
            },
            {
              speaker: 'Jane',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' }
              }
            }
          ]
        }
      }
    },
  });

  // El modelo TTS devuelve los bytes de audio en el primer part de la respuesta
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function decodeAudio(base64Data: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export function createAudioBlob(base64Data: string): Blob {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, 24000, true); // Sample Rate
  view.setUint32(28, 24000 * 2, true); // Byte Rate
  view.setUint16(32, 2, true); // Block Align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, bytes.length, true);

  const header = new Uint8Array(buffer, 0, 44);
  return new Blob([header, bytes], { type: 'audio/wav' });
}
