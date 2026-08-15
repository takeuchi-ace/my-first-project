# KUSAKARI 段階1（MVP）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 32×32 の草地を指でなぞって刈ると更地に建物が建ち、アプリを閉じている間に草が伸び、戻ると留守中の変化が報告される、という一巡りが動くところまで作る。

**Architecture:** ゲームの状態は `Uint8Array` 3 本（植生段階・段階内進捗・マス種別）だけで表現し、`src/game/` の純関数群がそれを更新する。React も React Native も一切 import しないため、Jest で高速にテストできる。描画は `src/render/FieldCanvas.tsx` の Skia 1 レイヤーに完全に閉じ込め、仮の見た目（緑の濃淡6色と白い四角）から本番の絵へ差し替えるときにゲームロジックへ触らずに済むようにする。閉じている間は何も動かさず、起動時に経過秒数を 1 回渡して一括計算する。

**Tech Stack:** Expo SDK 54 / React Native 0.81 / TypeScript / @shopify/react-native-skia / react-native-gesture-handler + reanimated / AsyncStorage / expo-haptics / Jest (ts-jest)

**仕様書:** `docs/superpowers/specs/2026-08-15-kusakari-design.md`

---

## この計画で作らないもの（段階2以降）

仕様の第13節「実装の段階」に従い、以下は**この計画に含めない**。

- 緑被率・気候・乾燥・痩地
- 土壌の疲弊（`wear` 配列）
- 道具の種類と刈れる段階の制限（MVP では全段階を刈れる）
- 舗装・農地・水などのマス種別（MVP は「自然」と「建物」の 2 種のみ）
- 除草ロボ、ズームの粒度切り替え、引きズームでの範囲指示
- 転生「氷河期」、図鑑、実績、イベント文
- 本番の絵柄（仮の見た目のまま）

---

## ファイル構成

作るファイルと、それぞれの責任範囲。

### ゲームロジック（React を一切知らない純 TypeScript）

| ファイル | 責任 |
|---|---|
| `src/game/types.ts` | `Field` 型、マス種別の定数、盤面サイズ |
| `src/game/constants.ts` | 成長速度・人口・文明レベルの調整値 |
| `src/game/field.ts` | `Field` の生成と添字計算 |
| `src/game/mow.ts` | 刈る（刈高まで段階を下げる） |
| `src/game/growth.ts` | 経過秒数を受けて草を伸ばす |
| `src/game/buildings.ts` | 建物の自動建設・倒壊、人口、文明レベル |
| `src/game/simulate.ts` | growth と buildings を束ねて差分を返す |
| `src/game/report.ts` | 差分から復帰レポートの文面を作る |

### 保存

| ファイル | 責任 |
|---|---|
| `src/storage/codec.ts` | `Field` ⇄ 文字列（ランレングス圧縮） |
| `src/storage/save.ts` | AsyncStorage への読み書きと保存時刻 |

### 表示と操作（ここだけ React Native を知っている）

| ファイル | 責任 |
|---|---|
| `src/render/palette.ts` | 仮の見た目の色定義。**差し替えるのはこのファイルと FieldCanvas だけ** |
| `src/render/FieldCanvas.tsx` | Skia で盤面を描く。カメラ変換もここ |
| `src/ui/MowHeightDial.tsx` | 刈高ダイヤル |
| `src/ui/Hud.tsx` | 人口・文明レベルの表示 |
| `src/ui/ReturnReport.tsx` | 復帰レポートのモーダル |
| `src/screens/TitleScreen.tsx` | タイトルとクレジット |
| `src/screens/FieldScreen.tsx` | 本編。ジェスチャの割り当てはここ |
| `src/store/useGame.tsx` | Field の保持、保存、起動時の一括計算 |
| `App.tsx` | タイトルと本編の切り替え |

---

## Task 0: プロジェクトの雛形を作る

**Files:**
- Create: `~/おもちゃ箱/kusakari/`（`docs/` 以外すべて）

- [ ] **Step 1: Expo の雛形を別名で作り、docs/ を壊さないように移す**

`create-expo-app` は空でないディレクトリを嫌うため、いったん別名で作ってから中身を移す。

```bash
cd ~/おもちゃ箱
npx create-expo-app@latest kusakari-scaffold --template blank-typescript
rsync -a --exclude node_modules kusakari-scaffold/ kusakari/
mv kusakari-scaffold/node_modules kusakari/node_modules
rm -rf kusakari-scaffold
```

期待: `~/おもちゃ箱/kusakari/` に `App.tsx` `package.json` `tsconfig.json` `app.json` `node_modules/` が並び、`docs/` がそのまま残っている。

- [ ] **Step 2: 依存を入れる**

```bash
cd ~/おもちゃ箱/kusakari
npx expo install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated @react-native-async-storage/async-storage expo-haptics react-native-safe-area-context
npm install --save-dev jest ts-jest @types/jest
```

react-navigation は入れない。画面は 2 枚しかないので `App.tsx` の状態切り替えで足りる。

- [ ] **Step 3: reanimated の babel プラグインを足す**

`babel.config.js` を次の内容にする（雛形にこのファイルが無い場合は新規作成）。

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

`react-native-reanimated/plugin` は必ずプラグイン配列の**最後**に置く。これは reanimated の要求。

- [ ] **Step 4: Jest を設定する**

