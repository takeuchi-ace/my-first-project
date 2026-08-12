/**
 * キャラ別スプライトシート定義
 *
 * ## 2026-08 全21人を統一規格の新シートへ差し替え
 *
 * 旧シートは複数キャラ相乗り・フレーム位置が不均一で、キャラごとに
 * 図形中心を実測した frameCenters を持っていた（tanaka_onizuka_sheet.png ほか）。
 * 新シート（assets/sprites/generated/character_XX.png）は
 * **2160×360・360×360の6コマ等間隔・1人1ファイル・背景透過**に揃っているので、
 * 実測値は不要になり、全員同じ定義をループで生成できる。
 *
 * コマの並び（左から）:
 *   0: 大笑い / 1: 笑顔 / 2: ノーマル / 3: 悲しい・心配 / 4: 怒り / 5: フォーマル
 *
 * 既存の Emotion（best/good/neutral/bad/worst）をコマ0〜4に割り当て、
 * タイトル・一覧用（titleMode）はコマ5（フォーマル）を使う。
 *
 * 鷹宮（19）は頭・顔・体の大きさを6表情で統一した最新版。
 * 旧シート（takamiya_hayase_mitsuki_sheet.png 等）への参照はここに残さないこと。
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

/** Emotion → コマ 0〜4（5=フォーマルは titleFrameIndex で使う） */
const FRAME_ORDER: Emotion[] = ['best', 'good', 'neutral', 'bad', 'worst'];

const SHEET_W = 2160;
const SHEET_H = 360;
const FRAME = 360;
/** 等間隔6コマの各中心X（180, 540, 900, 1260, 1620, 1980） */
const CENTERS = [0, 1, 2, 3, 4, 5].map((i) => i * FRAME + FRAME / 2);

// require はバンドラが静的に解決するため、パスを変数にできない。21行並べる
const SOURCES: Record<number, ImageSourcePropType> = {
  1: require('../../assets/sprites/generated/character_01.png'), // 田中裕也
  2: require('../../assets/sprites/generated/character_02.png'), // 鬼塚剛志
  3: require('../../assets/sprites/generated/character_03.png'), // 坊っちゃん
  4: require('../../assets/sprites/generated/character_04.png'), // 黒田隆之
  5: require('../../assets/sprites/generated/character_05.png'), // アレクサンダー・スミス
  6: require('../../assets/sprites/generated/character_06.png'), // 光山陽介
  7: require('../../assets/sprites/generated/character_07.png'), // 巌源蔵
  8: require('../../assets/sprites/generated/character_08.png'), // 中村亮介
  9: require('../../assets/sprites/generated/character_09.png'), // 佐藤直人
  10: require('../../assets/sprites/generated/character_10.png'), // 松本恒一
  11: require('../../assets/sprites/generated/character_11.png'), // 大門誠一郎
  12: require('../../assets/sprites/generated/character_12.png'), // 星野竜也
  13: require('../../assets/sprites/generated/character_13.png'), // 金城猛
  14: require('../../assets/sprites/generated/character_14.png'), // 白石敬之
  15: require('../../assets/sprites/generated/character_15.png'), // 藤原千鶴
  16: require('../../assets/sprites/generated/character_16.png'), // 銀座ハジメ
  17: require('../../assets/sprites/generated/character_17.png'), // 篠原拓海
  18: require('../../assets/sprites/generated/character_18.png'), // 桐生麻衣
  19: require('../../assets/sprites/generated/character_19.png'), // 鷹宮宗一郎（6表情の大きさ統一版）
  20: require('../../assets/sprites/generated/character_20.png'), // 早瀬玲奈
  21: require('../../assets/sprites/generated/character_21.png'), // 立花美月（ミツキ）
};

for (const [idStr, source] of Object.entries(SOURCES)) {
  SPRITE_SHEETS.set(Number(idStr), {
    source,
    imageWidth: SHEET_W,
    imageHeight: SHEET_H,
    frameCenters: CENTERS,
    cropY: 0,
    cropW: FRAME,
    cropH: FRAME,
    frameOrder: FRAME_ORDER,
    titleFrameIndex: 5,
  });
}

export function getSpriteSheet(charId: CharacterId): SpriteSheetDef | undefined {
  return SPRITE_SHEETS.get(charId);
}
