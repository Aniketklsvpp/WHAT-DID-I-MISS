import { type ScoredMessage } from '../lib/score';
import { MessageCard } from './MessageCard';

export function DecisionsPanel({ decisions, unresolved }: { decisions: ScoredMessage[], unresolved: ScoredMessage[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm uppercase text-[#10b981] font-bold mb-3 border-b border-[#10b981]/30 pb-2">Decided</h4>
        {decisions.length === 0 ? <div className="text-[#9ca3af] text-sm">No decisions found.</div> : (
          <div className="space-y-3">
            {decisions.map(m => <MessageCard key={m.id} msg={m} />)}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-sm uppercase text-amber-500 font-bold mb-3 border-b border-amber-500/30 pb-2">Still Unresolved</h4>
        {unresolved.length === 0 ? <div className="text-[#9ca3af] text-sm">No open questions.</div> : (
          <div className="space-y-3">
            {unresolved.map(m => <MessageCard key={m.id} msg={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
