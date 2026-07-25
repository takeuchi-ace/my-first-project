import { ReactionRank, GameState, GameEvent, CharacterSpecificEvent, Gauge, CharacterId } from '../types';
import {
  GestureClass,
  rankToGestureClass,
  swapGestureClass,
  getGesturePool,
} from '../data/gestures';
import { characters } from '../data/characters';
import { speechLineTemplates } from '../data/speechLineTemplates';
import { speechStyles } from '../data/speechStyles';
import { applyChoice, evaluateReactionRank } from '../logic/engine';
import { applyCompetitionChoice, CompetitionGameState } from '../logic/competitionEngine';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface ReactionPlan {
  speechText: string;
  rank: ReactionRank;
  gestureText: string | null;
  gestureClass: GestureClass | null;
  isMismatch: boolean;
  gestureDelayMs: number;
}

/**
 * セリフ決定の優先順位:
 * 1. speechOverride（イベント側で指定された固定セリフ）
 * 2. mismatch時: character.mismatchSpeechLines?.[rank]
 * 3. character.speechLines?.[rank]?.default
 * 4. speechLineTemplates[character.speechStyleId][rank]
 * 5. speechStyles.sampleLines（rank無視フォールバック）
 */
function resolveSpeechText(
  rank: ReactionRank,
  characterId: CharacterId,
  isMismatch: boolean,
  speechOverride?: string
): string {
  // 1) speechOverride
  if (speechOverride) return speechOverride;

  const character = characters.find((c) => c.id === characterId);
  if (!character) return '';

  // 2) mismatch専用セリフ
  if (isMismatch) {
    const mismatchLines = character.mismatchSpeechLines?.[rank];
    if (mismatchLines?.length) {
      return pick(mismatchLines);
    }
  }

  // 3) character.speechLines
  const entry = character.speechLines?.[rank];
  if (entry?.default?.length) {
    return pick(entry.default);
  }

  // 4) speechLineTemplates
  if (speechLineTemplates[character.speechStyleId]?.[rank]?.length) {
    return pick(speechLineTemplates[character.speechStyleId][rank]);
  }

  // 5) speechStyles fallback
  const style = speechStyles.find((s) => s.id === character.speechStyleId);
  return style?.sampleLines?.length ? pick(style.sampleLines) : '';
}

/**
 * セリフ+仕草を一括計算
 * - 70%の確率で仕草を追加
 * - mismatchRate に応じてセリフと仕草がチグハグになる
 */
export function computeReactionPlan(
  rank: ReactionRank,
  characterId: CharacterId,
  speechOverride?: string
): ReactionPlan {
  const character = characters.find((c) => c.id === characterId);
  if (!character) {
    return {
      speechText: '',
      rank,
      gestureText: null,
      gestureClass: null,
      isMismatch: false,
      gestureDelayMs: 0,
    };
  }

  // mismatch判定を先に行う（セリフ・仕草の両方に影響）
  const isMismatch = Math.random() < character.mismatchRate;

  // セリフ解決（mismatch時は専用セリフを優先）
  const speechText = resolveSpeechText(rank, characterId, isMismatch, speechOverride);

  // 仕草: 70%の確率で表示
  const showGesture = Math.random() < 0.7;
  if (!showGesture) {
    return {
      speechText,
      rank,
      gestureText: null,
      gestureClass: null,
      isMismatch,
      gestureDelayMs: 0,
    };
  }

  // 仕草クラス決定（mismatch時はクラス反転）
  const normalClass = rankToGestureClass(rank);
  const gestureClass = isMismatch ? swapGestureClass(normalClass) : normalClass;

  // 仕草テキスト
  const pool = getGesturePool(gestureClass);
  const gestureText = pick(pool);

  // 仕草ディレイ: 500〜700ms
  const gestureDelayMs = 500 + Math.floor(Math.random() * 200);

  return {
    speechText,
    rank,
    gestureText,
    gestureClass,
    isMismatch,
    gestureDelayMs,
  };
}

/**
 * 通常ラウンド: 全choiceをシミュレートし最大trust delta indexを返す
 */
export function findBestChoiceIndex(state: GameState, event: GameEvent): number {
  let bestIdx = 0;
  let bestTrustDelta = -Infinity;

  for (let i = 0; i < event.choices.length; i++) {
    const newState = applyChoice(state, event, i);
    const trustDelta = newState.gauge.trust - state.gauge.trust;
    if (trustDelta > bestTrustDelta) {
      bestTrustDelta = trustDelta;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * コンペ: CharacterSpecificEvent用
 */
export function findBestCompChoiceIndex(
  state: CompetitionGameState,
  event: CharacterSpecificEvent
): number {
  let bestIdx = 0;
  let bestTrustDelta = -Infinity;

  for (let i = 0; i < event.choices.length; i++) {
    const newState = applyCompetitionChoice(state, event, i);
    const trustDelta = newState.gauge.trust - state.gauge.trust;
    if (trustDelta > bestTrustDelta) {
      bestTrustDelta = trustDelta;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * streak更新: mismatchターンのみ判定
 */
export function updateInsightStreak(
  current: number,
  isMismatch: boolean,
  chosenIdx: number,
  bestIdx: number
): { newStreak: number; insightFired: boolean } {
  if (!isMismatch) {
    return { newStreak: current, insightFired: false };
  }

  if (chosenIdx === bestIdx) {
    const newStreak = current + 1;
    if (newStreak >= 3) {
      return { newStreak: 0, insightFired: true };
    }
    return { newStreak, insightFired: false };
  }

  return { newStreak: 0, insightFired: false };
}
