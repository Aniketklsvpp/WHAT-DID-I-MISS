import { type ScoredMessage } from '../lib/score';
import { MessageCard } from './MessageCard';

export function ActionItems({ items }: { items: ScoredMessage[] }) {
  if (items.length === 0) return <div className="text-[#9ca3af] text-sm">No action items requested.</div>;
  return (
    <div className="space-y-3">
      {items.map(m => (
        <MessageCard key={m.id} msg={m} hideReasons={false} />
      ))}
    </div>
  );
}
