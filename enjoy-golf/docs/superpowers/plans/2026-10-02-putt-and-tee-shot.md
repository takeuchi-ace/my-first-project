# パットと朝イチショット作り直し 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 最終パットを「グリーン上で引いて打ち、物理で転がる」形に、朝イチを「3タップ＋相手との飛ばし合い」に作り直す。難易度は下げない。

**Architecture:** 判定は画面から切り離した純粋関数（`src/logic/puttPhysics.ts` / `src/logic/teeShot.ts`）に置き、node スクリプトで検証・調整する。画面側は新コンポーネント（`TeeShotMeter`）と作り直した `PuttGreenView` が入力を受けて純粋関数に渡し、結果を再生するだけ。結果の型（`OwnShotResult` / `PuttResult`）は変えないので、相手の反応表・打数・エンジンは触らない。

**Tech Stack:** Expo 54 / React Native 0.81 / react-native-svg / TypeScript 5.9。テストランナーは無いので、`node:assert` と TypeScript の `transpileModule` で .ts を読む node スクリプト（`tools/regression.js` と同じ流儀）。

**設計書:** `docs/superpowers/specs/2026-10-02-putt-and-tee-shot-design.md`

---

## 全体の注意（必読）

- **git root は親の `~/おもちゃ箱`。** `git add -A` は絶対に使わない。コミットは毎回 `cd ~/おもちゃ箱 && pwd &&` を先頭に付け、`enjoy-golf/...` の明示パスで add する
- コマンドは特記なき限り `~/おもちゃ箱/enjoy-golf` で実行する
- **難易度を下げる方向の調整はしない**（引き継ぎメモ「触ってはいけないもの」）
- コメントは周りのコードに合わせて日本語で、「なぜそうしたか」を書く
- `GameScreenSimple.tsx` は 3500 行ある。行番号は目安。必ず該当箇所を `grep -n` で探してから編集する

## ファイル構成

| ファイル | 種別 | 責務 |
|---|---|---|
| `tools/lib/tsRequire.js` | 新規 | node から .ts を require できるようにする（`regression.js` と同じ仕組みの共通化） |
| `tools/minigame-tests.js` | 新規 | 2つの純粋関数のテスト（`node:assert`） |
| `tools/minigame-sim.js` | 新規 | 腕前別に新旧の結果分布を並べる調整用シミュレーション |
| `src/logic/puttPhysics.ts` | 新規 | パットの物理・ドラッグ→ストローク変換・集中力ブレ |
| `src/logic/teeShot.ts` | 新規 | 3タップの判定・飛距離・曲がり・相手の到達点 |
| `src/logic/ownPlay.ts` | 変更 | `outdriveReaction` を追加 |
| `src/components/PuttGreenView.tsx` | 作り直し | グリーン描画・引いて打つ入力・軌跡の再生 |
| `src/components/TeeShotMeter.tsx` | 新規 | 3タップのメーター |
| `src/components/MorningShotView.tsx` | 変更 | 飛距離と曲がりから着地点を出す・相手の球を置く |
| `src/screens/GameScreenSimple.tsx` | 変更 | 旧ミニゲームの撤去と新部品の接続 |
| `tools/regression.js` | 変更 | 飛ばし合いの増減を足す |

---

### Task 1: 共通ローダーと基準値

**Files:**
- Create: `tools/lib/tsRequire.js`

- [ ] **Step 1: ローダーを書く**

```js
/**
 * node から src/ の .ts を require できるようにする。
 *
 * tools/regression.js と同じ仕組み（TypeScript の transpileModule で CommonJS に落とす）。
 * テストとシミュレーションで同じものを使うので、ここに一つだけ置く。
 * regression.js は「数値を比べる基準」なので触らずにそのまま残す。
 */
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const ts = require(path.join(ROOT, 'node_modules/typescript'));

if (!require.extensions['.ts']) {
  require.extensions['.ts'] = function (m, f) {
    m._compile(
      ts.transpileModule(fs.readFileSync(f, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
        fileName: f,
      }).outputText,
      f
    );
  };
}

/** `src/` からの相対パスで読む。例: srcRequire('logic/puttPhysics.ts') */
const srcRequire = (p) => require(path.join(ROOT, 'src', p));

module.exports = { srcRequire };
```

- [ ] **Step 2: 変更前の契約率の基準値を取る**

Run: `node tools/regression.js`（数分かかる）
Expected: `契約成功率 a / b / c / d / e %` が出る。**この5つの数字と「触れたイベント」の数を控えておく**（Task 5 と Task 11 で比べる）。ハングは 0、相談ラウンドは 200/200。

- [ ] **Step 3: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/tools/lib/tsRequire.js && git commit -m "tools に .ts を読む共通ローダーを置く

変更前の契約成功率: <Step 2 の5つの数字をここに書く>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: パットの物理（`puttPhysics.ts`）

**Files:**
- Create: `src/logic/puttPhysics.ts`
- Create: `tools/minigame-tests.js`

- [ ] **Step 1: 失敗するテストを書く**

`tools/minigame-tests.js`:

```js
/**
 * ミニゲームの純粋関数のテスト。
 *
 * 使い方:  node tools/minigame-tests.js   （プロジェクト直下から）
 * 失敗すると assert が投げて終了コード 1 で止まる。
 */
const assert = require('node:assert/strict');
const { srcRequire } = require('./lib/tsRequire');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ===== パット =====
const P = srcRequire('logic/puttPhysics.ts');

/** 傾斜ごとに「入る打ち方」を総当たりで探す。テストとシミュレーションで使う */
const findBestStroke = (slope) => {
  let best = null;
  for (let a = -0.5; a <= 0.5; a += 0.005) {
    for (let p = 0.3; p <= 1.0; p += 0.005) {
      if (P.simulatePutt({ slope, angle: a, power: p }).result !== 'in') continue;
      // 入る打ち方のうち、周りも入る（余裕がある）ものを選ぶ
      let score = 0;
      for (const [da, dp] of [[0.01, 0], [-0.01, 0], [0, 0.02], [0, -0.02]]) {
        if (P.simulatePutt({ slope, angle: a + da, power: p + dp }).result === 'in') score++;
      }
      if (!best || score > best.score) best = { angle: a, power: p, score };
    }
  }
  return best;
};

test('どの傾斜にも入る打ち方がある', () => {
  for (const slope of ['flat', 'left', 'right', 'uphill']) {
    assert.ok(findBestStroke(slope), `${slope} で入る打ち方が無い`);
  }
});

test('平らでまっすぐ・弱すぎるとショートで miss', () => {
  const r = P.simulatePutt({ slope: 'flat', angle: 0, power: 0.2 });
  assert.equal(r.result, 'miss');
  const last = r.path[r.path.length - 1];
  assert.ok(last[1] > P.PUTT_CUP[1], 'カップより手前で止まるはず');
});

test('平らでまっすぐ・強すぎるとカップの上を通っても入らない', () => {
  const r = P.simulatePutt({ slope: 'flat', angle: 0, power: 1.0 });
  assert.equal(r.result, 'lip_out');
});

test('大きく外すと miss', () => {
  assert.equal(P.simulatePutt({ slope: 'flat', angle: 0.4, power: 0.7 }).result, 'miss');
});

test('左傾斜ではまっすぐ打つと左へ流れる', () => {
  const r = P.simulatePutt({ slope: 'left', angle: 0, power: 0.7 });
  const last = r.path[r.path.length - 1];
  assert.ok(last[0] < P.PUTT_BALL_START[0], '左に流れていない');
});

test('左傾斜の正解は右へ打ち出す（右傾斜は左）', () => {
  assert.ok(findBestStroke('left').angle > 0);
  assert.ok(findBestStroke('right').angle < 0);
});

test('上りは平らより強く打つ必要がある', () => {
  assert.ok(findBestStroke('uphill').power > findBestStroke('flat').power);
});

test('入ったら軌跡の最後はカップの中心', () => {
  const b = findBestStroke('flat');
  const r = P.simulatePutt({ slope: 'flat', angle: b.angle, power: b.power });
  assert.deepEqual(r.path[r.path.length - 1], P.PUTT_CUP);
});

test('ドラッグ: 真下に引くとまっすぐ上へ', () => {
  const s = P.strokeFromDrag(0, 100, 200);
  assert.ok(Math.abs(s.angle) < 1e-9);
  assert.equal(s.power, 0.5);
});

test('ドラッグ: 左下に引くと右へ打ち出す', () => {
  assert.ok(P.strokeFromDrag(-30, 100, 200).angle > 0);
});

test('ドラッグ: 引き量は上限で頭打ち', () => {
  assert.equal(P.strokeFromDrag(0, 999, 200).power, 1);
});

test('ドラッグ: 前（上）へ引いたら打たない', () => {
  assert.equal(P.strokeFromDrag(0, -50, 200), null);
});

test('集中力が高いほどブレが小さい', () => {
  const lo = P.focusJitter(10);
  const hi = P.focusJitter(90);
  assert.ok(lo.angle > hi.angle && lo.power > hi.power);
  assert.ok(P.focusJitter(100).angle === 0);
});

module.exports = { findBestStroke };

if (require.main === module) {
  let failed = 0;
  for (const t of tests) {
    try {
      t.fn();
      console.log('  ok  ' + t.name);
    } catch (e) {
      failed++;
      console.log('  NG  ' + t.name + '\n      ' + e.message);
    }
  }
  console.log(failed ? `${failed} 件失敗` : `全 ${tests.length} 件成功`);
  process.exit(failed ? 1 : 0);
}
```

