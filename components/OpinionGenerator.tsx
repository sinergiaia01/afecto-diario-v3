import React, { useState } from 'react';
import { AlternativeOpinion } from '../types';
import { ChevronRight, Radio, Scale, MessageSquare, Zap } from 'lucide-react';

interface OpinionGeneratorProps {
    opinions: AlternativeOpinion[];
}

const OpinionGenerator: React.FC<OpinionGeneratorProps> = ({ opinions }) => {
    const [activeTab, setActiveTab] = useState<number>(0);

    if (!opinions || opinions.length === 0) return null;

    const getIcon = (perspective: string) => {
        if (perspective.includes('Tradicional')) return <Radio className="w-5 h-5" />;
        if (perspective.includes('Redes')) return <MessageSquare className="w-5 h-5" />;
        return <Zap className="w-5 h-5" />;
    };

    const getColor = (perspective: string) => {
        if (perspective.includes('Tradicional')) return 'blue';
        if (perspective.includes('Redes')) return 'pink';
        return 'amber';
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-serif font-bold text-slate-800">Contraste de Opiniones (IA)</h3>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded">Beta</span>
            </div>

            <div className="flex border-b border-slate-100">
                {opinions.map((op, idx) => {
                    const color = getColor(op.perspective);
                    const isActive = activeTab === idx;
                    return (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all border-b-2 
                        ${isActive
                                    ? `border-${color}-500 text-${color}-600 bg-${color}-50/30`
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {op.perspective}
                        </button>
                    );
                })}
            </div>

            <div className="p-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeTab}>
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-full bg-${getColor(opinions[activeTab].perspective)}-100 text-${getColor(opinions[activeTab].perspective)}-600`}>
                            {getIcon(opinions[activeTab].perspective)}
                        </div>
                        <div>
                            <h4 className={`text-lg font-bold text-${getColor(opinions[activeTab].perspective)}-700 mb-2`}>
                                Perspectiva {opinions[activeTab].perspective}
                            </h4>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {opinions[activeTab].summary}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mt-6">
                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-3">Argumentos Clave</h5>
                        <ul className="space-y-2">
                            {opinions[activeTab].keyArguments?.map((arg, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                    <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span>{arg}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-2 mt-4 justify-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Nivel de Sesgo Detectado:</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${opinions[activeTab].biasRating > 7 ? 'bg-red-500' :
                                        opinions[activeTab].biasRating > 4 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${opinions[activeTab].biasRating * 10}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{opinions[activeTab].biasRating}/10</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpinionGenerator;
