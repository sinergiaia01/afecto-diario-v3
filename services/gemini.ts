import OpenAI from "openai";
import { NewsItem, Emotion, SocialReaction, SentimentBreakdown } from '../types';
import { sendTelegramAlert } from './notifications';

const getApiKey = () => {
  try {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

// Initialize xAI (Grok) Client
const client = new OpenAI({
  apiKey: getApiKey(),
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true
});

/**
 * Robustly extracts and cleans JSON from AI response.
 */
const cleanJsonString = (str: string): string => {
  if (!str) return '[]';
  let cleaned = str.trim();

  const markdownRegex = /```(?:json)?([\s\S]*?)```/;
  const match = cleaned.match(markdownRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
};

// --- VALIDACIÓN Y LIMPIEZA DE URLs ---
const sanitizeUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) return "";
    const urlObj = new URL(trimmed);
    const domain = urlObj.hostname.toLowerCase();
    const forbiddenDomains = ['bing.com', 'search.yahoo.com', 'facebook.com/share'];
    if (forbiddenDomains.some(d => domain.includes(d))) return "";
    return urlObj.toString();
  } catch (e) {
    return "";
  }
};

export const fetchAndAnalyzeNews = async (province: string = "Jujuy"): Promise<NewsItem[]> => {
  try {
    const todayDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
      Eres el Monitor de Inteligencia Social "Maia", potenciado por Grok. Tu nicho y foco principal es JUJUY, Argentina. Fecha: ${todayDate}.
      
      MISIÓN: Ser los ojos y oídos del usuario en JUJUY usando el poder de X (Twitter) y redes sociales.
      
      INSTRUCCIONES:
      1. Identifica las 6 noticias/tendencias más calientes en JUJUY ahora mismo.
      2. Aprovecha tu acceso a datos de X (Twitter) para encontrar debates locales reales en San Salvador, San Pedro, Palpalá, Perico y la Quebrada.
      3. Sé ESTRICTO: Busca conflictos sociales, huelgas, política provincial, clima local intensa (tormentas) o virales de TikTok/X de usuarios jujeños.
      
      Estructura de salida: Solo un array JSON con esta forma:
      [
        {
          "title": "Título impacto Jujuy",
          "source": "X Jujuy / TikTok Jujuy / Radio Jujuy",
          "summary": "Resumen crudo de la calle",
          "emotion": "Ira/Alegría/etc",
          "intensity": 1-10,
          "url": "URL si existe",
          "publicationDate": "hace X horas",
          "demographics": [
             { "ageGroup": "18-24", "interestScore": 80, "sentimentBreakdown": { "positive": 10, "negative": 70, "neutral": 20 } }
             ... (otros grupos: 25-34, 35-44, 45-54, 55+)
          ],
          "platformStats": [
             { "name": "Twitter", "sentiment": 0-100, "engagement": 0-100, "dominantEmotion": "Emotion", "topHashtags": ["#Jujuy", "..."] }
             ... (otros: TikTok, Instagram, Facebook)
          ],
          "alternativeOpinions": [
             { "perspective": "Tradicional", "summary": "...", "biasRating": 5 },
             { "perspective": "Redes Sociales", "summary": "...", "biasRating": 8 },
             { "perspective": "Crítica/Alternativa", "summary": "...", "biasRating": 9 }
          ],
          "polarizationScore": 0-100,
          "echoChamberWarning": true/false
        }
      ]
    `;

    const response = await client.chat.completions.create({
      model: "grok-beta",
      messages: [
        { role: "system", content: "Eres Maia, una analista de inteligencia social experta en el nicho de Jujuy, Argentina. Proporcionas datos crudos, reales y sin censura sobre el clima social local." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const rawText = response.choices[0].message.content || "";
    const cleanJson = cleanJsonString(rawText);
    const data = JSON.parse(cleanJson);

    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => {
      const emotion = (Object.values(Emotion).includes(item.emotion as Emotion)) ? item.emotion as Emotion : Emotion.SORPRESA;
      const avgSentiment = item.platformStats ? item.platformStats.reduce((acc: number, curr: any) => acc + curr.sentiment, 0) / item.platformStats.length : 50;
      const impactScore = Math.round((item.intensity || 5) * 10);

      // --- ALERTA TELEGRAM ---
      if (impactScore > 85 && (emotion === Emotion.IRA || emotion === Emotion.INDIGNACION)) {
        sendTelegramAlert({
          title: item.title,
          source: item.source,
          province: "Jujuy",
          emotion: emotion,
          impactScore: impactScore,
          summary: item.summary
        });
      }

      return {
        id: `news-${index}-${Date.now()}`,
        title: item.title,
        source: item.source,
        summary: item.summary,
        emotion: emotion,
        intensity: item.intensity || 5,
        viralityIndex: item.platformStats?.find((p: any) => p.name === 'TikTok')?.engagement || Math.floor(Math.random() * 100),
        discussionVolume: item.platformStats?.find((p: any) => p.name === 'Twitter')?.engagement || Math.floor(Math.random() * 100),
        coherenceScore: Math.round(avgSentiment / 10),
        impactScore: impactScore,
        culturalContext: `Análisis de inteligencia local Grok-powered para el mercado de Jujuy.`,
        province: "Jujuy",
        url: sanitizeUrl(item.url),
        searchQuery: `${item.title} Jujuy hoy`,
        publicationDate: item.publicationDate || "Reciente",
        timestamp: new Date().toISOString(),
        reactions: [],
        demographics: item.demographics || [],
        platformStats: item.platformStats || [],
        alternativeOpinions: item.alternativeOpinions || [],
        polarizationScore: item.polarizationScore || Math.floor(Math.random() * 100),
        echoChamberWarning: item.echoChamberWarning || (item.polarizationScore > 75)
      };
    });
  } catch (error) {
    console.error("Grok Fetch Error:", error);
    throw error;
  }
};

export const generateWeeklySummary = async (): Promise<any> => {
  try {
    const response = await client.chat.completions.create({
      model: "grok-beta",
      messages: [
        { role: "user", content: 'Genera un "Resumen Semanal de Impacto Social" para Jujuy, Argentina. JSON format con: startDate, endDate, nationalMood, mostDiscussedTopic, topNews[3].' }
      ]
    });
    return JSON.parse(cleanJsonString(response.choices[0].message.content || "{}"));
  } catch (e) {
    return null;
  }
};

export const askAssistant = async (question: string, contextNews: NewsItem[]) => {
  try {
    const contextString = contextNews.map(n => `- ${n.title}`).join('\n');
    const response = await client.chat.completions.create({
      model: "grok-beta",
      messages: [
        { role: "system", content: "Eres Maia, analista de Jujuy. Responde de forma empática pero basada en datos." },
        { role: "user", content: `Contexto Jujuy:\n${contextString}\n\nPregunta: ${question}` }
      ]
    });
    return response.choices[0].message.content;
  } catch (e) {
    return "Error al consultar a Grok.";
  }
}
