
import React, { useState, useEffect, useRef } from 'react';
import { VERB_DATA } from '../constants';
import { Verb, VerbCategory } from '../types';

interface QuestGameProps {
  onBack: () => void;
}

// --- Types for the Quest Logic ---
interface QuestItem {
  id: string;
  verb: Verb;
  monster: string;
  targetForm: 'Past' | 'Participle';
  stage: 'CHOICE' | 'SPELL'; // Stage 1: Shield Break (Choice), Stage 2: Finisher (Spell)
  mistakes: number; // Track attempts for reporting
}

interface SessionLog {
  verb: string;
  form: string;
  mistakes: number;
  status: 'PERFECT' | 'PRACTICED';
}

interface GameState {
  // Progression
  totalDefeated: number; // Total kills this session (determines Level)
  hearts: number;
  score: number;
  
  // Battle State
  queue: QuestItem[]; // The active group of 5 monsters
  currentItem: QuestItem | null;
  options: string[]; // For Choice Stage
  
  // Animations & UI
  isWalking: boolean;
  isAttacking: boolean;
  isDamaged: boolean;
  hitEffect: { text: string; color: string } | null; // New: Pop-up text for hits
  gameOver: boolean;
  timeLeft: number;
  totalTime: number;
  showRoundSummary: boolean; // Between groups of 5
  showFinalReport: boolean; // When user quits
  
  // Logs
  sessionHistory: SessionLog[];
}

const MONSTERS = ['🦖', '👹', '👾', '🐉', '🧛', '🧟', '🕷️', '🦂'];

// Rank System based on Total Defeated
const getRank = (count: number) => {
  if (count < 5) return { title: 'Novice', icon: '🐣', color: 'bg-slate-500' };
  if (count < 15) return { title: 'Squire', icon: '⚔️', color: 'bg-blue-500' };
  if (count < 30) return { title: 'Knight', icon: '🛡️', color: 'bg-indigo-500' };
  if (count < 50) return { title: 'Champion', icon: '👑', color: 'bg-yellow-500' };
  return { title: 'Legend', icon: '🐲', color: 'bg-red-600' };
};

// Audio Helper with Mobile Fix
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  // Resume context if suspended (common on mobile until first touch)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSound = (type: 'hit' | 'damage' | 'heal' | 'tick' | 'win') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'hit': // Unified Hit Sound (High pitch arcade ping)
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'damage': // Low thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'heal': // Rising sparkle
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'win': // Fanfareish
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
    }
  } catch (e) { console.error(e); }
};

