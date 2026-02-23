import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (questionText: string, isCorrect: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onAnswer, onNext, questionNumber, totalQuestions }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowFeedback(false);
  }, [question]);

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) {
      onNext();
      return;
    }
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    setShowFeedback(true);
    onAnswer(question.question, answer === question.correctAnswer);
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-white/60 hover:bg-white border-stone-200 hover:border-rose-300 text-stone-600 hover:text-stone-800 hover:shadow-md';
    }
    if (option === question.correctAnswer) {
      return 'bg-rose-100 border-rose-300 text-rose-800 shadow-inner';
    }
    if (option === selectedAnswer) {
      return 'bg-stone-200 border-stone-300 text-stone-500';
    }
    return 'bg-white/40 border-stone-100 text-stone-300';
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-stone-200/50 w-full max-w-2xl text-center overflow-hidden">
      {/* Visual Feedback Overlay - Refined */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ease-out z-10
          ${showFeedback ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          ${showFeedback && isCorrect ? 'bg-rose-50/20' : ''}
          ${showFeedback && !isCorrect ? 'bg-stone-100/20' : ''}
        `}
      >
        {showFeedback && (
          <div className={`transform transition-all duration-500 ${showFeedback ? 'scale-100 translate-y-0' : 'scale-75 translate-y-4'}`}>
            {isCorrect ? (
              <div className="flex flex-col items-center animate-bounce-short">
                <div className="w-24 h-24 rounded-full border-4 border-rose-300 flex items-center justify-center bg-white/80 shadow-lg">
                    <span className="text-5xl text-rose-400">Excellent</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full border-4 border-stone-300 flex items-center justify-center bg-white/80 shadow-lg">
                    <span className="text-4xl text-stone-400">Review</span>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-end mb-6 border-b border-stone-100 pb-4">
          <span className="text-stone-400 font-serif italic text-sm">Question</span>
          <span className="text-rose-400 font-serif text-lg">
            {questionNumber} <span className="text-stone-300 text-sm">/</span> {totalQuestions}
          </span>
      </div>

      <h2 className="text-xl md:text-2xl font-medium mb-10 text-stone-700 min-h-[5rem] flex items-center justify-center font-serif leading-relaxed">
        {question.question}
      </h2>
      
      <div className="grid grid-cols-1 gap-3 mb-8 relative z-20">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`w-full p-4 rounded-xl text-left text-base md:text-lg font-medium border transition-all duration-300 ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      
      <div className="h-16 flex items-center justify-center">
        <button
            onClick={onNext}
            className={`w-full bg-stone-800 hover:bg-stone-700 text-white font-serif tracking-wider py-3 px-8 rounded-full text-lg transition-all duration-500 transform hover:-translate-y-1 shadow-lg ${isAnswered ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}
        >
            {questionNumber === totalQuestions ? 'See Result' : 'Next'}
        </button>
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounce-short 0.6s ease-in-out 1;
        }
      `}</style>
    </div>
  );
};

export default QuizCard;