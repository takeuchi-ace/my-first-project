import {
  Gauge,
  INITIAL_GAUGE,
  GameState,
  GameEvent,
  Choice,
  GameResult,
  CharacterId,
  CharacterSpecificEvent,
  CharEventSlot,
  Tag,
  PlayType,
  Phase,
  LunchMood,
  EntertainGrade,
  ReactionRank,
  BonusBeat,
  HoleResult,
  MorningShotResult,
  StrategyId,
  RoundMoodId,
  OwnPlayStance,
  OwnShotResult,
  PuttResult,
} from '../types';
import { events } from '../data/events';
import { extremeEvents } from '../data/extremeEvents';
import { frontEvents as curatedFront, backEvents as curatedBack } from '../data/curatedEvents';
import { characterSpecificEvents } from '../data/characterEvents';
import { characterLunchEvents } from '../data/lunchEvents';
import { goodBackEvents } from '../data/goodBackEvents';
import { tensionBackEvents } from '../data/tensionBackEvents';
import { comebackEvents, COMEBACK_HOLE, COMEBACK_TRUST_MAX } from '../data/comebackEvents';
import { femaleEvents } from '../data/femaleEvents';
import { characters } from '../data/characters';
import { getMorningShotEvent, pickMorningShotVariant, rollMorningShotResult } from '../data/morningShotEvents';
import { SlopeType } from '../types';
import { getPuttSlopeVariant, getPuttingProfile, buildPuttingGameEvent } from '../data/puttingEvent';
import { localizeEvent, getCallName } from '../lib/characterText';
import { isOnStrategy, strategyMultiplier, strategyCreep } from '../data/strategies';
import {
  getRoundMood,
  MOOD_LIKE_TRUST,
  MOOD_HATE_TRUST,
  MOOD_HATE_CREEP,
} from '../data/roundMoods';

/** 女性キャラ専用イベントの出現確率 */
const FEMALE_EVENT_RATE = 0.3;

/**
 * curatedEvents に rank別セリフ付きの上位互換があるため、抽選から外す旧版。
 * データは残してあるので、差し替えたい場合はこの配列から外せば復活する。
 */
const SUPERSEDED_EVENT_IDS = new Set([
  'first_tee_tension', // → c_first_tee
  'praise_shot',       // → c_praise_shot
  'parking_greeting',  // → c_parking_greeting
]);

// ===== All common events (original + extreme + curated — goodBack/tensionBack は別管理) =====
const allCommonEvents: GameEvent[] = [
  ...events,
  ...extremeEvents,
  ...curatedFront,
  ...curatedBack,
].filter((e) => !SUPERSEDED_EVENT_IDS.has(e.id));

/** ボーナスビートが消費する stage（stage 1/5/9 は固定ビートに埋まっていて通常抽選では出ない） */
const BEAT_STAGE: Record<BonusBeat, number> = {
  pre: 1,
  lunchTalk: 5,
  closing: 9,
  // 挽回は専用プール（comebackEvents）から引くので共通プールの stage は使わない
  comeback: 8,
};

/**
 * 抽選で1つだけ発生する追加ビート。
 * 締め（closing）はここに入れない — ラウンドの決着をつける場なので毎回必ず発生させる。
 * 抽選にしていた頃は 2/3 のラウンドが締めの無いまま終わっていた。
 */
const BONUS_BEATS: BonusBeat[] = ['pre', 'lunchTalk'];

/** 指定 stage の未使用イベントプール */
const stagePool = (state: GameState, stage: number): GameEvent[] =>
  filterCheatPhysical(
    allCommonEvents.filter((e) => e.stage === stage && !state.usedEventIds.includes(e.id)),
    state.cheatPhysicalCount,
  );

/**
 * 好調時／不調時の後半プールから1件引く。
 * 各イベントの stage は書かれた進行順を表すので、同ホールのものを優先する
 * （同ホール分が尽きていればプール全体から引くので、死蔵は発生しない）。
 */
const pickFromMoodPool = (state: GameState, pool: GameEvent[]): GameEvent | null => {
  const available = filterCheatPhysical(
    pool.filter((e) => !state.usedEventIds.includes(e.id)),
    state.cheatPhysicalCount,
  );
  if (available.length === 0) return null;
  const stageMatch = available.filter((e) => e.stage === state.currentHole);
  const from = stageMatch.length > 0 ? stageMatch : available;
  return from[Math.floor(Math.random() * from.length)];
};

/** ボーナスビートが今このタイミングで発生できるか（stage プールが空なら発生しない） */
const canFireBeat = (state: GameState, beat: BonusBeat): boolean => {
  if (stagePool(state, BEAT_STAGE[beat]).length === 0) return false;
  // 締めは抽選を通さず毎ラウンド発生する
  if (beat === 'closing') return !state.closingDone;
  return state.bonusBeat === beat && !state.bonusBeatDone;
};

const drawBeatEvent = (state: GameState, beat: BonusBeat): GameEvent | null => {
  const pool = stagePool(state, BEAT_STAGE[beat]);
  if (pool.length === 0) return null;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { ...picked, beat };
};

// ===== Convert CharacterSpecificEvent → GameEvent =====
const toGameEvent = (evt: CharacterSpecificEvent): GameEvent => ({
  id: evt.id,
  title: evt.title,
  description: evt.situation,
  stage: 0,
  choices: evt.choices.map((c) => ({
    text: c.text,
    delta: c.delta,
    tags: c.tags,
    speechOverride: c.speechOverride,
  })),
});

// ===== Phase helper =====
export const getPhase = (hole: number): Phase => {
  if (hole <= 4) return 'front';
  if (hole === 5) return 'lunch';
  return 'back';
};

// ===== LunchMood helper =====
const calcLunchMood = (lunchImpactScore: number): LunchMood => {
  if (lunchImpactScore >= 12) return 'good';
  if (lunchImpactScore <= -10) return 'bad';
  return 'neutral';
};

// ===== Clamp =====
const clamp = (v: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, v));

const clampGauge = (g: Gauge): Gauge => ({
  fun: clamp(g.fun),
  trust: clamp(g.trust),
  creep: clamp(g.creep),
  focus: clamp(g.focus),
});

// =====================================================================
// タグ反応の減衰
//
// 同じタグを1ラウンド内で繰り返すと、そのタグに対する相手の「喜び」が鈍る。
// 相手の好みを掴んだあと同じ手を押し続けるのが最適解になってしまうのを防ぐ。
//
// 減衰するのは reactions と likesTags（＝相手が嬉しがる分）だけ。
//  - choice.delta（行為そのものの効果）は減衰しない
//  - hatesTags の罰も減衰しない。嫌なことを繰り返されて慣れる相手はいない
//
// tagHistory は createInitialState で空に戻るのでラウンド単位で効く。
// =====================================================================
const TAG_DECAY = [1, 0.7, 0.45, 0.25];

const tagDecayRate = (tagHistory: Tag[], tag: Tag): number => {
  const used = tagHistory.filter((t) => t === tag).length;
  return TAG_DECAY[Math.min(used, TAG_DECAY.length - 1)];
};