`jest.config.js` を新規作成。

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
```

ここで `jest-expo` ではなく素の `ts-jest` を選んでいるのは、テスト対象を `src/game/` と `src/storage/codec.ts` の純 TypeScript に限っているため。React Native を起動しないぶん実行が速く、設定も壊れにくい。

`package.json` の `scripts` に追加。

```json
"test": "jest"
```

- [ ] **Step 5: 画面の向きを縦に固定する**

`app.json` の `expo.orientation` が `"portrait"` になっていることを確認する。雛形の既定値が `"portrait"` なので、通常は変更不要。違っていたら直す。

- [ ] **Step 6: Jest が動くことを確認する**

`src/game/smoke.test.ts` を作る。

```ts
describe('テスト環境', () => {
  it('動く', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: PASS 1 件

- [ ] **Step 7: 動作確認用の煙テストを消す**

```bash
rm src/game/smoke.test.ts
```

- [ ] **Step 8: 開発ビルドを作る**

**Skia は Expo Go に入っていないため、Expo Go では動かない。** 開発ビルドが要る。

```bash
cd ~/おもちゃ箱/kusakari
npx expo run:ios
```

期待: iOS シミュレータが起動し、雛形の白い画面に "Open up App.tsx to start working on your app!" が出る。

初回はネイティブのビルドに数分かかる。ここで失敗する場合は Xcode の設定側の問題なので、エラー文を確認してから先へ進む。**この Step が通らないうちに UI のタスク（Task 8 以降）へ進んではいけない。**

- [ ] **Step 9: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari
git commit -m "KUSAKARI の雛形を作る（Expo + Skia + gesture-handler + Jest）"
```

---

## Task 1: Field のデータ構造

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`
- Create: `src/game/field.ts`
- Test: `src/game/field.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/game/field.test.ts`

```ts
import { createField, idx } from './field';
import { GRID_W, GRID_H, Kind } from './types';
import { INITIAL_STAGE } from './constants';

describe('createField', () => {
  it('32×32 の盤面を作る', () => {
    const f = createField();
    expect(f.w).toBe(GRID_W);
    expect(f.h).toBe(GRID_H);
    expect(f.veg.length).toBe(GRID_W * GRID_H);
    expect(f.frac.length).toBe(GRID_W * GRID_H);
    expect(f.kind.length).toBe(GRID_W * GRID_H);
  });

  it('最初は全マスが草ボーボーの自然地である', () => {
    const f = createField();
    for (let i = 0; i < f.veg.length; i++) {
      expect(f.veg[i]).toBe(INITIAL_STAGE);
      expect(f.frac[i]).toBe(0);
      expect(f.kind[i]).toBe(Kind.Natural);
    }
  });

  it('大きさを指定して作れる', () => {
    const f = createField(4, 3);
    expect(f.w).toBe(4);
    expect(f.h).toBe(3);
    expect(f.veg.length).toBe(12);
  });
});

describe('idx', () => {
  it('行優先で添字を返す', () => {
    const f = createField(4, 3);
    expect(idx(f, 0, 0)).toBe(0);
    expect(idx(f, 3, 0)).toBe(3);
    expect(idx(f, 0, 1)).toBe(4);
    expect(idx(f, 3, 2)).toBe(11);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- field`
Expected: FAIL（`Cannot find module './field'`）

- [ ] **Step 3: 型と定数を書く**

`src/game/types.ts`

```ts
/** 盤面の幅（マス） */
export const GRID_W = 32;
/** 盤面の高さ（マス） */
export const GRID_H = 32;

/**
 * マスの種別。
 * 仕様書 10.1 の割り当てをそのまま使う。段階1で実際に使うのは Natural と Building だけだが、
 * 後の段階で値がずれると保存データが壊れるため、番号は最初から確定させておく。
 */
export const Kind = {
  Natural: 0,
  Trodden: 1,
  Gravel: 2,
  Paved: 3,
  Building: 4,
  Farm: 5,
  Water: 6,
  Barren: 7,
} as const;

export type KindValue = (typeof Kind)[keyof typeof Kind];

/** 植生段階。0 更地 / 1 芝 / 2 草地 / 3 低木 / 4 森 / 5 密林 */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 盤面。
 * 3 本の並列配列で持つ。マスは行優先で並び、添字は y * w + x。
 */
export interface Field {
  w: number;
  h: number;
  /** 植生段階 0..5 */
  veg: Uint8Array;
  /** 次の段階までの進捗 0..255 */
  frac: Uint8Array;
  /** マス種別（Kind の値） */
  kind: Uint8Array;
}
```

`src/game/constants.ts`

```ts
/** 植生段階の上限（密林） */
export const MAX_STAGE = 5;

/** ゲーム開始時の植生段階。低木＝草ボーボーの空き地から始まる */
export const INITIAL_STAGE = 3;

/**
 * 段階 n から n+1 へ上がるのにかかる秒数。添字は現在の段階。
 * 更地→芝 90秒 / 芝→草地 3分 / 草地→低木 10分 / 低木→森 30分 / 森→密林 2時間。
 * 触り心地を見ながら調整する値なので、ここ以外に散らさない。
 */
export const GROWTH_SECONDS = [90, 180, 600, 1800, 7200] as const;

/** 建物 1 軒あたりの人口 */
export const POPULATION_PER_BUILDING = 10;

/** 建物が建つ上限の植生段階（これ以下なら建つ） */
export const BUILDABLE_MAX_STAGE = 1;

/** 隣がこの段階以上になると建物が草に飲まれる */
export const COLLAPSE_STAGE = 3;

/** 文明レベル。人口の多い順に判定する */
export const CIVIL_LEVELS = [
  { name: '町', minPopulation: 1000 },
  { name: '村', minPopulation: 200 },
  { name: '集落', minPopulation: 50 },
  { name: '空き地', minPopulation: 0 },
] as const;
```

- [ ] **Step 4: field.ts を書く**

`src/game/field.ts`

```ts
import { Field, GRID_W, GRID_H, Kind } from './types';
import { INITIAL_STAGE } from './constants';

/** 全マスが草ボーボーの自然地である盤面を作る */
export function createField(w: number = GRID_W, h: number = GRID_H): Field {
  const n = w * h;
  const veg = new Uint8Array(n);
  const frac = new Uint8Array(n);
  const kind = new Uint8Array(n);
  veg.fill(INITIAL_STAGE);
  frac.fill(0);
  kind.fill(Kind.Natural);
  return { w, h, veg, frac, kind };
}

/** (x, y) の添字。行優先 */
export function idx(field: Field, x: number, y: number): number {
  return y * field.w + x;
}

/** (x, y) が盤面の内側か */
export function inBounds(field: Field, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < field.w && y < field.h;
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- field`
Expected: PASS 4 件

- [ ] **Step 6: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/game kusakari/docs
git commit -m "KUSAKARI: 盤面のデータ構造を作る"
```

---

## Task 2: 刈る

**Files:**
- Create: `src/game/mow.ts`
- Test: `src/game/mow.test.ts`

刈るのはプレイヤーの唯一の入力である。**段階を下げる方向にしか動かない**ことをテストで固定する。

- [ ] **Step 1: 失敗するテストを書く**

`src/game/mow.test.ts`

```ts
import { createField, idx } from './field';
import { mowCell, mowStroke } from './mow';
import { Kind } from './types';

describe('mowCell', () => {
  it('刈高より高い草は刈高まで下がる', () => {
    const f = createField(4, 4);
    const i = idx(f, 1, 1);
    f.veg[i] = 4;
    f.frac[i] = 200;

    const changed = mowCell(f, 1, 1, 1);

    expect(changed).toBe(true);
    expect(f.veg[i]).toBe(1);
    expect(f.frac[i]).toBe(0);
  });

  it('刈高と同じ高さの草は変わらない', () => {
    const f = createField(4, 4);
    const i = idx(f, 1, 1);
    f.veg[i] = 2;
    f.frac[i] = 100;

    const changed = mowCell(f, 1, 1, 2);

    expect(changed).toBe(false);
    expect(f.veg[i]).toBe(2);
    expect(f.frac[i]).toBe(100);
  });

  it('刈高より低い草をなぞっても何も起きない（種は撒けない）', () => {
    const f = createField(4, 4);
    const i = idx(f, 1, 1);
    f.veg[i] = 0;
    f.frac[i] = 50;

    const changed = mowCell(f, 1, 1, 3);

    expect(changed).toBe(false);
    expect(f.veg[i]).toBe(0);
    expect(f.frac[i]).toBe(50);
  });

  it('建物のマスは刈れない', () => {
    const f = createField(4, 4);
    const i = idx(f, 1, 1);
    f.kind[i] = Kind.Building;
    f.veg[i] = 0;

    const changed = mowCell(f, 1, 1, 0);

    expect(changed).toBe(false);
    expect(f.kind[i]).toBe(Kind.Building);
  });

  it('盤面の外は無視する', () => {
    const f = createField(4, 4);
    expect(mowCell(f, -1, 0, 0)).toBe(false);
    expect(mowCell(f, 0, 99, 0)).toBe(false);
  });
});

describe('mowStroke', () => {
  it('2点の間を埋めて刈る（速く指を動かしても飛ばさない）', () => {
    const f = createField(16, 16);

    const changed = mowStroke(f, 2, 2, 12, 2, 0, 0);

    expect(changed).toBe(11);
    for (let x = 2; x <= 12; x++) {
      expect(f.veg[idx(f, x, 2)]).toBe(0);
    }
    expect(f.veg[idx(f, 1, 2)]).toBe(3);
    expect(f.veg[idx(f, 13, 2)]).toBe(3);
  });

  it('筆の太さぶん周囲も刈る', () => {
    const f = createField(16, 16);

    mowStroke(f, 5, 5, 5, 5, 0, 1);

    expect(f.veg[idx(f, 5, 5)]).toBe(0);
    expect(f.veg[idx(f, 4, 5)]).toBe(0);
    expect(f.veg[idx(f, 6, 5)]).toBe(0);
    expect(f.veg[idx(f, 5, 4)]).toBe(0);
    expect(f.veg[idx(f, 5, 6)]).toBe(0);
    // 半径1の円なので四隅は入らない
    expect(f.veg[idx(f, 4, 4)]).toBe(3);
  });

  it('同じ所を二度なぞっても二度目は何も変わらない', () => {
    const f = createField(16, 16);

    const first = mowStroke(f, 5, 5, 5, 5, 0, 0);
    const second = mowStroke(f, 5, 5, 5, 5, 0, 0);

    expect(first).toBe(1);
    expect(second).toBe(0);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- mow`
Expected: FAIL（`Cannot find module './mow'`）

- [ ] **Step 3: mow.ts を書く**

`src/game/mow.ts`

```ts
import { Field, Kind } from './types';
import { idx, inBounds } from './field';

/**
 * 1 マスを刈高まで刈る。
 * 下げる方向にしか動かない。刈高以下の草には何もしない（種を撒く操作は存在しない）。
 * @returns 実際に変化したか
 */
export function mowCell(field: Field, x: number, y: number, height: number): boolean {
  if (!inBounds(field, x, y)) return false;
  const i = idx(field, x, y);
  if (field.kind[i] !== Kind.Natural) return false;
  if (field.veg[i] <= height) return false;
  field.veg[i] = height;
  field.frac[i] = 0;
  return true;
}

/**
 * (x0,y0) から (x1,y1) までを、半径 radius の丸い筆で刈る。
 * 指のサンプリングは飛び飛びに届くため、区間を必ず埋める。
 * @returns 実際に変化したマス数
 */
export function mowStroke(
  field: Field,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  height: number,
  radius: number
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  let changed = 0;
  const touched = new Set<number>();

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);
    changed += mowBrush(field, cx, cy, height, radius, touched);
  }
  return changed;
}

/** 中心 (cx,cy) から半径 radius の円内を刈る */
function mowBrush(
  field: Field,
  cx: number,
  cy: number,
  height: number,
  radius: number,
  touched: Set<number>
): number {
  let changed = 0;
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy > r2) continue;
      if (!inBounds(field, x, y)) continue;
      const i = idx(field, x, y);
      if (touched.has(i)) continue;
      touched.add(i);
      if (mowCell(field, x, y, height)) changed++;
    }
  }
  return changed;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- mow`
Expected: PASS 8 件

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/game
git commit -m "KUSAKARI: 刈る処理を作る（下げる方向のみ）"
```

---

## Task 3: 草が伸びる

**Files:**
- Create: `src/game/growth.ts`
- Test: `src/game/growth.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/game/growth.test.ts`

```ts
import { createField, idx } from './field';
import { growField } from './growth';
import { GROWTH_SECONDS, MAX_STAGE } from './constants';
import { Kind } from './types';

describe('growField', () => {
  it('経過0秒なら何も変わらない', () => {
    const f = createField(2, 2);
    const before = Uint8Array.from(f.veg);

    growField(f, 0);

    expect(Array.from(f.veg)).toEqual(Array.from(before));
  });

  it('段階に必要な秒数が経つとちょうど1段上がる', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.frac.fill(0);

    growField(f, GROWTH_SECONDS[0]);

    expect(f.veg[0]).toBe(1);
    expect(f.frac[0]).toBe(0);
  });

  it('半分だけ経つと進捗が半分になる', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.frac.fill(0);

    growField(f, GROWTH_SECONDS[0] / 2);

    expect(f.veg[0]).toBe(0);
    expect(f.frac[0]).toBe(128);
  });

  it('進捗の途中から続きを伸ばす', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.frac.fill(128);

    growField(f, GROWTH_SECONDS[0] / 2);

    expect(f.veg[0]).toBe(1);
  });

  it('何段でもまたいで伸びる', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.frac.fill(0);

    growField(f, GROWTH_SECONDS[0] + GROWTH_SECONDS[1] + GROWTH_SECONDS[2]);

    expect(f.veg[0]).toBe(3);
  });

  it('何日放置しても密林で止まる', () => {
    const f = createField(2, 2);
    f.veg.fill(0);

    growField(f, 60 * 60 * 24 * 30);

    expect(f.veg[0]).toBe(MAX_STAGE);
    expect(f.frac[0]).toBe(255);
  });

  it('建物のマスには草が生えない', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.kind[idx(f, 0, 0)] = Kind.Building;

    growField(f, 60 * 60 * 24);

    expect(f.veg[idx(f, 0, 0)]).toBe(0);
    expect(f.veg[idx(f, 1, 0)]).toBe(MAX_STAGE);
  });

  it('伸びたマスの数を返す', () => {
    const f = createField(2, 2);
    f.veg.fill(0);
    f.veg[idx(f, 0, 0)] = MAX_STAGE;
    f.frac[idx(f, 0, 0)] = 255;

    const grown = growField(f, GROWTH_SECONDS[0]);

    expect(grown).toBe(3);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- growth`
Expected: FAIL（`Cannot find module './growth'`）

- [ ] **Step 3: growth.ts を書く**

`src/game/growth.ts`

```ts
import { Field, Kind } from './types';
import { GROWTH_SECONDS, MAX_STAGE } from './constants';

/**
 * 経過秒数ぶん草を伸ばす。
 *
 * 閉じている間に何かを動かし続けることはしない。起動時にこの関数を 1 回呼び、
 * 経過時間をまとめて反映する。dt が何日ぶんであっても密林で頭打ちになるため、
 * ループは必ず終わる。
 *
 * @returns 段階が上がったマスの数
 */
export function growField(field: Field, dtSeconds: number): number {
  if (dtSeconds <= 0) return 0;
  let grown = 0;

  for (let i = 0; i < field.veg.length; i++) {
    if (field.kind[i] !== Kind.Natural) continue;

    let stage = field.veg[i];
    if (stage >= MAX_STAGE) {
      field.frac[i] = 255;
      continue;
    }

    let frac = field.frac[i];
    let remain = dtSeconds;
    const startStage = stage;

    while (stage < MAX_STAGE && remain > 0) {
      const perStage = GROWTH_SECONDS[stage];
      const toNext = (perStage * (256 - frac)) / 256;
      if (remain >= toNext) {
        remain -= toNext;
        stage++;
        frac = 0;
      } else {
        frac = Math.min(255, Math.floor(frac + (remain / perStage) * 256));
        remain = 0;
      }
    }

    if (stage >= MAX_STAGE) {
      stage = MAX_STAGE;
      frac = 255;
    }

    field.veg[i] = stage;
    field.frac[i] = frac;
    if (stage > startStage) grown++;
  }

  return grown;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- growth`
Expected: PASS 8 件

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/game
git commit -m "KUSAKARI: 経過時間から草を伸ばす処理を作る"
```

---

## Task 4: 建物と人口

**Files:**
- Create: `src/game/buildings.ts`
- Test: `src/game/buildings.test.ts`

プレイヤーは建物を建てない。土地を整えると勝手に建つ。倒壊も自動である。

判定規則（この 2 つだけ）:

- **建つ**: 自然地で段階が 1 以下、かつ上下左右 4 マスもすべて自然地で段階 1 以下 → そのマスが建物になる
- **飲まれる**: 建物の上下左右 4 マスのいずれかが自然地で段階 3 以上 → その建物は消えて更地の自然地に戻る

走査は行優先で、飲まれる判定を先に、建つ判定を後に行う。1 回の走査中に建った建物は「自然地ではない」ため隣に建物は建たない。結果として建物は自然に散らばる。

- [ ] **Step 1: 失敗するテストを書く**

`src/game/buildings.test.ts`

```ts
import { createField, idx } from './field';
import { updateBuildings, countBuildings, population, civilLevelName } from './buildings';
import { Kind } from './types';
import { POPULATION_PER_BUILDING } from './constants';

/** (x,y) を中心にした十字（5マス）を段階 stage の自然地にする */
function clearPlus(f: ReturnType<typeof createField>, x: number, y: number, stage = 0) {
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const i = idx(f, x + dx, y + dy);
    f.kind[i] = Kind.Natural;
    f.veg[i] = stage;
  }
}

describe('updateBuildings 建つ', () => {
  it('十字に刈れていると中心に建物が建つ', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 0);

    const r = updateBuildings(f);

    expect(r.built).toBe(1);
    expect(f.kind[idx(f, 3, 3)]).toBe(Kind.Building);
  });

  it('段階1（芝）でも建つ', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 1);

    const r = updateBuildings(f);

    expect(r.built).toBe(1);
  });

  it('隣が1マスでも草地（段階2）だと建たない', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 0);
    f.veg[idx(f, 4, 3)] = 2;

    const r = updateBuildings(f);

    expect(r.built).toBe(0);
    expect(f.kind[idx(f, 3, 3)]).toBe(Kind.Natural);
  });

  it('盤面の縁には建たない', () => {
    const f = createField(8, 8);
    f.veg.fill(0);

    const r = updateBuildings(f);

    for (let x = 0; x < 8; x++) {
      expect(f.kind[idx(f, x, 0)]).toBe(Kind.Natural);
      expect(f.kind[idx(f, x, 7)]).toBe(Kind.Natural);
    }
    expect(r.built).toBeGreaterThan(0);
  });

  it('建物の隣には建物が建たない', () => {
    const f = createField(8, 8);
    f.veg.fill(0);

    updateBuildings(f);

    for (let y = 1; y < 7; y++) {
      for (let x = 1; x < 7; x++) {
        if (f.kind[idx(f, x, y)] !== Kind.Building) continue;
        expect(f.kind[idx(f, x + 1, y)]).not.toBe(Kind.Building);
        expect(f.kind[idx(f, x, y + 1)]).not.toBe(Kind.Building);
      }
    }
  });
});