- [ ] **Step 2: 失敗を確かめる**

Run: `node tools/minigame-tests.js`
Expected: `Cannot find module .../src/logic/puttPhysics.ts` で落ちる

- [ ] **Step 3: 実装する**

`src/logic/puttPhysics.ts`:

```ts
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
export const GREEN = { cx: 50, cy: 50, rx: 38, ry: 32 } as const;

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
```

- [ ] **Step 4: 通ることを確かめる**

Run: `node tools/minigame-tests.js`
Expected: `全 13 件成功`

通らないものがあれば、テストではなく定数（`VMAX` / `FRICTION` / `SLOPE_ACCEL` / `CAPTURE_SPEED`）を見直す。テストは設計書の振る舞いそのもの。ただし「強さ1.0で lip_out」が通らない場合は、強さ1.0だとカップの縁を外れて miss になっている可能性がある（まっすぐ打てば中心を通るので本来 lip_out になる）。軌跡の最接近距離を出して確かめる。

- [ ] **Step 5: 型を確かめる**

Run: `npx tsc --noEmit`
Expected: 何も出ない

- [ ] **Step 6: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/src/logic/puttPhysics.ts enjoy-golf/tools/minigame-tests.js && git commit -m "パットの物理を純粋関数として置く

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 朝イチの判定（`teeShot.ts`）と飛ばし合いの反応

**Files:**
- Create: `src/logic/teeShot.ts`
- Modify: `src/logic/ownPlay.ts`（`puttOwnReaction` の直後に追加）
- Modify: `tools/minigame-tests.js`

- [ ] **Step 1: 失敗するテストを足す**

`tools/minigame-tests.js` の `module.exports = { findBestStroke };` の**直前**に追加:

```js
// ===== 朝イチ =====
const T = srcRequire('logic/teeShot.ts');
const OP = srcRequire('logic/ownPlay.ts');

const judge = (o) =>
  T.judgeTeeShot({ power: 0.8, impact: T.IMPACT_POS, focus: 50, talkAnswered: false, ...o });

test('印ぴったりで PERFECT', () => {
  assert.equal(judge({}).result, 'perfect');
});

test('窓の外で MISS、押さずに通り過ぎても MISS', () => {
  assert.equal(judge({ impact: T.IMPACT_POS + 0.5 }).result, 'miss');
  assert.equal(judge({ impact: null }).result, 'miss');
});

test('話しかけに応じたら PERFECT は GOOD に落ちる', () => {
  assert.equal(judge({ talkAnswered: true }).result, 'good');
});

test('刻む（パワーが下限未満）と PERFECT は GOOD に落ちる', () => {
  assert.equal(judge({ power: T.LAYBACK_POWER - 0.01 }).result, 'good');
});

test('パワーが高いほどインパクトの窓が狭い', () => {
  assert.ok(T.teeShotWindow(50, 1.0).perfect < T.teeShotWindow(50, 0.6).perfect);
});

test('集中力が低いほどインパクトの窓が狭い', () => {
  assert.ok(T.teeShotWindow(10, 0.8).good < T.teeShotWindow(90, 0.8).good);
});

test('飛距離はパワー×出来', () => {
  assert.equal(judge({ power: 0.8 }).distance, 0.8);
  assert.equal(judge({ power: 0.8, impact: null }).distance, 0.8 * 0.6);
});

test('早く押すとスライス（正）、遅く押すとフック（負）', () => {
  assert.ok(judge({ impact: T.IMPACT_POS + 0.03 }).curve > 0);
  assert.ok(judge({ impact: T.IMPACT_POS - 0.03 }).curve < 0);
  assert.equal(judge({}).curve, 0);
});

test('相手が OB なら飛ばし合いは無し', () => {
  assert.equal(T.didOutdrive(0.9, T.opponentDrive('ob')), null);
  assert.equal(T.didOutdrive(0.9, T.opponentDrive('great')), true);
  assert.equal(T.didOutdrive(0.7, T.opponentDrive('great')), false);
});

test('飛ばし合いの反応は相手の型で逆になる', () => {
  assert.deepEqual(OP.outdriveReaction('respects', true), { trust: 2 });
  assert.deepEqual(OP.outdriveReaction('prefersLead', true), { trust: -3 });
  assert.deepEqual(OP.outdriveReaction('prefersLead', false), { trust: 2 });
  assert.deepEqual(OP.outdriveReaction('indifferent', true), {});
  assert.deepEqual(OP.outdriveReaction('respects', null), {});
});
```

- [ ] **Step 2: 失敗を確かめる**

Run: `node tools/minigame-tests.js`
Expected: `Cannot find module .../src/logic/teeShot.ts` で落ちる

- [ ] **Step 3: `teeShot.ts` を実装する**

```ts
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
  /** -1〜1。正 = スライス（右）、負 = フック（左） */
  curve: number;
}

export const judgeTeeShot = ({ power, impact, focus, talkAnswered }: TeeShotInput): TeeShotOutcome => {
  const w = teeShotWindow(focus, power);
  const off = impact === null ? -w.good * 2 : impact - IMPACT_POS;
  const a = Math.abs(off);
  let result: OwnShotResult = a <= w.perfect ? 'perfect' : a <= w.good ? 'good' : 'miss';
  // 応じた一打・刻んだ一打では PERFECT を出さない（譲った分は自分の一打で払う）
  if (result === 'perfect' && (talkAnswered || power < LAYBACK_POWER)) result = 'good';
  return {
    result,
    distance: power * QUALITY[result],
    curve: Math.max(-1, Math.min(1, off / w.good)),
  };
};

/**
 * 相手のティーショットの到達点（パワーと同じ物差し）。
 * 直前の相手のショット結果から決める。OB は比べる相手が無い
 */
export const opponentDrive = (shot: MorningShotResult | null): number | null =>
  shot === 'great' ? 0.8 : shot === 'normal' ? 0.62 : null;

/** 相手を越えたか。比べる相手が無ければ null */
export const didOutdrive = (distance: number, opp: number | null): boolean | null =>
  opp === null ? null : distance > opp;
```

- [ ] **Step 4: `ownPlay.ts` に `outdriveReaction` を足す**

