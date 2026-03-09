import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { NewsItem, DemographicData, PlatformStats, Emotion } from '../types';
import { Users, Smartphone, Share2, TrendingUp, Instagram, Facebook, Twitter, MessageCircle, AlertCircle } from 'lucide-react';

interface SocialBigDataPanelProps {
    news: NewsItem[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const SocialBigDataPanel: React.FC<SocialBigDataPanelProps> = ({ news }) => {
    const [selectedAge, setSelectedAge] = useState<string>('all');

    // AGGREGATE PLATFORM STATS
    const platformData = useMemo(() => {
        const totals: Record<string, { sentiment: number; engagement: number; count: number }> = {};

        news.forEach(item => {
            item.platformStats?.forEach(p => {
                if (!totals[p.name]) totals[p.name] = { sentiment: 0, engagement: 0, count: 0 };
                totals[p.name].sentiment += p.sentiment;
                totals[p.name].engagement += p.engagement;
                totals[p.name].count += 1;
            });
        });

        return Object.entries(totals).map(([name, data]) => ({
            name,
            sentiment: Math.round(data.sentiment / data.count),
            engagement: Math.round(data.engagement / data.count),
            fullMark: 100
        }));
    }, [news]);

    // AGGREGATE DEMOGRAPHICS
    const ageData = useMemo(() => {
        const totals: Record<string, { interest: number; count: number }> = {};

        news.forEach(item => {
            item.demographics?.forEach(d => {
                if (!totals[d.ageGroup]) totals[d.ageGroup] = { interest: 0, count: 0 };
                totals[d.ageGroup].interest += d.interestScore;
                totals[d.ageGroup].count += 1;
            });
        });

        return Object.entries(totals).map(([ageGroup, data]) => ({
            ageGroup,
            interest: Math.round(data.interest / data.count)
        })).sort((a, b) => {
            // Sort explicitly if needed, but usually consistent
            return 0;
        });
    }, [news]);

    // EXTRACT TOP HASHTAGS
    const topHashtags = useMemo(() => {
        const tags: Record<string, number> = {};
        news.forEach(item => {
            item.platformStats?.forEach(p => {
                p.topHashtags.forEach(t => {
                    tags[t] = (tags[t] || 0) + 1;
                })
            })
        });
        return Object.entries(tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([tag]) => tag);
    }, [news]);

    // TOTAL REACH (Simulated)
    const totalReach = useMemo(() => {
        return news.reduce((acc, item) => acc + (item.viralityIndex * 1500), 0);
    }, [news]);

    if (news.length === 0) return <div className="p-8 text-center text-slate-400">Cargando Big Data Social...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-12 h-12" /></div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Alcance Estimado</p>
                    <h3 className="text-2xl font-black font-serif">{(totalReach / 1000).toFixed(1)}k</h3>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Plataforma Dominante</p>
                    <h3 className="text-2xl font-black text-blue-600 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        {platformData.sort((a, b) => b.engagement - a.engagement)[0]?.name || 'Instagram'}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Edad +Activa</p>
                    <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        {ageData.sort((a, b) => b.interest - a.interest)[0]?.ageGroup || '18-24'}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Hashtag Viral</p>
                    <h3 className="text-lg font-black text-indigo-600 truncate">
                        {topHashtags[0] || "#Argentina"}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart: Platform Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
                    <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-500" /> Rendimiento por Plataforma
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={platformData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Sentimiento" dataKey="sentiment" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Radar name="Engagement" dataKey="engagement" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Interest by Age */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
                    <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-500" /> Interés por Edad
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="interest" name="Nivel de Interés" fill="#facc15" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Hashtag Cloud / List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" /> Tópicos Virales
                </h3>
                <div className="flex flex-wrap gap-2">
                    {topHashtags.map((tag, i) => (
                        <span key={i} className={`px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all hover:scale-105 cursor-default
                     ${i === 0 ? 'bg-indigo-600 text-white text-lg' :
                                i < 3 ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-slate-100 text-slate-600'}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Echo Chamber / Polarization Aggregate */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-48 h-48" /></div>
                <h3 className="text-lg font-serif font-black text-orange-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Riesgo de Fragmentación Social
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="text-orange-800 text-sm mb-4 leading-relaxed">
                            El nivel de **Polarización Agregada** en las tendencias actuales es del
                            <span className="text-xl font-black ml-1 text-orange-600">
                                {Math.round(news.reduce((acc, n) => acc + (n.polarizationScore || 0), 0) / news.length)}%
                            </span>.
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                <span>Cohesión</span>
                                <span>Polarización Total</span>
                            </div>
                            <div className="h-3 w-full bg-orange-200/50 rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-orange-500 animate-pulse transition-all"
                                    style={{ width: `${Math.round(news.reduce((acc, n) => acc + (n.polarizationScore || 0), 0) / news.length)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur p-4 rounded-xl border border-orange-200/50">
                        <h4 className="text-[10px] font-black text-orange-800 uppercase mb-2">Diagnóstico Maia:</h4>
                        <p className="text-xs text-orange-700 italic leading-relaxed">
                            "He detectado que el {Math.round((news.filter(n => n.echoChamberWarning).length / news.length) * 100)}% de los temas virales están operando bajo lógicas de cámaras de eco, lo que sugiere una baja receptividad a opiniones alternativas en el clima digital actual."
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SocialBigDataPanel;
