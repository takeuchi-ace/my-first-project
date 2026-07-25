/**
 * キャラ別スプライトシート定義
 *
 * AI 生成シートはフレーム配置が不均一（同じシート内でも図形位置がバラつく）。
 * frameCenters に各フレームの図形中心 X 座標を絶対値で保持する設計とし、
 * 描画側はそれを cropW の半分だけ左にオフセットしてクロップする。
 */

import { Emotion } from './common';
import { CharacterId } from '../types';
import { ImageSourcePropType } from 'react-native';

export interface SpriteSheetDef {
  source: ImageSourcePropType;
  /** ソース画像の元サイズ */
  imageWidth: number;
  imageHeight: number;
  /** 各フレームの図形中心 X 座標（絶対値）。長さ=frameCount */
  frameCenters: number[];
  /** クロップ開始 Y（図形上端の絶対値） */
  cropY: number;
  /** クロップ枠（正方形が前提） */
  cropW: number;
  cropH: number;
  /** Emotion → frameCenters の index 対応 */
  frameOrder: Emotion[];
  /** タイトル/普段着モードで使うフレーム index（省略時は最終フレーム） */
  titleFrameIndex?: number;
}

const SPRITE_SHEETS = new Map<CharacterId, SpriteSheetDef>();

const FRAME_ORDER: Emotion[] = ['best', 'good', 'neutral', 'bad', 'worst'];
const CROP_W = 200;
const CROP_H = 200;

// =====================================================================
// 田中・鬼塚 (1672×941) — 各キャラ図形中心を実測
// =====================================================================
const SHEET_TANAKA_ONIZUKA = require('../assets/sprites/tanaka_onizuka_sheet.png');
const TANAKA_W = 1672;
const TANAKA_H = 941;

SPRITE_SHEETS.set(1, {
  source: SHEET_TANAKA_ONIZUKA,
  imageWidth: TANAKA_W,
  imageHeight: TANAKA_H,
  frameCenters: [185, 431, 691, 958, 1219, 1458],
  cropY: 31,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(2, {
  source: SHEET_TANAKA_ONIZUKA,
  imageWidth: TANAKA_W,
  imageHeight: TANAKA_H,
  frameCenters: [166, 425, 692, 961, 1228, 1475],
  cropY: 420,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 坊っちゃん・黒田・スミス・光山 (1536×1024)
// =====================================================================
const SHEET_3_6 = require('../assets/sprites/bocchan_kuroda_smith_mitsuyama_sheet.png');
const SHEET_W = 1536;
const SHEET_H = 1024;

SPRITE_SHEETS.set(3, {
  source: SHEET_3_6,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [177, 379, 597, 827, 1045, 1258],
  cropY: 6,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(4, {
  source: SHEET_3_6,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [173, 377, 593, 828, 1046, 1259],
  cropY: 287,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(5, {
  source: SHEET_3_6,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [178, 379, 597, 827, 1046, 1261],
  cropY: 537,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(6, {
  source: SHEET_3_6,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [179, 379, 596, 826, 1045, 1260],
  cropY: 787,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 巖・中村・佐藤・松本 (1536×1024)
// =====================================================================
const SHEET_7_10 = require('../assets/sprites/iwao_nakamura_sato_matsumoto_sheet.png');

SPRITE_SHEETS.set(7, {
  source: SHEET_7_10,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [171, 387, 618, 844, 1057, 1293],
  cropY: 17,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(8, {
  source: SHEET_7_10,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [175, 389, 624, 846, 1060, 1292],
  cropY: 267,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(9, {
  source: SHEET_7_10,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [171, 391, 627, 845, 1061, 1293],
  cropY: 517,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(10, {
  source: SHEET_7_10,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [169, 390, 626, 847, 1062, 1294],
  cropY: 758,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 大門・星野・金城・白石 (1536×1024)
// =====================================================================
const SHEET_11_14 = require('../assets/sprites/daimon_hoshino_kinjo_shiraishi_sheet.png');

SPRITE_SHEETS.set(11, {
  source: SHEET_11_14,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [240, 431, 621, 815, 1007, 1205],
  cropY: 12,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(12, {
  source: SHEET_11_14,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [241, 429, 622, 812, 1012, 1205],
  cropY: 245,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(13, {
  source: SHEET_11_14,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [240, 429, 621, 815, 1008, 1205],
  cropY: 505,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(14, {
  source: SHEET_11_14,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [240, 429, 622, 813, 1005, 1204],
  cropY: 752,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 千鶴・篠原・美月・桐生 (1536×1024) — 新シート (4 行)
// =====================================================================
const SHEET_CHIZURU4 = require('../assets/sprites/chizuru_shinohara_mitsuki_kiryu_sheet.png');

// 新シートは図形が小さいため crop を実寸に合わせて縮め、表示サイズを他キャラに揃える
SPRITE_SHEETS.set(15, {
  source: SHEET_CHIZURU4,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [141, 379, 619, 845, 1081, 1344],
  cropY: 8,
  cropW: 170,
  cropH: 170,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(17, {
  source: SHEET_CHIZURU4,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [144, 384, 624, 848, 1084, 1343],
  cropY: 307,
  cropW: 190,
  cropH: 190,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(18, {
  source: SHEET_CHIZURU4,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [138, 378, 617, 844, 1081, 1330],
  cropY: 814,
  cropW: 160,
  cropH: 160,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 鷹宮・美月 (1536×1024)
// =====================================================================
const SHEET_19_21 = require('../assets/sprites/takamiya_hayase_mitsuki_sheet.png');

SPRITE_SHEETS.set(19, {
  source: SHEET_19_21,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [168, 397, 624, 847, 1073, 1292],
  cropY: 30,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

SPRITE_SHEETS.set(21, {
  source: SHEET_CHIZURU4,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [134, 375, 616, 841, 1079, 1328],
  cropY: 577,
  cropW: 160,
  cropH: 160,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// ACE 単体シート (1536×1024)
// =====================================================================
const SHEET_ACE = require('../assets/sprites/ace_sheet.png');

SPRITE_SHEETS.set(16, {
  source: SHEET_ACE,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [130, 381, 632, 876, 1121, 1369],
  cropY: 293,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

// =====================================================================
// 早瀬 玲奈 単体シート (1536×1024)
// =====================================================================
const SHEET_HAYASE = require('../assets/sprites/hayase_sheet.png');

SPRITE_SHEETS.set(20, {
  source: SHEET_HAYASE,
  imageWidth: SHEET_W,
  imageHeight: SHEET_H,
  frameCenters: [145, 394, 641, 882, 1127, 1370],
  cropY: 280,
  cropW: CROP_W,
  cropH: CROP_H,
  frameOrder: FRAME_ORDER,
});

export function getSpriteSheet(charId: CharacterId): SpriteSheetDef | undefined {
  return SPRITE_SHEETS.get(charId);
}
