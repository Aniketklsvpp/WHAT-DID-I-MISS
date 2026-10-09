import { CreateMLCEngine, type InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import { type CatchUpData } from './score';

export const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs = 30000, 
  timeoutErrorMsg = "Operation timed out after 30 seconds."
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutErrorMsg));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function hasWebGPU(): Promise<boolean> {
  console.log("[LLM] Checking WebGPU support...");
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    console.warn("[LLM] navigator.gpu is NOT available on this browser/device.");
    return false;
  }
  try {
    console.log("[LLM] Requesting WebGPU adapter...");
    const adapterPromise = navigator.gpu.requestAdapter();
    const adapter = await withTimeout(
      adapterPromise, 
      10000, 
      "WebGPU adapter request timed out after 10s."
    );
    console.log("[LLM] WebGPU adapter result:", adapter);
    if (!adapter) {
      console.warn("[LLM] WebGPU adapter is null.");
      return false;
    }
    return true;
  } catch (e) {
    console.error("[LLM] Failed to request WebGPU adapter:", e);
    return false;
  }
}

export function buildRuleBasedSummary(data: CatchUpData, _userName: string): string {
  const totalMessages = data.allScored.length;

  // Attention-worthy = anything with a positive score
  const attentionCount = data.allScored.filter(m => m.score > 0).length;

  const lines: string[] = [];

  // Line 1 — overview
  lines.push(`${totalMessages} messages analyzed. ${attentionCount} need your attention.`);
  lines.push('');

  // Top-3 must-do items (action + deadline preferred)
  const mustDo = [
    ...data.actionItems.filter(m => m.tags.deadline),
    ...data.deadlines,
    ...data.actionItems,
    ...data.top3,
  ]
    .filter((m, i, arr) => arr.findIndex(x => x.text === m.text) === i) // dedupe
    .slice(0, 3);

  if (mustDo.length > 0) {
    lines.push('📋 Must-do:');
    mustDo.forEach((m, i) => {
      const deadlineReason = m.reasons.find(r => r.startsWith('Deadline:'));
      const label = deadlineReason ? ` — ${deadlineReason}` : '';
      const snippet = m.text.length > 80 ? m.text.slice(0, 80) + '…' : m.text;
      lines.push(`  ${i + 1}. ${snippet}${label}`);
    });
    lines.push('');
  }

  // Decisions
  if (data.decisions.length > 0) {
    const latest = data.decisions[data.decisions.length - 1];
    const latestSnippet = latest.text.length > 70 ? latest.text.slice(0, 70) + '…' : latest.text;
    lines.push(`✅ Decisions made: ${data.decisions.length}. Latest — "${latestSnippet}"`);
    lines.push('');
  }

  // Open questions
  if (data.openQuestions.length > 0) {
    lines.push(`❓ Open questions: ${data.openQuestions.length}`);
  }

  return lines.join('\n');
}

export async function initLLMEngine(
  initProgressCallback: (progress: InitProgressReport) => void
): Promise<MLCEngine | null> {
  console.log(`[LLM] Initializing MLCEngine with model ID: ${MODEL_ID}`);
  try {
    const enginePromise = CreateMLCEngine(MODEL_ID, { 
      initProgressCallback: (progress) => {
        console.log(`[LLM Load Progress] ${Math.round(progress.progress * 100)}%: ${progress.text}`);
        initProgressCallback(progress);
      }
    });

    const engine = await withTimeout(
      enginePromise,
      30000,
      "Model loading timed out after 30 seconds."
    );
    console.log("[LLM] MLCEngine initialization complete.");
    return engine;
  } catch (err) {
    console.error("[LLM] Failed to initialize MLCEngine:", err);
    throw err;
  }
}

export async function generateLLMSummary(
  engine: MLCEngine,
  data: CatchUpData,
  userName: string,
  onUpdate: (text: string) => void
): Promise<string> {
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

  console.log(`[LLM Summary] Starting completion query. Prompt length: ${prompt.length}`);

  try {
    const completionPromise = engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.1,
    });

    const chunks = await withTimeout(
      completionPromise,
      30000,
      "LLM query initiation timed out after 30 seconds."
    );

    let fullText = '';
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("LLM generation stream timed out after 30 seconds.")), 30000);
    });

    const readStream = (async () => {
      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
        onUpdate(fullText);
      }
      return fullText;
    })();

    const result = await Promise.race([readStream, timeoutPromise]);
    console.log("[LLM Summary] Generation finished. Length:", result.length);
    return result;
  } catch (err) {
    console.error("[LLM Summary] Error during summary generation:", err);
    throw err;
  }
}
