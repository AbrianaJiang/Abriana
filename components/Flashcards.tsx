import React, { useState, useEffect } from 'react';
import { VERB_DATA } from '../constants';
import { Verb } from '../types';

interface FlashcardsProps {
  onBack: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledVerbs, setShuffledVerbs] = useState<Verb[]>([]);

  useEffect(() => {
    // Shuffle verbs on mount
    const shuffled = [...VERB_DATA].sort(() => Math.random() - 0.5);
    setShuffledVerbs(shuffled);
  }, []);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledVerbs.length);
    }, 150); // Slight delay for smooth transition
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledVerbs.length) % shuffledVerbs.length);
    }, 150);
  };

  if (shuffledVerbs.length === 0) return <div className="p-10 text-center">Loading...</div>;

  const currentVerb = shuffledVerbs[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-full items-center justify-center min-h-[80vh]">
      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-brand-600 font-bold">
          ← Exit
        </button>
        <div className="text-slate-400 font-mono text-sm">
          {currentIndex + 1} / {shuffledVerbs.length}
        </div>
      </div>

      <div className="relative w-full max-w-lg perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div 
          className={`relative w-full aspect-[4/3] duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front of Card */}
          <div className="absolute w-full h-full backface-hidden bg-white border-b-8 border-brand-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8">
             <span className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4">Base Form</span>
             <h2 className="text-6xl font-extrabold text-brand-900 mb-4">{currentVerb.base}</h2>
             <p className="text-slate-400 mt-8 text-sm flex items-center">
               <span className="animate-bounce mr-2">👆</span> Tap to flip
             </p>
          </div>

          {/* Back of Card */}
          <div 
            className="absolute w-full h-full backface-hidden bg-brand-600 text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
             <div className="grid grid-cols-1 gap-8 w-full text-center">
               <div>
                  <span className="text-brand-200 text-xs uppercase font-bold tracking-wider">Past Simple</span>
                  <p className="text-4xl font-bold mt-1">{currentVerb.past}</p>
               </div>
               <div className="w-16 h-1 bg-brand-400 mx-auto rounded-full"></div>
               <div>
                  <span className="text-brand-200 text-xs uppercase font-bold tracking-wider">Past Participle</span>
                  <p className="text-4xl font-bold mt-1">{currentVerb.participle}</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-12">
        <button 
          onClick={handlePrev}
          className="px-8 py-3 bg-white border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
        >
          Previous
        </button>
        <button 
          onClick={handleNext}
          className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all"
        >
          Next Verb
        </button>
      </div>
    </div>
  );
};

export default Flashcards;