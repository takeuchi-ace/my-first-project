import { ReactionRank } from '../types';

export type GestureClass = 'positive' | 'neutral' | 'negative';

export const positiveGestures: string[] = [
  '嬉しそうに目を細めている',
  '小さくガッツポーズをした',
  'クラブを軽く掲げた',
  '満足げに頷いている',
  '口元が緩んでいる',
  '背筋が少し伸びた',
  '足取りが軽くなった',
  'こちらに親しげな視線を送っている',
  '鼻歌まじりに歩き出した',
  '帽子のつばに手をやり微笑んだ',
];

export const neutralGestures: string[] = [
  'グローブを直している',
  'ボールマーカーを弄っている',
  '空を見上げている',
  'ティーを地面に刺した',
  'ポケットに手を入れて歩いている',
  'スコアカードをチラリと見た',
  'クラブのヘッドを拭いている',
  '芝の状態を確かめている',
  '静かに水を飲んでいる',
  '風の方向を確認している',
];

export const negativeGestures: string[] = [
  '腕を組んでこちらを見ている',
  '目を逸らした',
  '足元を見つめている',
  '唇を噛んでいる',
  '距離を取るように一歩下がった',
  'ため息をついている',
  'クラブを強く握り直した',
  '眉間にシワを寄せている',
  'こちらに背を向けた',
  '帽子を深く被り直した',
];

export function rankToGestureClass(rank: ReactionRank): GestureClass {
  switch (rank) {
    case 'good':
      return 'positive';
    case 'neutral':
      return 'neutral';
    case 'bad':
    case 'worst':
      return 'negative';
  }
}

export function swapGestureClass(cls: GestureClass): GestureClass {
  switch (cls) {
    case 'positive':
      return 'negative';
    case 'negative':
      return 'positive';
    case 'neutral':
      return Math.random() < 0.5 ? 'positive' : 'negative';
  }
}

export function getGesturePool(cls: GestureClass): string[] {
  switch (cls) {
    case 'positive':
      return positiveGestures;
    case 'neutral':
      return neutralGestures;
    case 'negative':
      return negativeGestures;
  }
}
