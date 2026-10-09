import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { type CatchUpData } from '../lib/score';
import { buildVoiceScript, isSpeechSupported } from '../lib/voice';

export function VoiceBriefing({ data, userName }: { data: CatchUpData, userName: string }) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const scriptText = buildVoiceScript(data, userName);
  const synth = useRef<SpeechSynthesis | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSpeechSupported()) {
      setSupported(false);
      return;
    }
    
    synth.current = window.speechSynthesis;
    
    const loadVoices = () => {
      if (synth.current) {
        const availableVoices = synth.current.getVoices().filter(v => v.localService);
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) 
                            || availableVoices[0];
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  // Update utterance if text changes while paused or stopped, but handle gracefully
  useEffect(() => {
    if (synth.current && !isPlaying && !isPaused) {
       // if we rebuild it just reset
    }
  }, [scriptText, isPlaying, isPaused]);

  if (!supported) return null;

  const handlePlay = () => {
    if (synth.current && isPaused) {
      synth.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (synth.current) {
      synth.current.cancel(); // Stop anything playing
      
      utterance.current = new SpeechSynthesisUtterance(scriptText);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.current.voice = voice;
      }
      utterance.current.rate = speed;
      
      utterance.current.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      synth.current.speak(utterance.current);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (synth.current && isPlaying) {
      synth.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center mb-4">
        <Volume2 className="text-[#10b981] mr-2" size={24} />
        <h3 className="text-xl font-bold text-white">Voice Catch-Up</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-[#111827] p-4 rounded-xl border border-[#374151]">
        
        {/* Controls */}
        <div className="flex space-x-3">
          {!isPlaying ? (
             <button onClick={handlePlay} className="p-3 bg-[#10b981] hover:bg-emerald-600 text-[#111827] rounded-full transition-colors cursor-pointer shadow-lg" title="Play">
               <Play size={20} className="ml-1" />
             </button>
          ) : (
             <button onClick={handlePause} className="p-3 bg-amber-500 hover:bg-amber-600 text-[#111827] rounded-full transition-colors cursor-pointer shadow-lg" title="Pause">
               <Pause size={20} />
             </button>
          )}
          
          <button onClick={handleStop} disabled={!isPlaying && !isPaused} className={`p-3 rounded-full transition-colors shadow-lg ${isPlaying || isPaused ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer' : 'bg-[#374151] text-gray-600 cursor-not-allowed'}`} title="Stop">
            <Square size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col space-y-3 flex-1 w-full">
          <div className="flex items-center space-x-3">
            <label className="text-sm text-[#9ca3af] whitespace-nowrap font-medium">Voice:</label>
            <select 
              value={selectedVoice} 
              onChange={e => setSelectedVoice(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 bg-[#1f2937] border border-[#374151] rounded-lg text-[#f9fafb] text-sm focus:border-[#10b981] outline-none transition-colors"
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang}) {v.localService ? '[Offline]' : ''}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="text-sm text-[#9ca3af] whitespace-nowrap font-medium w-16">Spd: {speed}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={speed} 
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-[#10b981] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Script text display */}
      <div className="mt-6 p-5 bg-[#111827] border border-[#374151] rounded-xl relative">
        <div className="absolute -top-3 left-4 px-2 bg-[#10b981] text-[#111827] text-xs font-bold tracking-wider uppercase rounded shadow">Live Script</div>
        <p className={`text-sm md:text-base leading-relaxed transition-all duration-300 ${isPlaying ? 'text-[#f9fafb] opacity-100' : 'text-[#9ca3af] opacity-60'}`}>
          {scriptText}
        </p>
      </div>
    </div>
  );
}
