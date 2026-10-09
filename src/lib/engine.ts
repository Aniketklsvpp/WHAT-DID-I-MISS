import * as chrono from 'chrono-node';
import { EnglishKeywords } from './keywords';
import { HinglishKeywords } from './hinglish';
import { normalizeText } from './normalize';
import { type Message } from './parser';

export interface MessageTags {
  mention: boolean;
  question: boolean;
  deadline: boolean;
  decision: boolean;
  action: boolean;
  urgent: boolean;
  unanswered: boolean;
  deadlineDate: Date | null;
  matchedPhrases: string[];
}

export function tagMessage(msg: Message, currentUser: string, allMessages: Message[]): MessageTags {
  const normText = normalizeText(msg.text);
  const tags: MessageTags = {
    mention: false,
    question: false,
    deadline: false,
    decision: false,
    action: false,
    urgent: false,
    unanswered: false,
    deadlineDate: null,
    matchedPhrases: []
  };

  // Mentions
  const mentionPattern = new RegExp(`@${currentUser}\\b|\\b${currentUser}\\b`, 'i');
  if (mentionPattern.test(msg.text)) {
    tags.mention = true;
    tags.matchedPhrases.push(`@${currentUser}`);
  }

  // Question
  if (msg.text.includes('?')) {
    tags.question = true;
    tags.matchedPhrases.push('?');
  } else {
    const allQ = [...EnglishKeywords.questionWords, ...HinglishKeywords.questionWords];
    for (const q of allQ) {
      if (normText.startsWith(q)) {
        tags.question = true;
        tags.matchedPhrases.push(q);
        break;
      }
    }
  }

  // Unanswered
  if (tags.question) {
    const currentIndex = allMessages.findIndex(m => m.id === msg.id);
    let answered = false;
    if (currentIndex !== -1) {
      const nextMessages = allMessages.slice(currentIndex + 1, currentIndex + 11);
      for (const nextMsg of nextMessages) {
        if (nextMsg.sender !== msg.sender) {
          answered = true;
          break;
        }
      }
    }
    tags.unanswered = !answered;
  }

  // Decision
  for (const d of EnglishKeywords.decision) {
    if (normText.includes(d)) {
      tags.decision = true;
      tags.matchedPhrases.push(d);
    }
  }

  // Action
  const allAction = [...EnglishKeywords.action, ...HinglishKeywords.action];
  for (const a of allAction) {
    if (normText.includes(a)) {
      tags.action = true;
      tags.matchedPhrases.push(a);
    }
  }

  // Urgent
  const allUrgent = [...EnglishKeywords.urgent, ...HinglishKeywords.urgent];
  for (const u of allUrgent) {
    if (normText.includes(u)) {
      tags.urgent = true;
      tags.matchedPhrases.push(u);
    }
  }

  // Deadline
  let parsedDate: Date | null = null;
  const msgDate = new Date(msg.timestamp);

  // Check Hinglish relative phrases first
  for (const d of HinglishKeywords.deadline) {
    if (normText.includes(d)) {
      tags.deadline = true;
      tags.matchedPhrases.push(d);
      
      const targetDate = new Date(msgDate);
      if (d === 'kal tak') {
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(23, 59, 59, 0);
      } else if (d === 'aaj raat tak') {
        targetDate.setHours(23, 59, 59, 0);
      } else if (d === 'parso') {
        targetDate.setDate(targetDate.getDate() + 2);
        targetDate.setHours(23, 59, 59, 0);
      } else if (d === 'is hafte') {
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (d === 'subah tak') {
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(9, 0, 0, 0);
      } else if (d === 'shaam tak') {
        targetDate.setHours(18, 0, 0, 0);
      }
      parsedDate = targetDate;
      break;
    }
  }

  // If no Hinglish phrase, try chrono on English
  if (!parsedDate) {
    const chronoParsed = chrono.parse(msg.text, msgDate, { forwardDate: true });
    if (chronoParsed.length > 0) {
      tags.deadline = true;
      parsedDate = chronoParsed[0].start.date();
      tags.matchedPhrases.push(chronoParsed[0].text);
    }
  }

  tags.deadlineDate = parsedDate;

  return tags;
}
