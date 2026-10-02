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
 *  - パット: どの腕でも 新in ≤ 旧in + 2（正しく読めている前提）。
 *    下限 旧in − 15 ≤ 新in は **ふつう・上手だけ**にかける
 *
 * ## なぜ下手にはパットの下限をかけないか
 *
 * 旧方式は「狙いが正解か」の三択で、正解を選べば狙いのずれはゼロだった。物理にすると
 * 指の向きのずれがそのまま外れになり、下手（σ=0.15）のずれはカップの位置で約6にもなる。
 * これを吸い込みで吸えるほど強くすると、同じ力で傾斜の曲がりも吸ってしまい、
 * **左右の傾斜でカップへまっすぐ打っても入る**ようになる（グリーンを読む意味が無くなる）。
 * 実測では、下手の in を 25 以上にできる設定は、どれもまっすぐ打って入る強さが
 * 左右合わせて 92 通り中 22〜28 通りあった。
 * このプロジェクトの決まりは「旧より易しくしない」で、難しくなるのは許す。
 * なので下手は上限だけを守り、読む意味の方を残した。
 *
 * ## 2026-10-02 の実測（N=20000、3回回して3回とも合格。表は1回目）
 *
 * 定数:
 *  - teeShot.ts: TEE_WINDOW = { perfect: 0.05, good: 0.14 }、powerWindowScale = 1.15 − 0.3×power（据え置き）
 *  - puttPhysics.ts: CAPTURE_SPEED 38 → 54、SINK_R = CUP_R×0.9（据え置き）、
 *    吸い込みを新設 FUNNEL_R = CUP_R×5、FUNNEL_ACCEL = 800、FUNNEL_MAX_TURN = 0.6 ラジアン
 *    （近づいている間だけ・進む向きに直交する成分だけ・速さは変えない）
 *    左右の傾斜でまっすぐ打って入る強さが 0 通りの範囲で、いちばん強い組み合わせ。
 *    FUNNEL_MAX_TURN は 0.5 だと ふつう が下限ちょうど（51）で回すたびに合否が揺れたので 0.6
 *  - findBestStroke は「入る打ち方の重心」を取る形に変えた（以前は領域の端を取っていた）。
 *    そのため、下の数字と吸い込みの前の数字（パット in 5/15/39、旧 40/66/91）は
 *    物差しが違い、そのままは比べられない（同じ重心の物差しで吸い込み無しだと 6/17/51）
 *
 *   朝イチ        旧 P/G/M      新(0.8) P/G/M   新(1.0) P/G/M   新(0.6) P/G/M
 *     下手   σ=0.15   23/ 61/ 15    24/ 36/ 40     23/ 35/ 43     25/ 38/ 36
 *     ふつう  σ=0.08   60/ 40/  0    43/ 46/ 11     40/ 46/ 14     45/ 46/  9
 *     上手   σ=0.04   92/  8/  0    74/ 25/  0     71/ 28/  0     77/ 23/  0
 *
 *   パット        旧 in/lip/miss   新 in/lip/miss（傾斜4種の平均）
 *     下手   σ=0.15   41/  9/ 50       20/ 19/ 61
 *     ふつう  σ=0.08   66/ 13/ 21       52/ 18/ 30
 *     上手   σ=0.04   90/  8/  1       91/  4/  6
 *
 * 2回目・3回目のパット新in: 下手 21/20、ふつう 53/52、上手 91/90。
 * 余裕が薄いのは ふつう の下限（旧in − 15 ≒ 51）で 1〜2 点、上手 の上限（旧in + 2 ≒ 93）で 2 点。
 * 吸い込みを弱めると ふつう が、CAPTURE_SPEED を上げると 上手 が先に外れる。
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
  // 下限は ふつう・上手 だけ（下手は上限だけ。理由は冒頭のコメント）
  const lowerOk = t.name === '下手' || n.in >= o.in - 0.15 * N;
  const ok = n.in <= o.in + 0.02 * N && lowerOk;
  if (!ok) puttOk = false;
  console.log(`  ${t.name.padEnd(4)} σ=${t.s}  ${fmt(o)}      ${fmt(n)}  ${ok ? '' : n.in > o.in ? '← 易しすぎ' : '← 難しすぎ'}`);
}

console.log(`\n判定: 朝イチ ${teeOk ? '合格' : '不合格'} / パット ${puttOk ? '合格' : '不合格'}`);
process.exit(teeOk && puttOk ? 0 : 1);
