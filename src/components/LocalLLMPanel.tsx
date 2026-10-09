import { useState, useEffect, useRef } from 'react';
import { type CatchUpData } from '../lib/score';
import { hasWebGPU, buildRuleBasedSummary, initLLMEngine, generateLLMSummary, MODEL_ID } from '../lib/llm';
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
  const [errorMsg, setErrorMsg] = useState('');
  
  const engineRef = useRef<MLCEngine | null>(null);

  useEffect(() => {
    hasWebGPU().then(supported => setWebGPUSupported(supported));
  }, []);

  const handleGenerate = async () => {
    console.log("[LocalLLMPanel] Generate requested.");
    setIsLoading(true);
    setSummary('');
    setErrorFallback(false);
    setErrorMsg('');

    try {
      console.log("[LocalLLMPanel] Checking WebGPU support...");
      const supported = await hasWebGPU();
      setWebGPUSupported(supported);

      if (!supported) {
        console.warn("[LocalLLMPanel] WebGPU not supported on this device.");
        setErrorMsg("WebGPU unavailable on this device. Model unavailable, showing offline result.");
        setSummary(buildRuleBasedSummary(data, userName));
        setErrorFallback(true);
        return;
      }

      if (!engineRef.current) {
        console.log(`[LocalLLMPanel] Initializing model engine (${MODEL_ID})...`);
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
      console.log("[LocalLLMPanel] Generating summary via WebLLM...");

      await generateLLMSummary(engineRef.current, data, userName, (text) => {
        setSummary(text);
      });
      console.log("[LocalLLMPanel] Summary generation complete.");

    } catch (err: any) {
      console.error("[LocalLLMPanel Error]:", err);
      const errText = err?.message || String(err);
      setErrorMsg(`Model unavailable (${errText}). Showing offline result.`);
      setSummary(buildRuleBasedSummary(data, userName));
      setErrorFallback(true);
    } finally {
      console.log("[LocalLLMPanel] Clearing loading/generating state.");
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  if (!enabled && !summary && !isLoading && !isGenerating) {
    return (
      <div className="w-full bg-surface-container-lowest border-[2.5px] border-primary rounded-xl p-space-lg shadow-[4px_4px_0px_#000000] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">AI Summary (Local)</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Generate a summary using on-device AI. 100% private.</p>
        </div>
        <button 
          onClick={() => setEnabled(true)}
          aria-label="Enable on-device local AI summary model"
          className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Enable AI
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-container-lowest border-[2.5px] border-primary rounded-xl p-space-lg shadow-[4px_4px_0px_#000000] mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col">
          <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-primary flex items-center gap-2">
            Local AI Summary
            {webGPUSupported === false && (
              <span className="text-[10px] bg-error-container text-on-error-container px-2 py-1 rounded-full border border-error uppercase tracking-wider">
                WebGPU Unavailable
              </span>
            )}
          </h3>
          {enabled && <p className="font-label-sm text-label-sm uppercase text-on-surface-variant mt-1">Model: {MODEL_ID}</p>}
        </div>
        
        <div className="flex gap-2">
          {errorFallback && (
            <button 
              onClick={handleGenerate}
              aria-label="Retry local AI summary generation"
              className="px-6 py-3 rounded-full bg-surface-container-lowest text-primary border-2 border-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-surface-variant transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Retry
            </button>
          )}
          <button 
            onClick={handleGenerate}
            disabled={isLoading || isGenerating}
            aria-label={isLoading || isGenerating ? "Generating summary" : "Generate local AI summary"}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-50 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {(isLoading || isGenerating) ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between font-label-sm text-label-sm uppercase text-on-surface-variant">
            <span>Loading local model...</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden border-2 border-primary shadow-[2px_2px_0px_#000000]">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressValue}%` }}></div>
          </div>
          <div className="font-label-sm text-[10px] text-on-surface-variant truncate">{progressText}</div>
        </div>
      )}

      {errorFallback && (
        <div className="mb-6 p-4 bg-error-container border-2 border-error rounded-lg font-body-sm text-on-error-container">
          <strong>Notice:</strong> Falling back to rule-based summary.
          {errorMsg && <div className="mt-1 text-xs opacity-80 break-words">{errorMsg}</div>}
        </div>
      )}

      {(summary || isGenerating) && (
        <div className="w-full bg-surface-variant text-on-surface rounded-xl border-[2.5px] border-primary shadow-[4px_4px_0px_#000000] p-6 flex flex-col justify-center relative mt-4">
          <div className="absolute -top-3 left-4 px-2 bg-primary text-on-primary text-[10px] font-bold tracking-wider uppercase border-2 border-primary">
            {errorFallback ? 'Rule-Based Output' : 'AI Output'}
          </div>
          <div className="font-body-lg text-body-lg leading-snug whitespace-pre-wrap mt-2">
            {summary}
            {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse"></span>}
          </div>
        </div>
      )}

      {!summary && !isLoading && !isGenerating && !errorFallback && (
        <div className="text-center py-6 font-body-sm text-on-surface-variant">
          Click generate to analyze the top 40 most critical messages locally.
        </div>
      )}
    </div>
  );
}
