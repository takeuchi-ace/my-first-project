/**
 * ホールレイアウトデータ
 *
 * 各ラウンド（田中=1, 鬼塚=2）ごとに 9 ホール分のコース構成を定義。
 * 座標系は 0–100 の正規化空間。HoleMap コンポーネント側でビューポートにスケール。
 *
 * フェアウェイは 4 点のベジェ風コントロールポイント (path) で表現。
 *   path[0] = ティー位置
 *   path[1] = 中継点1 (ドッグレッグ角度を表現)
 *   path[2] = 中継点2
 *   path[3] = グリーン中心
 *
 * features は ハザード（バンカー、池、OB）。座標と大きさを 0–100 で指定。
 */

import { CharacterId } from '../types';

export type HazardType = 'bunker' | 'water' | 'ob' | 'tree';

export interface Hazard {
  type: HazardType;
  /** 中心 X (0-100) */
  cx: number;
  /** 中心 Y (0-100) */
  cy: number;
  /** 横幅 (0-100) */
  rx: number;
  /** 縦幅 (0-100) */
  ry: number;
}

export interface HoleLayout {
  hole: number;
  par: 3 | 4 | 5;
  yards: number;
  /** ホールの異名 */
  nickname?: string;
  /** ティーからグリーンまでの 4 点制御ライン (各点 [x, y] in 0-100) */
  path: [number, number][];
  /** グリーン半径 (0-100) */
  greenR: number;
  hazards: Hazard[];
}

/* ================================================================
   田中ラウンド (id: 1) — 端正で素直なコース
   バンカー少なめ、池1、谷越え1
   ================================================================ */
const tanakaCourse: HoleLayout[] = [
  {
    hole: 1,
    par: 4,
    yards: 372,
    nickname: 'スターター',
    path: [
      [50, 92],
      [50, 70],
      [50, 35],
      [50, 14],
    ],
    greenR: 7,
    hazards: [
      { type: 'bunker', cx: 38, cy: 22, rx: 6, ry: 4 },
      { type: 'bunker', cx: 62, cy: 22, rx: 6, ry: 4 },
    ],
  },
  {
    hole: 2,
    par: 3,
    yards: 168,
    nickname: '池越えショート',
    path: [
      [50, 90],
      [50, 75],
      [50, 40],
      [50, 18],
    ],
    greenR: 8,
    hazards: [
      { type: 'water', cx: 50, cy: 55, rx: 22, ry: 14 },
      { type: 'bunker', cx: 38, cy: 28, rx: 5, ry: 4 },
    ],
  },
  {
    hole: 3,
    par: 5,
    yards: 514,
    nickname: 'ロングストレート',
    path: [
      [50, 92],
      [50, 70],
      [50, 38],
      [50, 12],
    ],
    greenR: 6,
    hazards: [
      { type: 'tree', cx: 22, cy: 60, rx: 4, ry: 6 },
      { type: 'tree', cx: 78, cy: 60, rx: 4, ry: 6 },
      { type: 'bunker', cx: 50, cy: 45, rx: 5, ry: 3 },
      { type: 'bunker', cx: 42, cy: 20, rx: 5, ry: 4 },
    ],
  },
  {
    hole: 4,
    par: 4,
    yards: 388,
    nickname: '谷越え',
    path: [
      [50, 92],
      [50, 72],
      [50, 38],
      [50, 14],
    ],
    greenR: 7,
    hazards: [
      { type: 'ob', cx: 12, cy: 50, rx: 8, ry: 30 },
      { type: 'ob', cx: 88, cy: 50, rx: 8, ry: 30 },
      { type: 'bunker', cx: 60, cy: 22, rx: 6, ry: 4 },
    ],
  },
  {
    hole: 5,
    par: 3,
    yards: 152,
    nickname: '前半クロージング',
    path: [
      [50, 88],
      [50, 70],
      [50, 40],
      [50, 18],
    ],
    greenR: 9,
    hazards: [
      { type: 'bunker', cx: 40, cy: 26, rx: 5, ry: 4 },
      { type: 'bunker', cx: 60, cy: 26, rx: 5, ry: 4 },
    ],
  },
  {
    hole: 6,
    par: 4,
    yards: 401,
    nickname: '後半スタート',
    path: [
      [50, 92],
      [50, 70],
      [50, 38],
      [50, 14],
    ],
    greenR: 7,
    hazards: [
      { type: 'tree', cx: 25, cy: 50, rx: 4, ry: 6 },
      { type: 'bunker', cx: 50, cy: 35, rx: 5, ry: 3 },
    ],
  },
  {
    hole: 7,
    par: 5,
    yards: 482,
    nickname: '右ドッグレッグ',
    path: [
      [40, 92],
      [40, 65],
      [62, 35],
      [62, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'tree', cx: 70, cy: 70, rx: 5, ry: 6 },
      { type: 'bunker', cx: 50, cy: 50, rx: 5, ry: 3 },
      { type: 'bunker', cx: 70, cy: 22, rx: 5, ry: 4 },
    ],
  },
  {
    hole: 8,
    par: 3,
    yards: 178,
    nickname: '名物ホール',
    path: [
      [50, 90],
      [50, 75],
      [50, 40],
      [50, 18],
    ],
    greenR: 7,
    hazards: [
      { type: 'water', cx: 50, cy: 55, rx: 18, ry: 10 },
      { type: 'bunker', cx: 60, cy: 28, rx: 5, ry: 3 },
    ],
  },
  {
    hole: 9,
    par: 4,
    yards: 412,
    nickname: 'フィニッシング',
    path: [
      [50, 92],
      [50, 68],
      [50, 36],
      [50, 12],
    ],
    greenR: 8,
    hazards: [
      { type: 'bunker', cx: 38, cy: 20, rx: 6, ry: 4 },
      { type: 'bunker', cx: 62, cy: 20, rx: 6, ry: 4 },
      { type: 'water', cx: 50, cy: 50, rx: 8, ry: 6 },
    ],
  },
];

