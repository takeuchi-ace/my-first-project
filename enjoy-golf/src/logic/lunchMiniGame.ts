// ===== 昼食ミニゲーム ロジック =====

import { GameState, LunchMood } from '../types';
import {
  TableLayout,
  SeatId,
  characterLunchProfiles,
  menuItems,
  LunchProfile,
  layoutSeats,
  getSeatRelation,
} from '../data/lunchMiniGame';

// ===== AfternoonBias =====
export interface AfternoonBias {
  afternoonTrustBias: number;
  afternoonCreepBias: number;
  afternoonFocusBias: number;
}

// ===== Clamp =====
const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

// ===== 席スコア計算（2軸判定） =====
type SeatRating = 'perfect' | 'okay' | 'bad';

const rateSeat = (
  layout: TableLayout,
  playerSeat: SeatId,
  opponentSeat: SeatId | null,
  profile: LunchProfile
): SeatRating => {
  const pref = profile.seatPreference;
  const seatInfo = layoutSeats[layout].find((s) => s.id === playerSeat)!;

  // position軸: 窓側/入口側の一致判定
  let posMatch: boolean | null = null;
  if (pref.position !== 'any') {
    if (pref.position === 'window') {
      posMatch = seatInfo.isWindowSide;
    } else {
      posMatch = !seatInfo.isWindowSide;
    }
  }

  // proximity軸: 相手との相対位置の一致判定
  let proxMatch: boolean | null = null;
  if (pref.proximity !== 'any' && opponentSeat !== null) {
    const relation = getSeatRelation(layout, playerSeat, opponentSeat);
    if (pref.proximity === 'near') {
      proxMatch = relation === 'adjacent';
    } else {
      // far → across が好み
      proxMatch = relation === 'across';
    }
  }

  const checks = [posMatch, proxMatch].filter((v): v is boolean => v !== null);

  if (checks.length === 0) return 'okay';
  if (checks.every((v) => v)) return 'perfect';
  if (checks.every((v) => !v)) return 'bad';
  return 'okay';
};

interface ScoreDelta {
  trustD: number;
  creepD: number;
  focusD: number;
}

const seatScore = (
  layout: TableLayout,
  playerSeat: SeatId,
  opponentSeat: SeatId | null,
  profile: LunchProfile
): ScoreDelta => {
  const rating = rateSeat(layout, playerSeat, opponentSeat, profile);
  switch (rating) {
    case 'perfect':
      return { trustD: 2, creepD: -1, focusD: 1 };
    case 'okay':
      return { trustD: 1, creepD: 0, focusD: 0 };
    case 'bad':
      return { trustD: -1, creepD: 1, focusD: 0 };
  }
};

// ===== メニュースコア計算 =====
const menuScore = (playerMenuId: number, profile: LunchProfile): ScoreDelta => {
  let trustD = 0;
  let creepD = 0;
  const focusD = 0;

  const playerItem = menuItems.find((m) => m.id === playerMenuId);
  const charItem = menuItems.find((m) => m.id === profile.menuChoice);

  if (playerItem && charItem) {
    if (playerMenuId === profile.menuChoice) {
      // exact_match — 合わせすぎペナルティ
      creepD += profile.mimicSensitivity;
    } else if (playerItem.group === charItem.group) {
      // same_group — 近いけど違う
      trustD += 1;
    } else {
      // diff_group — 真逆
      trustD -= 1;
    }
  }

  // foodLikes
  if (profile.foodLikes.includes(playerMenuId)) {
    trustD += 1;
  }

  // foodDislikes
  if (profile.foodDislikes.includes(playerMenuId)) {
    creepD += 1;
  }

  return { trustD, creepD, focusD };
};