const scaleDelta = (delta: Partial<Gauge>, rate: number): Partial<Gauge> => ({
  fun: delta.fun != null ? Math.round(delta.fun * rate) : undefined,
  trust: delta.trust != null ? Math.round(delta.trust * rate) : undefined,
  creep: delta.creep != null ? Math.round(delta.creep * rate) : undefined,
  focus: delta.focus != null ? Math.round(delta.focus * rate) : undefined,
});

// ===== Apply Delta =====
const applyDelta = (gauge: Gauge, delta: Partial<Gauge>): Gauge =>
  clampGauge({
    fun: gauge.fun + (delta.fun ?? 0),
    trust: gauge.trust + (delta.trust ?? 0),
    creep: gauge.creep + (delta.creep ?? 0),
    focus: gauge.focus + (delta.focus ?? 0),
  });

// ===== Apply Delta with TraitModifiers =====
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

// ===== Shuffle helper =====
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ===== Generate random character event slots =====
const generateCharEventSlots = (characterId: CharacterId): CharEventSlot[] => {
  const charEvts = characterSpecificEvents[characterId];
  if (!charEvts || charEvts.length === 0) return [];

  // 1-3 events per round
  const maxCount = Math.min(3, charEvts.length);
  const count = 1 + Math.floor(Math.random() * maxCount); // 1 to maxCount

  // Available holes: 1-9 except 1 (morning shot), 5 (lunch), 9 (final putt)
  const availableHoles = [2, 3, 4, 6, 7, 8];
  const selectedHoles = shuffle(availableHoles).slice(0, count).sort((a, b) => a - b);

  // Random event indices from pool
  const eventIndices = Array.from({ length: charEvts.length }, (_, i) => i);
  const selectedIndices = shuffle(eventIndices).slice(0, count);

  return selectedHoles.map((hole, i) => ({
    hole,
    eventIndex: selectedIndices[i],
  }));
};

// ===== Init =====
export const createInitialState = (
  characterId: CharacterId,
  strategy: StrategyId | null = null,
  roundMood: RoundMoodId | null = null
): GameState => ({
  characterId,
  gauge: { ...INITIAL_GAUGE },
  currentHole: 1,
  phase: 'front',
  usedEventIds: [],
  holeResults: [],
  cheatPhysicalCount: 0,
  finished: false,
  finishReason: null,
  tagHistory: [],
  lunchImpactScore: 0,
  lunchMood: 'neutral',
  afternoonTrustBias: 0,
  afternoonCreepBias: 0,
  afternoonFocusBias: 0,
  charEventSlots: generateCharEventSlots(characterId),
  morningShot: null,
  ownShot: null,
  morningMomentum: 0,
  puttResult: null,
  bonusBeat: BONUS_BEATS[Math.floor(Math.random() * BONUS_BEATS.length)],
  bonusBeatDone: false,
  closingDone: false,
  lastAppliedDelta: { fun: 0, trust: 0, creep: 0, focus: 0 },
  creepBySource: { cheat: 0, close: 0, distant: 0 },
  coldStreak: 0,
  strategy,
  onStrategyCount: 0,
  roundMood,
  comebackDone: false,
});

// ===== cheat_physical フィルタ =====
const filterCheatPhysical = (
  evts: GameEvent[],
  cheatCount: number
): GameEvent[] =>
  evts
    .map((evt) => ({
      ...evt,
      choices: evt.choices.filter((c) => {
        if (c.tags.includes('cheat_physical') && cheatCount >= 2) return false;
        return true;
      }),
    }))
    .filter((evt) => evt.choices.length > 0);

// ===== Build FinalPutt GameEvent =====
const buildPuttingEvent = (characterId: CharacterId): GameEvent => {
  const slopes: SlopeType[] = ['left', 'right', 'flat', 'uphill'];
  const slope = slopes[Math.floor(Math.random() * slopes.length)];
  const profile = getPuttingProfile(characterId);
  const adviceIsCorrect = Math.random() < profile.adviceAccuracy;
  return buildPuttingGameEvent(slope, adviceIsCorrect, characterId);
};

// ===== Build MorningShot GameEvent from a variant =====
const buildMorningShotEvent = (characterId: CharacterId): GameEvent => {
  const result = rollMorningShotResult();
  const event = getMorningShotEvent(characterId);
  const variant = event.variants.find((v) => v.shotResult === result) ?? event.variants[1];

  return {
    id: `morning_shot_${result}`,
    title: '朝イチのショット',
    description: variant.situation,
    stage: 1,
    choices: variant.choices.map((c) => ({
      text: c.text,
      delta: c.delta,
      tags: c.tags,
    })),
  };
};

// ===== Event Selection =====
// charEventSlots でランダム配置 (1-3個) ＋ lunch固定 (hole 5)
// backフェーズ: lunchMood に応じて goodBack / tensionBack を60%優先
/**
 * イベント本体の抽選。テキストは共通表記（「○○さん」「相手」）のまま返す。
 * 表示用の名前差し込みは selectEvent 側で行う。
 */
