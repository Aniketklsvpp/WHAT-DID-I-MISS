# prompt.md: AI-Assisted Development Log

> Honest log of how CatchUp was built with AI tools. Entries marked **[FILL]** must be completed by the team with what actually happened. Nothing here is a claimed result unless marked verified. No API keys or secrets are included.

## 1. Project Overview
- **Hackathon problem:** "The Unread Problem: What Did I Miss?" Build a simple AI micro-app that helps users quickly understand and prioritize important information from overwhelming chat conversations, with local-first processing so data never leaves the device.
- **Solution:** CatchUp, a web app where the user uploads an exported WhatsApp chat and sees what they missed, fully on-device.
- **Planned key features (see PRD.md):**
  - F1-F2: chat import (.txt) and WhatsApp parser
  - F3-F4: message tagging and Miss Score with "Why flagged?" reasons
  - F5-F9: top-3 must-do card, action items, deadlines, decisions, mentions
  - F10: local in-browser AI summary with rule-based fallback
  - F11: privacy UI (offline badge, clear data)
  - F12: voice catch-up (speech synthesis)
  - F13: urgency heatmap timeline
  - F14: Hinglish keyword support
  - Added later: Ask your chat, smart quick replies, PII shield
- **Status of each feature:** Done (F1-F14), plus Ask your chat and PII shield. Quick replies: not built.

## 2. Tech Stack & Architecture
- **Stack:** React + Vite + TypeScript + Tailwind; IndexedDB (idb); chrono-node; WebLLM (Qwen2.5-1.5B-Instruct or Llama-3.2-1B) [FILL: confirm final choices]
- **Architecture:** fully client-side, no backend, no external API calls on chat data.
```
Upload .txt -> Parser -> Tagging Engine -> Miss Score -> Dashboard
                                              |
                                              +-> top chunks -> Local LLM -> Summary
IndexedDB for optional local persistence
```
- **Folders:** src/lib (parser, engine, score, hinglish, llm, voice, storage), src/components, src/data
- **Planning docs:** PRD.md, PROMPTS.md, PHASE_PROMPTS.md (all in repo)

## 3. AI Code Generation

### Planning and prompt drafting
- **AI tool/model used:** Claude (claude.ai chat) [FILL: confirm model shown in your app]
- **Purpose of the interaction:** Problem analysis, MVP scope, feature ideas, PRD, and drafting the prompts below.
- **Files or components affected:** PRD.md, PROMPTS.md, PHASE_PROMPTS.md
- **Outcome and verification status:** Documents created and added to the repo. Confirmed.

### Master prompt (given once to the coding agent)
- **Actual prompt or instruction:**
```
Read PRD.md in the project root fully before doing anything. It is the single source of truth.

Project: "CatchUp", a local-first web app that answers "What did I miss?" for long chat conversations.

Hard rules:
- 100% client-side. No backend, no external API calls, no analytics. Chat data never leaves the device.
- Stack: React + Vite + TypeScript + Tailwind. Persistence only via IndexedDB (idb).
- The rule-based engine must work fully without the AI model. The local LLM is optional, with a fallback.
- Modular structure: src/lib (parser, engine, score, hinglish, llm, voice, storage), src/components, src/data.
- Keep code simple, typed, and commented. No unnecessary dependencies.

Build in this order, and STOP after each phase so I can test:
Phase 1: Scaffold, dark UI shell, upload dropzone, "Use sample chat" button, offline badge (F1, F11)
Phase 2: WhatsApp parser + 3 sample chats (college group, project team, Hinglish) (F2)
Phase 3: Tagging engine, English + Hinglish keyword config, chrono-node deadlines (F3, F14)
Phase 4: Miss Score with "Why flagged?" reasons (F4)
Phase 5: Dashboard: catch-up card, action items, deadlines, decisions, mentions (F5-F9)
Phase 6: Urgency heatmap timeline with click-to-jump (F13)
Phase 7: Voice catch-up with speechSynthesis (F12)
Phase 8: Local LLM summary via WebLLM with WebGPU fallback (F10)
Phase 9: Privacy panel, clear-all-data, polish, production build (F11)

Start with Phase 1 only. Before coding, give me a short plan (max 10 lines) listing the files you will create. After finishing, tell me how to run and test it.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Set project rules and build order.
- **Files or components affected:** whole project
- **Outcome and verification status:** Verified. Project rules and build order were successfully set.

### Phase prompts (as drafted; edit if you changed any before using)
### Phase 1: Scaffold + UI shell (F1, F11)
- **Actual prompt or instruction:**
```
Read PRD.md. Do Phase 1 only.
Scaffold Vite + React + TypeScript + Tailwind. Create folders: src/lib, src/components, src/data.
Build a dark-theme shell:
- Header: "CatchUp", tagline "Your chats never leave this device"
- Green badge "Offline-ready: 0 bytes sent"
- File upload dropzone (accept .txt) and a "Use sample chat" button
- Placeholder area where results will appear
Do not add parsing yet; just log the uploaded file's text length to the console.
Give a 10-line plan first, then code. End with run/test steps.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Scaffold project and UI shell
- **Files or components affected:** package.json, src/App, src/components
- **Outcome and verification status:** Scaffolded basic UI with dropzone | Verified: yes, via visual check and build success

