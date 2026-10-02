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

import { PuttAim, PuttResult, SlopeType } from '../types';
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
const CAPTURE_SPEED = 54;
/** 中心がここまで近づけば「カップの上を通った」 */
const SINK_R = CUP_R * 0.9;
/** 中心がここまで近づけば縁にかかった（lip_out） */
const RIM_R = CUP_R + 0.9;
/**
 * 縁に最も近づいた瞬間の速さがこれ以上なら lip_out（縁をかすめて越えた）。
 * これより遅い＝縁の手前で力尽きて止まっただけなので、ショートの miss とする。
 * 「入りそうで入らなかった」演出は、勢いが残っていたときだけ出したい。
 */
const LIP_MIN_SPEED = 10;
/**
 * カップの「吸い込み」。中心からこの距離の内側を通るボールを、カップの方へ曲げる。
 *
 * ## なぜ要るか
 *
 * - 旧方式は「狙いが正解か」の三択で、正解を選べば狙いのずれはゼロだった。
 *   物理にすると、指の向きのずれがそのまま外れになる。
 * - 打点からカップまで 64 離れ、カップは半径 2.2。まっすぐ入る向きは打点から
 *   ±1.7度ほどしかない。これだけだと、強さが完璧でも下手な打ち手は3割も入らない。
 * - スマホのゴルフでは、縁に寄ったボールがカップへ吸い込まれるのが定番の手触り。
 *
 * ## 効き方
 *
 * 1刻みごとに、芝の抵抗と傾斜をかけた後で次のように向きだけを曲げる。
 * - **カップへ近づいている間だけ**効く（進む向きとカップへの向きの内積 `along` > 0）。
 *   強さは `FUNNEL_ACCEL * (1 - d / FUNNEL_R) * along`。縁ほど弱く、
 *   ボールがカップの横に並ぶにつれて 0 へ落ちる。通り過ぎた後は効かない
 * - 加えるのはカップへの向きのうち**進む向きに直交する成分だけ**で、加えた後に
 *   速さを元へ揃え直す。向きが変わるだけで、前へ押すことも速くすることもない。
 *   手前で止まりかけたボールを引きずり込まないので「縁の手前で止まったら miss」はそのまま
 * - 速いボールは輪をすぐ抜けるのでほとんど曲がらない。強さの加減は残る
 * - 1打で曲げる量の合計は `FUNNEL_MAX_TURN`（0.6 ラジアン ≒ 34度）まで。
 *   これが無いと、引かれ続けたボールがカップを追いかけて回り込み、
 *   1〜2周してから落ちる（磁石のように見える）
 *
 * ## 強さの上限を決めたもの
 *
 * 吸い込みを強くすると、下手な打ち手の狙いのずれ（カップの位置で約6）を吸うのと同じだけ
 * 傾斜の曲がりも吸い、**左右の傾斜でカップへまっすぐ打っても入る**ようになる。
 * それではグリーンを読む意味が無くなるので、まっすぐ打って入る強さが一つも無い範囲で
 * いちばん強い値にしてある（tools/minigame-tests.js のテストで固定）。
 * そのぶん下手な打ち手の in は旧方式より 15 点以上低い（tools/minigame-sim.js）。
 *
 * 見た目のカップ（`CUP_R`）は変えない。
 */
const FUNNEL_R = CUP_R * 5;
/** 吸い込みの強さ（単位/秒²）。中心での値 */
const FUNNEL_ACCEL = 800;
/** 吸い込みで向きが変わる量の、1打あたりの上限（ラジアン）。カップを追いかけて回り込ませない */
const FUNNEL_MAX_TURN = 0.6;
const DT = 1 / 120;
const MAX_STEPS = 120 * 8;
/** 軌跡は2刻みに1点だけ残す（1点 = 1/60 秒） */
const PATH_EVERY = 2;
/** 1点あたりの再生時間（ms）。軌跡の点数 × これ で実時間どおりに転がる */
export const PATH_POINT_MS = (DT * PATH_EVERY) * 1000;

