
import React, { useState, useCallback, useRef } from 'react';
import { fetchIndustryAnalysis, generateSpeech, decodeAudio, createAudioBlob } from './services/geminiService';
import { AnalysisResult, NewsSection } from './types';
import AnalysisCard from './components/AnalysisCard';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Analiza las novedades más significativas de esta semana en la industria gráfica y visual. 
      Estructura tu respuesta estrictamente en formato JSON con la siguiente forma:
      {
        "summary": "Resumen general de la semana",
        "sections": [
          {
            "category": "Materiales/Textil/Wrapping/Tecnología/Marketing/Sostenibilidad",
            "title": "Título llamativo",
            "content": "Explicación detallada de la novedad",
            "keyPoints": ["Punto clave 1", "Punto clave 2"]
          }
        ]
      }
      Enfócate en los 10 puntos solicitados incluyendo materiales, acabados, wrapping, personalización de objetos, innovación para artistas, artículos publicitarios, maquinaria (sostenibilidad y automatización), tecnología de vanguardia y aplicaciones creativas.`;

      const response = await fetchIndustryAnalysis(prompt);
      const text = response.text || '';
      
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Fuente externa',
        web: { uri: chunk.web?.uri || '#' }
      })) || [];

      setResult({
        summary: parsed.summary,
        sections: parsed.sections,
        sources: sources
      });
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Error al obtener el análisis. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (playing) {
      currentSourceRef.current?.stop();
      setPlaying(false);
      return;
    }

    if (!result) return;

    try {
      setPlaying(true);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioText = `${result.summary}. ${result.sections.map(s => `${s.title}: ${s.content}`).join('. ')}`;
      const base64Audio = await generateSpeech(audioText);

      if (base64Audio) {
        const buffer = await decodeAudio(base64Audio, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setPlaying(false);
        source.start();
        currentSourceRef.current = source;
      }
    } catch (error) {
      console.error("Audio Error:", error);
      setPlaying(false);
    }
  };

  const handleDownloadAudio = async () => {
    if (!result || exporting) return;

    try {
      setExporting(true);
      const audioText = `${result.summary}. ${result.sections.map(s => `${s.title}: ${s.content}`).join('. ')}`;
      const base64Audio = await generateSpeech(audioText);

      if (base64Audio) {
        const blob = createAudioBlob(base64Audio);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Visual_Industry_${new Date().toISOString().split('T')[0]}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download Error:", error);
      alert("Error al exportar el audio.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-2 mb-4 bg-indigo-100 rounded-2xl">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Visual Industry <span className="text-indigo-600 italic">Insights</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Análisis semanal inteligente sobre impresión, personalización y tecnología gráfica impulsado por Google Gemini.
        </p>
      </header>

      <div className="flex flex-col items-center justify-center gap-6 mb-12">
        <button
          onClick={startAnalysis}
          disabled={loading}
          className={`px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analizando Tendencias...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Generar Análisis Semanal
            </>
          )}
        </button>

        {result && (
          <div className="flex gap-4">
            <button
              onClick={handlePlayAudio}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border-2 transition-colors ${
                playing ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {playing ? 'Detener Locución' : 'Escuchar Reporte'}
            </button>
            <button
              onClick={handleDownloadAudio}
              disabled={exporting}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-800 text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Audio
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="p-1 bg-white/20 rounded-lg">✨</span> 
                Resumen Ejecutivo
              </h2>
              <p className="text-xl text-indigo-100 leading-relaxed font-light">
                {result.summary}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.sections.map((section, index) => (
              <AnalysisCard key={index} section={section} />
            ))}
          </div>

          {result.sources.length > 0 && (
            <footer className="mt-16 pt-8 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Fuentes y Referencias</h4>
              <div className="flex flex-wrap gap-4">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                  </a>
                ))}
              </div>
            </footer>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-5.364l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No hay datos generados aún.</p>
          <p className="text-sm">Haz clic en el botón de arriba para iniciar la búsqueda en tiempo real.</p>
        </div>
      )}
    </div>
  );
};

export default App;
