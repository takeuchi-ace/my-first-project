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
  /**
   * 1ビートごとに目減りする trust の量（＝このキャラの難易度）。
   * 良い選択で積んだ信頼が時間で剥がれるため、ラウンド全体を通して稼ぎ続ける必要がある。
   * 大きいほど難しい。目安: 2=序盤の相手 / 3=標準 / 4-5=手強い相手 / 0=相談ラウンド
   */
  trustDrift: number;
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
  /**
   * その選択に相手が返した反応。ラウンド後の振り返りに使う。
   * 判定は applyChoice が既に計算している lastAppliedDelta から作るので、
   * 画面側で再計算する必要はない（再計算すると trustDrift が混ざって下振れする）。
   */
  rank: ReactionRank;
  /** その選択で動いた信頼の量（自然減を含まない） */
  trustDelta: number;
  /**
   * 実際に選んだ選択肢の文言。
   * 選択肢は提示時にシャッフルされる（`shuffleChoices`）ため、
   * eventId と choiceIndex から元データを引き直すと**別の選択肢を指してしまう**。
   * 振り返りで正しい文言を出すには、選んだ時点の文言を持っておくしかない。
   */
  choiceText: string;
  /** その選択が持っていたタグ。「一緒に回って分かったこと」の蓄積に使う */
  tags: Tag[];
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
  /**
   * 締めのビートを消化済みか。
   * 締めは抽選ではなく毎ラウンド必ず発生させるため、
   * `bonusBeatDone`（pre / lunchTalk と共用）とは別に持つ。
   */
  closingDone: boolean;
  /**
   * creep をどの振る舞いで稼いだかの内訳。
   * creep は「引かれた度合い」を1本で表しているが、引かれ方には種類がある。
   * 終了時に何をやりすぎたのかを言い分けるために、寄与量を積算しておく。
   */
  creepBySource: { cheat: number; close: number; distant: number };
  /**
   * 冷たい選択（沈黙・距離・正論・無難）が何ビート連続しているか。
   * 壁は1回では立たないので、罰を1回ごとの creep ではなく連続回数に乗せる。
   * 相手が好むタグでの距離の取り方は壁に数えないため、そこで途切れる。
   */
  coldStreak: number;
  /**
   * 直前の選択に対する反応そのもの（trust の自然減を含まない）。
   * 反応ランクの判定はこれを使う。ゲージの前後差から求めると
   * trustDrift による目減りが混ざってランクが下振れする。
   */
  lastAppliedDelta: Gauge;
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
  Title: undefined;
  CharacterSelect: undefined;
  Profile: { characterId: CharacterId };
  GameSimple: { characterId: CharacterId };
  ResultSimple: {
    characterId: CharacterId;
    finishReason: 'complete' | 'creep_explosion';
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
