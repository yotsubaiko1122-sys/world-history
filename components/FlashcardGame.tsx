import React, { useState, useEffect, useRef } from 'react';
import { RawQuizData } from '../types';

interface FlashcardGameProps {
  questions: RawQuizData[];
  title: string;
  studyType?: 'normal' | 'weakness';
  onMarkStatus?: (questionText: string, status: 'known' | 'unknown') => void;
  onComplete: (unknownQuestionTexts: string[]) => void;
  onBackToTitle: () => void;
}

const FlashcardGame: React.FC<FlashcardGameProps> = ({ 
  questions, 
  title, 
  studyType = 'normal', 
  onMarkStatus, 
  onComplete,
  onBackToTitle 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState<number | null>(null);
  const [sessionUnknowns, setSessionUnknowns] = useState<string[]>([]);
  
  const startXRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
    setDragX(0);
    setExitX(null);
  }, [currentIndex]);

  if (!currentQuestion) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
            <p className="text-stone-500">No questions available.</p>
            <button onClick={onBackToTitle} className="ml-4 text-rose-500 font-serif">Back</button>
        </div>
      );
  }

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleNext = (status?: 'known' | 'unknown') => {
    let nextUnknowns = [...sessionUnknowns];
    if (status) {
      if (onMarkStatus) onMarkStatus(currentQuestion.q, status);
      if (status === 'unknown') nextUnknowns.push(currentQuestion.q);
    }

    if (currentIndex < questions.length - 1) {
      setSessionUnknowns(nextUnknowns);
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(nextUnknowns);
    }
  };

  const triggerExit = (status: 'known' | 'unknown') => {
    const direction = status === 'known' ? 1 : -1;
    setExitX(window.innerWidth * direction);
    setTimeout(() => {
      handleNext(status);
    }, 300);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (exitX !== null) return;
    setIsDragging(true);
    startXRef.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartTimeRef.current = Date.now();
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || exitX !== null) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startXRef.current;
    setDragX(deltaX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    const dragDuration = Date.now() - dragStartTimeRef.current;

    if (dragX > threshold || (dragX > 40 && dragDuration < 200)) {
      triggerExit('known');
    } else if (dragX < -threshold || (dragX < -40 && dragDuration < 200)) {
      triggerExit('unknown');
    } else {
      setDragX(0);
    }
  };

  const handleScreenTap = (e: React.MouseEvent) => {
    if (Math.abs(dragX) < 10) {
      setIsFlipped(!isFlipped);
    }
  };

  const currentTranslateX = exitX !== null ? exitX : dragX;
  const opacityLabel = Math.min(Math.abs(dragX) / 100, 1);

  return (
    <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#faf9f6]"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
    >
        <div className="absolute top-0 left-0 w-64 h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-3xl z-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8 px-2">
                <button 
                    onClick={onBackToTitle}
                    className="text-stone-500 hover:text-stone-800 transition-colors flex items-center font-serif px-2 py-1"
                >
                    ← タイトルへ
                </button>
                <div className="text-center">
                    <h2 className="text-stone-500 text-sm font-serif tracking-widest uppercase mb-1">
                        {title}
                        {studyType === 'weakness' && <span className="ml-2 bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded text-[10px]">Weakness</span>}
                    </h2>
                    <div className="text-rose-400 font-medium font-serif">
                        {currentIndex + 1} <span className="text-stone-300 text-sm mx-1">/</span> {questions.length}
                    </div>
                </div>
                <div className="w-20"></div>
            </div>

            <div className="w-full max-w-md h-1 bg-stone-200 rounded-full mb-10 overflow-hidden">
                <div 
                    className="h-full bg-rose-300 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div 
                className="perspective-1000 w-full max-w-xl h-96 relative select-none"
                style={{ 
                    transform: `translateX(${currentTranslateX}px)`,
                    transition: (isDragging) ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)' 
                }}
            >
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-150"
                  style={{ opacity: opacityLabel * 0.9 }}
                >
                  {dragX > 20 ? (
                    <div className="bg-emerald-500 text-white px-10 py-5 rounded-2xl font-serif text-2xl shadow-xl">
                      わかる (+1)
                    </div>
                  ) : dragX < -20 ? (
                    <div className="bg-rose-500 text-white px-10 py-5 rounded-2xl font-serif text-2xl shadow-xl">
                      わからない (-1)
                    </div>
                  ) : null}
                </div>

                <div 
                  key={currentIndex}
                  className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d shadow-2xl rounded-[2.5rem] cursor-grab active:cursor-grabbing ${isFlipped ? 'rotate-y-180' : ''}`}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  onClick={handleScreenTap}
                >
                    <div className="absolute w-full h-full backface-hidden bg-white border border-white/50 rounded-[2.5rem] flex flex-col items-center justify-center p-8 md:p-12">
                         <span className="absolute top-8 left-8 text-stone-300 text-xs tracking-widest uppercase font-serif">Question</span>
                         <h3 className="text-xl md:text-2xl font-medium text-stone-700 font-serif leading-relaxed tracking-wide">
                            {currentQuestion.q}
                         </h3>
                         <p className="absolute bottom-8 text-rose-300 text-xs font-serif tracking-widest">
                            タップで答えを表示 / 左右にスワイプ
                         </p>
                    </div>

                    <div 
                      className="absolute w-full h-full backface-hidden rotate-y-180 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 md:p-12"
                    >
                        <span className="absolute top-8 left-8 text-stone-300 text-xs tracking-widest uppercase font-serif">Answer</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-stone-800 font-serif tracking-wider">
                            {currentQuestion.a}
                        </h3>
                        <div className="absolute bottom-8 flex gap-6 text-[10px] font-serif uppercase tracking-widest opacity-50">
                            <span className="text-rose-500">← わからない (-1)</span>
                            <span className="text-stone-300">|</span>
                            <span className="text-emerald-600">わかる (+1) →</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-16 mt-12">
                <button 
                    onClick={() => triggerExit('unknown')}
                    className="group flex flex-col items-center transition-transform active:scale-90"
                >
                  <div className="w-16 h-16 rounded-full bg-white border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm group-hover:bg-rose-50 group-hover:shadow-md transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </div>
                  <span className="mt-3 text-[10px] text-rose-400 font-serif uppercase tracking-widest font-bold">わからない</span>
                </button>

                <button 
                    onClick={() => triggerExit('known')}
                    className="group flex flex-col items-center transition-transform active:scale-90"
                >
                  <div className="w-16 h-16 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-sm group-hover:bg-emerald-50 group-hover:shadow-md transition-all">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="mt-3 text-[10px] text-emerald-400 font-serif uppercase tracking-widest font-bold">わかる</span>
                </button>
            </div>
        </div>

        <style>{`
            .perspective-1000 { -webkit-perspective: 1000px; perspective: 1000px; }
            .transform-style-3d { -webkit-transform-style: preserve-3d; transform-style: preserve-3d; }
            .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
            .rotate-y-180 { -webkit-transform: rotateY(180deg); transform: rotateY(180deg); }
            
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
        `}</style>
    </div>
  );
};

export default FlashcardGame;