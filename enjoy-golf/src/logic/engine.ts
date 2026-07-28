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
} from '../types';
import { events } from '../data/events';
import { extremeEvents } from '../data/extremeEvents';
import { frontEvents as curatedFront, backEvents as curatedBack } from '../data/curatedEvents';
import { characterSpecificEvents } from '../data/characterEvents';
import { characterLunchEvents } from '../data/lunchEvents';
import { goodBackEvents } from '../data/goodBackEvents';
import { tensionBackEvents } from '../data/tensionBackEvents';
import { femaleEvents } from '../data/femaleEvents';
import { characters } from '../data/characters';
import { getMorningShotEvent, pickMorningShotVariant, rollMorningShotResult } from '../data/morningShotEvents';
import { SlopeType } from '../types';
import { getPuttSlopeVariant, getPuttingProfile, buildPuttingGameEvent } from '../data/puttingEvent';
import { localizeEvent, getCallName } from '../lib/characterText';

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
};

const BONUS_BEATS: BonusBeat[] = ['pre', 'lunchTalk', 'closing'];

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
const canFireBeat = (state: GameState, beat: BonusBeat): boolean =>
  state.bonusBeat === beat && !state.bonusBeatDone && stagePool(state, BEAT_STAGE[beat]).length > 0;

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
export const createInitialState = (characterId: CharacterId): GameState => ({
  characterId,
  gauge: { ...INITIAL_GAUGE },
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
  lastAppliedDelta: { fun: 0, trust: 0, creep: 0, focus: 0 },
  creepBySource: { cheat: 0, close: 0, distant: 0 },
  coldStreak: 0,
});

