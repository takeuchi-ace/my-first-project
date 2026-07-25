/**
 * 摩耗（Wear）システム — 累積型隠しパラメータ
 *
 * - 自己抑圧系タグで上昇、誠実系タグ/ラウンド完了/契約で減少
 * - 閾値 40/70/90 で間接的にゲームプレイに影響
 *   - mismatch率上昇（相手の反応がチグハグになりやすい）
 *   - entertain score 減少（90+）
 *   - insight 抑制（70+）
 * - 70+ で内なる声、60+ で ACE ヒント
 */

import { Tag } from '../types';

// ===== Wear delta from tags =====

const WEAR_UP_TAGS: Record<string, number> = {
  self_suppress: 2,
  over_adjust: 2,
  over_flatter: 4,
  forced_laugh: 4,
};

const WEAR_DOWN_TAGS: Record<string, number> = {
  honesty: -1,
  sportsmanship: -1,
};

/**
 * タグリストから摩耗増減値を計算
 * 正値 = 摩耗増加、負値 = 摩耗回復
 */
export const calcWearDelta = (tags: Tag[]): number => {
  let delta = 0;
  for (const tag of tags) {
    delta += WEAR_UP_TAGS[tag] ?? 0;
    delta += WEAR_DOWN_TAGS[tag] ?? 0;
  }
  return delta;
};

// ===== Wear → mismatch率ボーナス =====

/**
 * 現在の wear 値に応じた mismatchRate 加算値
 *   0-39: 0
 *  40-69: +0.05
 *  70-89: +0.10
 *    90+: +0.10
 */
export const getWearMismatchBonus = (wear: number): number => {
  if (wear >= 70) return 0.10;
  if (wear >= 40) return 0.05;
  return 0;
};

// ===== Wear → entertain score 補正 =====

/**
 * 90+ で entertainScore を 5% 減算
 */
export const getWearScoreMultiplier = (wear: number): number => {
  if (wear >= 90) return 0.95;
  return 1.0;
};

// ===== Wear → insight 抑制確率 =====

/**
 * wear が高いほど insight が発動しにくくなる
 *  70-89: 20% の確率で抑制
 *    90+: 50% の確率で抑制
 */
export const shouldSuppressInsight = (wear: number): boolean => {
  if (wear >= 90) return Math.random() < 0.50;
  if (wear >= 70) return Math.random() < 0.20;
  return false;
};

// ===== 内なる声 =====

const INNER_VOICE_70: string[] = [
  '…本当にこれでいいのか？',
  '…自分を殺しすぎてないか。',
  '…笑顔が引きつっている気がする。',
];

const INNER_VOICE_90: string[] = [
  '…もう限界かもしれない。',
  '…誰のためにやってるんだ、これ。',
  '…何を楽しめばいいんだ。',
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * 内なる声を返す（70+: 15%、90+: 30%）
 * null = 発動なし
 */
export const rollInnerVoice = (wear: number): string | null => {
  if (wear >= 90 && Math.random() < 0.30) {
    return pick(INNER_VOICE_90);
  }
  if (wear >= 70 && Math.random() < 0.15) {
    return pick(INNER_VOICE_70);
  }
  return null;
};

// ===== ACE ヒント =====

/**
 * wear>=60 のとき ACE に相談すると表示されるヒントテキスト
 */
export const getWearHint = (wear: number): string | null => {
  if (wear >= 90) {
    return '…少し疲れているようですね。無理は禁物ですよ。';
  }
  if (wear >= 60) {
    return '自分らしさを大切に。それが一番の武器です。';
  }
  return null;
};

// ===== ラウンド終了時の回復量 =====

/** ラウンド完了: -3 */
export const WEAR_ROUND_END = -3;
/** 契約成功: -5 */
export const WEAR_CONTRACT = -5;
/** ACEラウンド完了: -15 */
export const WEAR_ACE_ROUND = -15;
