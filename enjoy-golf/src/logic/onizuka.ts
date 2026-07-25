/**
 * 鬼塚専用ロジック — 「体育会系社長」仕様
 *
 * - KIAI / BRO / FLATTER / EXCUSE スタック管理
 * - S/SS 条件判定（SS は契約後のみ + 7% 抽選）
 * - 中盤"熱量漏れ"演出（back相で低確率発動）
 * - クロージングセリフ（S: 肩を叩く / SS: 固い握手）
 */

import { Tag, EntertainGrade } from '../types';

// ===== Round State =====
interface OnizukaRoundState {
  kiaiStack: number;
  broStack: number;
  flatterStack: number;
  excuseStack: number;
  etiquetteCount: number;
  cheatCount: number;
  netsuMoreFiredThisRound: boolean;
  adversityOnFinal: boolean;
}

const createFreshState = (): OnizukaRoundState => ({
  kiaiStack: 0,
  broStack: 0,
  flatterStack: 0,
  excuseStack: 0,
  etiquetteCount: 0,
  cheatCount: 0,
  netsuMoreFiredThisRound: false,
  adversityOnFinal: false,
});

let state: OnizukaRoundState = createFreshState();
let ssAchieved = false;

// ===== Init =====
export const initOnizukaRound = (): void => {
  state = createFreshState();
  ssAchieved = false;
};

// ===== Stack Update =====
export const updateOnizukaState = (tags: Tag[], currentHole: number): void => {
  for (const tag of tags) {
    // kiaiStack
    if (tag === 'challenge' || tag === 'kiai' || tag === 'ride_the_mood') {
      state.kiaiStack++;
    }
    // broStack
    if (tag === 'bro' || tag === 'team' || tag === 'back_up') {
      state.broStack++;
    }
    // flatterStack
    if (tag === 'over_praise' || tag === 'flattery') {
      state.flatterStack++;
    }
    // excuseStack
    if (tag === 'excuse' || tag === 'safe_play' || tag === 'avoid_risk') {
      state.excuseStack++;
    }
    // etiquette
    if (tag === 'etiquette') {
      state.etiquetteCount++;
    }
    // cheat
    if (tag === 'cheat_score' || tag === 'cheat_physical' || tag === 'cheat') {
      state.cheatCount++;
    }
    // adversity + forward on final hole
    if (tag === 'adversity' && currentHole === 9) {
      state.adversityOnFinal = true;
    }
  }
};

// ===== Flatter Penalty =====
export const getOnizukaFunMultiplier = (): number => {
  return state.flatterStack >= 3 ? 0.7 : 1.0;
};

// ===== Effective kiai requirement (flatter >= 5 makes it harder) =====
const effectiveKiaiReq = (base: number): number => {
  return state.flatterStack >= 5 ? base + 1 : base;
};

// ===== S Condition =====
const isOnizukaSCondition = (): boolean => {
  return (
    state.cheatCount === 0 &&
    state.excuseStack <= 1 &&
    state.kiaiStack >= effectiveKiaiReq(2) &&
    state.broStack >= 1
  );
};

// ===== SS Condition =====
const checkOnizukaSSCondition = (): boolean => {
  return (
    state.cheatCount === 0 &&
    state.excuseStack === 0 &&
    state.kiaiStack >= effectiveKiaiReq(3) &&
    state.broStack >= 2 &&
    state.adversityOnFinal
  );
};

// ===== 熱量漏れ =====
export interface NetsuMoreResult {
  fired: boolean;
  line: string;
  isSuperRare: boolean;
}

const NETSU_LINES = [
  'その選択、アツい！',
  'よし！乗ってきた！',
  'いいぞ、そのまま行け！',
];

const NETSU_SUPER_RARE = '逃げないやつは、だいたい好きだ。';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const checkNetsuMore = (phase: string): NetsuMoreResult => {
  if (phase !== 'back' || state.kiaiStack < 2 || state.netsuMoreFiredThisRound) {
    return { fired: false, line: '', isSuperRare: false };
  }

  const roll = Math.random();
  if (roll >= 0.20) {
    return { fired: false, line: '', isSuperRare: false };
  }

  state.netsuMoreFiredThisRound = true;

  const superRareRoll = Math.random();
  if (superRareRoll < 0.03) {
    return { fired: true, line: NETSU_SUPER_RARE, isSuperRare: true };
  }

  return { fired: true, line: pick(NETSU_LINES), isSuperRare: false };
};

// ===== Closing =====
export interface OnizukaClosingResult {
  type: 'SS' | 'S' | 'none';
  speech: string;
  gesture: string | null;
  pauseMs: number;
}

export const getOnizukaClosing = (
  baseGrade: EntertainGrade,
  isContracted: boolean,
): OnizukaClosingResult => {
  // SS check (契約後のみ)
  if (
    isContracted &&
    baseGrade === 'S' &&
    checkOnizukaSSCondition() &&
    Math.random() < 0.07
  ) {
    ssAchieved = true;
    return {
      type: 'SS',
      speech: 'お前、最高だ。…ウチ来い。',
      gesture: '固い握手をして、ニヤッと笑った',
      pauseMs: 300,
    };
  }

  // S check
  if (isOnizukaSCondition() && (baseGrade === 'S' || baseGrade === 'A')) {
    return {
      type: 'S',
      speech: 'いいねえ！そういうの、嫌いじゃねぇ！',
      gesture: '肩をバン！と叩いて笑った',
      pauseMs: 0,
    };
  }

  return { type: 'none', speech: '', gesture: null, pauseMs: 0 };
};

// ===== ResultScreen用フラグ =====
export const wasOnizukaSSAchieved = (): boolean => ssAchieved;
