import { type ScoredMessage } from '../lib/score';
import { MessageCard } from './MessageCard';

export function MentionsPanel({ mentions }: { mentions: ScoredMessage[] }) {
  if (mentions.length === 0) return <div className="text-[#9ca3af] text-sm">No direct mentions.</div>;
  return (
    <div className="space-y-3">
      {mentions.map(m => <MessageCard key={m.id} msg={m} />)}
    </div>
  );
}
