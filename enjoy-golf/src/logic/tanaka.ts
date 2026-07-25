/**
 * 田中専用ロジック — 「じわじわ熱い男」仕様
 *
 * - FLATTER/RESPECT スタック管理
 * - S/SS 条件判定
 * - じわ熱演出（back相で低確率発動）
 * - クロージングセリフ（S: 静かな承認 / SS: "間"付き特別セリフ）
 */

import { Tag, EntertainGrade } from '../types';

// ===== Round State =====
interface TanakaRoundState {
  flatterStack: number;
  respectStack: number;
  selfReflectCount: number;
  fairCompeteCount: number;
  etiquetteCount: number;
  cheatCount: number;
  jiwaNetsuFiredThisRound: boolean;
  challengeOnFinal: boolean;
}

const createFreshState = (): TanakaRoundState => ({
  flatterStack: 0,
  respectStack: 0,
  selfReflectCount: 0,
  fairCompeteCount: 0,
  etiquetteCount: 0,
  cheatCount: 0,
  jiwaNetsuFiredThisRound: false,
  challengeOnFinal: false,
});

let state: TanakaRoundState = createFreshState();
let ssAchieved = false;

// ===== Init =====
export const initTanakaRound = (): void => {
  state = createFreshState();
  ssAchieved = false;
};

// ===== Stack Update =====
export const updateTanakaState = (tags: Tag[], currentHole: number): void => {
  for (const tag of tags) {
    if (tag === 'over_praise' || tag === 'flattery') {
      state.flatterStack++;
    }
    if (tag === 'analysis_praise' || tag === 'fair_compete') {
      state.respectStack++;
    }
    if (tag === 'honesty' || tag === 'etiquette' || tag === 'sportsmanship') {
      state.respectStack++;
    }
    if (tag === 'self_reflect') {
      state.selfReflectCount++;
    }
    if (tag === 'fair_compete') {
      state.fairCompeteCount++;
    }
    if (tag === 'etiquette') {
      state.etiquetteCount++;
    }
    if (tag === 'cheat_score' || tag === 'cheat_physical' || tag === 'cheat') {
      state.cheatCount++;
    }
    if (tag === 'challenge' && currentHole === 9) {
      state.challengeOnFinal = true;
    }
  }
};

// ===== Flatter Penalty =====
export const getTrustMultiplier = (): number => {
  return state.flatterStack >= 3 ? 0.7 : 1.0;
};

// ===== S Condition =====
const isTanakaSCondition = (): boolean => {
  return (
    state.cheatCount === 0 &&
    state.etiquetteCount >= 2 &&
    state.respectStack >= 2 &&
    state.flatterStack <= 3
  );
};

// ===== SS Condition =====
const checkTanakaSSCondition = (): boolean => {
  return (
    state.cheatCount === 0 &&
    state.respectStack >= 3 &&
    state.selfReflectCount >= 1 &&
    state.fairCompeteCount >= 1 &&
    state.flatterStack <= 2 &&
    state.challengeOnFinal
  );
};

// ===== じわ熱 =====
export interface JiwaNetsuResult {
  fired: boolean;
  line: string;
  isSuperRare: boolean;
}

const JIWA_LINES = [
  '…見てますね。',
  'いい勝負ですね。',
  '次は取り返します。',
];

const JIWA_SUPER_RARE = '勝ちたい。でも正しく勝ちたい。';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const checkJiwaNetsu = (phase: string): JiwaNetsuResult => {
  if (phase !== 'back' || state.respectStack < 2 || state.jiwaNetsuFiredThisRound) {
    return { fired: false, line: '', isSuperRare: false };
  }

  const roll = Math.random();
  if (roll >= 0.15) {
    return { fired: false, line: '', isSuperRare: false };
  }

  state.jiwaNetsuFiredThisRound = true;

  const superRareRoll = Math.random();
  if (superRareRoll < 0.03) {
    return { fired: true, line: JIWA_SUPER_RARE, isSuperRare: true };
  }

  return { fired: true, line: pick(JIWA_LINES), isSuperRare: false };
};

// ===== Closing =====
export interface TanakaClosingResult {
  type: 'SS' | 'S' | 'none';
  speech: string;
  gesture: string | null;
  pauseMs: number;
}

export const getTanakaClosing = (
  baseGrade: EntertainGrade,
  isContracted: boolean,
): TanakaClosingResult => {
  // SS check
  if (
    isContracted &&
    baseGrade === 'S' &&
    checkTanakaSSCondition() &&
    Math.random() < 0.07
  ) {
    ssAchieved = true;
    return {
      type: 'SS',
      speech: '……悪くなかったです。いや、かなり。',
      gesture: '一瞬だけ目を逸らした',
      pauseMs: 500,
    };
  }

  // S check
  if (isTanakaSCondition() && (baseGrade === 'S' || baseGrade === 'A')) {
    return {
      type: 'S',
      speech: '…悪くなかったです。',
      gesture: null,
      pauseMs: 0,
    };
  }

  return { type: 'none', speech: '', gesture: null, pauseMs: 0 };
};

// ===== ResultScreen用フラグ =====
export const wasSSAchieved = (): boolean => ssAchieved;
