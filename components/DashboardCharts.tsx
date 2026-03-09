import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, ComposedChart, Area
} from 'recharts';
import { NewsItem, EMOTION_COLORS, SentimentBreakdown } from '../types';
import { MapPin, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface DashboardChartsProps {
  news: NewsItem[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ news }) => {
  // Aggregate data for Pie Chart (Emotions)
  const emotionCounts = news.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(emotionCounts).map(([name, value]) => ({
    name,
    value,
    fill: EMOTION_COLORS[name as keyof typeof EMOTION_COLORS]
  }));

  // Aggregate Sentiment Distribution by Province
  const provinceSentiment = news.reduce((acc, item) => {
    const prov = item.province || 'Nacional';
    if (!acc[prov]) {
      acc[prov] = { positive: 0, negative: 0, neutral: 0, count: 0 };
    }
    
    // Average the platforms for this news item to get a single breakdown
    if (item.sentimentDistribution) {
      const platforms = Object.values(item.sentimentDistribution) as SentimentBreakdown[];
      if (platforms.length > 0) {
        const avgPos = platforms.reduce((sum, p) => sum + p.positive, 0) / platforms.length;
        const avgNeg = platforms.reduce((sum, p) => sum + p.negative, 0) / platforms.length;
        const avgNeu = platforms.reduce((sum, p) => sum + p.neutral, 0) / platforms.length;
        
        acc[prov].positive += avgPos;
        acc[prov].negative += avgNeg;
        acc[prov].neutral += avgNeu;
        acc[prov].count += 1;
      }
    }
    return acc;
  }, {} as Record<string, { positive: number, negative: number, neutral: number, count: number }>);

  const provinceChartData = Object.entries(provinceSentiment)
    .map(([name, data]) => ({
      name,
      Positivo: Math.round(data.positive / data.count),
      Negativo: Math.round(data.negative / data.count),
      Neutral: Math.round(data.neutral / data.count),
    }))
    .sort((a, b) => b.Positivo - a.Positivo);

  // Intensity Trend (Simulated)
  const trendData = [
    { name: 'Lun', intensity: 6.2 },
    { name: 'Mar', intensity: 6.8 },
    { name: 'Mié', intensity: 5.5 },
    { name: 'Jue', intensity: 7.9 },
    { name: 'Vie', intensity: 7.2 },
    { name: 'Sáb', intensity: 6.5 },
    { name: 'Dom', intensity: news.length > 0 ? news.reduce((acc, n) => acc + n.intensity, 0) / news.length : 6 },
  ];

  return (
    <div className="space-y-6 mb-10">
      {/* Top Row: General Distribution & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[350px]">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-serif font-bold text-slate-800">Clima Emocional</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intensity History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[350px]">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-serif font-bold text-slate-800">Tendencia de Intensidad</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="intensity" fill="#eff6ff" stroke="#3b82f6" strokeWidth={3} />
                <Bar dataKey="intensity" barSize={30} radius={[6, 6, 0, 0]}>
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#3b82f6' : '#cbd5e1'} fillOpacity={0.3} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Width Row: Province Sentiment Breakdown */}
      {provinceChartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-serif font-bold text-slate-800">Mapa de Sentimiento por Provincia</h3>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Positivo</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Neutral</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Negativo</span>
                </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={provinceChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="Positivo" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Neutral" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Negativo" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 text-center font-medium italic">
            * Datos promediados de Twitter, Facebook y TikTok analizados por Gemini 2.5
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;