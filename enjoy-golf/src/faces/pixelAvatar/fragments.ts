/**
 * 64×64 ピクセル髪型・アクセサリのフラグメント定義
 *
 * 髪型: 透過 '_' は base 保持、その他は上書き（applyHairGrid）
 * アクセ: '.' は no-op、その他は上書き（applyOverlayGrid）
 */

import {
  Grid,
  newGrid,
  fillEllipse,
  fillRect,
  setPixel,
  strokeLine,
} from './draw';

const SIZE = 64;
const CX = 32;

export type HairFragment = Grid;
export type AccessoryOverlay = Grid;

/* ================================================================
   髪型フラグメント
   ================================================================ */

function buildHair(buildFn: (g: Grid) => void): HairFragment {
  const g = newGrid(SIZE, '_');
  buildFn(g);
  return g;
}

/** 髪のシャドウ（右半分を h で塗る共通処理） */
function shadeRightSide(g: Grid, cy: number, cx: number, rx: number, ry: number) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx + 4; x <= cx + rx + 1; x++) {
      const ndx = (x - cx) / rx;
      const ndy = (y - cy) / ry;
      if (ndx * ndx + ndy * ndy <= 1) {
        setPixel(g, x, y, 'h');
      }
    }
  }
}

/** ハイライト（左寄り） */
function highlightLeft(g: Grid, baseY: number) {
  for (let dx = -10; dx <= -3; dx++) {
    setPixel(g, CX + dx, baseY + Math.abs(dx + 6) / 2, 'L');
  }
}

export const HAIR_SHORT: HairFragment = buildHair((g) => {
  // 頭頂のドーム
  fillEllipse(g, CX, 19, 18, 11, 'H');
  // 前髪のサイドバング
  fillEllipse(g, CX - 13, 22, 5, 6, 'H');
  fillEllipse(g, CX + 13, 22, 5, 6, 'H');
  shadeRightSide(g, 19, CX, 18, 11);
  highlightLeft(g, 11);
});

export const HAIR_CREW: HairFragment = buildHair((g) => {
  // タイト・低めのドーム
  fillEllipse(g, CX, 21, 17, 8, 'H');
  // フラットトップ風に頭頂を直線的に
  fillRect(g, CX - 14, 14, 28, 4, 'H');
  shadeRightSide(g, 21, CX, 17, 8);
});

export const HAIR_SLICK: HairFragment = buildHair((g) => {
  // 撫で付け（やや低めで広い）
  fillEllipse(g, CX, 19, 18, 10, 'H');
  fillEllipse(g, CX - 12, 22, 5, 5, 'H');
  fillEllipse(g, CX + 12, 22, 5, 5, 'H');
  // ハイライト線（前頭部に光沢）
  for (let dx = -12; dx <= 12; dx++) {
    setPixel(g, CX + dx, 13, 'L');
  }
  for (let dx = -10; dx <= 10; dx++) {
    setPixel(g, CX + dx, 14, 'L');
  }
  shadeRightSide(g, 19, CX, 18, 10);
});

export const HAIR_POMADE: HairFragment = buildHair((g) => {
  // 立ち上がった前髪
  fillEllipse(g, CX, 17, 16, 10, 'H');
  // 前頭部に小山
  fillEllipse(g, CX, 9, 8, 5, 'H');
  // 艶（ハイライト）
  fillEllipse(g, CX - 2, 9, 4, 3, 'L');
  // サイドバング
  fillEllipse(g, CX - 13, 22, 5, 6, 'H');
  fillEllipse(g, CX + 13, 22, 5, 6, 'H');
  shadeRightSide(g, 17, CX, 16, 10);
});