const pickEvent = (state: GameState): GameEvent | null => {
  const charEvts = characterSpecificEvents[state.characterId];

  // ── ボーナスビート「スタート前」: 朝イチのショットより前 ──
  if (state.currentHole === 1 && state.morningShot === null && canFireBeat(state, 'pre')) {
    const evt = drawBeatEvent(state, 'pre');
    if (evt) return evt;
  }

  // ── Hole 1 最優先: 朝イチのショット ──
  if (state.currentHole === 1 && state.morningShot === null) {
    return buildMorningShotEvent(state.characterId);
  }

  // ── Hole 9 最優先: 最終パット ──
  if (state.currentHole === 9 && state.puttResult === null) {
    return buildPuttingEvent(state.characterId);
  }

  // ── ボーナスビート「締め」: 最終パットの後（ラウンド後のシーン）──
  if (state.currentHole === 9 && canFireBeat(state, 'closing')) {
    const evt = drawBeatEvent(state, 'closing');
    if (evt) return evt;
  }

  // ── キャラ固有イベント: charEventSlots で決定されたホール ──
  const slot = state.charEventSlots.find((s) => s.hole === state.currentHole);
  if (slot && charEvts) {
    const evt = charEvts[slot.eventIndex];
    if (evt && !state.usedEventIds.includes(evt.id)) {
      return toGameEvent(evt);
    }
  }

  // ── Lunch固定: hole 5 ──
  if (state.currentHole === 5) {
    const lunchEvt = characterLunchEvents[state.characterId];
    if (lunchEvt) {
      return toGameEvent(lunchEvt);
    }
  }

  // ── 挽回のビート ──
  // 8番で信頼が明らかに足りないときだけ、大きく振れる一手を差し込む。
  // 負け方が「惜しい」より「大差」に3倍偏っていて、大差で負けると
  // その相手を諦めてしまう。タダの救済ではなく、読み違えれば同じだけ落ちる。
  if (
    state.currentHole === COMEBACK_HOLE &&
    state.gauge.trust < COMEBACK_TRUST_MAX &&
    !state.comebackDone
  ) {
    const pool = comebackEvents.filter((e) => !state.usedEventIds.includes(e.id));
    if (pool.length > 0) {
      return { ...pool[Math.floor(Math.random() * pool.length)], beat: 'comeback' };
    }
  }

  // ── Back mood-based selection (non-slot back holes) ──
  if (state.phase === 'back' && !slot) {
    if (state.lunchMood === 'good' && Math.random() < 0.6) {
      const evt = pickFromMoodPool(state, goodBackEvents);
      if (evt) return evt;
    }
    if (state.lunchMood === 'bad' && Math.random() < 0.6) {
      const evt = pickFromMoodPool(state, tensionBackEvents);
      if (evt) return evt;
    }
    // neutral or roll miss → fall through to common pool
  }

  // ── 女性キャラ専用イベント（30%の確率で差し込み） ──
  const character = characters.find((c) => c.id === state.characterId);
  if (character?.gender === 'female' && Math.random() < FEMALE_EVENT_RATE) {
    const pool = femaleEvents.filter(
      (e) => !state.usedEventIds.includes(e.id)
    );
    const filtered = filterCheatPhysical(pool, state.cheatPhysicalCount);
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
    // 使い切った場合は共通プールにフォールスルー
  }

  // ── 共通プール（original + extreme）から選択 ──
  const available = allCommonEvents.filter(
    (e) => !state.usedEventIds.includes(e.id)
  );
  if (available.length === 0) return null;

  const filtered = filterCheatPhysical(available, state.cheatPhysicalCount);
  if (filtered.length === 0) return available[0];

  const stageMatch = filtered.filter((e) => e.stage === state.currentHole);
  if (stageMatch.length > 0) {
    return stageMatch[Math.floor(Math.random() * stageMatch.length)];
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
};

/**
 * 選択肢の並び順が固定されているイベント。
 * 最終パットは選択肢の index が狙い（左／カップ直接／右）に対応しているため、
 * 並べ替えるとミニゲームの判定が壊れる。
 */
const ORDER_LOCKED_PREFIXES = ['putting_event_'];

/**
 * 選択肢の並び順をシャッフルする。
 *
 * 監査 D-1: 最良の選択肢が1番目に集中していた（キャラ固有イベントで98%、
 * ランチで95%）ため、本文を読まずに位置だけで正解を選べてしまっていた。
 * 表示のたびに並べ替えて、位置と評価の相関を断つ。
 *
 * イベントは selectEvent が返したオブジェクトをそのまま画面が保持し、
 * applyChoice にも同じオブジェクトを渡すので、index の対応はビート内で一貫する。
 */
const shuffleChoices = (event: GameEvent): GameEvent => {
  if (ORDER_LOCKED_PREFIXES.some((p) => event.id.startsWith(p))) return event;
  if (event.choices.length < 2) return event;
  return { ...event, choices: shuffle(event.choices) };
};

/**
 * 選択肢配列の並べ替え（D-1 対策）。
 * GameEvent 以外の形（コンペの CharacterSpecificEvent 等）でも使えるよう配列単位で公開する。
 * 呼び出し側は「イベントが切り替わったときだけ」呼ぶこと（毎レンダリングで呼ぶと並び順が踊る）。
 */
export const shuffleChoiceList = <T>(choices: T[]): T[] => shuffle(choices);

/** 抽選 → 表示用にキャラ名を差し込み、選択肢を並べ替えて返す */
export const selectEvent = (state: GameState): GameEvent | null => {
  const event = pickEvent(state);
  return event ? shuffleChoices(localizeEvent(event, state.characterId)) : null;
};

/**
 * ボーナスビート「昼食の追加会話」。
 * ランチはホール5で席選び→メニュー→キャラ別ランチイベントという独自フローを持つため、
 * ホール番号ではなく画面側から明示的に呼ぶ。発生しないラウンドでは null。
 */
export const selectLunchTalkEvent = (state: GameState): GameEvent | null => {
  if (!canFireBeat(state, 'lunchTalk')) return null;
  const evt = drawBeatEvent(state, 'lunchTalk');
  return evt ? shuffleChoices(localizeEvent(evt, state.characterId)) : null;
};

/**
 * creep が振り切れた原因。
 *
 * creep は「相手に引かれた度合い」を1本で表しているが、引かれ方には種類がある。
 * 実測では creep の24%（151選択肢分）が沈黙・距離・正論といった「冷たさ」由来で、
 * それらで終了しても「気持ち悪がられてしまった」と出るのが実態と食い違っていた。
 * ゲージは1本のまま、終了時に何をやりすぎたのかを言い分けるために使う。
 */
export type CreepCause = 'cheat' | 'tooClose' | 'tooDistant';

/**
 * creep の帰属表。プレータイプ診断の `TAG_GROUPS` とは目的が違うので別に持つ。
 *
 * TAG_GROUPS を流用すると `serious`（honest群）と `logic`（dominant群）が
 * どの判定にも当たらず「詰めすぎ」に流れ込む。この2つだけで creep 395 分＝
 * 冷たさ由来の3分の1を占めるため、正論を並べて引かれた結果が
 * 「距離を詰めすぎて引かれた」と表示されていた。
 *
 * ここでは creep 本来の意味＝「引かれ方」で切る。
 *  - cheat  : ごまかし・裏切り
 *  - distant: 冷たい・壁を作る（沈黙／距離／正論／無難）
 *  - close  : 詰めすぎ・過剰（上記以外。creep の既定の意味）
 */
const CREEP_SOURCE_TAGS: Record<'cheat' | 'distant', Tag[]> = {
  cheat: ['cheat', 'cheat_score', 'cheat_physical', 'snitch'],
  distant: [
    'silence',
    'distance',
    'serious',
    'logic',
    'neutral',
    'safe',
    'safe_play',
    'avoid_risk',
    'excuse',
    'self_suppress',
  ],
};

/**
 * その選択肢で得た creep を、どの振る舞いの分として数えるか。
 * 複数の引かれ方に跨るタグ構成なら等分する。
 * どれにも当てはまらない場合は creep 本来の意味である「詰めすぎ」に寄せる。
 */
const attributeCreep = (
  source: GameState['creepBySource'],
  tags: Tag[],
  amount: number
): GameState['creepBySource'] => {
  if (amount <= 0) return source;
  const hit: (keyof GameState['creepBySource'])[] = [];
  if (tags.some((t) => CREEP_SOURCE_TAGS.cheat.includes(t))) hit.push('cheat');
  if (tags.some((t) => CREEP_SOURCE_TAGS.distant.includes(t))) hit.push('distant');
  if (tags.some((t) => !CREEP_SOURCE_TAGS.cheat.includes(t) && !CREEP_SOURCE_TAGS.distant.includes(t))) {
    hit.push('close');
  }
  if (hit.length === 0) hit.push('close');
  const share = amount / hit.length;
  const next = { ...source };
  for (const k of hit) next[k] += share;
  return next;
};

/**
 * 冷たさの連続。壁は1回では立たない。
 *
 * 1選択あたりの creep が小さいため、冷たい選択だけで通しても creep は 49〜67 で止まり、
 * 「壁を作られたまま終わってしまった」が実質発生しない状態だった。
 * 一方で1回ごとの creep を上げると、慎重に距離を取る1手まで罰することになる。
 *
 * そこで罰を連続に乗せる。距離を取り続けるほど加速して creep が積む。
 * 好みへのボーナスが繰り返しで鈍る（tagDecayRate）のと対になる形。
 * index = 連続回数。3回目から効き始め、6回目以降で頭打ち。
 */
const COLD_WALL_CREEP = [0, 0, 0, 3, 5, 7, 9];

const coldWallCreep = (streak: number): number =>
  COLD_WALL_CREEP[Math.min(Math.max(streak, 0), COLD_WALL_CREEP.length - 1)];

/**
 * この選択が「壁を作る側」に数えられるか。
 * そのキャラが好むタグ（黒田の `serious` など）は壁にならない。
 * 相手が望む距離感を守っているだけなので、連続は途切れる。
 */
const buildsColdWall = (tags: Tag[], characterId: CharacterId): boolean => {
  const character = characters.find((c) => c.id === characterId);
  return tags.some(
    (t) =>
      CREEP_SOURCE_TAGS.distant.includes(t) &&
      !(character?.likesTags.includes(t) ?? false)
  );
};

/** creep が振り切れた原因を、実際の寄与量から判定する */
export const diagnoseCreepCause = (state: GameState): CreepCause => {
  const { cheat, close, distant } = state.creepBySource;
  if (cheat >= close && cheat >= distant && cheat > 0) return 'cheat';
  return distant > close ? 'tooDistant' : 'tooClose';
};

/**
 * 集中力がミニゲームの判定窓の広さを決める。
 *
 * focus は会話の選択肢で上下するのに、これまで勝敗にも自分のプレーにも影響していなかった
 * （entertainScore も contractSuccess も trust/fun/creep しか見ない）。
 * 「相手に合わせすぎて自分のゴルフが疎かになる」という接待ゴルフの葛藤を、
 * 朝イチのショットと最終パットの成功しやすさに落とす。
 *
 * focus 50 を基準（等倍）とし、0 で 0.6倍、100 で 1.4倍。
 */
export const focusWindowScale = (focus: number): number =>
  0.6 + (clamp(focus) / 100) * 0.8;

/**
 * 信頼がどれだけ大きく動くかの、進行による重み。
 *
 * 元は全ビート一律だったため、**技能0.6のプレイヤーでも前半5ビート終了時に
 * 契約ライン（信頼70）へ到達し、後半5ホールが消化試合になっていた**。
 * 実測で「前半で結果が確定するラウンド」は 76%。
 *
 * 序盤は様子見で信頼が動きにくく、終盤ほど大きく動く形にすると、
 * 9ホール回る意味が終盤に生まれる。実測で 76% → 59% まで下がった。
 *
 * 昼（stage 5）は既存の 1.5 倍がかかるので、ここでは等倍のまま触らない。
 */
const trustPhaseWeight = (state: GameState, event: GameEvent): number => {
  if (event.beat === 'closing') return 2.0;
  if (state.currentHole <= 4) return 0.45;
  if (state.currentHole >= 6) return 1.4;
  return 1;
};

/**
 * 1ビート分の記録を作る。
 *
 * 反応ランクをここで確定させておくことで、結果画面が
 * 「どの手が刺さって、どの手が外したか」を再計算なしに復元できる。
 */
const makeHoleResult = (
  state: GameState,
  event: GameEvent,
  choiceIndex: number,
  focusSnapshot: number,
  appliedDelta: Gauge
): HoleResult => ({
  hole: state.currentHole,
  eventId: event.id,
  choiceIndex,
  focusSnapshot,
  rank: evaluateReactionRank(appliedDelta),
  trustDelta: appliedDelta.trust,
  choiceText: event.choices[choiceIndex]?.text ?? '',
  tags: event.choices[choiceIndex]?.tags ?? [],
});

/**
 * ミニゲーム（朝イチの自分のショット・最終パット）の結果をゲージに反映する。
 *
 * これまで画面側で直接 clamp して足していたため、キャラの traitModifiers が効かず
 * 「誰が相手でもパットインは trust +5」になっていた。選択肢と同じ補正を通す。
 *
 * trustDrift はここでは引かない。ミニゲームは同じビートの一部であり、
 * ホール分の目減りは applyChoice 側ですでに引かれているため。
 */
export const applyMinigameResult = (
  state: GameState,
  delta: Partial<Gauge>
): GameState => ({
  ...state,
  gauge: applyDeltaWithModifiers(state.gauge, delta, state.characterId),
});

// ===== Check cheat_physical availability for a choice =====
export const isChoiceAllowed = (state: GameState, choice: Choice): boolean => {
  if (choice.tags.includes('cheat_physical') && state.cheatPhysicalCount >= 2) {
    return false;
  }
  return true;
};

// ===== Likes / Hates bonus =====
const applyLikesHates = (
  gauge: Gauge,
  tags: Tag[],
  characterId: CharacterId,
  tagHistory: Tag[],
  roundMoodId: RoundMoodId | null
): Gauge => {
  const character = characters.find((c) => c.id === characterId);
  if (!character) return gauge;

  // その日の機嫌。キャラの好みを上書きせず、上から重ねるだけ。
  // 上書きにすると周回で溜めた「分かったこと」がその日だけ嘘になる。
  const mood = getRoundMood(roundMoodId);

  let g = gauge;
  for (const tag of tags) {
    if (character.likesTags.includes(tag)) {
      // 好みへのボーナスは繰り返すほど鈍る
      g = applyDelta(g, scaleDelta({ trust: 2, fun: 2 }, tagDecayRate(tagHistory, tag)));
    }
    if (character.hatesTags.includes(tag)) {
      // 嫌がることの罰は減衰させない
      g = applyDelta(g, { creep: 6, trust: -4 });
    }
    if (mood?.likes.includes(tag)) {
      g = applyDelta(g, scaleDelta({ trust: MOOD_LIKE_TRUST }, tagDecayRate(tagHistory, tag)));
    }
    if (mood?.hates.includes(tag)) {
      g = applyDelta(g, { trust: MOOD_HATE_TRUST, creep: MOOD_HATE_CREEP });
    }
  }
  return g;
};

// ===== Apply Choice =====
export const applyChoice = (
  state: GameState,
  event: GameEvent,
  choiceIndex: number
): GameState => {
  const choice = event.choices[choiceIndex];

  // ── 朝イチのショット: morningShot & morningMomentum を記録 ──
  let newMorningShot = state.morningShot;
  let newMorningMomentum = state.morningMomentum;
  if (event.id.startsWith('morning_shot_')) {
    const shotResult = event.id.replace('morning_shot_', '') as import('../types').MorningShotResult;
    newMorningShot = shotResult;
    const trustDelta = choice.delta.trust ?? 0;
    const creepDelta = choice.delta.creep ?? 0;
    newMorningMomentum = Math.min(10, Math.max(-10, trustDelta - creepDelta));
  }

  // 0. Lunch 1.5x multiplier on base delta
  let baseDelta: Partial<Gauge> = { ...choice.delta };
  if (state.phase === 'lunch') {
    baseDelta = {
      fun: baseDelta.fun != null ? Math.round(baseDelta.fun * 1.5) : undefined,
      trust: baseDelta.trust != null ? Math.round(baseDelta.trust * 1.5) : undefined,
      focus: baseDelta.focus != null ? Math.round(baseDelta.focus * 1.5) : undefined,
      creep: baseDelta.creep != null ? Math.round(baseDelta.creep * 1.5) : undefined,
    };
  }

  // 0.5. Back phase: add afternoon bias from lunch mini game
  if (state.phase === 'back') {
    baseDelta = {
      ...baseDelta,
      trust: (baseDelta.trust ?? 0) + state.afternoonTrustBias,
      creep: (baseDelta.creep ?? 0) + state.afternoonCreepBias,
      focus: (baseDelta.focus ?? 0) + state.afternoonFocusBias,
    };
  }

  // 0.6. Front phase Hole 2〜4: morningMomentum マイクロバイアス
  if (
    state.phase === 'front' &&
    state.currentHole >= 2 &&
    state.currentHole <= 4 &&
    newMorningMomentum !== 0
  ) {
    const bias = newMorningMomentum > 0 ? 1 : -1;
    baseDelta = {
      ...baseDelta,
      trust: (baseDelta.trust ?? 0) + bias,
      creep: (baseDelta.creep ?? 0) + (newMorningMomentum < 0 ? 1 : 0),
    };
  }

  // 0.5. 宣言した作戦（今日の作戦）
  //      宣言した路線に沿った手にだけ係数が乗る。外した作戦を引いたときに
  //      「路線を捨てて上振れを失う」か「罰を飲んで押し通す」かの判断が生まれる。
  const onStrategy = isOnStrategy(state.strategy, choice.tags);
  const stratMult = strategyMultiplier(state.strategy, state.characterId, choice.tags);
  const stratCreep = strategyCreep(state.strategy, state.characterId, choice.tags);

  // 1. Apply base delta with traitModifiers（昼の増幅と進行の重みを乗せた後）
  //    進行が進むほど信頼が大きく動く。序盤は様子見、終盤に本音が出るという理屈で、
  //    かつ「前半で契約ラインに届いて後半が消化試合になる」構造を崩すため。
  // 作戦の係数は信頼が**伸びる**ときだけ掛ける。
  // 負の分にも掛けると、裏目の作戦（0.45倍）を宣言したときに
  // 路線に乗った悪手のダメージまで半分以下になり、
  // 「外した作戦を宣言すると失点しにくくなる」という逆の効果が出る。
  // 路線に乗る選択肢の 8%（587件中45件）が信頼マイナスなので実際に起きる。
  const phaseWeighted: Partial<Gauge> = {
    ...baseDelta,
    trust:
      baseDelta.trust != null
        ? Math.round(
            baseDelta.trust *
              trustPhaseWeight(state, event) *
              (baseDelta.trust > 0 ? stratMult : 1)
          )
        : undefined,
    creep: (baseDelta.creep ?? 0) + stratCreep,
  };
  let newGauge = applyDeltaWithModifiers(
    state.gauge,
    phaseWeighted,
    state.characterId
  );

  // 2. Apply character reactions（同じタグの繰り返しで鈍らせる）
  const character = characters.find((c) => c.id === state.characterId);
  if (character) {
    for (const tag of choice.tags) {
      const reaction = character.reactions.find((r) => r.tag === tag);
      if (reaction) {
        const rate = tagDecayRate(state.tagHistory, tag);
        // 正の反応（喜び）だけ鈍る。負の反応（不快）はそのまま効かせる
        const isPositive = (reaction.delta.trust ?? 0) > 0 || (reaction.delta.fun ?? 0) > 0;
        newGauge = applyDelta(newGauge, isPositive ? scaleDelta(reaction.delta, rate) : reaction.delta);
      }
    }
  }

  // 3. Apply likes/hates bonuses
  newGauge = applyLikesHates(
    newGauge,
    choice.tags,
    state.characterId,
    state.tagHistory,
    state.roundMood
  );

  // 3.5. 冷たさの連続 — 距離を取り続けると加速して creep が積む
  const newColdStreak = buildsColdWall(choice.tags, state.characterId)
    ? state.coldStreak + 1
    : 0;
  const wallCreep = coldWallCreep(newColdStreak);
  if (wallCreep > 0) {
    newGauge = clampGauge({ ...newGauge, creep: newGauge.creep + wallCreep });
  }

  // 4. Track tags and cheat count
  const newTagHistory = [...state.tagHistory, ...choice.tags];
  let newCheatCount = state.cheatPhysicalCount;
  if (choice.tags.includes('cheat_physical' as Tag)) {
    newCheatCount++;
  }

  // 5. Track lunchImpactScore (raw choice delta, before 1.5x)
  let newLunchImpactScore = state.lunchImpactScore;
  if (state.phase === 'lunch') {
    newLunchImpactScore += (choice.delta.trust ?? 0) - (choice.delta.creep ?? 0);
  }

  // 6. Compute lunchMood after lunch phase
  let newLunchMood = state.lunchMood;
  if (state.phase === 'lunch') {
    newLunchMood = calcLunchMood(newLunchImpactScore);
  }

  /** 選択への反応そのもの（trustDrift による目減りを含まない） */
  const reactionDelta = (g: Gauge): Gauge => ({
    fun: g.fun - state.gauge.fun,
    trust: g.trust - state.gauge.trust,
    creep: g.creep - state.gauge.creep,
    focus: g.focus - state.gauge.focus,
  });

  // 7. Creep explosion check
  if (newGauge.creep >= 100) {
    const finalDelta = reactionDelta(newGauge);
    return {
      ...state,
      gauge: newGauge,
      lastAppliedDelta: finalDelta,
      creepBySource: attributeCreep(state.creepBySource, choice.tags, finalDelta.creep),
      coldStreak: newColdStreak,
      onStrategyCount: state.onStrategyCount + (onStrategy ? 1 : 0),
      comebackDone: state.comebackDone || event.id.startsWith('cb_'),
      phase: state.phase,
      cheatPhysicalCount: newCheatCount,
      usedEventIds: [...state.usedEventIds, event.id],
      holeResults: [
        ...state.holeResults,
        makeHoleResult(state, event, choiceIndex, newGauge.focus, finalDelta),
      ],
      tagHistory: newTagHistory,
      lunchImpactScore: newLunchImpactScore,
      lunchMood: newLunchMood,
      morningShot: newMorningShot,
      morningMomentum: newMorningMomentum,
      finished: true,
      finishReason: 'creep_explosion',
    };
  }

  // 8. Creep penalty tiers
  //
  // 段階のしきい値は 70/90 から 40/55 に下げてある。
  // 誘惑（信頼は大きく伸びるが距離も詰まる選択肢）を足す前は、
  // creep を完全に無視して打っても中央値19・上位10%でも45にしか届かず、
  // 70 の段まで上がる経路が実質なかった。
  if (newGauge.creep >= 55) {
    newGauge = clampGauge({
      ...newGauge,
      trust: newGauge.trust - 2,
      focus: newGauge.focus - 2,
    });
  } else if (newGauge.creep >= 40) {
    newGauge = clampGauge({
      ...newGauge,
      trust: newGauge.trust - 1,
    });
  }

  // 9. trust の自然減（キャラごとの難易度）
  //    良い選択で積んだ信頼が1ビートごとに剥がれるので、ラウンド全体で稼ぎ続ける必要がある。
  //    反応ランクの判定には影響させないため、目減り前の差分を lastAppliedDelta に残す。
  const appliedDelta = reactionDelta(newGauge);
  // creep をどの振る舞いで稼いだかを積算しておく（終了時の文面の出し分けに使う）
  const newCreepBySource = attributeCreep(state.creepBySource, choice.tags, appliedDelta.creep);
  const drift = character?.trustDrift ?? 3;
  if (drift !== 0) {
    newGauge = clampGauge({ ...newGauge, trust: newGauge.trust - drift });
  }

  // ── ボーナスビートはホールを消費しない ──
  if (event.beat) {
    return {
      ...state,
      gauge: newGauge,
      lastAppliedDelta: appliedDelta,
      creepBySource: newCreepBySource,
      coldStreak: newColdStreak,
      onStrategyCount: state.onStrategyCount + (onStrategy ? 1 : 0),
      comebackDone: state.comebackDone || event.id.startsWith('cb_'),
      cheatPhysicalCount: newCheatCount,
      usedEventIds: [...state.usedEventIds, event.id],
      holeResults: [
        ...state.holeResults,
        makeHoleResult(state, event, choiceIndex, newGauge.focus, appliedDelta),
      ],
      tagHistory: newTagHistory,
      lunchImpactScore: newLunchImpactScore,
      lunchMood: newLunchMood,
      morningShot: newMorningShot,
      morningMomentum: newMorningMomentum,
      bonusBeatDone:
        event.beat === 'closing' || event.beat === 'comeback'
          ? state.bonusBeatDone
          : true,
      closingDone: event.beat === 'closing' ? true : state.closingDone,
      // 「締め」はラウンド最後のビートなので、ここで終了する
      finished: event.beat === 'closing',
      finishReason: event.beat === 'closing' ? 'complete' : null,
    };
  }

  const newHole = state.currentHole + 1;
  const isComplete = newHole > 9;
  // 「締め」ビートが控えているなら、ホール9で止めて締めを1ビート挟んでから終了する
  const holdForClosing = isComplete && canFireBeat(state, 'closing');

  return {
    ...state,
    gauge: newGauge,
    lastAppliedDelta: appliedDelta,
    creepBySource: newCreepBySource,
    coldStreak: newColdStreak,
    onStrategyCount: state.onStrategyCount + (onStrategy ? 1 : 0),
    comebackDone: state.comebackDone || event.id.startsWith('cb_'),
    currentHole: isComplete ? 9 : newHole,
    phase: isComplete ? state.phase : getPhase(newHole),
    cheatPhysicalCount: newCheatCount,
    usedEventIds: [...state.usedEventIds, event.id],
    holeResults: [
      ...state.holeResults,
      makeHoleResult(state, event, choiceIndex, newGauge.focus, appliedDelta),
    ],
    tagHistory: newTagHistory,
    lunchImpactScore: newLunchImpactScore,
    lunchMood: newLunchMood,
    morningShot: newMorningShot,
    morningMomentum: newMorningMomentum,
    finished: isComplete && !holdForClosing,
    finishReason: isComplete && !holdForClosing ? 'complete' : null,
  };
};

// =====================================================================
// ACE Ball — 悪い選択肢判定

// =====================================================================
// ReactionRank — trust主軸ランク判定
// =====================================================================

export const evaluateReactionRank = (appliedDelta: Gauge): ReactionRank => {
  // 即worst条件（強い違和感）
  if (appliedDelta.creep >= 12) return 'worst';

  // ① trustベース判定
  let baseRank: ReactionRank;
  if (appliedDelta.trust >= 8) baseRank = 'good';
  else if (appliedDelta.trust >= 3) baseRank = 'neutral';
  else if (appliedDelta.trust >= -2) baseRank = 'bad';
  else baseRank = 'worst';

  // ② 微補正用impactScore
  const impactScore =
    appliedDelta.trust -
    appliedDelta.creep +
    appliedDelta.focus * 0.4 +
    appliedDelta.fun * 0.2;

  // ③ 上方向補正（1段階のみ）
  if (impactScore >= 10) {
    if (baseRank === 'neutral') baseRank = 'good';
    else if (baseRank === 'bad') baseRank = 'neutral';
  }

  // ④ 下方向補正（1段階のみ）
  if (impactScore <= -6) {
    if (baseRank === 'good') baseRank = 'neutral';
    else if (baseRank === 'neutral') baseRank = 'bad';
    else if (baseRank === 'bad') baseRank = 'worst';
  }

  return baseRank;
};

// =====================================================================
// Scoring — 相手スコア算出
//
// 相手のスコアは「その日の平均からどれだけ動いたか」で表す。
// 基準はプロフィールに出ている `avgScore18` そのもの。
//
// 以前は「無難な選択をし続けたら」という反実仮想を基準にしていたが、
//  - 何と比べているのかプレイヤーから見えない
//  - 自然減を入れないと自然減の大きい相手ほど不利になり、入れると基準が弱くなりすぎて
//    条件そのものが死ぬ（実測 0.1%）
// という二択に陥っていた。相手の平均を基準にすれば、比較対象が画面に出ている数字になる。
//
// 動かす要素は2つ。
//  - ミニゲーム（主）: 朝イチの受け答え・自分のショット・最終パット
//  - ゲージ（従）: 場の空気
//
// ミニゲームを主にしているのは、契約条件を信頼とは**別の軸**にするため。
// ゲージから作った値はどう捻っても信頼の読み替えにしかならず、
// 条件を増やしても「信頼が足りたか」を二度聞いているだけになる。
// =====================================================================

/**
 * ミニゲームが相手のスコアに与える影響（18H・マイナスが改善）。
 *
 * ゲージを経由しない唯一の入力なので、ここが「気持ちよく打たせたか」の軸になる。
 *
 * 朝イチの受け答え（`morningMomentum`）は入れない。あれは選んだ選択肢の
 * 信頼と creep から作られる値なので、混ぜるとスコア条件がまた
 * 信頼の写しに戻ってしまう。実測でもスコアで落ちる率が 1.9% までしぼんだ。
 * 腕そのものである自分のショットと最終パットだけを見る。
 *
 * 重みは実測で決めた（選択の腕0.8固定・信頼と距離を満たしたラウンドのうち
 * スコアで落ちる割合／ミニゲームの腕0.2・0.5・0.8）:
 *
 * | 重み | 下手 | 普通 | 上手 |
 * |---|---|---|---|
 * | momentum込み 3/1/2・4/1/3 | 1.9% | 0.7% | 0.5% |
 * | **4/1/3・6/1/5** | **22.2%** | **7.0%** | **1.6%** |
 * | 5/1/4・7/1/6 | 35.2% | 12.0% | 1.1% |
 * | 5/2/5・8/2/7 | 38.6% | 16.4% | 4.2% |
 *
 * 5/1/4 以上にすると、パットを外す人の契約率が 25pt 落ちて罰が重すぎる。
 *
 * ## 半分に落とした（4/1/3・6/1/5 → 2/1/2・3/1/3）
 *
 * 自分が打っただけで相手の18Hが最大10打縮むのは動きすぎだった。
 * 主な結果は接待ポイント側（`logic/ownPlay.ts` の相手ごとの反応）に移し、
 * ここは「場のリズム」ぶんの薄い効きだけ残す。
 * ただし 0 にはしない。契約条件の `improvement > 0` が
 * ゲージだけで決まる形に戻ると、スコア条件が実質死ぬ（実測 0.1%）。
 *
 * 半分にした後の実測（信頼と距離を満たしたラウンドのうちスコアだけで落ちる割合。
 * 選択の腕0.8固定）: ミニゲームの腕 0.2 で 8.8% / 0.5 で 3.4% / 0.8 で 1.0%。
 * 以前は 22.2 / 7.0 / 1.6 だった。薄くなったが死んではいない。
 */
/**
 * 場のリズムの効き方。**相手の構え方で向きが変わる。**
 *
 * 同じ値を全員に当てていたため、「外したほうが機嫌が良くなる相手」でも
 * ミスのスコア罰（+5）が `improvement > 0` を割り、**契約率が0%**になっていた。
 * 接待ポイントは上がるのに契約は絶対に取れない、という噛み合わない状態だった。
 *
 * 相手が気分よく回れば相手のスコアも伸びる、と考えれば向きは接待ポイントと揃う。
 *  - `respects`    … 決めれば伸び、外せば崩れる
 *  - `indifferent` … 薄く効くだけ
 *  - `prefersLead` … **逆向き**。こちらが外すほど相手は気分よく回る
 */
const MINIGAME_SCORE: Record<
  OwnPlayStance,
  { shot: Record<OwnShotResult, number>; putt: Record<PuttResult, number> }
> = {
  respects: {
    shot: { perfect: -2, good: -1, miss: +2 },
    putt: { in: -3, lip_out: -1, miss: +3 },
  },
  indifferent: {
    shot: { perfect: -1, good: -1, miss: +1 },
    putt: { in: -2, lip_out: -1, miss: +2 },
  },
  prefersLead: {
    shot: { perfect: +1, good: 0, miss: -2 },
    putt: { in: +2, lip_out: 0, miss: -3 },
  },
};

export const minigameScoreEffect = (state: GameState): number => {
  const stance =
    characters.find((c) => c.id === state.characterId)?.ownPlayStance ??
    'respects';
  const table = MINIGAME_SCORE[stance];
  let e = 0;
  if (state.ownShot) e += table.shot[state.ownShot];
  if (state.puttResult) e += table.putt[state.puttResult];
  return e;
};

/**
 * 場の空気がスコアに与える影響（18H・マイナスが改善）。
 *
 * 係数はミニゲームより小さくしてある。ここを大きくすると
 * スコア条件が信頼条件の写しになってしまう。
 */
const gaugeScoreEffect = (gauge: Gauge): number => {
  const quality = gauge.trust * 0.5 + gauge.fun * 0.3 + (100 - gauge.creep) * 0.2;
  const diff = quality - 50;
  // 非対称: 良くなる方向はやや強め、悪くなる方向は弱め
  return diff >= 0 ? -Math.round(diff / 9) : Math.round(-diff / 14);
};


// =====================================================================
// Entertain Score
// =====================================================================

const calcEntertainScore = (gauge: Gauge): number =>
  Math.round(gauge.trust * 0.5 + gauge.fun * 0.3 + (100 - gauge.creep) * 0.2);

// =====================================================================
// Grade — 接待グレード判定
// =====================================================================

const calcGrade = (entertainScore: number): EntertainGrade => {
  if (entertainScore >= 85) return 'S';
  if (entertainScore >= 70) return 'A';
  if (entertainScore >= 55) return 'B';
  if (entertainScore >= 40) return 'C';
  return 'D';
};

// =====================================================================
// Play Type Diagnosis
// =====================================================================

const TAG_GROUPS: Record<Exclude<PlayType, 'balanced'>, Tag[]> = {
  honest: ['honesty', 'etiquette', 'ethics', 'sportsmanship', 'serious', 'focus', 'self_reflect', 'fair_compete', 'analysis_praise'],
  entertainer: ['humor', 'hype', 'alcohol', 'kiai', 'ride_the_mood'],
  distance: ['safe', 'distance', 'silence', 'neutral', 'safe_play', 'avoid_risk'],
  risky: ['cheat_physical', 'cheat_score', 'cheat', 'risk', 'extreme'],
  dominant: ['bold', 'boss', 'logic', 'pressure', 'challenge', 'bro', 'team', 'back_up'],
  creepy: ['over_support', 'flattery', 'over_praise', 'snitch'],
};

const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  honest: '正統派・誠実型',
  entertainer: '盛り上げ番長型',
  distance: '距離感プロ型',
  risky: '危ない橋型',
  dominant: '空気支配型',
  creepy: '無意識クリープ型',
  balanced: '八方美人型',
};

