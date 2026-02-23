
import { RawQuizData, QuizQuestion, QuizCategory, QuizHistory, CategoryHistory, QuizData } from '../types';
import quizDataRaw from '../quizData.json';

const quizData: QuizData = quizDataRaw as QuizData;

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const HISTORY_STORAGE_KEY = 'quizHistory';
export const MASTERY_THRESHOLD = 3;

export const loadHistoryFromStorage = (): QuizHistory => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error("Failed to load history from local storage:", error);
  }
  return {};
};

export const saveHistoryToStorage = (history: QuizHistory) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history to local storage:", error);
  }
};

export const calculateMasteredCount = (categoryHistory: CategoryHistory | undefined): number => {
  if (!categoryHistory || !categoryHistory.questionStats) {
    return 0;
  }
  return Object.values(categoryHistory.questionStats).filter(
    stats => (stats.masteryLevel ?? 0) >= MASTERY_THRESHOLD
  ).length;
};

export const getCategoryMasteryData = (category: QuizCategory, categoryHistory: CategoryHistory | undefined) => {
    const totalQuestions = category.questions.length;
    const maxScore = totalQuestions * MASTERY_THRESHOLD;
    
    let currentScore = 0;
    
    if (categoryHistory && categoryHistory.questionStats) {
        category.questions.forEach(q => {
            const stats = categoryHistory.questionStats[q.q];
            const level = stats?.masteryLevel ?? 0;
            currentScore += level;
        });
    }

    return {
        currentScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0
    };
};

export const getWeakQuestions = (questions: RawQuizData[], categoryTitle: string, history: QuizHistory): RawQuizData[] => {
    const categoryHistory = history[categoryTitle];
    if (!categoryHistory || !categoryHistory.questionStats) {
        return questions;
    }

    return questions.filter(q => {
        const stats = categoryHistory.questionStats[q.q];
        const level = stats?.masteryLevel ?? 0;
        return level < MASTERY_THRESHOLD;
    });
};

export const getQuizMetadata = () => {
    return {
        chapterNumber: quizData.chapterNumber,
        title: quizData.title,
        description: quizData.description
    };
};

export const getCategorizedQuizData = (): QuizCategory[] => {
    return quizData.categories;
};

// --- 精密なディストラクタ（誤選択肢）生成のためのロジック ---

type AnswerSystem = 'person' | 'place' | 'event' | 'document' | 'law' | 'concept' | 'group' | 'technical' | 'country';

const systemMapping: Record<string, AnswerSystem> = {
    // イスラーム系
    'ムハンマド': 'person', 'アブー=バクル': 'person', 'ウマル': 'person', 'ウスマン': 'person', 'アリー': 'person', 'ムアーウィヤ': 'person', 'アブー=アルアッバース': 'person', 'マンスール': 'person', 'ハールーン=アッラシード': 'person', 'タバリー': 'person', 'フワーリズミー': 'person', 'イブン=シーナー': 'person',
    'メッカ(マッカ)': 'place', 'メディナ': 'place', 'ダマスクス': 'place', 'バグダード': 'place', 'コルドバ': 'place', 'カイロ': 'place', 'ブハラ': 'place',
    'ヒジュラ(聖遷)': 'event', 'ニハーヴァンドの戦い': 'event', 'タラス河畔の戦い': 'event', 'トゥール・ポワティエ間の戦い': 'event',
    '『コーラン』(『クルアーン』)': 'document', 'ハディース': 'document', '『千夜一夜物語』(『アラビアン=ナイト』)': 'document', '『医学典範』': 'document',
    'シャリーア': 'law', 'イスラーム法(シャリーア)': 'law',
    'カリフ': 'concept', 'ウンマ': 'concept', 'ジハード(聖戦)': 'concept', 'ハラージュ': 'concept', 'ジズヤ': 'concept', 'アター': 'concept', 'ワクフ': 'concept',
    'ウマイヤ朝': 'group', 'アッバース朝': 'group', 'シーア派': 'group', 'スンナ派(スンニー派)': 'group', '後ウマイヤ朝': 'group', 'ファーティマ朝': 'group', 'ブワイフ朝': 'group', 'クライシュ族': 'group',
    'アラビア数字': 'technical', 'アラベスク': 'technical', '製紙法': 'technical', 'ゼロの概念': 'technical',
    
    // ヨーロッパ系
    'クローヴィス': 'person', 'ピピン(小ピピン)': 'person', 'カール大帝(シャルルマーニュ)': 'person', 'アルクィン': 'person', 'レオ3世': 'person', 'オットー1世': 'person', 'ユーグ=カペー': 'person', 'ロロ': 'person', 'ルッジェーロ2世': 'person', 'エグバート': 'person', 'アルフレッド大王': 'person', 'クヌート(カヌート)': 'person', 'ウィリアム1世': 'person', 'リューリク': 'person', 'アッティラ': 'person', 'オドアケル': 'person', 'テオドリック大王': 'person',
    'アーヘン': 'place', 'ノルマンディー公国': 'place', 'アイスランド': 'place', 'グリーンランド': 'place', 'パンノニア': 'place', 'ラヴェンナ地方': 'place',
    'カールの戴冠': 'event', '教会の東西分裂': 'event', 'ノルマン=コンクェスト': 'event', 'ヘースティングズの戦い': 'event', 'カタラウヌムの戦い': 'event', 'ピピンの寄進': 'event',
    '『ガリア戦記』': 'document', '『ゲルマニア』': 'document', '『ローマ法大全』': 'document',
    '聖像禁止令': 'law', 'ヴェルダン条約': 'law', 'メルセン条約': 'law',
    '封建社会': 'concept', '荘園': 'concept', '恩貸地制度': 'concept', '従士制': 'concept', '賦役': 'concept', '貢納': 'concept', '不輸不入権(インムニテート)': 'concept', '騎士道精神': 'concept', 'イタリア政策': 'concept',
    'メロヴィング朝': 'group', 'カロリング朝': 'group', 'カペー朝': 'group', 'ノルマン朝': 'group', 'ザクセン家': 'group', '神聖ローマ帝国': 'group', 'アングロ=サクソン人': 'group', 'ノルマン人': 'group',
    '養蚕技術': 'technical', '絹織物産業': 'technical',
};

