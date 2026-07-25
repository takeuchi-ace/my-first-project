/**
 * 共通顔スプライト — 64×64 ピクセルアート（昭和×上品）
 *
 * パレット（7色 + 拡張用 M/T/K/k/G）:
 *   _  transparent
 *   S  肌ベース    #EDCBA0
 *   s  肌シャドウ   #D4A870
 *   H  髪ベース    #3A2618
 *   h  髪シャドウ   #2B1B12
 *   L  髪ハイライト #5C3A20
 *   W  白目       #F0EDE8
 *   E  黒(瞳/眉/口) #1A1410
 *   M  髭色（コンポーザーで上書き）
 *   T  ネクタイ色（コンポーザーで上書き）
 *   K/k 着物色
 *   G  ピアス色
 */

import {
  Grid,
  newGrid,
  fillEllipse,
  fillRect,
  setPixel,
  strokeLine,
} from './pixelAvatar/draw';

export type Emotion = 'best' | 'good' | 'neutral' | 'bad' | 'worst';

export const PALETTE: Record<string, string> = {
  _: 'transparent',
  S: '#EDCBA0',
  s: '#D4A870',
  H: '#3A2618',
  h: '#2B1B12',
  L: '#5C3A20',
  W: '#F0EDE8',
  E: '#1A1410',
};

export type FaceGrid = string[];
export type FaceSheet = Record<Emotion, FaceGrid>;

export const GRID_SIZE = 64;

/* ================================================================
   顔の基本ジオメトリ（中心 cx=32 として配置）
   ================================================================ */
const CX = 32;
const HEAD_CY = 33;
const HEAD_RX = 17;
const HEAD_RY = 21;
// 目（左/右）
const LEFT_EYE_X = 24;
const RIGHT_EYE_X = 40;
const EYE_Y = 32;
// 眉
const BROW_Y = 26;
// 口
const MOUTH_Y = 43;
// 鼻先（ハイライト用）
const NOSE_Y = 36;

/** ベースとなる頭・首・肌のシェーディングを描く（emotion 共通） */
function buildBaseHead(): Grid {
  const g = newGrid(GRID_SIZE, '_');

  // 首（肌）
  fillRect(g, 27, 50, 10, 13, 'S');
  // 顎下シャドウ
  fillRect(g, 27, 50, 10, 2, 's');

  // 顔の輪郭（楕円）
  fillEllipse(g, CX, HEAD_CY, HEAD_RX, HEAD_RY, 'S');

  // 顎ライン（軽いシャドウ）
  for (let x = CX - 12; x <= CX + 12; x++) {
    const dx = (x - CX) / 12;
    const dy = Math.sqrt(Math.max(0, 1 - dx * dx)) * 8;
    const y = Math.round(HEAD_CY + dy + 6);
    setPixel(g, x, y, 's');
  }

  // 鼻のシャドウ
  setPixel(g, CX, NOSE_Y, 's');
  setPixel(g, CX, NOSE_Y + 1, 's');
  setPixel(g, CX - 1, NOSE_Y + 1, 's');
  setPixel(g, CX + 1, NOSE_Y + 1, 's');

  // 頬（左右の薄いシャドウ）
  setPixel(g, CX - 13, HEAD_CY + 4, 's');
  setPixel(g, CX - 14, HEAD_CY + 3, 's');
  setPixel(g, CX + 13, HEAD_CY + 4, 's');
  setPixel(g, CX + 14, HEAD_CY + 3, 's');

  // 耳（小さい肌の出っ張り）
  fillEllipse(g, CX - 17, HEAD_CY + 1, 2, 4, 'S');
  fillEllipse(g, CX + 17, HEAD_CY + 1, 2, 4, 'S');
  setPixel(g, CX - 17, HEAD_CY + 2, 's');
  setPixel(g, CX + 17, HEAD_CY + 2, 's');

  return g;
}

