import React from 'react';

interface ResultsScreenProps {
  score: number;
  totalQuestions: number;
  onBackToTitle: () => void;
  onRetryWrong?: () => void;
  onRetryAll?: () => void;
  hasWrongAnswers?: boolean;
  mode: 'quiz' | 'flashcard';
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  score, 
  totalQuestions, 
  onBackToTitle, 
  onRetryWrong, 
  onRetryAll,
  hasWrongAnswers,
  mode
}) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getFeedback = () => {
    if (percentage === 100) return "Perfect! 全問クリアです。";
    if (percentage >= 80) return "Excellent! 素晴らしい達成度です。";
    if (percentage >= 50) return "Good job! その調子で続けましょう。";
    return "Keep going! 繰り返しが記憶を定着させます。";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#faf9f6]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-50 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-10 shadow-2xl shadow-stone-200/50 w-full max-w-md relative z-10">
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-serif mb-4 block">Session Result</span>
            
            <h1 className="text-3xl font-medium text-stone-700 font-serif mb-2">学習完了</h1>
            
            <p className="text-stone-500 font-serif italic mb-10 mt-4 leading-relaxed">{getFeedback()}</p>

            <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl p-8 mb-10 border border-stone-100 shadow-inner relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-sm text-stone-400 uppercase tracking-widest mb-2">
                      {mode === 'quiz' ? 'Correct Answers' : 'Known Items'}
                    </p>
                    <div className="flex items-baseline justify-center text-stone-700">
                        <span className="text-6xl font-serif font-medium">{score}</span>
                        <span className="text-2xl text-stone-400 font-light ml-2">/ {totalQuestions}</span>
                    </div>
                    <div className="mt-4 w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-rose-400 transition-all duration-1000 ease-out" 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {hasWrongAnswers && onRetryWrong && (
                    <button
                        onClick={onRetryWrong}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-serif tracking-widest py-4 px-6 rounded-full text-sm transition-all duration-300 transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>間違えた問題のみ反復</span>
                    </button>
                )}

                {onRetryAll && (
                    <button
                        onClick={onRetryAll}
                        className="w-full bg-stone-600 hover:bg-stone-700 text-white font-serif tracking-widest py-4 px-6 rounded-full text-sm transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                    >
                        全問題をもう一度
                    </button>
                )}
                
                <button
                    onClick={onBackToTitle}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white font-serif tracking-widest py-4 px-6 rounded-full text-sm transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                >
                    タイトルに戻る
                </button>
            </div>
        </div>
    </div>
  );
};

export default ResultsScreen;