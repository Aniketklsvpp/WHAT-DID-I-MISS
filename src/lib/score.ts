import { type Message } from './parser';
import { type MessageTags, tagMessage } from './engine';

export interface ScoredMessage extends Message {
  tags: MessageTags;
  score: number;
  reasons: string[];
}

export function scoreMessage(_msg: Message, tags: MessageTags, now: Date): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (tags.mention) {
    score += 30;
    reasons.push("Mentions you");
  }

  if (tags.mention && tags.question) {
    score += 25;
    reasons.push("Direct question");
  }

  if (tags.deadline && tags.deadlineDate) {
    const diffMs = tags.deadlineDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    // Use formatting for the reason string (e.g. Fri 5 PM)
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: 'numeric', minute: '2-digit' };
    const dateStr = tags.deadlineDate.toLocaleString('en-US', options);

    if (diffHours >= 0 && diffHours <= 48) {
      score += 25;
      reasons.push(`Deadline: ${dateStr}`);
    } else if (diffDays >= 0 && diffDays <= 7) {
      score += 10;
      reasons.push(`Deadline: ${dateStr}`);
    }
  }

  if (tags.action) {
    score += 15;
    reasons.push("Action requested");
  }

  if (tags.urgent) {
    score += 15;
    reasons.push("Urgent wording");
  }

  if (tags.decision) {
    score += 10;
    reasons.push("Decision made");
  }

  if (tags.unanswered) {
    score += 10;
    reasons.push("Unanswered question");
  }

  if (score > 100) score = 100;

  return { score, reasons };
}

export interface CatchUpData {
  top3: ScoredMessage[];
  actionItems: ScoredMessage[];
  deadlines: ScoredMessage[];
  decisions: ScoredMessage[];
  openQuestions: ScoredMessage[];
  mentions: ScoredMessage[];
  allScored: ScoredMessage[];
}

export function buildCatchUp(messages: Message[], currentUser: string): CatchUpData {
  if (messages.length === 0) {
    return { top3: [], actionItems: [], deadlines: [], decisions: [], openQuestions: [], mentions: [], allScored: [] };
  }

  const lastMessageTime = messages[messages.length - 1].timestamp;
  // If real now is way past chat (e.g. sample chat), use chat's last message time as "now"
  // Let's say if the chat ended more than 24 hours ago, use its last time.
  const realNow = new Date();
  const now = (realNow.getTime() - lastMessageTime.getTime() > 24 * 60 * 60 * 1000) 
              ? lastMessageTime 
              : realNow;

  const scored: ScoredMessage[] = messages.map(msg => {
    const tags = tagMessage(msg, currentUser, messages);
    const { score, reasons } = scoreMessage(msg, tags, now);
    return { ...msg, tags, score, reasons };
  });

  const relevant = scored.filter(m => m.score > 0);

  // Deduplicate near-identical consecutive messages
  const deduplicated: ScoredMessage[] = [];
  for (let i = 0; i < relevant.length; i++) {
    const curr = relevant[i];
    if (deduplicated.length > 0) {
      const prev = deduplicated[deduplicated.length - 1];
      
      const timeDiff = Math.abs(curr.timestamp.getTime() - prev.timestamp.getTime());
      const isSubtext = prev.text.includes(curr.text) || curr.text.includes(prev.text);
      
      if (curr.sender === prev.sender && timeDiff < 5 * 60 * 1000 && isSubtext) {
        // Merge text if not fully contained
        if (curr.text.length > prev.text.length) {
            prev.text = curr.text;
        }
        // Merge reasons and max score
        prev.reasons = Array.from(new Set([...prev.reasons, ...curr.reasons]));
        prev.score = Math.max(prev.score, curr.score);
        continue;
      }
    }
    deduplicated.push({ ...curr });
  }

  deduplicated.sort((a, b) => b.score - a.score || b.timestamp.getTime() - a.timestamp.getTime());

  const top3 = deduplicated.slice(0, 3);
  const actionItems = deduplicated.filter(m => m.tags.action);
  const deadlines = deduplicated.filter(m => m.tags.deadline);
  const decisions = deduplicated.filter(m => m.tags.decision);
  const openQuestions = deduplicated.filter(m => m.tags.unanswered);
  const mentions = deduplicated.filter(m => m.tags.mention);

  return {
    top3,
    actionItems,
    deadlines,
    decisions,
    openQuestions,
    mentions,
    allScored: scored
  };
}