### Phase 2: Parser + sample chats (F2)
- **Actual prompt or instruction:**
```
Do Phase 2 only.
In src/lib/parser.ts write parseWhatsApp(text: string): Message[] with Message = { id, timestamp: Date, sender: string, text: string }.
Support: "12/03/2026, 9:41 pm - Name: text" and "[12/03/26, 21:41:05] Name: text"; 12h/24h time; dd/mm/yy and dd/mm/yyyy. Merge multi-line messages into the previous one. Skip system lines (encryption notice, "joined using", "deleted this message", "<Media omitted>").
Create 3 sample files in src/data/: sample-college-group.txt, sample-project-team.txt, sample-hinglish.txt. Each has ~80 realistic messages including @mentions, deadlines, questions, decisions, urgent words, action requests. The Hinglish one uses phrases like "kal tak bhej do", "jaldi karo", "kab tak hoga?", "parso submit karna hai".
Wire the upload and sample button to parse and show a simple message count and the list of detected senders. Add a few sanity tests (vitest or a script) for both formats and multi-line messages.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** WhatsApp parser and sample chats
- **Files or components affected:** src/lib/parser.ts, src/data/*
- **Outcome and verification status:** Parser logic implemented | Verified: yes, src/lib/parser.test.ts passes

### Phase 3: Tagging engine, English + Hinglish (F3, F14)
- **Actual prompt or instruction:**
```
Do Phase 3 only.
Install chrono-node. Create:
- src/lib/keywords.ts: English keyword lists (decision, action, urgent, question words)
- src/lib/hinglish.ts: Hinglish lists. Deadline: kal tak, aaj raat tak, parso, is hafte, subah tak, shaam tak. Urgent: jaldi, turant, abhi, urgent hai. Action: bhej do, bhejna, kar do, karna hai, le aana, submit karo. Question: kya, kab, kaun, kahan, kyun, kaise, kitne baje.
- src/lib/normalize.ts: lowercase, collapse repeated letters, handle spelling variants (jaldi/jldi, bhej do/bhejdo)
- src/lib/engine.ts: tagMessage(msg, currentUser, allMessages) returns tags { mention, question, deadline, decision, action, urgent, unanswered } plus extracted deadline Date and matched phrase.
Rules: mention = @name or name match; question = "?" or question word start; deadline = chrono-node plus a custom Hinglish resolver (kal=tomorrow, parso=day after, aaj=today, relative to message timestamp, not today); unanswered = question with no reply from another sender within the next 10 messages.
Keep all lists editable in config files. Add tests using the sample chats. Show a debug table in the UI listing messages with their tags.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Tagging engine with English + Hinglish
- **Files or components affected:** src/lib/engine.ts, keywords.ts, hinglish.ts, normalize.ts
- **Outcome and verification status:** Tagging logic handles keywords and chrono-node | Verified: yes, src/lib/engine.test.ts passes

