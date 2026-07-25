/**
 * ⚠️ 未使用ファイル（2026-07-25 時点）
 *
 * `lunchMenuPool` はどこからも import されていない。稼働中の昼食ミニゲームは
 * `lunchMiniGame.ts` の `menuItems`（6品・group で hearty/japanese/light を判定）を使う。
 *
 * こちらは 22品 ＋ isHeavy / isLight / isLocalSignature / priceBand を持つ詳細版で、
 * 単なる重複ではなく「使われていない上位版」。メニューの選択肢を増やしたい場合は、
 * lunchMiniGame.ts の判定を group から本ファイルのフラグへ移せば流用できる
 * （型 `LunchMenuItem` も本ファイル専用で、他からは参照されていない）。
 */
import { LunchMenuItem } from '../types';

export const lunchMenuPool: LunchMenuItem[] = [
  // === Main ===
  { id: 'L01', name: '特製ビーフカレー', category: 'main', isHeavy: true, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L02', name: '海老フライ定食', category: 'main', isHeavy: true, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L03', name: 'クラブハウスサンド', category: 'main', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L04', name: '冷やし蕎麦', category: 'main', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'low' },
  { id: 'L05', name: 'ステーキ丼', category: 'main', isHeavy: true, isLight: false, isLocalSignature: false, priceBand: 'high' },
  { id: 'L06', name: '天ぷら御膳', category: 'main', isHeavy: true, isLight: false, isLocalSignature: true, priceBand: 'high' },
  { id: 'L07', name: 'サーモンアボカド丼', category: 'main', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L08', name: 'ざるうどん', category: 'main', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'low' },
  { id: 'L09', name: '名物カツカレー', category: 'main', isHeavy: true, isLight: false, isLocalSignature: true, priceBand: 'mid' },
  { id: 'L10', name: 'チキン南蛮', category: 'main', isHeavy: true, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  // === Side ===
  { id: 'L11', name: '枝豆', category: 'side', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'low' },
  { id: 'L12', name: 'ポテトフライ', category: 'side', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'low' },
  { id: 'L13', name: 'シーザーサラダ', category: 'side', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L14', name: '出汁巻き玉子', category: 'side', isHeavy: false, isLight: true, isLocalSignature: true, priceBand: 'mid' },
  // === Drink ===
  { id: 'L15', name: '生ビール', category: 'drink', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L16', name: 'ウーロン茶', category: 'drink', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'low' },
  { id: 'L17', name: 'ハイボール', category: 'drink', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'mid' },
  { id: 'L18', name: 'コーラ', category: 'drink', isHeavy: false, isLight: false, isLocalSignature: false, priceBand: 'low' },
  // === Dessert ===
  { id: 'L19', name: '抹茶アイス', category: 'dessert', isHeavy: false, isLight: true, isLocalSignature: true, priceBand: 'mid' },
  { id: 'L20', name: 'コーヒーゼリー', category: 'dessert', isHeavy: false, isLight: true, isLocalSignature: false, priceBand: 'low' },
];

/** 20品プールからランダムに6品抽出 */
export function pickLunchMenu(count = 6): LunchMenuItem[] {
  const pool = [...lunchMenuPool];
  const result: LunchMenuItem[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