/**
 * 会話の3択で選んだ線の「向きのヒント」（ラジアン。左が負、正が右。simulatePutt の angle と同じ向き）。
 *
 * ## なぜ 5 度か
 *
 * 左右の傾斜で入るのは、まっすぐ（0度）から約 0.3〜11.5 度ずれた向きだけで、いちばん余裕があるのは 2〜7 度。
 * 以前はガイドをカップの左右 14 先の点に引いていたが、それは約 12.7 度で、正解の線を信じて
 * そのまま打つと入らなかった。地点ではなく向きだけを示すので、打点からカップまでの距離
 * （縦 64）に対して横へ 5.6 ずれる向き＝約 5 度にしてある（tools/minigame-tests.js で固定）。
 */
export const PUTT_GUIDE_ANGLE: Record<PuttAim, number> = {
  left: -Math.atan2(5.6, PUTT_BALL_START[1] - PUTT_CUP[1]),
  center: 0,
  right: Math.atan2(5.6, PUTT_BALL_START[1] - PUTT_CUP[1]),
};

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
  let speedAtClosest = 0;
  /** 吸い込みでここまでに曲げた量（ラジアン） */
  let funnelTurn = 0;

  for (let i = 0; i < MAX_STEPS; i++) {
    const speed = Math.hypot(vx, vy);
    // 抵抗で止まりきる刻み。ここで向きが反転させないよう、止める
    if (speed <= FRICTION * DT) break;
    const ux = vx / speed;
    const uy = vy / speed;
    vx += (-ux * FRICTION + ax) * DT;
    vy += (-uy * FRICTION + ay) * DT;
    // 吸い込み: カップへ近づいている間だけ、カップへの向きのうち進む向きに直交する成分を足す
    const dx0 = PUTT_CUP[0] - x;
    const dy0 = PUTT_CUP[1] - y;
    const d0 = Math.hypot(dx0, dy0);
    if (d0 > 0 && d0 < FUNNEL_R) {
      const cx = dx0 / d0;
      const cy = dy0 / d0;
      const along = cx * ux + cy * uy;
      if (along > 0 && funnelTurn < FUNNEL_MAX_TURN) {
        // 真っ直ぐカップへ向かうほど強く、横に並ぶにつれて 0 へ（並んだ後は効かない）
        const k = FUNNEL_ACCEL * (1 - d0 / FUNNEL_R) * along * DT;
        const s0 = Math.hypot(vx, vy);
        const nx = vx + k * (cx - along * ux);
        const ny = vy + k * (cy - along * uy);
        // 向きを変えるだけで速さは足さない（刻みの誤差で速くならないよう揃え直す）
        const s1 = Math.hypot(nx, ny);
        let turn = Math.acos(Math.max(-1, Math.min(1, (nx * vx + ny * vy) / (s1 * s0))));
        let tx = nx / s1;
        let ty = ny / s1;
        if (funnelTurn + turn > FUNNEL_MAX_TURN) {
          // 上限を超える分は曲げない（上限ちょうどまで回す）
          const allow = FUNNEL_MAX_TURN - funnelTurn;
          const sign = Math.sign(vx * ny - vy * nx);
          const c = Math.cos(allow * sign);
          const sn = Math.sin(allow * sign);
          tx = (vx * c - vy * sn) / s0;
          ty = (vx * sn + vy * c) / s0;
          turn = allow;
        }
        funnelTurn += turn;
        vx = tx * s0;
        vy = ty * s0;
      }
    }
    x += vx * DT;
    y += vy * DT;

    const d = Math.hypot(x - PUTT_CUP[0], y - PUTT_CUP[1]);
    if (d <= SINK_R && Math.hypot(vx, vy) <= CAPTURE_SPEED) {
      path.push([...PUTT_CUP] as Vec);
      return { path, result: 'in' };
    }
    if (d < closest) {
      closest = d;
      speedAtClosest = Math.hypot(vx, vy);
    }
    if ((i + 1) % PATH_EVERY === 0) path.push([x, y]);
    if (!insideGreen(x, y)) break;
  }
  const last = path[path.length - 1];
  if (last[0] !== x || last[1] !== y) path.push([x, y]);
  return { path, result: closest <= RIM_R && speedAtClosest >= LIP_MIN_SPEED ? 'lip_out' : 'miss',
  };
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
