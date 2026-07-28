import { GameEvent } from '../types';

/**
 * 極端イベント（共通プールの約20%を占める高リスク・高リターンイベント）
 * 通常イベントと同じ GameEvent 型。engine の selectEvent で混合される。
 */
export const extremeEvents: GameEvent[] = [
  // ===== STAGE 2 =====
  {
    id: 'extreme_cart_crash',
    title: 'カート暴走！',
    description: '相手のカートがまさかの暴走。坂道を転がり始めた！',
    stage: 2,
    choices: [
      { text: '全力ダッシュでカートを止めに行く', delta: { trust: 12, fun: 5, focus: -5 }, tags: ['bold', 'extreme'] },
      { text: '「危ない！」と叫んで注意を促す', delta: { trust: 5, fun: 2 }, tags: ['safe'] },
      { text: 'スマホで動画を撮る', delta: { fun: -5, trust: -10, creep: 15 }, tags: ['extreme', 'snitch'] },
    ],
  },
  {
    id: 'extreme_bet_proposal',
    title: '高額賭けの提案',
    description: '相手が「1ホール10万で行かない？」と提案してきた。',
    stage: 3,
    choices: [
      { text: '「面白い！乗りましょう！」', delta: { fun: 10, trust: 3, focus: 8 }, tags: ['bold', 'risk', 'extreme'] },
      { text: '「さすがにそれは…笑」とやんわり断る', delta: { trust: 3, fun: -1, focus: 3 }, tags: ['safe', 'ethics', 'serious'] },
      { text: '「じゃあ20万で」と倍プッシュ', delta: { fun: 7, trust: 3, creep: 3 }, tags: ['bold', 'risk', 'kiai', 'extreme'] },
    ],
  },

  // ===== STAGE 4 =====
  {
    id: 'extreme_wrong_ball',
    title: '相手のボールを打ってしまった',
    description: '間違えて相手のボールを打ってしまった。相手はまだ気づいていない…',
    stage: 4,
    choices: [
      { text: '正直に申告する', delta: { trust: 10, fun: 3 }, tags: ['honesty', 'ethics', 'sportsmanship'] },
      { text: '黙ってすり替える', delta: { trust: -5, creep: 12 }, tags: ['cheat_physical', 'extreme'] },
      { text: '「あれ？ボール変わってません？」と相手のせいにする', delta: { trust: -15, creep: 20 }, tags: ['cheat_score', 'extreme', 'snitch'] },
    ],
  },
  {
    id: 'extreme_rain_decision',
    title: '突然の豪雨',
    description: '4ホール目で突然の豪雨。コースに雷鳴が響く。',
    stage: 4,
    choices: [
      { text: '「安全第一、避難しましょう！」と相手を誘導', delta: { trust: 8, fun: -3 }, tags: ['ethics', 'serious'] },
      { text: '「この雨、気持ちいいですね！」と強がる', delta: { fun: 6, trust: 2, focus: -5 }, tags: ['bold', 'hype', 'extreme'] },
      { text: '自分だけ傘を差して相手は濡れるに任せる', delta: { trust: -8, creep: 10, fun: -5 }, tags: ['extreme'] },
    ],
  },

  // ===== STAGE 5 =====
  {
    id: 'extreme_hole_in_one',
    title: '相手のホールインワン！？',
    description: '相手のショットがピンに向かって一直線！カップに消えた…かもしれない。',
    // プレー中の場面なので stage 4。stage 5 は「昼食の追加会話」ビート専用
    stage: 4,
    choices: [
      { text: '全力で祝福！「すごい！人生初のHIO！」', delta: { fun: 10, trust: 5 }, tags: ['hype', 'humor'] },
      { text: '冷静に「確認しに行きましょう」', delta: { trust: 5, fun: 2 }, tags: ['serious', 'sportsmanship'] },
      { text: '「いや、入ってないと思いますよ」とケチをつける', delta: { fun: -8, trust: -10, creep: 8 }, tags: ['extreme'] },
    ],
  },
  {
    id: 'extreme_celebrity_encounter',
    title: 'コースで有名人と遭遇',
    description: '隣のコースに超有名タレントがいる。相手も気づいたようだ。',
    // コース上の場面なので stage 6。stage 5 は「昼食の追加会話」ビート専用
    stage: 6,
    choices: [
      { text: '「せっかくだし声かけましょう！」と積極的に', delta: { fun: 8, trust: 2, creep: 3 }, tags: ['bold', 'hype', 'extreme'] },
      { text: '「プレーに集中しましょう」と大人の対応', delta: { trust: 5, focus: 5 }, tags: ['serious', 'distance'] },
      { text: 'こっそり写真を撮って相手に自慢', delta: { fun: 3, creep: 8, trust: -3 }, tags: ['extreme', 'snitch'] },
    ],
  },

  // ===== STAGE 6-7 =====
  {
    id: 'extreme_equipment_break',
    title: 'クラブが折れた！',
    description: 'フルスイングした瞬間、相手のドライバーがポキッと折れた。',
    stage: 6,
    choices: [
      { text: '「大丈夫ですか！？自分のクラブ使ってください！」', delta: { trust: 8, fun: 3 }, tags: ['over_support', 'sportsmanship'] },
      { text: '「ナイスフォロースルー！…クラブ以外は」と笑いに変える', delta: { fun: 10, trust: 3 }, tags: ['humor', 'extreme'] },
      { text: '無言でスマホを見始める', delta: { trust: -5, fun: -5, creep: 5 }, tags: ['silence', 'extreme'] },
    ],
  },
  {
    id: 'extreme_confession',
    title: '相手の突然の告白',
    description: '7番ホールで相手が急に真剣な顔に。「実は…会社の経営が厳しくてね」',
    stage: 7,
    choices: [
      { text: '真剣に耳を傾け、共感する', delta: { trust: 12, fun: -2 }, tags: ['honesty', 'ethics', 'serious'] },
      { text: '「大丈夫！なんとかなりますよ！」と励ます', delta: { fun: 5, trust: 3, creep: 2 }, tags: ['hype', 'over_support'] },
      { text: '「へぇ…で、次のホールどう攻めます？」と話題を変える', delta: { trust: -8, fun: -3, creep: 5 }, tags: ['extreme', 'distance'] },
      { text: 'その情報を他の人脈に流そうと考える', delta: { trust: -15, creep: 18 }, tags: ['extreme', 'snitch', 'risk'] },
    ],
  },

  // ===== STAGE 8-9 =====
  {
    id: 'extreme_final_hole_allIn',
    title: '最終ホール・全賭け宣言',
    description: '最終ホール。相手が「このホールで全てが決まる」と呟いた。',
    stage: 8,
    choices: [
      { text: '「一緒に最高のフィニッシュにしましょう！」', delta: { fun: 8, trust: 5, focus: 5 }, tags: ['hype', 'sportsmanship'] },
      { text: '黙ってうなずき、集中を共有する', delta: { trust: 6, focus: 8 }, tags: ['silence', 'serious'] },
      { text: 'わざとミスして相手を気持ちよく勝たせる', delta: { fun: 2, trust: -3, creep: 10 }, tags: ['cheat_physical', 'extreme', 'over_support'] },
    ],
  },
  {
    id: 'extreme_post_round_offer',
    title: '食事の誘いと「あの件」',
    description: 'ラウンド終盤。相手が「この後食事でもどう？大事な話がある」と切り出した。',
    stage: 9,
    choices: [
      { text: '「ぜひ！お供させてください」と快諾', delta: { fun: 5, trust: 8 }, tags: ['etiquette', 'bold'] },
      { text: '「お時間いただけるなら喜んで」と丁寧に', delta: { trust: 6, fun: 3 }, tags: ['etiquette', 'safe'] },
      { text: '「仕事の話なら今ここで」とビジネスモードに', delta: { trust: -2, fun: -3, focus: 8 }, tags: ['boss', 'logic', 'extreme'] },
      { text: '「食事は奢りますよ！」と先手を打つ', delta: { fun: 4, trust: 2, creep: 5 }, tags: ['over_support', 'extreme', 'over_praise'] },
    ],
  },
];