### Phase 4: Miss Score + reasons (F4)
- **Actual prompt or instruction:**
```
Do Phase 4 only.
In src/lib/score.ts write scoreMessage(taggedMsg, now) -> { score: 0-100, reasons: string[] }.
Weights: mention +30, direct question to user +25, deadline within 48h +25 (within 7 days +10), action +15, urgent +15, decision +10, unanswered +10. Clamp to 100. Each applied weight adds a readable reason: "Mentions you", "Deadline: Fri 5 PM", "Unanswered question", "Urgent wording".
Add buildCatchUp(messages, currentUser) returning { top3, actionItems, deadlines, decisions, openQuestions, mentions }, each sorted by score and deduplicated (merge near-identical consecutive messages).
Use the chat's last message time as "now" when deadlines are in the past relative to the real date, so sample chats stay demo-friendly.
Show the raw result as JSON in a debug panel and add tests.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Miss Score and reasons
- **Files or components affected:** src/lib/score.ts
- **Outcome and verification status:** Miss Score formula and deduplication working | Verified: yes, src/lib/score.test.ts passes

### Phase 5: Dashboard UI (F5-F9)
- **Actual prompt or instruction:**
```
Do Phase 5 only.
After upload, show a "Who are you?" dropdown with detected senders. Then render the dashboard in src/components:
1. CatchUpCard: top 3 must-do items as large cards with urgency color (red >=70, amber 40-69, green <40)
2. ActionItems: task, owner, deadline
3. DeadlinesTimeline: sorted by date with countdown text
4. DecisionsPanel: two columns, "Decided" vs "Still unresolved"
5. MentionsPanel: messages that involve the user
Each flagged message shows sender, time, text, and "Why flagged?" chips from reasons[]. Add a stats strip: total messages, flagged count, estimated time saved. Make it responsive and demo-ready with clean spacing. Remove the debug panels or hide them behind a toggle.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Dashboard UI
- **Files or components affected:** src/components/*
- **Outcome and verification status:** Dashboard UI components constructed | Verified: yes, visually checked

### Phase 6: Urgency heatmap timeline (F13)
- **Actual prompt or instruction:**
```
Do Phase 6 only.
Create src/components/Heatmap.tsx. Horizontal bar split into time buckets; bucket size adapts to chat duration (per hour if under 3 days, otherwise per day). Bucket color = max Miss Score in it (green/amber/red, with opacity by message count). Hover tooltip: time range, message count, top reason. Click a bucket to filter/scroll the dashboard to those messages, with a "Clear filter" button. Show deadline markers on the bar. Place it at the top of the dashboard. Keep it as lightweight SVG or divs, with no chart library.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Urgency heatmap timeline
- **Files or components affected:** src/components/Heatmap.tsx
- **Outcome and verification status:** Heatmap component created and integrated | Verified: yes

### Phase 7: Voice catch-up (F12)
- **Actual prompt or instruction:**
```
Do Phase 7 only.
Create src/lib/voice.ts and src/components/VoiceBriefing.tsx using the Web Speech API (speechSynthesis). Build a spoken script from the data: counts of deadlines, mentions, and open questions, then the top 3 items in plain sentences (e.g. "You have 2 deadlines today. First: send slides to Rahul by 6 PM."). Add Play, Pause, Stop buttons, a speed slider, and a voice selector limited to available voices. Feature-detect support and hide the control gracefully if unsupported. No network calls. Show the script text on screen while speaking.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Voice catch-up
- **Files or components affected:** src/lib/voice.ts, src/components/VoiceBriefing.tsx
- **Outcome and verification status:** speechSynthesis integration works | Verified: yes

### Phase 8: Local LLM summary (F10)
- **Actual prompt or instruction:**
```
Do Phase 8 only.
Add src/lib/llm.ts using @mlc-ai/web-llm with a small quantized model (Qwen2.5-1.5B-Instruct or Llama-3.2-1B). Requirements:
- Detect WebGPU; if unavailable or load fails, fall back to a rule-based summary built from catch-up data and show a small notice
- Download progress bar; model cached in the browser so reload is fast
- Send only the top ~40 scored messages (not the whole chat)
- Prompt returns: a 4-6 line summary, key decisions, and what the user needs to do. Stream output into the UI
- Toggle "AI summary (local)", off by default, with a "Generate" button
- No network calls after the model is cached
Wrap everything in try/catch so the app never breaks if the model fails.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Local LLM summary with fallback
- **Files or components affected:** src/lib/llm.ts
- **Outcome and verification status:** WebLLM integration added to Panel | Verified: yes

### Phase 9: Privacy panel + polish + build (F11)
- **Actual prompt or instruction:**
```
Do Phase 9 only.
- IndexedDB (idb) saves the last chat and results; "Clear all data" button wipes everything
- Privacy panel explaining: no server, no tracking, data stays in the browser
- Offline indicator that turns green when navigator.onLine is false
- "Run demo" button: loads the Hinglish sample, auto-selects a user, shows results instantly
- Loading skeletons, empty states, bad-file error handling
- Fix console errors and warnings
- Run `npm run build` and confirm it succeeds
Then do a final review against the PRD: list any F1-F14 feature not fully working.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Privacy panel, persistence, polish, build
- **Files or components affected:** storage, privacy components
- **Outcome and verification status:** IndexedDB logic written in storage.ts and Privacy panel UI created | Verified: yes, build succeeds


### Ask your chat
- **Actual prompt or instruction:**
```
Add "Ask your chat" to CatchUp. Client-side only, no network calls. Don't change existing logic.

Files: src/lib/ask.ts, src/components/AskChat.tsx, plus minimal dashboard wiring.

UI:
- Search box with 3 example question chips
- Answer card (max 3 sentences) plus a "Sources" list of the exact messages used (sender, time, text); clicking a source highlights it in the chat
- Loading and "No relevant messages found" states

Retrieval (no embeddings, no new dependencies):
- Remove English + Hinglish stopwords; reuse normalize.ts
- If a sender's name appears in the question, boost that sender's messages
- Rank messages by TF-IDF keyword overlap, plus a small boost for Miss Score
- Take the top 8, add 1 message of context each, dedupe, sort by time

Answer:
- Use src/lib/llm.ts. Prompt: "Answer ONLY from these messages. If not found, say you can't find it. Max 3 sentences. Say who said it and when." Stream the output
- Fallback if the LLM fails: show the top 3 matching messages with the note "AI unavailable, showing best matches"
- Wrap in try/catch

Add one test: the question "venue" returns the venue messages from the sample chat.
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Natural-language questions answered from retrieved chat messages only.
- **Files or components affected:** src/lib/ask.ts, src/components/AskChat.tsx
- **Outcome and verification status:** Implemented TF-IDF retrieval in ask.ts | Verified: yes, test added in ask.test.ts

### Smart quick replies
- **Actual prompt or instruction:**
```
Add "Smart quick replies" to CatchUp. Keep all existing logic unchanged.

- For each of the top 3 catch-up items, add a "Draft reply" button
- Use the existing local LLM (src/lib/llm.ts) to generate a short reply (max 2 sentences) using only that message plus 3 messages before it as context
- Tone chips: Polite, Short, Formal. Language toggle: English / Hinglish. Regenerating uses the selected options
- Show the draft in an editable text box with Copy and Regenerate buttons
- If the LLM is unavailable, fall back to templates, e.g. "Got it, I'll send this by {deadline}." / "Noted, will check and update you."
- No network calls. Wrap in try/catch so the app never breaks
- Create src/lib/replies.ts and src/components/QuickReply.tsx
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Local-AI drafted replies for top items.
- **Files or components affected:** src/lib/replies.ts, src/components/QuickReply.tsx
- **Outcome and verification status:** Not implemented.

### PII Shield
- **Actual prompt or instruction:**
```
Add a "PII Shield" feature to CatchUp. Client-side only, no network calls, no new dependencies. Don't change existing scoring or parsing logic.

Files: src/lib/pii.ts, src/components/PiiShield.tsx, plus minimal wiring.

Detection (src/lib/pii.ts), export maskPII(text) -> { masked: string, items: { type, original, start, end }[] }:
- Phone: Indian (+91 / 10 digits starting 6-9, with optional spaces or dashes) and generic international formats
- Email
- UPI ID (name@bank handle, e.g. rahul@okhdfc, and not confused with emails)
- OTP: 4-8 digit codes near words like "otp", "code", "verification", "pin"
- Card number: 13-19 digits (spaces or dashes allowed), validated with the Luhn check
- Account number: 9-18 digit strings near "a/c", "account", "acc no", "ifsc"
- Aadhaar (12 digits, spaced 4-4-4) and PAN (ABCDE1234F)
Replace each with a typed placeholder, e.g. [PHONE], [EMAIL], [UPI], [OTP], [CARD], [ACCOUNT], [ID]. Keep the last 2-4 characters visible only for phone and card (e.g. ••••1234). Avoid false positives on dates, times, and short numbers.

Integration:
- Run maskPII once on each message after parsing; store both original and masked text
- Display masked text by default across the whole UI (cards, lists, sources, Ask-your-chat results)
- Always send the masked text to the local LLM (summary, quick replies, Ask your chat), even when reveal is on
- Detection and scoring (deadlines, mentions) still use the original text, so accuracy is unchanged
- Exclude messages flagged as containing OTP or card numbers from AI input entirely

UI (PiiShield.tsx), placed in the top bar of the results screen:
- Shield pill showing "Masked N items" with a count breakdown on hover (e.g. 4 phones, 2 emails, 1 OTP)
- "Reveal" toggle, off by default; when on, show originals in the UI only, with a visible warning style and auto re-mask after 30 seconds
- Small note: "AI never sees original values"

Add tests in a pii.test file with true positives (valid card, UPI, Indian phone, OTP phrase) and false positives that must NOT be masked (a date like 12/03/2026, time 9:41, "10 people", "5000 rupees").
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Mask sensitive data before display and AI use.
- **Files or components affected:** src/lib/pii.ts, src/components/PiiShield.tsx
- **Outcome and verification status:** PII mask logic in pii.ts and PiiShield UI toggle | Verified: yes, pii.test.ts passes

## 4. Debugging

### Git push rejected (remote had existing commits)
- **Actual prompt or instruction:** Pasted the terminal error screenshots and asked how to fix `! [rejected] main -> main (fetch first)`.
- **AI tool/model used:** Claude (claude.ai chat)
- **Purpose of the interaction:** Resolve git push rejection caused by existing commits on remote.
- **Files or components affected:** Git repository state.
- **Outcome and verification status:** Suggested fix `git pull origin main --allow-unrelated-histories --no-rebase`. Actually ran `git push -u origin main` (failed with fetch first). Then blocked by merge conflict. Verification: [FILL: needs my input] (Not pushed yet)

### Git LF/CRLF warnings
- **Actual prompt or instruction:** Asked about "LF will be replaced by CRLF the next time Git touches it" on `git add .`
- **AI tool/model used:** Claude (claude.ai chat)
- **Purpose of the interaction:** Clarify git line ending warnings.
- **Files or components affected:** Git configuration / line endings.
- **Outcome and verification status:** Identified as a harmless Windows line-ending warning; no fix required. Verification: commit and push still proceeded.

### Other errors during coding
- **Actual prompt or instruction:** Remove unused variables.
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Fix TS build failure from unused imports (PiiShield, Settings2, etc) in App.tsx during UI redesign.
- **Files or components affected:** src/App.tsx
- **Outcome and verification status:** Removed the unused imports and states. Verified via successful build.

- **Actual prompt or instruction:** Remove duplicated CatchUpCard import.
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Fix TS build failure from duplicate `CatchUpCard` import in App.tsx.
- **Files or components affected:** src/App.tsx
- **Outcome and verification status:** Removed the extra import. Verified via successful build.

## 5. AI Features & Design

### Local AI features (design decisions)
- Rule-based engine is the primary path; local LLM only summarizes the top-scored messages (~40) and falls back to a rule-based summary if WebGPU or the model fails.
- Ask your chat uses keyword retrieval (TF-IDF) then the local model, answering only from retrieved messages.
- PII shield masks sensitive values before any AI input.
- [FILL: model actually used in the browser, e.g. name and size]

### UI/UX design
- **Actual prompt or instruction:** (Iterative prompts to Google Stitch) 1. Initial neo-brutalist UI prompt for landing, dashboard, privacy panel. 2. Simplified prompt with strict limits (max 3-4 sections per screen, no marketing sections). 3. Global simplify prompt applied to all screens (one centered column, remove badges/tips/legends, secondary actions behind buttons).
- **AI tool/model used:** Google Stitch (design generation)
- **Purpose of the interaction:** Generate neo-brutalist system design and HTML mockups.
- **Files or components affected:** `stitch_catchup_neo_brutalist_chat_digest/*`
- **Outcome and verification status:** Final design accepted and exported to repo.

- **Actual prompt or instruction:**
```
TASK: Re-skin the existing CatchUp app UI to match the design in /design/. Change ONLY visuals, layout, and static text/labels. Do NOT change any logic.

SOURCE OF TRUTH:
- /design/catchup_neo_brutalist_system/DESIGN.md: colors, typography (Anton headlines, Plus Jakarta Sans body), spacing, borders
- /design/catchup_home_minimal, catchup_results_minimal, catchup_ask_your_chat, catchup_draft_reply_minimal, catchup_privacy_minimal: each has screen.png (target look) and code.html (reference markup)

DO:
- Map each screen to its matching existing component and restyle it to match screen.png
- Move the DESIGN.md tokens (colors, fonts, spacing, radii, borders) into the Tailwind config and use them everywhere
- Add the Anton and Plus Jakarta Sans fonts
- Update static labels, headings, button text, and placeholders to match the design
- Make it responsive (mobile + desktop)
- Keep existing component props, state, and data flow intact; only change JSX structure and classNames where needed for layout

DO NOT CHANGE:
- Anything in src/lib (parser, engine, score, hinglish, llm, voice, ask, pii, storage)
- Any function, state, hook, event handler, or data handling
- Features and behavior: upload, user selection, scoring, heatmap data, voice briefing, local LLM, Ask your chat, quick replies, PII shield, clear data
- File structure, dependencies (except fonts), build config, tests

RULES:
- If a design element has no matching feature, leave it out; do not invent functionality
- If an existing feature has no place in the design, keep it working but hide it behind a small button or "More" menu; do not remove it
- Do not copy code.html wholesale; reuse its styling and layout, wired to the real components and data
- Replace placeholder text in the design with the real data from the app

WORKFLOW:
1. First reply with a short plan: screen-to-component mapping and which files you will edit (max 10 lines)
2. Then restyle one screen at a time, starting with Home, and stop after each so I can check
3. After each screen, confirm that tests still pass and `npm run build` succeeds
```
- **AI tool/model used:** Antigravity, model: [FILL: needs my input]
- **Purpose of the interaction:** Restyle existing app to match the design folder.
- **Files or components affected:** src/components/*
- **Outcome and verification status:** Fully mapped existing components (App, TabGroup, CatchUpCard, Heatmap, AskChat, LocalLLMPanel, PrivacyPanel) to brutalist HTML styles. Verified: yes, `npm run build` succeeds.

## 6. Testing & Improvements
- Ran parser, engine, score, ask, pii tests using vitest. All passed.
- [FILL: offline test with WiFi off: pass/fail]
- [FILL: WebGPU/model test on demo laptop]
- Sample chats: college group, project team, Hinglish. [FILL: needs my input]
- Fixed JSX structural bugs during restyling and cleaned up duplicate TS imports.
- Production build (`npm run build`): pass

## 7. Final Summary
- **AI tools used:** Claude (planning, PRD, prompt drafting, debugging help); Antigravity with [FILL: model(s)] (code generation); Google Stitch (UI design).
- **Major AI contributions:** PRD, phase-wise build prompts, parser/engine/scoring code, UI re-skin, Git troubleshooting. [FILL: adjust to reality]
- **Completed features:** 
  - [x] F1-F2 import and parser
  - [x] F3-F4 tagging and scoring
  - [x] F5-F9 dashboard sections
  - [x] F10 local AI summary
  - [x] F11 privacy UI
  - [x] F12 voice catch-up
  - [x] F13 heatmap
  - [x] F14 Hinglish
  - [x] Ask your chat
  - [ ] Quick replies
  - [x] PII shield
- **Known limitations:** [FILL: needs my input]

---
## Update log (append new entries below as you work)
| Time | Tool/model | Prompt (short) | Files | Result | Verified |
|------|-----------|----------------|-------|--------|----------|
| Oct 9 | Antigravity | Re-skin the existing CatchUp app UI to match the design in /design/ | src/components/* | Fully restyled UI | Yes |
