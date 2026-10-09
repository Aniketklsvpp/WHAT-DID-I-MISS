import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Eye } from 'lucide-react';
import { type CatchUpData } from '../lib/score';

export function PiiShield({ data, revealPii, setRevealPii }: { data: CatchUpData, revealPii: boolean, setRevealPii: (v: boolean) => void }) {
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
    <div className="flex items-center justify-between w-full p-4 rounded-xl border-2 border-primary bg-surface-container-low shadow-[2px_2px_0px_#000000]">
      <div className="group relative flex items-center space-x-2 text-primary cursor-help">
        <Shield size={20} className="fill-secondary-container" />
        <span className="font-body-md font-bold">Masked {total} item{total !== 1 ? 's' : ''}</span>
        
        <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-surface-container-lowest border-2 border-primary rounded-xl shadow-[4px_4px_0px_#000000] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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

      <button 
        onClick={() => setRevealPii(!revealPii)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-label-sm uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none border-2 ${
          revealPii 
            ? 'bg-error-container text-on-error-container border-error' 
            : 'bg-primary text-on-primary border-primary hover:bg-surface hover:text-primary hover:border-primary'
        }`}
      >
        {revealPii ? <ShieldAlert size={16} /> : <Eye size={16} />}
        <span>{revealPii ? 'Hide (30s)' : 'Reveal'}</span>
      </button>
    </div>
  );
}
