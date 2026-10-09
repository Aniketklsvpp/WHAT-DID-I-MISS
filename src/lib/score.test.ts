import { describe, it, expect } from 'vitest';
import { scoreMessage } from './score';
import { type MessageTags } from './engine';
import { type Message } from './parser';

describe('Scoring Engine', () => {
  const dummyTags: MessageTags = {
    mention: true,
    question: true,
    deadline: true,
    decision: false,
    action: true,
    urgent: false,
    unanswered: false,
    deadlineDate: new Date(Date.now() + 24 * 3600 * 1000), // +24h
    matchedPhrases: []
  };

  it('calculates correct score and reasons', () => {
    const msg: Message = { maskedText: '', piiItems: [], hasHighRisk: false, id: '1', sender: 'Alice', text: 'hello', timestamp: new Date() };
    const result = scoreMessage(msg, dummyTags, new Date());
    
    // mention (30) + direct question (25) + deadline<48h (25) + action (15) = 95
    expect(result.score).toBe(95);
    expect(result.reasons).toContain("Mentions you");
    expect(result.reasons).toContain("Direct question");
    expect(result.reasons).toContain("Action requested");
  });

  it('clamps to 100', () => {
    const urgentTags = { ...dummyTags, urgent: true }; // 95 + 15 = 110
    const msg: Message = { maskedText: '', piiItems: [], hasHighRisk: false, id: '2', sender: 'Alice', text: 'hello', timestamp: new Date() };
    const result = scoreMessage(msg, urgentTags, new Date());
    expect(result.score).toBe(100);
  });
});
