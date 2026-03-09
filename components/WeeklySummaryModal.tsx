import React from 'react';
import { WeeklySummaryItem, Emotion, EMOTION_COLORS } from '../types';
import { Calendar, TrendingUp, X, Sparkles, MessageCircle } from 'lucide-react';
import EmotionBadge from './EmotionBadge';

interface WeeklySummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: WeeklySummaryItem | null;
    loading: boolean;
    onGenerate: () => void;
}

const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({ isOpen, onClose, summary, loading, onGenerate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10">
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="p-8 pb-0">
                    <h2 className="text-3xl font-serif font-black text-slate-800 mb-2 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        Resumen Semanal
                    </h2>
                    <p className="text-slate-500">Análisis de impacto social de los últimos 7 días en Argentina.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {!summary && !loading && (
                        <div className="text-center py-12">
                            <p className="text-slate-400 mb-6">Genera un reporte consolidado con IA sobre el clima social de la semana.</p>
                            <button
                                onClick={onGenerate}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generar Informe Ahora
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Analizando millones de interacciones...</p>
                        </div>
                    )}

                    {summary && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Header Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Clima Nacional</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-full bg-white shadow-sm" style={{ color: EMOTION_COLORS[summary.nationalMood] }}>
                                            <TrendingUp className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black text-slate-800 block">{summary.nationalMood}</span>
                                            <span className="text-xs text-slate-400">Predominante</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Tema +Hablado</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-full bg-white shadow-sm text-emerald-600">
                                            <MessageCircle className="w-8 h-8" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="text-lg font-black text-slate-800 block truncate" title={summary.mostDiscussedTopic}>
                                                {summary.mostDiscussedTopic}
                                            </span>
                                            <span className="text-xs text-slate-400">Tópico Viral</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top News List */}
                            <div>
                                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">
                                    Noticias de Mayor Impacto
                                </h3>
                                <div className="space-y-4">
                                    {summary.topNews.map((news, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 hover:border-blue-200 transition-colors">
                                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-1">{news.title}</h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <EmotionBadge emotion={news.emotion} intensity={news.intensity} />
                                                    <span className="text-xs text-slate-400 font-medium">Hace {Math.floor(Math.random() * 5) + 1}d</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">
                                    Reporte generado por Gemini 2.5 Flash • Periodo: {summary.startDate} - {summary.endDate}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklySummaryModal;