const getAnswerSystem = (answer: string): AnswerSystem => {
    if (systemMapping[answer]) return systemMapping[answer];
    if (answer.endsWith('朝') || answer.endsWith('家') || answer.endsWith('派') || answer.endsWith('王国') || answer.endsWith('軍') || answer.endsWith('一族')) return 'group';
    if (answer.endsWith('法') || answer.endsWith('条約') || answer.endsWith('令') || answer.endsWith('法規')) return 'law';
    if (answer.endsWith('の戦い') || answer.endsWith('変') || answer.endsWith('事件') || answer.endsWith('運動') || answer.endsWith('大移動')) return 'event';
    if (answer.endsWith('書') || answer.endsWith('記') || answer.endsWith('典') || answer.includes('『')) return 'document';
    if (answer.endsWith('市') || answer.endsWith('地方') || answer.endsWith('半島') || answer.endsWith('島') || answer.endsWith('都')) return 'place';
    if (answer.endsWith('制') || answer.endsWith('権') || answer.endsWith('税') || answer.endsWith('道') || answer.endsWith('者')) return 'concept';
    if (answer.endsWith('法') || answer.endsWith('技術') || answer.endsWith('数字') || answer.endsWith('様式')) return 'technical';
    return 'concept';
};

const buildSystemPools = (allAnswers: string[]): Record<AnswerSystem, string[]> => {
    const pools: Record<AnswerSystem, string[]> = {
        person: [], place: [], event: [], document: [], law: [], concept: [], group: [], technical: [], country: []
    };
    
    allAnswers.forEach(ans => {
        const sys = getAnswerSystem(ans);
        if (!pools[sys].includes(ans)) {
            pools[sys].push(ans);
        }
    });
    
    return pools;
};

export const createQuiz = (questions: RawQuizData[], numQuestions: number): QuizQuestion[] => {
  const allAnswers = getCategorizedQuizData().flatMap(c => c.questions.map(q => q.a));
  const systemPools = buildSystemPools(allAnswers);
  
  const selectedQuestions = shuffleArray(questions).slice(0, Math.min(questions.length, numQuestions));

  return selectedQuestions.map(rawQuestion => {
    const correctAnswer = rawQuestion.a;
    const system = getAnswerSystem(correctAnswer);
    
    const systemPool = systemPools[system].filter(a => a !== correctAnswer);
    const distractors: string[] = [];
    
    if (systemPool.length >= 3) {
      const shuffledSystemPool = shuffleArray(systemPool);
      distractors.push(...shuffledSystemPool.slice(0, 3));
    } else {
      distractors.push(...systemPool);
      const otherAnswers = shuffleArray(allAnswers.filter(a => a !== correctAnswer && !distractors.includes(a)));
      distractors.push(...otherAnswers.slice(0, 3 - distractors.length));
    }

    const options = shuffleArray([correctAnswer, ...distractors]);

    return {
      question: rawQuestion.q,
      options,
      correctAnswer,
    };
  });
};
