// ===== Gauge =====
export interface Gauge {
  fun: number;
  trust: number;
  creep: number;
  focus: number;
}

export const INITIAL_GAUGE: Gauge = { fun: 50, trust: 50, creep: 0, focus: 50 };

// ===== Phase =====
export type Phase = 'front' | 'lunch' | 'back';

// ===== Lunch Mood =====
export type LunchMood = 'good' | 'neutral' | 'bad';

// ===== Event Category =====
export type EventCategory = 'normal' | 'goodBack' | 'tensionBack';

// ===== Reaction =====
export type ReactionRank = 'good' | 'neutral' | 'bad' | 'worst';
export type ReactionLines = Record<ReactionRank, string[]>;

/** セリフ定義（拡張前提）
 *  - default: 通常時の口語セリフ配列
 *  - contextTag: 将来用。特定タグ文脈でのセリフ分岐
 */
export interface SpeechLineEntry {
  default?: string[];
  contextTag?: Record<string, string[]>;
}

/** キャラごとの speechLines。rank ごとにエントリを持つ（省略可） */
export type SpeechLines = {
  [rank in ReactionRank]?: SpeechLineEntry;
};

// ===== Tags =====
export type Tag =
  | 'honesty'
  | 'flattery'
  | 'cheat_physical'
  | 'cheat_score'
  | 'over_support'
  | 'humor'
  | 'serious'
  | 'neutral'
  | 'bold'
  | 'safe'
  | 'alcohol'
  | 'etiquette'
  | 'extreme'
  | 'over_praise'
  | 'distance'
  | 'logic'
  | 'hype'
  | 'silence'
  | 'risk'
  | 'ethics'
  | 'boss'
  | 'snitch'
  | 'sportsmanship'
  | 'pressure'
  | 'cheat'
  | 'focus'
  | 'analysis_praise'
  | 'self_reflect'
  | 'fair_compete'
  | 'challenge'
  | 'kiai'
  | 'ride_the_mood'
  | 'bro'
  | 'team'
  | 'back_up'
  | 'excuse'
  | 'safe_play'
  | 'avoid_risk'
  | 'adversity'
  | 'self_suppress'
  | 'over_adjust'
  | 'over_flatter'
  | 'forced_laugh';

// ===== StatDelta =====
export type StatDelta = {
  fun: number;
  trust: number;
  focus: number;
  creep: number;
};

// ===== Events (common) =====
export type ChoiceSpeech = { [rank in ReactionRank]: string };

export interface Choice {
  text: string;
  delta: Partial<Gauge>;
  tags: Tag[];
  speechOverride?: string;
  speech?: ChoiceSpeech;
}

// ===== Lunch Event =====
export interface LunchMenuItem {
  id: string;
  name: string;
  category: 'main' | 'side' | 'drink' | 'dessert';
  isHeavy: boolean;
  isLight: boolean;
  isLocalSignature: boolean;
  priceBand: 'low' | 'mid' | 'high';
}

export type SeatPosition = 'windowSame' | 'windowAcross' | 'aisleAcross' | 'aisleSame';
export type TableOrientation = 'vertical' | 'parallel';

/**
 * ボーナスビート — 9ホールの合間に1つだけ挿入される追加ビート。
 * ラウンド開始時に3種から1つ抽選され、そのビートだけが発生する。
 * ホールを消費しないため、ラウンドは 9 → 10 ビートになる。
 *  - pre       : スタート前（朝イチのショットの前）／stage 1 の到着シーンを消費
 *  - lunchTalk : 昼食の追加会話（キャラ別ランチイベントの後）／stage 5 を消費
 *  - closing   : ラウンド後の締め（最終パットの後）／stage 9 を消費
 */
export type BonusBeat = 'pre' | 'lunchTalk' | 'closing';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  stage: number; // 1-9
  choices: Choice[];
  category?: EventCategory;
  /** 挿入ビートとして選ばれたイベントに付く。付いている間はホールを消費しない */
  beat?: BonusBeat;
}

// ===== Events (character-specific) =====
export interface CharacterSpecificChoice {
  id: string;
  text: string;
  delta: StatDelta;
  tags: Tag[];
  speechOverride?: string;
}

export interface CharacterSpecificEvent {
  id: string;
  title: string;
  situation: string;
  choices: CharacterSpecificChoice[];
  extreme?: boolean;
}

// ===== Trait Modifiers =====
export interface TraitModifiers {
  trustSensitivity: number;
  funSensitivity: number;
  focusSensitivity: number;
  creepSensitivity: number;
}

// ===== Characters =====
export type CharacterId = number;

export type CompetitionId = 'springOpen' | 'seasideCharity' | 'executivesCup';

export type UnlockCondition =
  | { type: 'starter' }
  | { type: 'contractWith'; id: number }
  | { type: 'contractWithAny'; ids: number[] }
  | { type: 'totalContractsAtLeast'; count: number }
  | { type: 'competitionClear'; competitionId: CompetitionId };

export interface TagReaction {
  tag: Tag;
  delta: Partial<Gauge>;
}