export const HAIR_BUN: HairFragment = buildHair((g) => {
  // ベース（撫で付け短め）
  fillEllipse(g, CX, 21, 17, 9, 'H');
  // 頭頂のお団子
  fillEllipse(g, CX, 8, 7, 6, 'H');
  // お団子の影
  fillEllipse(g, CX + 2, 9, 5, 4, 'h');
  // 簪のハイライト
  setPixel(g, CX, 5, 'L');
  setPixel(g, CX, 4, 'L');
  shadeRightSide(g, 21, CX, 17, 9);
});

export const HAIR_LONG: HairFragment = buildHair((g) => {
  // 頭頂
  fillEllipse(g, CX, 19, 19, 11, 'H');
  // 横に流れる
  fillRect(g, CX - 19, 18, 4, 30, 'H');
  fillRect(g, CX + 16, 18, 4, 30, 'H');
  // 影（右側）
  fillRect(g, CX + 16, 18, 4, 30, 'h');
  fillEllipse(g, CX - 13, 22, 6, 6, 'H');
  fillEllipse(g, CX + 13, 22, 6, 6, 'H');
  shadeRightSide(g, 19, CX, 19, 11);
});

export const HAIR_BOB: HairFragment = buildHair((g) => {
  // 頭頂
  fillEllipse(g, CX, 19, 20, 12, 'H');
  // 顎ラインで揃えるストレート
  fillRect(g, CX - 20, 18, 5, 28, 'H');
  fillRect(g, CX + 16, 18, 5, 28, 'H');
  // 内側カットの影
  fillRect(g, CX + 16, 18, 5, 28, 'h');
  // 前髪をぱっつん
  fillRect(g, CX - 12, 22, 24, 4, 'H');
  shadeRightSide(g, 19, CX, 20, 12);
});

export const HAIR_WAVY: HairFragment = buildHair((g) => {
  // ベース
  fillEllipse(g, CX, 19, 18, 11, 'H');
  // ウェーブの起伏（頂上に小山複数）
  for (let i = -2; i <= 2; i++) {
    fillEllipse(g, CX + i * 6, 9, 3, 2, 'H');
  }
  // ハイライト
  for (let i = -2; i <= 2; i++) {
    setPixel(g, CX + i * 6, 8, 'L');
  }
  fillEllipse(g, CX - 13, 22, 5, 6, 'H');
  fillEllipse(g, CX + 13, 22, 5, 6, 'H');
  shadeRightSide(g, 19, CX, 18, 11);
});

export const HAIR_BALD: HairFragment = buildHair((g) => {
  // ほぼ何もしない（軽い側頭部の毛のみ）
  fillEllipse(g, CX - 17, 32, 3, 4, 'H');
  fillEllipse(g, CX + 17, 32, 3, 4, 'H');
});

export const HAIR_FRAGMENTS = {
  short: HAIR_SHORT,
  crew: HAIR_CREW,
  slick: HAIR_SLICK,
  pomade: HAIR_POMADE,
  bun: HAIR_BUN,
  long: HAIR_LONG,
  bob: HAIR_BOB,
  wavy: HAIR_WAVY,
  bald: HAIR_BALD,
} as const;

export type HairStyleId = keyof typeof HAIR_FRAGMENTS;

/* ================================================================
   アクセサリオーバーレイ（'.' = no-op）
   ================================================================ */

function buildOverlay(buildFn: (g: Grid) => void): AccessoryOverlay {
  const g = newGrid(SIZE, '.');
  buildFn(g);
  return g;
}

const LEFT_EYE_X = 24;
const RIGHT_EYE_X = 40;
const EYE_Y = 32;

