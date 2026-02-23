
import React, { useState } from 'react';
import { QuizHistory, QuizCategory } from '../types';
import { getCategoryMasteryData, MASTERY_THRESHOLD } from '../services/quizService';

interface HistoryScreenProps {
  history: QuizHistory;
  categories: QuizCategory[];
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, categories, onBack }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (title: string) => {
    setOpenCategory(openCategory === title ? null : title);
  };

  // Chapter 6 has 5 Islam categories and 8 Europe categories
  const islamCategories = categories.slice(0, 5);
  const europeCategories = categories.slice(5);

  const calculateAggregatedStats = (cats: QuizCategory[]) => {
    let totalScore = 0;
    let totalMaxScore = 0;
    
    cats.forEach(cat => {
      const { currentScore, maxScore } = getCategoryMasteryData(cat, history[cat.title]);
      totalScore += currentScore;
      totalMaxScore += maxScore;
    });

    return {
      totalScore,
      totalMaxScore,
      percentage: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
    };
  };

  const overallStats = calculateAggregatedStats(categories);

  const renderCategoryList = (cats: QuizCategory[]) => {
    return (
      <div className="space-y-4">
        {cats.map(category => {
          const categoryHistory = history[category.title];
          const isOpen = openCategory === category.title;
          const { percentage } = getCategoryMasteryData(category, categoryHistory);

          return (
            <div key={category.title} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-rose-100">
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full p-5 text-left flex justify-between items-center group"
              >
                <div className="flex-1 pr-4">
                  <h2 className={`text-lg font-serif transition-colors ${isOpen ? 'text-rose-500' : 'text-stone-700'}`}>
                    {category.title}
                  </h2>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="text-right">
                     <span className={`text-xl font-medium font-serif ${percentage === 100 ? 'text-rose-400' : 'text-stone-600'}`}>
                       {percentage}%
                     </span>
                   </div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-rose-100 text-rose-500 rotate-180' : 'bg-stone-100 text-stone-400 group-hover:bg-rose-50 group-hover:text-rose-300'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                   </div>
                </div>
              </button>
              {isOpen && (
                <div className="p-5 border-t border-stone-100 bg-[#faf9f6]/50">
                  <ul className="space-y-3">
                    {category.questions.map((q, index) => {
                      const stats = categoryHistory?.questionStats?.[q.q];
                      const level = stats?.masteryLevel ?? 0;
                      const isMastered = level >= MASTERY_THRESHOLD;

                      return (
                        <li key={index} className="p-4 bg-white rounded-xl shadow-sm flex items-start border border-stone-50">
                          <div className="flex-shrink-0 w-10 pt-1 text-center">
                            {isMastered ? (
                              <span className="text-lg text-rose-400">🌸</span>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-stone-200 mt-1 inline-block"></div>
                            )}
                          </div>
                          <div className="flex-grow ml-5">
                            <p className="text-stone-700 mb-1 font-serif leading-relaxed text-[15px]">{q.q}</p>
                            <p className="text-stone-400 text-sm font-serif">A. {q.a}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 sm:p-8 md:p-12 font-sans relative">
      <div className="max-w-4xl mx-auto mb-10 flex justify-between items-end">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-serif block mb-2">My Progress</span>
            <h1 className="text-3xl md:text-4xl font-medium text-stone-700 font-serif">Learning History</h1>
          </div>
          <button onClick={onBack} className="text-stone-500 hover:text-stone-800 font-serif border-b border-transparent hover:border-stone-300 transition-all pb-1 text-sm">
            ← Back to Title
          </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                  <h2 className="text-stone-500 font-serif text-lg mb-1">Total Mastery</h2>
                  <p className="text-sm text-stone-400 font-light">Score: {overallStats.totalScore} / {overallStats.totalMaxScore}</p>
              </div>
              <div className="flex-1 w-full max-w-md">
                 <div className="flex justify-end mb-2">
                     <span className="text-4xl font-medium text-rose-400 font-serif">{overallStats.percentage}%</span>
                 </div>
                 <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-300 to-rose-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${overallStats.percentage}%` }}></div>
                 </div>
              </div>
          </div>
        </div>

        <div className="space-y-16">
          <section>
             <h3 className="text-2xl font-serif text-stone-700 mb-6">イスラーム世界の形成と多極化</h3>
             {renderCategoryList([...islamCategories])}
          </section>

          <section>
             <h3 className="text-2xl font-serif text-stone-700 mb-6">ヨーロッパ世界の形成</h3>
             {renderCategoryList([...europeCategories])}
          </section>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
