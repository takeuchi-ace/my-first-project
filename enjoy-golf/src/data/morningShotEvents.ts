import { MorningShotEvent, MorningShotResult } from '../types';

// =====================================================================
// 朝イチのショット イベントデータ
// =====================================================================

// ===== キャラ1: 銀行マン・田中 =====
const tanakaMorningShotEvent: MorningShotEvent = {
  characterId: 1,
  variants: [
    {
      shotResult: 'great',
      situation: '田中は深く一礼してから静かにテイクバック——ナイスショット。礼節が漂う一打。',
      choices: [
        {
          id: 'A',
          text: '「素晴らしいショットですね。フォームが美しい」',
          delta: { trust: 4, fun: 2, creep: 0 },
          tags: ['flattery', 'etiquette'],
        },
        {
          id: 'B',
          text: '静かに拍手を送る',
          delta: { trust: 6, fun: 0, creep: 0 },
          tags: ['etiquette', 'silence'],
        },
        {
          id: 'C',
          text: '「いいプレッシャーになります！」と笑顔で言う',
          delta: { trust: 2, fun: 4, creep: 2 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '田中はフォームを確認しながら丁寧に振り抜いた。可もなく不可もない出だし。',
      choices: [
        {
          id: 'A',
          text: '「安定感がありますね」と評価する',
          delta: { trust: 4, fun: 1, creep: 0 },
          tags: ['analysis_praise', 'etiquette'],
        },
        {
          id: 'B',
          text: '「後半に期待しましょう」と前向きに言う',
          delta: { trust: 3, fun: 3, creep: 0 },
          tags: ['humor', 'safe'],
        },
        {
          id: 'C',
          text: '何も言わずに自分の準備をする',
          delta: { trust: 2, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: '田中が慎重に構えた瞬間——シャンク。「...失礼しました」と静かに頭を下げた。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはよくあります。気にしないでください」',
          delta: { trust: 6, fun: 2, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'B',
          text: '素知らぬ顔で遠くを見る',
          delta: { trust: 3, fun: 0, creep: 0 },
          tags: ['silence', 'distance'],
        },
        {
          id: 'C',
          text: '「私も緊張していますよ！」と場を和ませる',
          delta: { trust: 4, fun: 5, creep: 2 },
          tags: ['humor', 'over_support'],
        },
      ],
    },
  ],
};

// ===== キャラ2: 体育会系社長・鬼塚 =====
const onizukaMorningShotEvent: MorningShotEvent = {
  characterId: 2,
  variants: [
    {
      shotResult: 'great',
      situation: '「よっしゃあ！」鬼塚の気合一閃、ボールは豪快にフェアウェイへ弾け飛んだ。',
      choices: [
        {
          id: 'A',
          text: '「最高です！今日は期待できますね！」と盛り上がる',
          delta: { fun: 6, trust: 4, creep: 0 },
          tags: ['hype', 'kiai'],
        },
        {
          id: 'B',
          text: '「さすが！気合が違う」とシンプルに称える',
          delta: { trust: 5, fun: 3, creep: 0 },
          tags: ['flattery', 'sportsmanship'],
        },
        {
          id: 'C',
          text: '拳を握って「負けてられない！」と気合を入れる',
          delta: { fun: 5, trust: 3, creep: 0 },
          tags: ['kiai', 'fair_compete'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '気合十分で振り抜いたが、ボールはやや右へ。「まあ悪くねえ！」',
      choices: [
        {
          id: 'A',
          text: '「フェアウェイキープ！完璧じゃないですか」と励ます',
          delta: { fun: 4, trust: 4, creep: 0 },
          tags: ['hype', 'over_support'],
        },
        {
          id: 'B',
          text: '「朝イチの一打、大事ですよね」と共感する',
          delta: { fun: 3, trust: 4, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'C',
          text: '「午後に向けて調整していきましょう！」と前向きに',
          delta: { fun: 4, trust: 3, creep: 0 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: 'フルスイングが空を切り裂き、ボールは右林へ消えた。「うおっ！」しばし沈黙。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはみんなそんなもんですよ！」と笑い飛ばす',
          delta: { fun: 6, trust: 4, creep: 0 },
          tags: ['humor', 'sportsmanship'],
        },
        {
          id: 'B',
          text: '黙って自分の準備に集中する',
          delta: { trust: 3, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
        {
          id: 'C',
          text: '「ペナルティが…大変でしたね」と真面目に言う',
          delta: { trust: -2, fun: -2, creep: 6 },
          tags: ['serious', 'distance'],
        },
      ],
    },
  ],
};

// ===== フォールバック（未登録キャラ用）=====
export const buildGenericMorningShotEvent = (characterId: number): MorningShotEvent => ({
  characterId,
  variants: [
    {
      shotResult: 'great',
      situation: '相手は見事なショットを放った。ボールはフェアウェイ中央へ飛んでいく。',
      choices: [
        {
          id: 'A',
          text: '「ナイスショット！」と称賛する',
          delta: { trust: 4, fun: 2, creep: 0 },
          tags: ['flattery', 'sportsmanship'],
        },
        {
          id: 'B',
          text: '静かに拍手を送る',
          delta: { trust: 5, fun: 0, creep: 0 },
          tags: ['etiquette', 'silence'],
        },
        {
          id: 'C',
          text: '「いいプレッシャーですね」と笑顔で言う',
          delta: { trust: 2, fun: 4, creep: 2 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '相手は丁寧にスイングした。まずまずの出だし。',
      choices: [
        {
          id: 'A',
          text: '「安定感がありますね」と評価する',
          delta: { trust: 3, fun: 1, creep: 0 },
          tags: ['analysis_praise'],
        },
        {
          id: 'B',
          text: '「いい朝ですね」と話を変える',
          delta: { trust: 2, fun: 3, creep: 0 },
          tags: ['humor', 'safe'],
        },
        {
          id: 'C',
          text: '何も言わずに自分の準備をする',
          delta: { trust: 1, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: '相手のボールが大きく曲がり、OB方向へ。気まずい空気が漂う。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはよくありますよ」と声をかける',
          delta: { trust: 5, fun: 2, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'B',
          text: '素知らぬ顔で遠くを見る',
          delta: { trust: 2, fun: 0, creep: 0 },
          tags: ['silence', 'distance'],
        },
        {
          id: 'C',
          text: '「大丈夫ですか？」と大げさに心配する',
          delta: { trust: 1, fun: 0, creep: 6 },
          tags: ['over_support'],
        },
      ],
    },
  ],
});

// ===== エクスポート =====
export const morningShotEvents: Record<number, MorningShotEvent> = {
  1: tanakaMorningShotEvent,
  2: onizukaMorningShotEvent,
};

export const getMorningShotEvent = (characterId: number): MorningShotEvent => {
  return morningShotEvents[characterId] ?? buildGenericMorningShotEvent(characterId);
};

export const pickMorningShotVariant = (characterId: number, result: MorningShotResult) => {
  const event = getMorningShotEvent(characterId);
  return event.variants.find((v) => v.shotResult === result)!;
};

export const rollMorningShotResult = (): MorningShotResult => {
  const r = Math.random();
  if (r < 0.3) return 'great';
  if (r < 0.8) return 'normal';
  return 'ob';
};