/** 角眼鏡 */
export const ACC_GLASSES_SQUARE: AccessoryOverlay = buildOverlay((g) => {
  // 左フレーム
  for (let x = LEFT_EYE_X - 4; x <= LEFT_EYE_X + 4; x++) {
    setPixel(g, x, EYE_Y - 3, 'E');
    setPixel(g, x, EYE_Y + 3, 'E');
  }
  for (let y = EYE_Y - 3; y <= EYE_Y + 3; y++) {
    setPixel(g, LEFT_EYE_X - 4, y, 'E');
    setPixel(g, LEFT_EYE_X + 4, y, 'E');
  }
  // 右フレーム
  for (let x = RIGHT_EYE_X - 4; x <= RIGHT_EYE_X + 4; x++) {
    setPixel(g, x, EYE_Y - 3, 'E');
    setPixel(g, x, EYE_Y + 3, 'E');
  }
  for (let y = EYE_Y - 3; y <= EYE_Y + 3; y++) {
    setPixel(g, RIGHT_EYE_X - 4, y, 'E');
    setPixel(g, RIGHT_EYE_X + 4, y, 'E');
  }
  // ブリッジ
  setPixel(g, LEFT_EYE_X + 5, EYE_Y, 'E');
  setPixel(g, LEFT_EYE_X + 6, EYE_Y, 'E');
  setPixel(g, LEFT_EYE_X + 7, EYE_Y, 'E');
  setPixel(g, RIGHT_EYE_X - 5, EYE_Y, 'E');
  setPixel(g, RIGHT_EYE_X - 6, EYE_Y, 'E');
  setPixel(g, RIGHT_EYE_X - 7, EYE_Y, 'E');
});

/** 丸眼鏡 */
export const ACC_GLASSES_ROUND: AccessoryOverlay = buildOverlay((g) => {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r <= 4 && r >= 3.2) {
        setPixel(g, LEFT_EYE_X + dx, EYE_Y + dy, 'E');
        setPixel(g, RIGHT_EYE_X + dx, EYE_Y + dy, 'E');
      }
    }
  }
  // ブリッジ
  for (let x = LEFT_EYE_X + 4; x <= RIGHT_EYE_X - 4; x++) {
    setPixel(g, x, EYE_Y, 'E');
  }
});

/** ハーフリム */
export const ACC_GLASSES_HALF: AccessoryOverlay = buildOverlay((g) => {
  for (let x = LEFT_EYE_X - 4; x <= LEFT_EYE_X + 4; x++) {
    setPixel(g, x, EYE_Y - 3, 'E');
  }
  for (let x = RIGHT_EYE_X - 4; x <= RIGHT_EYE_X + 4; x++) {
    setPixel(g, x, EYE_Y - 3, 'E');
  }
  // ブリッジ
  for (let x = LEFT_EYE_X + 4; x <= RIGHT_EYE_X - 4; x++) {
    setPixel(g, x, EYE_Y - 3, 'E');
  }
  // 下部の薄い線
  for (let x = LEFT_EYE_X - 3; x <= LEFT_EYE_X + 3; x++) {
    setPixel(g, x, EYE_Y + 3, 'E');
  }
  for (let x = RIGHT_EYE_X - 3; x <= RIGHT_EYE_X + 3; x++) {
    setPixel(g, x, EYE_Y + 3, 'E');
  }
});

/** サングラス（目を完全に覆う） */
export const ACC_GLASSES_SUN: AccessoryOverlay = buildOverlay((g) => {
  // 左レンズ
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      setPixel(g, LEFT_EYE_X + dx, EYE_Y + dy, 'E');
    }
  }
  // 右レンズ
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      setPixel(g, RIGHT_EYE_X + dx, EYE_Y + dy, 'E');
    }
  }
  // ブリッジ
  for (let x = LEFT_EYE_X + 5; x <= RIGHT_EYE_X - 5; x++) {
    setPixel(g, x, EYE_Y, 'E');
    setPixel(g, x, EYE_Y - 1, 'E');
  }
  // ハイライト
  setPixel(g, LEFT_EYE_X - 2, EYE_Y - 2, 'W');
  setPixel(g, LEFT_EYE_X - 1, EYE_Y - 2, 'W');
  setPixel(g, RIGHT_EYE_X - 2, EYE_Y - 2, 'W');
  setPixel(g, RIGHT_EYE_X - 1, EYE_Y - 2, 'W');
});

