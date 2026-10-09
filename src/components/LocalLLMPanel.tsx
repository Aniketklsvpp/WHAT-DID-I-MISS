import { useState, useEffect, useRef } from 'react';
import { type CatchUpData } from '../lib/score';
import { hasWebGPU, buildRuleBasedSummary, initLLMEngine, generateLLMSummary, MODEL_ID } from '../lib/llm';
import { MLCEngine } from '@mlc-ai/web-llm';

export function LocalLLMPanel({ data, userName }: { data: CatchUpData; userName: string }) {
  // Offline summary — built immediately from catch-up data
  const [offlineSummary, setOfflineSummary] = useState('');

  // AI model state
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Error / failure state
  const [failureNote, setFailureNote] = useState('');
  const [showRetry, setShowRetry] = useState(false);

  const engineRef = useRef<MLCEngine | null>(null);

  // Build offline summary as soon as data arrives
  useEffect(() => {
    if (data) {
      setOfflineSummary(buildRuleBasedSummary(data, userName));
    }
  }, [data, userName]);

  const handleEnhance = async () => {
    console.log('[LocalLLMPanel] "Enhance with AI" clicked.');
    setIsLoading(true);
    setIsGenerating(false);
    setAiSummary('');
    setFailureNote('');
    setShowRetry(false);

    try {
      // 1 — WebGPU check
      console.log('[LocalLLMPanel] Checking WebGPU support...');
      const supported = await hasWebGPU();
      console.log('[LocalLLMPanel] WebGPU supported:', supported);

      if (!supported) {
        throw new Error('WebGPU is not available on this browser/device.');
      }

      // 2 — Load model (30-second timeout enforced inside initLLMEngine)
      if (!engineRef.current) {
        console.log(`[LocalLLMPanel] Loading model: ${MODEL_ID}`);
        engineRef.current = await initLLMEngine((report) => {
          console.log(`[LocalLLMPanel] Load progress: ${Math.round(report.progress * 100)}% — ${report.text}`);
          setProgressText(report.text);
          setProgressPct(report.progress * 100);
        });
      }

      if (!engineRef.current) {
        throw new Error('Engine failed to initialize (returned null).');
      }

      // 3 — Generate
      setIsLoading(false);
      setIsGenerating(true);
      console.log('[LocalLLMPanel] Starting AI summary generation...');

      await generateLLMSummary(engineRef.current, data, userName, (text) => {
        setAiSummary(text);
      });

      console.log('[LocalLLMPanel] AI summary generation complete.');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[LocalLLMPanel] AI model error (full):', err);
      setFailureNote(`AI model unavailable. Showing offline summary. (${msg.slice(0, 120)})`);
      setAiSummary('');
      setShowRetry(true);
      // Invalidate engine so next retry re-initialises
      engineRef.current = null;
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      console.log('[LocalLLMPanel] Loading state cleared.');
    }
  };

  const isBusy = isLoading || isGenerating;

  return (
    <div
      className="w-full bg-surface-container-lowest border-[2.5px] border-primary rounded-xl p-space-lg shadow-[4px_4px_0px_#000000] mb-8"
      aria-label="Local AI Summary card"
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-4">
        <div className="flex flex-col">
          <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
            AI Summary
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 uppercase">
            Offline summary (rule-based) · Model: {MODEL_ID}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {showRetry && (
            <button
              onClick={handleEnhance}
              aria-label="Retry loading the local AI model"
              className="px-5 py-2.5 rounded-full bg-surface-container-lowest text-primary border-2 border-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-surface-variant transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Retry
            </button>
          )}
          <button
            onClick={handleEnhance}
            disabled={isBusy}
            aria-label={isBusy ? 'Enhancing summary with local AI…' : 'Enhance summary with on-device AI'}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 transition-transform shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-50 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {isBusy ? 'Enhancing…' : 'Enhance with AI'}
          </button>
        </div>
      </div>

      {/* ── Block 1: Offline (rule-based) — always visible ── */}
      {offlineSummary && (
        <div className="w-full bg-surface-variant text-on-surface rounded-xl border-[2.5px] border-primary shadow-[4px_4px_0px_#000000] p-5 relative mb-4">
          <div className="absolute -top-3 left-4 px-2 bg-surface-variant text-primary text-[10px] font-bold tracking-wider uppercase border-2 border-primary rounded-sm">
            Offline summary (rule-based)
          </div>
          <pre
            className="font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap mt-2"
            aria-live="polite"
          >
            {offlineSummary}
          </pre>
        </div>
      )}

      {/* ── Model loading progress (shown below offline block) ── */}
      {isLoading && (
        <div className="space-y-2 mb-4" aria-live="polite" aria-label="Model loading progress">
          <div className="flex justify-between font-label-sm text-label-sm uppercase text-on-surface-variant">
            <span>Loading local model…</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden border-2 border-primary shadow-[2px_2px_0px_#000000]">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="font-label-sm text-[10px] text-on-surface-variant truncate">{progressText}</div>
        </div>
      )}

      {/* ── Failure note ── */}
      {failureNote && !isBusy && (
        <div
          className="mb-4 p-3 bg-error-container border-2 border-error rounded-lg font-body-sm text-on-error-container text-sm"
          role="alert"
          aria-live="assertive"
        >
          {failureNote}
        </div>
      )}

      {/* ── Block 2: AI summary — appears when streaming or done ── */}
      {(aiSummary || isGenerating) && (
        <div className="w-full bg-surface-variant text-on-surface rounded-xl border-[2.5px] border-secondary shadow-[4px_4px_0px_#000000] p-5 relative">
          <div className="absolute -top-3 left-4 px-2 bg-secondary text-on-secondary text-[10px] font-bold tracking-wider uppercase border-2 border-secondary rounded-sm">
            AI summary (local)
          </div>
          <div
            className="font-body-lg text-body-lg leading-snug whitespace-pre-wrap mt-2"
            aria-live="polite"
            aria-label="AI generated summary"
          >
            {aiSummary}
            {isGenerating && (
              <span className="inline-block w-2 h-4 ml-1 bg-secondary animate-pulse" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
