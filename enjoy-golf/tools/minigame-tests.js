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

test('縁の手前でちょうど止まるボールは lip_out ではなく miss', () => {
  for (const power of [0.688, 0.692]) {
    const r = P.simulatePutt({ slope: 'flat', angle: 0, power });
    const gap = r.path[r.path.length - 1][1] - P.PUTT_CUP[1];
    assert.ok(gap > 1.9 && gap < 3.0, `想定の止まり位置でない: ${gap}`);
    assert.equal(r.result, 'miss', `power ${power}`);
  }
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

test('強さは 1 で頭打ち（1.5 でも 1 と同じ）', () => {
  const a = P.simulatePutt({ slope: 'flat', angle: 0, power: 1.5 });
  const b = P.simulatePutt({ slope: 'flat', angle: 0, power: 1 });
  assert.equal(a.result, b.result);
  assert.deepEqual(a.path[a.path.length - 1], b.path[b.path.length - 1]);
});

test('弱いパットでもボールは動く（開始位置がグリーン内）', () => {
  const r = P.simulatePutt({ slope: 'flat', angle: 0, power: 0.3 });
  assert.ok(r.path.length > 2);
  assert.ok(r.path[r.path.length - 1][1] < P.PUTT_BALL_START[1]);
});

test('ドラッグ: 横に引きすぎ（60度超）は打たない', () => {
  assert.equal(P.strokeFromDrag(200, 100, 200), null);
});

test('集中力が高いほどブレが小さい', () => {
  const lo = P.focusJitter(10);
  const hi = P.focusJitter(90);
  assert.ok(lo.angle > hi.angle && lo.power > hi.power);
  assert.ok(P.focusJitter(100).angle === 0);
});

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

test('反応の足し合わせ', () => {
  assert.deepEqual(OP.sumReactions({ trust: 6, fun: 2 }, { trust: -3 }), { trust: 3, fun: 2 });
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
