import { GoogleGenAI } from "@google/genai";
import { NewsItem, Emotion, SocialReaction, SentimentBreakdown } from '../types';
import { sendTelegramAlert } from './notifications';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robustly extracts and cleans JSON from AI response.
 * Handles cases with conversational text, markdown blocks, or leading/trailing whitespace.
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

// --- DATASET DE MEDIOS ---
const PROVINCE_MEDIA_SOURCES: Record<string, string> = {
  "Jujuy": "Jujuy Dice, El Tribuno de Jujuy, Todo Jujuy",
  "Córdoba": "La Voz del Interior, Cadena 3, Cba24n",
  "Santa Fe": "El Litoral, La Capital de Rosario, Rosario3",
  "Mendoza": "Los Andes, Diario Uno, MDZ Online",
  "Tucumán": "La Gaceta, El Tucumano",
  "Salta": "El Tribuno de Salta, Que Pasa Salta",
  "Buenos Aires": "El Día de La Plata, La Capital de Mar del Plata",
  "CABA": "Clarín, La Nación, Infobae, Página/12, Perfil",
  "Entre Ríos": "El Once, Diario UNO Entre Ríos",
  "Chaco": "Diario Chaco, Norte",
  "Corrientes": "El Litoral de Corrientes, Época",
  "Misiones": "Misiones Online, El Territorio",
  "Santiago del Estero": "El Liberal, Diario Panorama",
  "San Juan": "Diario de Cuyo, Tiempo de San Juan",
  "San Luis": "El Diario de la República",
  "Neuquén": "Diario Río Negro, LM Neuquén",
  "Río Negro": "Diario Río Negro, Bariloche 2000",
  "Chubut": "Diario Jornada, El Chubut",
  "Santa Cruz": "La Opinión Austral, Tiempo Sur",
  "Tierra del Fuego": "Diario del Fin del Mundo, Ushuaia 24",
  "Catamarca": "El Ancasti, El Esquiú",
  "La Rioja": "Nueva Rioja, El Independiente",
  "Formosa": "La Mañana, Noticias Formosa",
  "La Pampa": "La Arena, El Diario de La Pampa"
};

// --- VALIDACIÓN Y LIMPIEZA DE URLs ---
const sanitizeUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) return "";

    const urlObj = new URL(trimmed);
    const paramsToClean = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 's'];
    paramsToClean.forEach(p => urlObj.searchParams.delete(p));

    const path = urlObj.pathname.toLowerCase();
    const domain = urlObj.hostname.toLowerCase();

    const forbiddenDomains = ['google.com', 'bing.com', 'search.yahoo.com', 't.co', 'bit.ly', 'facebook.com/share'];
    if (forbiddenDomains.some(d => domain.includes(d))) return "";

    const segments = path.split('/').filter(s => s.length > 0);
    const lastSegment = segments[segments.length - 1] || "";

    const isDeepLink = (
      lastSegment.includes('-') ||
      /\d/.test(lastSegment) ||
      lastSegment.includes('.html') ||
      lastSegment.includes('.php') ||
      lastSegment.length > 18
    );

    if (segments.length <= 1 && !isDeepLink) return "";

    return urlObj.toString();
  } catch (e) {
    return "";
  }
};

