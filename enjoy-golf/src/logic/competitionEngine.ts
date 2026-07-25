/**
 * コンペイベント専用ロジック
 *
 * - 通常ラウンドのGauge系をベースに簡略化
 * - trust → competitionTrust（対象キャラへの信頼）
 * - fun → reputation（周囲評価）
 * - creep/focus はそのまま
 * - 前半2 + 昼1 + 後半2 = 5ステップ
 */

import {
  Gauge,
  INITIAL_GAUGE,
  CompetitionId,
  CompetitionResult,
  CharacterId,
  CharacterSpecificEvent,
  CharacterSpecificChoice,
  LunchMood,
  Tag,
} from '../types';
import { characters } from '../data/characters';
import { competitionMap } from '../data/competitionData';

// ===== Competition Game State =====
export interface CompetitionGameState {
  competitionId: CompetitionId;
  targetCharacterId: CharacterId;
  gauge: Gauge;
  eventIndex: number;       // 0-3 (front1, front2, back1, back2)
  phase: 'front' | 'lunch' | 'back';
  usedEventIds: string[];
  tagHistory: Tag[];
  lunchMood: LunchMood;
  finished: boolean;
}

// ===== Clamp =====
const clamp = (v: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, v));

const clampGauge = (g: Gauge): Gauge => ({
  fun: clamp(g.fun),
  trust: clamp(g.trust),
  creep: clamp(g.creep),
  focus: clamp(g.focus),
});

// ===== Init =====
export const createCompetitionState = (
  competitionId: CompetitionId
): CompetitionGameState => {
  const comp = competitionMap.get(competitionId)!;
  return {
    competitionId,
    targetCharacterId: comp.targetCharacterId,
    gauge: { ...INITIAL_GAUGE },
    eventIndex: 0,
    phase: 'front',
    usedEventIds: [],
    tagHistory: [],
    lunchMood: 'neutral',
    finished: false,
  };
};

// ===== Apply Delta with TraitModifiers =====
const applyDelta = (gauge: Gauge, delta: Partial<Gauge>): Gauge =>
  clampGauge({
    fun: gauge.fun + (delta.fun ?? 0),
    trust: gauge.trust + (delta.trust ?? 0),
    creep: gauge.creep + (delta.creep ?? 0),
    focus: gauge.focus + (delta.focus ?? 0),
  });

const applyDeltaWithModifiers = (
  gauge: Gauge,
  delta: Partial<Gauge>,
  characterId: CharacterId
): Gauge => {
  const character = characters.find((c) => c.id === characterId);
  if (!character) return applyDelta(gauge, delta);

  const m = character.traitModifiers;
  const modifiedDelta: Partial<Gauge> = {
    fun: delta.fun != null ? Math.round(delta.fun * m.funSensitivity) : undefined,
    trust: delta.trust != null ? Math.round(delta.trust * m.trustSensitivity) : undefined,
    creep: delta.creep != null ? Math.round(delta.creep * m.creepSensitivity) : undefined,
    focus: delta.focus != null ? Math.round(delta.focus * m.focusSensitivity) : undefined,
  };

  return applyDelta(gauge, modifiedDelta);
};

// ===== Likes / Hates bonus =====
const applyLikesHates = (
  gauge: Gauge,
  tags: Tag[],
  characterId: CharacterId
): Gauge => {
  const character = characters.find((c) => c.id === characterId);
  if (!character) return gauge;

  let g = gauge;
  for (const tag of tags) {
    if (character.likesTags.includes(tag)) {
      g = applyDelta(g, { trust: 2, fun: 2 });
    }
    if (character.hatesTags.includes(tag)) {
      g = applyDelta(g, { creep: 6, trust: -4 });
    }
  }
  return g;
};

// ===== Apply Competition Choice =====
export const applyCompetitionChoice = (
  state: CompetitionGameState,
  event: CharacterSpecificEvent,
  choiceIndex: number
): CompetitionGameState => {
  const choice = event.choices[choiceIndex];
  const delta: Partial<Gauge> = choice.delta;

  // Apply with trait modifiers
  let newGauge = applyDeltaWithModifiers(
    state.gauge,
    delta,
    state.targetCharacterId
  );

  // Apply character reactions
  const character = characters.find((c) => c.id === state.targetCharacterId);
  if (character) {
    for (const tag of choice.tags) {
      const reaction = character.reactions.find((r) => r.tag === tag);
      if (reaction) {
        newGauge = applyDelta(newGauge, reaction.delta);
      }
    }
  }

  // Apply likes/hates
  newGauge = applyLikesHates(newGauge, choice.tags, state.targetCharacterId);

  // Creep penalty
  if (newGauge.creep >= 90) {
    newGauge = clampGauge({
      ...newGauge,
      trust: newGauge.trust - 2,
      focus: newGauge.focus - 2,
    });
  } else if (newGauge.creep >= 70) {
    newGauge = clampGauge({
      ...newGauge,
      trust: newGauge.trust - 1,
    });
  }

  const nextIndex = state.eventIndex + 1;
  const nextPhase = nextIndex < 2 ? 'front' : 'back';

  return {
    ...state,
    gauge: newGauge,
    eventIndex: nextIndex,
    phase: nextPhase,
    usedEventIds: [...state.usedEventIds, event.id],
    tagHistory: [...state.tagHistory, ...choice.tags],
  };
};

// ===== Apply Lunch Result =====
export const applyCompetitionLunch = (
  state: CompetitionGameState,
  lunchMood: LunchMood,
  trustBias: number,
  reputationBias: number
): CompetitionGameState => {
  const newGauge = clampGauge({
    ...state.gauge,
    trust: state.gauge.trust + trustBias,
    fun: state.gauge.fun + reputationBias,
  });

  return {
    ...state,
    gauge: newGauge,
    phase: 'back',
    lunchMood,
  };
};

// ===== Calc Result =====
export const calcCompetitionResult = (
  state: CompetitionGameState
): CompetitionResult => {
  const comp = competitionMap.get(state.competitionId)!;

  const competitionTrust = state.gauge.trust;
  const reputation = state.gauge.fun;

  const contractSuccess =
    competitionTrust >= comp.trustThreshold &&
    reputation >= comp.reputationThreshold &&
    state.gauge.creep <= 85;

  return {
    competitionTrust,
    reputation,
    contractSuccess,
    targetCharacterId: state.targetCharacterId,
    competitionId: state.competitionId,
  };
};
