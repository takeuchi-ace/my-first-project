/**
 * グローバルステート（セッション中のみ保持）。
 *
 * - contractedIds: 契約成功したユニークキャラIDの集合
 * - pendingRevealIds: 直近の契約で新たに解放されたキャラID（Home画面で消費）
 * - ACEボール解放: エース弁護士と契約成功したとき true
 * - bgm: 現在のBGMトラック指定
 */

import { Character, CharacterId, CompetitionId } from '../types';
import { characters } from './characters';
import { competitions, competitionOrder } from './competitionData';

// ===== 契約済みキャラID =====
const contractedIds = new Set<CharacterId>();

export const isContracted = (id: CharacterId): boolean => contractedIds.has(id);

export const getContractCount = (): number => contractedIds.size;

// ===== ACEボール =====
export const isAceUnlocked = (): boolean => {
  const ace = characters.find((c) => c.isAce);
  return ace ? contractedIds.has(ace.id) : false;
};

const ACE_BALL_MAX = 2;
let aceBalls = 0;
let aceRoundsCompleted = 0;

export const getAceBalls = (): number => aceBalls;
export const useAceBall = (): void => {
  if (aceBalls > 0) aceBalls -= 1;
};
export const refillAceBalls = (): void => {
  aceBalls = ACE_BALL_MAX;
};
export const getAceRoundsCompleted = (): number => aceRoundsCompleted;
export const incrementAceRoundsCompleted = (): void => {
  aceRoundsCompleted += 1;
};

// ===== コンペ状態管理 =====
let roundsSinceLastCompetition = 0;
let competitionAvailable = false;
const competitionUnlocked: Record<CompetitionId, boolean> = {
  springOpen: false,
  seasideCharity: false,
  executivesCup: false,
};
const COMPETITION_COOLDOWN = 5;

export const getRoundsSinceLastCompetition = (): number =>
  roundsSinceLastCompetition;
export const isCompetitionAvailable = (): boolean => competitionAvailable;
export const isCompetitionCleared = (id: CompetitionId): boolean =>
  competitionUnlocked[id];

/** 通常ラウンド完了時に呼ぶ */
export const incrementRoundCounter = (): void => {
  roundsSinceLastCompetition++;
  if (roundsSinceLastCompetition >= COMPETITION_COOLDOWN) {
    competitionAvailable = true;
  }
};

/** 次に参加可能なコンペを返す（未クリアの最初のもの） */
export const getNextCompetition = (): CompetitionId | null => {
  for (const id of competitionOrder) {
    if (!competitionUnlocked[id]) {
      // 紹介元キャラが契約済みか確認
      const comp = competitions.find((c) => c.id === id);
      if (comp && contractedIds.has(comp.referrerId)) {
        return id;
      }
    }
  }
  return null;
};

/** クリア済みで常設化されたコンペ一覧 */
export const getClearedCompetitions = (): CompetitionId[] =>
  competitionOrder.filter((id) => competitionUnlocked[id]);

/** コンペ参加時 */
export const onCompetitionStart = (): void => {
  roundsSinceLastCompetition = 0;
  competitionAvailable = false;
};

/** コンペクリア時 */
export const markCompetitionCleared = (id: CompetitionId): void => {
  competitionUnlocked[id] = true;
};

// ===== アンロック判定 =====
export const canUnlock = (char: Character): boolean => {
  const cond = char.unlockBy;
  switch (cond.type) {
    case 'starter':
      return true;
    case 'contractWith':
      return contractedIds.has(cond.id);
    case 'contractWithAny':
      return cond.ids.some((id) => contractedIds.has(id));
    case 'totalContractsAtLeast':
      return contractedIds.size >= cond.count;
    case 'competitionClear':
      return competitionUnlocked[cond.competitionId];
  }
};

// ===== 紹介演出用：ペンディングリビール =====
let pendingRevealIds: CharacterId[] = [];

/**
 * 契約を記録し、新たに解放されるキャラIDを返す。
 * 同キャラの再契約では空配列を返す（contractCountは増えない）。
 */
export const addContract = (id: CharacterId): CharacterId[] => {
  if (contractedIds.has(id)) return [];

  // 追加前の解放済みセットを記録
  const beforeUnlocked = new Set(
    characters.filter((c) => canUnlock(c)).map((c) => c.id)
  );

  contractedIds.add(id);

  // 追加後に新たに解放されたキャラを検出
  const newlyRevealed = characters
    .filter((c) => canUnlock(c) && !beforeUnlocked.has(c.id))
    .map((c) => c.id);

  pendingRevealIds.push(...newlyRevealed);

  return newlyRevealed;
};

/** Home画面で読み取る紹介待ちキャラID */
export const getPendingReveals = (): CharacterId[] => [...pendingRevealIds];

/** 読み取り後にクリア */
export const clearPendingReveals = (): void => {
  pendingRevealIds = [];
};

// ===== BGM =====
export type BgmTrack = 'clubhouse' | 'ace_jazz' | 'none';

let currentBgm: BgmTrack = 'clubhouse';

export const getBgm = (): BgmTrack => currentBgm;
export const setBgm = (bgm: BgmTrack): void => {
  currentBgm = bgm;
};
