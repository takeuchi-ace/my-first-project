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
