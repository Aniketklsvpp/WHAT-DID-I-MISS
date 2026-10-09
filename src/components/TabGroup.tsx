import { useState } from 'react';
import { type ScoredMessage } from '../lib/score';
import { MessageContent } from './MessageContent';

interface TabGroupProps {
  data: {
    actionItems: ScoredMessage[];
    deadlines: ScoredMessage[];
    decisions: ScoredMessage[];
    openQuestions: ScoredMessage[];
    mentions: ScoredMessage[];
  };
  revealPii: boolean;
  showAiView: boolean;
}

export function TabGroup({ data, revealPii, showAiView }: TabGroupProps) {
  const [activeTab, setActiveTab] = useState<'actions'|'deadlines'|'decisions'|'mentions'>('actions');

  const getItems = () => {
    switch (activeTab) {
      case 'actions': return data.actionItems;
      case 'deadlines': return data.deadlines;
      case 'decisions': return [...data.decisions, ...data.openQuestions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'mentions': return data.mentions;
      default: return [];
    }
  };

  const tabs = [
    { id: 'actions', label: 'Actions' },
    { id: 'deadlines', label: 'Deadlines' },
    { id: 'decisions', label: 'Decisions' },
    { id: 'mentions', label: 'Mentions' },
  ] as const;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar" id="tab-group" role="tablist" aria-label="Category tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-label={`View ${t.label} tab`}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full font-label-md text-label-md uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              activeTab === t.id
                ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#000000]'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3" id="tab-content" role="tabpanel" aria-live="polite">
        {getItems().map(item => (
          <div key={item.id} className="p-4 rounded-xl bg-surface-container-lowest shadow-[2px_2px_0px_#000000] flex justify-between items-baseline gap-4">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              <MessageContent msg={item} revealPii={revealPii} showAiView={showAiView} />
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase whitespace-nowrap shrink-0">{item.sender}</span>
          </div>
        ))}
        {getItems().length === 0 && (
          <div className="p-4 text-on-surface-variant font-body-md">
            No items found for this category.
          </div>
        )}
      </div>
    </section>
  );
}