// ===== Find event by id across all sources =====
const findEventById = (id: string): GameEvent | undefined => {
  const common = allCommonEvents.find((e) => e.id === id);
  if (common) return common;

  // femaleEvents
  const fe = femaleEvents.find((e) => e.id === id);
  if (fe) return fe;

  // goodBack / tensionBack
  const gb = goodBackEvents.find((e) => e.id === id);
  if (gb) return gb;
  const tb = tensionBackEvents.find((e) => e.id === id);
  if (tb) return tb;

  for (const evts of Object.values(characterSpecificEvents)) {
    const found = evts.find((e) => e.id === id);
    if (found) return toGameEvent(found);
  }

  // Check lunch events
  for (const evt of Object.values(characterLunchEvents)) {
    if (evt.id === id) return toGameEvent(evt);
  }

  return undefined;
};

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
  if (state.currentHole === 9 && state.puttResult === null && !state.aceUsedThisRound) {
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
  tagHistory: Tag[]
): Gauge => {
  const character = characters.find((c) => c.id === characterId);
  if (!character) return gauge;

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

  // 1. Apply base delta with traitModifiers (lunch-amplified)
  let newGauge = applyDeltaWithModifiers(
    state.gauge,
    baseDelta,
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
  newGauge = applyLikesHates(newGauge, choice.tags, state.characterId, state.tagHistory);

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
      phase: state.phase,
      cheatPhysicalCount: newCheatCount,
      usedEventIds: [...state.usedEventIds, event.id],
      holeResults: [
        ...state.holeResults,
        {
          hole: state.currentHole,
          eventId: event.id,
          choiceIndex,
          focusSnapshot: newGauge.focus,
        },
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
      cheatPhysicalCount: newCheatCount,
      usedEventIds: [...state.usedEventIds, event.id],
      holeResults: [
        ...state.holeResults,
        {
          hole: state.currentHole,
          eventId: event.id,
          choiceIndex,
          focusSnapshot: newGauge.focus,
        },
      ],
      tagHistory: newTagHistory,
      lunchImpactScore: newLunchImpactScore,
      lunchMood: newLunchMood,
      morningShot: newMorningShot,
      morningMomentum: newMorningMomentum,
      bonusBeatDone: true,
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
    currentHole: isComplete ? 9 : newHole,
    phase: isComplete ? state.phase : getPhase(newHole),
    cheatPhysicalCount: newCheatCount,
    usedEventIds: [...state.usedEventIds, event.id],
    holeResults: [
      ...state.holeResults,
      {
        hole: state.currentHole,
        eventId: event.id,
        choiceIndex,
        focusSnapshot: newGauge.focus,
      },
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

export const isBadChoice = (choice: Choice): boolean => {
  const d = choice.delta;
  return (
    (d.creep ?? 0) >= 10 ||
    (d.trust ?? 0) <= -10 ||
    (d.focus ?? 0) <= -10
  );
};

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
// =====================================================================

const OPPONENT_HANDICAP_9H = 9;

const gaugeToScore9 = (gauge: Gauge): number => {
  const quality = gauge.trust * 0.5 + gauge.fun * 0.3 + (100 - gauge.creep) * 0.2;
  // 非対称: 良くなる方向はやや強め(/3.5)、悪くなる方向は弱め(/6)
  const diff = quality - 50;
  const adjustment =
    diff >= 0
      ? -Math.round(diff / 3.5)  // 良い接待 → スコア改善（やや強め）
      : Math.round(-diff / 6);   // 悪い接待 → スコア悪化（弱め）
  return 36 + OPPONENT_HANDICAP_9H + adjustment;
};

// =====================================================================
// Baseline（接待ゼロ想定）シミュレーション
// =====================================================================

const findNeutralChoiceIndex = (event: GameEvent): number => {
  let minMag = Infinity;
  let minIdx = 0;
  for (let i = 0; i < event.choices.length; i++) {
    const d = event.choices[i].delta;
    const mag =
      Math.abs(d.fun ?? 0) +
      Math.abs(d.trust ?? 0) +
      Math.abs(d.focus ?? 0) +
      Math.abs(d.creep ?? 0);
    if (mag < minMag) {
      minMag = mag;
      minIdx = i;
    }
  }
  return minIdx;
};

const simulateNeutralGauge = (state: GameState): Gauge => {
  const character = characters.find((c) => c.id === state.characterId);
  let gauge: Gauge = { ...INITIAL_GAUGE };

  for (const hr of state.holeResults) {
    const event = findEventById(hr.eventId);
    if (!event) continue;

    const neutralIdx = findNeutralChoiceIndex(event);
    const choice = event.choices[neutralIdx];

    gauge = applyDelta(gauge, choice.delta);

    if (character) {
      for (const tag of choice.tags) {
        const reaction = character.reactions.find((r) => r.tag === tag);
        if (reaction) {
          gauge = applyDelta(gauge, reaction.delta);
        }
      }
    }
  }

  return gauge;
};

// =====================================================================
// Entertain Score
// =====================================================================

export const calcEntertainScore = (gauge: Gauge): number =>
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
 *   adjustedTrust >= 70 && creep <= creepThreshold && improvement > 0
 *
 * 【昼係数】
 *   lunchImpactScore >= 8  → trust +5（昼ボーナス）
 *   lunchImpactScore <= -8 → trust -5（昼事故）
 */
export const calcResult = (state: GameState): GameResult => {
  const actual9 = gaugeToScore9(state.gauge);
  const neutralGauge = simulateNeutralGauge(state);
  const baseline9 = gaugeToScore9(neutralGauge);

  // lunchMood: フラット加算（掛け算だと振れ幅が大きすぎるため）
  const moodAdjust =
    state.lunchMood === 'bad' ? 3
    : state.lunchMood === 'good' ? -2
    : 0;

  const opponentGross18 = actual9 * 2 + moodAdjust;
  const baseline18 = baseline9 * 2;
  const improvement = baseline18 - opponentGross18;

  const entertainScore = calcEntertainScore(state.gauge);

  // ACE弁護士は creep 閾値が厳しい (70 vs 通常の 85)
  const character = characters.find((c) => c.id === state.characterId);
  const creepThreshold = character?.isAce ? 70 : 85;

  // 昼係数によるtrust調整
  let adjustedTrust = state.gauge.trust;
  if (state.lunchImpactScore >= 8) {
    adjustedTrust += 5; // 昼ボーナス
  }
  if (state.lunchImpactScore <= -8) {
    adjustedTrust -= 5; // 昼事故
  }

  const contractSuccess =
    adjustedTrust >= 70 &&
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

export const getReactionText = (
  state: GameState,
  choice: Choice
): string => {
  const name = getCallName(state.characterId);

  // ── チート系（cheat_physical / cheat_score / cheat）──
  if (
    choice.tags.includes('cheat_physical') ||
    choice.tags.includes('cheat_score') ||
    choice.tags.includes('cheat')
  ) {
    if (state.gauge.creep >= 80) {
      return pick([
        `${name}の目が鋭くなった…「…ん？」`,
        `${name}がじっとこちらを見つめている。「…何か今、やったか？」`,
        `${name}の表情が凍りついた。「…見えてたよ」`,
      ]);
    }
    if (state.gauge.creep >= 50) {
      return pick([
        `${name}は少し怪訝そうだ。`,
        `${name}は一瞬眉をひそめたが、何も言わなかった。`,
        `${name}は首を傾げている。「…気のせいかな」`,
      ]);
    }
    return pick([
      `${name}は気づいていないようだ。`,
      `${name}は前を向いたまま歩いている。バレていない…はず。`,
      `${name}は自分のプレーに集中しているようだ。セーフ。`,
    ]);
  }

  if (choice.tags.includes('extreme')) {
    return pick([
      `${name}は目を丸くしている。「…マジか」`,
      `${name}は一瞬固まった後、何とも言えない表情をしている。`,
      `${name}は絶句した。「いや…そこまでする？」`,
    ]);
  }

  if (choice.tags.includes('snitch')) {
    return pick([
      `${name}の目が冷たくなった。「…そういうことする人なんだ」`,
      `${name}は不信感を隠せないようだ。`,
      `${name}は黙ってこちらから距離を取った。`,
    ]);
  }

  if (choice.tags.includes('pressure')) {
    return pick([
      `${name}は少し緊張した面持ちだ。`,
      `${name}は真剣な目でこちらを見つめている。`,
      `${name}は圧力を感じ取ったようだ。「…なるほど」`,
    ]);
  }

  if (choice.tags.includes('over_praise')) {
    return pick([
      `${name}は苦笑いしている。「…それは言い過ぎだろう」`,
      `${name}は困った顔をしている。「お世辞も度が過ぎると…」`,
      `${name}は少し引いている。褒め過ぎたようだ。`,
    ]);
  }

  if (choice.tags.includes('risk')) {
    return pick([
      `${name}は興奮気味だ。「なかなかスリリングだな！」`,
      `${name}は緊張した面持ちでこちらを見ている。`,
      `${name}は「大丈夫か？」と少し心配そうだ。`,
    ]);
  }

  if (choice.tags.includes('alcohol')) {
    return pick([
      `${name}はグラスを掲げた。「いいねぇ、飲もう飲もう！」`,
      `${name}は上機嫌になってきた。「ゴルフと酒は最高の組み合わせだ！」`,
      `${name}は少し赤くなった顔で笑っている。「こういうのがいいんだよ」`,
    ]);
  }

  if (choice.tags.includes('hype')) {
    return pick([
      `${name}のテンションが上がった！「いいぞ！この調子！」`,
      `${name}は勢いに乗ってきたようだ。「盛り上がってきた！」`,
      `${name}は笑顔で拳を握った。「最高だ！」`,
    ]);
  }

  if (choice.tags.includes('focus')) {
    return pick([
      `${name}はプレーの進行に満足しているようだ。`,
      `${name}は集中した空気を心地よく感じているようだ。`,
      `${name}は頷いた。「テンポがいいね」`,
    ]);
  }

  if (choice.tags.includes('analysis_praise')) {
    return pick([
      `${name}は少し目を見開いた。「よく見てますね」`,
      `${name}は頷いた。「冷静な分析だ」`,
      `${name}は感心したように唸った。「観察力があるな」`,
    ]);
  }

  if (choice.tags.includes('self_reflect')) {
    return pick([
      `${name}は静かに頷いた。「自分を見つめられる人は強い」`,
      `${name}は少し驚いたようだ。「…正直だな」`,
      `${name}は黙って聞いている。好意的な沈黙だ。`,
    ]);
  }

  if (choice.tags.includes('fair_compete')) {
    return pick([
      `${name}は口元を引き締めた。「正々堂々、いいですね」`,
      `${name}の目に静かな闘志が宿った。「受けて立ちますよ」`,
      `${name}は嬉しそうだ。「フェアな勝負は好きです」`,
    ]);
  }

  if (choice.tags.includes('challenge')) {
    return pick([
      `${name}は一瞬目を見開いた。「…いいですよ、受けて立ちます」`,
      `${name}の表情が引き締まった。「…面白い」`,
      `${name}は静かに頷いた。「正面から来るか」`,
    ]);
  }

  if (choice.tags.includes('kiai')) {
    return pick([
      `${name}のテンションが上がった！「おぉ、気合入ってるな！」`,
      `${name}は目を輝かせた。「いいぞ！その勢い！」`,
      `${name}は笑って拳を突き出した。「やるじゃん！」`,
    ]);
  }

  if (choice.tags.includes('ride_the_mood')) {
    return pick([
      `${name}は楽しそうだ。「いいノリしてるな！」`,
      `${name}のペースが上がった。「この流れ、最高だ！」`,
      `${name}は上機嫌だ。「わかってるじゃん！」`,
    ]);
  }

  if (choice.tags.includes('bro') || choice.tags.includes('team') || choice.tags.includes('back_up')) {
    return pick([
      `${name}は嬉しそうに頷いた。「仲間って感じだな！」`,
      `${name}の表情が和らいだ。「頼りになるな」`,
      `${name}は笑った。「いい奴だな、お前！」`,
    ]);
  }

  if (choice.tags.includes('excuse')) {
    return pick([
      `${name}は少し冷めた目をしている。「…言い訳か？」`,
      `${name}の表情が曇った。「そういうの、一番ダサいぞ」`,
      `${name}は黙って先に歩き出した。`,
    ]);
  }

  if (choice.tags.includes('avoid_risk') || choice.tags.includes('safe_play')) {
    return pick([
      `${name}はつまらなそうだ。「守りに入ったな」`,
      `${name}は少しがっかりしたようだ。「もう少し攻めてほしかったな」`,
      `${name}は首を傾げた。「…ビビったか？」`,
    ]);
  }

  if (choice.tags.includes('adversity')) {
    return pick([
      `${name}は真剣な目でこちらを見ている。「…やるじゃん」`,
      `${name}は目を細めた。逆境でこそ本性が見えるものだ。`,
      `${name}は頷いた。「ここで前に出るか…」`,
    ]);
  }

  if (choice.tags.includes('honesty')) {
    return pick([
      `${name}は少し嬉しそうだ。「正直でいいね」`,
      `${name}は穏やかに頷いた。「誠実な人だな」`,
      `${name}は少し表情を緩めた。「そういうの、嫌いじゃないよ」`,
    ]);
  }

  if (choice.tags.includes('ethics')) {
    return pick([
      `${name}は感心したように頷いた。「筋が通っているな」`,
      `${name}は真剣な目でこちらを見た。「信用できる人だ」`,
      `${name}は静かに微笑んだ。「そういう姿勢は大事だ」`,
    ]);
  }

  if (choice.tags.includes('sportsmanship')) {
    return pick([
      `${name}は嬉しそうだ。「フェアプレーの精神、大事だね」`,
      `${name}は好意的な視線を向けてきた。スポーツマンシップが伝わったようだ。`,
      `${name}は力強く頷いた。「正々堂々、いいね」`,
    ]);
  }

  if (choice.tags.includes('humor')) {
    return pick([
      `${name}は笑った。「面白いな、君は！」`,
      `${name}は声を上げて笑った。「いいね、その返し！」`,
      `${name}はニヤリとした。「なかなかセンスあるじゃないか」`,
    ]);
  }

  if (choice.tags.includes('logic')) {
    return pick([
      `${name}は感心した。「論理的だな。話しやすい」`,
      `${name}は頷いた。「合理的な考え方だね」`,
      `${name}は目を細めた。「理屈が通っていて好感が持てる」`,
    ]);
  }

  if (choice.tags.includes('bold')) {
    return pick([
      `${name}は興味深そうにこちらを見ている。`,
      `${name}は少し驚いた顔をした。「度胸あるな、君」`,
      `${name}は感心したように頷いた。「攻めるねぇ」`,
    ]);
  }

  if (choice.tags.includes('boss')) {
    return pick([
      `${name}は少し圧倒されたようだ。「…やるな」`,
      `${name}は黙って従った。リーダーシップを認めたようだ。`,
      `${name}は少し緊張した顔をしている。`,
    ]);
  }

  if (choice.tags.includes('silence')) {
    return pick([
      `${name}は静かな時間を共有している。心地よい沈黙だ。`,
      `${name}は特に何も言わなかった。それが心地よいようだ。`,
      `沈黙の中、${name}は穏やかな表情をしている。`,
    ]);
  }

  if (choice.tags.includes('distance')) {
    return pick([
      `${name}はちょうどいい距離感を感じているようだ。`,
      `${name}は落ち着いた様子だ。程よい関係が保てている。`,
      `${name}は自然体でいられているようだ。`,
    ]);
  }

  if (choice.tags.includes('flattery')) {
    return pick([
      `${name}は悪い気はしていないようだ。`,
      `${name}は照れたように笑った。「いやいや、そんなことないよ」`,
      `${name}は満更でもなさそうだ。「お世辞でも嬉しいね」`,
    ]);
  }

  if (choice.tags.includes('over_support')) {
    return pick([
      `${name}は少し驚いている。「そこまでしなくても…」`,
      `${name}は戸惑いつつも嬉しそうだ。「気を遣わせてすまないね」`,
      `${name}は苦笑した。「ありがたいけど、ちょっとやりすぎじゃない？」`,
    ]);
  }

  if (choice.tags.includes('etiquette')) {
    return pick([
      `${name}は感心したように頷いた。「マナーがいいね」`,
      `${name}は好意的な視線を向けてきた。礼儀正しさが伝わったようだ。`,
      `${name}は静かに微笑んだ。「育ちがいいんだな」`,
    ]);
  }

  if (choice.tags.includes('serious')) {
    return pick([
      `${name}は真剣な表情で頷いた。「分かってるな」`,
      `${name}は黙って頷いた。冷静な判断を認めたようだ。`,
      `${name}は少し感心したようだ。「落ち着いてるね」`,
    ]);
  }

  if (choice.tags.includes('safe')) {
    return pick([
      `${name}は穏やかに微笑んだ。無難な対応に安心したようだ。`,
      `${name}は軽く頷いた。特に波風はなさそうだ。`,
      `${name}は特に反応を見せなかった。悪い印象はないようだ。`,
    ]);
  }

  if (choice.tags.includes('neutral')) {
    return pick([
      `${name}は特に反応を見せなかった。`,
      `${name}は静かにプレーを続けている。`,
      `${name}は軽くうなずいた。`,
    ]);
  }

  return pick([
    `${name}は静かに頷いた。`,
    `${name}は軽く微笑んだ。`,
    `${name}は特に気にしていないようだ。`,
  ]);
};
