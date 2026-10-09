import { useState, useEffect, useRef } from 'react';
import { type CatchUpData } from '../lib/score';
import { buildVoiceScript, isSpeechSupported } from '../lib/voice';

export function VoiceBriefing({ data, userName }: { data: CatchUpData, userName: string }) {
  const [supported] = useState(() => isSpeechSupported());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const scriptText = buildVoiceScript(data, userName);
  const synth = useRef<SpeechSynthesis | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    
    synth.current = window.speechSynthesis;
    
    const loadVoices = () => {
      if (synth.current) {
        const availableVoices = synth.current.getVoices().filter(v => v.localService);
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          setSelectedVoice(prev => prev || defaultVoice.name);
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
  }, [supported]);

  if (!supported) return null;

  const togglePlay = () => {
    if (isPlaying) {
      if (synth.current) synth.current.cancel();
      setIsPlaying(false);
    } else {
      if (synth.current) {
        synth.current.cancel(); 
        utterance.current = new SpeechSynthesisUtterance(scriptText);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.current.voice = voice;
        utterance.current.rate = speed;
        utterance.current.onend = () => setIsPlaying(false);
        synth.current.speak(utterance.current);
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <button 
        onClick={togglePlay}
        aria-label={isPlaying ? "Stop audio briefing" : "Play audio briefing"}
        className={`px-4 py-1.5 rounded-full font-label-md text-label-md uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer border-2 border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          isPlaying ? 'bg-secondary-container text-on-surface' : 'bg-primary text-on-primary'
        }`}
      >
        {isPlaying ? 'Stop briefing' : 'Play briefing'}
      </button>

      <button 
        onClick={() => setShowSettings(!showSettings)}
        aria-label="Voice options and settings"
        className="w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-primary shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center justify-center font-bold pb-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        title="Voice Settings"
      >
        ⋮
      </button>

      {showSettings && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-surface-container-lowest border-2 border-primary rounded-xl shadow-[4px_4px_0px_#000000] w-64 z-50 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="voice-select" className="font-label-sm uppercase text-on-surface-variant">Voice</label>
            <select 
              id="voice-select"
              value={selectedVoice} 
              onChange={e => setSelectedVoice(e.target.value)}
              aria-label="Select briefing voice"
              className="w-full px-2 py-1 bg-surface border-2 border-primary rounded text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="speed-slider" className="font-label-sm uppercase text-on-surface-variant">Speed ({speed}x)</label>
            <input 
              id="speed-slider"
              type="range" min="0.5" max="2" step="0.1" value={speed} 
              onChange={e => setSpeed(parseFloat(e.target.value))}
              aria-label="Select speech rate speed"
              className="w-full accent-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          {isPlaying && (
            <div className="mt-2 p-2 bg-surface border-2 border-primary border-dashed rounded text-xs max-h-32 overflow-y-auto">
              <span className="font-bold uppercase tracking-wider block mb-1">Script:</span>
              {scriptText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
