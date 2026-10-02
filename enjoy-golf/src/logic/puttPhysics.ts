/**
 * 最終パットの物理。
 *
 * ## なぜ物理にするか
 *
 * 以前は「狙いが正解か × 強さの窓」の表引きで結果を決め、ボールは決め打ちの
 * 曲線を描くだけだった。どう外したかが操作と無関係なので、外しても学べない。
 * 傾斜を一定の力、芝を一定の減速として転がせば、ショート・オーバー・
 * 曲がりすぎがすべて自分の打ち方の結果になる。
 *
 * ## 座標
 *
 * グリーンを 0〜100 の正方形に置く（`PuttGreenView` と同じ空間）。
 * y は下向き。ボールは手前（下）から奥（上）のカップへ打つ。
 *
 * 乱数は使わない。集中力のブレは呼び出し側が角度・強さに混ぜてから渡す。
 * 同じ入力なら必ず同じ軌跡になるので、テストと調整ができる。
 */

import { PuttResult, SlopeType } from '../types';
import { focusWindowScale } from './engine';

export type Vec = [number, number];

export const PUTT_BALL_START: Vec = [50, 86];
export const PUTT_CUP: Vec = [50, 22];
/** カップの半径（描画の縁と同じ） */
export const CUP_R = 2.2;
/** グリーンの楕円。ここを出たらカラーで止まる扱い */
export const GREEN = { cx: 50, cy: 54, rx: 38, ry: 40 } as const;

/** 強さ 1.0 で打ち出したときの初速（単位/秒） */
const VMAX = 125;
/** 芝の抵抗（減速、単位/秒²）。平らで強さ1なら約130進んで止まる */
const FRICTION = 60;
/**
 * 傾斜の加速度（単位/秒²）。上りは手前向き（+y）の力として扱う。
 * 芝の抵抗より小さくしてあるので、止まりかけたボールが傾斜で転がり続けることはない
 */
const SLOPE_ACCEL: Record<SlopeType, Vec> = {
  flat: [0, 0],
  left: [-14, 0],
  right: [14, 0],
  uphill: [0, 22],
};
/** これより遅くカップの上を通れば沈む。速いと縁に蹴られる */
const CAPTURE_SPEED = 38;
/** 中心がここまで近づけば「カップの上を通った」 */
const SINK_R = CUP_R * 0.9;
/** 中心がここまで近づけば縁にかかった（lip_out） */
const RIM_R = CUP_R + 0.9;
const DT = 1 / 120;
const MAX_STEPS = 120 * 8;
/** 軌跡は2刻みに1点だけ残す（1点 = 1/60 秒） */
const PATH_EVERY = 2;
/** 1点あたりの再生時間（ms）。軌跡の点数 × これ で実時間どおりに転がる */
export const PATH_POINT_MS = (DT * PATH_EVERY) * 1000;

export interface PuttStroke {
  slope: SlopeType;
  /** 打ち出しの向き（ラジアン）。0 = まっすぐ奥、正 = 右 */
  angle: number;
  /** 0〜1 */
  power: number;
}

export interface PuttSim {
  path: Vec[];
  result: PuttResult;
}

const insideGreen = (x: number, y: number): boolean =>
  ((x - GREEN.cx) / GREEN.rx) ** 2 + ((y - GREEN.cy) / GREEN.ry) ** 2 <= 1.05;

export const simulatePutt = ({ slope, angle, power }: PuttStroke): PuttSim => {
  const p = Math.max(0, Math.min(1, power));
  let [x, y] = PUTT_BALL_START;
  let vx = Math.sin(angle) * p * VMAX;
  let vy = -Math.cos(angle) * p * VMAX;
  const [ax, ay] = SLOPE_ACCEL[slope];
  const path: Vec[] = [[x, y]];
  let closest = Infinity;

  for (let i = 0; i < MAX_STEPS; i++) {
    const speed = Math.hypot(vx, vy);
    // 抵抗で止まりきる刻み。ここで向きが反転させないよう、止める
    if (speed <= FRICTION * DT) break;
    vx += (-(vx / speed) * FRICTION + ax) * DT;
    vy += (-(vy / speed) * FRICTION + ay) * DT;
    x += vx * DT;
    y += vy * DT;

    const d = Math.hypot(x - PUTT_CUP[0], y - PUTT_CUP[1]);
    if (d <= SINK_R && Math.hypot(vx, vy) <= CAPTURE_SPEED) {
      path.push([...PUTT_CUP] as Vec);
      return { path, result: 'in' };
    }
    closest = Math.min(closest, d);
    if (i % PATH_EVERY === 0) path.push([x, y]);
    if (!insideGreen(x, y)) break;
  }
  const last = path[path.length - 1];
  if (last[0] !== x || last[1] !== y) path.push([x, y]);
  return { path, result: closest <= RIM_R ? 'lip_out' : 'miss' };
};

/**
 * 引いた量（px）からストロークを作る。引いた向きの反対へ打ち出す。
 *
 * 前（上）へ引いた、または真横すぎる（60度超）ときは null（打たない）。
 * `maxDragPx` 以上引いても強さは 1 で頭打ち。
 */
export const strokeFromDrag = (
  dx: number,
  dy: number,
  maxDragPx: number
): { angle: number; power: number } | null => {
  if (dy <= 0) return null;
  const angle = Math.atan2(-dx, dy);
  if (Math.abs(angle) > Math.PI / 3) return null;
  const power = Math.min(1, Math.hypot(dx, dy) / maxDragPx);
  return { angle, power };
};

/**
 * 集中力によるブレの幅。集中力 100 で 0、0 で最大。
 *
 * 朝イチの判定窓と同じ `focusWindowScale`（0.6〜1.4）から作るので、
 * 「会話で集中を削ると自分のプレーが決まらない」の効き方が揃う。
 * 角度は画面の方向線の揺れとして見せ、離した瞬間の揺れがそのまま乗る。
 * 強さは見えないブレとして離した瞬間に一様乱数で乗せる。
 */
export const focusJitter = (focus: number): { angle: number; power: number } => {
  const j = (1.4 - focusWindowScale(focus)) / 0.8;
  return { angle: 0.05 * j, power: 0.04 * j };
};