/** 眉を emotion に合わせて描画 */
function drawBrows(g: Grid, emotion: Emotion): void {
  const lx = 18;
  const rx = 38;
  const w = 9;
  switch (emotion) {
    case 'best':
    case 'good': {
      // 軽く持ち上がった弧（外側が少し上がる）
      for (let dx = 0; dx < w; dx++) {
        const y = BROW_Y - Math.round(Math.sin((dx / (w - 1)) * Math.PI) * 1);
        setPixel(g, lx + dx, y, 'E');
        setPixel(g, lx + dx, y + 1, 'E');
        setPixel(g, rx + (w - 1 - dx), y, 'E');
        setPixel(g, rx + (w - 1 - dx), y + 1, 'E');
      }
      break;
    }
    case 'neutral': {
      // 直線
      for (let dx = 0; dx < w; dx++) {
        setPixel(g, lx + dx, BROW_Y, 'E');
        setPixel(g, lx + dx, BROW_Y + 1, 'E');
        setPixel(g, rx + dx, BROW_Y, 'E');
        setPixel(g, rx + dx, BROW_Y + 1, 'E');
      }
      break;
    }
    case 'bad': {
      // 内側が下がる（困り眉、ハの字）
      for (let dx = 0; dx < w; dx++) {
        const yL = BROW_Y - 1 + Math.round((dx / (w - 1)) * 2); // 左眉: 内→下がる
        const yR = BROW_Y + 1 - Math.round((dx / (w - 1)) * 2); // 右眉: 内→上がる…逆に
        setPixel(g, lx + dx, yL, 'E');
        setPixel(g, lx + dx, yL + 1, 'E');
        setPixel(g, rx + dx, yR, 'E');
        setPixel(g, rx + dx, yR + 1, 'E');
      }
      break;
    }
    case 'worst': {
      // 怒り眉（内側が上がる）
      for (let dx = 0; dx < w; dx++) {
        const yL = BROW_Y + 1 - Math.round((dx / (w - 1)) * 2);
        const yR = BROW_Y - 1 + Math.round((dx / (w - 1)) * 2);
        setPixel(g, lx + dx, yL, 'E');
        setPixel(g, lx + dx, yL + 1, 'E');
        setPixel(g, rx + dx, yR, 'E');
        setPixel(g, rx + dx, yR + 1, 'E');
      }
      break;
    }
  }
}

/** 目を emotion に合わせて描画 */
function drawEyes(g: Grid, emotion: Emotion): void {
  if (emotion === 'best') {
    // ニッコリ閉じ目（弧）
    for (let dx = -2; dx <= 2; dx++) {
      const y = EYE_Y + Math.abs(dx) - 1;
      setPixel(g, LEFT_EYE_X + dx, y, 'E');
      setPixel(g, RIGHT_EYE_X + dx, y, 'E');
    }
    return;
  }
  if (emotion === 'worst') {
    // 怒り目（細い斜線）
    for (let dx = -2; dx <= 2; dx++) {
      const yL = EYE_Y + Math.round(dx * -0.4);
      const yR = EYE_Y + Math.round(dx * 0.4);
      setPixel(g, LEFT_EYE_X + dx, yL, 'E');
      setPixel(g, LEFT_EYE_X + dx, yL + 1, 'E');
      setPixel(g, RIGHT_EYE_X + dx, yR, 'E');
      setPixel(g, RIGHT_EYE_X + dx, yR + 1, 'E');
    }
    return;
  }

  const offsetY = emotion === 'good' ? -1 : emotion === 'bad' ? 1 : 0;

  // 白目
  fillEllipse(g, LEFT_EYE_X, EYE_Y + offsetY, 3, 2.6, 'W');
  fillEllipse(g, RIGHT_EYE_X, EYE_Y + offsetY, 3, 2.6, 'W');
  // 瞳
  fillEllipse(g, LEFT_EYE_X, EYE_Y + offsetY, 1.6, 2, 'E');
  fillEllipse(g, RIGHT_EYE_X, EYE_Y + offsetY, 1.6, 2, 'E');
  // ハイライト
  setPixel(g, LEFT_EYE_X + 1, EYE_Y + offsetY - 1, 'W');
  setPixel(g, RIGHT_EYE_X + 1, EYE_Y + offsetY - 1, 'W');
}

