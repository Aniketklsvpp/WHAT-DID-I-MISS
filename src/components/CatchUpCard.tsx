import { type ScoredMessage } from '../lib/score';
import { MessageContent } from './MessageContent';

export function CatchUpCard({ top3, revealPii, showAiView }: { top3: ScoredMessage[], revealPii: boolean, showAiView: boolean }) {
  if (top3.length === 0) return <div className="text-on-surface-variant">No critical items found.</div>;
  
  const colors = [
    { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
    { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-container' },
    { bg: 'bg-surface-variant', text: 'text-on-surface-variant' }
  ];

  return (
    <div className="flex flex-col gap-4">
      {top3.slice(0, 3).map((m, i) => {
        const color = colors[i] || colors[2];
        const subtext = m.reasons.length > 0 ? m.reasons[0] : `${m.sender} • ${m.timestamp.toLocaleTimeString()}`;
        return (
          <div key={m.id} className={`p-6 rounded-2xl ${color.bg} text-on-surface shadow-[4px_4px_0px_#000000] transition-transform hover:-translate-y-0.5`}>
            <span className="font-headline-md text-headline-md block leading-none mb-3">#{i + 1}</span>
            <p className="font-body-lg text-body-lg font-bold leading-snug mb-1">
              <MessageContent msg={m} revealPii={revealPii} showAiView={showAiView} />
            </p>
            <p className={`font-label-md text-label-md uppercase tracking-widest ${color.text} font-bold`}>
              {subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
