/**
 * 回帰ハーネス — エンジンやデータを触ったあとに回す
 *
 * 使い方:  node tools/regression.js   （プロジェクト直下から）
 *
 * 見るもの:
 *  - 契約成功率5段階（会話の腕 1.0 / 0.8 / 0.6 / 0.4 / 0.2）
 *  - ハングしないこと（イベント選択が終わらないループの検出）
 *  - 相談ラウンド（ACE）が必ず成立すること
 *  - 1周で触れたイベントの種類数
 *
 * ※ TypeScript を都度トランスパイルするので数分かかる。
 * ※ Metro のバンドル対象外（src/ の外にあり、どこからも import していない）。
 *
 * このハーネスは scratchpad に置いて2度消えている。数値を比べたいのに
 * 現物が無く、書き直した結果 前回と条件が揃わなくなった。だからリポジトリに置く。
 * **数値を比較するときは、同じこのファイルで取った値どうしで比べること。**
 */
const path = require('path');
const fs = require('fs');
const ROOT = process.cwd();
const ts = require(path.join(ROOT, 'node_modules/typescript'));
require.extensions['.ts'] = function (m, f) {
  m._compile(
    ts.transpileModule(fs.readFileSync(f, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
      fileName: f,
    }).outputText,
    f
  );
};
const D = (p) => require(path.join(ROOT, 'src', p));
const engine = D('logic/engine.ts');
const { characters } = D('data/characters.ts');
const M = D('data/roundMoods.ts');
const S = D('data/strategies.ts');
const OP = D('logic/ownPlay.ts');
const ace = D('logic/aceEngine.ts');

/** 会話の最善手（信頼を重く、距離を減点して選ぶ） */
const best = (st, e) => {
  let bi = 0, bv = -1e9;
  for (let i = 0; i < e.choices.length; i++) {
    const x = engine.applyChoice(st, e, i).lastAppliedDelta;
    const v = x.trust * 2 + x.fun - x.creep * 2;
    if (v > bv) { bv = v; bi = i; }
  }
  return bi;
};
/** ミニゲームの腕。mg の確率で最良、残りを等分 */
const pk = (mg, a, b, c) => {
  const r = Math.random();
  return r < mg ? a : r < mg + (1 - mg) * 0.5 ? b : c;
};

let hang = 0;
function round(cid, sk, mg, i, seen) {
  const c = characters.find((x) => x.id === cid);
  const opts = S.drawStrategyOptions(cid);
  let st = engine.createInitialState(
    cid,
    opts[Math.floor(Math.random() * opts.length)].id,
    M.pickRoundMood(cid, i)
  );
  let g = 0;
  while (!st.finished) {
    if (++g > 40) { hang++; return null; }
    const e = engine.selectEvent(st);
    if (!e) break;
    if (seen) seen.add(e.id);
    st = engine.applyChoice(st, e, Math.random() < sk ? best(st, e) : Math.floor(Math.random() * e.choices.length));
    if (e.id.startsWith('morning_shot_')) {
      const r = pk(mg, 'perfect', 'good', 'miss');
      st = engine.applyMinigameResult(st, OP.ownShotReaction(c.ownPlayStance, r));
      st = { ...st, ownShot: r };
    }
    if (e.id.startsWith('putting_event_')) {
      const r = pk(mg, 'in', 'lip_out', 'miss');
      st = engine.applyMinigameResult(st, OP.puttOwnReaction(c.ownPlayStance, r));
      st = { ...st, puttResult: r };
    }
    if (e.id.startsWith('lunch_')) {
      const x = engine.selectLunchTalkEvent(st);
      if (x) st = engine.applyChoice(st, x, 0);
    }
  }
  return st;
}

const chars = characters.filter((c) => !c.isAce).map((c) => c.id);
const seen = new Set();
const rates = [1.0, 0.8, 0.6, 0.4, 0.2].map((sk) => {
  let ok = 0, n = 0;
  for (let i = 0; i < 840; i++) {
    const st = round(chars[i % chars.length], sk, 0.6, i, seen);
    if (!st) continue;
    n++;
    if (engine.calcResult(st).contractSuccess) ok++;
  }
  return (ok / n * 100).toFixed(1);
});
console.log('契約成功率 ' + rates.join(' / ') + ' %');
console.log('  ※ 2026-09-14 の基準値: 89.5 / 78.1 / 58.3 / 43.5 / 23.3');
console.log('触れたイベント ' + seen.size + '種  ハング ' + hang + '/4200');

let aceOk = 0;
for (let i = 0; i < 200; i++) {
  let st = ace.createAceInitialState(16), g = 0;
  while (!st.finished) {
    if (++g > 10) break;
    const e = ace.selectAceEvent(st);
    if (!e) break;
    st = ace.applyAceChoice(st, e, 0);
  }
  if (ace.calcAceResult().contractSuccess) aceOk++;
}
console.log('相談ラウンド ' + aceOk + '/200（200でないと異常）');
