import { useState, useEffect, useMemo } from 'react';
import { Dropzone } from './components/Dropzone';
import { DebugTable } from './components/DebugTable';
import { CatchUpCard } from './components/CatchUpCard';
import { ActionItems } from './components/ActionItems';
import { DeadlinesTimeline } from './components/DeadlinesTimeline';
import { DecisionsPanel } from './components/DecisionsPanel';
import { MentionsPanel } from './components/MentionsPanel';
import { Heatmap } from './components/Heatmap';
import { VoiceBriefing } from './components/VoiceBriefing';
import { LocalLLMPanel } from './components/LocalLLMPanel';
import { AskChat } from './components/AskChat';
import { PrivacyPanel } from './components/PrivacyPanel';
import { PiiShield } from './components/PiiShield';
import { MessageSquare, Flame, CheckCircle, Clock, AtSign, Settings2, AlertTriangle } from 'lucide-react';
import { parseWhatsApp, type Message } from './lib/parser';
import { buildCatchUp, type CatchUpData, type ScoredMessage } from './lib/score';
import { saveState, loadState, clearState } from './lib/storage';
import sampleHinglish from './data/sample-hinglish.txt?raw';

function App() {
  const [parsedMessages, setParsedMessages] = useState<Message[] | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [catchUpData, setCatchUpData] = useState<CatchUpData | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [filterRange, setFilterRange] = useState<{ start: Date, end: Date } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [revealPii, setRevealPii] = useState(false);

  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadState().then(state => {
      if (state && state.messages.length > 0) {
        // Hydrate dates properly from IDB
        const hydrated = state.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        setParsedMessages(hydrated);
        setCurrentUser(state.currentUser);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFileLoaded = (text: string) => {
    setErrorMsg('');
    const msgs = parseWhatsApp(text);
    if (msgs.length === 0) {
      setErrorMsg('Could not parse any messages from this file. Ensure it is a valid WhatsApp chat export.');
      return;
    }
    setParsedMessages(msgs);
    setFilterRange(null);
    setRevealPii(false);
    const senders = Array.from(new Set(msgs.map(m => m.sender)));
    const targetUser = senders.includes('Alice') ? 'Alice' : senders[0];
    setCurrentUser(targetUser);
    saveState(msgs, targetUser);
  };

  const handleSampleChat = () => {
    handleFileLoaded(sampleHinglish);
  };

  const handleClearData = async () => {
    await clearState();
    setParsedMessages(null);
    setCurrentUser('');
    setCatchUpData(null);
    setFilterRange(null);
    setRevealPii(false);
    setShowPrivacy(false);
  };

  useEffect(() => {
    if (parsedMessages && currentUser) {
      setCatchUpData(buildCatchUp(parsedMessages, currentUser));
      setFilterRange(null);
      saveState(parsedMessages, currentUser);
    }
  }, [currentUser, parsedMessages]);

  const displayData = useMemo(() => {
    if (!catchUpData) return null;

    const filterMsgs = (msgs: ScoredMessage[]) => msgs.filter(m => {
       if (filterRange && (m.timestamp < filterRange.start || m.timestamp >= filterRange.end)) return false;
       return true;
    }).map(m => ({
       ...m,
       text: revealPii ? m.text : m.maskedText
    }));
    
    return {
      top3: filterMsgs(catchUpData.top3),
      actionItems: filterMsgs(catchUpData.actionItems),
      deadlines: filterMsgs(catchUpData.deadlines),
      decisions: filterMsgs(catchUpData.decisions),
      openQuestions: filterMsgs(catchUpData.openQuestions),
      mentions: filterMsgs(catchUpData.mentions),
      allScored: filterMsgs(catchUpData.allScored)
    };
  }, [catchUpData, filterRange]);

  const uniqueSenders = parsedMessages 
    ? Array.from(new Set(parsedMessages.map(m => m.sender))) 
    : [];

  const flaggedIds = new Set();
  if (displayData) {
    [...displayData.top3, ...displayData.actionItems, ...displayData.deadlines, ...displayData.decisions, ...displayData.openQuestions, ...displayData.mentions].forEach(m => flaggedIds.add(m.id));
  }
  const estimatedTimeSaved = parsedMessages ? Math.max(0, Math.floor(parsedMessages.length * 0.05)) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-primary">
        <div className="flex flex-col items-center">
          <MessageSquare size={48} className="animate-bounce mb-4" />
          <div className="font-bold tracking-wider animate-pulse">LOADING CATCHUP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {showPrivacy && catchUpData && (
        <PrivacyPanel 
          onClose={() => setShowPrivacy(false)} 
          onClear={handleClearData} 
          data={catchUpData} 
          revealPii={revealPii} 
          setRevealPii={setRevealPii} 
        />
      )}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest">
        <div className="h-20 max-w-2xl mx-auto px-gutter-mobile md:px-gutter flex items-center justify-between">
          <a href="#" className="font-headline-md text-headline-md uppercase tracking-tight text-primary select-none hover:opacity-80 transition-opacity">
            CatchUp
          </a>
          <div className="flex items-center gap-space-md">
            {parsedMessages && (
              <nav className="text-primary font-bold underline">
                <button onClick={() => setShowPrivacy(true)} className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none">
                  Privacy
                </button>
              </nav>
            )}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0" title={isOffline ? 'Offline' : 'Ready'}>
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                {isOffline ? 'wifi_off' : 'person'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-surface-container-lowest flex-1">
        {!parsedMessages ? (
          <div className="max-w-2xl mx-auto px-gutter-mobile md:px-gutter py-space-xl">
            <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-12rem)] py-space-xl text-center select-none animate-in fade-in slide-in-from-bottom-4">
              <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-primary tracking-tight uppercase mb-space-sm">
                WHAT DID I MISS?
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-space-xl">
                Your chats never leave this device.
              </p>
              
              {errorMsg && (
                <div className="mb-6 p-4 bg-error-container border border-error rounded-xl text-on-error-container flex items-center w-full max-w-md font-body-md font-bold animate-in shake">
                  <AlertTriangle className="mr-3 shrink-0" size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Dropzone onFileLoaded={handleFileLoaded} />
              
              <div className="flex flex-col sm:flex-row items-center gap-space-md w-full max-w-md justify-center mt-space-lg">
                <button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="w-full sm:w-auto px-space-xl py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  Upload chat
                </button>
                <button
                  onClick={handleSampleChat}
                  className="w-full sm:w-auto px-space-xl py-3 rounded-full bg-surface-container-lowest text-primary border-[2px] border-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  Try sample
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto px-gutter-mobile md:px-gutter py-space-xl">
            <div className="flex flex-col w-full max-w-xl mx-auto space-y-12">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md uppercase tracking-tight text-primary">CatchUp</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={currentUser} 
                    onChange={e => setCurrentUser(e.target.value)}
                    className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md tracking-wider uppercase transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none outline-none appearance-none cursor-pointer"
                  >
                    {uniqueSenders.map(s => <option key={s} value={s}>I am: {s}</option>)}
                  </select>
                </div>
              </div>


            {catchUpData && (
              <>
                <Heatmap data={catchUpData} onFilter={setFilterRange} />
                <AskChat data={catchUpData} />
                <VoiceBriefing data={catchUpData} userName={currentUser} />
                <LocalLLMPanel data={catchUpData} userName={currentUser} />

                {displayData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="lg:col-span-1 space-y-8">
                      <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold flex items-center mb-6 text-white">
                          <Flame className="mr-2 text-red-500" /> 
                          Top 3 Must-Do
                        </h3>
                        <CatchUpCard top3={displayData.top3} />
                      </section>
                      
                      <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold flex items-center mb-6 text-white">
                          <Clock className="mr-2 text-amber-500" /> 
                          Upcoming Deadlines
                        </h3>
                        <DeadlinesTimeline items={displayData.deadlines} />
                      </section>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold flex items-center mb-6 text-white">
                          <CheckCircle className="mr-2 text-[#10b981]" /> 
                          Action Items
                        </h3>
                        <ActionItems items={displayData.actionItems} />
                      </section>

                      <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold flex items-center mb-6 text-white">
                          <MessageSquare className="mr-2 text-blue-400" /> 
                          Decisions & Open Questions
                        </h3>
                        <DecisionsPanel decisions={displayData.decisions} unresolved={displayData.openQuestions} />
                      </section>
                      
                      <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold flex items-center mb-6 text-white">
                          <AtSign className="mr-2 text-purple-400" /> 
                          Your Mentions
                        </h3>
                        <MentionsPanel mentions={displayData.mentions} />
                      </section>
                    </div>
                  </div>
                )}
              </>
            )}

            {showDebug && catchUpData && (
              <>
                <DebugTable messages={parsedMessages} currentUser={currentUser} />
                <div className="w-full mt-8 bg-black border border-gray-800 rounded-2xl p-6 shadow-xl overflow-auto text-left animate-in fade-in">
                  <h3 className="text-lg font-bold text-gray-400 mb-2">Raw JSON Output</h3>
                  <pre className="text-xs text-[#10b981] whitespace-pre-wrap break-words">
                    {JSON.stringify(catchUpData, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