const PLAY_TYPE_COMMENTS: Record<PlayType, string> = {
  honest: '誠実さが最大の武器。信頼される接待の王道スタイル。',
  entertainer: '場を盛り上げる天才。楽しさで契約を掴む。',
  distance: '絶妙な距離感でストレスを与えない。大人の接待。',
  risky: 'ギリギリを攻める危険な接待師。ハイリスク・ハイリターン。',
  dominant: '場の空気を支配する。論理と大胆さで相手を引き込む。',
  creepy: '気遣いが裏目に…やりすぎ注意のお節介タイプ。',
  balanced: 'どのスタイルもバランスよく使いこなす万能タイプ。',
};

const diagnosePlayType = (
  tagHistory: Tag[]
): { playType: PlayType; playTypeLabel: string; playTypeComment: string } => {
  const counts: Record<string, number> = {};
  const groupKeys = Object.keys(TAG_GROUPS) as Exclude<PlayType, 'balanced'>[];

  for (const key of groupKeys) {
    counts[key] = 0;
  }

  for (const tag of tagHistory) {
    for (const key of groupKeys) {
      if (TAG_GROUPS[key].includes(tag)) {
        counts[key]++;
      }
    }
  }

  let maxKey: PlayType = 'balanced';
  let maxCount = 0;
  let secondMax = 0;

  for (const key of groupKeys) {
    if (counts[key] > maxCount) {
      secondMax = maxCount;
      maxCount = counts[key];
      maxKey = key;
    } else if (counts[key] > secondMax) {
      secondMax = counts[key];
    }
  }

  if (maxCount === 0 || maxCount - secondMax < 2) {
    maxKey = 'balanced';
  }

  return {
    playType: maxKey,
    playTypeLabel: PLAY_TYPE_LABELS[maxKey],
    playTypeComment: PLAY_TYPE_COMMENTS[maxKey],
  };
};

