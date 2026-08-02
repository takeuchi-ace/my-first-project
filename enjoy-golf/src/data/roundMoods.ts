/**
 * 今日の機嫌 — ラウンドごとに引く、相手の一時的な状態
 *
 * ## なぜ要るか
 *
 * 同じ相手を2回回ったとき、出るイベントは 77% が入れ替わる（実測）。
 * それでも「同じ感じ」に見えるのは、**判定が毎回まったく同じ**だから。
 * 何が刺さるかが固定されている以上、2回目は作業になる。
 *
 * ## 設計
 *
 * 機嫌はキャラの好みを**上書きしない**。重ねるだけ。
 * 上書きにすると、周回で溜めた「一緒に回って分かったこと」が
 * その日だけ嘘になり、蓄積の意味がなくなる。
 *
 * 効き幅もキャラ本来の好み（信頼±2〜4・creep+6）より小さくしてある。
 * あくまで「今日はこっちに寄っている」程度で、本筋は相手そのもの。
 *
 * ## 読めること
 *
 * 機嫌は作戦を決める画面で `tell` として示す。
 * 隠したままだと運になるだけで、読む材料が増えない。
 * 見えているからこそ「今日はこの路線でいこう」という判断が生まれる。
 */

import { RoundMoodId, Tag } from '../types';

export interface RoundMood {
  id: RoundMoodId;
  /** 結果画面などで機嫌そのものを名指しするときの語 */
  label: string;
  /** 作戦を決める画面で示す観察。相手の様子として書く（診断名は書かない） */
  tell: string;
  /** 今日に限って効きやすいタグ */
  likes: Tag[];
  /** 今日に限って触れられたくないタグ */
  hates: Tag[];
}

export const ROUND_MOODS: RoundMood[] = [
  {
    id: 'fine',
    label: '上機嫌',
    tell: '足取りが軽い。今日は機嫌がよさそうだ。',
    likes: ['humor', 'hype', 'bro'],
    hates: [],
  },
  {
    id: 'tired',
    label: '疲れている',
    tell: '顔に疲れが出ている。無理はさせないほうがよさそうだ。',
    likes: ['safe', 'silence', 'distance', 'etiquette'],
    hates: ['hype', 'kiai', 'challenge'],
  },
  {
    id: 'edgy',
    label: '気が立っている',
    tell: '朝から何かあったらしい。言葉に棘がある。',
    likes: ['logic', 'serious', 'honesty'],
    hates: ['flattery', 'over_praise', 'humor'],
  },
  {
    id: 'hungover',
    label: '二日酔い',
    tell: '昨夜は遅かったらしい。動きが重い。',
    likes: ['silence', 'safe_play', 'over_support'],
    hates: ['hype', 'alcohol', 'humor'],
  },
  {
    id: 'riding',
    label: '調子に乗っている',
    tell: '朝イチから飛ばしている。気分がいいらしい。',
    likes: ['flattery', 'over_praise', 'hype'],
    hates: ['logic', 'serious'],
  },
  {
    id: 'unspoken',
    label: '何か言いたそう',
    tell: '時折こちらを見ている。何か言いたいことがあるようだ。',
    likes: ['honesty', 'self_reflect', 'team'],
    hates: ['distance', 'silence', 'neutral'],
  },
];

export const getRoundMood = (id: RoundMoodId | null): RoundMood | null =>
  id ? (ROUND_MOODS.find((m) => m.id === id) ?? null) : null;

/**
 * その日の機嫌を決める。
 *
 * **乱数で引かない。** 作戦を決める画面は戻れる（戻れないと詰む）ので、
 * 毎回引き直すと「上機嫌が出るまで入り直す」が最適手になってしまう。
 * 機嫌ごとの成功率は 23pt 開くので、粘る価値が大きすぎる。
 *
 * 相手と「これまで回った回数」から決めれば、
 * 入り直しても同じ機嫌のままで、1ラウンド回せば変わる。
 *
 * @param characterId 相手
 * @param roundCount これまでのラウンド数（ラウンドごとに増える値なら何でもよい）
 */
export const pickRoundMood = (
  characterId: number,
  roundCount: number
): RoundMoodId => {
  // 線形な式を 6 で割ると偏る。(id*7 + count*3) % 6 は 0 と 3 しか取らず、
  // 定数を大きくしても（40503 % 6 === 3）同じことで、機嫌が2種類で交互になる。
  // シフトと XOR で崩してから丸める。
  let h = Math.imul(characterId, 374761393) + Math.imul(roundCount, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return ROUND_MOODS[h % ROUND_MOODS.length].id;
};

/** 計測用。実プレイでは `pickRoundMood` を使う */
export const rollRoundMood = (rand: () => number = Math.random): RoundMoodId =>
  ROUND_MOODS[Math.floor(rand() * ROUND_MOODS.length)].id;

// ===== 効き幅 =====
//
// キャラ本来の好み（信頼+2/fun+2、地雷 creep+6/信頼-4）を超えない範囲で、
// 難易度をほぼ動かさない組み合わせを選んである。
//
// 契約成功率（技能 1.0/0.8/0.6/0.4/0、各2100ラウンド）:
//   一連の改修より前            97.7 / 82.1 / 61.1 / 42.1 / 12.5
//   機嫌なし・作戦なし          95.3 / 79.5 / 58.7 / 40.9 / 11.5
//   機嫌あり・作戦を適当に選ぶ  91.6 / 79.3 / 60.8 / 42.1 / 12.9
//
// 下4段はほぼ同じで、最上段だけ 95.3 → 91.6 に下がる。
// 貪欲に最善手を取り続けても、二日酔いの日には落ちるということ。
// これは狙いどおりで、機嫌が結果に効いている証拠でもある。
//
// 機嫌ごとの成功率は 49.9%（二日酔い）〜72.8%（上機嫌）と 23pt 開く。
// 同じ相手でも日によって別物になる、という当初の狙いはここで達成している。
// 一方、機嫌を読んで打ち分けることの利得は 2pt 程度しかない。
// 機嫌が乗るのはそのタグを持つ選択肢だけで、相手本来の好みのほうが強いため。
// 腕の見せ所を増やす仕掛けではなく、2回目を変える仕掛けと理解しておく。
export const MOOD_LIKE_TRUST = 3;
export const MOOD_HATE_TRUST = -4;
export const MOOD_HATE_CREEP = 5;