describe('updateBuildings 飲まれる', () => {
  it('隣が低木（段階3）まで伸びると建物が消える', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 0);
    updateBuildings(f);
    expect(f.kind[idx(f, 3, 3)]).toBe(Kind.Building);

    f.veg[idx(f, 4, 3)] = 3;
    const r = updateBuildings(f);

    expect(r.lost).toBe(1);
    expect(f.kind[idx(f, 3, 3)]).toBe(Kind.Natural);
    expect(f.veg[idx(f, 3, 3)]).toBe(0);
  });

  it('隣が草地（段階2）までなら残る', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 0);
    updateBuildings(f);

    f.veg[idx(f, 4, 3)] = 2;
    const r = updateBuildings(f);

    expect(r.lost).toBe(0);
    expect(f.kind[idx(f, 3, 3)]).toBe(Kind.Building);
  });
});

describe('人口と文明レベル', () => {
  it('建物1軒あたりの人口を数える', () => {
    const f = createField(8, 8);
    clearPlus(f, 3, 3, 0);
    updateBuildings(f);

    expect(countBuildings(f)).toBe(1);
    expect(population(f)).toBe(POPULATION_PER_BUILDING);
  });

  it('人口で文明レベルが決まる', () => {
    expect(civilLevelName(0)).toBe('空き地');
    expect(civilLevelName(49)).toBe('空き地');
    expect(civilLevelName(50)).toBe('集落');
    expect(civilLevelName(200)).toBe('村');
    expect(civilLevelName(1000)).toBe('町');
    expect(civilLevelName(99999)).toBe('町');
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- buildings`
Expected: FAIL（`Cannot find module './buildings'`）

- [ ] **Step 3: buildings.ts を書く**

`src/game/buildings.ts`

```ts
import { Field, Kind } from './types';
import { idx } from './field';
import {
  BUILDABLE_MAX_STAGE,
  COLLAPSE_STAGE,
  CIVIL_LEVELS,
  POPULATION_PER_BUILDING,
} from './constants';

export interface BuildingChange {
  built: number;
  lost: number;
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * 建物の自動建設と倒壊を 1 回ぶん進める。
 *
 * 走査は行優先。飲まれる判定を先に、建つ判定を後に行う。
 * 建った建物は自然地ではなくなるため、同じ走査の中でその隣に建物は建たない。
 * これにより建物は自然に散らばる。
 */
export function updateBuildings(field: Field): BuildingChange {
  let built = 0;
  let lost = 0;

  // 1周目: 草に飲まれた建物を消す
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const i = idx(field, x, y);
      if (field.kind[i] !== Kind.Building) continue;
      if (!isSwallowed(field, x, y)) continue;
      field.kind[i] = Kind.Natural;
      field.veg[i] = 0;
      field.frac[i] = 0;
      lost++;
    }
  }

  // 2周目: 十字に整った所へ建てる
  for (let y = 1; y < field.h - 1; y++) {
    for (let x = 1; x < field.w - 1; x++) {
      if (!isBuildable(field, x, y)) continue;
      const i = idx(field, x, y);
      field.kind[i] = Kind.Building;
      field.veg[i] = 0;
      field.frac[i] = 0;
      built++;
    }
  }

  return { built, lost };
}

/** 中心とその上下左右がすべて「自然地かつ段階1以下」か */
function isBuildable(field: Field, x: number, y: number): boolean {
  const i = idx(field, x, y);
  if (field.kind[i] !== Kind.Natural) return false;
  if (field.veg[i] > BUILDABLE_MAX_STAGE) return false;
  for (const [dx, dy] of NEIGHBORS) {
    const j = idx(field, x + dx, y + dy);
    if (field.kind[j] !== Kind.Natural) return false;
    if (field.veg[j] > BUILDABLE_MAX_STAGE) return false;
  }
  return true;
}

/** 上下左右のいずれかが「自然地かつ段階3以上」か */
function isSwallowed(field: Field, x: number, y: number): boolean {
  for (const [dx, dy] of NEIGHBORS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= field.w || ny >= field.h) continue;
    const j = idx(field, nx, ny);
    if (field.kind[j] === Kind.Natural && field.veg[j] >= COLLAPSE_STAGE) return true;
  }
  return false;
}

export function countBuildings(field: Field): number {
  let n = 0;
  for (let i = 0; i < field.kind.length; i++) {
    if (field.kind[i] === Kind.Building) n++;
  }
  return n;
}

export function population(field: Field): number {
  return countBuildings(field) * POPULATION_PER_BUILDING;
}

/** 人口から文明レベルの名前を返す */
export function civilLevelName(pop: number): string {
  for (const level of CIVIL_LEVELS) {
    if (pop >= level.minPopulation) return level.name;
  }
  return CIVIL_LEVELS[CIVIL_LEVELS.length - 1].name;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- buildings`
Expected: PASS 9 件

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/game
git commit -m "KUSAKARI: 建物の自動建設と倒壊、人口を作る"
```

---

## Task 5: 一括計算と復帰レポート

**Files:**
- Create: `src/game/simulate.ts`
- Create: `src/game/report.ts`
- Test: `src/game/simulate.test.ts`
- Test: `src/game/report.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/game/simulate.test.ts`

```ts
import { createField, idx } from './field';
import { simulate } from './simulate';
import { GROWTH_SECONDS } from './constants';
import { Kind } from './types';

describe('simulate', () => {
  it('草を伸ばしてから建物を更新する', () => {
    const f = createField(8, 8);
    f.veg.fill(0);

    const r = simulate(f, 1);

    expect(r.built).toBeGreaterThan(0);
    expect(r.populationBefore).toBe(0);
    expect(r.populationAfter).toBe(r.built * 10);
  });

  it('長く放置すると建物が草に飲まれる', () => {
    const f = createField(8, 8);
    f.veg.fill(0);
    simulate(f, 1);
    const before = r0Count(f);
    expect(before).toBeGreaterThan(0);

    const r = simulate(f, GROWTH_SECONDS[0] + GROWTH_SECONDS[1] + GROWTH_SECONDS[2]);

    expect(r.lost).toBe(before);
    expect(r0Count(f)).toBe(0);
  });

  it('伸びたマスの数を返す', () => {
    const f = createField(4, 4);
    f.veg.fill(0);

    const r = simulate(f, GROWTH_SECONDS[0]);

    expect(r.grown).toBeGreaterThan(0);
  });
});

function r0Count(f: ReturnType<typeof createField>): number {
  let n = 0;
  for (let i = 0; i < f.kind.length; i++) if (f.kind[i] === Kind.Building) n++;
  return n;
}
```

`src/game/report.test.ts`

```ts
import { buildReturnReport } from './report';

describe('buildReturnReport', () => {
  it('留守が短いときは何も報告しない', () => {
    const r = buildReturnReport(30, { grown: 0, built: 0, lost: 0, populationBefore: 0, populationAfter: 0 });
    expect(r.show).toBe(false);
  });

  it('留守時間を日本語にする', () => {
    const r = buildReturnReport(3 * 3600 + 25 * 60, { grown: 5, built: 0, lost: 0, populationBefore: 0, populationAfter: 0 });
    expect(r.awayText).toBe('3時間25分');
  });

  it('1分未満は「わずかな時間」と書く', () => {
    const r = buildReturnReport(45, { grown: 9, built: 0, lost: 0, populationBefore: 0, populationAfter: 0 });
    expect(r.awayText).toBe('わずかな時間');
  });

  it('伸びた・建った・飲まれたを行にする', () => {
    const r = buildReturnReport(7200, {
      grown: 143,
      built: 2,
      lost: 3,
      populationBefore: 50,
      populationAfter: 40,
    });

    expect(r.show).toBe(true);
    expect(r.lines).toContain('143マスの草が伸びました。');
    expect(r.lines).toContain('家が2軒、建ちました。');
    expect(r.lines).toContain('家が3軒、草に飲まれました。');
    expect(r.lines).toContain('人口が10人、減りました。');
  });

  it('変化のない項目は行にしない', () => {
    const r = buildReturnReport(7200, {
      grown: 10,
      built: 0,
      lost: 0,
      populationBefore: 30,
      populationAfter: 30,
    });

    expect(r.lines).toEqual(['10マスの草が伸びました。']);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- simulate report`
Expected: FAIL（`Cannot find module './simulate'`）

- [ ] **Step 3: simulate.ts を書く**

`src/game/simulate.ts`

```ts
import { Field } from './types';
import { growField } from './growth';
import { updateBuildings, population } from './buildings';

export interface SimResult {
  /** 段階が上がったマスの数 */
  grown: number;
  /** 建った建物の数 */
  built: number;
  /** 草に飲まれた建物の数 */
  lost: number;
  populationBefore: number;
  populationAfter: number;
}

/**
 * 盤面を dtSeconds ぶん進める。
 * 草を伸ばしてから建物を更新する。順序は固定で、逆にしてはいけない
 * （伸びた草が建物を飲む判定より先に建物が建つと、1 手ぶんずれる）。
 */
export function simulate(field: Field, dtSeconds: number): SimResult {
  const populationBefore = population(field);
  const grown = growField(field, dtSeconds);
  const { built, lost } = updateBuildings(field);
  const populationAfter = population(field);
  return { grown, built, lost, populationBefore, populationAfter };
}
```

- [ ] **Step 4: report.ts を書く**

`src/game/report.ts`

```ts
import { SimResult } from './simulate';

export interface ReturnReport {
  /** 表示に値する変化があったか */
  show: boolean;
  /** 「3時間25分」のような留守時間 */
  awayText: string;
  lines: string[];
}

/** これより短い留守は報告しない（秒） */
const MIN_AWAY_SECONDS = 60;

/**
 * 留守中の変化を日本語の行にする。
 * 放置ゲームは「留守中に何が起きたか」を必ず言語化して見せることが心臓部なので、
 * 変化があったのに黙っている状態を作らない。
 */
export function buildReturnReport(awaySeconds: number, r: SimResult): ReturnReport {
  const awayText = formatAway(awaySeconds);
  const lines: string[] = [];

  if (r.grown > 0) lines.push(`${r.grown}マスの草が伸びました。`);
  if (r.built > 0) lines.push(`家が${r.built}軒、建ちました。`);
  if (r.lost > 0) lines.push(`家が${r.lost}軒、草に飲まれました。`);

  const diff = r.populationAfter - r.populationBefore;
  if (diff > 0) lines.push(`人口が${diff}人、増えました。`);
  if (diff < 0) lines.push(`人口が${-diff}人、減りました。`);

  const show = awaySeconds >= MIN_AWAY_SECONDS && lines.length > 0;
  return { show, awayText, lines };
}

function formatAway(seconds: number): string {
  if (seconds < 60) return 'わずかな時間';
  const totalMinutes = Math.floor(seconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}日${hours}時間`;
  if (hours > 0) return `${hours}時間${minutes}分`;
  return `${minutes}分`;
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- simulate report`
Expected: PASS 8 件

- [ ] **Step 6: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/game
git commit -m "KUSAKARI: 経過時間の一括計算と復帰レポートを作る"
```

---

## Task 6: 保存形式（ランレングス圧縮）

**Files:**
- Create: `src/storage/codec.ts`
- Test: `src/storage/codec.test.ts`

草原はほぼ同じ値が続くため、ランレングス圧縮がよく効く。保存形式には版番号を付ける。段階2で `wear`（土壌の疲弊）配列が増えるため、そのときに版を上げて移行する。

形式: `<版>|<幅>|<高さ>|<vegのRLE>|<fracのRLE>|<kindのRLE>`
RLE は `値xの個数` を `,` で連結する。例: 全 1024 マスが段階3なら `3x1024`。

- [ ] **Step 1: 失敗するテストを書く**

`src/storage/codec.test.ts`

```ts
import { createField, idx } from '../game/field';
import { encodeField, decodeField } from './codec';
import { Kind } from '../game/types';

describe('codec', () => {
  it('作りたての盤面は短い文字列になる', () => {
    const f = createField(32, 32);
    const s = encodeField(f);
    expect(s).toBe('1|32|32|3x1024|0x1024|0x1024');
  });

  it('往復しても同じ盤面に戻る', () => {
    const f = createField(8, 8);
    f.veg[idx(f, 0, 0)] = 5;
    f.frac[idx(f, 0, 0)] = 200;
    f.veg[idx(f, 3, 3)] = 0;
    f.kind[idx(f, 3, 3)] = Kind.Building;

    const back = decodeField(encodeField(f));

    expect(back.w).toBe(8);
    expect(back.h).toBe(8);
    expect(Array.from(back.veg)).toEqual(Array.from(f.veg));
    expect(Array.from(back.frac)).toEqual(Array.from(f.frac));
    expect(Array.from(back.kind)).toEqual(Array.from(f.kind));
  });

  it('壊れた文字列は null を返す', () => {
    expect(decodeField('')).toBeNull();
    expect(decodeField('ごみ')).toBeNull();
    expect(decodeField('1|8|8|3x10|0x64|0x64')).toBeNull();
  });

  it('知らない版番号は null を返す', () => {
    expect(decodeField('99|8|8|3x64|0x64|0x64')).toBeNull();
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npm test -- codec`
Expected: FAIL（`Cannot find module './codec'`）

- [ ] **Step 3: codec.ts を書く**

`src/storage/codec.ts`

```ts
import { Field } from '../game/types';

/**
 * 保存形式の版。
 * 段階2で wear（土壌の疲弊）配列が増えるため、そのときに 2 へ上げる。
 * 版 1 を読んだときは wear を 0 で埋めれば移行できる。
 */
const VERSION = 1;

/** Field を文字列にする。形式: 版|幅|高さ|veg|frac|kind */
export function encodeField(field: Field): string {
  return [
    VERSION,
    field.w,
    field.h,
    rleEncode(field.veg),
    rleEncode(field.frac),
    rleEncode(field.kind),
  ].join('|');
}

/** 文字列を Field に戻す。読めなければ null */
export function decodeField(s: string): Field | null {
  const parts = s.split('|');
  if (parts.length !== 6) return null;

  const version = Number(parts[0]);
  if (version !== VERSION) return null;

  const w = Number(parts[1]);
  const h = Number(parts[2]);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) return null;

  const n = w * h;
  const veg = rleDecode(parts[3], n);
  const frac = rleDecode(parts[4], n);
  const kind = rleDecode(parts[5], n);
  if (!veg || !frac || !kind) return null;

  return { w, h, veg, frac, kind };
}

function rleEncode(a: Uint8Array): string {
  if (a.length === 0) return '';
  const out: string[] = [];
  let value = a[0];
  let count = 1;
  for (let i = 1; i < a.length; i++) {
    if (a[i] === value) {
      count++;
    } else {
      out.push(`${value}x${count}`);
      value = a[i];
      count = 1;
    }
  }
  out.push(`${value}x${count}`);
  return out.join(',');
}

/** 展開する。総数が expected と食い違えば null */
function rleDecode(s: string, expected: number): Uint8Array | null {
  if (s.length === 0) return null;
  const out = new Uint8Array(expected);
  let pos = 0;

  for (const chunk of s.split(',')) {
    const at = chunk.indexOf('x');
    if (at < 0) return null;
    const value = Number(chunk.slice(0, at));
    const count = Number(chunk.slice(at + 1));
    if (!Number.isInteger(value) || !Number.isInteger(count)) return null;
    if (value < 0 || value > 255 || count <= 0) return null;
    if (pos + count > expected) return null;
    out.fill(value, pos, pos + count);
    pos += count;
  }

  if (pos !== expected) return null;
  return out;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- codec`
Expected: PASS 4 件

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/storage
git commit -m "KUSAKARI: 盤面の保存形式（RLE・版番号つき）を作る"
```

---

## Task 7: AsyncStorage への保存と読み込み

**Files:**
- Create: `src/storage/save.ts`

AsyncStorage を触る層は薄く保ち、ロジックは Task 6 の codec に寄せてある。ここはユニットテストを書かず、Task 12 の実機確認で担保する。

- [ ] **Step 1: save.ts を書く**

`src/storage/save.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field } from '../game/types';
import { encodeField, decodeField } from './codec';

const KEY = 'kusakari/save/v1';

export interface LoadedSave {
  field: Field;
  /** 前回保存した時刻（ミリ秒） */
  savedAt: number;
}

/** 盤面と保存時刻を書く */
export async function saveGame(field: Field, now: number = Date.now()): Promise<void> {
  const payload = JSON.stringify({ field: encodeField(field), savedAt: now });
  await AsyncStorage.setItem(KEY, payload);
}

/** 盤面と保存時刻を読む。無ければ、あるいは壊れていれば null */
export async function loadGame(): Promise<LoadedSave | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { field?: unknown; savedAt?: unknown };
    if (typeof parsed.field !== 'string' || typeof parsed.savedAt !== 'number') return null;
    const field = decodeField(parsed.field);
    if (!field) return null;
    return { field, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/** セーブを消す（タイトルの「最初から」用） */
export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
```

- [ ] **Step 2: 型が通ることを確認する**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/storage
git commit -m "KUSAKARI: AsyncStorage への保存と読み込みを作る"
```

---

## Task 8: Skia で盤面を描く

**Files:**
- Create: `src/render/palette.ts`
- Create: `src/render/FieldCanvas.tsx`

**このタスクの最重要要件: 見た目を差し替えるときにゲームロジックへ触らずに済むこと。** 色は `palette.ts` に、描画は `FieldCanvas.tsx` に閉じ込める。この 2 ファイル以外に色やマスの見せ方を書かない。

- [ ] **Step 1: 仮の見た目の色を定義する**

`src/render/palette.ts`

```ts
/**
 * 段階1で使う仮の見た目。
 * 本番の絵柄は、段階1を触って 1 マスの実寸と画面に入るマス数が実測で出てから決める。
 * 差し替えるのはこのファイルと FieldCanvas.tsx だけで済むようにしてある。
 */

/** 植生段階 0..5 の色。0 更地 / 1 芝 / 2 草地 / 3 低木 / 4 森 / 5 密林 */
export const STAGE_COLORS = [
  '#c2a878', // 0 更地（土）
  '#a7d16a', // 1 芝
  '#7cb342', // 2 草地
  '#558b2f', // 3 低木
  '#33691e', // 4 森
  '#1b3d10', // 5 密林
] as const;

/** 建物 */
export const BUILDING_COLOR = '#f5f0e6';

/** 盤面の外側 */
export const BACKGROUND_COLOR = '#141a12';
```

- [ ] **Step 2: FieldCanvas.tsx を書く**

`src/render/FieldCanvas.tsx`

1024 個の `<Rect>` を React 要素として並べると再描画が重くなるため、`createPicture` で 1 枚の `SkPicture` にまとめてから描く。

```tsx
import React, { useMemo } from 'react';
import { Canvas, Picture, createPicture, Skia, Group } from '@shopify/react-native-skia';
import { Field, Kind } from '../game/types';
import { STAGE_COLORS, BUILDING_COLOR, BACKGROUND_COLOR } from './palette';

interface Props {
  field: Field;
  /** 盤面が変わるたびに増える値。これが変わったときだけ描き直す */
  revision: number;
  /** 1 マスの辺の長さ（px） */
  cellSize: number;
  width: number;
  height: number;
  /** カメラ */
  translateX: number;
  translateY: number;
  scale: number;
}

export function FieldCanvas({
  field,
  revision,
  cellSize,
  width,
  height,
  translateX,
  translateY,
  scale,
}: Props) {
  const picture = useMemo(() => {
    return createPicture((canvas) => {
      const paint = Skia.Paint();

      for (let y = 0; y < field.h; y++) {
        for (let x = 0; x < field.w; x++) {
          const i = y * field.w + x;
          const color =
            field.kind[i] === Kind.Building
              ? BUILDING_COLOR
              : STAGE_COLORS[Math.min(field.veg[i], STAGE_COLORS.length - 1)];
          paint.setColor(Skia.Color(color));
          canvas.drawRect(
            { x: x * cellSize, y: y * cellSize, width: cellSize, height: cellSize },
            paint
          );
        }
      }
    });
    // revision が変わったときだけ作り直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, cellSize, field.w, field.h]);

  return (
    <Canvas style={{ width, height, backgroundColor: BACKGROUND_COLOR }}>
      <Group transform={[{ translateX }, { translateY }, { scale }]}>
        <Picture picture={picture} />
      </Group>
    </Canvas>
  );
}
```

- [ ] **Step 3: 型が通ることを確認する**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/render
git commit -m "KUSAKARI: Skia で盤面を描く（仮の見た目）"
```

---

## Task 9: 状態の持ち回り

**Files:**
- Create: `src/store/useGame.tsx`

- [ ] **Step 1: useGame.tsx を書く**

`src/store/useGame.tsx`

```tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Field } from '../game/types';
import { createField } from '../game/field';
import { simulate } from '../game/simulate';
import { population, civilLevelName } from '../game/buildings';
import { buildReturnReport, ReturnReport } from '../game/report';
import { saveGame, loadGame, clearSave } from '../storage/save';

/** 自動保存の間隔（ミリ秒） */
const AUTOSAVE_MS = 10_000;
/** 起動中に草を伸ばす刻み（ミリ秒） */
const TICK_MS = 1000;

interface GameContextValue {
  hydrated: boolean;
  hasSave: boolean;
  field: Field;
  revision: number;
  populationNow: number;
  civilLevel: string;
  mowHeight: number;
  setMowHeight: (h: number) => void;
  returnReport: ReturnReport | null;
  dismissReport: () => void;
  /** 刈った後に呼ぶ。描画の更新と保存の予約を行う */
  touched: () => void;
  startNew: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const fieldRef = useRef<Field>(createField());
  const [revision, setRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [mowHeight, setMowHeight] = useState(0);
  const [returnReport, setReturnReport] = useState<ReturnReport | null>(null);

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  // 起動時: セーブを読み、留守時間ぶんを 1 回で計算する
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadGame();
      if (cancelled) return;

      if (loaded) {
        fieldRef.current = loaded.field;
        const awaySeconds = Math.max(0, (Date.now() - loaded.savedAt) / 1000);
        const result = simulate(fieldRef.current, awaySeconds);
        const report = buildReturnReport(awaySeconds, result);
        if (report.show) setReturnReport(report);
        setHasSave(true);
      }
      setHydrated(true);
      bump();
    })();
    return () => {
      cancelled = true;
    };
  }, [bump]);

  // 起動中も草は伸びる
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      simulate(fieldRef.current, TICK_MS / 1000);
      bump();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [hydrated, bump]);

  // 自動保存
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      void saveGame(fieldRef.current);
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [hydrated]);

  // 背景に回るときは必ず保存する（これが留守時間の起点になる）
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void saveGame(fieldRef.current);
    });
    return () => sub.remove();
  }, []);

  const startNew = useCallback(async () => {
    await clearSave();
    fieldRef.current = createField();
    setReturnReport(null);
    setHasSave(false);
    bump();
    await saveGame(fieldRef.current);
  }, [bump]);

  const value: GameContextValue = {
    hydrated,
    hasSave,
    field: fieldRef.current,
    revision,
    populationNow: population(fieldRef.current),
    civilLevel: civilLevelName(population(fieldRef.current)),
    mowHeight,
    setMowHeight,
    returnReport,
    dismissReport: () => setReturnReport(null),
    touched: bump,
    startNew,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const v = useContext(GameContext);
  if (!v) throw new Error('useGame は GameProvider の中で呼ぶこと');
  return v;
}
```

- [ ] **Step 2: 型が通ることを確認する**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/store
git commit -m "KUSAKARI: 盤面の保持・自動保存・起動時の一括計算をまとめる"
```