// =====================================================================
// calcResult — 契約判定込み（昼係数 + difficultyModifier 反映）
// =====================================================================

/**
 * 【符号定義（絶対に逆転させないこと）】
 *   improvement = baseline18 - opponentGross18
 *     > 0  ⇒ 良くなった（接待成功）
 *     < 0  ⇒ 悪くなった（接待失敗）
 *
 * 【lunchMood 補正（フラット加算）】
 *   bad  → 相手スコア +3（18H）不調で悪化
 *   good → 相手スコア -2（18H）好調で改善
 *
 * 【契約成功条件】
 *   adjustedTrust >= 84 && creep <= creepThreshold && improvement > 0
 *
 * 【昼係数】
 *   lunchImpactScore >= 8  → trust +5（昼ボーナス）
 *   lunchImpactScore <= -8 → trust -5（昼事故）
 */
/**
 * 契約に必要な信頼の下限。
 *
 * 70 だったものを 84 に上げている。スコア条件の作り直しで
 * 「スコアが伸びなかった」だけで落ちるラウンドが 19〜34% → ごく僅かに減り、
 * そのぶん契約率が跳ね上がったため。
 *
 * 実測（技能 1.0/0.8/0.6/0.4/0.2）:
 *   修正前            97.1 / 80.9 / 60.6 / 40.3 / 10.2
 *   修正後・ライン70  99.8 / 92.0 / 76.8 / 59.3 / 37.1  ← 易しくなりすぎ
 *   修正後・ライン84  94.8 / 78.0 / 56.7 / 36.4 / 22.9  ← 採用
 *
 * 下位層（技能0.2）だけは 10% に戻せない。以前そこを潰していたのは
 * 「スコアが伸びなかった」という**見えない失敗条件**であって、
 * 適当に押している人を落としていたのはそれだった。
 * 信頼だけで同じ形にしようとすると上位層まで巻き添えになる
 * （ライン80・自然減+1 で 88.9 / 68.6 — 完璧に打っても11%落ちる）。
 * 見えない条件で落とすより、実力どおりの層で落とすほうを採る。
 */
