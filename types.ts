export enum Emotion {
  ALEGRIA = 'Alegría',
  TRISTEZA = 'Tristeza',
  IRA = 'Ira',
  MIEDO = 'Miedo',
  SORPRESA = 'Sorpresa',
  INDIGNACION = 'Indignación',
  ESPERANZA = 'Esperanza',
  EMPATIA = 'Empatía'
}

export interface SocialReaction {
  platform: 'twitter' | 'facebook' | 'tiktok';
  user: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'controversial';
  likes: string; // e.g. "1.2k"
}

export interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  emotion: Emotion;
  intensity: number; // 1-10
  culturalContext: string; // Explicación de modismos/ironía
  url?: string;
  searchQuery?: string; // Optimized query for fallback search
  publicationDate: string; // Requerido ahora
  timestamp: string;

  // New metrics for Enhanced Ranking Algorithm
  viralityIndex: number; // 0-100: Estimated shareability on Instagram/TikTok
  discussionVolume: number; // 0-100: Estimated conversation volume on Facebook/Twitter
  coherenceScore: number; // 1-10: Sentiment unification across platforms
  impactScore: number; // Calculated weighted score 0-100

  // Social Context
  reactions: SocialReaction[]; // Simulated comments/posts
  sentimentDistribution?: Record<string, SentimentBreakdown>; // Simulated sentiment per platform

  // Location
  province: string; // "Nacional", "CABA", "Córdoba", etc.

  // Afecto Diario 2.0 Enhanced Data
  demographics?: DemographicData[];
  platformStats?: PlatformStats[];
  alternativeOpinions?: AlternativeOpinion[];

  // Afecto Diario 3.0 Real-time & Analysis
  polarizationScore?: number; // 0-100
  echoChamberWarning?: boolean;
}

export interface DailyStats {
  dominantEmotion: Emotion;
  averageIntensity: number;
  totalNews: number;
  emotionDistribution: { name: string; value: number; fill: string }[];
}

export interface WeeklyTrend {
  day: string;
  intensity: number;
  dominantEmotion: string;
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  [Emotion.ALEGRIA]: '#fbbf24', // Amber
  [Emotion.TRISTEZA]: '#64748b', // Slate
  [Emotion.IRA]: '#ef4444', // Red
  [Emotion.MIEDO]: '#7c3aed', // Violet
  [Emotion.SORPRESA]: '#f97316', // Orange
  [Emotion.INDIGNACION]: '#9f1239', // Rose dark
  [Emotion.ESPERANZA]: '#10b981', // Emerald
  [Emotion.EMPATIA]: '#3b82f6', // Blue
};

// Architecture simulation types
export interface ArchitectureNode {
  id: string;
  label: string;
  type: 'scraper' | 'model' | 'db' | 'frontend' | 'external';
  description: string;
}

// --- New Types for Afecto Diario 2.0 ---

export interface DemographicData {
  ageGroup: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  sentimentBreakdown: SentimentBreakdown;
  interestScore: number; // 0-100
}

export interface PlatformStats {
  name: 'TikTok' | 'Instagram' | 'Facebook' | 'Twitter';
  sentiment: number; // 0-100 (0=negative, 100=positive)
  engagement: number; // 0-100
  dominantEmotion: Emotion;
  topHashtags: string[];
}

export interface AlternativeOpinion {
  perspective: 'Tradicional' | 'Redes Sociales' | 'Crítica/Alternativa';
  summary: string;
  keyArguments: string[];
  biasRating: number; // 0-10
}

export interface WeeklySummaryItem {
  startDate: string;
  endDate: string;
  topNews: NewsItem[];
  nationalMood: Emotion;
  mostDiscussedTopic: string;
}