// ===== 結果テキスト =====
const resultTexts = {
  good: [
    'リラックスした雰囲気で昼食が終わった。午後も良い流れになりそうだ。',
    '会話も弾み、充実した昼休憩だった。',
  ],
  neutral: [
    '特に問題なく昼食が終わった。',
    'まずまずの昼休憩だった。',
  ],
  bad: [
    '少し気まずい空気のまま昼食が終わった…',
    'あまり良い雰囲気ではなかった。午後が心配だ。',
  ],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ===== メイン計算 =====
export interface LunchResult {
  bias: AfternoonBias;
  lunchImpactScore: number;
  lunchMood: LunchMood;
  resultText: string;
}

export const calcLunchResult = (
  layout: TableLayout,
  playerSeat: SeatId,
  opponentSeat: SeatId | null,
  playerMenuId: number,
  characterId: number
): LunchResult => {
  const profile = characterLunchProfiles[characterId];
  if (!profile) {
    return {
      bias: { afternoonTrustBias: 0, afternoonCreepBias: 0, afternoonFocusBias: 0 },
      lunchImpactScore: 0,
      lunchMood: 'neutral',
      resultText: pick(resultTexts.neutral),
    };
  }

  const seat = seatScore(layout, playerSeat, opponentSeat, profile);
  const menu = menuScore(playerMenuId, profile);

  const totalTrust = seat.trustD + menu.trustD;
  const totalCreep = seat.creepD + menu.creepD;
  const totalFocus = seat.focusD + menu.focusD;

  const bias: AfternoonBias = {
    afternoonTrustBias: clamp(totalTrust, -2, 2),
    afternoonCreepBias: clamp(totalCreep, -2, 2),
    afternoonFocusBias: clamp(totalFocus, -1, 1),
  };

  const lunchImpactScore = clamp((totalTrust - totalCreep) * 5, -15, 15);

  let lunchMood: LunchMood;
  if (lunchImpactScore >= 12) {
    lunchMood = 'good';
  } else if (lunchImpactScore <= -10) {
    lunchMood = 'bad';
  } else {
    lunchMood = 'neutral';
  }

  let resultText: string;
  if (lunchMood === 'good') {
    resultText = pick(resultTexts.good);
  } else if (lunchMood === 'bad') {
    resultText = pick(resultTexts.bad);
  } else {
    resultText = pick(resultTexts.neutral);
  }

  return { bias, lunchImpactScore, lunchMood, resultText };
};

// ===== バイアスのみ適用（ホール進行なし） =====
// ミニゲーム結果をstateに反映し、その後characterLunchEventを表示するために使用
export const applyLunchBiasOnly = (
  state: GameState,
  layout: TableLayout,
  playerSeat: SeatId,
  opponentSeat: SeatId | null,
  playerMenuId: number
): GameState => {
  const result = calcLunchResult(layout, playerSeat, opponentSeat, playerMenuId, state.characterId);

  return {
    ...state,
    usedEventIds: [...state.usedEventIds, 'lunch_mini'],
    afternoonTrustBias: result.bias.afternoonTrustBias,
    afternoonCreepBias: result.bias.afternoonCreepBias,
    afternoonFocusBias: result.bias.afternoonFocusBias,
    lunchImpactScore: result.lunchImpactScore,
    lunchMood: result.lunchMood,
  };
};

// ===== State遷移（フル — hole 6へ進行） =====
export const applyLunchMiniGame = (
  state: GameState,
  layout: TableLayout,
  playerSeat: SeatId,
  opponentSeat: SeatId | null,
  playerMenuId: number
): GameState => {
  const result = calcLunchResult(layout, playerSeat, opponentSeat, playerMenuId, state.characterId);

  return {
    ...state,
    holeResults: [
      ...state.holeResults,
      {
        hole: 5,
        eventId: 'lunch_mini',
        choiceIndex: 0,
        focusSnapshot: state.gauge.focus,
      },
    ],
    currentHole: 6,
    phase: 'back',
    usedEventIds: [...state.usedEventIds, 'lunch_mini'],
    afternoonTrustBias: result.bias.afternoonTrustBias,
    afternoonCreepBias: result.bias.afternoonCreepBias,
    afternoonFocusBias: result.bias.afternoonFocusBias,
    lunchImpactScore: result.lunchImpactScore,
    lunchMood: result.lunchMood,
  };
};
