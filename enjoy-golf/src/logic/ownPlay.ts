/**
 * こちらの腕（朝イチのショット・最終パット）に相手がどう反応するか
 *
 * ## なぜ相手ごとに変えるか
 *
 * 以前はミニゲームの結果を**相手のゴルフのスコア**にだけ効かせていた
 * （PERFECT で4打・パットが入って6打）。二つ問題があった。
 *
 * 1. **動きすぎ**。自分が打っただけで相手の18Hが10打縮む
 * 2. **全員同じ**。上手いことが常に得なので、相手を知る意味が生まれない
 *
 * 接待ゴルフでは「上手いこと」が必ず得にはならない。相手より目立つのを嫌う人
 * （大門）、褒める材料が増えて喜ぶ人（ナイス松本）、下手なほうが可愛がる人（ミツキ）がいる。
 * ここを相手ごとに変えると、**ミニゲームが接待の一部になる**。
 *
 * スコア（打数）への効きは半分に落とし（`minigameScoreEffect`）、
 * 主な結果を接待ポイント＝ゲージ側に移してある。
 *
 * ## 表の読み方
 *
 * どの値も `applyMinigameResult` を通すので、キャラの `traitModifiers` が乗る。
 * creep は使わない（腕の善し悪しは「距離の詰めすぎ」ではない）。
 */

import { Gauge, OwnPlayStance, OwnShotResult, PuttResult } from '../types';

/** 朝イチのショットへの反応 */
const SHOT: Record<OwnPlayStance, Record<OwnShotResult, Partial<Gauge>>> = {
  // 腕を認める。決めれば大きく、外せば冷める
  respects: {
    perfect: { trust: 6, fun: 2 },
    good: { trust: 2, fun: 1 },
    miss: { trust: -3 },
  },
  // 腕は見ていない。外しても崩れず、場が動くだけ
  indifferent: {
    perfect: { trust: 1, fun: 3 },
    good: { trust: 1, fun: 1 },
    miss: { fun: 2 },
  },
  // 自分が上に立ちたい／世話をしたい。外すほど機嫌が良くなる
  prefersLead: {
    perfect: { trust: -2, fun: 1 },
    good: { trust: 1 },
    miss: { trust: 5, fun: 3 },
  },
};

/** 最終パットへの反応。締めの一打なので朝イチより大きい */
const PUTT: Record<OwnPlayStance, Record<PuttResult, Partial<Gauge>>> = {
  respects: {
    in: { trust: 8, fun: 3 },
    lip_out: { trust: 2, fun: 2 },
    miss: { trust: -4 },
  },
  indifferent: {
    in: { trust: 2, fun: 4 },
    lip_out: { trust: 1, fun: 3 },
    miss: { fun: 2 },
  },
  prefersLead: {
    in: { trust: -3, fun: 2 },
    lip_out: { trust: 2, fun: 2 },
    miss: { trust: 7, fun: 4 },
  },
};

export const ownShotReaction = (
  stance: OwnPlayStance,
  result: OwnShotResult
): Partial<Gauge> => SHOT[stance][result];

export const puttOwnReaction = (
  stance: OwnPlayStance,
  result: PuttResult
): Partial<Gauge> => PUTT[stance][result];

/**
 * 反応の中身から表情を決める。
 *
 * 結果（PERFECT / MISS）から直に決めると、外して喜ぶ相手のときに
 * 「機嫌が悪い顔＋嬉しそうなセリフ」になる。信頼がどう動いたかで決める。
 */
export const reactionMood = (delta: Partial<Gauge>): 1 | 2 | 3 | 4 | 5 => {
  const t = delta.trust ?? 0;
  if (t >= 5) return 5;
  if (t >= 1) return 4;
  if (t <= -3) return 2;
  if (t < 0) return 3;
  return 3;
};

/**
 * ショットに対する相手の一言。
 *
 * 構え方で中身が変わらないと、外して喜ぶ相手が「…いい球でしたね」と言い出す。
 * 田中・鬼塚には元から専用の文があるので、そちらを優先する（呼び出し側で分岐）。
 */
const SHOT_LINES: Record<OwnPlayStance, Record<OwnShotResult, string>> = {
  respects: {
    perfect: '{name}が目を細めた。「…いい球です」',
    good: '{name}が小さく頷いた。',
    miss: '{name}は何も言わなかった。',
  },
  indifferent: {
    perfect: '{name}が「お、やりますね」と笑った。',
    good: '{name}が軽く頷いた。',
    miss: '{name}が「まあ、こういう日もありますよ」と流した。',
  },
  prefersLead: {
    perfect: '{name}が一瞬だけ黙った。「…上手いんですね」',
    good: '{name}が「まあまあですね」と言った。',
    miss: '{name}が身を乗り出した。「もっとこう、振らないと」',
  },
};

export const ownShotLine = (
  stance: OwnPlayStance,
  result: OwnShotResult,
  name: string
): string => SHOT_LINES[stance][result].replace('{name}', name);
