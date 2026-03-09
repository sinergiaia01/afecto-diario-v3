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
  "Jujuy": "El Tribuno de Jujuy, Jujuy al Día, Somos Jujuy, Todo Jujuy, Jujuy Dice, Periódico Lea, Canal 7 de Jujuy",
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

    const domain = urlObj.hostname.toLowerCase();

    // Solo bloqueamos dominios de "compartir" o buscadores genéricos
    const forbiddenDomains = ['bing.com', 'search.yahoo.com', 'facebook.com/share'];
    if (forbiddenDomains.some(d => domain.includes(d))) return "";

    // Si es un dominio de noticias conocido o red social, permitimos más flexibilidad
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

    let contextPrompt = province === "Todas" || province === "Nacional" || province === "Jujuy"
      ? `Prioridad ABSOLUTA: Jujuy. Identifica las 6 noticias/tendencias más calientes en redes sociales (TikTok, X) de HOY (${todayDate}) específicamente en la Provincia de Jujuy, Argentina. Si hay temas nacionales (dólar, Messi), analízalos desde la perspectiva del impacto local en Jujuy.`
      : `Identifica las 5 noticias más importantes de HOY (${todayDate}) en la provincia de ${province}. No olvides el impacto en el clima social de Jujuy si es relevante.`;

    const prompt = `
      Eres el Monitor de Inteligencia Social "Maia". Tu nicho y foco principal es JUJUY, Argentina. Fecha: ${todayDate}.
      ${contextPrompt}
      
      MISIÓN: Ser los ojos y oídos del usuario en JUJUY.
      - Prioriza TENDENCIAS REALES de TikTok (virales locales), X (Twitter Jujuy) y debates en grupos locales de Facebook.
      - Sé ESTRICTO con los datos: No inventes noticias genéricas. Busca conflictos reales, política local, eventos culturales o crisis de servicios en Jujuy.
      
      TEMAS BASE DETECTADOS EN JUJUY (Úsalos como guía):
      - Coyuntura: Impacto del dólar a $1415 en comercios de San Salvador y frontera.
      - Redes: Búsquedas crecientes sobre festivales locales, cortes de ruta o reclamos municipales.
      - TikTok: Usuarios virales de Jujuy comentando el costo de vida o tendencias de humor regional.
      
      Estructura JSON:
      {
        "title": "Título exacto del debate o noticia local",
        "source": "Específica (TikTok Jujuy, X Jujuy, El Tribuno, etc)",
        "summary": "Contexto crudo de lo que pasa en la calle hoy en Jujuy",
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
      - OBLIGATORIO: El campo "province" debe ser "Jujuy" para todas las noticias encontradas.
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
      console.log("MAIA_DEBUG: Raw JSON from AI:", cleanJson);
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
        culturalContext: `Escucha activa focalizada en el nicho regional de Jujuy. Análisis de redes sociales (TikTok/X) y medios locales.`,
        province: item.province || "Jujuy",
        url: sanitizeUrl(item.url),
        searchQuery: item.searchQuery || `${item.title} Jujuy hoy tiktok twitter`,
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

    // Probar verificar más URLs (hasta 4) de forma paralela para no ralentizar tanto
    const missingItems = newsItems.filter((n: any) => !n.url).slice(0, 4);
    await Promise.all(missingItems.map(async (item: any) => {
      const found = await discoverVerifiedUrl(item.title, item.source);
      if (found) item.url = found;
    }));

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
