import { useState, useEffect, useRef } from 'react';
import { Bot, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { type CatchUpData } from '../lib/score';
import { hasWebGPU, buildRuleBasedSummary, initLLMEngine, generateLLMSummary } from '../lib/llm';
import { MLCEngine } from '@mlc-ai/web-llm';

export function LocalLLMPanel({ data, userName }: { data: CatchUpData, userName: string }) {
  const [enabled, setEnabled] = useState(false);
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  
  const [progressText, setProgressText] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [summary, setSummary] = useState('');
  const [errorFallback, setErrorFallback] = useState(false);
  
  const engineRef = useRef<MLCEngine | null>(null);

  useEffect(() => {
    hasWebGPU().then(supported => setWebGPUSupported(supported));
  }, []);

  const handleGenerate = async () => {
    if (!webGPUSupported) {
      setSummary(buildRuleBasedSummary(data, userName));
      setErrorFallback(true);
      return;
    }

    setIsLoading(true);
    setSummary('');
    setErrorFallback(false);

    try {
      if (!engineRef.current) {
        engineRef.current = await initLLMEngine((report) => {
          setProgressText(report.text);
          setProgressValue(report.progress * 100);
        });
      }

      if (!engineRef.current) {
        throw new Error("Engine failed to initialize.");
      }

      setIsLoading(false);
      setIsGenerating(true);

      await generateLLMSummary(engineRef.current, data, userName, (text) => {
        setSummary(text);
      });

    } catch (err) {
      console.error(err);
      setSummary(buildRuleBasedSummary(data, userName));
      setErrorFallback(true);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  if (!enabled && !summary && !isLoading && !isGenerating) {
    return (
      <div className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl mb-8 flex items-center justify-between animate-in fade-in">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#374151] rounded-lg">
            <Bot size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">AI Summary (Local)</h3>
            <p className="text-xs text-[#9ca3af]">Generate a summary using on-device AI. 100% private.</p>
          </div>
        </div>
        <button 
          onClick={() => setEnabled(true)}
          className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg text-sm transition-colors font-semibold cursor-pointer shadow-lg border border-gray-600"
        >
          Enable AI
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-[#374151] pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <Bot size={24} className="text-blue-400" />
          <h3 className="text-xl font-bold text-white">Local AI Summary</h3>
          {webGPUSupported === false && (
            <span className="flex items-center text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
              <AlertTriangle size={14} className="mr-1" /> WebGPU Unavailable
            </span>
          )}
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isLoading || isGenerating}
          className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors font-bold shadow-lg cursor-pointer"
        >
          {(isLoading || isGenerating) ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
          Generate Summary
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2 mb-4 animate-in fade-in">
          <div className="flex justify-between text-xs text-[#9ca3af]">
            <span>Loading local model (Cached in browser)...</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <div className="w-full bg-[#111827] rounded-full h-2 overflow-hidden shadow-inner border border-[#374151]">
            <div className="bg-blue-500 h-2 transition-all duration-300" style={{ width: `${progressValue}%` }}></div>
          </div>
          <div className="text-[10px] text-gray-500 truncate">{progressText}</div>
        </div>
      )}

      {errorFallback && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex items-start">
          <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0" />
          <span>Could not load WebGPU model. Falling back to rule-based summary.</span>
        </div>
      )}

      {(summary || isGenerating) && (
        <div className="p-5 bg-[#111827] border border-[#374151] rounded-xl relative animate-in fade-in slide-in-from-top-4">
          <div className="absolute -top-3 left-4 px-2 bg-blue-600 text-white text-xs font-bold tracking-wider uppercase rounded shadow">
            {errorFallback ? 'Rule-Based Output' : 'AI Output'}
          </div>
          <div className="text-[#f9fafb] text-sm leading-relaxed whitespace-pre-wrap mt-2">
            {summary}
            {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse"></span>}
          </div>
        </div>
      )}

      {!summary && !isLoading && !isGenerating && !errorFallback && (
        <div className="text-center py-6 text-[#9ca3af] text-sm">
          Click generate to analyze the top 40 most critical messages locally.
        </div>
      )}
    </div>
  );
}
