import { type ScoredMessage } from '../lib/score';
import { MessageCard } from './MessageCard';

export function CatchUpCard({ top3 }: { top3: ScoredMessage[] }) {
  if (top3.length === 0) return <div className="text-[#9ca3af]">No critical items found.</div>;
  
  return (
    <div className="space-y-4">
      {top3.map(m => (
        <MessageCard key={m.id} msg={m} />
      ))}
    </div>
  );
}