/** 口を emotion に合わせて描画 */
function drawMouth(g: Grid, emotion: Emotion): void {
  switch (emotion) {
    case 'best': {
      // 大きな笑み（口開け）
      for (let dx = -5; dx <= 5; dx++) {
        const dyTop = Math.round(Math.sqrt(Math.max(0, 25 - dx * dx)) * 0.4);
        const dyBot = Math.round(Math.sqrt(Math.max(0, 25 - dx * dx)) * 0.7);
        setPixel(g, CX + dx, MOUTH_Y - dyTop, 'E');
        setPixel(g, CX + dx, MOUTH_Y + dyBot, 'E');
        if (dx > -5 && dx < 5) {
          for (let y = MOUTH_Y - dyTop + 1; y <= MOUTH_Y + dyBot - 1; y++) {
            setPixel(g, CX + dx, y, 'E');
          }
        }
      }
      // 歯のハイライト
      for (let dx = -3; dx <= 3; dx++) {
        setPixel(g, CX + dx, MOUTH_Y - 1, 'W');
      }
      break;
    }
    case 'good': {
      // 弧の笑み
      for (let dx = -4; dx <= 4; dx++) {
        const dy = Math.round(Math.sqrt(Math.max(0, 16 - dx * dx)) * 0.45);
        setPixel(g, CX + dx, MOUTH_Y + dy, 'E');
        setPixel(g, CX + dx, MOUTH_Y + dy + 1, 'E');
      }
      break;
    }
    case 'neutral': {
      strokeLine(g, CX - 4, MOUTH_Y, CX + 4, MOUTH_Y, 'E');
      strokeLine(g, CX - 4, MOUTH_Y + 1, CX + 4, MOUTH_Y + 1, 'E');
      break;
    }
    case 'bad': {
      // 弧の困り
      for (let dx = -4; dx <= 4; dx++) {
        const dy = Math.round(Math.sqrt(Math.max(0, 16 - dx * dx)) * 0.45);
        setPixel(g, CX + dx, MOUTH_Y - dy, 'E');
        setPixel(g, CX + dx, MOUTH_Y - dy + 1, 'E');
      }
      break;
    }
    case 'worst': {
      // ジグザグ激怒
      for (let dx = -5; dx <= 5; dx++) {
        const dy = Math.round(Math.sqrt(Math.max(0, 25 - dx * dx)) * 0.45);
        setPixel(g, CX + dx, MOUTH_Y - dy, 'E');
        setPixel(g, CX + dx, MOUTH_Y - dy + 1, 'E');
      }
      // 歯のジグザグ
      for (let dx = -4; dx <= 4; dx += 2) {
        setPixel(g, CX + dx, MOUTH_Y - 1, 'W');
      }
      break;
    }
  }
}

/** ベースの髪（後頭部の影を付けない、純粋に頭頂の H/h/L 流線形） */
function drawDefaultHair(g: Grid): void {
  // 髪のドーム
  fillEllipse(g, CX, 19, 18, 11, 'H');
  // 前髪のサイドバング（額にかかる）
  fillEllipse(g, CX - 12, 22, 5, 6, 'H');
  fillEllipse(g, CX + 12, 22, 5, 6, 'H');
  // 影（右半分は h）
  for (let y = 8; y < 24; y++) {
    for (let x = CX + 8; x < CX + 20; x++) {
      const ndx = (x - CX) / 18;
      const ndy = (y - 19) / 11;
      if (ndx * ndx + ndy * ndy <= 1) {
        setPixel(g, x, y, 'h');
      }
    }
  }
  // ハイライト（左寄り）
  for (let dx = -10; dx <= -3; dx++) {
    setPixel(g, CX + dx, 11 + Math.abs(dx + 6) / 2, 'L');
  }
}

/** 1 emotion 分の完全な顔グリッドを構築 */
function buildFace(emotion: Emotion): FaceGrid {
  const g = buildBaseHead();
  drawDefaultHair(g);
  drawBrows(g, emotion);
  drawEyes(g, emotion);
  drawMouth(g, emotion);
  return g;
}

export const COMMON_FACE: FaceSheet = {
  best: buildFace('best'),
  good: buildFace('good'),
  neutral: buildFace('neutral'),
  bad: buildFace('bad'),
  worst: buildFace('worst'),
};

/** ベースの頭・体・表情のみ（髪は後で追加）。コンポーザー用 */
export function buildFaceWithoutHair(emotion: Emotion): FaceGrid {
  const g = buildBaseHead();
  drawBrows(g, emotion);
  drawEyes(g, emotion);
  drawMouth(g, emotion);
  return g;
}
