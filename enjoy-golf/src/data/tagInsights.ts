/**
 * 「一緒に回って分かったこと」の文面
 *
 * プレイヤーが実際に体験して得た手応えを、プロフィール画面に日本語で残す。
 * タグ名（`flattery` 等）は内部の都合なので出さない。
 *
 * `liked` はその手が刺さった（good）ときの言い方、
 * `hated` は怒らせた（worst）ときの言い方。
 * 同じタグでも刺さったのか外したのかで書き分ける必要があるため、対で持つ。
 *
 * ヒント（`character.hint`）が「最初から与えられる手がかり」なのに対し、
 * こちらは**回った回数だけ増える**。周回そのものが報酬になる。
 */

import { Tag } from '../types';

type Insight = { liked: string; hated: string };

export const tagInsights: Partial<Record<Tag, Insight>> = {
  // ===== 誠実・筋 =====
  honesty: { liked: '正直に言うと信頼される', hated: '正直すぎる物言いは嫌われる' },
  ethics: { liked: '筋を通すと認められる', hated: '正しさを振りかざすと疎まれる' },
  sportsmanship: { liked: '対等に接すると喜ぶ', hated: '規則にこだわると窮屈がられる' },
  serious: { liked: '真剣に向き合うと響く', hated: '硬すぎる態度は重く受け取られる' },
  logic: { liked: '筋道立てて話すと通じる', hated: '理屈っぽさを嫌う' },
  etiquette: { liked: '礼儀を尽くすと伝わる', hated: '形式ばると窮屈がられる' },
  fair_compete: { liked: '対等に勝負すると乗ってくる', hated: '勝ち負けにこだわられるのを嫌う' },
  self_reflect: { liked: '素直に非を認めると好印象', hated: '自分を責めすぎると気を遣わせる' },

  // ===== 持ち上げる・世話を焼く =====
  flattery: { liked: '持ち上げると機嫌がいい', hated: '媚びを見透かされる' },
  over_praise: { liked: '大げさに褒めても喜ぶ', hated: '褒めすぎは嘘くさく響く' },
  over_support: { liked: '世話を焼くと感謝される', hated: '世話を焼きすぎると重がられる' },

  // ===== 笑い・ノリ =====
  humor: { liked: '笑わせると距離が縮まる', hated: 'ふざけると場を壊す' },
  hype: { liked: '盛り上げると乗ってくる', hated: '騒がしさを嫌う' },
  ride_the_mood: { liked: '流れに乗ると噛み合う', hated: '調子を合わせるだけだと見抜かれる' },
  bro: { liked: '砕けた距離感を喜ぶ', hated: '馴れ馴れしさを嫌う' },
  team: { liked: '一緒にやろうとすると乗る', hated: '馴れ合いを嫌う' },
  back_up: { liked: '励ますと力になる', hated: '励ましが同情に聞こえると嫌がる' },

  // ===== 攻める =====
  bold: { liked: '思い切った手が刺さる', hated: '攻めすぎると引かれる' },
  kiai: { liked: '気合が伝わると乗ってくる', hated: '精神論を嫌う' },
  risk: { liked: '賭けに乗ると面白がる', hated: '危ない橋を嫌う' },
  adversity: { liked: '逆境に強い姿勢を買う', hated: '強がりは見透かされる' },
  challenge: { liked: '勝負を挑むと応じる', hated: '煽られるのを嫌う' },
  alcohol: { liked: '一緒に飲むと打ち解ける', hated: 'プレー中の酒を嫌う' },

  // ===== 引く・逃げる =====
  safe: { liked: '無理をしない判断を好む', hated: '当たり障りのない返事を嫌う' },
  safe_play: { liked: '堅実に刻むのを評価する', hated: '守りに入ると物足りながられる' },
  avoid_risk: { liked: '危険を避ける判断を好む', hated: '逃げてばかりだと呆れられる' },
  silence: { liked: '黙っていることを好む', hated: '沈黙されると困る' },
  distance: { liked: '察して引くと助かる', hated: '他人事のような態度を嫌う' },
  neutral: { liked: '余計を言わないのが合う', hated: '無関心に見えると嫌われる' },
  excuse: { liked: '言い訳を笑って流す', hated: '言い訳を嫌う' },

  // ===== 圧・立場 =====
  pressure: { liked: 'はっきり言うと伝わる', hated: '圧をかけると不快がられる' },
  boss: { liked: '仕事の話を歓迎する', hated: '商談を持ち込むと興ざめする' },
  analysis_praise: { liked: 'よく見て褒めると響く', hated: '評論家めいた口ぶりを嫌う' },
  focus: { liked: '集中を尊重すると好印象', hated: '一人の世界に入ると置いていかれる' },

  // ===== 不正 =====
  cheat_physical: { liked: '目こぼしを歓迎する', hated: 'ごまかしを許さない' },
  cheat_score: { liked: 'スコアの融通を歓迎する', hated: '数字のごまかしを許さない' },
  cheat: { liked: '内緒の提案に乗る', hated: '不正な提案を許さない' },
  snitch: { liked: '記録を残すのを好む', hated: '告げ口や隠し撮りを嫌う' },

  extreme: { liked: '振り切った手が刺さる', hated: 'やりすぎるとついていけない' },
};

/** そのタグについて分かったことの一文。無ければ null（表示しない） */
export const getTagInsight = (tag: Tag, kind: 'liked' | 'hated'): string | null =>
  tagInsights[tag]?.[kind] ?? null;
