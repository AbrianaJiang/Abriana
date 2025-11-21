import React, { useState, useEffect, useRef } from 'react';
import { VERB_DATA } from '../constants';
import { Verb } from '../types';

interface TimeAttackProps {
  onBack: () => void;
}

const GAME_DURATION = 60; // seconds

const TimeAttack: React.FC<TimeAttackProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'GAME_OVER'>('PLAYING');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [targetForm, setTargetForm] = useState<'past' | 'participle'>('past');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Fix: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startRound();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const generateOptions = (correctAnswer: string, allVerbs: Verb[]) => {
    const wrongOptions = new Set<string>();
    while (wrongOptions.size < 3) {
      const randomVerb = allVerbs[Math.floor(Math.random() * allVerbs.length)];
      // Pick either past or participle to make it tricky
      const distractor = Math.random() > 0.5 ? randomVerb.past : randomVerb.participle;
      if (distractor !== correctAnswer && !distractor.includes('/')) {
        wrongOptions.add(distractor);
      }
    }
    return [...Array.from(wrongOptions), correctAnswer].sort(() => Math.random() - 0.5);
  };

  const startRound = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    
    const randomVerb = VERB_DATA[Math.floor(Math.random() * VERB_DATA.length)];
    // 50/50 chance to ask for Past or Participle
    const mode = Math.random() > 0.5 ? 'past' : 'participle';
    
    // Modals don't have participles really, so force past if modal
    const safeMode = randomVerb.category.includes('Modal') ? 'past' : mode;
    
    const correctAnswer = safeMode === 'past' ? randomVerb.past : randomVerb.participle;

    setCurrentVerb(randomVerb);
    setTargetForm(safeMode);
    setOptions(generateOptions(correctAnswer, VERB_DATA));
  };

  const handleAnswer = (option: string) => {
    if (selectedOption || gameState === 'GAME_OVER' || !currentVerb) return;
    
    setSelectedOption(option);
    const correctAnswer = targetForm === 'past' ? currentVerb.past : currentVerb.participle;
    
    // Simple check handling alternates like "woke / waked"
    const isRight = correctAnswer.includes(option);
    
    setIsCorrect(isRight);

    if (isRight) {
      setScore(s => s + 100);
      setTimeout(() => {
        startRound();
      }, 600);
    } else {
      // Penalty delay
      setTimeout(() => {
        startRound();
      }, 1500);
    }
  };

  if (gameState === 'GAME_OVER') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-6xl mb-4">🏁</div>
        <h2 className="text-4xl font-black text-slate-800 mb-4">Time's Up!</h2>
        <p className="text-xl text-slate-500 mb-8">You scored</p>
        <div className="text-8xl font-black text-brand-600 mb-8">{score}</div>
        
        <div className="flex gap-4">
          <button onClick={onBack} className="px-8 py-3 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">
            Exit
          </button>
          <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-full font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg">
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 h-full">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-500 font-bold">Quit</button>
        <div className="font-mono text-xl font-black text-brand-600">{score} pts</div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden mb-8 relative">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-brand-500'}`}
          style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
        ></div>
      </div>

      {currentVerb && (
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="mb-8">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Select the {targetForm} tense</p>
            <h1 className="text-6xl font-black text-slate-800">{currentVerb.base}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, idx) => {
               const isSelected = selectedOption === opt;
               const correctAnswer = targetForm === 'past' ? currentVerb.past : currentVerb.participle;
               const isReallyCorrect = correctAnswer.includes(opt);
               
               let btnClass = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
               
               if (selectedOption) {
                 if (isSelected && isCorrect) btnClass = "bg-green-500 text-white border-green-600";
                 else if (isSelected && !isCorrect) btnClass = "bg-red-500 text-white border-red-600";
                 else if (!isSelected && isReallyCorrect && !isCorrect) btnClass = "bg-green-100 text-green-700 border-green-200"; // Show correct one if wrong
                 else btnClass = "opacity-50 bg-slate-50";
               }

               return (
                 <button
                  key={idx}
                  disabled={!!selectedOption}
                  onClick={() => handleAnswer(opt)}
                  className={`py-6 text-2xl font-bold rounded-2xl border-b-4 transition-all active:scale-95 ${btnClass}`}
                 >
                   {opt}
                 </button>
               )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAttack;