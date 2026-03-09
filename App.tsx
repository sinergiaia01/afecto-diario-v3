import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Info,
  AlertTriangle,
  Loader2,
  Bot,
  TrendingUp,
  MapPin,
  Clock,
  ExternalLink,
  Search,
  LayoutGrid,
  BarChart2,
  Calendar
} from 'lucide-react';
import { NewsItem, Emotion, WeeklySummaryItem } from './types';
import { fetchAndAnalyzeNews, askAssistant, generateWeeklySummary } from './services/gemini';
import EmotionBadge from './components/EmotionBadge';
import DashboardCharts from './components/DashboardCharts';
import ArchitectureModal from './components/ArchitectureModal';
import SocialDebateModal from './components/SocialDebateModal';
import SocialBigDataPanel from './components/SocialBigDataPanel';
import WeeklySummaryModal from './components/WeeklySummaryModal';

const ARGENTINE_PROVINCES = [
  "Todas", "Nacional", "CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán"
];

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Views
  const [archModalOpen, setArchModalOpen] = useState<boolean>(false);
  const [debateModalOpen, setDebateModalOpen] = useState<boolean>(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [viewMode, setViewMode] = useState<'monitor' | 'bigdata'>('monitor');

  // Chat
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Filters & Data
  const [selectedProvince, setSelectedProvince] = useState<string>("Jujuy");

  // Weekly Summary Data
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryItem | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async (provinceOverride?: string) => {
    const provinceToFetch = provinceOverride || selectedProvince;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAndAnalyzeNews(provinceToFetch);
      if (data.length === 0) {
        setError("No se encontraron señales de Jujuy en este momento. Intenta actualizar más tarde.");
      }
      setNews(data.sort((a, b) => b.impactScore - a.impactScore));
    } catch (error: any) {
      if (error?.message?.includes("429") || error?.message?.includes("quota")) {
        setError("Límite de Consultas Alcanzado: La IA de Maia ha trabajado mucho hoy. Por favor, intenta de nuevo en unos minutos o mañana.");
      } else {
        setError("Hubo un problema al conectar con el satélite social. Refresca la página.");
      }
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProvince]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    const data = await generateWeeklySummary();
    setWeeklySummary(data);
    setSummaryLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const socialAlert = useMemo(() => {
    if (news.length === 0) return null;
    const top = news[0];
    if (top.impactScore > 80 && (top.emotion === Emotion.IRA || top.emotion === Emotion.INDIGNACION)) {
      return {
        title: `Alerta de Clima Social: ${top.province}`,
        desc: `Alto nivel de indignación detectado por: "${top.title}". Coherencia de sentimiento crítica.`,
        color: 'red',
        icon: <AlertTriangle className="w-6 h-6 text-red-600" />
      };
    }
    return null;
  }, [news]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setChatLoading(true);
    const response = await askAssistant(userMsg, news);
    setChatHistory(prev => [...prev, { role: 'bot', text: response || "Error." }]);
    setChatLoading(false);
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans pb-12 bg-slate-50/30">
      <nav className="glass-dark text-white shadow-xl sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-serif font-bold tracking-tight">AfectoDiario</span>
            </div>

            {/* View Switcher (Desktop) */}
            <div className="hidden md:flex bg-white/10 p-1 rounded-full">
              <button
                onClick={() => setViewMode('monitor')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'monitor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
              >
                <LayoutGrid className="w-3 h-3" /> Monitor
              </button>
              <button
                onClick={() => setViewMode('bigdata')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'bigdata' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
              >
                <BarChart2 className="w-3 h-3" /> Big Data
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setSummaryModalOpen(true)}
                className="hidden md:flex bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg items-center space-x-2"
              >
                <Calendar className="w-3 h-3" />
                <span>Resumen Semanal</span>
              </button>

              <button onClick={() => setArchModalOpen(true)} className="p-2 hover:bg-white/10 rounded-full"><Info className="w-5 h-5" /></button>
              <button onClick={() => loadNews()} disabled={loading} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg flex items-center space-x-2">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile View Switcher */}
      <div className="md:hidden px-4 py-2 bg-white border-b border-slate-100 sticky top-16 z-30 flex gap-2">
        <button
          onClick={() => setViewMode('monitor')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${viewMode === 'monitor' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
        >
          <LayoutGrid className="w-3 h-3" /> Monitor
        </button>
        <button
          onClick={() => setViewMode('bigdata')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${viewMode === 'bigdata' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
        >
          <BarChart2 className="w-3 h-3" /> Big Data
        </button>
        <button
          onClick={() => setSummaryModalOpen(true)}
          className="py-2 px-4 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-black text-slate-900 mb-2">
              {viewMode === 'monitor' ? 'Monitor Federal' : 'Social Big Data'}
            </h1>
            <p className="text-slate-500 text-sm">
              {viewMode === 'monitor'
                ? 'Pulso social activo: Analizando hilos en X, tendencias de Google y TikTok en tiempo real.'
                : 'Métricas de viralidad, segmentación etaria y sentimiento en redes.'}
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto items-center">
            <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Escucha Activa: ON</span>
            </div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full md:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {ARGENTINE_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Analizando millones de señales sociales...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-8 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl flex items-start space-x-4 animate-in fade-in duration-500">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div><h3 className="font-bold text-amber-900">Aviso de Maia</h3><p className="text-amber-700 text-sm">{error}</p></div>
              </div>
            )}

            {socialAlert && !error && (
              <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-start space-x-4 animate-in slide-in-from-top-2 duration-500">
                {socialAlert.icon}
                <div><h3 className="font-bold text-red-900">{socialAlert.title}</h3><p className="text-red-700 text-sm">{socialAlert.desc}</p></div>
              </div>
            )}

            {viewMode === 'monitor' ? (
              /* VIEW: MONITOR FEDERAL */
              <>
                <DashboardCharts news={news} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {news.map((item, idx) => (
                      <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                        <div className="p-6">
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.source}</span>
                            <div className="flex gap-2">
                              {item.polarizationScore && item.polarizationScore > 60 && (
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded bg-orange-100 text-orange-700 animate-pulse`}>Polarizado ({item.polarizationScore}%)</span>
                              )}
                              <EmotionBadge emotion={item.emotion} intensity={item.intensity} />
                            </div>
                          </div>
                          <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                          <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">{item.summary}</p>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase">
                                <MapPin className="w-3 h-3 mr-1 text-blue-500" /> {item.province}
                              </div>
                              <div className="flex items-center text-[10px] text-slate-400 font-medium">
                                <Clock className="w-3 h-3 mr-1 text-slate-300" /> {item.publicationDate}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => { setSelectedNewsItem(item); setDebateModalOpen(true); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                title="Ver debate social"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              {item.url && item.url !== "" ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center space-x-2 transition-all">
                                  <span>Leer Nota</span> <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(`${item.title} ${item.source} ${item.province} hoy argentina`)}`} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 hover:border-slate-300 text-slate-500 text-[10px] font-bold px-4 py-2 rounded-full flex items-center space-x-2 transition-all">
                                  <span>Buscar en {item.source}</span> <Search className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-24 overflow-hidden h-[500px] flex flex-col">
                      <div className="p-4 bg-slate-50 border-b flex items-center space-x-2"><Bot className="w-4 h-4 text-blue-600" /><h3 className="font-bold text-sm">AfectoBot</h3></div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatHistory.map((m, i) => (
                          <div key={i} className={`text-xs p-3 rounded-xl ${m.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-md' : 'bg-slate-100 text-slate-800 mr-8'}`}>
                            {m.text}
                          </div>
                        ))}
                        {chatLoading && <div className="flex items-center gap-2 text-xs text-slate-400 p-2"><Loader2 className="w-3 h-3 animate-spin block" /> Escribiendo...</div>}
                      </div>
                      <form onSubmit={handleChatSubmit} className="p-3 border-t bg-white">
                        <input
                          value={chatMessage}
                          onChange={e => setChatMessage(e.target.value)}
                          placeholder="Consultar analista..."
                          className="w-full text-xs p-3 bg-slate-50 rounded-lg outline-none border border-transparent focus:border-blue-200 transition-all"
                        />
                      </form>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* VIEW: BIG DATA SOCIAL */
              <SocialBigDataPanel news={news} />
            )}
          </>
        )}
      </main>

      <ArchitectureModal isOpen={archModalOpen} onClose={() => setArchModalOpen(false)} />
      <SocialDebateModal isOpen={debateModalOpen} onClose={() => setDebateModalOpen(false)} newsItem={selectedNewsItem} />
      <WeeklySummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summary={weeklySummary}
        loading={summaryLoading}
        onGenerate={handleGenerateSummary}
      />
    </div>
  );
};

export default App;
