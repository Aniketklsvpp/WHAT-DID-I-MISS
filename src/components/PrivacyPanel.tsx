import { useState } from 'react';
import { type CatchUpData } from '../lib/score';
import { PiiShield } from './PiiShield';

interface PrivacyPanelProps {
  onClose: () => void;
  onClear: () => void;
  data: CatchUpData;
  revealPii: boolean;
  setRevealPii: (v: boolean) => void;
}

export function PrivacyPanel({ onClose, onClear, data, revealPii, setRevealPii }: PrivacyPanelProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = () => {
    setIsClearing(true);
    setTimeout(() => {
      onClear();
      setIsClearing(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-xl p-space-xl border-[3px] border-primary shadow-[6px_6px_0px_#000000] transition-all animate-in zoom-in-95">
        <button 
          onClick={onClose}
          aria-label="Close"
          className="absolute top-space-lg right-space-lg w-8 h-8 rounded-full flex items-center justify-center font-label-lg text-label-lg text-primary hover:bg-surface-container transition-colors focus:outline-none cursor-pointer"
        >
          ✕
        </button>
        <div className="flex flex-col items-start gap-space-lg pt-space-xs">
          <h1 className="font-headline-lg text-headline-lg uppercase text-primary tracking-tight">
            PRIVACY
          </h1>
          <div className="flex flex-col gap-space-xs font-body-lg text-body-lg text-primary">
            <p>No server.</p>
            <p>No tracking.</p>
            <p>Data stays on your device.</p>
          </div>
          
          <div className="w-full pt-space-md border-t-2 border-primary border-dashed mt-2">
            <div className="mb-space-md">
              <span className="font-label-md text-label-md uppercase tracking-wider text-primary block mb-2">Shield Settings</span>
              <PiiShield data={data} revealPii={revealPii} setRevealPii={setRevealPii} />
            </div>
            <button 
              onClick={handleClear}
              disabled={isClearing}
              className={`w-full font-label-lg text-label-lg uppercase tracking-wider rounded-full py-3 px-6 transition-all border-[2.5px] border-primary shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none text-center cursor-pointer ${
                isClearing 
                  ? 'bg-secondary-container text-on-surface' 
                  : 'bg-primary text-on-primary'
              }`}
            >
              {isClearing ? 'Cleared' : 'Clear all data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
