/**
 * ミニゲームの難易度シミュレーション — 定数を触ったら回す
 *
 * 使い方:  node tools/minigame-sim.js   （プロジェクト直下から）
 *
 * 腕前の違う打ち手（ずれを正規分布で模す）に、旧方式と新方式を同じだけ遊ばせて
 * 結果の分布を並べる。**新方式が旧方式より易しくなっていないこと**を見る。
 *
 * 旧方式の式は 2026-10-02 に撤去したので、ここに写して残してある。
 * 集中力は 50（窓の倍率 1.0）で揃える。
 *
 * 合格の条件:
 *  - 朝イチ: どの腕でも 新PERFECT ≤ 旧PERFECT + 2、新MISS ≥ 旧MISS − 2（パワー 0.8 で）
 *  - パット: どの腕でも 旧in − 15 ≤ 新in ≤ 旧in + 2（正しく読めている前提）
 *
 * ## 2026-10-02 の実測（N=20000、3回回して3回とも合格。表は1回目）
 *
 * 定数:
 *  - teeShot.ts: TEE_WINDOW = { perfect: 0.05, good: 0.14 }、powerWindowScale = 1.15 − 0.3×power（据え置き）
 *  - puttPhysics.ts: CAPTURE_SPEED 38 → 50、SINK_R = CUP_R×0.9（据え置き）、
 *    吸い込みを新設 FUNNEL_R = CUP_R×5、FUNNEL_ACCEL = 800（進む向きに直交する成分だけ）
 *  - findBestStroke は「入る打ち方の重心」を取る形に変えた（以前は領域の端を取っていた）
 *
 * 吸い込みの前（CAPTURE_SPEED 38・吸い込み無し）は パット in 5/15/39（旧 40/66/91）で、
 * 難しすぎて合格の帯から大きく外れていた。狙いのずれ（σ×0.6 ラジアン）だけで
 * 下手の in が 3割を切るため、CAPTURE_SPEED と SINK_R だけでは届かなかった。
 *
 *   朝イチ        旧 P/G/M      新(0.8) P/G/M   新(1.0) P/G/M   新(0.6) P/G/M
 *     下手   σ=0.15   24/ 61/ 15    24/ 36/ 39     22/ 35/ 43     25/ 38/ 37
 *     ふつう  σ=0.08   60/ 40/  0    43/ 47/ 11     41/ 46/ 13     45/ 46/  9
 *     上手   σ=0.04   92/  8/  0    74/ 26/  0     71/ 28/  0     77/ 23/  0
 *
 *   パット        旧 in/lip/miss   新 in/lip/miss（傾斜4種の平均）
 *     下手   σ=0.15   41/ 10/ 50       27/ 22/ 51
 *     ふつう  σ=0.08   66/ 12/ 21       54/ 23/ 23
 *     上手   σ=0.04   91/  8/  1       85/ 11/  4
 *
 * 2回目・3回目のパット新in: 下手 27/28、ふつう 53/54、上手 85/85。
 * 下手の下限（旧in − 15 ≒ 25）との余裕は 2〜3 点しかない。吸い込みや CAPTURE_SPEED を
 * 弱めるとここが先に落ちる。
 */
const { srcRequire } = require('./lib/tsRequire');
const { findBestStroke } = require('./minigame-tests');
const P = srcRequire('logic/puttPhysics.ts');
const T = srcRequire('logic/teeShot.ts');

const N = 20000;
const gauss = () => {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const pct = (n) => ((n / N) * 100).toFixed(0).padStart(3);
const TIERS = [
  { name: '下手', s: 0.15 },
  { name: 'ふつう', s: 0.08 },
  { name: '上手', s: 0.04 },
];

// ===== 朝イチ =====
// 旧: 3段。各段 |ずれ| が窓の内なら 2/1/0 点。窓は 0.10/0.20 × 段の倍率
const OLD_STEPS = [1.35, 1.0, 0.7];
const oldShot = (s) => {
  const scores = OLD_STEPS.map((k) => {
    const a = Math.abs(gauss() * s);
    return a <= 0.1 * k ? 2 : a <= 0.2 * k ? 1 : 0;
  });
  const total = scores.reduce((x, y) => x + y, 0);
  if (total >= 5 && scores[2] === 2) return 'perfect';
  return total >= 3 ? 'good' : 'miss';
};
const newShot = (s, power) =>
  T.judgeTeeShot({ power, impact: T.IMPACT_POS + gauss() * s, focus: 50, talkAnswered: false }).result;

console.log('朝イチ        旧 P/G/M      新(0.8) P/G/M   新(1.0) P/G/M   新(0.6) P/G/M');
let teeOk = true;
for (const t of TIERS) {
  const count = (f) => {
    const c = { perfect: 0, good: 0, miss: 0 };
    for (let i = 0; i < N; i++) c[f()]++;
    return c;
  };
  const o = count(() => oldShot(t.s));
  const n8 = count(() => newShot(t.s, 0.8));
  const n10 = count(() => newShot(t.s, 1.0));
  const n6 = count(() => newShot(t.s, 0.6));
  const fmt = (c) => `${pct(c.perfect)}/${pct(c.good)}/${pct(c.miss)}`;
  const ok = n8.perfect <= o.perfect + 0.02 * N && n8.miss >= o.miss - 0.02 * N;
  if (!ok) teeOk = false;
  console.log(`  ${t.name.padEnd(4)} σ=${t.s}  ${fmt(o)}   ${fmt(n8)}    ${fmt(n10)}    ${fmt(n6)}  ${ok ? '' : '← 易しすぎ'}`);
}

// ===== パット =====
// 旧: 正しい狙いを選べた前提。|強さのずれ| ≤ 0.05 で in、≤ 0.10 で 6割 in / 4割 lip_out
const oldPutt = (s) => {
  const a = Math.abs(gauss() * s);
  if (a <= 0.05) return 'in';
  if (a <= 0.1) return Math.random() < 0.6 ? 'in' : 'lip_out';
  return 'miss';
};
// 新: 最善の打ち方に、強さは σ、向きは σ × 0.6 ラジアンのずれを乗せる
const best = {};
for (const slope of ['flat', 'left', 'right', 'uphill']) best[slope] = findBestStroke(slope);
const newPutt = (s, slope) =>
  P.simulatePutt({
    slope,
    angle: best[slope].angle + gauss() * s * 0.6,
    power: best[slope].power + gauss() * s,
  }).result;

console.log('\nパット        旧 in/lip/miss   新 in/lip/miss（傾斜4種の平均）');
let puttOk = true;
for (const t of TIERS) {
  const o = { in: 0, lip_out: 0, miss: 0 };
  const n = { in: 0, lip_out: 0, miss: 0 };
  for (let i = 0; i < N; i++) {
    o[oldPutt(t.s)]++;
    n[newPutt(t.s, ['flat', 'left', 'right', 'uphill'][i % 4])]++;
  }
  const fmt = (c) => `${pct(c.in)}/${pct(c.lip_out)}/${pct(c.miss)}`;
  const ok = n.in <= o.in + 0.02 * N && n.in >= o.in - 0.15 * N;
  if (!ok) puttOk = false;
  console.log(`  ${t.name.padEnd(4)} σ=${t.s}  ${fmt(o)}      ${fmt(n)}  ${ok ? '' : n.in > o.in ? '← 易しすぎ' : '← 難しすぎ'}`);
}

console.log(`\n判定: 朝イチ ${teeOk ? '合格' : '不合格'} / パット ${puttOk ? '合格' : '不合格'}`);
process.exit(teeOk && puttOk ? 0 : 1);