const CONTRACT_TRUST_MIN = 84;
/**
 * これを超えて引かれていると契約に至らない。
 *
 * 85 は誰にも当たらない数字だった（実測 0.0〜0.1%）。
 * 距離を一切気にせず打っても creep は中央値19・上位10%で45にしか届かず、
 * 「踏み込めば信頼は伸びるが引かれる」という誘惑が
 * 選択肢の 1.6% しか無かったのが原因。
 *
 * 誘惑を 82件（11%）に増やしたうえで 50 に下げてある。実測:
 *
 * | 契約の距離上限 | 距離を測る人 | 信頼だけ追う人 |
 * |---|---|---|
 * | 85 | 0.0% | 0.1% |
 * | 60 | 0.8% | 3.7% |
 * | **50** | **2.9%** | **8.1%** |
 * | 40 | 6.9% | 16.4% |
 *
 * 慎重に打つ人と無頓着な人で 2.8 倍の差がつく。
 * 40 まで下げると慎重な人まで巻き込むので 50 で止める。
 */
const CONTRACT_CREEP_MAX = 50;

/**
 * 契約に届かなかった理由。
 *
 * 判定は3条件の AND なので、落ちた条件を名指しできる。
 * 閾値そのもの（70 / 85）は伏せ、あとどれだけ足りなかったかだけを返す。
 * 画面側で閾値を再実装しないよう、判定はここに集約する。
 */
