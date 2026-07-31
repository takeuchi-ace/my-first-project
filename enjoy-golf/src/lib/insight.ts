import { ReactionRank, GameState, GameEvent, CharacterSpecificEvent, Gauge, CharacterId, Choice } from '../types';
import {
  GestureClass,
  rankToGestureClass,
  getGesturePool,
} from '../data/gestures';
import { characters } from '../data/characters';
import { speechLineTemplates } from '../data/speechLineTemplates';
import { speechStyles } from '../data/speechStyles';
import { resolveTagSpeech, resolveStyleTagSpeech } from '../data/tagSpeechLines';
import { applyChoice, evaluateReactionRank } from '../logic/engine';
import { applyCompetitionChoice, CompetitionGameState } from '../logic/competitionEngine';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface ReactionPlan {
  speechText: string;
  rank: ReactionRank;
  gestureText: string | null;
  gestureClass: GestureClass | null;
  /**
   * 仕草テキストがキャラ別に書かれた地の文か（true）、汎用の仕草プールか（false）。
   * 地の文は文末が「。」の完全な文なので、表示側でアスタリスクで囲まない。
   */
  gestureIsNarration: boolean;
  isMismatch: boolean;
  gestureDelayMs: number;
}

/**
 * 本音を隠すとき、口ではどのランクの言葉を使うか。
 *
 * このゲームの読み合いのルールは「言葉は取り繕えるが、本音は表情と仕草に出る」。
 * ズレが起きたときはセリフだけを裏返し、表情と仕草は本当のランクのまま出す。
 * プレイヤーは態度を見れば本音が分かる。
 *
 *  good  → bad  : 嬉しいのに素っ気なく装う
 *  neutral → good: 何とも思っていないのに社交辞令を言う
 *  bad/worst → good: 不快なのに笑って取り繕う
 */
const MASK_RANK: Record<ReactionRank, ReactionRank> = {
  good: 'bad',
  neutral: 'good',
  bad: 'good',
  worst: 'good',
};

/**
 * セリフ決定の優先順位:
 * 1. speechOverride（イベント側で指定された固定セリフ）
 * 2. mismatch時: character.mismatchSpeechLines?.[rank]（建前用に書き下ろした専用セリフ）
 * 3. character.speechLines?.[rank]?.default
 * 4. speechLineTemplates[character.speechStyleId][rank]
 * 5. speechStyles.sampleLines（rank無視フォールバック）
 *
 * 2 が未設定のキャラでは、呼び出し側が rank を MASK_RANK で置き換えて渡すため、
 * 「そのキャラが正反対の気分のときに言う言葉」がそのまま建前として使われる。
 * 既存のセリフを流用するので口調が崩れない。
 */
