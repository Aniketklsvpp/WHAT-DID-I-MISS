import { describe, it, expect } from 'vitest';
import { tagMessage } from './engine';
import { type Message } from './parser';

describe('Tagging Engine', () => {
  const dummyMsgs: Message[] = [
    { maskedText: '', piiItems: [], hasHighRisk: false, id: '1', sender: 'Alice', text: 'Where is the report?', timestamp: new Date() },
    { maskedText: '', piiItems: [], hasHighRisk: false, id: '2', sender: 'Bob', text: 'I have it.', timestamp: new Date() },
    { maskedText: '', piiItems: [], hasHighRisk: false, id: '3', sender: 'Charlie', text: 'kal tak bhej do report!', timestamp: new Date('2026-03-12T10:00:00') },
    { maskedText: '', piiItems: [], hasHighRisk: false, id: '4', sender: 'Dave', text: 'Are you sure @Alice?', timestamp: new Date() },
    { maskedText: '', piiItems: [], hasHighRisk: false, id: '5', sender: 'Alice', text: 'Yes. It is urgent.', timestamp: new Date() },
  ];

  it('tags mentions correctly', () => {
    const tags = tagMessage(dummyMsgs[3], 'Alice', dummyMsgs);
    expect(tags.mention).toBe(true);
    expect(tags.matchedPhrases).toContain('@Alice');
  });

  it('tags hinglish deadlines relative to message time', () => {
    const tags = tagMessage(dummyMsgs[2], 'Alice', dummyMsgs);
    expect(tags.deadline).toBe(true);
    expect(tags.matchedPhrases).toContain('kal tak');
    expect(tags.action).toBe(true); // "bhej do" is action
    
    // Check relative date math (kal tak = +1 day)
    expect(tags.deadlineDate?.getDate()).toBe(13); // msg was Mar 12
    expect(tags.deadlineDate?.getHours()).toBe(23); // 23:59:59
  });

  it('tags unanswered questions', () => {
    // msg 4 is a question from Dave, msg 5 is a reply from Alice -> answered!
    const tagsDave = tagMessage(dummyMsgs[3], 'Dave', dummyMsgs);
    expect(tagsDave.question).toBe(true);
    expect(tagsDave.unanswered).toBe(false);

    // If there is a msg at the end with no replies
    const qMsg = { maskedText: '', piiItems: [], hasHighRisk: false, id: '6', sender: 'Alice', text: 'kaise karna hai?', timestamp: new Date() };
    const tagsQ = tagMessage(qMsg, 'Dave', [...dummyMsgs, qMsg]);
    expect(tagsQ.question).toBe(true);
    expect(tagsQ.unanswered).toBe(true);
  });
});