/* ================================================================
   鬼塚ラウンド (id: 2) — 攻めごたえのある豪快コース
   ドッグレッグ多め、デカいバンカー、ロング多め
   ================================================================ */
const onizukaCourse: HoleLayout[] = [
  {
    hole: 1,
    par: 5,
    yards: 528,
    nickname: '気合のオープニング',
    path: [
      [50, 92],
      [42, 65],
      [58, 38],
      [50, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'bunker', cx: 50, cy: 50, rx: 8, ry: 5 },
      { type: 'tree', cx: 75, cy: 70, rx: 5, ry: 6 },
      { type: 'bunker', cx: 38, cy: 22, rx: 7, ry: 5 },
      { type: 'bunker', cx: 62, cy: 22, rx: 7, ry: 5 },
    ],
  },
  {
    hole: 2,
    par: 4,
    yards: 415,
    nickname: '左ドッグレッグ',
    path: [
      [60, 92],
      [60, 60],
      [38, 35],
      [38, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'tree', cx: 25, cy: 70, rx: 6, ry: 8 },
      { type: 'bunker', cx: 50, cy: 50, rx: 6, ry: 4 },
      { type: 'water', cx: 30, cy: 22, rx: 8, ry: 6 },
    ],
  },
  {
    hole: 3,
    par: 3,
    yards: 198,
    nickname: 'ロングアイアン',
    path: [
      [50, 90],
      [50, 75],
      [50, 40],
      [50, 16],
    ],
    greenR: 7,
    hazards: [
      { type: 'bunker', cx: 36, cy: 24, rx: 7, ry: 5 },
      { type: 'bunker', cx: 64, cy: 24, rx: 7, ry: 5 },
      { type: 'water', cx: 50, cy: 50, rx: 12, ry: 8 },
    ],
  },
  {
    hole: 4,
    par: 5,
    yards: 561,
    nickname: 'モンスター',
    path: [
      [42, 92],
      [62, 68],
      [38, 38],
      [55, 12],
    ],
    greenR: 6,
    hazards: [
      { type: 'tree', cx: 80, cy: 70, rx: 5, ry: 6 },
      { type: 'tree', cx: 22, cy: 50, rx: 5, ry: 6 },
      { type: 'bunker', cx: 50, cy: 50, rx: 7, ry: 5 },
      { type: 'bunker', cx: 70, cy: 25, rx: 6, ry: 4 },
      { type: 'water', cx: 38, cy: 25, rx: 8, ry: 6 },
    ],
  },
  {
    hole: 5,
    par: 4,
    yards: 392,
    nickname: '前半締め',
    path: [
      [50, 92],
      [50, 65],
      [50, 35],
      [50, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'bunker', cx: 50, cy: 55, rx: 8, ry: 5 },
      { type: 'bunker', cx: 38, cy: 22, rx: 6, ry: 4 },
    ],
  },
  {
    hole: 6,
    par: 4,
    yards: 423,
    nickname: '後半勝負',
    path: [
      [38, 92],
      [38, 60],
      [62, 35],
      [62, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'tree', cx: 70, cy: 70, rx: 5, ry: 7 },
      { type: 'bunker', cx: 50, cy: 50, rx: 6, ry: 4 },
      { type: 'bunker', cx: 70, cy: 22, rx: 6, ry: 4 },
    ],
  },
  {
    hole: 7,
    par: 5,
    yards: 545,
    nickname: 'パワーホール',
    path: [
      [50, 92],
      [50, 68],
      [50, 35],
      [50, 12],
    ],
    greenR: 6,
    hazards: [
      { type: 'tree', cx: 24, cy: 70, rx: 5, ry: 7 },
      { type: 'tree', cx: 76, cy: 70, rx: 5, ry: 7 },
      { type: 'bunker', cx: 50, cy: 45, rx: 8, ry: 5 },
      { type: 'water', cx: 38, cy: 22, rx: 8, ry: 5 },
      { type: 'bunker', cx: 62, cy: 22, rx: 6, ry: 4 },
    ],
  },
  {
    hole: 8,
    par: 3,
    yards: 215,
    nickname: '島グリーン',
    path: [
      [50, 90],
      [50, 75],
      [50, 40],
      [50, 18],
    ],
    greenR: 8,
    hazards: [
      { type: 'water', cx: 50, cy: 35, rx: 30, ry: 18 },
    ],
  },
  {
    hole: 9,
    par: 4,
    yards: 438,
    nickname: '気合の最終',
    path: [
      [50, 92],
      [42, 65],
      [58, 35],
      [50, 12],
    ],
    greenR: 7,
    hazards: [
      { type: 'bunker', cx: 50, cy: 50, rx: 7, ry: 5 },
      { type: 'water', cx: 30, cy: 30, rx: 8, ry: 6 },
      { type: 'bunker', cx: 38, cy: 20, rx: 6, ry: 4 },
      { type: 'bunker', cx: 62, cy: 20, rx: 6, ry: 4 },
    ],
  },
];

/** キャラごとのコース取得（未定義キャラはデフォルトで田中コースを返す） */
export function getCourseLayout(characterId: CharacterId): HoleLayout[] {
  if (characterId === 2) return onizukaCourse;
  return tanakaCourse;
}

/** 単一ホール取得 */
export function getHoleLayout(characterId: CharacterId, hole: number): HoleLayout | undefined {
  const course = getCourseLayout(characterId);
  return course.find((h) => h.hole === hole);
}
