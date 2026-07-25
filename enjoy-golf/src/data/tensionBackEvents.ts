import { GameEvent } from '../types';

/**
 * 不調時の後半イベント（lunchMood === "bad" で60%優先出現）
 *
 * 特徴：
 * - creep が増えやすい
 * - trust が減りやすい
 * - 改善難易度が上昇するシチュエーション
 *
 * stage は出現ホールの希望値。engine が同ホール優先で抽選する。
 * 後半の抽選対象ホールは 6・7・8（9は最終パットで埋まる）なので、
 * このプールに stage 9 を置くと出にくくなる。
 */
export const tensionBackEvents: GameEvent[] = [
  {
    id: 'tension_back_silence',
    title: '急な沈黙',
    description: '相手が急に無言になった。空気が重い。何かを考えているようだ。',
    stage: 6,
    category: 'tensionBack',
    choices: [
      { text: '静かに待つ', delta: { trust: 3, fun: -2, focus: 3 }, tags: ['silence'] },
      { text: '「どうしました？」と聞く', delta: { trust: 1, creep: 4 }, tags: ['over_support'] },
      { text: '無理に話題を振る', delta: { trust: -4, fun: 1, creep: 8 }, tags: ['hype'] },
    ],
  },
  {
    id: 'tension_back_challenge',
    title: '勝負を仕掛けられる',
    description: '「このホール、勝負しませんか？」と鋭い目で言われる。',
    stage: 6,
    category: 'tensionBack',
    choices: [
      { text: '「受けて立ちます」', delta: { trust: 4, fun: 3, focus: 5, creep: 2 }, tags: ['bold', 'risk'] },
      { text: '「楽しくいきましょう」', delta: { trust: 1, fun: 2, creep: 5 }, tags: ['safe'] },
      { text: '「本気ですか？」と引く', delta: { trust: -5, fun: -3, creep: 8 }, tags: ['distance'] },
    ],
  },
  {
    id: 'tension_back_ob_accusation',
    title: 'OB疑惑の追及',
    description: '「今の、OBじゃないですか？」と鋭く指摘される。実際はギリギリセーフ。',
    stage: 7,
    category: 'tensionBack',
    choices: [
      { text: '「確認しましょう」と冷静に対応', delta: { trust: 5, focus: 4 }, tags: ['ethics', 'sportsmanship'] },
      { text: '「セーフです！」と即座に主張', delta: { trust: -2, fun: -1, creep: 6 }, tags: ['boss'] },
      { text: '「…見てなかったんですが」と曖昧に', delta: { trust: -6, fun: -2, creep: 10 }, tags: ['cheat', 'risk'] },
    ],
  },
  {
    id: 'tension_back_payment',
    title: '支払いの話題',
    description: '「今日の支払い、どうしましょうか？」と切り出される。表情は読めない。',
    stage: 8,
    category: 'tensionBack',
    choices: [
      { text: '「ここは自分が」と自然に申し出る', delta: { trust: 4, fun: 2, creep: 2 }, tags: ['etiquette'] },
      { text: '「割り勘でいかがですか」', delta: { trust: 3 }, tags: ['honesty'] },
      { text: '「○○さんにお任せします」', delta: { trust: -4, fun: -2, creep: 7 }, tags: ['distance'] },
    ],
  },
  {
    id: 'tension_back_probing',
    title: '探りの質問',
    description: '「他のお客さんとも、こうやって回ったりするんですか？」と探りを入れられる。',
    stage: 8,
    category: 'tensionBack',
    choices: [
      { text: '正直に答える', delta: { trust: 5, focus: 3 }, tags: ['honesty'] },
      { text: '「○○さんが特別ですよ」', delta: { fun: 2, creep: 7 }, tags: ['flattery', 'over_praise'] },
      { text: '話題をそらす', delta: { trust: -3, fun: -1, creep: 6 }, tags: ['distance'] },
    ],
  },
  {
    id: 'tension_back_score_doubt',
    title: 'スコアへの不信',
    description: '「さっきのホール、本当にパーでしたか？」と疑いの目で見られる。',
    stage: 8,
    category: 'tensionBack',
    choices: [
      { text: '「もう一度確認しましょう」と冷静に', delta: { trust: 5, fun: -1, focus: 4 }, tags: ['ethics', 'honesty'] },
      { text: '「パーです、間違いありません」と強く主張', delta: { fun: -2, creep: 5 }, tags: ['boss', 'pressure'] },
      { text: '「…多分そうだったと思います」と曖昧に', delta: { trust: -6, fun: -3, creep: 10 }, tags: ['cheat', 'risk'] },
    ],
  },
  {
    id: 'tension_back_cold_call',
    title: '不穏な電話',
    description: '相手が電話を受けた後、厳しい表情で戻ってくる。「…すみません、ちょっと」',
    stage: 8,
    category: 'tensionBack',
    choices: [
      { text: '「大丈夫ですか？」と気遣う', delta: { trust: 4, creep: 1 }, tags: ['etiquette'] },
      { text: '何も聞かず待つ', delta: { trust: 3, fun: -1, focus: 3 }, tags: ['silence', 'distance'] },
      { text: '「何かあったんですか？」と食い下がる', delta: { trust: -4, fun: -2, creep: 8 }, tags: ['over_support', 'pressure'] },
    ],
  },
];
