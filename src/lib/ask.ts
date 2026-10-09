import { type ScoredMessage } from './score';
import { normalizeText } from './normalize';

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'who', 'why', 'how', 'is', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in', 'on', 'for', 'with', 'about', 'did', 'do', 'does', 'say', 'tell', 'said', 'told', 'about',
  'kya', 'kab', 'kahan', 'kaun', 'kyun', 'kaise', 'kisne', 'kisko', 'hai', 'tha', 'thi', 'the', 'aur', 'ya', 'par', 'mein', 'se', 'ko', 'ki', 'ke', 'liye', 'kya', 'bole', 'bola', 'baare', 'me'
]);

export interface RetrievedContext {
  messages: ScoredMessage[];
  topHits: ScoredMessage[];
  targetSenders: string[];
}

export function retrieveMessages(
  question: string,
  allMessages: ScoredMessage[]
): RetrievedContext {
  if (!question.trim()) return { messages: [], topHits: [], targetSenders: [] };

  const uniqueSenders = Array.from(new Set(allMessages.map(m => m.sender.toLowerCase())));
  const normalizedQ = normalizeText(question);
  const qTokens = normalizedQ.split(/\s+/).filter(t => t.length > 0);

  const targetSenders = uniqueSenders.filter(s => {
    if (normalizedQ.includes(s)) return true;
    return qTokens.includes(s);
  });

  const queryTerms = qTokens.filter(t => !STOP_WORDS.has(t));

  if (queryTerms.length === 0 && targetSenders.length === 0) {
    return { messages: [], topHits: [], targetSenders: [] };
  }

  const docCount = allMessages.length;
  const df: Record<string, number> = {};
  allMessages.forEach(m => {
    const text = normalizeText(m.text);
    const words = new Set(text.split(/\s+/));
    queryTerms.forEach(t => {
      if (words.has(t)) {
        df[t] = (df[t] || 0) + 1;
      }
    });
  });

  const scored = allMessages.map((msg, idx) => {
    let score = 0;
    const normText = normalizeText(msg.text);
    const msgTokens = normText.split(/\s+/);
    let termMatched = false;
    
    queryTerms.forEach(term => {
      // aggressively clean punctuation for matching
      const cleanTerm = term.replace(/[^\w\s]/gi, '');
      const cleanTokens = msgTokens.map(t => t.replace(/[^\w\s]/gi, ''));
      
      const tf = cleanTokens.filter(t => t === cleanTerm).length;
      if (tf > 0) {
        termMatched = true;
        const idf = Math.log((docCount + 1) / ((df[term] || 0) + 1)) + 1;
        score += tf * idf;
      }
    });

    const isTargetSender = targetSenders.length > 0 && targetSenders.includes(msg.sender.toLowerCase());

    if (!termMatched && !isTargetSender) {
      return { msg, index: idx, score: 0 };
    }

    if (isTargetSender) {
      score = (score || 1) * 1.5;
    }

    if (msg.score > 0) {
      score += (msg.score / 100) * 0.5;
    }

    score += (idx / docCount) * 0.2;

    return { msg, index: idx, score };
  });

  const valid = scored.filter(s => s.score > 0);
  valid.sort((a, b) => b.score - a.score);

  const topHitsData = valid.slice(0, 8);
  const topHits = topHitsData.map(h => h.msg);

  const contextIndices = new Set<number>();
  topHitsData.forEach(hit => {
    contextIndices.add(hit.index);
    if (hit.index > 0) contextIndices.add(hit.index - 1);
    if (hit.index < docCount - 1) contextIndices.add(hit.index + 1);
  });

  const contextMessages = Array.from(contextIndices)
    .sort((a, b) => a - b)
    .map(idx => allMessages[idx]);

  return { messages: contextMessages, topHits, targetSenders };
}
