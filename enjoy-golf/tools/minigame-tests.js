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

/**
 * 傾斜ごとに「入る打ち方」を総当たりで探す。テストとシミュレーションで使う。
 *
 * 入る打ち方の**真ん中**（格子上で入った打ち方の重心）を返す。
 * 以前は「周りも入る」点数が最大の打ち方のうち走査順で最初のものを取っていたが、
 * それは入る領域の端（角度・強さとも小さい側）に寄り、シミュレーションの in 率を
 * 実際より低く見せていた。重心そのものが入らない（領域がくびれている）ときだけ、
 * 点数が最大の打ち方に戻す。
 */
const findBestStroke = (slope) => {
  let sumA = 0;
  let sumP = 0;
  let n = 0;
  let fallback = null;
  for (let a = -0.5; a <= 0.5; a += 0.005) {
    for (let p = 0.3; p <= 1.0; p += 0.005) {
      if (P.simulatePutt({ slope, angle: a, power: p }).result !== 'in') continue;
      sumA += a;
      sumP += p;
      n++;
      // 入る打ち方のうち、周りも入る（余裕がある）ものを控えに取っておく
      let score = 0;
      for (const [da, dp] of [[0.01, 0], [-0.01, 0], [0, 0.02], [0, -0.02]]) {
        if (P.simulatePutt({ slope, angle: a + da, power: p + dp }).result === 'in') score++;
      }
      if (!fallback || score > fallback.score) fallback = { angle: a, power: p, score };
    }
  }
  if (n === 0) return null;
  const centre = { angle: sumA / n, power: sumP / n };
  return P.simulatePutt({ slope, ...centre }).result === 'in' ? centre : fallback;
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

test('吸い込み: カップの脇を遅く通るボールは入り、同じ線を速く通るボールは入らない', () => {
  // 平らなので、吸い込みが無ければボールはまっすぐ進む。
  // この向きの直線はカップの中心から約 2.9 離れて通る（沈む距離 SINK_R≈2.0 の外、吸い込みの輪の内）
  const angle = 0.045;
  const lineDist = Math.hypot(...P.PUTT_CUP.map((c, i) => c - P.PUTT_BALL_START[i])) * Math.sin(angle);
  assert.ok(lineDist > P.CUP_R && lineDist < P.CUP_R * 2, `前提が崩れた: ${lineDist}`);
  assert.equal(P.simulatePutt({ slope: 'flat', angle, power: 0.74 }).result, 'in');
  assert.notEqual(P.simulatePutt({ slope: 'flat', angle, power: 1.0 }).result, 'in');
});

test('吸い込み: 入るパットはカップの周りを回り込まない（向きの変化の合計 ≤ 100度）', () => {
  // 吸い込みで曲がるのは1打で最大 0.6 ラジアン（約34度）。残りは傾斜の曲がり（実測で最大 約40度）。
  // 以前は通り過ぎた後も引き続けて、カップの周りを1〜2周して落ちる軌跡があった
  const heading = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  let worst = 0;
  for (const slope of ['flat', 'left', 'right', 'uphill']) {
    for (let a = -0.3; a <= 0.3; a += 0.01) {
      for (let p = 0.5; p <= 1.0; p += 0.01) {
        const r = P.simulatePutt({ slope, angle: a, power: p });
        if (r.result !== 'in') continue;
        const pts = r.path.slice(0, -1); // 最後はカップの中心へ置き直した点なので除く
        let total = 0;
        for (let i = 2; i < pts.length; i++) {
          let d = heading(pts[i - 1], pts[i]) - heading(pts[i - 2], pts[i - 1]);
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          total += d;
        }
        const deg = (Math.abs(total) * 180) / Math.PI;
        if (deg > worst) worst = deg;
        assert.ok(deg <= 100, `${slope} a=${a.toFixed(2)} p=${p.toFixed(2)} で ${deg.toFixed(0)} 度曲がった`);
      }
    }
  }
  assert.ok(worst > 0, '入るパットが一つも無い');
});

test('吸い込み: 左右の傾斜でカップへまっすぐ打つと、どの強さでも入らない（読む意味を残す）', () => {
  // 吸い込みを強くしすぎると傾斜の曲がりまで吸って、読まずに入るようになる。その歯止め
  for (const slope of ['left', 'right']) {
    for (let i = 55; i <= 100; i++) {
      const power = i / 100;
      assert.notEqual(P.simulatePutt({ slope, angle: 0, power }).result, 'in', `${slope} power ${power}`);
    }
  }
});

test('吸い込み: 手前で止まるボールを前へ引きずり込まない', () => {
  // 平らでまっすぐ、カップの 4〜6 手前で止まる強さ。少し向きがずれても miss のまま、縁より手前に残る
  for (const power of [0.67, 0.68]) {
    for (const angle of [0, 0.03, -0.03]) {
      const r = P.simulatePutt({ slope: 'flat', angle, power });
      const last = r.path[r.path.length - 1];
      assert.equal(r.result, 'miss', `power ${power} angle ${angle}`);
      assert.ok(Math.hypot(last[0] - P.PUTT_CUP[0], last[1] - P.PUTT_CUP[1]) > P.CUP_R + 1);
      assert.ok(last[1] > P.PUTT_CUP[1], 'カップの手前で止まるはず');
    }
    // まっすぐカップへ向かうボールには横向きの力がかからない
    const straight = P.simulatePutt({ slope: 'flat', angle: 0, power });
    assert.equal(straight.path[straight.path.length - 1][0], P.PUTT_CUP[0]);
  }
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

test('PERFECT の窓の外へ外れるほど曲がる（早い=スライス正、遅い=フック負）', () => {
  const w = T.teeShotWindow(50, 0.8);
  const d = w.perfect + 0.03;
  assert.ok(judge({ impact: T.IMPACT_POS + d }).curve > 0);
  assert.ok(judge({ impact: T.IMPACT_POS - d }).curve < 0);
  assert.equal(judge({}).curve, 0);
});

test('PERFECT の窓の内側なら少しずれても曲がらない', () => {
  const w = T.teeShotWindow(50, 0.8);
  assert.equal(judge({ impact: T.IMPACT_POS + w.perfect * 0.9 }).curve, 0);
  assert.equal(judge({ impact: T.IMPACT_POS - w.perfect * 0.9 }).curve, 0);
});

test('大きく外すと曲がりは端（±1）に張り付く', () => {
  assert.equal(judge({ impact: T.IMPACT_POS + 0.5 }).curve, 1);
  assert.equal(judge({ impact: null }).curve, -1);
});

test('パワーちょうど LAYBACK_POWER は刻みではない', () => {
  assert.equal(judge({ power: T.LAYBACK_POWER }).result, 'perfect');
});

test('話しかけに応じても GOOD と MISS は変わらない', () => {
  const w = T.teeShotWindow(50, 0.8);
  const goodImpact = T.IMPACT_POS + w.perfect + 0.01;
  assert.equal(judge({ impact: goodImpact }).result, 'good');
  assert.equal(judge({ impact: goodImpact, talkAnswered: true }).result, 'good');
  assert.equal(judge({ impact: null, talkAnswered: true }).result, 'miss');
});

test('相手の到達点: normal は 0.62', () => {
  assert.equal(T.opponentDrive('normal'), 0.62);
});

test('同じ飛距離（引き分け）は越えていない', () => {
  assert.equal(T.didOutdrive(0.8, T.opponentDrive('great')), false);
});

test('反応の足し合わせ: b にだけあるキーも入る', () => {
  assert.deepEqual(OP.sumReactions({ trust: 1 }, { fun: 2 }), { trust: 1, fun: 2 });
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
