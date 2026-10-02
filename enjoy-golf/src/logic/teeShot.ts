/**
 * 朝イチのショット（3タップ）の判定。
 *
 * ## 操作
 *
 * 1回目のタップでバーが 0 から伸び、2回目でパワーが決まる。
 * バーはそこから折り返して戻り、左端寄りの印（`IMPACT_POS`）で3回目を押すのがインパクト。
 *
 * ## なぜこの形か
 *
 * 以前は「動くバーを中央で止める」を3回やるだけで、速くなる以外の違いが無かった。
 * パワーを自分で選ばせると、**相手より飛ばすか**という接待の判断が一打に乗る。
 * 飛ばすほどインパクトが狭くなり、刻めば PERFECT を捨てることになる。
 *
 * 乱数は使わない。画面（`TeeShotMeter`）が押した位置を渡すだけ。
 */

import { MorningShotResult, OwnShotResult } from '../types';
import { focusWindowScale } from './engine';

/** インパクトの印の位置（バーの 0〜1）。左端に寄せ、遅れて押す余地も残す */
export const IMPACT_POS = 0.18;
/** これ未満のパワーは「刻み」。PERFECT は出ない */
export const LAYBACK_POWER = 0.55;
/** インパクトの判定窓（印からの片側幅）。集中力とパワーで伸縮する */
export const TEE_WINDOW = { perfect: 0.05, good: 0.14 };

/** パワーが高いほど窓を狭める。0.5 で 1.0 倍、1.0 で 0.85 倍 */
export const powerWindowScale = (power: number): number => 1.15 - 0.3 * power;

export const teeShotWindow = (focus: number, power: number) => {
  const s = focusWindowScale(focus) * powerWindowScale(power);
  return { perfect: TEE_WINDOW.perfect * s, good: TEE_WINDOW.good * s };
};

const QUALITY: Record<OwnShotResult, number> = { perfect: 1, good: 0.9, miss: 0.6 };

export interface TeeShotInput {
  power: number;
  /** 3回目を押したときのバーの位置。押さずに通り過ぎたら null */
  impact: number | null;
  focus: number;
  talkAnswered: boolean;
}

export interface TeeShotOutcome {
  result: OwnShotResult;
  /** 0〜1。相手の到達点と同じ物差し */
  distance: number;
  /** -1〜1。正 = スライス（右）、負 = フック（左）。PERFECT の窓の中は 0（真っ直ぐ）で、窓の縁から外へ向けて曲がる */
  curve: number;
}

export const judgeTeeShot = ({ power: rawPower, impact, focus, talkAnswered }: TeeShotInput): TeeShotOutcome => {
  const power = Math.max(0, Math.min(1, rawPower));
  const w = teeShotWindow(focus, power);
  const off = impact === null ? -w.good * 2 : impact - IMPACT_POS;
  const a = Math.abs(off);
  let result: OwnShotResult = a <= w.perfect ? 'perfect' : a <= w.good ? 'good' : 'miss';
  // 応じた一打・刻んだ一打では PERFECT を出さない（譲った分は自分の一打で払う）
  if (result === 'perfect' && (talkAnswered || power < LAYBACK_POWER)) result = 'good';
  const bend = Math.max(0, Math.min(1, (a - w.perfect) / (w.good - w.perfect)));
  return {
    result,
    distance: power * QUALITY[result],
    curve: bend === 0 ? 0 : Math.sign(off) * bend, // -0 を作らない
  };
};

/**
 * 相手のティーショットの到達点（パワーと同じ物差し）。
 * 直前の相手のショット結果から決める。OB は比べる相手が無い
 */
export const opponentDrive = (shot: MorningShotResult | null): number | null =>
  shot === 'great' ? 0.8 : shot === 'normal' ? 0.62 : null;

/** 相手を越えたか。比べる相手が無ければ null。同じ飛距離（引き分け）は「越えていない」 */
export const didOutdrive = (distance: number, opp: number | null): boolean | null =>
  opp === null ? null : distance > opp;