export interface Character {
  id: CharacterId;
  name: string;
  fullName: string;
  /** 会話・ナレーション中で呼びかけ／指示に使う短い名前（「○○さん」「相手」の差し込み先） */
  callName: string;
  /** 肩書き。氏名ではないので fullName には入れない（プロフィール等の正式紹介でのみ表示） */
  title?: string;
  gender: 'male' | 'female';
  nickname?: string;
  speechStyleId: string;
  mismatchRate: number; // 0.0〜1.0
  role: string;
  avgScore18: number;
  shotShape: string;
  motto: string;
  unlockBy: UnlockCondition;
  introLine: string;
  targetHint: string;
  isAce: boolean;
  reactions: TagReaction[];
  traitModifiers: TraitModifiers;
  likesTags: Tag[];
  hatesTags: Tag[];
  reactionLines: ReactionLines;
  speechLines?: SpeechLines;
  mismatchSpeechLines?: { [rank in ReactionRank]?: string[] };
  hint?: string;
  preRoundLine?: string;
}

// ===== Morning Shot =====
export type MorningShotResult = 'great' | 'normal' | 'ob';
export type OwnShotResult = 'perfect' | 'good' | 'miss';

// ===== Final Putt =====
export type SlopeType = 'left' | 'right' | 'flat' | 'uphill';
export type PuttAim = 'left' | 'center' | 'right';
export type PuttPower = 'perfect' | 'good' | 'miss';
export type PuttResult = 'in' | 'lip_out' | 'miss';

export interface MorningShotVariant {
  shotResult: MorningShotResult;
  situation: string;
  choices: { id: string; text: string; delta: Partial<Gauge>; tags: Tag[] }[];
}

export interface MorningShotEvent {
  characterId: number;
  variants: MorningShotVariant[];
}

// ===== Game State =====
export interface HoleResult {
  hole: number;
  eventId: string;
  choiceIndex: number;
  focusSnapshot: number;
}

export interface CharEventSlot {
  hole: number;
  eventIndex: number;
}

export interface GameState {
  characterId: CharacterId;
  gauge: Gauge;
  currentHole: number;
  phase: Phase;
  usedEventIds: string[];
  holeResults: HoleResult[];
  cheatPhysicalCount: number;
  finished: boolean;
  finishReason: 'complete' | 'creep_explosion' | null;
  aceUsedThisRound: boolean;
  tagHistory: Tag[];
  lunchImpactScore: number;
  lunchMood: LunchMood;
  afternoonTrustBias: number;
  afternoonCreepBias: number;
  afternoonFocusBias: number;
  charEventSlots: CharEventSlot[];
  morningShot: MorningShotResult | null;
  ownShot: OwnShotResult | null;
  morningMomentum: number; // -10 〜 +10
  puttResult: PuttResult | null;
  /** このラウンドで発生するボーナスビート（開始時に1つ抽選） */
  bonusBeat: BonusBeat;
  /** ボーナスビートを消化済みか */
  bonusBeatDone: boolean;
}

// ===== Play Type =====
export type PlayType =
  | 'honest'
  | 'entertainer'
  | 'distance'
  | 'risky'
  | 'dominant'
  | 'creepy'
  | 'balanced';

// ===== Grade =====
export type EntertainGrade = 'SS' | 'S' | 'A' | 'B' | 'C' | 'D';

// ===== Result =====
export interface GameResult {
  opponentGross18: number;
  baseline18: number;
  improvement: number;
  entertainScore: number;
  grade: EntertainGrade;
  contractSuccess: boolean;
  playType: PlayType;
  playTypeLabel: string;
  playTypeComment: string;
  isAceRound?: boolean;
}

// ===== Competition =====
export type CompetitionStep =
  | 'reception'
  | 'pairing'
  | 'greeting'
  | 'front_event'
  | 'lunch'
  | 'back_event'
  | 'awards';

export interface CompetitionResult {
  competitionTrust: number;
  reputation: number;
  contractSuccess: boolean;
  targetCharacterId: CharacterId;
  competitionId: CompetitionId;
}

// ===== Navigation =====
export type RootStackParamList = {
  CharacterSelect: undefined;
  Profile: { characterId: CharacterId };
  Home: undefined;
  Game: { characterId: CharacterId };
  GameSimple: { characterId: CharacterId };
  ResultSimple: {
    characterId: CharacterId;
    finishReason: 'complete' | 'creep_explosion';
    isAceRound?: boolean;
  };
  Result: {
    result: GameResult;
    characterId: CharacterId;
    finishReason: 'complete' | 'creep_explosion';
    lunchMood: LunchMood;
    isAceRound?: boolean;
  };
  Intro: {
    contractedCharId: CharacterId;
    newlyUnlockedIds: CharacterId[];
    isAceContract: boolean;
    isRepeatAce?: boolean;
    lunchMood: LunchMood;
  };
  Competition: { competitionId: CompetitionId };
  CompetitionResult: {
    result: CompetitionResult;
    competitionId: CompetitionId;
  };
};
