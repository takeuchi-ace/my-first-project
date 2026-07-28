import { GameEvent } from '../types';

/**
 * 好調時の後半イベント（lunchMood === "good" で60%優先出現）
 *
 * 特徴：
 * - trust が上がりやすい
 * - creep 耐性がやや緩和（低め）
 * - リラックスした好意的なシチュエーション
 *
 * stage は出現ホールの希望値。engine が同ホール優先で抽選する。
 * 後半の抽選対象ホールは 6・7・8（9は最終パットで埋まる）なので、
 * このプールに stage 9 を置くと出にくくなる。
 */
export const goodBackEvents: GameEvent[] = [
  {
    id: 'good_back_relax_chat',
    title: 'リラックスした雑談',
    description: '相手がリラックスした表情で「いやぁ、今日は本当に楽しいですね」と雑談を振ってくる。',
    stage: 6,
    category: 'goodBack',
    choices: [
      { text: '「自分も楽しんでます！」と笑顔で返す', delta: { trust: 5, fun: 5 }, tags: ['humor'] },
      { text: '「○○さんのおかげです」', delta: { trust: 4, fun: 3, creep: 2 }, tags: ['flattery'] },
      { text: '「プレーに集中しましょう」', delta: { trust: 2, fun: -2, focus: 5 }, tags: ['serious'] },
    ],
  },
  {
    id: 'good_back_self_deprecation',
    title: '自虐の笑い',
    description: '相手が自分のミスショットを笑い話にしている。「いやー、ひどいもんだ！」',
    stage: 6,
    category: 'goodBack',
    choices: [
      { text: '一緒に笑う', delta: { trust: 5, fun: 6 }, tags: ['humor'] },
      { text: '「全然大丈夫ですよ！」とフォロー', delta: { trust: 2, fun: 2, creep: 2 }, tags: ['over_support', 'flattery'] },
      { text: '改善アドバイスを出す', delta: { trust: 3, fun: 1, focus: 4 }, tags: ['logic'] },
    ],
  },
  {
    id: 'good_back_photo_together',
    title: '記念撮影',
    description: '相手がスマホを取り出し「今日の記念に一枚どうですか？」と提案する。',
    stage: 7,
    category: 'goodBack',
    choices: [
      { text: '「ぜひ！」と快諾', delta: { trust: 5, fun: 5 }, tags: ['humor', 'hype'] },
      { text: '「恥ずかしいですが…」と照れつつOK', delta: { trust: 4, fun: 3 }, tags: ['safe'] },
      { text: '「プレー中はちょっと…」と断る', delta: { trust: -2, fun: -3, focus: 3 }, tags: ['serious', 'distance'] },
    ],
  },
  {
    id: 'good_back_course_praise',
    title: 'コースへの感想',
    description: '「このコース、景色も最高ですね。いい選択でした」と相手が褒める。',
    stage: 7,
    category: 'goodBack',
    choices: [
      { text: '「気に入っていただけて嬉しいです」', delta: { trust: 5, fun: 4 }, tags: ['etiquette'] },
      { text: '「○○さんと回れるのが一番です」', delta: { trust: 3, fun: 4, creep: 2 }, tags: ['flattery'] },
      { text: 'コース情報を詳しく語る', delta: { trust: 4, fun: 2, focus: 3 }, tags: ['logic'] },
    ],
  },
  {
    id: 'good_back_compliment',
    title: '褒められる',
    description: '「あなたのプレー、勉強になります。丁寧ですね」と真剣に褒められる。',
    stage: 8,
    category: 'goodBack',
    choices: [
      { text: '「ありがとうございます。○○さんこそ」', delta: { trust: 5, fun: 3 }, tags: ['etiquette'] },
      { text: '「いやいや、まだまだです」', delta: { trust: 4, fun: 2 }, tags: ['honesty'] },
      { text: '「教えますよ！」', delta: { trust: 1, fun: 4, creep: 3 }, tags: ['over_support', 'hype'] },
    ],
  },
  {
    id: 'good_back_next_time',
    title: '次回の約束',
    description: '「また来月もやりましょうよ！」と相手がノリノリで誘ってくる。',
    stage: 8,
    category: 'goodBack',
    choices: [
      { text: '「ぜひ！楽しみにしてます！」', delta: { trust: 6, fun: 5 }, tags: ['hype'] },
      { text: '「スケジュール確認しますね」', delta: { trust: 3, fun: 1 }, tags: ['safe'] },
      { text: '「毎月は厳しいかも…」', delta: { trust: -3, fun: -2 }, tags: ['distance'] },
    ],
  },
  {
    id: 'good_back_sunset',
    title: '夕陽の瞬間',
    description: '美しい夕陽が差し込む。相手が足を止めて「いい景色だ…」と呟く。',
    stage: 8,
    category: 'goodBack',
    choices: [
      { text: '一緒に静かに眺める', delta: { trust: 5, fun: 3, focus: 3 }, tags: ['silence'] },
      { text: '「○○さんと見れて良かった」', delta: { trust: 4, fun: 3, creep: 2 }, tags: ['flattery'] },
      { text: '「日が暮れますね、急ぎましょう」', delta: { trust: -1, fun: -2, focus: 5 }, tags: ['serious'] },
    ],
  },
];
