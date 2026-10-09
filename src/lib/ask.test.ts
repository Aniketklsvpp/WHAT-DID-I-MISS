import { describe, it, expect } from 'vitest';
import { retrieveMessages } from './ask';
import { type ScoredMessage } from './score';

describe('Ask Retrieval Engine', () => {
  it('retrieves relevant messages and surrounding context', () => {
    const dummy: ScoredMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      sender: i % 2 === 0 ? 'Alice' : 'Bob',
      text: i === 5 ? 'The venue is set for Central Park.' : `Random chat text ${i}`,
      timestamp: new Date(1000 * i),
      score: 0,
      reasons: [],
      maskedText: '',
      piiItems: [],
      hasHighRisk: false,
      tags: { mention: false, question: false, deadline: false, deadlineDate: null, decision: false, action: false, urgent: false, unanswered: false, matchedPhrases: [] }
    }));

    const result = retrieveMessages('where is the venue?', dummy);
    
    const ids = result.messages.map(m => m.id);
    expect(ids).toContain('msg-4');
    expect(ids).toContain('msg-5');
    expect(ids).toContain('msg-6');
    expect(result.topHits[0].id).toBe('msg-5');
  });

  it('detects target senders in Hinglish', () => {
    const dummy: ScoredMessage[] = [
      { maskedText: '', piiItems: [], hasHighRisk: false, id: '1', sender: 'Rahul', text: 'ok', timestamp: new Date(), score: 0, reasons: [], tags: { mention: false, question: false, deadline: false, deadlineDate: null, decision: false, action: false, urgent: false, unanswered: false, matchedPhrases: [] } },
    ];
    const result = retrieveMessages('rahul ne kya bola?', dummy);
    expect(result.targetSenders).toContain('rahul');
  });
});
