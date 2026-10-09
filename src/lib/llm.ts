import { CreateMLCEngine, type InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import { type CatchUpData } from './score';

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

export async function hasWebGPU(): Promise<boolean> {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    return false;
  }
}

export function buildRuleBasedSummary(data: CatchUpData, userName: string): string {
  let summary = `Rule-based Summary for ${userName}:\n\n`;
  
  if (data.deadlines.length > 0) {
    summary += `You have ${data.deadlines.length} upcoming deadlines.\n`;
  }
  if (data.actionItems.length > 0) {
    summary += `There are ${data.actionItems.length} action items requested.\n`;
  }
  if (data.mentions.length > 0) {
    summary += `You were mentioned ${data.mentions.length} times.\n`;
  }
  if (data.decisions.length > 0) {
    summary += `Key decisions made: ${data.decisions.length}.\n`;
  }

  summary += '\nTop Priorities:\n';
  if (data.top3.length === 0) {
    summary += 'No critical items found.\n';
  } else {
    data.top3.forEach((m, i) => {
      summary += `${i + 1}. [${m.sender}] ${m.text.slice(0, 100)}${m.text.length > 100 ? '...' : ''}\n`;
    });
  }

  return summary;
}

export async function initLLMEngine(
  initProgressCallback: (progress: InitProgressReport) => void
): Promise<MLCEngine | null> {
  try {
    const engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback });
    return engine;
  } catch (err) {
    console.error("Failed to initialize MLCEngine:", err);
    return null;
  }
}

export async function generateLLMSummary(
  engine: MLCEngine,
  data: CatchUpData,
  userName: string,
  onUpdate: (text: string) => void
) {
  const sorted = [...data.allScored]
    .filter(m => !m.hasHighRisk) // exclude high-risk OTP/Card items
    .sort((a, b) => b.score - a.score);
  const top40 = sorted.slice(0, 40).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Enforce maskedText sent to LLM
  const chatText = top40.map(m => `[${m.timestamp.toLocaleString()}] ${m.sender}: ${m.maskedText}`).join('\n');

  const prompt = `You are an AI assistant helping ${userName} catch up on a group chat.
Here are the most important recent messages from the chat:
${chatText}

Please provide:
1. A 4-6 line summary of the discussion.
2. The key decisions made.
3. What ${userName} needs to do next.

Format the output clearly.`;

  try {
    const chunks = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.1,
    });

    let fullText = '';
    for await (const chunk of chunks) {
      fullText += chunk.choices[0]?.delta?.content || '';
      onUpdate(fullText);
    }
    return fullText;
  } catch (err) {
    console.error("LLM Generation failed:", err);
    throw err;
  }
}
