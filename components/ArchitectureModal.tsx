import React from 'react';
import { X, Server, Database, Brain, Globe, ShieldCheck } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Arquitectura Técnica: AfectoDiario</h2>
            <p className="text-sm text-slate-500">Documentación de Ingeniería y Diseño de Solución</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Section 1: Diagram */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-600" /> Diagrama de Bloques
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
                <div className="bg-white p-4 rounded shadow border border-slate-200 text-center w-full md:w-1/5">
                  <div className="font-bold text-slate-700">Fuentes</div>
                  <div className="text-xs text-slate-500 mt-1">X, TikTok, Google Trends</div>
                  <div className="mt-2 text-xs bg-slate-100 p-1 rounded">Escucha Activa 3.0</div>
                </div>
                <div className="hidden md:block text-slate-400">→</div>
                <div className="bg-blue-50 p-4 rounded shadow border border-blue-200 text-center w-full md:w-1/5">
                  <div className="font-bold text-blue-800">Pipeline NLP</div>
                  <div className="text-xs text-blue-600 mt-1">Python / HuggingFace</div>
                  <div className="mt-2 text-xs bg-white p-1 rounded">Normalización Rioplatense</div>
                </div>
                <div className="hidden md:block text-slate-400">→</div>
                <div className="bg-purple-50 p-4 rounded shadow border border-purple-200 text-center w-full md:w-1/5">
                  <div className="font-bold text-purple-800">Inferencia</div>
                  <div className="text-xs text-purple-600 mt-1">Gemini 2.5 / BERT</div>
                  <div className="mt-2 text-xs bg-white p-1 rounded">Clasificación Emocional</div>
                </div>
                <div className="hidden md:block text-slate-400">→</div>
                <div className="bg-green-50 p-4 rounded shadow border border-green-200 text-center w-full md:w-1/5">
                  <div className="font-bold text-green-800">Dashboard</div>
                  <div className="text-xs text-green-600 mt-1">React / Recharts</div>
                  <div className="mt-2 text-xs bg-white p-1 rounded">Visualización</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Python Pipeline Code Snippet */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" /> MVP: Pipeline de Procesamiento (Python)
            </h3>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              <pre>{`import feedparser
from transformers import pipeline
import json

# 1. Configuración de Fuentes
RSS_FEEDS = {
    'clarin': 'https://www.clarin.com/rss/lo-ultimo/',
    'lanacion': 'https://servicios.lanacion.com.ar/herramientas/rss/origen=2'
}

# 2. Modelo de Emociones (Hugging Face)
# Usamos un modelo multilingüe fine-tuneado para español
emotion_classifier = pipeline("text-classification", 
                            model="pysentimiento/robertuito-emotion-analysis", 
                            return_all_scores=True)

def normalize_text(text):
    # Lógica específica para remover "Bajada:", "Ultimo momento", etc.
    return text.replace("URGENTE", "").strip()

def process_news():
    results = []
    for source, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        for entry in feed.entries[:5]:
            clean_text = normalize_text(entry.title + " " + entry.description)
            
            # 3. Inferencia
            emotions = emotion_classifier(clean_text)[0]
            top_emotion = max(emotions, key=lambda x: x['score'])
            
            results.append({
                'source': source,
                'title': entry.title,
                'emotion': top_emotion['label'],
                'score': top_emotion['score']
            })
    
    # 4. Exportación
    with open('daily_affect.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    process_news()`}</pre>
            </div>
          </section>

          {/* Section 3: Roadmap & Ethics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" /> Roadmap
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="font-bold text-slate-900 mr-2">Fase 1 (MVP):</span>
                  Scraping básico, modelo pre-entrenado, dashboard local.
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-slate-900 mr-2">Fase 2:</span>
                  Big Data Social: Segmentación etaria y análisis de debate multiplataforma.
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-slate-900 mr-2">Fase 3 (Actual):</span>
                  Real-time Pulse: Ingesta de tendencias calientes, Alertas de Crisis a Telegram y Detección de Cámaras de Eco.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-red-600" /> Ética y Legal
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="bg-red-50 p-2 rounded border border-red-100">
                  <strong>Ley 25.326:</strong> Anonimización total de datos de redes sociales. No se almacenan perfiles de usuarios.
                </li>
                <li className="bg-red-50 p-2 rounded border border-red-100">
                  <strong>Sesgo de Medios:</strong> El algoritmo pondera fuentes opuestas (ej. Página/12 vs La Nación) para equilibrar el "score de clima social".
                </li>
              </ul>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;