`src/logic/ownPlay.ts` の `puttOwnReaction` の定義の直後に追加:

```ts
/**
 * 朝イチで相手の球を越えたかへの反応（ショットの出来への反応に上乗せする）。
 *
 * 腕を認める相手は越えれば喜び、上に立ちたい相手は越えられると面白くない。
 * 気にしない相手は動かない。値は小さくしてある（出来への反応が主）。
 * 比べる相手が無い（相手が OB）ときは null で、何も動かさない。
 */
const OUTDRIVE: Record<OwnPlayStance, Record<'over' | 'under', Partial<Gauge>>> = {
  respects: { over: { trust: 2 }, under: { trust: -1 } },
  indifferent: { over: {}, under: {} },
  prefersLead: { over: { trust: -3 }, under: { trust: 2 } },
};

export const outdriveReaction = (
  stance: OwnPlayStance,
  outdrove: boolean | null
): Partial<Gauge> => (outdrove === null ? {} : OUTDRIVE[stance][outdrove ? 'over' : 'under']);

/** 2つの反応を足し合わせる（applyMinigameResult に一度で渡すため） */
export const sumReactions = (a: Partial<Gauge>, b: Partial<Gauge>): Partial<Gauge> => {
  const out: Partial<Gauge> = { ...a };
  for (const k of Object.keys(b) as (keyof Gauge)[]) {
    out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  }
  return out;
};
```

テストにも1件足す（Step 1 のブロックの末尾）:

```js
test('反応の足し合わせ', () => {
  assert.deepEqual(OP.sumReactions({ trust: 6, fun: 2 }, { trust: -3 }), { trust: 3, fun: 2 });
});
```

- [ ] **Step 5: 通ることを確かめる**

Run: `node tools/minigame-tests.js && npx tsc --noEmit`
Expected: `全 24 件成功`、tsc は何も出ない

- [ ] **Step 6: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/src/logic/teeShot.ts enjoy-golf/src/logic/ownPlay.ts enjoy-golf/tools/minigame-tests.js && git commit -m "朝イチの3タップ判定と飛ばし合いの反応を置く

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 難易度のシミュレーションと調整

**Files:**
- Create: `tools/minigame-sim.js`
- Modify（調整が要れば）: `src/logic/puttPhysics.ts` の定数、`src/logic/teeShot.ts` の `TEE_WINDOW` / `powerWindowScale`

- [ ] **Step 1: シミュレーションを書く**

`tools/minigame-sim.js`:

```js
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
```

- [ ] **Step 2: 回す**

Run: `node tools/minigame-sim.js`
Expected: 表が出て、最後に `判定: 朝イチ ○ / パット ○`

- [ ] **Step 3: 不合格なら定数を詰める**

詰め方（**易しくする方向へは動かさない**。合格の帯に入る最小の変更にする）:

- 朝イチが「易しすぎ」→ `TEE_WINDOW.perfect` を 0.005 刻みで狭める。MISS が少なすぎるなら `TEE_WINDOW.good` を 0.01 刻みで狭める
- パットが「易しすぎ」→ `CAPTURE_SPEED` を 2 刻みで下げる（沈む速さの幅が狭まる）
- パットが「難しすぎ」→ `CAPTURE_SPEED` を 2 刻みで上げる。それでも足りなければ `SINK_R` を `CUP_R * 1.0` まで
- 定数を変えたら `node tools/minigame-tests.js` も回し、24件成功のままか確かめる

- [ ] **Step 4: 合格の表を控える**

最終の表を、`tools/minigame-sim.js` の冒頭コメントの末尾に「2026-10-02 の実測」として貼る（`regression.js` と同じく、次に触った人が比べられるように）。

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/tools/minigame-sim.js enjoy-golf/src/logic/puttPhysics.ts enjoy-golf/src/logic/teeShot.ts && git commit -m "ミニゲームの難易度シミュレーションを置き、旧方式より易しくならない所で定数を決める

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 回帰ハーネスに飛ばし合いを足す

**Files:**
- Modify: `tools/regression.js`（`morning_shot_` の分岐）

- [ ] **Step 1: 分岐を書き換える**

`tools/regression.js` の

```js
    if (e.id.startsWith('morning_shot_')) {
      const r = pk(mg, 'perfect', 'good', 'miss');
      st = engine.applyMinigameResult(st, OP.ownShotReaction(c.ownPlayStance, r));
      st = { ...st, ownShot: r };
    }
```

を次に置き換える:

```js
    if (e.id.startsWith('morning_shot_')) {
      let r = pk(mg, 'perfect', 'good', 'miss');
      // 飛ばし合い（2026-10-02〜）。会話の腕 sk の確率で相手の型に合った方を選ぶ
      // （腕を認める・気にしない相手には飛ばす、上に立ちたい相手には刻む）。
      // 刻めば PERFECT は出ず、越えない。飛ばしても MISS なら越えない
      const wantsOver = c.ownPlayStance === 'prefersLead' ? Math.random() >= sk : Math.random() < sk;
      if (!wantsOver && r === 'perfect') r = 'good';
      const opp = st.morningShot === 'ob' ? null : true;
      const outdrove = opp === null ? null : wantsOver && r !== 'miss';
      st = engine.applyMinigameResult(
        st,
        OP.sumReactions(OP.ownShotReaction(c.ownPlayStance, r), OP.outdriveReaction(c.ownPlayStance, outdrove))
      );
      st = { ...st, ownShot: r };
    }
```

また、冒頭コメントの「見るもの」の下に1行足す:

```js
 * ※ 2026-10-02 から朝イチに飛ばし合い（outdriveReaction）を含む。それより前の基準値とは条件が違う。
```

- [ ] **Step 2: 回して比べる**

Run: `node tools/regression.js`
Expected: ハング 0、相談ラウンド 200/200。契約成功率5段階を Task 1 の基準値と並べる。

**判断の目安:** 各段の差が ±3 ポイント以内なら、飛ばし合いの値（設計書の表）はそのまま。上振れ（易しくなった）が +3 を超える段があれば、`OUTDRIVE` の「越えた/越えなかった」の正の値を 1 ずつ下げて回し直す。下振れが −3 を超えるなら、そのまま止めて人に報告する（難しくなる方向は禁止ではないが、決着済みの実測値が崩れていないか人が判断する）。

- [ ] **Step 3: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/tools/regression.js enjoy-golf/src/logic/ownPlay.ts && git commit -m "回帰ハーネスに朝イチの飛ばし合いを足す

契約成功率 変更前: <Task 1 の値> → 変更後: <今回の値>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `PuttGreenView` を作り直す

**Files:**
- Rewrite: `src/components/PuttGreenView.tsx`

- [ ] **Step 1: ファイル全体を置き換える**