---

## Task 10: 刈高ダイヤルと HUD

**Files:**
- Create: `src/ui/MowHeightDial.tsx`
- Create: `src/ui/Hud.tsx`
- Create: `src/ui/ReturnReport.tsx`

- [ ] **Step 1: MowHeightDial.tsx を書く**

`src/ui/MowHeightDial.tsx`

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { STAGE_COLORS } from '../render/palette';

const LABELS = ['更地', '芝', '草地', '低木', '森'];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

/**
 * 刈高ダイヤル。選んだ段階まで刈って止まる。
 * 段階5（密林）は「そこで刈り止める」対象にならないため選べない。
 */
export function MowHeightDial({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {LABELS.map((label, stage) => {
        const selected = stage === value;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(stage)}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <View style={[styles.swatch, { backgroundColor: STAGE_COLORS[stage] }]} />
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  item: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: { borderColor: '#f5f0e6', backgroundColor: 'rgba(255,255,255,0.08)' },
  swatch: { width: 24, height: 24, borderRadius: 4, marginBottom: 4 },
  label: { color: '#9aa78f', fontSize: 11 },
  labelSelected: { color: '#f5f0e6', fontWeight: '600' },
});
```

- [ ] **Step 2: Hud.tsx を書く**

`src/ui/Hud.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  population: number;
  civilLevel: string;
}

export function Hud({ population, civilLevel }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.item}>人口 {population}</Text>
      <Text style={styles.item}>{civilLevel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  item: { color: '#f5f0e6', fontSize: 15, fontWeight: '600' },
});
```

- [ ] **Step 3: ReturnReport.tsx を書く**

`src/ui/ReturnReport.tsx`

```tsx
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { ReturnReport as Report } from '../game/report';

