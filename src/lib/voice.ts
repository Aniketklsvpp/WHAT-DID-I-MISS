import { type CatchUpData } from './score';

export function buildVoiceScript(data: CatchUpData, userName: string): string {
  let script = `Welcome back, ${userName}. `;
  
  const dCount = data.deadlines.length;
  const mCount = data.mentions.length;
  const qCount = data.openQuestions.length;

  const summaries = [];
  if (dCount > 0) summaries.push(`${dCount} deadline${dCount > 1 ? 's' : ''}`);
  if (mCount > 0) summaries.push(`${mCount} mention${mCount > 1 ? 's' : ''}`);
  if (qCount > 0) summaries.push(`${qCount} open question${qCount > 1 ? 's' : ''}`);

  if (summaries.length > 0) {
    script += `You have ${summaries.join(', ')}. `;
  } else {
    script += `You are all caught up on immediate items. `;
  }

  if (data.top3.length > 0) {
    script += `Here are the top ${data.top3.length} items to focus on. `;
    data.top3.forEach((item, index) => {
      const order = index === 0 ? "First" : index === 1 ? "Second" : "Third";
      // Simplify text, removing newline characters for smooth speech
      const cleanText = item.text.replace(/\r?\n|\r/g, ' ');
      script += `${order}: from ${item.sender}, ${cleanText}. `;
    });
  }

  return script;
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}