export type ContractMiss =
  | { kind: 'trust'; short: number }
  | { kind: 'creep' }
  | { kind: 'score' };

export const diagnoseContractMiss = (state: GameState): ContractMiss | null => {
  let adjustedTrust = state.gauge.trust;
  if (state.lunchImpactScore >= 8) adjustedTrust += 5;
  if (state.lunchImpactScore <= -8) adjustedTrust -= 5;

  if (adjustedTrust < CONTRACT_TRUST_MIN) {
    return { kind: 'trust', short: CONTRACT_TRUST_MIN - adjustedTrust };
  }
  if (state.gauge.creep > CONTRACT_CREEP_MAX) return { kind: 'creep' };

  if (calcImprovement(state) <= 0) return { kind: 'score' };

  return null;
};

/**
 * 相手が平均より何打よく回ったか。マイナスなら平均より悪い。
 * 判定（`contractSuccess`）と理由（`diagnoseContractMiss`）で
 * 同じ式を使うために一本化してある。
 */
const calcImprovement = (state: GameState): number => {
  const moodAdjust =
    state.lunchMood === 'bad' ? 3 : state.lunchMood === 'good' ? -2 : 0;
  const shift =
    gaugeScoreEffect(state.gauge) + minigameScoreEffect(state) + moodAdjust;
  // shift がマイナス（スコアが縮む）ほど改善。
  //
  // 上下に頭打ちを置くのは表示のため。素のままだと -15〜+18 まで開いて、
  // 平均88の相手が 60 で回ったことになる（ほぼプロ）。
  // 0 をまたがない丸め方なので契約の判定（improvement > 0）は変わらない。
  return Math.max(-12, Math.min(10, -shift));
};

