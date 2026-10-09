import { maskPII, type PiiItem } from './pii';

export interface Message {
  id: string;
  timestamp: Date;
  sender: string;
  text: string;
  maskedText: string;
  piiItems: PiiItem[];
  hasHighRisk: boolean;
}

export function parseWhatsApp(text: string): Message[] {
  const lines = text.split(/\r?\n/);
  const messages: Message[] = [];
  let currentMessage: Message | null = null;

  const prefixRegex1 = /^(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}(?::\d{2})? ?(?:[APap][Mm])?) - (.*)$/;
  const prefixRegex2 = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}(?::\d{2})? ?(?:[APap][Mm])?)\] (.*)$/;
  const senderRegex = /^([^:]+): (.*)$/;

  let messageId = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const match = line.match(prefixRegex1) || line.match(prefixRegex2);
    
    if (match) {
      const [, dateStr, timeStr, rest] = match;
      
      const senderMatch = rest.match(senderRegex);
      if (senderMatch) {
        const sender = senderMatch[1].trim();
        const msgText = senderMatch[2].trim();

        if (msgText.includes('<Media omitted>') || msgText.includes('deleted this message') || msgText.includes('This message was deleted') || msgText.includes('joined using this group')) {
          currentMessage = null;
          continue;
        }

        const timestamp = parseDate(dateStr, timeStr);
        currentMessage = {
          id: `msg-${messageId++}`,
          timestamp,
          sender,
          text: msgText,
          maskedText: '',
          piiItems: [],
          hasHighRisk: false
        };
        messages.push(currentMessage);
      } else {
        // System message matching date format
        currentMessage = null;
      }
    } else {
      // Continuation of previous multi-line message
      if (currentMessage) {
        currentMessage.text += '\n' + line;
      }
    }
  }

  for (const msg of messages) {
    const pii = maskPII(msg.text);
    msg.maskedText = pii.masked;
    msg.piiItems = pii.items;
    msg.hasHighRisk = pii.hasHighRisk;
  }

  return messages;
}

function parseDate(dateStr: string, timeStr: string): Date {
  const [day, month, yearStr] = dateStr.split('/');
  const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
  
  const isPM = timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.toLowerCase().includes('am');
  const timeOnly = timeStr.replace(/[a-zA-Z\s]/g, '').trim();
  const timeParts = timeOnly.split(':');
  let hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1] || '0', 10);
  const seconds = parseInt(timeParts[2] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return new Date(year, parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes, seconds);
}