function resolveSpeechText(
  trueRank: ReactionRank,
  characterId: CharacterId,
  isMismatch: boolean,
  speechOverride?: string
): string {
  // 1) speechOverride
  if (speechOverride) return speechOverride;

  const character = characters.find((c) => c.id === characterId);
  if (!character) return '';

  // 2) 建前用に書き下ろした専用セリフ（本当のランクで引く）
  if (isMismatch) {
    const mismatchLines = character.mismatchSpeechLines?.[trueRank];
    if (mismatchLines?.length) {
      return pick(mismatchLines);
    }
  }

  // 専用セリフが無い場合は、正反対のランクの言葉をそのまま建前として使う
  const rank = isMismatch ? MASK_RANK[trueRank] : trueRank;

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
 * 「何を選んだか」に噛み合った返事を返す。無ければ null。
 *
 * 優先順位:
 *  1. `choice.speech` — 選択肢ごと・ランクごとに書き下ろした専用セリフ（48件）
 *  2. タグ別のセリフ — その選択がどういう行為かで引く（全1,070選択肢を覆う）
 *
 * どちらも全キャラ共通の文章なので、口調がキャラの正体になっている相手
 * （speechStyle.distinctVoice = 体育会・方言・英語混じり等）ではキャラ崩れを起こす。
 * その場合は null を返し、呼び出し側でキャラ専用の speechLineTemplates に戻す。
 */
export function resolveChoiceSpeech(
  choice: Pick<Choice, 'speech' | 'tags'>,
  rank: ReactionRank,
  characterId: CharacterId,
  isMismatch = false
): string | null {
  // 本音を隠すときは、その選択肢に対する正反対のランクのセリフを口にする
  const spokenRank = isMismatch ? MASK_RANK[rank] : rank;
  const character = characters.find((c) => c.id === characterId);
  if (character) {
    const style = speechStyles.find((s) => s.id === character.speechStyleId);
    if (style?.distinctVoice) {
      // 共通の文章はキャラが崩れるので使えない。その口調で書いたものだけ使う
      return resolveStyleTagSpeech(character.speechStyleId, choice.tags ?? [], spokenRank);
    }
  }
  if (choice.speech) return choice.speech[spokenRank];
  return resolveTagSpeech(choice.tags ?? [], spokenRank);
}

/**
 * 仕草（＝本音の手がかり）のテキストを決める。
 *
 * `character.reactionLines` にはキャラ別の反応描写が書かれている
 * （「黒田の視線が厳しくなった。」のような地の文）。汎用の仕草プールは
 * 全キャラ共通の動作（「目を逸らした」）なので、キャラ別の描写があれば
 * そちらを優先する。ランク4段階で引けるぶん、汎用プールの3クラスより細かい。
 *
 * ただし本音を隠しているターンでは、セリフを含む描写は使わない。
 * 吹き出しの建前と地の文の本音で「」が二重に出ると、
 * 仕込んだ食い違いではなく文章の破綻に見えてしまう。
 *
 * キャラ別の描写だけを使うと、1キャラ1ランクあたり2行しかないため同じ文が
 * すぐ繰り返される（汎用プールは1クラス10件）。逆に単純に足し合わせると
 * キャラ別が2/12でほとんど出てこない。NARRATION_RATE の確率でキャラ別を
 * 選び、残りは汎用プールから引くことで、個性と手数の両方を残す。
 */
const NARRATION_RATE = 0.6;

function resolveGesture(
  rank: ReactionRank,
  character: (typeof characters)[number],
  isMismatch: boolean,
  gestureClass: GestureClass
): { text: string; isNarration: boolean } {
  const lines = character.reactionLines?.[rank] ?? [];
  const usable = isMismatch ? lines.filter((l) => !l.includes('\u300C')) : lines;
  if (usable.length > 0 && Math.random() < NARRATION_RATE) {
    return { text: pick(usable), isNarration: true };
  }
  return { text: pick(getGesturePool(gestureClass)), isNarration: false };
}

/**
 * セリフ+仕草を一括計算
 *
 * - 通常は 70% の確率で仕草を添える
 * - mismatchRate の確率で「本音を隠す」ターンになる。そのときは
 *   セリフだけを正反対のランクのものに差し替え、表情と仕草は本当のランクのまま出す。
 *   仕草が唯一の手がかりになるので、隠しているターンは必ず仕草を表示する。
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
      gestureIsNarration: false,
      isMismatch: false,
      gestureDelayMs: 0,
    };
  }

  // 本音を隠すターンかどうか
  const isMismatch = Math.random() < character.mismatchRate;

  // セリフ解決。隠すターンは専用セリフ（未設定なら正反対のランクの言葉）を使う
  const speechText = resolveSpeechText(rank, characterId, isMismatch, speechOverride);

  // 仕草: 通常は70%。隠すターンは仕草が唯一の手がかりなので必ず出す
  const showGesture = isMismatch || Math.random() < 0.7;
  if (!showGesture) {
    return {
      speechText,
      rank,
      gestureText: null,
      gestureClass: null,
      gestureIsNarration: false,
      isMismatch,
      gestureDelayMs: 0,
    };
  }

  // 仕草は常に本当のランクを表す（本音は態度に出る）
  const gestureClass = rankToGestureClass(rank);

  // 仕草テキスト（キャラ別の描写があればそちらを使う）
  const gesture = resolveGesture(rank, character, isMismatch, gestureClass);

  // 仕草ディレイ: 500〜700ms
  const gestureDelayMs = 500 + Math.floor(Math.random() * 200);

  return {
    speechText,
    rank,
    gestureText: gesture.text,
    gestureClass,
    gestureIsNarration: gesture.isNarration,
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
 * 「本音を見抜けたか」の連続カウント。
 *
 * 判定するのは、相手が本音を隠した**次のターン**。隠されたターンの選択自体は
 * まだ何も見ていないので測れない。建前を真に受けた人は次の一手を外し、
 * 態度を読めた人は正解を選べる ── そこを数える。
 *
 * @param afterMismatch 直前のターンが「本音を隠したターン」だったか
 */
export function updateInsightStreak(
  current: number,
  afterMismatch: boolean,
  chosenIdx: number,
  bestIdx: number
): { newStreak: number; insightFired: boolean } {
  if (!afterMismatch) {
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
