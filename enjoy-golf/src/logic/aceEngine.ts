/**
 * エースラウンド専用ロジック — 5ホール相談モード
 *
 * 通常ラウンドと完全分離:
 * - trust/creep/fun/focus ゲージ不使用
 * - 親密度のみ加算（内部値）
 * - 評価は常に S
 * - 契約は常に成立
 * - スコアは演出のみ（avg95±2）
 *
 * 相談モード:
 * - プレイヤーが悩みを選択 → ACEが回答
 * - プールから未使用3件をランダム選出し GameEvent 化
 * - isQuote の回答は 25% で名言演出発動
 */

import {
  GameState,
  GameEvent,
  GameResult,
  Phase,
  CharacterId,
} from '../types';
import { AceConsult, aceConsultPool } from '../data/aceConsults';

// ===== Module-level state for current consults =====
let currentEventConsults: AceConsult[] = [];

export const getSelectedAceConsult = (choiceIndex: number): AceConsult | null => {
  return currentEventConsults[choiceIndex] ?? null;
};

// ===== Phase helper (5-hole, no lunch) =====
const getPhase = (hole: number): Phase => {
  if (hole <= 3) return 'front';
  return 'back';
};

// ===== Init =====
export const createAceInitialState = (characterId: CharacterId): GameState => ({
  characterId,
  gauge: { fun: 100, trust: 100, creep: 0, focus: 100 },
  currentHole: 1,
  phase: 'front',
  usedEventIds: [],
  holeResults: [],
  cheatPhysicalCount: 0,
  finished: false,
  finishReason: null,
  aceUsedThisRound: false,
  tagHistory: [],
  lunchImpactScore: 0,
  lunchMood: 'good',
  afternoonTrustBias: 0,
  afternoonCreepBias: 0,
  afternoonFocusBias: 0,
  charEventSlots: [],
  morningShot: null,
  ownShot: null,
  morningMomentum: 0,
  puttResult: null,
  // 相談ラウンドは独自フロー（5ホール・ランチなし）。ボーナスビートは発生させない
  bonusBeat: 'closing',
  bonusBeatDone: true,
});

// ===== Event Selection: AceConsult ベース =====
export const selectAceEvent = (state: GameState): GameEvent | null => {
  // usedEventIds から個別IDを展開（複合ID "ac_01+ac_07+ac_15" を分解）
  const usedIds = new Set<string>();
  for (const eid of state.usedEventIds) {
    for (const part of eid.split('+')) {
      usedIds.add(part);
    }
  }

  // 未使用のコンサルトを抽出
  const available = aceConsultPool.filter((c) => !usedIds.has(c.id));
  if (available.length < 3) return null;

  // ランダム3件を選出
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  // モジュールレベルで保持（handleChoice から参照）
  currentEventConsults = selected;

  const D0 = { fun: 0, trust: 0, creep: 0, focus: 0 };

  return {
    id: selected.map((c) => c.id).join('+'),
    title: '相談',
    description: '何を相談しますか？',
    stage: state.currentHole,
    choices: selected.map((c) => ({
      text: c.text,
      delta: D0,
      tags: [] as any[],
      speechOverride: c.answer,
    })),
  };
};

// ===== Apply Choice =====
export const applyAceChoice = (
  state: GameState,
  event: GameEvent,
  choiceIndex: number
): GameState => {
  const newHole = state.currentHole + 1;
  const isComplete = newHole > 5;

  // 複合ID（"ac_01+ac_07+ac_15"）→ 3件分の個別IDを全て usedEventIds に追加
  const individualIds = event.id.split('+');

  return {
    ...state,
    currentHole: isComplete ? 5 : newHole,
    phase: isComplete ? state.phase : getPhase(newHole),
    usedEventIds: [...state.usedEventIds, ...individualIds],
    holeResults: [
      ...state.holeResults,
      {
        hole: state.currentHole,
        eventId: event.id,
        choiceIndex,
        focusSnapshot: 100,
      },
    ],
    tagHistory: state.tagHistory, // ACEは影響なし
    finished: isComplete,
    finishReason: isComplete ? 'complete' : null,
  };
};

// ===== Result (常に S、常に契約成立) =====
export const calcAceResult = (): GameResult => ({
  opponentGross18: 93 + Math.floor(Math.random() * 5), // 93-97
  baseline18: 95,
  improvement: 0,
  entertainScore: 100,
  grade: 'S',
  contractSuccess: true,
  playType: 'balanced',
  playTypeLabel: '最高のパートナー',
  playTypeComment: '接待ではない。最高のゴルフだった。',
  isAceRound: true,
});