const QuestGame: React.FC<QuestGameProps> = ({ onBack }) => {
  const [state, setState] = useState<GameState>({
    totalDefeated: 0,
    hearts: 5,
    score: 0,
    queue: [],
    currentItem: null,
    options: [],
    isWalking: false,
    isAttacking: false,
    isDamaged: false,
    hitEffect: null,
    gameOver: false,
    timeLeft: 15,
    totalTime: 15,
    showRoundSummary: false,
    showFinalReport: false,
    sessionHistory: [],
  });

  const [spellingInput, setSpellingInput] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // --- Initialization ---
  useEffect(() => {
    startNewRound();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    if (state.gameOver || state.showRoundSummary || state.showFinalReport || !state.currentItem) return;

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timeLeft <= 1) {
          handleDamage();
          return { ...prev, timeLeft: prev.totalTime };
        }
        if (prev.timeLeft <= 4) playSound('tick');
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [state.currentItem, state.gameOver, state.showRoundSummary, state.showFinalReport]);

  // --- Game Logic ---

  const startNewRound = () => {
    // 1. Select 5 random verbs
    const roundSize = 5;
    const validVerbs = VERB_DATA.filter(v => v.category !== VerbCategory.MODAL);
    const shuffled = [...validVerbs].sort(() => Math.random() - 0.5).slice(0, roundSize);

    // 2. Create Queue
    const newQueue: QuestItem[] = shuffled.map((verb, i) => ({
      id: `monster-${Date.now()}-${i}`,
      verb,
      monster: MONSTERS[Math.floor(Math.random() * MONSTERS.length)],
      targetForm: Math.random() > 0.5 ? 'Past' : 'Participle',
      stage: 'CHOICE', // Always start with Choice to break shield
      mistakes: 0,
    }));

    setState(prev => {
      // Calculate difficulty based on total defeated
      const baseTime = Math.max(5, 15 - Math.floor(prev.totalDefeated / 5)); // Speed up as you level
      
      return {
        ...prev,
        queue: newQueue,
        currentItem: newQueue[0], // Start with first
        options: generateOptions(newQueue[0]),
        timeLeft: baseTime,
        totalTime: baseTime,
        showRoundSummary: false,
        isWalking: false,
        hitEffect: null,
      };
    });
  };

  // Generate Smart Distractors (Common Mistakes)
  const generateOptions = (item: QuestItem) => {
    const { verb, targetForm } = item;
    const correct = targetForm === 'Past' ? verb.past : verb.participle;
    const base = verb.base;
    const otherForm = targetForm === 'Past' ? verb.participle : verb.past;

    // Create potential wrong answers
    const wrongCandidates = new Set<string>();

    // 1. Regularized mistake (base + ed)
    wrongCandidates.add(base + 'ed');
    if (base.endsWith('e')) wrongCandidates.add(base + 'd');
    else wrongCandidates.add(base + 'ed');
    
    // 2. Wrong form (Past instead of Participle or vice versa)
    if (otherForm !== correct && !otherForm.includes('/')) wrongCandidates.add(otherForm);

    // 3. Base form
    if (base !== correct) wrongCandidates.add(base);

    // 4. Random "en" ending (common irregular mistake)
    wrongCandidates.add(base + 'en');

    // 5. Double consonant + ed (e.g. stopped)
    const lastChar = base.slice(-1);
    if (/[bcdfghjklmnpqrstvwxyz]/.test(lastChar)) {
        wrongCandidates.add(base + lastChar + 'ed');
    }

    // Filter out the correct answer and any duplicates
    const validWrongs = Array.from(wrongCandidates)
        .filter(w => w !== correct && !correct.includes(w) && w !== '')
        .sort(() => Math.random() - 0.5);

    // Pick 2 wrong answers. If not enough smart ones, fill with random verbs from DB
    while (validWrongs.length < 2) {
        const randomVerb = VERB_DATA[Math.floor(Math.random() * VERB_DATA.length)];
        const randomForm = Math.random() > 0.5 ? randomVerb.past : randomVerb.participle;
        if (randomForm !== correct && !validWrongs.includes(randomForm)) {
            validWrongs.push(randomForm);
        }
    }

    // Return 2 wrong + 1 correct, shuffled
    return [correct, validWrongs[0], validWrongs[1]].sort(() => Math.random() - 0.5);
  };

  const handleDamage = () => {
    playSound('damage');
    setState(prev => {
      const newHearts = prev.hearts - 1;
      
      // Move current monster to back of queue
      if (!prev.currentItem) return prev;
      
      const current = { ...prev.currentItem, mistakes: prev.currentItem.mistakes + 1 };
      const remainingQueue = prev.queue.slice(1);
      const newQueue = [...remainingQueue, current];

      // Log mistake if it's the first time failing this specific one
      const history = [...prev.sessionHistory];
      const existingLogIndex = history.findIndex(h => h.verb === current.verb.base && h.form === current.targetForm);
      
      if (existingLogIndex >= 0) {
         history[existingLogIndex].mistakes += 1;
         history[existingLogIndex].status = 'PRACTICED';
      } else {
         history.push({
             verb: current.verb.base,
             form: current.targetForm,
             mistakes: 1,
             status: 'PRACTICED'
         });
      }

      return {
        ...prev,
        hearts: newHearts,
        gameOver: newHearts <= 0,
        isDamaged: true,
        queue: newQueue,
        currentItem: newQueue[0], // Immediately switch to next
        options: generateOptions(newQueue[0]),
        timeLeft: prev.totalTime, // Reset timer
        sessionHistory: history,
        hitEffect: null,
      };
    });

    // Reset animation flag
    setTimeout(() => setState(s => ({ ...s, isDamaged: false })), 500);
  };

  // Unified Success Trigger (Visuals + Audio)
  const triggerSuccessEffect = (text: string, points: number) => {
     playSound('hit'); // Consistent sound
     setState(s => ({ 
         ...s, 
         isAttacking: true,
         score: s.score + points,
         hitEffect: { text, color: points > 20 ? 'text-yellow-400' : 'text-white' }
     }));
     
     // Reset Attack Animation
     setTimeout(() => setState(s => ({ ...s, isAttacking: false })), 300);
     // Reset Hit Text
     setTimeout(() => setState(s => ({ ...s, hitEffect: null })), 800);
  };

  const handleChoice = (selected: string) => {
    if (!state.currentItem) return;
    
    // Ensure audio context is ready on user interaction
    getAudioContext();

    const correct = state.currentItem.targetForm === 'Past' 
      ? state.currentItem.verb.past 
      : state.currentItem.verb.participle;
    
    // Simple check for alternatives
    if (correct.includes(selected)) {
      // Correct Choice -> Advance to Spell Stage BUT MOVE TO BACK OF QUEUE
      triggerSuccessEffect("NICE! +20", 20); // Add score and effect

      setState(prev => {
        if (!prev.currentItem) return prev;
        
        // Update item stage
        const updatedItem: QuestItem = { ...prev.currentItem, stage: 'SPELL' };
        
        // Move to BACK of queue (Split stage logic)
        const remainingQueue = prev.queue.slice(1);
        const newQueue = [...remainingQueue, updatedItem];
        
        const nextItem = newQueue[0];

        return {
          ...prev,
          queue: newQueue,
          currentItem: nextItem,
          options: generateOptions(nextItem),
          timeLeft: prev.totalTime, // Reset timer
        };
      });
      
    } else {
      handleDamage(); // Wrong choice hurts and cycles to back
    }
  };

  const handleSpellingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentItem) return;

    // Ensure audio context is ready
    getAudioContext();

    const correct = state.currentItem.targetForm === 'Past' 
      ? state.currentItem.verb.past 
      : state.currentItem.verb.participle;
    
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanCorrect = correct.split(' / ').map(s => s.trim().toLowerCase()); // Handle alternates

    if (cleanCorrect.includes(cleanInput)) {
      // Victory!
      const defeatedVerb = state.currentItem.verb.base;
      const defeatedForm = state.currentItem.targetForm;
      
      triggerSuccessEffect("GREAT! +50", 50); // Unified effect

      setState(prev => {
        const newDefeated = prev.totalDefeated + 1;
        const heal = newDefeated % 5 === 0; // Heal every 5
        if (heal) setTimeout(() => playSound('heal'), 300); // Delayed heal sound so it doesn't clash with hit

        // Log Success
        const history = [...prev.sessionHistory];
        const existingLog = history.find(h => h.verb === defeatedVerb && h.form === defeatedForm);
        if (!existingLog) {
            history.push({ verb: defeatedVerb, form: defeatedForm, mistakes: 0, status: 'PERFECT' });
        }

        // Remove from queue
        const remainingQueue = prev.queue.slice(1);
        
        // Check if round is cleared
        if (remainingQueue.length === 0) {
          setTimeout(() => playSound('win'), 500);
          return {
            ...prev,
            totalDefeated: newDefeated,
            hearts: heal ? Math.min(prev.hearts + 1, 5) : prev.hearts,
            queue: [],
            currentItem: null,
            showRoundSummary: true,
            sessionHistory: history
          };
        }

        return {
          ...prev,
          totalDefeated: newDefeated,
          hearts: heal ? Math.min(prev.hearts + 1, 5) : prev.hearts,
          queue: remainingQueue,
          currentItem: remainingQueue[0],
          options: generateOptions(remainingQueue[0]),
          timeLeft: prev.totalTime,
          sessionHistory: history
        };
      });

      setSpellingInput('');

    } else {
      handleDamage(); 
      setSpellingInput('');
    }
  };

  const finishSession = () => {
    setState(prev => ({ ...prev, showFinalReport: true, showRoundSummary: false }));
  };

  const getTenseSubtitle = (form: string) => {
      if (form === 'Past') return '(Past Tense)';
      if (form === 'Participle') return '(Present Perfect Tense)';
      return '';
  };

  const handleCopyReport = () => {
    const rank = getRank(state.totalDefeated);
    const perfects = state.sessionHistory.filter(l => l.status === 'PERFECT');
    const practice = state.sessionHistory.filter(l => l.status === 'PRACTICED');

    let text = `🛡️ Irregular Verb Quest Report 🛡️\n`;
    text += `Rank: ${rank.title} | Score: ${state.score}\n\n`;
    
    if (perfects.length > 0) {
        text += `✅ PERFECT:\n`;
        perfects.forEach(p => text += `- ${p.verb} (${p.form})\n`);
        text += `\n`;
    }
    
    if (practice.length > 0) {
        text += `🛠️ NEEDS PRACTICE:\n`;
        practice.forEach(p => text += `- ${p.verb} (${p.form}) (${p.mistakes} misses)\n`);
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Render Helpers ---
  
  const rank = getRank(state.totalDefeated);

  if (state.showFinalReport) {
    const perfects = state.sessionHistory.filter(l => l.status === 'PERFECT');
    const practice = state.sessionHistory.filter(l => l.status === 'PRACTICED');

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          <h1 className="text-4xl font-black text-center mb-2">Mission Report</h1>
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className={`px-4 py-2 rounded-full text-white font-bold ${rank.color}`}>
                {rank.icon} {rank.title}
            </div>
            <div className="text-2xl font-bold text-slate-600">Score: {state.score}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
                    <span>✅ Perfect ({perfects.length})</span>
                </h3>
                <ul className="bg-green-50 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                    {perfects.map((log, i) => (
                        <li key={i} className="flex justify-between text-slate-700 font-medium">
                            <span>{log.verb} <span className="text-green-600 text-xs font-bold">{log.form}</span></span>
                            <span className="text-green-400 font-bold">+50</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-bold text-orange-500 mb-4 flex items-center">
                    <span>🛠️ Need Practice ({practice.length})</span>
                </h3>
                <ul className="bg-orange-50 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                    {practice.map((log, i) => (
                        <li key={i} className="flex justify-between text-slate-700 font-medium">
                            <span>{log.verb} <span className="text-orange-600 text-xs font-bold">{log.form}</span></span>
                            <span className="text-red-400 text-sm font-bold">{log.mistakes} misses</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
             <button 
                onClick={onBack}
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors"
             >
                Return to Base
             </button>
             <button 
                onClick={handleCopyReport}
                className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center"
             >
                {copied ? '✅ Copied!' : '📋 Copy Report'}
             </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.showRoundSummary) {
     return (
        <div className="h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-bounce-slow">
                <div className="text-6xl mb-4">🏕️</div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Campfire Rest</h2>
                <p className="text-slate-500 mb-8">Group cleared! Take a breath, hero.</p>
                
                <div className="space-y-4">
                    <button 
                        onClick={startNewRound}
                        className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-brand-200 hover:-translate-y-1 transition-transform"
                    >
                        Continue Adventure ⚔️
                    </button>
                    <button 
                        onClick={finishSession}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Finish & View Report 📝
                    </button>
                </div>
            </div>
        </div>
     )
  }

  if (state.gameOver) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-red-50">
        <div className="text-8xl mb-4 animate-bounce">🪦</div>
        <h1 className="text-5xl font-black text-red-600 mb-4">Game Over</h1>
        <p className="text-xl text-slate-600 mb-8">Even heroes fall...</p>
        <div className="text-2xl font-bold mb-8">Final Score: {state.score}</div>
        <button 
            onClick={finishSession}
            className="px-8 py-4 bg-slate-800 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
            View Report
        </button>
      </div>
    );
  }

  const item = state.currentItem;
  if (!item) return <div className="p-10 text-center">Loading Adventure...</div>;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col p-4 relative overflow-hidden">
      {/* Header Stats */}
      <div className="flex justify-between items-start mb-8 z-10">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
              <button onClick={finishSession} className="text-xs font-bold text-slate-400 hover:text-red-500">🏳️ QUIT</button>
              <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${rank.color}`}>
                 {rank.icon} {rank.title} (Lv.{state.totalDefeated})
              </div>
           </div>
           <div className="flex text-3xl">
             {[...Array(5)].map((_, i) => (
               <span key={i} className={`transition-all ${i < state.hearts ? 'scale-100 opacity-100' : 'scale-50 opacity-20 grayscale'}`}>
                 ❤️
               </span>
             ))}
           </div>
        </div>
        <div className="text-right">
           <div className="text-4xl font-black text-brand-600 drop-shadow-sm transition-all">{state.score}</div>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</div>
        </div>
      </div>

      {/* Battle Scene */}
      <div className="flex-grow flex items-center justify-between px-4 md:px-12 relative">
        
        {/* HIT EFFECT OVERLAY - CENTERED */}
        {state.hitEffect && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                 <div className={`text-6xl md:text-8xl font-black ${state.hitEffect.color} drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-bounce whitespace-nowrap`}>
                    💥 {state.hitEffect.text}
                 </div>
            </div>
        )}

        {/* Hero */}
        <div className={`text-8xl md:text-9xl transition-transform duration-300 ${state.isAttacking ? 'animate-hero-attack' : 'animate-hero-idle'} ${state.isDamaged ? 'animate-hero-damage' : ''}`}>
          🛡️
        </div>

        {/* VS / Timer */}
        <div className="flex flex-col items-center z-10">
            <div className={`text-4xl font-black mb-2 ${state.timeLeft <= 5 ? 'text-red-500 animate-ping' : 'text-slate-300'}`}>
               {state.timeLeft}
            </div>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 linear ${state.timeLeft < 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                 style={{ width: `${(state.timeLeft / state.totalTime) * 100}%` }}
               />
            </div>
            <div className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-wider bg-white/50 px-2 py-1 rounded">
               {item.stage === 'CHOICE' ? 'Phase 1: Break Shield' : 'Phase 2: Finisher'}
            </div>
        </div>

        {/* Monster */}
        <div className="flex flex-col items-center animate-monster-float relative">
          <div className={`text-8xl md:text-9xl mb-4 filter drop-shadow-xl ${state.hitEffect ? 'brightness-150 scale-110 transition-all' : ''}`}>{item.monster}</div>
          <div className="bg-white/80 backdrop-blur px-6 py-4 rounded-3xl shadow-xl border border-slate-100 text-center min-w-[160px]">
             <div className="text-xs font-bold text-slate-400 uppercase mb-1">Transform to:</div>
             <div className="text-2xl font-black text-brand-600 uppercase leading-none">{item.targetForm}</div>
             <div className="text-[10px] font-bold text-slate-400 mt-1">{getTenseSubtitle(item.targetForm)}</div>
             
             <div className="w-8 h-1 bg-slate-100 mx-auto my-2 rounded-full"></div>
             
             <div className="text-3xl font-black text-slate-800">{item.verb.base}</div>
          </div>
          {/* Shield Status */}
          {item.stage === 'CHOICE' && (
             <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-200">
                🛡️ SHIELDED
             </div>
          )}
          {item.stage === 'SPELL' && (
             <div className="mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-200 animate-pulse">
                ⚔️ VULNERABLE
             </div>
          )}
        </div>

      </div>

      {/* Controls Area */}
      <div className="h-48 md:h-40 mt-4 flex items-center justify-center">
         {item.stage === 'CHOICE' ? (
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
               {state.options.map((opt, i) => (
                 <button
                   key={i}
                   onClick={() => handleChoice(opt)}
                   className="py-4 bg-white border-b-4 border-slate-200 rounded-2xl text-xl md:text-2xl font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:-translate-y-1 active:translate-y-0 transition-all shadow-sm"
                 >
                   {opt}
                 </button>
               ))}
            </div>
         ) : (
            <form onSubmit={handleSpellingSubmit} className="w-full max-w-xl relative">
               <input 
                  ref={inputRef}
                  type="text"
                  value={spellingInput}
                  onChange={e => setSpellingInput(e.target.value)}
                  placeholder={`Type ${item.targetForm === 'Past' ? 'Past' : 'Participle'} form...`}
                  className="w-full text-center text-3xl font-bold p-6 rounded-2xl shadow-xl border-4 border-brand-500 outline-none focus:ring-4 ring-brand-200"
                  autoFocus
                  autoComplete="off"
               />
               <button 
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-600 text-white p-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg"
               >
                  ⚔️
               </button>
               <div className="text-center mt-2 text-slate-400 text-sm font-bold">Type the answer to attack!</div>
            </form>
         )}
      </div>

    </div>
  );
};

export default QuestGame;