/** 口髭 */
export const ACC_MUSTACHE: AccessoryOverlay = buildOverlay((g) => {
  fillEllipse(g, CX, 41, 8, 1.5, 'M');
  fillEllipse(g, CX - 5, 41, 3, 1.5, 'M');
  fillEllipse(g, CX + 5, 41, 3, 1.5, 'M');
});

/** 顎髭 */
export const ACC_GOATEE: AccessoryOverlay = buildOverlay((g) => {
  fillEllipse(g, CX, 47, 4, 4, 'M');
});

/** 無精髭（点々） */
export const ACC_STUBBLE: AccessoryOverlay = buildOverlay((g) => {
  for (let dx = -8; dx <= 8; dx += 2) {
    setPixel(g, CX + dx, 45 + ((dx & 1) ? 1 : 0), 'M');
    setPixel(g, CX + dx, 47 + ((dx & 1) ? 0 : 1), 'M');
  }
  for (let dx = -7; dx <= 7; dx += 3) {
    setPixel(g, CX + dx, 49, 'M');
  }
});

/** 顔下半分の髭 */
export const ACC_BEARD_FULL: AccessoryOverlay = buildOverlay((g) => {
  fillEllipse(g, CX, 47, 11, 5, 'M');
  fillRect(g, CX - 11, 45, 22, 2, 'M');
});

/** シャツ襟＋ネクタイ */
export const ACC_COLLAR_TIE: AccessoryOverlay = buildOverlay((g) => {
  // シャツ全面
  fillRect(g, CX - 18, 54, 36, 10, 'W');
  // 襟（V 字）
  fillEllipse(g, CX - 12, 53, 6, 4, 'W');
  fillEllipse(g, CX + 12, 53, 6, 4, 'W');
  // 襟の影（縁取り）
  for (let dx = -8; dx <= 8; dx++) {
    setPixel(g, CX + dx, 51, 'W');
  }
  // ネクタイ結び目
  fillRect(g, CX - 3, 52, 6, 4, 'T');
  // ネクタイ本体
  for (let y = 56; y < 64; y++) {
    const w = Math.max(1, 4 - Math.floor((y - 56) * 0.3));
    fillRect(g, CX - w, y, w * 2, 1, 'T');
  }
});

/** 蝶ネクタイ */
export const ACC_COLLAR_BOWTIE: AccessoryOverlay = buildOverlay((g) => {
  fillRect(g, CX - 18, 54, 36, 10, 'W');
  // 蝶
  fillEllipse(g, CX - 5, 54, 5, 3, 'T');
  fillEllipse(g, CX + 5, 54, 5, 3, 'T');
  fillRect(g, CX - 1, 53, 3, 4, 'T');
});

/** 着物の襟 */
export const ACC_COLLAR_KIMONO: AccessoryOverlay = buildOverlay((g) => {
  // 着物本体
  fillRect(g, CX - 18, 53, 36, 11, 'K');
  // 内側の白い襟
  for (let dx = -10; dx <= 10; dx++) {
    setPixel(g, CX + dx, 52, 'W');
  }
  // 襟合わせ（V）
  for (let i = 0; i < 8; i++) {
    setPixel(g, CX - i, 53 + i, 'W');
    setPixel(g, CX + i, 53 + i, 'W');
  }
  // 着物の柄（影）
  for (let y = 55; y < 64; y += 2) {
    setPixel(g, CX - 14, y, 'k');
    setPixel(g, CX + 14, y, 'k');
  }
});

/** ピアス */
export const ACC_EARRING: AccessoryOverlay = buildOverlay((g) => {
  setPixel(g, CX - 18, 38, 'G');
  setPixel(g, CX - 18, 39, 'G');
  setPixel(g, CX + 18, 38, 'G');
  setPixel(g, CX + 18, 39, 'G');
});
