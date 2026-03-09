import React from 'react';
import { X, MessageCircle, Heart, Share2, Facebook, Twitter, Video, TrendingUp, Users, AlertCircle, ExternalLink, Search, ArrowUpRight } from 'lucide-react';
import { NewsItem, SocialReaction, SentimentBreakdown } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import OpinionGenerator from './OpinionGenerator';

interface SocialDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
}

const SocialDebateModal: React.FC<SocialDebateModalProps> = ({ isOpen, onClose, newsItem }) => {
  if (!isOpen || !newsItem) return null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-l-4 border-green-500 bg-green-50/50';
      case 'negative': return 'border-l-4 border-red-500 bg-red-50/50';
      case 'controversial': return 'border-l-4 border-orange-500 bg-orange-50/50';
      default: return 'border-l-4 border-slate-300 bg-slate-50/50';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-3 h-3 text-blue-400" />;
      case 'facebook': return <Facebook className="w-3 h-3 text-blue-700" />;
      case 'tiktok': return <Video className="w-3 h-3 text-black" />;
      default: return <MessageCircle className="w-3 h-3 text-slate-500" />;
    }
  };

  const getPlatformSearchUrl = (platform: string, title: string) => {
    // Specific search queries to find real discussions
    const encoded = encodeURIComponent(title);
    switch (platform) {
      case 'twitter':
        // Twitter search for the specific title
        return `https://twitter.com/search?q=${encoded}&src=typed_query&f=live`;
      case 'facebook':
        return `https://www.facebook.com/search/posts?q=${encoded}`;
      case 'tiktok':
        return `https://www.tiktok.com/search?q=${encoded}`;
      default:
        return `https://www.google.com/search?q=${encoded}`;
    }
  };

  // Prepare chart data if available
  const chartData = newsItem.sentimentDistribution ? Object.entries(newsItem.sentimentDistribution).map(([platform, dist]) => {
    const sentiment = dist as SentimentBreakdown;
    return {
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      Positivo: sentiment.positive,
      Negativo: sentiment.negative,
      Neutral: sentiment.neutral
    };
  }) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ring-1 ring-white/20">

        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 z-20 shadow-sm">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Análisis de Redes Sociales</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight mb-3">
              {newsItem.title}
            </h2>

            {/* Primary News Link */}
            {newsItem.url && newsItem.url.trim() !== '' ? (
              <a
                href={newsItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 px-4 py-2 rounded-full shadow-md transition-all hover:scale-105"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Leer noticia original
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(newsItem.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-full shadow-sm transition-all"
              >
                <Search className="w-3 h-3 mr-2" />
                Buscar en Google
              </a>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8 bg-slate-50/50">

          {/* Metrics Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center hover:border-indigo-200 transition-colors">
              <div className="text-3xl font-black text-indigo-600 mb-1">{newsItem.viralityIndex}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Probabilidad Viral</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center hover:border-pink-200 transition-colors">
              <div className="text-3xl font-black text-pink-600 mb-1">{newsItem.discussionVolume}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volumen Debate</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center hover:border-orange-200 transition-colors">
              <div className="text-3xl font-black text-orange-600 mb-1">{newsItem.polarizationScore}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Polarización</div>
            </div>
          </div>

          {newsItem.echoChamberWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center space-x-3 text-amber-800 animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">Alerta de Cámara de Eco: El debate está fragmentado en nichos aislados.</p>
            </div>
          )}

          {/* Sentiment Distribution Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Distribución de Sentimiento por Plataforma</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    barSize={20}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Bar dataKey="Positivo" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Neutral" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Negativo" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Discussion Feed */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Muestreo de Opinión Pública
              </div>
              <span className="text-[10px] bg-white text-slate-400 px-2 py-1 rounded-md border border-slate-200 font-medium">IA Simulada</span>
            </h3>

            <div className="space-y-4">
              {newsItem.reactions && newsItem.reactions.length > 0 ? (
                newsItem.reactions.map((reaction, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl shadow-sm border border-slate-100 bg-white relative group transition-all hover:shadow-md`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${reaction.sentiment === 'positive' ? 'bg-green-400' :
                      reaction.sentiment === 'negative' ? 'bg-red-400' :
                        reaction.sentiment === 'controversial' ? 'bg-orange-400' : 'bg-slate-300'
                      }`}></div>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-slate-50 rounded-full border border-slate-100">
                          {getPlatformIcon(reaction.platform)}
                        </div>
                        <span className="font-bold text-sm text-slate-800">{reaction.user}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">• hace 2h</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-xs text-slate-400 font-medium space-x-1">
                          <Heart className="w-3 h-3 text-slate-300" />
                          <span>{reaction.likes}</span>
                        </div>

                        {/* Link to Specific Platform Search */}
                        <a
                          href={getPlatformSearchUrl(reaction.platform, newsItem.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                          title={`Buscar discusiones reales en ${reaction.platform}`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed pr-6 italic">"{reaction.content}"</p>
                    <div className="mt-3 flex justify-start">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${reaction.sentiment === 'positive' ? 'text-green-600 bg-green-50' :
                        reaction.sentiment === 'negative' ? 'text-red-600 bg-red-50' :
                          reaction.sentiment === 'controversial' ? 'text-orange-600 bg-orange-50' : 'text-slate-500 bg-slate-100'
                        }`}>
                        {reaction.sentiment}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron debates destacados todavía.</p>
                </div>
              )}
            </div>
          </div>



          // ... (in the render method, before closing div)

          {/* AI Opinion Analysis */}
          {newsItem.alternativeOpinions && newsItem.alternativeOpinions.length > 0 && (
            <OpinionGenerator opinions={newsItem.alternativeOpinions} />
          )}

          {/* Analysis Note */}
          <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl text-sm text-slate-700 border border-blue-100 shadow-sm">
            <strong className="text-blue-700 block mb-1 text-xs uppercase tracking-wider">Contexto Cultural (IA):</strong>
            {newsItem.culturalContext}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SocialDebateModal;