```tsx
/**
 * PuttGreenView — 最終パットのグリーン。引いて打つ入力と、転がりの再生を受け持つ
 *
 * - 入力: グリーンのどこからでも指を置いて**後ろへ引き、離して打つ**。
 *   引いた向きの反対へ打ち出し、引いた長さが強さ（`strokeFromDrag`）。
 *   ボールに正確に触れなくてよいのは、小さな球を指で隠してしまうと引く向きが見えないため。
 * - 引いている間は、打ち出し方向の短い線だけを出す。曲がりは見せない（読むのはプレイヤー）。
 *   集中力が低いと線が揺れ、離した瞬間の揺れがそのまま向きに乗る。
 * - 再生: 親が `playback`（`simulatePutt` の軌跡）を渡すと、実時間どおりに転がす。
 *   判定は持たない。結果は親が `simulatePutt` から受け取っている。
 *
 * PanResponder は Capture 版で取る。親は ScrollView なので、取らないとドラッグを
 * スクロールに奪われる（親側でもこの画面の間はスクロールを止めている）。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { PuttAim, SlopeType } from '../types';
import {
  CUP_R,
  GREEN,
  PATH_POINT_MS,
  PUTT_BALL_START,
  PUTT_CUP,
  Vec,
  focusJitter,
  strokeFromDrag,
} from '../logic/puttPhysics';

interface Props {
  slope: SlopeType;
  /** 会話の3択で選んだ線。淡いガイドとして出すだけで、打つ向きは縛らない */
  guideAim: PuttAim;
  focus: number;
  width: number;
  height: number;
  /** false の間は触れない（転がり中・結果表示中） */
  interactive: boolean;
  /** 離して打ったとき。強さのブレは親が乗せる */
  onStroke: (stroke: { angle: number; power: number }) => void;
  /** 再生する軌跡。null の間はボールはスタート位置 */
  playback: { path: Vec[]; sink: boolean } | null;
  onPlaybackDone?: () => void;
}

/** これ未満の引きは誤タップとみなして打たない */
const MIN_POWER = 0.06;

const GUIDE_TARGET: Record<PuttAim, Vec> = {
  left: [36, 24],
  center: [50, 22],
  right: [64, 24],
};

/** 傾斜の向きだけを示す矢印。量は示さない */
function SlopeArrows({ slope }: { slope: SlopeType }) {
  if (slope === 'flat') return null;
  const dx = slope === 'left' ? -1 : slope === 'right' ? 1 : 0;
  const dy = slope === 'uphill' ? 1 : 0;
  const positions: Vec[] = [
    [32, 50],
    [68, 50],
    [50, 66],
  ];
  return (
    <G opacity={0.45}>
      {positions.map(([cx, cy], i) => {
        const x2 = cx + dx * 3;
        const y2 = cy + dy * 3;
        const nx = -dy;
        const ny = dx;
        return (
          <G key={i}>
            <Path
              d={`M ${cx - dx * 3} ${cy - dy * 3} L ${x2} ${y2}`}
              stroke="#ffffff"
              strokeWidth={0.6}
              strokeLinecap="round"
            />
            <Path
              d={`M ${x2 + dx * 1.4} ${y2 + dy * 1.4} L ${x2 + nx * 1.2} ${y2 + ny * 1.2} L ${x2 - nx * 1.2} ${y2 - ny * 1.2} Z`}
              fill="#ffffff"
            />
          </G>
        );
      })}
    </G>
  );
}

export function PuttGreenView({
  slope,
  guideAim,
  focus,
  width,
  height,
  interactive,
  onStroke,
  playback,
  onPlaybackDone,
}: Props) {
  const scale = Math.min(width / 100, height / 100);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;
  /** 指をこれだけ引けば強さ 1。グリーンの半分弱 */
  const maxDragPx = 100 * scale * 0.45;

  // ===== 入力 =====
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const onStrokeRef = useRef(onStroke);
  onStrokeRef.current = onStroke;

  // 方向線の揺れ。引いている間だけ進める
  const jitterAmp = focusJitter(focus).angle;
  const [wobbleT, setWobbleT] = useState(0);
  const wobbleRef = useRef(0);
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging || jitterAmp === 0) return;
    const id = setInterval(() => setWobbleT((t) => t + 0.05), 50);
    return () => clearInterval(id);
  }, [dragging, jitterAmp]);
  const wobble = jitterAmp * Math.sin(wobbleT * 5);
  wobbleRef.current = wobble;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactiveRef.current,
        onStartShouldSetPanResponderCapture: () => interactiveRef.current,
        onMoveShouldSetPanResponder: () => interactiveRef.current,
        onMoveShouldSetPanResponderCapture: () => interactiveRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragRef.current = { dx: 0, dy: 0 };
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderMove: (_e, g) => {
          dragRef.current = { dx: g.dx, dy: g.dy };
          setDrag({ dx: g.dx, dy: g.dy });
        },
        onPanResponderRelease: () => {
          const d = dragRef.current;
          dragRef.current = null;
          setDrag(null);
          if (!d || !interactiveRef.current) return;
          const s = strokeFromDrag(d.dx, d.dy, maxDragPx);
          if (!s || s.power < MIN_POWER) return;
          onStrokeRef.current({ angle: s.angle + wobbleRef.current, power: s.power });
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          setDrag(null);
        },
      }),
    [maxDragPx]
  );

  const preview = drag ? strokeFromDrag(drag.dx, drag.dy, maxDragPx) : null;

  // ===== 再生 =====
  const t = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onPlaybackDone);
  onDoneRef.current = onPlaybackDone;

  /** 再生用に間引いた点（多すぎると interpolate が重い） */
  const samples = useMemo(() => {
    if (!playback) return null;
    const p = playback.path;
    const step = Math.max(1, Math.ceil(p.length / 60));
    const out: Vec[] = [];
    for (let i = 0; i < p.length; i += step) out.push(p[i]);
    if (out[out.length - 1] !== p[p.length - 1]) out.push(p[p.length - 1]);
    return out;
  }, [playback]);

  useEffect(() => {
    t.setValue(0);
    if (!playback) return;
    const duration = Math.max(600, Math.min(3500, playback.path.length * PATH_POINT_MS));
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) onDoneRef.current?.();
    });
    return () => anim.stop();
  }, [playback, t]);

  const toPxX = (x: number) => offsetX + x * scale;
  const toPxY = (y: number) => offsetY + y * scale;

  const inputRange = samples ? samples.map((_, i) => i / Math.max(1, samples.length - 1)) : [0, 1];
  const ballX = samples
    ? t.interpolate({ inputRange, outputRange: samples.map((p) => toPxX(p[0])) })
    : toPxX(PUTT_BALL_START[0]);
  const ballY = samples
    ? t.interpolate({ inputRange, outputRange: samples.map((p) => toPxY(p[1])) })
    : toPxY(PUTT_BALL_START[1]);
  const ballScale = playback?.sink
    ? t.interpolate({ inputRange: [0, 0.94, 1], outputRange: [1, 1, 0] })
    : 1;

  const BALL_PX = Math.max(7, scale * 2.2);

  // 方向線（打ち出し方向のみ。長さは強さに比例）
  const [bx, by] = PUTT_BALL_START;
  let aimLine: string | null = null;
  let pullLine: string | null = null;
  if (preview && drag) {
    const a = preview.angle + wobble;
    const len = 6 + preview.power * 16;
    aimLine = `M ${bx} ${by} L ${bx + Math.sin(a) * len} ${by - Math.cos(a) * len}`;
    pullLine = `M ${bx} ${by} L ${bx + drag.dx / scale} ${by + drag.dy / scale}`;
  }

  return (
    <View style={{ width, height }} {...pan.panHandlers}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="puttRough" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#22663a" />
            <Stop offset="100%" stopColor="#143a22" />
          </LinearGradient>
          <LinearGradient id="puttGreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a8e289" />
            <Stop offset="100%" stopColor="#7bbe5e" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#puttRough)" />
        {/* x/y/scale ではなく標準の transform で指定する。react-native-svg 15 は
            web で scale を transform-origin という無効な DOM 属性に変換し、
            React が毎描画で警告を出していた */}
        <G transform={`translate(${offsetX},${offsetY}) scale(${scale})`}>
          <Ellipse
            cx={GREEN.cx}
            cy={GREEN.cy}
            rx={GREEN.rx}
            ry={GREEN.ry}
            fill="url(#puttGreen)"
            stroke="#5d9b48"
            strokeWidth={0.8}
          />
          <SlopeArrows slope={slope} />
          {/* 会話で口にした線。打つ向きは縛らない */}
          <Path
            d={`M ${bx} ${by} L ${GUIDE_TARGET[guideAim][0]} ${GUIDE_TARGET[guideAim][1]}`}
            stroke="rgba(255, 215, 0, 0.35)"
            strokeWidth={0.5}
            strokeDasharray="1.5,1.5"
          />
          <Circle cx={PUTT_CUP[0]} cy={PUTT_CUP[1]} r={CUP_R} fill="#5d4014" />
          <Circle cx={PUTT_CUP[0]} cy={PUTT_CUP[1]} r={CUP_R * 0.73} fill="#0c0c0c" />
          <Rect x={PUTT_CUP[0] - 0.2} y={PUTT_CUP[1] - 12} width={0.4} height={12} fill="#f1f1f1" />
          <Path
            d={`M ${PUTT_CUP[0]} ${PUTT_CUP[1] - 12} L ${PUTT_CUP[0] + 5} ${PUTT_CUP[1] - 10.5} L ${PUTT_CUP[0]} ${PUTT_CUP[1] - 9} Z`}
            fill="#e63946"
          />
          {pullLine && (
            <Path d={pullLine} stroke="rgba(255,255,255,0.35)" strokeWidth={0.6} strokeDasharray="1,1" />
          )}
          {aimLine && <Path d={aimLine} stroke="#FFD700" strokeWidth={0.9} strokeLinecap="round" />}
        </G>
      </Svg>

      <View style={styles.slopeBadge} pointerEvents="none">
        <Text style={styles.slopeBadgeText}>{slopeLabel(slope)}</Text>
      </View>

      {preview && (
        <View style={styles.powerBadge} pointerEvents="none">
          <Text style={styles.powerBadgeText}>強さ {Math.round(preview.power * 100)}</Text>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ball,
          {
            left: ballX,
            top: ballY,
            width: BALL_PX,
            height: BALL_PX,
            borderRadius: BALL_PX / 2,
            marginLeft: -BALL_PX / 2,
            marginTop: -BALL_PX / 2,
            transform: [{ scale: ballScale }],
          },
        ]}
      />
    </View>
  );
}

function slopeLabel(slope: SlopeType): string {
  switch (slope) {
    case 'left':
      return '◀ 左に傾斜';
    case 'right':
      return '右に傾斜 ▶';
    case 'flat':
      return '・ 平坦 ・';
    case 'uphill':
      return '▲ 上り';
  }
}

const styles = StyleSheet.create({
  slopeBadge: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' },
  slopeBadgeText: {
    color: '#F5E6C8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  powerBadge: { position: 'absolute', bottom: 6, right: 8 },
  powerBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ball: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#cccccc',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 1.2,
    shadowOffset: { width: 0, height: 1 },
  },
});
```

