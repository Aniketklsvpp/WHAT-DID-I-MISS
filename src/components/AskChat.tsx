import { useState, useRef } from 'react';
import { type CatchUpData, type ScoredMessage } from '../lib/score';
import { retrieveMessages } from '../lib/ask';
import { initLLMEngine, hasWebGPU, withTimeout } from '../lib/llm';
import { MLCEngine } from '@mlc-ai/web-llm';
import { MessageContent } from './MessageContent';

export function AskChat({ data, revealPii, showAiView }: { data: CatchUpData, revealPii: boolean, showAiView: boolean }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<ScoredMessage[]>([]);
  const [errorFallback, setErrorFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSources, setShowSources] = useState(false);
  
  const engineRef = useRef<MLCEngine | null>(null);

  const examples = [
    "What did they say about the venue?",
    "Are there any pending tasks?",
    "Rahul ne kya bola last me?"
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsSearching(true);
    setAnswer('');
    setErrorFallback(false);
    setErrorMsg('');
    setSources([]);
    setShowSources(false);

    console.log(`[AskChat] Starting search query: "${searchQuery}"`);

    const { messages, topHits } = retrieveMessages(searchQuery, data.allScored);
    
    if (messages.length === 0) {
      console.log("[AskChat] No relevant messages found.");
      setAnswer("No relevant messages found.");
      setIsSearching(false);
      return;
    }
    
    const topContext = messages
      .filter(m => !m.hasHighRisk) 
      .slice(-20); 
    setSources(topContext);

    console.log(`[AskChat] Found ${topContext.length} context messages for LLM.`);
    console.log("[AskChat] Checking WebGPU availability...");

    try {
      const webGPUSupported = await hasWebGPU();
      if (!webGPUSupported) {
        console.warn("[AskChat] WebGPU unavailable, using offline best hits fallback.");
        handleFallback(topHits, "WebGPU unavailable. Showing offline result.");
        return;
      }

      if (!engineRef.current) {
        console.log("[AskChat] Initializing local MLCEngine...");
        engineRef.current = await initLLMEngine(() => {});
      }

      if (!engineRef.current) {
        throw new Error("Local AI engine failed to initialize.");
      }

      const chatText = topContext.map(m => `[${m.timestamp.toLocaleString()}] ${m.sender}: ${m.maskedText}`).join('\n');
      const prompt = `Answer ONLY using the messages below. If the answer is not in them, say you can't find it. Keep it under 3 sentences. Mention who said it and when.\n\nMessages:\n${chatText}\n\nQuestion: ${searchQuery}`;

      console.log("[AskChat] Sending prompt to local LLM engine...");

      const completionPromise = engineRef.current.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.1,
      });

      const chunks = await withTimeout(
        completionPromise,
        30000,
        "LLM query timed out after 30 seconds."
      );

      let fullText = '';
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("LLM stream response timed out after 30 seconds.")), 30000);
      });

      const streamRead = (async () => {
        for await (const chunk of chunks) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullText += content;
          setAnswer(fullText);
        }
        return fullText;
      })();

      await Promise.race([streamRead, timeoutPromise]);
      console.log("[AskChat] Query completed successfully.");

    } catch (err: any) {
      console.error("[AskChat Error] Search failed:", err);
      const errText = err?.message || String(err);
      handleFallback(topHits, `Model unavailable (${errText}). Showing offline result.`);
    } finally {
      console.log("[AskChat] Search finished, clearing loading state.");
      setIsSearching(false);
    }
  };

  const handleFallback = (bestHits: ScoredMessage[], customMsg?: string) => {
    setErrorFallback(true);
    setErrorMsg(customMsg || "Model unavailable, showing offline result");
    setAnswer(bestHits.slice(0, 3).map(m => `• [${m.sender}]: ${revealPii ? m.text : m.maskedText}`).join('\n\n'));
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 mb-12 border-t-4 border-primary border-dashed">
      <h1 className="w-full text-center font-headline-lg text-headline-lg tracking-normal uppercase text-primary mb-8">
        ASK YOUR CHAT
      </h1>
      
      <div className="w-full relative flex items-center mb-6">
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Ask your chat question"
          placeholder="Ask your chat... e.g. What did Rahul say about the venue?"
          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-6 pr-28 py-5 rounded-full border-[2.5px] border-primary shadow-[4px_4px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-primary focus:shadow-[2px_2px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all placeholder:text-on-surface-variant/60"
        />
        <button 
          onClick={() => handleSearch(query)}
          disabled={isSearching || !query.trim()}
          aria-label={isSearching ? "Searching chat history" : "Ask question"}
          className="absolute right-2.5 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary/90 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {isSearching ? '...' : 'Ask'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 w-full justify-center mb-8">
        {examples.map(ex => (
          <button 
            key={ex}
            onClick={() => { setQuery(ex); handleSearch(ex); }}
            aria-label={`Ask sample question: ${ex}`}
            className="px-4 py-1.5 bg-surface-container-lowest hover:bg-secondary-container text-on-surface-variant hover:text-on-surface border-2 border-primary rounded-full font-label-sm uppercase tracking-wider shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {ex}
          </button>
        ))}
      </div>

      {(answer || isSearching) && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500" aria-live="polite">
          <div className="w-full bg-secondary-container text-on-surface rounded-xl border-[2.5px] border-primary shadow-[4px_4px_0px_#000000] p-6 flex flex-col justify-center relative">
            {errorFallback && (
              <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-primary/20">
                <div className="px-2 py-0.5 bg-error text-white text-[10px] font-bold tracking-wider uppercase border border-primary rounded">
                  AI Unavailable - Offline Result
                </div>
                <button 
                  onClick={() => handleSearch(query)}
                  aria-label="Retry Ask Your Chat query"
                  className="px-3 py-1 bg-surface-container-lowest text-primary text-xs font-bold rounded-full border border-primary shadow-[1px_1px_0px_#000000] hover:bg-surface-variant active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
            {errorMsg && (
              <div className="text-xs text-error font-semibold mb-2">{errorMsg}</div>
            )}
            <p className="font-body-lg text-body-lg text-on-surface leading-snug whitespace-pre-wrap">
              {answer || (isSearching ? "Searching..." : "")}
            </p>
          </div>

          {sources.length > 0 && !isSearching && (
            <div className="w-full flex flex-col items-start mt-6 px-2">
              <button 
                onClick={() => setShowSources(!showSources)}
                aria-label={showSources ? "Hide message sources" : "View message sources"}
                className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer select-none"
              >
                {showSources ? 'Hide Sources' : 'View Sources'}
              </button>
              
              {showSources && (
                <div className="w-full mt-4 pt-4 border-t-2 border-primary border-dashed font-body-sm text-body-sm text-on-surface-variant font-mono space-y-3">
                  {sources.map((msg) => (
                    <div key={msg.id} className="flex flex-col mb-2">
                      <span className="font-bold text-primary">[{msg.sender} @ {msg.timestamp.toLocaleTimeString()}]</span>
                      <MessageContent msg={msg} revealPii={revealPii} showAiView={showAiView} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
