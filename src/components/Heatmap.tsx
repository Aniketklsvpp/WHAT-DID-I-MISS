import { useState, useMemo } from 'react';
import { type CatchUpData, type ScoredMessage } from '../lib/score';

interface HeatmapProps {
  data: CatchUpData;
  onFilter: (range: { start: Date, end: Date } | null) => void;
}

export function Heatmap({ data, onFilter }: HeatmapProps) {
  const [activeBucket, setActiveBucket] = useState<number | null>(null);

  const { buckets, isPerDay, firstTime, duration } = useMemo(() => {
    const all = data.allScored;
    if (all.length === 0) return { buckets: [], isPerDay: false, maxCount: 0, firstTime: 0, duration: 0 };

    const sorted = [...all].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstTime = sorted[0].timestamp.getTime();
    const lastTime = sorted[sorted.length - 1].timestamp.getTime();
    const duration = lastTime - firstTime || 1;
    const isPerDay = duration > 3 * 24 * 60 * 60 * 1000;
    
    const bucketSize = isPerDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    
    const numBuckets = Math.max(1, Math.ceil(duration / bucketSize));
    const bucketArr = Array.from({ length: numBuckets }, (_, i) => ({
      start: new Date(firstTime + i * bucketSize),
      end: new Date(firstTime + (i + 1) * bucketSize),
      messages: [] as ScoredMessage[],
      maxScore: 0,
      topReason: ''
    }));

    sorted.forEach(m => {
      const idx = Math.min(Math.floor((m.timestamp.getTime() - firstTime) / bucketSize), numBuckets - 1);
      bucketArr[idx].messages.push(m);
      if (m.score > bucketArr[idx].maxScore) {
        bucketArr[idx].maxScore = m.score;
        bucketArr[idx].topReason = m.reasons[0] || 'Flagged';
      }
    });

    let maxCount = 1;
    bucketArr.forEach(b => {
      if (b.messages.length > maxCount) maxCount = b.messages.length;
    });

    return { buckets: bucketArr, isPerDay, maxCount, firstTime, duration };
  }, [data.allScored]);

  if (buckets.length === 0) return null;

  const handleBucketClick = (idx: number) => {
    if (activeBucket === idx) {
      setActiveBucket(null);
      onFilter(null);
    } else {
      setActiveBucket(idx);
      onFilter({ start: buckets[idx].start, end: buckets[idx].end });
    }
  };

  const getBucketColor = (score: number) => {
    if (score === 0) return 'bg-surface-container'; 
    if (score >= 70) return 'bg-error'; 
    if (score >= 40) return 'bg-tertiary-fixed'; 
    return 'bg-secondary-container'; 
  };

  return (
    <div className="w-full space-y-4 mb-12">
      <div className="flex justify-between items-end">
        <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
          Timeline
        </h3>
        {activeBucket !== null && (
          <button 
            onClick={() => { setActiveBucket(null); onFilter(null); }}
            aria-label="Clear timeline filter"
            className="text-xs px-3 py-1 bg-primary text-on-primary font-bold rounded-full transition-colors cursor-pointer uppercase tracking-widest shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="relative w-full h-4 rounded-full overflow-hidden flex bg-surface-container-lowest shadow-[2px_2px_0px_#000000] border-2 border-primary group/container" role="region" aria-label="Interactive chat timeline">
        {buckets.map((b, i) => {
          const count = b.messages.length;
          const colorClass = getBucketColor(b.maxScore);
          
          return (
            <div 
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Timeline segment ${i + 1} of ${buckets.length}: ${b.start.toLocaleDateString()} ${b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${count} messages`}
              onClick={() => handleBucketClick(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBucketClick(i);
                }
              }}
              className={`relative h-full flex-1 transition-all duration-300 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${colorClass} ${activeBucket === i ? 'brightness-125' : 'hover:brightness-110 border-r border-primary/20'}`}
              style={{ opacity: activeBucket === null || activeBucket === i ? 1 : 0.3 }}
            >
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-container-lowest text-primary text-xs p-3 rounded-xl shadow-[4px_4px_0px_#000000] border-2 border-primary pointer-events-none z-50 transition-opacity">
                <div className="font-bold mb-1 uppercase tracking-wider">{b.start.toLocaleDateString()} {b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="mb-1">{count} messages</div>
                {b.maxScore > 0 && <div className="mt-1 text-on-surface-variant font-semibold border-t-2 border-primary border-dashed pt-1">🔥 {b.topReason} (Score: {b.maxScore})</div>}
              </div>
            </div>
          );
        })}

        {/* Deadline Markers */}
        {data.deadlines.map(m => {
          if (!m.tags.deadlineDate) return null;
          const time = m.tags.deadlineDate.getTime();
          if (time < firstTime || time > firstTime + duration) return null;
          const leftPercent = ((time - firstTime) / duration) * 100;
          return (
            <div 
              key={m.id} 
              className="absolute top-0 w-[2px] h-full bg-primary z-20 group-hover/container:opacity-100 opacity-70 transition-opacity"
              style={{ left: `${leftPercent}%` }}
              title={`Deadline: ${m.text}`}
            >
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-error rounded-full border border-primary"></div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-1">
        <span>{new Date(firstTime).toLocaleString()}</span>
        <span>Bucket = {isPerDay ? '1 Day' : '1 Hour'}</span>
        <span>{new Date(firstTime + duration).toLocaleString()}</span>
      </div>
    </div>
  );
}