- [ ] **Step 2: 型を見る（GameScreen 側がまだ古い props なのでエラーが出るのは想定内）**

Run: `npx tsc --noEmit 2>&1 | grep -v GameScreenSimple`
Expected: `PuttGreenView.tsx` 由来のエラーが無い

- [ ] **Step 3: コミットは Task 7 と一緒に行う**（単独では画面が壊れるため）

---

### Task 7: パットを画面につなぐ

**Files:**
- Modify: `src/screens/GameScreenSimple.tsx`

- [ ] **Step 1: 撤去するものを撤去する**

`grep -n` で探して削除する:

- 定数 `PUTT_WINDOW`、`PUTT_POWER_TARGET`（とその上のコメント）、`powerZoneStyle`
- state/ref: `puttZone`、`puttPull` / `setPuttPull`、`puttPullRef`、`puttGaugeWidth`（とコメント）、`puttInPerfectRef`、`PUTT_PULL_MIN`
- 「パットの引きをリセット」の `useEffect`（`if (puttPhase !== 'power_tap') return;` で始まるもの）
- `calcPuttResult`、`handlePuttRelease`、`puttPan`（とその上のコメント）
- render の `{puttPhase === 'power_tap' && ( ... )}` ブロックのうち、`styles.puttPullArea` の `View` 以下（説明の `eventBox` は Step 4 で書き換える）
- styles の `puttPullArea` / `puttPullGaugeWrap` / `puttPullGauge` / `puttPullZone*` / `puttPullFill` / `puttPullMarker`

- [ ] **Step 2: 段の型と state を変える**

```ts
// 旧: type PuttPhase = 'power_tap' | 'result' | null;
/**
 * stroke: グリーン上で引いて打つ / rolling: 転がっている / result: 結果と相手の反応
 */
type PuttPhase = 'stroke' | 'rolling' | 'result' | null;
```

`puttResultLabel` の state の近くに追加:

```ts
  /** 転がりの軌跡と結果。打った瞬間に決まり、転がり終わってから結果を出す */
  const [puttPlay, setPuttPlay] = useState<PuttSim | null>(null);
```

import に追加:

```ts
import { PuttSim, simulatePutt, focusJitter } from '../logic/puttPhysics';
```

`setPuttPhase('power_tap')` を `setPuttPhase('stroke')` に、その直前に `setPuttPlay(null);` を足す。`swingLockedRef.current = false;` も同じ場所で戻す（旧リセット effect が担っていた）。

- [ ] **Step 3: 打つ・転がり終わるのハンドラを書く**

`calcPuttResult` があった場所に:

```ts
  /**
   * 離して打った。向きのブレは画面が揺れとして乗せ済みなので、
   * ここでは見えない強さのブレだけを足す。軌跡と結果はこの時点で決まる
   */
  const handlePuttStroke = useCallback(
    (stroke: { angle: number; power: number }) => {
      if (swingLockedRef.current || puttPhase !== 'stroke' || !puttSlopeInfo) return;
      swingLockedRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const jitter = focusJitter(puttFocus).power;
      const power = stroke.power + (Math.random() * 2 - 1) * jitter;
      setPuttPlay(simulatePutt({ slope: puttSlopeInfo.slope, angle: stroke.angle, power }));
      setPuttPhase('rolling');
    },
    [puttPhase, puttSlopeInfo, puttFocus]
  );

  /** 転がり終わってから結果を出す（先に出すと、転がる前に答えが見えてしまう） */
  const handlePuttRolled = useCallback(() => {
    if (!puttPlay) return;
    const result = puttPlay.result;
    setPuttResultLabel(result === 'in' ? 'カップイン！' : result === 'lip_out' ? 'LIP-OUT...' : 'MISS...');
    playSfx(result === 'in' ? 'cupIn' : 'cupMiss');
    setPuttResultText(getPuttReactionText(characterId, result));
    // 締めの一打も相手の構え方で効き方が変わる。表情は信頼の動きから
    const delta = puttOwnReaction(character.ownPlayStance, result);
    setMood(reactionMood(delta));
    const base = pendingPuttState;
    if (base) {
      // engine 経由で反映する（キャラの traitModifiers を効かせるため）
      setPendingPuttState({ ...applyMinigameResult(base, delta), puttResult: result });
    }
    setPuttPhase('result');
  }, [puttPlay, characterId, character.ownPlayStance, pendingPuttState]);
```

- [ ] **Step 4: render を書き換える**

パット画面の `<ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>` を:

```tsx
        {/* 引いている間にスクロールされると打てない。グリーンが出ている間は止める */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={puttPhase === 'result'}
        >
```

顔の `marginVertical` と `scale` の条件 `puttPhase === 'power_tap'` を `puttPhase !== 'result'` に変える。

`PuttGreenView` の呼び出しを:

```tsx
          {puttSlopeInfo && (
            <View style={styles.puttGreenViewWrap}>
              <PuttGreenView
                slope={puttSlopeInfo.slope}
                guideAim={puttAimToValue(puttAimIndex)}
                focus={puttFocus}
                width={puttGreenSize}
                height={puttGreenSize}
                interactive={puttPhase === 'stroke'}
                onStroke={handlePuttStroke}
                playback={puttPlay ? { path: puttPlay.path, sink: puttPlay.result === 'in' } : null}
                onPlaybackDone={handlePuttRolled}
              />
            </View>
          )}
```

`puttGaugeWidth` があった場所に:

```ts
  /** グリーンは画面幅いっぱい（左右16の余白）。高すぎる端末でも 420 で止める */
  const puttGreenSize = Math.min(420, windowWidth - 32);
```

