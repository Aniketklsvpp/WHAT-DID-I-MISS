import { type ScoredMessage } from '../lib/score';

export function DeadlinesTimeline({ items }: { items: ScoredMessage[] }) {
  if (items.length === 0) return <div className="text-[#9ca3af] text-sm">No upcoming deadlines.</div>;

  const sorted = [...items].sort((a, b) => {
    const aTime = a.tags.deadlineDate?.getTime() || 0;
    const bTime = b.tags.deadlineDate?.getTime() || 0;
    return aTime - bTime;
  });

  const getCountdown = (date: Date) => {
    // simplified countdown relative to chat 'now' (handled inherently by score)
    const diff = date.getTime() - Date.now();
    if (diff < 0) return "Past due";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `In ${days}d ${hours}h`;
    return `In ${hours} hours`;
  };

  return (
    <div className="relative border-l border-[#374151] ml-3 space-y-6">
      {sorted.map(m => (
        <div key={m.id} className="relative pl-6">
          <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-[#10b981] border-4 border-[#1f2937]"></span>
          <div className="font-semibold text-sm text-[#10b981] mb-1">
            {m.tags.deadlineDate?.toLocaleDateString()} - {m.tags.deadlineDate ? getCountdown(m.tags.deadlineDate) : ''}
          </div>
          <div className="p-3 rounded-lg bg-[#111827] border border-[#374151]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-[#f9fafb] font-medium">{m.sender}</span>
            </div>
            <div className="text-sm text-[#9ca3af]">{m.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
