# CatchUp — What Did I Miss? 🚀

> **Privacy-First, On-Device WhatsApp Chat Summarizer & Catch-Up Dashboard**

CatchUp helps you quickly digest long WhatsApp group chat exports without sending your personal data to external servers. Powered by local heuristic analysis and on-device SLM (WebGPU-powered local WebLLM), CatchUp highlights deadlines, action items, mentions, key decisions, and sentiment patterns while automatically masking sensitive PII (Phone numbers, OTPs, Card numbers).

---

## ✨ Features

- 🔒 **100% On-Device Privacy & PII Shield**: Automatically detects and redacts Phone Numbers, OTPs, Credit Cards, and Email addresses before processing.
- ⚡ **Instant Priority Catch-Up**: Algorithmic scoring ranks messages by urgency, actionability, deadlines, and mentions.
- 🤖 **Local AI Summarizer (WebGPU)**: Runs `Qwen2.5-0.5B-Instruct` locally in your browser. Automatic 30-second timeout with offline rule-based fallback & retry capability.
- 💬 **"Ask Your Chat" QA Engine**: Search and query chat history with instant, client-side answers.
- 🎯 **Last-Seen Timeline Filter**: Filter messages sent after your custom last-seen timestamp.
- 🔊 **Voice Briefing**: Read out audio summaries directly in browser using SpeechSynthesis.
- 📊 **Activity Heatmap & Sentiment Timeline**: Visualize peak activity hours and chat sentiment breakdown.
- ♿ **Accessible UI**: Built with accessible contrast, visible keyboard focus indicators, dynamic `aria-live` announcements, and `aria-label` tags.

---

## 🛡️ Privacy Guarantee

CatchUp is **100% Client-Side**. 
- No chat content, exported text, or user data is ever uploaded to external cloud servers.
- Local LLM execution runs via WebGPU using browser memory.
- PII masking occurs locally in memory before any display or LLM processing.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS (Neo-Brutalist design tokens), Lucide React
- **Local AI Engine**: `@mlc-ai/web-llm` (Qwen2.5-0.5B-Instruct WebGPU engine)
- **Icons & Typography**: Plus Jakarta Sans, Anton, Lucide Icons

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- A WebGPU-supported modern browser (Chrome, Edge, ARC, Brave) for Local AI mode (rule-based fallback works in all browsers).

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Aniketklsvpp/WHAT-DID-I-MISS.git
cd WHAT-DID-I-MISS

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Demo Steps (Using `demo-chat.txt`)

1. **Launch App**: Open `npm run dev` in your browser.
2. **Enter Name**: Enter your name (e.g., `Dave` or `Charlie`).
3. **Upload Demo Chat**: Drag & drop or upload the included `demo-chat.txt` file from the project root.
4. **PII Shield Verification**: Notice the PII pill showing masked sensitive data (e.g., `[OTP]`, `[PHONE]`). Toggle "What the AI sees" to inspect original vs masked content safely.
5. **Explore Highlights**: View Deadlines, Action Items, Mentions, and Top 3 Priorities.
6. **Test Local AI Summary**: Click **Enable AI** and **Generate**. Watch the model process 100% locally on WebGPU, or test fallback mode.
7. **Ask Your Chat**: Type questions like *"What is the deadline?"* or *"What did Alice say?"*.
8. **Voice Briefing**: Click the speaker icon to play an automated audio summary.

---

## 📜 License

MIT License. Built for Vibe Coding Hackathon.