`{puttPhase === 'power_tap' && (` のブロックを次に置き換える:

```tsx
          {puttPhase === 'stroke' && (
            <View style={styles.eventBox}>
              <View style={styles.puttBadge}>
                <Text style={styles.puttBadgeText}>最終パット</Text>
              </View>
              <Text style={styles.eventBoxTitle}>引いて、離す</Text>
              <Text style={styles.eventBoxDesc}>
                打ちたい向きと反対へ指を引く。長く引くほど強い
              </Text>
            </View>
          )}
```

`puttPhase === 'result'` の結果表示はそのまま。

- [ ] **Step 5: 型を確かめる**

Run: `npx tsc --noEmit`
Expected: 何も出ない。`PuttResult` / `PuttPower` / `PuttAim` の未使用 import が残っていれば消す

- [ ] **Step 6: Web で通しで遊ぶ**

`preview_start`（name: `enjoy-golf-web`）→ 1ラウンドを最終パットまで進める。375 幅（`resize_window` mobile）で:
- 引くと金色の方向線と「強さ NN」が出る。前（上）へ引いても打たない
- 離すとボールが転がり、止まってから結果ラベルと相手の反応が出る
- 引いている間、画面がスクロールしない
- 結果のあと次へ進む（既存の `puttPhase === 'result'` の effect）

- [ ] **Step 7: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/src/components/PuttGreenView.tsx enjoy-golf/src/screens/GameScreenSimple.tsx && git commit -m "最終パットをグリーン上で引いて打つ形にし、物理で転がす

狙い（会話の3択）と強さ（横ゲージ）が分かれ、結果は表引きだった。
引いた向きと長さで打ち、傾斜と芝の抵抗で転がった先で結果が決まる。
会話の3択は社交の選択として残し、グリーンには淡いガイドとして出すだけ。

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `TeeShotMeter`（3タップのメーター）

**Files:**
- Create: `src/components/TeeShotMeter.tsx`

- [ ] **Step 1: 書く**

```tsx
/**
 * TeeShotMeter — 朝イチの3タップ（スイング開始 → パワー → インパクト）
 *
 * 判定は持たない。押した位置（パワー・インパクト）を親に渡すだけで、
 * 結果は親が `judgeTeeShot` で決める。
 *
 * バーの上には、判定に使う数値そのものから描いた印を置く:
 *  - インパクトの窓（集中力とパワーで伸縮。パワーが決まるまでは強さ1の最も狭い幅）
 *  - 刻みの境（`LAYBACK_POWER`。これより手前で止めると PERFECT は出ない）
 *  - 相手の球の到達点（OB のときは出さない）
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IMPACT_POS, LAYBACK_POWER, teeShotWindow } from '../logic/teeShot';
import { playSfx } from '../lib/sound';

interface Props {
  focus: number;
  /** 相手の到達点（0〜1）。null なら印を出さない */
  opponentDrive: number | null;
  opponentName: string;
  onDone: (shot: { power: number; impact: number | null }) => void;
}

type Phase = 'ready' | 'up' | 'down' | 'done';

/** 0 → 1 に伸びきるまで */
const UP_MS = 1000;
/** 戻りの速さ（バー 1 ぶん戻るのにかかる時間）。伸びより速く、インパクトを難しくする */
const DOWN_MS_PER_UNIT = 700;
/** バーはここまで戻って止まる（印を通り過ぎた＝押し損ね） */
const BAR_END = -0.03;

const pct = (v: number) => `${v * 100}%` as `${number}%`;

export function TeeShotMeter({ focus, opponentDrive, opponentName, onDone }: Props) {
  const pos = useRef(new Animated.Value(0)).current;
  const posRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhase] = useState<Phase>('ready');
  const [power, setPower] = useState<number | null>(null);
  const powerRef = useRef(1);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = pos.addListener(({ value }) => {
      posRef.current = value;
    });
    return () => {
      pos.removeListener(id);
      animRef.current?.stop();
    };
  }, [pos]);

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const finish = (impact: number | null) => {
    go('done');
    onDoneRef.current({ power: powerRef.current, impact });
  };

  const startDown = () => {
    go('down');
    const from = powerRef.current;
    const anim = Animated.timing(pos, {
      toValue: BAR_END,
      duration: Math.max(1, (from - BAR_END) * DOWN_MS_PER_UNIT),
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current = anim;
    // stop() でも呼ばれる（finished=false）。段が変わっていれば何もしない
    anim.start(({ finished }) => {
      if (finished && phaseRef.current === 'down') finish(null);
    });
  };

  const handleTap = () => {
    const p = phaseRef.current;
    if (p === 'ready') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSfx('tap');
      go('up');
      pos.setValue(0);
      const anim = Animated.timing(pos, {
        toValue: 1,
        duration: UP_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      animRef.current = anim;
      // 押さずに伸びきったら全力で確定して折り返す
      anim.start(({ finished }) => {
        if (finished && phaseRef.current === 'up') {
          powerRef.current = 1;
          setPower(1);
          startDown();
        }
      });
      return;
    }
    if (p === 'up') {
      animRef.current?.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      powerRef.current = posRef.current;
      setPower(posRef.current);
      startDown();
      return;
    }
    if (p === 'down') {
      animRef.current?.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      finish(posRef.current);
    }
  };

  const w = teeShotWindow(focus, power ?? 1);
  const zone = (half: number) => ({
    left: pct(Math.max(0, IMPACT_POS - half)),
    width: pct(IMPACT_POS + half - Math.max(0, IMPACT_POS - half)),
  });

  const hint =
    phase === 'ready'
      ? 'タップで振り始める'
      : phase === 'up'
        ? 'もう一度タップでパワーを決める'
        : phase === 'down'
          ? '戻ってきたら印でタップ！'
          : '';

  return (
    // onPress は指を離したときに来るので、タイミングを取る操作では遅れる。押した瞬間で取る
    <Pressable style={styles.area} onPressIn={handleTap} disabled={phase === 'done'}>
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.labels}>
        <Text style={styles.label}>インパクト</Text>
        <Text style={styles.label}>パワー →</Text>
      </View>

      <View style={styles.track}>
        {/* 刻みの域。ここで止めると PERFECT は出ない */}
        <View style={[styles.layback, { left: 0, width: pct(LAYBACK_POWER) }]} />
        <View style={[styles.zone, styles.zoneGood, zone(w.good)]} />
        <View style={[styles.zone, styles.zonePerfect, zone(w.perfect)]} />
        <View style={[styles.impactMark, { left: pct(IMPACT_POS) }]} />
        {opponentDrive !== null && (
          <View style={[styles.oppMark, { left: pct(opponentDrive) }]} />
        )}
        {power !== null && <View style={[styles.powerMark, { left: pct(power) }]} />}
        <Animated.View
          style={[
            styles.indicator,
            {
              left: pos.interpolate({
                inputRange: [BAR_END, 1],
                outputRange: [pct(BAR_END), '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          {`刻み（〜${Math.round(LAYBACK_POWER * 100)}）は PERFECT なし`}
        </Text>
        {opponentDrive !== null && (
          <Text style={[styles.legendText, styles.legendOpp]}>{`▼ ${opponentName}の球`}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { paddingVertical: 14, paddingHorizontal: 16 },
  hint: { color: '#FFD700', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#F5E6C8', fontSize: 11, opacity: 0.8 },
  track: {
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: '#F5E6C8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  layback: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.06)' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  zoneGood: { backgroundColor: 'rgba(255, 215, 0, 0.25)' },
  zonePerfect: { backgroundColor: 'rgba(255, 215, 0, 0.6)' },
  impactMark: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: '#ffffff' },
  oppMark: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1.5, backgroundColor: '#e63946' },
  powerMark: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: '#7fd3ff' },
  indicator: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 6,
    marginLeft: -3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legendText: { color: '#F5E6C8', fontSize: 11, opacity: 0.75 },
  legendOpp: { color: '#ff8a8a', opacity: 1 },
});
```

