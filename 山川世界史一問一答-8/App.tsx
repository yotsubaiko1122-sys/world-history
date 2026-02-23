
import React, { useState, useEffect, useCallback } from 'react';
import { QuizCategory, QuizHistory, CategoryHistory, RawQuizData } from './types';
import { getCategorizedQuizData, loadHistoryFromStorage, saveHistoryToStorage, calculateMasteredCount, getWeakQuestions, MASTERY_THRESHOLD, getQuizMetadata } from './services/quizService';
import ResultsScreen from './components/ResultsScreen';
import HistoryScreen from './components/HistoryScreen';
import FlashcardGame from './components/FlashcardGame';

type StudyType = 'normal' | 'weakness';

const App: React.FC = () => {
  const [view, setView] = useState<'title' | 'flashcard' | 'results' | 'history' | 'block_selection'>('title');
  const [studyType, setStudyType] = useState<StudyType>('normal');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [rawQuestionsForFlashcard, setRawQuestionsForFlashcard] = useState<RawQuizData[]>([]);
  const [pendingPool, setPendingPool] = useState<RawQuizData[]>([]);
  const [currentSessionPool, setCurrentSessionPool] = useState<RawQuizData[]>([]);
  const [originalBlockPool, setOriginalBlockPool] = useState<RawQuizData[]>([]);
  const [lastSessionWrongPool, setLastSessionWrongPool] = useState<RawQuizData[]>([]);
  
  const [score, setScore] = useState<number>(0);
  const [history, setHistory] = useState<QuizHistory>({});
  const metadata = getQuizMetadata();

  useEffect(() => {
    setCategories(getCategorizedQuizData());
    setHistory(loadHistoryFromStorage());
  }, []);

  const toggleCategorySelection = (title: string) => {
    setSelectedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(title)) {
            newSet.delete(title);
        } else {
            newSet.add(title);
        }
        return newSet;
    });
  };

  const findCategoryForQuestion = (questionText: string): string | undefined => {
      for (const cat of categories) {
          if (cat.questions.some(q => q.q === questionText)) {
              return cat.title;
          }
      }
      return undefined;
  };

  const handleFlashcardMark = useCallback((questionText: string, status: 'known' | 'unknown') => {
    setHistory(prevHistory => {
        const newHistory: QuizHistory = JSON.parse(JSON.stringify(prevHistory));
        const catTitle = findCategoryForQuestion(questionText);
        if (!catTitle) return prevHistory;

        if (!newHistory[catTitle]) {
            newHistory[catTitle] = {
                bestScore: 0,
                lastPlayed: '',
                questionStats: {},
            };
        }
        
        const catHistory = newHistory[catTitle];
        if (!catHistory.questionStats[questionText]) {
            catHistory.questionStats[questionText] = { correct: 0, incorrect: 0, masteryLevel: 0 };
        }
        
        const stats = catHistory.questionStats[questionText];
        if (status === 'known') {
            stats.masteryLevel = Math.min(MASTERY_THRESHOLD, (stats.masteryLevel ?? 0) + 1);
        } else {
            stats.masteryLevel = Math.max(0, (stats.masteryLevel ?? 0) - 1);
            stats.incorrect++;
        }
        catHistory.lastPlayed = new Date().toISOString();
        
        saveHistoryToStorage(newHistory);
        return newHistory;
    });
  }, [categories]);

  const startSession = (pool: RawQuizData[]) => {
      setCurrentSessionPool(pool);
      const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
      setRawQuestionsForFlashcard(shuffledPool);
      setScore(0);
      setView('flashcard');
  };

  const handleStartGame = useCallback(() => {
    if (selectedCategories.size === 0) return;

    let pool: RawQuizData[] = [];
    const selectedCats = categories.filter(c => selectedCategories.has(c.title));

    selectedCats.forEach(cat => {
        if (studyType === 'weakness') {
            const weakQuestions = getWeakQuestions(cat.questions, cat.title, history);
            pool = [...pool, ...weakQuestions];
        } else {
            pool = [...pool, ...cat.questions];
        }
    });

    if (pool.length === 0) {
        if (studyType === 'weakness') {
            alert("未習得の問題はありません！素晴らしい。");
        } else {
            alert("問題が見つかりませんでした。");
        }
        return;
    }

    setPendingPool(pool);
    setView('block_selection');

  }, [selectedCategories, categories, studyType, history]);

  const handleBlockSelect = (blockIndex: number) => {
      const start = blockIndex * 10;
      const end = Math.min((blockIndex + 1) * 10, pendingPool.length);
      const blockQuestions = pendingPool.slice(start, end);
      setOriginalBlockPool(blockQuestions);
      startSession(blockQuestions);
  };

  const backToTitle = () => {
    setRawQuestionsForFlashcard([]);
    setPendingPool([]);
    setView('title');
  };
  
  const handleFlashcardCompletion = useCallback((unknownQuestionTexts: string[]) => {
      const knownCount = currentSessionPool.length - unknownQuestionTexts.length;
      setScore(knownCount);
      
      const wrongPool = currentSessionPool.filter(rawQ => 
          unknownQuestionTexts.includes(rawQ.q)
      );
      setLastSessionWrongPool(wrongPool);
      setView('results');
  }, [currentSessionPool]);

  const renderBlockSelection = () => {
      const totalBlocks = Math.ceil(pendingPool.length / 10);
      
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#faf9f6] relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-rose-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-amber-50/60 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

              <button 
                onClick={backToTitle}
                className="absolute top-6 left-6 text-stone-400 hover:text-stone-600 font-serif transition-colors z-20 flex items-center"
              >
                <span className="mr-2">←</span> Return
              </button>

              <div className="max-w-4xl w-full z-10">
                  <div className="text-center mb-10">
                      <span className="text-xs tracking-widest text-rose-400 uppercase font-serif block mb-2">Select Range</span>
                      <h2 className="text-3xl font-medium text-stone-700 font-serif">Choose a Question Set</h2>
                      <p className="text-stone-500 mt-4 font-light">
                          Selected {pendingPool.length} questions.
                      </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <button
                          onClick={() => { setOriginalBlockPool(pendingPool); startSession(pendingPool); }}
                          className="col-span-2 md:col-span-1 bg-stone-800 text-white border border-stone-800 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm group flex flex-col items-center justify-center hover:bg-stone-700"
                      >
                          <div className="text-rose-300 text-sm font-serif mb-2 tracking-widest font-medium uppercase">Selection</div>
                          <div className="text-white font-serif text-lg">
                              All Questions ({pendingPool.length})
                          </div>
                      </button>

                      {Array.from({ length: totalBlocks }).map((_, index) => {
                          const start = index * 10 + 1;
                          const end = Math.min((index + 1) * 10, pendingPool.length);
                          
                          return (
                              <button
                                  key={index}
                                  onClick={() => handleBlockSelect(index)}
                                  className="bg-white/80 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm group flex flex-col items-center justify-center"
                              >
                                  <div className="text-rose-400 text-sm font-serif mb-2 tracking-widest font-medium uppercase">SET {index + 1}</div>
                                  <div className="text-stone-600 font-serif text-lg">
                                      Q. {start} - {end}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
               <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 10s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
          </div>
      );
  };

  const renderTitleScreen = () => {
    const currentCategories = categories;

    interface CategoryButtonProps {
      category: QuizCategory;
    }

    const CategoryButton: React.FC<CategoryButtonProps> = ({ category }) => {
        const categoryHistory = history[category.title];
        const masteredCount = calculateMasteredCount(categoryHistory);
        const totalQuestions = category.questions.length;
        const masteryPercentage = totalQuestions > 0 ? (masteredCount / totalQuestions) * 100 : 0;
        const isSelected = selectedCategories.has(category.title);

        let baseClasses = 'border-stone-100 hover:border-rose-200';
        let titleClasses = 'text-stone-700';
        let progressColor = 'bg-stone-100 text-stone-500';
        let checkMarkClass = 'bg-stone-100 border-stone-300';

        if (isSelected) {
            baseClasses = 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 ring-opacity-50';
            titleClasses = 'text-stone-800';
            checkMarkClass = 'bg-rose-400 border-rose-400 text-white';
        } else {
            baseClasses = 'bg-white/80 hover:bg-white';
        }

        if (masteryPercentage >= 100) {
            progressColor = 'bg-white text-rose-500 shadow-sm';
        } else if (masteryPercentage >= 50) {
            progressColor = 'bg-amber-50 text-amber-600';
        }

        return (
            <button
                onClick={() => toggleCategorySelection(category.title)}
                disabled={category.questions.length === 0}
                className={`relative group px-4 py-3 rounded-xl transition-all duration-300 border backdrop-blur-sm flex flex-col justify-between items-start text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${baseClasses}`}
            >
                <div className="w-full mb-2 flex justify-between items-start">
                    <span className={`font-serif text-lg font-medium leading-tight tracking-wide ${titleClasses}`}>
                        {category.title}
                    </span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${checkMarkClass}`}>
                        {isSelected && <span className="text-xs">✓</span>}
                    </div>
                </div>
                
                <div className="w-full flex justify-between items-center mt-1">
                    <span className="text-xs text-stone-400 font-serif italic">{category.questions.length} Qs</span>
                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${progressColor}`}>
                        {masteredCount} 習得
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-6 md:p-10 pb-32 bg-[#faf9f6] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-rose-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-amber-50/60 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-5xl z-10">
                <header className="flex flex-col items-center mb-10">
                    <div className="mb-2 text-rose-400 text-sm tracking-[0.2em] uppercase font-serif">World History</div>
                    <h1 className="text-3xl md:text-5xl font-medium font-serif text-stone-700 mb-8 tracking-wide text-center">
                      <span className="inline-block border-b border-rose-300 pb-2">{metadata.title}</span>
                    </h1>

                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                         <div className="bg-white p-1 rounded-full shadow-md border border-stone-100 flex relative w-72">
                            <div 
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out shadow-sm ${studyType === 'normal' ? 'left-1 bg-stone-400' : 'left-[calc(50%+2px)] bg-rose-400'}`}
                            ></div>
                            <button onClick={() => setStudyType('normal')} className={`relative z-10 w-1/2 py-2 rounded-full text-sm font-medium transition-colors duration-300 font-serif tracking-wider ${studyType === 'normal' ? 'text-white' : 'text-stone-500'}`}>Normal</button>
                            <button onClick={() => setStudyType('weakness')} className={`relative z-10 w-1/2 py-2 rounded-full text-sm font-medium transition-colors duration-300 font-serif tracking-wider ${studyType === 'weakness' ? 'text-white' : 'text-stone-500'}`}>Weakness</button>
                        </div>
                    </div>

                    <p className="text-stone-500 text-sm mb-6 max-w-md text-center leading-relaxed font-light">
                        {metadata.description}
                    </p>

                    <button 
                      onClick={() => setView('history')}
                      className="text-stone-500 hover:text-rose-500 text-sm border-b border-stone-300 hover:border-rose-400 pb-0.5 transition-all font-serif"
                    >
                      学習履歴を確認する
                    </button>
                </header>

                <div className="grid gap-10">
                    <section>
                        <div className="flex items-center mb-5">
                            <h2 className="text-xl md:text-2xl font-serif text-stone-600 flex items-center">
                                <span className="w-8 h-[1px] bg-rose-300 mr-3"></span>
                                Chapter {metadata.chapterNumber}
                                <span className="ml-3 text-base text-stone-400 font-light hidden md:inline">{metadata.title}</span>
                            </h2>
                            <button 
                                onClick={() => {
                                    const allIds = currentCategories.map(c => c.title);
                                    const allSelected = allIds.every(id => selectedCategories.has(id));
                                    if (allSelected) {
                                        setSelectedCategories(prev => {
                                            const next = new Set(prev);
                                            allIds.forEach(id => next.delete(id));
                                            return next;
                                        });
                                    } else {
                                        setSelectedCategories(prev => {
                                            const next = new Set(prev);
                                            allIds.forEach(id => next.add(id));
                                            return next;
                                        });
                                    }
                                }}
                                className="ml-auto text-xs text-rose-400 border border-rose-200 px-3 py-1 rounded-full hover:bg-rose-50 transition-colors"
                            >
                                Select All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentCategories.map(category => <CategoryButton key={category.title} category={category} />)}
                        </div>
                    </section>
                </div>
            </div>

            <div className={`fixed bottom-0 left-0 w-full p-6 flex justify-center bg-gradient-to-t from-[#faf9f6] via-[#faf9f6]/95 to-transparent z-50 transition-transform duration-500 ${selectedCategories.size > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <button
                    onClick={handleStartGame}
                    className="bg-stone-800 text-white font-serif tracking-widest text-lg px-12 py-4 rounded-full shadow-xl hover:bg-stone-700 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
                >
                    <span>Start {selectedCategories.size} Categories</span>
                </button>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 10s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
};

  const renderResults = () => (
    <ResultsScreen 
      score={score} 
      totalQuestions={currentSessionPool.length} 
      onBackToTitle={backToTitle}
      onRetryWrong={() => startSession(lastSessionWrongPool)}
      onRetryAll={() => startSession(originalBlockPool)}
      hasWrongAnswers={lastSessionWrongPool.length > 0}
      mode="flashcard"
    />
  );

  const renderHistory = () => (
    <HistoryScreen 
      history={history}
      categories={categories}
      onBack={() => setView('title')}
    />
  );

  switch (view) {
    case 'flashcard':
      return rawQuestionsForFlashcard.length > 0 ? (
        <FlashcardGame 
            questions={rawQuestionsForFlashcard} 
            title={selectedCategories.size === 1 ? Array.from(selectedCategories)[0] : `Mixed Set`}
            studyType={studyType}
            onMarkStatus={handleFlashcardMark}
            onComplete={handleFlashcardCompletion}
            onBackToTitle={backToTitle} 
        />
      ) : renderTitleScreen();
    case 'results':
      return renderResults();
    case 'history':
      return renderHistory();
    case 'block_selection':
      return renderBlockSelection();
    case 'title':
    default:
      return renderTitleScreen();
  }
};

export default App;
