// ===== 昼食ミニゲーム データ =====

// ===== メニュー =====
export type MenuGroup = 'hearty' | 'japanese' | 'light';

export interface MenuItem {
  id: number;
  name: string;
  group: MenuGroup;
}

export const menuItems: MenuItem[] = [
  { id: 0, name: 'カツカレー', group: 'hearty' },
  { id: 1, name: 'ステーキ重', group: 'hearty' },
  { id: 2, name: '天ぷらそば', group: 'japanese' },
  { id: 3, name: '海鮮丼', group: 'japanese' },
  { id: 4, name: 'サラダセット', group: 'light' },
  { id: 5, name: 'スープセット', group: 'light' },
];

// ===== テーブルレイアウト & 席 =====
export type TableLayout = 'square' | 'parallel' | 'perpendicular';
export type SeatId = 'A' | 'B' | 'C' | 'D';
export type SeatRelation = 'adjacent' | 'across' | 'diagonal';

export interface SeatInfo {
  id: SeatId;
  label: string;
  isWindowSide: boolean;
}

/**
 * 各レイアウトの席情報
 *
 * Square (正方形):          Parallel (窓に平行):        Perpendicular (窓に垂直):
 *       窓                        窓                          窓
 *    [A 窓側]                 [A]    [B]                [A] ┌──┐ [B]
 * [D 左] ■ [B 右]          ┌──────────┐                    │  │
 *    [C 入口側]             └──────────┘                [C] └──┘ [D]
 *       入口                 [C]    [D]                     入口
 */
export const layoutSeats: Record<TableLayout, SeatInfo[]> = {
  square: [
    { id: 'A', label: '窓側', isWindowSide: true },
    { id: 'B', label: '右側', isWindowSide: false },
    { id: 'C', label: '入口側', isWindowSide: false },
    { id: 'D', label: '左側', isWindowSide: false },
  ],
  parallel: [
    { id: 'A', label: '窓側左', isWindowSide: true },
    { id: 'B', label: '窓側右', isWindowSide: true },
    { id: 'C', label: '入口側左', isWindowSide: false },
    { id: 'D', label: '入口側右', isWindowSide: false },
  ],
  perpendicular: [
    { id: 'A', label: '窓側左', isWindowSide: true },
    { id: 'B', label: '窓側右', isWindowSide: true },
    { id: 'C', label: '入口側左', isWindowSide: false },
    { id: 'D', label: '入口側右', isWindowSide: false },
  ],
};

// ===== 席間の相対位置 =====
type SeatPairKey = string;
const pairKey = (s1: SeatId, s2: SeatId): SeatPairKey => {
  const sorted = [s1, s2].sort();
  return `${sorted[0]}-${sorted[1]}`;
};

const SEAT_RELATIONS: Record<TableLayout, Record<SeatPairKey, SeatRelation>> = {
  square: {
    'A-B': 'adjacent',
    'A-C': 'across',
    'A-D': 'adjacent',
    'B-C': 'adjacent',
    'B-D': 'across',
    'C-D': 'adjacent',
  },
  parallel: {
    'A-B': 'adjacent',
    'A-C': 'across',
    'A-D': 'diagonal',
    'B-C': 'diagonal',
    'B-D': 'across',
    'C-D': 'adjacent',
  },
  perpendicular: {
    'A-B': 'across',
    'A-C': 'adjacent',
    'A-D': 'diagonal',
    'B-C': 'diagonal',
    'B-D': 'adjacent',
    'C-D': 'across',
  },
};

export const getSeatRelation = (
  layout: TableLayout,
  s1: SeatId,
  s2: SeatId
): SeatRelation => {
  return SEAT_RELATIONS[layout][pairKey(s1, s2)];
};

// ===== キャラ別昼傾向（2軸） =====
export interface SeatPreference {
  proximity: 'near' | 'far' | 'any';      // 隣好き / 対面好き / 気にしない
  position: 'window' | 'entrance' | 'any'; // 窓側好き / 入口側好き / 気にしない
}

export interface LunchProfile {
  seatPreference: SeatPreference;
  menuChoice: number;
  foodLikes: number[];
  foodDislikes: number[];
  mimicSensitivity: 0 | 1 | 2;
}