- [ ] **Step 2: 型を確かめる**

Run: `npx tsc --noEmit 2>&1 | grep TeeShotMeter`
Expected: 何も出ない

- [ ] **Step 3: コミットは Task 10 と一緒に行う**

---

### Task 9: `MorningShotView` を飛距離と曲がりで描く

**Files:**
- Modify: `src/components/MorningShotView.tsx`

- [ ] **Step 1: props と着地点の計算を変える**

冒頭コメントの「perfect / good / miss の決め打ち」の箇条を次に置き換える:

```
 * - 着地点は飛距離（0〜1）と曲がり（-1〜1）から出す。
 *   飛距離はコースの中心線に沿った位置、曲がりは中心線からの横ずれ
 * - 相手の球（あれば）を先に灰色で置いておく。どちらが前かが一目で分かる
 * - 弾道は二次ベジェ。曲がりの向きへ膨らませて、フック・スライスに見せる
```

`export type ShotResult = ...` と `computeLanding` を削除し、次に置き換える:

```ts
export interface TeeShotView {
  distance: number;
  curve: number;
}

/** 飛距離 0〜1 を中心線上の位置に。0 でもティーより少し前（空振りでも転がる） */
const distanceToT = (d: number) => 0.2 + 0.72 * Math.max(0, Math.min(1, d));

/** 着地点（0-100 空間）。曲がりは中心線の法線方向に最大 12 ずらす */
function landingPoint(layout: HoleLayout, shot: TeeShotView): [number, number] {
  const t = distanceToT(shot.distance);
  const c = pointOnPath(layout.path, t);
  const n = normalAt(layout.path, t);
  return [c[0] + n[0] * shot.curve * 12, c[1] + n[1] * shot.curve * 12];
}
```

`Props` を:

```ts
interface Props {
  layout: HoleLayout;
  width: number;
  height: number;
  /** null = ボールはティーで待機。値が入るとアニメ開始 */
  shot: TeeShotView | null;
  /** 相手の球の到達点（0〜1）。null なら置かない */
  opponentDistance: number | null;
  onAnimationDone?: () => void;
}
```

関数の引数を `{ layout, width, height, shot, opponentDistance, onAnimationDone }` に、`landingPx` の計算を:

```ts
  const landingPx = useMemo<[number, number] | null>(() => {
    if (!shot) return null;
    const [lx, ly] = landingPoint(layout, shot);
    return [offsetX + lx * scale, offsetY + ly * scale];
  }, [shot, layout, offsetX, offsetY, scale]);

  const oppPx = useMemo<[number, number] | null>(() => {
    if (opponentDistance === null) return null;
    const [x, y] = pointOnPath(layout.path, distanceToT(opponentDistance));
    return [offsetX + x * scale, offsetY + y * scale];
  }, [opponentDistance, layout, offsetX, offsetY, scale]);
```

`useEffect` の依存と条件の `result` を `shot` に置き換える。

`ballX` / `ballY` を、曲がりの向きへ膨らむ二次ベジェで補間する形に置き換える:

```ts
  // 弾道の制御点: ティーと着地点の中点から、曲がりと逆向きに少し膨らませる
  // （曲がる球は打ち出しが逆へ出てから戻ってくるように見える）
  const flightSamples = useMemo(() => {
    if (!landingPx || !shot) return null;
    const mx = (teePx[0] + landingPx[0]) / 2;
    const my = (teePx[1] + landingPx[1]) / 2;
    const dx = landingPx[0] - teePx[0];
    const dy = landingPx[1] - teePx[1];
    const len = Math.hypot(dx, dy) || 1;
    const bulge = -shot.curve * len * 0.18;
    const cx = mx + (-dy / len) * bulge;
    const cy = my + (dx / len) * bulge;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      xs.push(u * u * teePx[0] + 2 * u * t * cx + t * t * landingPx[0]);
      ys.push(u * u * teePx[1] + 2 * u * t * cy + t * t * landingPx[1]);
    }
    return { xs, ys };
  }, [landingPx, teePx, shot]);

  const inputRange = Array.from({ length: 17 }, (_, i) => i / 16);
  const ballX = flightSamples
    ? flightT.interpolate({ inputRange, outputRange: flightSamples.xs })
    : teePx[0];
  const ballY = flightSamples
    ? flightT.interpolate({ inputRange, outputRange: flightSamples.ys })
    : teePx[1];
```

シャドウの `{result && (` を `{shot && (` に。ティーの目印の直後に相手の球を足す:

```tsx
      {/* 相手の球。灰色で先に置いておく */}
      {oppPx && (
        <View
          style={[styles.oppBall, { left: oppPx[0] - 3, top: oppPx[1] - 3 }]}
          pointerEvents="none"
        />
      )}
```

styles に:

```ts
  oppBall: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b8b8b8',
    borderWidth: 1,
    borderColor: '#7a7a7a',
  },
```

- [ ] **Step 2: 型を見る**

Run: `npx tsc --noEmit 2>&1 | grep MorningShotView`
Expected: `MorningShotView.tsx` 自身のエラーが無い（GameScreen 側の呼び出しエラーは Task 10 で直す）

- [ ] **Step 3: コミットは Task 10 と一緒に行う**（単独では画面が壊れるため）

---

### Task 10: 朝イチを画面につなぐ

**Files:**
- Modify: `src/screens/GameScreenSimple.tsx`

- [ ] **Step 1: 撤去する**

`grep -n` で探して削除する:

- 定数 `OWN_SHOT_WINDOW`、`SWING_STEPS`（とその上のコメント）、`swingScoresToResult`（とその上のコメント）、`zoneStyle`
- state/ref: `swingBarAnim`、`swingAnimRef`、`swingPositionRef`、`swingStep` / `setSwingStep`、`swingScores` / `setSwingScores`、`ownShotZone`
- 「Swing animation for morning mini-game」の `useEffect`
- `handleSwingTap`
- render の `own_shot_swing` ブロックの中身と、`own_shot_result` ブロックの段チップ（`swingStepRow` の `View`）
- styles の `swingArea` / `swingZoneLabels` / `swingZoneMiss` / `swingZoneGood` / `swingZonePerfect` / `swingTrack` / `swingZoneHighlight*` / `swingStepRow` / `swingStepChip*` / `swingIndicator`。`swingTapHint` と `swingTalkEcho` は残す（他で使っていれば）。消す前に `grep -n "styles.<名前>"` で他に使っていないことを確かめる

`swingLockedRef` はパットでも使うので残す。

- [ ] **Step 2: state を足す**

`ownShotResultText` の近くに:

```ts
  /** 朝イチの飛距離と曲がり（俯瞰図の弾道）と、相手を越えたか */
  const [teeShot, setTeeShot] = useState<(TeeShotOutcome & { outdrove: boolean | null }) | null>(null);
```

import に:

```ts
import { TeeShotMeter } from '../components/TeeShotMeter';
import { TeeShotOutcome, judgeTeeShot, opponentDrive, didOutdrive } from '../logic/teeShot';
```

`ownPlay` の import に `outdriveReaction, sumReactions` を足す。

- [ ] **Step 3: 流れを変える（話しかけを構えの前に）**

朝イチの開始で `setSwingStep(0); setSwingScores([]);` を削除し、`setTeeShot(null);` と `swingLockedRef.current = false;` を足す。

`own_shot_intro` から進むタイマーを:

```ts
        timerRef.current = setTimeout(() => {
          // 構えたところで話しかけられる（3タップは途中で止めないので、打ち始める前に置く）
          talkLockedRef.current = false;
          setTalkResultLine(null);
          setMorningPhase('own_shot_talk');
        }, 1500);
```

`answerMorningTalk` の中の `setSwingStep(1);` を削除する（`setMorningPhase('own_shot_swing')` はそのまま）。