const discoverVerifiedUrl = async (title: string, source: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Busca la URL exacta y directa del artículo: "${title}" publicado en el medio "${source}".
                    Regla: Devuelve UNICAMENTE la URL. Si no encuentras el artículo directo, responde: "NOT_FOUND".`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "";
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    return urlMatch ? sanitizeUrl(urlMatch[0]) : "";
  } catch (e) {
    return "";
  }
};

const generateSocialMetrics = (title: string, emotion: Emotion) => {
  // Fallback if AI fails to generate specific metrics
  return {
    viralityIndex: Math.floor(Math.random() * 40) + 50,
    discussionVolume: Math.floor(Math.random() * 60) + 20,
    coherenceScore: Math.floor(Math.random() * 4) + 6,
  };
};

export const fetchAndAnalyzeNews = async (province: string = "Todas"): Promise<NewsItem[]> => {
  try {
    const todayDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let contextPrompt = province === "Todas" || province === "Nacional"
      ? `Identifica las 6 noticias más impactantes de HOY (${todayDate}) en Argentina.`
      : `Identifica las 5 noticias más importantes de HOY (${todayDate}) en la provincia de ${province}.`;

    const prompt = `
      Eres un Arquitecto de Big Data Social y Analista de Inteligencia. Fecha: ${todayDate}.
      ${contextPrompt}
      
      IMPORTANTE: Tu búsqueda debe priorizar la "Escucha Activa". No busques solo diarios (diarios de papel o portales), busca TENDENCIAS REALES de X (Twitter), TikTok y búsquedas de Google en Argentina.
      
      TEMAS BASE DETECTADOS (Úsalos como guía para profundizar):
      - Mercado: Inestabilidad por conflicto Medio Oriente, Dólar a $1415.
      - Social: Malestar social creciente (Índice IDI en valores bajos). Éxito de contenidos locales en streaming.
      - Tendencias: Messi, Franco, Maradona, Susana, Aranda.
      - Alertas: Luvias fuertes y granizo en CABA/Buenos Aires.
      
      Por cada item destacado, genera un análisis profundo que incluya:
      
      Estructura JSON:
      {
        "title": "Título del tema o hilo viral",
        "source": "Red Social dominante (X, TikTok, FB, IG)",
        "summary": "Resumen ejecutivo del conflicto o debate",
        "emotion": "Una de: Alegría, Tristeza, Ira, Miedo, Sorpresa, Indignación, Esperanza, Empatía",
        "intensity": 1-10,
        "province": "Provincia específica o Nacional",
        "url": "URL real encontrada",
        "publicationDate": "Tiempo transcurrido",
        "demographics": [
           { "ageGroup": "18-24", "interestScore": 0-100, "sentimentBreakdown": { "positive": %, "negative": %, "neutral": % } },
           { "ageGroup": "25-34", ... },
           { "ageGroup": "35-44", ... },
           { "ageGroup": "45-54", ... },
           { "ageGroup": "55+", ... }
        ],
        "platformStats": [
           { "name": "TikTok", "sentiment": 0-100, "engagement": 0-100, "dominantEmotion": "Emotion", "topHashtags": ["#tag1", "#tag2"] },
           { "name": "Twitter", ... },
           { "name": "Instagram", ... },
           { "name": "Facebook", ... }
        ],
        "alternativeOpinions": [
           { "perspective": "Tradicional", "summary": "Análisis institucional...", "biasRating": 1-10 },
           { "perspective": "Redes Sociales", "summary": "Conversación orgánica...", "biasRating": 1-10 },
           { "perspective": "Crítica/Alternativa", "summary": "Ángulo cospiranoico o disidente...", "biasRating": 1-10 }
        ],
        "polarizationScore": 0-100,
        "echoChamberWarning": true/false
      }

      REGLAS:
      - Simula un volumen de datos masivo.
      - Si detectas una noticia de INDIGNACIÓN masiva en curso (ej. por economía o clima), el impactScore será altísimo.
      - Devuelve SOLO el array JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const rawText = response.text || "";
    const cleanJson = cleanJsonString(rawText);

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error al parsear JSON complejo:", parseError);
      return [];
    }

    if (!Array.isArray(data)) return [];

    const newsItems = data.map((item: any, index: number) => {
      const emotion = (Object.values(Emotion).includes(item.emotion as Emotion)) ? item.emotion as Emotion : Emotion.SORPRESA;
      const avgSentiment = item.platformStats ? item.platformStats.reduce((acc: number, curr: any) => acc + curr.sentiment, 0) / item.platformStats.length : 50;
      const impactScore = Math.round((item.intensity || 5) * 10);

      // --- DISPARADOR DE ALERTAS (Real Notification) ---
      if (impactScore > 88 && (emotion === Emotion.IRA || emotion === Emotion.INDIGNACION)) {
        sendTelegramAlert({
          title: item.title,
          source: item.source,
          province: item.province || province,
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
        culturalContext: `Análisis de pulso social basado en tendencias de redes y búsqueda en tiempo real en ${item.province}.`,
        province: item.province || province,
        url: sanitizeUrl(item.url),
        searchQuery: item.searchQuery || `${item.title} ${item.source} twitter argentina`,
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

    // Fill missing URLs slightly less aggressively to save time/tokens if needed, or keep same logic
    const missingUrls = newsItems.filter((n: any) => !n.url).slice(0, 2);
    for (const item of missingUrls) {
      const found = await discoverVerifiedUrl(item.title, item.source);
      if (found) item.url = found;
    }

    return newsItems;
  } catch (error) {
    console.error("Fetch News Error:", error);
    return [];
  }
};

export const generateWeeklySummary = async (): Promise<any> => {
  try {
    const prompt = `
       Genera un "Resumen Semanal de Impacto Social" para Argentina.
       Analiza los eventos de los últimos 7 días.
       
       Devuelve un JSON con:
       {
         "startDate": "dd/mm/yyyy",
         "endDate": "dd/mm/yyyy",
         "nationalMood": "Emotion",
         "mostDiscussedTopic": "El tema más hablado",
         "topNews": [Array de 3 noticias breves con título, emoción e intensidad]
       }
     `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (e) {
    console.error("Error generating weekly summary", e);
    return null;
  }
};

export const askAssistant = async (question: string, contextNews: NewsItem[]) => {
  try {
    const contextString = contextNews.map(n => `- ${n.title} (${n.province})`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres AfectoBot, un analista de datos sociales. Tienes este contexto de noticias:\n${contextString}\n\nPregunta: ${question}`
    });
    return response.text;
  } catch (e) {
    return "Lo siento, hubo un problema al consultar al analista.";
  }
}
