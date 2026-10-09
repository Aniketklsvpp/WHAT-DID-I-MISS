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
    if (!webGPUSupported) {
      setSummary(buildRuleBasedSummary(data, userName));
      setErrorFallback(true);
      setErrorMsg("WebGPU not supported on this device.");
      return;
    }

    setIsLoading(true);
    setSummary('');
    setErrorFallback(false);
    setErrorMsg('');

    let isStuck = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      if (!engineRef.current) {
        timeoutId = setTimeout(() => {
          if (isStuck) {
            setErrorMsg("Model download or load timed out after 30 seconds. Check your network, or use the offline summary.");
            setSummary(buildRuleBasedSummary(data, userName));
            setErrorFallback(true);
            setIsLoading(false);
          }
        }, 30000);

        engineRef.current = await initLLMEngine((report) => {
          if (report.progress > 0) isStuck = false;
          setProgressText(report.text);
          setProgressValue(report.progress * 100);
        });
        
        if (timeoutId) clearTimeout(timeoutId);
      }

      if (!engineRef.current) {
        throw new Error("Engine failed to initialize.");
      }

      setIsLoading(false);
      setIsGenerating(true);

      await generateLLMSummary(engineRef.current, data, userName, (text) => {
        setSummary(text);
      });

    } catch (err: any) {
      console.error(err);
      if (timeoutId) clearTimeout(timeoutId);
      setErrorMsg(err.message || String(err));
      setSummary(buildRuleBasedSummary(data, userName));
      setErrorFallback(true);
    } finally {
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
          className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer whitespace-nowrap"
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
              className="px-6 py-3 rounded-full bg-surface-container-lowest text-primary border-2 border-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-surface-variant transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
          )}
          <button 
            onClick={handleGenerate}
            disabled={isLoading || isGenerating}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-50 whitespace-nowrap"
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