- [ ] **Step 4: `finishSwing` を書き換える**

```ts
  /**
   * 3タップの結果からショットを確定させる。
   *
   * 出来（PERFECT/GOOD/MISS）への反応に、相手を越えたかの反応を上乗せして
   * 一度に engine へ渡す（キャラの traitModifiers を効かせるため）。
   */
  const finishSwing = useCallback(
    (shot: { power: number; impact: number | null }) => {
      if (swingLockedRef.current) return;
      swingLockedRef.current = true;
      const outcome = judgeTeeShot({ ...shot, focus: ownShotFocus, talkAnswered });
      const opp = opponentDrive(pendingMorningState?.morningShot ?? null);
      const outdrove = didOutdrive(outcome.distance, opp);
      setTeeShot({ ...outcome, outdrove });

      const result = outcome.result;
      // 相手の構え方（腕を認める／気にしない／上に立ちたい）で反応が変わる。
      // 上手いことが常に得ではないのが接待ゴルフ
      const delta = sumReactions(
        ownShotReaction(character.ownPlayStance, result),
        outdriveReaction(character.ownPlayStance, outdrove)
      );
      setOwnShotResultText(getOwnShotResultText(result, characterId, character.name, character.ownPlayStance));
      playSfx('shot');
      // 表情は結果からではなく信頼の動きから決める。
      // 結果から決めると、外して喜ぶ相手のときに顔とセリフが食い違う
      setMood(reactionMood(delta));

      const base = pendingMorningState;
      if (base) {
        setPendingMorningState({ ...applyMinigameResult(base, delta), ownShot: result });
      }
      setMorningPhase('own_shot_result');
    },
    [pendingMorningState, characterId, character.name, character.ownPlayStance, talkAnswered, ownShotFocus]
  );
```

（`pendingMorningState.morningShot` に相手のショット結果が入っていることを `grep -n "morningShot:" src/logic/engine.ts` で確かめる。入っていなければ `gameState.morningShot` を使う。）

- [ ] **Step 5: render を書き換える**

`MorningShotView` の呼び出しを:

```tsx
              <MorningShotView
                layout={courseHole}
                width={260}
                height={170}
                shot={morningPhase === 'own_shot_result' ? teeShot : null}
                opponentDistance={opponentDrive(pendingMorningState?.morningShot ?? null)}
              />
```

`{morningPhase === 'own_shot_swing' && (` の中身を:

```tsx
            <View>
              <View style={styles.eventBox}>
                <View style={styles.morningBadge}>
                  <Text style={styles.morningBadgeText}>朝イチのショット</Text>
                </View>
                <Text style={styles.eventBoxTitle}>どこまで飛ばす？</Text>
                <Text style={styles.eventBoxDesc}>
                  強く振るほど飛ぶが、当てるのが難しくなる
                </Text>
                {talkResultLine && <Text style={styles.swingTalkEcho}>{talkResultLine}</Text>}
              </View>
              <TeeShotMeter
                focus={ownShotFocus}
                opponentDrive={opponentDrive(pendingMorningState?.morningShot ?? null)}
                opponentName={character.name.split('・').pop() ?? character.name}
                onDone={finishSwing}
              />
            </View>
```

`own_shot_result` の段チップの `View` を、飛ばし合いの一行に置き換える:

```tsx
              {teeShot?.outdrove != null && (
                <Text style={[styles.eventBoxDesc, { marginTop: 6 }]}>
                  {teeShot.outdrove
                    ? `${character.name.split('・').pop()}の球を越えた。`
                    : `${character.name.split('・').pop()}の球の手前に止まった。`}
                </Text>
              )}
```

- [ ] **Step 6: 型を確かめる**

Run: `npx tsc --noEmit && node tools/minigame-tests.js`
Expected: tsc は何も出ない、テストは全件成功

- [ ] **Step 7: Web で通しで遊ぶ**

`preview_start`（`enjoy-golf-web`）、375 幅で朝イチまで進める:
- 「さあ、自分の番だ」→ 話しかけ（応じる／流す）→ メーター
- 1回目でバーが伸び、2回目で青い線（パワー）が残り、バーが戻る。3回目で結果へ
- 押さずに放置すると、伸びきって戻り、端で MISS になる
- 相手が OB でないラウンドで赤い印と「▼ ○○の球」が出る
- 結果で俯瞰図の球が曲がって飛び、灰色の相手の球と前後が分かる。「越えた／手前に止まった」が出る
- 応じたラウンドで、印ぴったりでも GOOD になる

- [ ] **Step 8: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/src/components/TeeShotMeter.tsx enjoy-golf/src/components/MorningShotView.tsx enjoy-golf/src/screens/GameScreenSimple.tsx && git commit -m "朝イチを3タップにし、相手との飛ばし合いを入れる

同じ「バーを中央で止める」を3回やるだけだった。パワーを自分で選ばせ、
飛ばすほどインパクトが狭く、刻めば PERFECT を捨てる形にする。
相手の球を越えたかで信頼が小さく動く（相手の型で向きが逆）。
話しかけは3タップの途中で止めないよう、構えの前に移した。

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 仕上げの確認と引き継ぎ

**Files:**
- Modify: `docs/superpowers/specs/2026-10-02-putt-and-tee-shot-design.md`（実装で確定した点）
- Modify: `docs/2026-10-02-review-submission-handoff.md`

- [ ] **Step 1: 全部回す**

```bash
npx tsc --noEmit && node tools/minigame-tests.js && node tools/minigame-sim.js && node tools/regression.js
```

Expected: tsc 無出力、テスト全件成功、シミュレーション両方合格、回帰はハング 0・相談ラウンド 200/200・契約率が Task 5 の値と同程度

- [ ] **Step 2: 設計書に実装で確定した点を書き足す**

設計書の末尾に「## 実装で確定した点（2026-10-02）」を足し、次を書く:
- インパクトの印は中央ではなく左端寄り（`IMPACT_POS = 0.18`）。戻ってくるバーを左端近くで止める、みんゴルと同じ配置
- パットはボールに正確に触れなくても、グリーンのどこからでも引ける（小さな球を指が隠すため）
- 集中力の向きのブレは「方向線の揺れ」として見せ、離した瞬間の揺れがそのまま乗る（見えるブレ）。強さのブレだけが見えない
- Task 4 で決めた定数と、シミュレーションの最終の表
- Task 5 の契約率（前後）

- [ ] **Step 3: 引き継ぎメモを更新する**

`docs/2026-10-02-review-submission-handoff.md`:
- 「次にやる順番」の「1. 実機で一周する」の表の「パットの引き」行を、「**パットの引き（グリーン上で後ろへ引く）**。引いている間に画面がスクロールしないか」に書き換える
- 同じ表に1行足す: 「高 | 朝イチの3タップ。タップの反応が遅れて印を外しやすくないか（Web より実機のほうがタッチの遅延が大きい）」
- 「3. build 2 を焼く」の照合項目に「パット・朝イチの作り直しがバンドルに載っているか（`TeeShotMeter` の文言「どこまで飛ばす？」を utf-8 / utf-16-le で照合）」を足す
- 「道具」に `node tools/minigame-tests.js` と `node tools/minigame-sim.js` を足す
- 「ファイルの地図」に `docs/superpowers/specs/2026-10-02-putt-and-tee-shot-design.md` と、`tools/minigame-sim.js`（難易度の基準）を足す
- **実機一周は build 2 で行う**ことを明記する（build 1 には新しいミニゲームが入っていない）

- [ ] **Step 4: コミット**

```bash
cd ~/おもちゃ箱 && pwd && git add enjoy-golf/docs/superpowers/specs/2026-10-02-putt-and-tee-shot-design.md enjoy-golf/docs/2026-10-02-review-submission-handoff.md && git commit -m "ミニゲーム作り直しの確定点を設計書と引き継ぎに書く

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