export const calcResult = (state: GameState): GameResult => {
  // 基準は相手の平均スコア。プロフィールに出ている数字そのものなので、
  // 何と比べられているのかが画面から分かる
  const character = characters.find((c) => c.id === state.characterId);
  const baseline18 = character?.avgScore18 ?? 90;
  const improvement = calcImprovement(state);
  const opponentGross18 = baseline18 - improvement;

  const entertainScore = calcEntertainScore(state.gauge);

  // エースラウンドは calcAceResult を通るのでここには来ない（isAce 分岐は置かない）
  const creepThreshold = CONTRACT_CREEP_MAX;

  // 昼係数によるtrust調整
  let adjustedTrust = state.gauge.trust;
  if (state.lunchImpactScore >= 8) {
    adjustedTrust += 5; // 昼ボーナス
  }
  if (state.lunchImpactScore <= -8) {
    adjustedTrust -= 5; // 昼事故
  }

  const contractSuccess =
    adjustedTrust >= CONTRACT_TRUST_MIN &&
    state.gauge.creep <= creepThreshold &&
    improvement > 0;

  const { playType, playTypeLabel, playTypeComment } = diagnosePlayType(
    state.tagHistory
  );

  const grade = calcGrade(entertainScore);

  return {
    opponentGross18,
    baseline18,
    improvement,
    entertainScore,
    grade,
    contractSuccess,
    playType,
    playTypeLabel,
    playTypeComment,
  };
};

// =====================================================================
// Reaction text
// =====================================================================

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
