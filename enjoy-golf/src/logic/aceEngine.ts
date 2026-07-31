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

/**
 * 表示中のイベントで、その選択肢に対応する相談を返す。
 *
 * 以前はモジュール変数に選出結果を控えていたが、`selectAceEvent` が
 * 表示より先にもう一度呼ばれると（StrictMode の二重実行など）
 * 画面の選択肢と答えがずれる作りだった。
 * 複合ID（"ac_01+ac_07+ac_15"）から引けば、結果画面の復元
 * （`getAceRoundConsults`）と同じ経路になり、ずれようがない。
 */
export const getSelectedAceConsult = (
  event: GameEvent,
  choiceIndex: number
): AceConsult | null => {
  const id = event.id.split('+')[choiceIndex];
  return aceConsultPool.find((c) => c.id === id) ?? null;
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
  tagHistory: [],
  lunchImpactScore: 0,
  // 相談ラウンドに昼はない。'good' にすると顧問契約の場面（IntroScreen）で
  // 「昼の時間、良かったですね。」という起きていない出来事の話が出てしまう
  lunchMood: 'neutral',
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
  lastAppliedDelta: { fun: 0, trust: 0, creep: 0, focus: 0 },
  creepBySource: { cheat: 0, close: 0, distant: 0 },
  coldStreak: 0,
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

/**
 * そのラウンドで実際に受けた助言を、記録から復元する。
 *
 * holeResults には複合ID（"ac_01+ac_07+ac_15"）と選んだ index が残っているので、
 * 追加の状態を持たずに「何を相談して何と言われたか」を並べ直せる。
 * 相談ラウンドは選択肢をシャッフルしないため index と ID の順序は一致する。
 */
export const getAceRoundConsults = (state: GameState): AceConsult[] => {
  const out: AceConsult[] = [];
  for (const h of state.holeResults) {
    const id = h.eventId.split('+')[h.choiceIndex];
    const consult = aceConsultPool.find((c) => c.id === id);
    if (consult) out.push(consult);
  }
  return out;
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