interface Props {
  report: Report | null;
  onDismiss: () => void;
}

export function ReturnReportModal({ report, onDismiss }: Props) {
  if (!report || !report.show) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>留守のあいだに</Text>
          <Text style={styles.away}>{report.awayText}</Text>
          {report.lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonLabel}>刈りに行く</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: { backgroundColor: '#1f2a1a', borderRadius: 12, padding: 24, width: '100%' },
  title: { color: '#9aa78f', fontSize: 13, marginBottom: 4 },
  away: { color: '#f5f0e6', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  line: { color: '#e8e4d8', fontSize: 15, lineHeight: 26 },
  button: {
    marginTop: 20,
    backgroundColor: '#558b2f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 4: 型が通ることを確認する**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/ui
git commit -m "KUSAKARI: 刈高ダイヤル・HUD・復帰レポートの表示を作る"
```

---

## Task 11: 本編の画面とジェスチャ

**Files:**
- Create: `src/screens/FieldScreen.tsx`

**この計画で最も体験を左右するタスク。** 1 本指と 2 本指を確実に分ける。作業中にカメラが動く誤爆は体験を最も損なうため、カメラは必ず 2 本指に閉じ込める。

- [ ] **Step 1: FieldScreen.tsx を書く**

`src/screens/FieldScreen.tsx`

```tsx
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGame } from '../store/useGame';
import { FieldCanvas } from '../render/FieldCanvas';
import { MowHeightDial } from '../ui/MowHeightDial';
import { Hud } from '../ui/Hud';
import { ReturnReportModal } from '../ui/ReturnReport';
import { mowStroke } from '../game/mow';

/** 筆の太さ（マス） */
const BRUSH_RADIUS = 1;
/** 振動を出す間隔（ミリ秒）。毎フレーム出すと煩い */
const HAPTIC_INTERVAL_MS = 120;

export function FieldScreen() {
  const { field, revision, populationNow, civilLevel, mowHeight, setMowHeight, returnReport, dismissReport, touched } =
    useGame();
  const { width } = useWindowDimensions();

  const boardSize = width;
  const cellSize = boardSize / field.w;

  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const cameraStart = useRef({ x: 0, y: 0, scale: 1 });
  const lastCell = useRef<{ x: number; y: number } | null>(null);
  const lastHaptic = useRef(0);

  /** 画面座標をマス座標へ。カメラ変換の逆をかける */
  const toCell = useCallback(
    (px: number, py: number) => {
      const x = Math.floor((px - camera.x) / camera.scale / cellSize);
      const y = Math.floor((py - camera.y) / camera.scale / cellSize);
      return { x, y };
    },
    [camera, cellSize]
  );

  const doMow = useCallback(
    (px: number, py: number, isStart: boolean) => {
      const cell = toCell(px, py);
      const from = isStart || !lastCell.current ? cell : lastCell.current;
      const changed = mowStroke(field, from.x, from.y, cell.x, cell.y, mowHeight, BRUSH_RADIUS);
      lastCell.current = cell;

      if (changed > 0) {
        touched();
        const now = Date.now();
        if (now - lastHaptic.current > HAPTIC_INTERVAL_MS) {
          lastHaptic.current = now;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [field, mowHeight, toCell, touched]
  );

  const endMow = useCallback(() => {
    lastCell.current = null;
  }, []);

  // 1 本指 = 刈る
  const mowGesture = Gesture.Pan()
    .maxPointers(1)
    .onBegin((e) => {
      runOnJS(doMow)(e.x, e.y, true);
    })
    .onUpdate((e) => {
      runOnJS(doMow)(e.x, e.y, false);
    })
    .onFinalize(() => {
      runOnJS(endMow)();
    });

  // 2 本指 = カメラ移動
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onBegin(() => {
      runOnJS(rememberCamera)();
    })
    .onUpdate((e) => {
      runOnJS(moveCamera)(e.translationX, e.translationY);
    });

  // ピンチ = 拡大縮小
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(rememberCamera)();
    })
    .onUpdate((e) => {
      runOnJS(zoomCamera)(e.scale);
    });

  function rememberCamera() {
    cameraStart.current = { x: camera.x, y: camera.y, scale: camera.scale };
  }

  function moveCamera(dx: number, dy: number) {
    setCamera((c) => ({ ...c, x: cameraStart.current.x + dx, y: cameraStart.current.y + dy }));
  }

  function zoomCamera(factor: number) {
    const scale = Math.min(4, Math.max(0.5, cameraStart.current.scale * factor));
    setCamera((c) => ({ ...c, scale }));
  }

  const gesture = Gesture.Race(mowGesture, Gesture.Simultaneous(panGesture, pinchGesture));

  return (
    <View style={styles.root}>
      <Hud population={populationNow} civilLevel={civilLevel} />
      <GestureDetector gesture={gesture}>
        <View style={{ width: boardSize, height: boardSize }}>
          <FieldCanvas
            field={field}
            revision={revision}
            cellSize={cellSize}
            width={boardSize}
            height={boardSize}
            translateX={camera.x}
            translateY={camera.y}
            scale={camera.scale}
          />
        </View>
      </GestureDetector>
      <MowHeightDial value={mowHeight} onChange={setMowHeight} />
      <ReturnReportModal report={returnReport} onDismiss={dismissReport} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141a12', justifyContent: 'center' },
});
```

- [ ] **Step 2: 型が通ることを確認する**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/src/screens
git commit -m "KUSAKARI: 本編の画面とジェスチャ（1本指=刈る / 2本指=カメラ）を作る"
```

---

## Task 12: タイトル画面と組み立て

**Files:**
- Create: `src/screens/TitleScreen.tsx`
- Modify: `App.tsx`（雛形の内容をすべて置き換える）
- Modify: `index.ts`（gesture-handler の読み込みを先頭に追加）

- [ ] **Step 1: TitleScreen.tsx を書く**

`src/screens/TitleScreen.tsx`

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  hasSave: boolean;
  onContinue: () => void;
  onStartNew: () => void;
}

export function TitleScreen({ hasSave, onContinue, onStartNew }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>KUSAKARI</Text>
      <Text style={styles.subtitle}>刈らなければ、何も始まらない</Text>

      <View style={styles.buttons}>
        {hasSave && (
          <Pressable style={styles.primary} onPress={onContinue}>
            <Text style={styles.primaryLabel}>つづきから</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondary} onPress={onStartNew}>
          <Text style={styles.secondaryLabel}>さいしょから</Text>
        </Pressable>
      </View>

      <View style={styles.credits}>
        <Text style={styles.credit}>powered by 弁護士法人エース</Text>
        <Text style={styles.credit}>produced by HINANO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141a12', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: '#a7d16a', fontSize: 44, fontWeight: '800', letterSpacing: 6 },
  subtitle: { color: '#9aa78f', fontSize: 14, marginTop: 8 },
  buttons: { marginTop: 56, width: '100%', gap: 12 },
  primary: { backgroundColor: '#558b2f', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  primaryLabel: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondary: {
    borderColor: '#3d4a35',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryLabel: { color: '#9aa78f', fontSize: 16 },
  credits: { position: 'absolute', bottom: 40, alignItems: 'center', gap: 4 },
  credit: { color: '#4d5a44', fontSize: 11 },
});
```

- [ ] **Step 2: App.tsx を書き換える**

`App.tsx`（雛形の中身はすべて捨てる）

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameProvider, useGame } from './src/store/useGame';
import { TitleScreen } from './src/screens/TitleScreen';
import { FieldScreen } from './src/screens/FieldScreen';

function Root() {
  const { hydrated, hasSave, startNew } = useGame();
  const [playing, setPlaying] = useState(false);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141a12', justifyContent: 'center' }}>
        <ActivityIndicator color="#a7d16a" />
      </View>
    );
  }

  if (!playing) {
    return (
      <TitleScreen
        hasSave={hasSave}
        onContinue={() => setPlaying(true)}
        onStartNew={async () => {
          await startNew();
          setPlaying(true);
        }}
      />
    );
  }

  return <FieldScreen />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#141a12' }}>
          <StatusBar style="light" />
          <GameProvider>
            <Root />
          </GameProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: index.ts の先頭に gesture-handler を読み込む**

`index.ts` の**1 行目**に次を足す（他の import より前でなければならない）。

```ts
import 'react-native-gesture-handler';
```

- [ ] **Step 4: 型とテストが通ることを確認する**

Run: `npx tsc --noEmit && npm test`
Expected: 型エラーなし、テスト全件 PASS

- [ ] **Step 5: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari
git commit -m "KUSAKARI: タイトル画面とクレジット、アプリの組み立て"
```

---

## Task 13: 実機で一巡りを確認する

**Files:** なし（確認のみ）

ここまでのユニットテストはロジックしか見ていない。**触り心地と一巡りは目で見て確かめる。**

- [ ] **Step 1: 起動する**

```bash
cd ~/おもちゃ箱/kusakari
npx expo run:ios
```

- [ ] **Step 2: タイトルを確認する**

期待:
- 「KUSAKARI」と 2 行のクレジット（powered by 弁護士法人エース / produced by HINANO）が出る
- 初回はセーブが無いので「さいしょから」だけが出る

- [ ] **Step 3: 刈れることを確認する**

「さいしょから」を押す。期待:
- 盤面全体が低木の色（`#558b2f`）で埋まっている
- 指でなぞると、なぞった所が更地の色（`#c2a878`）に変わり、指に振動が返る
- 十字に広く刈ると、白い四角（建物）が現れる
- 上の HUD の人口が増え、50 を超えると「集落」になる

- [ ] **Step 4: 刈高ダイヤルを確認する**

ダイヤルで「草地」を選んでから、まだ低木の所をなぞる。期待:
- 更地ではなく草地の色（`#7cb342`）で止まる
- すでに更地の所をなぞっても、草は**生えない**（何も起きない）

- [ ] **Step 5: 2 本指のカメラを確認する**

期待:
- 2 本指で動かすと盤面が移動し、**そのとき草は刈れていない**
- 2 本指でつまむと拡大縮小する
- 1 本指でなぞっている最中に画面が動かない

**ここで誤爆が起きる場合、先に進まずジェスチャの設定を直す。** 仕様書 9.1 の通り、カメラは必ず 2 本指に閉じ込める。

- [ ] **Step 6: 放置と復帰を確認する**

いくらか刈って建物を建てたあと、アプリをホームに戻して 3 分以上待つ。戻る。期待:
- 「留守のあいだに」のモーダルが出る
- 留守時間（例「3分」）と、伸びたマス数が書かれている
- 盤面の緑が濃くなっている

- [ ] **Step 7: 保存と再開を確認する**

アプリを完全に終了してから再起動する。期待:
- タイトルに「つづきから」が出る
- 押すと刈った状態が残っている
- 終了していた時間ぶん草が伸びており、復帰レポートが出る

- [ ] **Step 8: 気づいたことを書き留める**

このゲームの正否は触り心地で決まる。次の 4 点について、感じたことを `docs/superpowers/notes/stage1-feel.md` に書く。**ここで得た数字が、絵柄を決めるときの根拠になる**（仕様書 第12節）。

1. 筆の太さ（`BRUSH_RADIUS`）は指に対して適切か
2. 草の伸びる速さ（`GROWTH_SECONDS`）は速すぎないか、遅すぎないか
3. 建物の湧き方は嬉しいか、うるさいか
4. 1 マスが画面上で何ピクセルか、画面に何マス入っているか

- [ ] **Step 9: コミット**

```bash
cd ~/おもちゃ箱
git add kusakari/docs
git commit -m "KUSAKARI: 段階1の触り心地メモ"
```

---

## 完了条件

- [ ] `npm test` が全件通る
- [ ] `npx tsc --noEmit` がエラーなし
- [ ] 実機で「なぞって刈る → 建物が建つ → 閉じる → 戻ると草が伸びていて報告が出る」が一巡りする
- [ ] 1 本指と 2 本指の誤爆がない
- [ ] 種を撒く操作がどこにも存在しない
- [ ] 色とマスの見せ方が `src/render/` の 2 ファイルの外に漏れていない
