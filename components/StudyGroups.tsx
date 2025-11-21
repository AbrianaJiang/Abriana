import React, { useState } from 'react';
import { VERB_DATA } from '../constants';
import { VerbCategory } from '../types';

interface StudyGroupsProps {
  onBack: () => void;
}

const StudyGroups: React.FC<StudyGroupsProps> = ({ onBack }) => {
  // Get unique categories
  const categories = Object.values(VerbCategory);
  const [selectedCategory, setSelectedCategory] = useState<VerbCategory>(VerbCategory.N_ENDING);

  const filteredVerbs = VERB_DATA.filter(v => v.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto p-4 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-brand-600 font-semibold transition-colors mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h2 className="text-3xl font-bold text-slate-800">Study by Pattern</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Sidebar for Categories */}
        <div className="lg:w-1/4 space-y-2 overflow-y-auto max-h-60 lg:max-h-none pr-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-between ${
                selectedCategory === cat 
                  ? 'bg-brand-600 text-white shadow-md transform scale-105' 
                  : 'bg-white text-slate-600 hover:bg-brand-50'
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && <span>👉</span>}
            </button>
          ))}
        </div>

        {/* Table Area */}
        <div className="lg:w-3/4 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
          <div className="bg-brand-50 p-6 border-b border-brand-100">
             <h3 className="text-2xl font-bold text-brand-900">{selectedCategory}</h3>
             <p className="text-brand-600 text-sm mt-1">
                {filteredVerbs.length} verbs in this group
             </p>
          </div>
          
          <div className="overflow-auto flex-grow p-0">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-slate-500">Base Form</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-slate-500">Past Simple</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-slate-500">Past Participle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVerbs.map((verb, idx) => (
                  <tr key={verb.base} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 font-medium text-slate-800 text-lg">{verb.base}</td>
                    <td className="px-6 py-4 text-slate-600 text-lg">{verb.past}</td>
                    <td className="px-6 py-4 text-slate-600 text-lg">{verb.participle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;