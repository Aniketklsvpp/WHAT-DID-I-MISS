import { type ScoredMessage } from '../lib/score';

export function MessageCard({ msg, hideReasons = false }: { msg: ScoredMessage, hideReasons?: boolean }) {
  const getUrgencyColor = (score: number) => {
    if (score >= 70) return 'border-red-500/50 bg-red-500/10 text-red-400';
    if (score >= 40) return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
    return 'border-green-500/50 bg-green-500/10 text-green-400';
  };

  return (
    <div className={`p-4 rounded-xl border bg-[#111827] shadow-sm mb-3 ${getUrgencyColor(msg.score).split(' ')[0]}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm text-[#f9fafb]">{msg.sender}</span>
        <span className="text-xs text-[#9ca3af]">{msg.timestamp.toLocaleString()}</span>
      </div>
      <p className="text-sm text-[#f9fafb] whitespace-pre-wrap">{msg.text}</p>
      
      {!hideReasons && msg.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {msg.reasons.map(r => (
            <span key={r} className={`px-2 py-1 text-xs rounded-full font-medium ${getUrgencyColor(msg.score)}`}>
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
