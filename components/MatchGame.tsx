import React, { useState, useEffect } from 'react';
import { VERB_DATA } from '../constants';
import { Verb, VerbCategory } from '../types';

interface MatchGameProps {
  onBack: () => void;
}

interface CardItem {
  id: string;
  text: string;
  type: 'BASE' | 'TARGET';
  matchId: string; // The base verb string connects them
}

const MatchGame: React.FC<MatchGameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    startLevel();
  }, []);

  const startLevel = () => {
    // Pick 6 random verbs
    const validVerbs = VERB_DATA.filter(v => v.category !== VerbCategory.MODAL);
    const shuffledVerbs = [...validVerbs].sort(() => Math.random() - 0.5).slice(0, 6);
    
    const newCards: CardItem[] = [];
    
    shuffledVerbs.forEach((v, i) => {
        // Card 1: Base
        newCards.push({
            id: `base-${i}`,
            text: v.base,
            type: 'BASE',
            matchId: v.base
        });
        
        // Card 2: Either Past or Participle (randomize)
        const targetText = Math.random() > 0.5 ? v.past : v.participle;
        newCards.push({
            id: `target-${i}`,
            text: targetText,
            type: 'TARGET',
            matchId: v.base
        });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setMatchedIds(new Set());
    setSelectedId(null);
  };

  const handleCardClick = (card: CardItem) => {
    if (matchedIds.has(card.id) || wrongIds.has(card.id)) return;
    
    if (selectedId === null) {
      // Select first card
      setSelectedId(card.id);
      return;
    }

    if (selectedId === card.id) {
      // Deselect
      setSelectedId(null);
      return;
    }

    // Check Match
    const firstCard = cards.find(c => c.id === selectedId);
    if (!firstCard) return;

    if (firstCard.matchId === card.matchId && firstCard.type !== card.type) {
        // Match found!
        const newMatched = new Set(matchedIds);
        newMatched.add(firstCard.id);
        newMatched.add(card.id);
        setMatchedIds(newMatched);
        setSelectedId(null);
    } else {
        // Wrong match
        const newWrong = new Set([firstCard.id, card.id]);
        setWrongIds(newWrong);
        setTimeout(() => {
            setWrongIds(new Set());
            setSelectedId(null);
        }, 800);
    }
  };

  const isComplete = cards.length > 0 && matchedIds.size === cards.length;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-brand-600">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-slate-700">Match Base with Past/Participle</h2>
      </div>

      {isComplete ? (
        <div className="flex-grow flex flex-col items-center justify-center animate-bounce-slow">
           <div className="text-8xl mb-4">🌟</div>
           <h1 className="text-4xl font-black text-brand-600 mb-6">Level Complete!</h1>
           <button 
             onClick={startLevel}
             className="px-8 py-4 bg-brand-500 text-white rounded-full font-bold shadow-lg hover:bg-brand-600 hover:scale-105 transition-all"
           >
             Next Level
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 flex-grow content-center">
            {cards.map(card => {
                const isSelected = selectedId === card.id;
                const isMatched = matchedIds.has(card.id);
                const isWrong = wrongIds.has(card.id);
                
                let bgClass = "bg-white border-slate-200 hover:border-brand-300 text-slate-700";
                if (isSelected) bgClass = "bg-brand-100 border-brand-500 text-brand-700 scale-105 ring-2 ring-brand-200";
                if (isMatched) bgClass = "bg-green-100 border-green-500 opacity-0 scale-0"; // Disappear animation
                if (isWrong) bgClass = "bg-red-100 border-red-500 animate-wiggle";

                return (
                    <button
                        key={card.id}
                        onClick={() => handleCardClick(card)}
                        className={`
                            relative aspect-square md:aspect-[4/3] rounded-2xl border-b-4 font-bold text-lg md:text-2xl shadow-sm 
                            flex items-center justify-center p-2 transition-all duration-300
                            ${bgClass}
                        `}
                        disabled={isMatched}
                    >
                        {card.text}
                        {card.type === 'BASE' && !isMatched && (
                            <span className="absolute top-2 right-2 text-[10px] text-slate-300 uppercase tracking-wider font-bold">Base</span>
                        )}
                    </button>
                )
            })}
        </div>
      )}
    </div>
  );
};

export default MatchGame;