
import React, { useState } from 'react';
import { GameMode } from './types';
import Dashboard from './components/Dashboard';
import StudyGroups from './components/StudyGroups';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import TimeAttack from './components/TimeAttack';
import MatchGame from './components/MatchGame';
import QuestGame from './components/QuestGame';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('HOME');

  const renderContent = () => {
    switch (mode) {
      case 'STUDY':
        return <StudyGroups onBack={() => setMode('HOME')} />;
      case 'FLASHCARDS':
        return <Flashcards onBack={() => setMode('HOME')} />;
      case 'QUIZ':
        return <Quiz onBack={() => setMode('HOME')} />;
      case 'TIME_ATTACK':
        return <TimeAttack onBack={() => setMode('HOME')} />;
      case 'MATCH':
        return <MatchGame onBack={() => setMode('HOME')} />;
      case 'QUEST':
        return <QuestGame onBack={() => setMode('HOME')} />;
      case 'HOME':
      default:
        return <Dashboard onSelectMode={setMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] text-slate-800 selection:bg-brand-200 font-sans">
      <header className={`bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 sticky top-0 z-50 ${mode === 'QUEST' ? 'hidden' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center md:justify-between">
            <button 
                className="flex items-center cursor-pointer group" 
                onClick={() => setMode('HOME')}
            >
                <span className="text-2xl mr-2 transform group-hover:scale-110 transition-transform">🇬🇧</span>
                <span className="font-bold text-lg tracking-tight text-slate-800">Irregular Verb Hero</span>
            </button>
            <div className="hidden md:block text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                Junior High English
            </div>
        </div>
      </header>

      <main className={`w-full ${mode === 'QUEST' ? '' : 'pb-12'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