export const characterLunchProfiles: Record<number, LunchProfile> = {
  // 1: 銀行マン・田中 — 堅実、和食好き、合わせすぎ嫌い → 旧perpendicular(下座重視)
  1: {
    seatPreference: { proximity: 'any', position: 'entrance' },
    menuChoice: 2,
    foodLikes: [2, 3],
    foodDislikes: [],
    mimicSensitivity: 2,
  },
  // 2: 体育会系社長・鬼塚 — がっつり、近くが好き
  2: {
    seatPreference: { proximity: 'near', position: 'any' },
    menuChoice: 0,
    foodLikes: [0, 1],
    foodDislikes: [4],
    mimicSensitivity: 0,
  },
  // 3: 二代目オーナー・坊っちゃん — 気にしない、ステーキ好き
  3: {
    seatPreference: { proximity: 'any', position: 'any' },
    menuChoice: 1,
    foodLikes: [1],
    foodDislikes: [],
    mimicSensitivity: 1,
  },
  // 4: 寡黙なプロ・黒田 — 距離を保つ、和食、合わせ嫌い
  4: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 3,
    foodLikes: [2, 3],
    foodDislikes: [],
    mimicSensitivity: 2,
  },
  // 5: 外資エリート・スミス — 対面好き、ライト系
  5: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 4,
    foodLikes: [4, 5],
    foodDislikes: [0],
    mimicSensitivity: 1,
  },
  // 6: 自己啓発社長・光山 — 近く、サラダ好き
  6: {
    seatPreference: { proximity: 'near', position: 'any' },
    menuChoice: 4,
    foodLikes: [4, 5],
    foodDislikes: [],
    mimicSensitivity: 0,
  },
  // 7: 昭和の重鎮・巌 — 下座を好む（礼儀重視）、和食
  7: {
    seatPreference: { proximity: 'any', position: 'entrance' },
    menuChoice: 2,
    foodLikes: [2, 3],
    foodDislikes: [4],
    mimicSensitivity: 2,
  },
  // 8: テック社長・中村 — 気にしない、カレー好き
  8: {
    seatPreference: { proximity: 'any', position: 'any' },
    menuChoice: 0,
    foodLikes: [0],
    foodDislikes: [],
    mimicSensitivity: 0,
  },
  // 9: 試し屋・佐藤 — 距離をとる、海鮮丼
  9: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 3,
    foodLikes: [3],
    foodDislikes: [1],
    mimicSensitivity: 2,
  },
  // 10: 褒め殺し王・松本 — 近い、がっつり
  10: {
    seatPreference: { proximity: 'near', position: 'any' },
    menuChoice: 1,
    foodLikes: [0, 1],
    foodDislikes: [],
    mimicSensitivity: 0,
  },
  // 11: 政界フィクサー・大門 — 下座重視、和食
  11: {
    seatPreference: { proximity: 'any', position: 'entrance' },
    menuChoice: 3,
    foodLikes: [2, 3],
    foodDislikes: [],
    mimicSensitivity: 1,
  },
  // 12: 芸能プロデューサー・星野 — 気にしない、カレー
  12: {
    seatPreference: { proximity: 'any', position: 'any' },
    menuChoice: 0,
    foodLikes: [0, 1],
    foodDislikes: [5],
    mimicSensitivity: 0,
  },
  // 13: 不動産王・金城 — 近い、ステーキ好き
  13: {
    seatPreference: { proximity: 'near', position: 'any' },
    menuChoice: 1,
    foodLikes: [1],
    foodDislikes: [4],
    mimicSensitivity: 1,
  },
  // 14: 医療法人理事長・白石 — 距離をとる、ライト系
  14: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 5,
    foodLikes: [4, 5],
    foodDislikes: [0],
    mimicSensitivity: 2,
  },
  // 15: 老舗料亭女将・藤原 — 下座重視、和食
  15: {
    seatPreference: { proximity: 'any', position: 'entrance' },
    menuChoice: 2,
    foodLikes: [2, 3],
    foodDislikes: [],
    mimicSensitivity: 2,
  },
  // 16: エース弁護士・正義 — 距離をとる、スープ
  16: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 5,
    foodLikes: [4, 5],
    foodDislikes: [0],
    mimicSensitivity: 2,
  },
  // 17: IT起業家・篠原 — 気にしない、カレー好き
  17: {
    seatPreference: { proximity: 'any', position: 'any' },
    menuChoice: 0,
    foodLikes: [0],
    foodDislikes: [],
    mimicSensitivity: 1,
  },
  // 18: マーケター・桐生 — 距離をとる、軽食好み
  18: {
    seatPreference: { proximity: 'far', position: 'any' },
    menuChoice: 4,
    foodLikes: [4, 5],
    foodDislikes: [0],
    mimicSensitivity: 2,
  },
  // 19: 重工会長・鷹宮 — 下座重視、和食
  19: {
    seatPreference: { proximity: 'any', position: 'entrance' },
    menuChoice: 2,
    foodLikes: [2, 3],
    foodDislikes: [],
    mimicSensitivity: 2,
  },
  // 20: 税理士法人代表・早瀬 玲奈 — 距離をとる、軽めで上品
  20: {
    seatPreference: { proximity: 'far', position: 'window' },
    menuChoice: 5,
    foodLikes: [4, 5],
    foodDislikes: [0],
    mimicSensitivity: 1,
  },
  // 21: 美容クリニック経営・立花 美月 — 近い、華やか系
  21: {
    seatPreference: { proximity: 'near', position: 'any' },
    menuChoice: 1,
    foodLikes: [1, 3],
    foodDislikes: [],
    mimicSensitivity: 2,
  },
};
