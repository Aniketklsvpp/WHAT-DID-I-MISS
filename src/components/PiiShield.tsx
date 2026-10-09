import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Eye } from 'lucide-react';
import { type CatchUpData } from '../lib/score';

interface PiiShieldProps {
  data: CatchUpData;
  revealPii: boolean;
  setRevealPii: (v: boolean) => void;
  showAiView: boolean;
  setShowAiView: (v: boolean) => void;
}

export function PiiShield({ data, revealPii, setRevealPii, showAiView, setShowAiView }: PiiShieldProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newCounts: Record<string, number> = {};
    let t = 0;
    data.allScored.forEach(m => {
      m.piiItems?.forEach(item => {
        newCounts[item.type] = (newCounts[item.type] || 0) + 1;
        t++;
      });
    });
    setCounts(newCounts);
    setTotal(t);
  }, [data]);

  useEffect(() => {
    if (revealPii) {
      const timer = setTimeout(() => setRevealPii(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [revealPii, setRevealPii]);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-4 rounded-xl border-2 border-primary bg-surface-container-low shadow-[2px_2px_0px_#000000] gap-4">
      <div 
        tabIndex={0}
        role="region"
        aria-label={`Masked ${total} PII items pill. Hover or focus for breakdown.`}
        className="group relative flex items-center space-x-2 text-primary cursor-help w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
      >
        <Shield size={20} className="fill-secondary-container" />
        <span className="font-body-md font-bold">Masked {total} item{total !== 1 ? 's' : ''}</span>
        
        <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-surface-container-lowest border-2 border-primary rounded-xl shadow-[4px_4px_0px_#000000] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all z-50">
          <div className="space-y-1">
            {Object.entries(counts).map(([type, count]) => (
              <div key={type} className="flex justify-between font-label-sm uppercase tracking-wider text-primary">
                <span>{type}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t-2 border-primary border-dashed font-label-sm text-on-surface-variant">
            AI never sees original values
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        <label className="flex items-center space-x-2 cursor-pointer text-primary">
          <input 
            type="checkbox" 
            checked={showAiView}
            onChange={(e) => setShowAiView(e.target.checked)}
            aria-label="Toggle What AI Sees view"
            className="w-4 h-4 border-2 border-primary rounded bg-surface-container-lowest text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <span className="font-label-sm uppercase tracking-wider">What AI Sees</span>
        </label>

        <button 
          onClick={() => setRevealPii(!revealPii)}
          aria-label={revealPii ? "Hide sensitive PII values" : "Reveal sensitive PII values"}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-label-sm uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none border-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            revealPii 
              ? 'bg-error-container text-on-error-container border-error' 
              : 'bg-primary text-on-primary border-primary hover:bg-surface hover:text-primary hover:border-primary'
          }`}
        >
          {revealPii ? <ShieldAlert size={16} /> : <Eye size={16} />}
          <span>{revealPii ? 'Hide (30s)' : 'Reveal'}</span>
        </button>
      </div>
    </div>
  );
}
