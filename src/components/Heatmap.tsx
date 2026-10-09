import { useState, useMemo } from 'react';
import { type CatchUpData, type ScoredMessage } from '../lib/score';

interface HeatmapProps {
  data: CatchUpData;
  onFilter: (range: { start: Date, end: Date } | null) => void;
}

export function Heatmap({ data, onFilter }: HeatmapProps) {
  const [activeBucket, setActiveBucket] = useState<number | null>(null);

  const { buckets, isPerDay, maxCount, firstTime, duration } = useMemo(() => {
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
    if (score === 0) return 'rgb(55, 65, 81)'; // #374151
    if (score >= 70) return 'rgb(239, 68, 68)'; // red-500
    if (score >= 40) return 'rgb(245, 158, 11)'; // amber-500
    return 'rgb(16, 185, 129)'; // green-500
  };

  return (
    <div className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          Urgency Heatmap
        </h3>
        {activeBucket !== null && (
          <button 
            onClick={() => { setActiveBucket(null); onFilter(null); }}
            className="text-xs px-4 py-2 bg-[#374151] hover:bg-[#10b981] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="relative w-full h-20 flex items-end bg-[#111827] rounded-lg border border-[#374151] overflow-visible group/container">
        {buckets.map((b, i) => {
          const count = b.messages.length;
          const opacity = count === 0 ? 1 : Math.max(0.2, count / maxCount);
          const color = getBucketColor(b.maxScore);
          
          return (
            <div 
              key={i}
              onClick={() => handleBucketClick(i)}
              className={`relative h-full flex-1 transition-all duration-300 cursor-pointer group ${activeBucket === i ? 'ring-2 ring-white z-10' : 'hover:opacity-100 hover:brightness-125 hover:z-30 border-r border-[#1f2937]/50'}`}
              style={{ backgroundColor: color, opacity: activeBucket === null || activeBucket === i ? opacity : opacity * 0.3 }}
            >
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-black text-white text-xs p-3 rounded-lg shadow-2xl pointer-events-none z-50 border border-gray-800 transition-opacity">
                <div className="font-bold text-[#10b981] mb-1">{b.start.toLocaleDateString()} {b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="mb-1">{count} messages</div>
                {b.maxScore > 0 && <div className="mt-1 text-amber-400 font-semibold border-t border-gray-800 pt-1">🔥 {b.topReason} (Score: {b.maxScore})</div>}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
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
              className="absolute top-0 w-[2px] h-full bg-white z-20 group-hover/container:opacity-100 opacity-70 transition-opacity"
              style={{ left: `${leftPercent}%` }}
              title={`Deadline: ${m.text}`}
            >
              <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-3 text-xs text-[#9ca3af] font-medium uppercase tracking-wider">
        <span>{new Date(firstTime).toLocaleString()}</span>
        <span>Bucket = {isPerDay ? '1 Day' : '1 Hour'}</span>
        <span>{new Date(firstTime + duration).toLocaleString()}</span>
      </div>
    </div>
  );
}
