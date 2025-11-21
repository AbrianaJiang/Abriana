
import React from 'react';
import { GameMode } from '../types';

interface DashboardProps {
  onSelectMode: (mode: GameMode) => void;
}

const MacWindowHeader = () => (
  <div className="flex gap-2 mb-4">
    <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"></div>
    <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"></div>
    <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors"></div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onSelectMode }) => {
  return (
    <div className="max-w-5xl mx-auto text-center py-12 px-4">
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-4 tracking-tight">
          Verb <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Master</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Learn English irregular verbs the fun way!
        </p>
      </div>

      {/* Featured Game: Quest */}
      <div className="mb-8">
        <button 
          onClick={() => onSelectMode('QUEST')}
          className="w-full group relative p-8 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 border border-indigo-500 hover:-translate-y-1 text-left overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
           <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
              <div className="mb-6 md:mb-0">
                  <div className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-black uppercase tracking-widest rounded-full mb-3">New Adventure</div>
                  <h2 className="text-4xl font-black text-white mb-2">Verb Quest Adventure</h2>
                  <p className="text-indigo-100 text-lg max-w-md">Defeat monsters by casting the correct verb spells! An RPG style adventure.</p>
              </div>
              <div className="text-8xl filter drop-shadow-lg animate-bounce-slow flex gap-4">
                  <span>🛡️</span>
                  <span>🐉</span>
              </div>
           </div>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Study Mode */}
        <button 
          onClick={() => onSelectMode('STUDY')}
          className="group relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1 text-left overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
          <MacWindowHeader />
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Study Book</h3>
          <p className="text-slate-500 text-sm">Visual tables grouped by patterns (-n, i-a-u, etc).</p>
        </button>

        {/* Flashcards */}
        <button 
          onClick={() => onSelectMode('FLASHCARDS')}
          className="group relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1 text-left overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400"></div>
          <MacWindowHeader />
          <div className="text-4xl mb-3">🃏</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-yellow-600 transition-colors">Flashcards</h3>
          <p className="text-slate-500 text-sm">Flip cards to test your memory freely.</p>
        </button>

        {/* Fill in Blank Quiz */}
        <button 
          onClick={() => onSelectMode('QUIZ')}
          className="group relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1 text-left overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
          <MacWindowHeader />
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">Writing Quiz</h3>
          <p className="text-slate-500 text-sm">Type the correct past and participle forms.</p>
        </button>

        {/* Time Attack (Multiple Choice) */}
        <button 
          onClick={() => onSelectMode('TIME_ATTACK')}
          className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700 hover:-translate-y-1 text-left overflow-hidden"
        >
          <MacWindowHeader />
          <div className="text-4xl mb-3">⏱️</div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Time Attack</h3>
          <p className="text-slate-400 text-sm">Race against the clock! Multiple choice rapid fire.</p>
          <div className="absolute bottom-0 right-0 opacity-10 text-9xl transform translate-y-4 translate-x-4">⚡️</div>
        </button>

        {/* Matching Game */}
        <button 
          onClick={() => onSelectMode('MATCH')}
          className="group relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1 text-left overflow-hidden lg:col-span-2"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
          <MacWindowHeader />
          <div className="flex items-center justify-between">
            <div>
                <div className="text-4xl mb-3">🧩</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-green-600 transition-colors">Match Mania</h3>
                <p className="text-slate-500 text-sm">Connect the base verb with its correct transformation.</p>
            </div>
            <div className="hidden sm:flex gap-4 opacity-50">
                <div className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-400">Go</div>
                <div className="text-2xl text-slate-300">↔</div>
                <div className="px-4 py-2 bg-green-100 rounded-lg font-bold text-green-600">Went</div>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
