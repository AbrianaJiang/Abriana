import React, { useState, useEffect, useRef } from 'react';
import { VERB_DATA } from '../constants';
import { Verb, VerbCategory } from '../types';

interface QuizProps {
  onBack: () => void;
}

// Clean string for comparison (remove spaces, handle alternates)
const clean = (str: string) => str.toLowerCase().trim();
const isCorrect = (input: string, answer: string) => {
  // Handle "woke / waked" cases by splitting
  const possibilities = answer.split('/').map(clean);
  return possibilities.includes(clean(input));
};

const Quiz: React.FC<QuizProps> = ({ onBack }) => {
  // Quiz State
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [inputPast, setInputPast] = useState('');
  const [inputPart, setInputPart] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Refs for focus management
  const pastInputRef = useRef<HTMLInputElement>(null);

  // Initial Load
  useEffect(() => {
    pickRandomVerb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickRandomVerb = () => {
    // Filter out Modals for the quiz as they don't have participles
    const validVerbs = VERB_DATA.filter(v => v.category !== VerbCategory.MODAL);
    const random = validVerbs[Math.floor(Math.random() * validVerbs.length)];
    setCurrentVerb(random);
    setInputPast('');
    setInputPart('');
    setFeedback('idle');
    setShowAnswer(false);
    
    // Focus input after small delay
    setTimeout(() => {
        pastInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVerb) return;

    const pastCorrect = isCorrect(inputPast, currentVerb.past);
    const partCorrect = isCorrect(inputPart, currentVerb.participle);

    if (pastCorrect && partCorrect) {
      setFeedback('success');
      setScore(s => s + 10 + (streak * 2)); // Bonus for streaks
      setStreak(s => s + 1);
      setTimeout(pickRandomVerb, 1500); // Auto advance on success
    } else {
      setFeedback('error');
      setStreak(0);
      // Don't advance, let them try again or see answer
    }
  };

  const handleGiveUp = () => {
    setShowAnswer(true);
    setStreak(0);
  };

  if (!currentVerb) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-[80vh] flex flex-col">
      {/* Header with Stats */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={onBack} className="text-slate-500 hover:text-red-500 font-bold text-sm">
          Quit Game
        </button>
        <div className="flex gap-6">
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase">Streak</span>
            <span className={`block text-2xl font-black ${streak > 2 ? 'text-fun-pink animate-bounce' : 'text-slate-700'}`}>
              🔥 {streak}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-bold text-slate-400 uppercase">Score</span>
            <span className="block text-2xl font-black text-brand-600">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Quiz Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border-b-8 border-slate-200 flex-grow flex flex-col justify-center relative overflow-hidden">
        
        {/* Success Overlay */}
        {feedback === 'success' && (
          <div className="absolute inset-0 bg-green-500/90 z-20 flex items-center justify-center backdrop-blur-sm animate-pulse">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🎉</div>
              <h2 className="text-4xl font-black">Awesome!</h2>
              <p className="font-bold">+10 pts</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Translate to Past & Participle</span>
          <h1 className="text-6xl font-black text-slate-800 mt-2 mb-2">{currentVerb.base}</h1>
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
            {currentVerb.category}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2 ml-2">Past Simple</label>
            <input
              ref={pastInputRef}
              type="text"
              value={inputPast}
              onChange={e => setInputPast(e.target.value)}
              disabled={feedback === 'success' || showAnswer}
              placeholder="e.g. went"
              autoComplete="off"
              className={`w-full text-center text-2xl font-bold p-4 rounded-xl border-2 outline-none transition-all ${
                showAnswer 
                  ? 'border-fun-yellow bg-fun-yellow/10 text-slate-700' 
                  : feedback === 'error' && !isCorrect(inputPast, currentVerb.past)
                    ? 'border-red-400 bg-red-50 animate-wiggle'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
              }`}
            />
             {showAnswer && (
              <div className="text-center mt-2 text-fun-yellow font-bold animate-bounce">
                 Answer: {currentVerb.past}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2 ml-2">Past Participle</label>
            <input
              type="text"
              value={inputPart}
              onChange={e => setInputPart(e.target.value)}
              disabled={feedback === 'success' || showAnswer}
              placeholder="e.g. gone"
              autoComplete="off"
              className={`w-full text-center text-2xl font-bold p-4 rounded-xl border-2 outline-none transition-all ${
                 showAnswer 
                  ? 'border-fun-yellow bg-fun-yellow/10 text-slate-700' 
                  : feedback === 'error' && !isCorrect(inputPart, currentVerb.participle)
                    ? 'border-red-400 bg-red-50 animate-wiggle'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
              }`}
            />
            {showAnswer && (
              <div className="text-center mt-2 text-fun-yellow font-bold animate-bounce">
                 Answer: {currentVerb.participle}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            {!showAnswer && (
                <button 
                type="button"
                onClick={handleGiveUp}
                className="flex-1 py-4 rounded-xl font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                Give Up
                </button>
            )}
            
            {showAnswer ? (
                <button 
                type="button"
                onClick={pickRandomVerb}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-brand-600 shadow-lg shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 transition-all"
                >
                Next Verb →
                </button>
            ) : (
                <button 
                type="submit"
                className="flex-[2] py-4 rounded-xl font-bold text-white bg-brand-600 shadow-lg shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 transition-all active:translate-y-0"
                >
                Check Answer
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Quiz;