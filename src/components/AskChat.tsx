import { useState, useRef } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { type CatchUpData, type ScoredMessage } from '../lib/score';
import { retrieveMessages } from '../lib/ask';
import { initLLMEngine, hasWebGPU } from '../lib/llm';
import { MLCEngine } from '@mlc-ai/web-llm';

export function AskChat({ data }: { data: CatchUpData }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<ScoredMessage[]>([]);
  const [errorFallback, setErrorFallback] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  
  const engineRef = useRef<MLCEngine | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sourcesEndRef = useRef<HTMLDivElement>(null);

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
    setSources([]);
    setHighlightId(null);

    const { messages, topHits } = retrieveMessages(searchQuery, data.allScored);
    
    if (messages.length === 0) {
      setAnswer("No relevant messages found.");
      setIsSearching(false);
      return;
    }
    
    // limit context passed to LLM to prevent enormous prompts
    const topContext = messages
      .filter(m => !m.hasHighRisk) // exclude high-risk OTP/Card items
      .slice(-20); 
    setSources(topContext);

    const webGPUSupported = await hasWebGPU();
    if (!webGPUSupported) {
      handleFallback(topHits);
      return;
    }

    try {
      if (!engineRef.current) {
        engineRef.current = await initLLMEngine(() => {});
      }
      if (!engineRef.current) throw new Error("Engine failed.");

      // Enforce maskedText sent to LLM
      const chatText = topContext.map(m => `[${m.timestamp.toLocaleString()}] ${m.sender}: ${m.maskedText}`).join('\n');
      const prompt = `Answer ONLY using the messages below. If the answer is not in them, say you can't find it. Keep it under 3 sentences. Mention who said it and when.\n\nMessages:\n${chatText}\n\nQuestion: ${searchQuery}`;

      const chunks = await engineRef.current.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.1,
      });

      let fullText = '';
      for await (const chunk of chunks) {
        fullText += chunk.choices[0]?.delta?.content || '';
        setAnswer(fullText);
      }
    } catch (err) {
      console.error("AskChat LLM Error:", err);
      handleFallback(topHits);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFallback = (bestHits: ScoredMessage[]) => {
    setErrorFallback(true);
    setAnswer(bestHits.slice(0, 3).map(m => `• [${m.sender}]: ${m.text}`).join('\n\n'));
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const scrollToSource = (id: string) => {
    setHighlightId(id);
    const el = document.getElementById(`source-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-[#374151] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Sparkles size={24} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Ask your chat</h3>
        </div>
      </div>

      <div className="relative mb-4">
        <input 
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... e.g. What did Rahul say about the venue?"
          className="w-full pl-12 pr-4 py-4 bg-[#111827] border border-[#374151] focus:border-purple-500 rounded-xl text-white placeholder-gray-500 outline-none transition-colors"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <button 
          onClick={() => handleSearch(query)}
          disabled={isSearching || !query.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors shadow-lg cursor-pointer flex items-center"
        >
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Ask'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {examples.map(ex => (
          <button 
            key={ex}
            onClick={() => { setQuery(ex); handleSearch(ex); }}
            className="px-3 py-1.5 bg-[#374151] hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 text-[#9ca3af] border border-[#4b5563] rounded-full text-xs transition-all cursor-pointer"
          >
            {ex}
          </button>
        ))}
      </div>

      {(answer || isSearching) && (
        <div className="bg-[#111827] border border-purple-500/30 rounded-xl p-5 relative mt-4 animate-in fade-in">
          <div className="absolute -top-3 left-4 px-2 bg-purple-600 text-white text-xs font-bold tracking-wider uppercase rounded shadow">
            {errorFallback ? 'Best Matches (AI Unavailable)' : 'Answer'}
          </div>
          
          <div className="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap mt-2">
            {answer}
            {isSearching && <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse"></span>}
          </div>

          {sources.length > 0 && !isSearching && (
            <div className="mt-8 border-t border-[#374151] pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sources</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {sources.map(msg => (
                  <div 
                    key={msg.id}
                    id={`source-${msg.id}`}
                    onClick={() => scrollToSource(msg.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${highlightId === msg.id ? 'bg-purple-500/10 border-purple-500/50' : 'bg-[#1f2937] border-[#374151] hover:border-gray-500'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-xs text-[#f9fafb]">{msg.sender}</span>
                      <span className="text-[10px] text-[#9ca3af]">{msg.timestamp.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#9ca3af]">{msg.text}</p>
                  </div>
                ))}
                <div ref={sourcesEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
