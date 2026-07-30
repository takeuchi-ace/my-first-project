/**
 * 摩耗（Wear）システム — ラウンドを越えて残る隠しパラメータ
 *
 * creep との違いがこのシステムの存在理由。
 *
 *   creep = 相手が引いた（やりすぎ・相手視点・1ラウンドで完結）
 *   摩耗  = 相手に合わせて、それが通った（自分を殺した・自分視点・ラウンドを越える）
 *
 * だから迎合して**失敗した**ときは加算しない。そこは creep がすでに罰しており、
 * 二重に罰すると同じ行為に2つのゲージが反応するだけになる（実測 r=0.445）。
 * 「通った迎合」だけを数えると creep との相関は r=0.076 まで落ちて別の軸になる。
 *
 * 出口は2つだけ。スコア減・洞察の抑制といった creep と重なる罰は入れない。
 *  - 内なる声（ラウンド中、迎合が通った直後に出る）
 *  - 創業者の気づかい（相談ラウンド）
 */

import { ReactionRank, Tag } from '../types';

// ===== 摩耗が溜まるタグ =====

/**
 * 「自分を殺して相手に合わせた」振る舞い。
 *
 * silence が最も重いのは、言いたいことを飲み込む行為そのものだから。
 * 寡黙な相手（黒田）の前では沈黙が正解になる場面が多く、勝ちながら摩耗する。
 * safe が軽いのは、無難に流すのは我慢ではあっても自分を曲げてはいないため。
 */
const CONFORM_TAGS: Partial<Record<Tag, number>> = {
  silence: 3,
  over_praise: 3,
  flattery: 2,
  over_support: 2,
  safe: 1,
};

/**
 * その選択で溜まる摩耗量。
 *
 * @param rank その選択に相手が返した反応。good / neutral（＝通った）ときだけ溜まる。
 *             bad / worst は creep の担当なので 0 を返す。
 */
export const calcWearDelta = (tags: Tag[], rank: ReactionRank): number => {
  if (rank !== 'good' && rank !== 'neutral') return 0;
  let delta = 0;
  for (const tag of tags) {
    delta += CONFORM_TAGS[tag] ?? 0;
  }
  return delta;
};

// ===== しきい値 =====

/**
 * 実測で届く値に合わせてある（25ラウンドのキャリア×3000で測定）。
 * 25 には 86%／77%（上手いプレイ／ほどほど）、35 には 66%／49% が到達する。
 *
 * 上を 45 に置くと到達が 42%／23% まで落ち、強い内なる声3行と
 * 創業者の「少し疲れているようですね」が半分以上のプレイヤーに読まれない。
 */
export const WEAR_TIRED = 25;
export const WEAR_WORN = 35;

// ===== 内なる声 =====

const INNER_VOICE_TIRED: string[] = [
  '…本当にこれでいいのか？',
  '…自分を殺しすぎてないか。',
  '…笑顔が引きつっている気がする。',
];

const INNER_VOICE_WORN: string[] = [
  '…もう限界かもしれない。',
  '…誰のためにやってるんだ、これ。',
  '…何を楽しめばいいんだ。',
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * 内なる声を返す（null = 出さない）。
 *
 * 呼び出すのは**摩耗が溜まったビートだけ**。ランダムなタイミングで出すと
 * 何に対する声なのか分からないが、迎合が通った直後に出せば
 * 隠しパラメータのまま原因と結果が結びつく。
 */
export const rollInnerVoice = (wear: number): string | null => {
  if (wear >= WEAR_WORN) {
    return Math.random() < 0.45 ? pick(INNER_VOICE_WORN) : null;
  }
  if (wear >= WEAR_TIRED) {
    return Math.random() < 0.25 ? pick(INNER_VOICE_TIRED) : null;
  }
  return null;
};

// ===== 創業者の気づかい =====

/**
 * 相談ラウンドで、摩耗している相手にだけ返る一言。
 * creep では作れない「これまでの来し方」への反応。
 */
export const getWearHint = (wear: number): string | null => {
  if (wear >= WEAR_WORN) {
    return '…少し疲れているようですね。無理は禁物ですよ。';
  }
  if (wear >= WEAR_TIRED) {
    return '自分らしさを大切に。それが一番の武器です。';
  }
  return null;
};

// ===== 回復 =====

/**
 * ラウンド完了時の回復量。そのラウンドで自分を殺した量で決まる。
 *
 * 固定 -1 にすると、溜まったあとに本音で当たれる相手（ミツキ・大門・桐生）を
 * 12ラウンド回っても 43〜48 を行き来するだけで下がらない（実測）。
 * 抜け道が無いなら、摩耗はプレイヤーが関与できない一方通行の数字になってしまう。
 * 逆に回復を大きく（迎合2以下で -5）すると、今度は 21人を一周しても
 * 最大 18 で止まり、しきい値 25 に一度も届かなくなる。
 *
 * しきい値 1 で -3 に分ける形が両方成り立つ唯一の幅だった。
 * 実測（25ラウンドのキャリア×3000）:
 *   到達した最大摩耗の中央値 41（上手いプレイ）／34（ほどほど）
 *   25以上に届く人 86% / 77%、35以上 66% / 49%
 *   摩耗45から本音で当たれる相手を10ラウンド回ると 27 まで下がる
 *
 * 「相手を選ぶ・本音で当たる」という判断がそのまま摩耗を戻す手になっている。
 *
 * @param roundWearGained そのラウンドで溜まった摩耗の合計
 */
export const calcRoundEndRecovery = (roundWearGained: number): number => {
  if (roundWearGained <= 1) return -3;
  return -1;
};

/**
 * 相談ラウンドは大きく戻る。創業者と本音で話す場だから。
 * 溜まったときに自分で選べる唯一の大きな手当てでもある。
 */
export const WEAR_ACE_ROUND = -15;

/**
 * 契約成功では回復させない。
 * 迎合で勝った代償を勝利そのものが打ち消してしまい、
 * 「接待で勝つことには値段がある」という前提が崩れる。
 */
