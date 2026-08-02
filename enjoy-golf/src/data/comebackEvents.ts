/**
 * 挽回のビート — 負けている終盤にだけ来る、大きく振れる一手
 *
 * ## なぜ要るか
 *
 * 負け方の内訳を実測すると、大差で負けるほうが惜しく負けるより 3 倍多い。
 *
 * | 技能 | 成功 | 惜しい（信頼あと8以内） | 遠い負け |
 * |---|---|---|---|
 * | 0.5 | 49% | 10% | 30% |
 * | 0.65 | 65% | 8% | 18% |
 * | 0.8 | 80% | 4% | 13% |
 *
 * 「もう一回」が出るのは惜しい負けのときで、大差で負けると
 * その相手を諦めて次のキャラに行ってしまう。
 *
 * ## 設計
 *
 * 8番ホールで信頼が明らかに足りていないときだけ、1ラウンドに1回発生する。
 * 相手がふと素を出す場面で、振れ幅は通常のビートの倍。
 *
 * ただし**タダの救済にはしない**。読み違えれば同じだけ落ちる。
 * どの手が正解かは相手のタグ次第なので、読めていた人だけが戻せる。
 * これで契約率をほとんど動かさずに、負けの内訳だけを動かす。
 *
 * 選択肢は毎回タグ族を散らしてある（正直／筋／笑い／持ち上げ／引き）。
 * 一つの族だけで全部拾えると、また特定の手の一強に戻ってしまう。
 */

import { GameEvent } from '../types';

/** このビートが出る信頼の上限。契約ライン(70)に対して明らかに足りていない範囲 */
export const COMEBACK_TRUST_MAX = 58;
/** このビートが出るホール */
export const COMEBACK_HOLE = 8;

export const comebackEvents: GameEvent[] = [
  {
    id: 'cb_honest_question',
    title: '不意の問いかけ',
    description:
      'カートが止まった。相手がクラブを握ったまま、前を向いたまま言う。「……今日、どうでした。正直なところ」',
    stage: COMEBACK_HOLE,
    choices: [
      {
        text: '「正直、うまく間合いが掴めませんでした」と隠さず言う',
        delta: { trust: 12, fun: -1 },
        tags: ['honesty', 'self_reflect'],
        speech: {
          good: '……そう言ってもらえると、こっちも楽です。',
          neutral: 'まぁ、そういう日もありますよ。',
          bad: '正直なのはいいですが、それだけでは。',
          worst: '……そういうの、聞きたかったわけじゃない。',
        },
      },
      {
        text: '「楽しかったです。それ以上のことは言えません」と線を引く',
        delta: { trust: 10, creep: -2 },
        tags: ['ethics', 'serious'],
        speech: {
          good: '……いい返しだ。そういう人と仕事がしたい。',
          neutral: 'まぁ、そうでしょうね。',
          bad: '固いなあ。もう少し崩してもいいのに。',
          worst: '……ずいぶん他人行儀ですね。',
        },
      },
      {
        text: '「最高でした！こんなに笑ったのは久しぶりです」と返す',
        delta: { trust: 9, fun: 5 },
        tags: ['humor', 'hype'],
        speech: {
          good: 'はは、それはよかった。私も久しぶりに笑いましたよ。',
          neutral: 'それはなにより。',
          bad: '……そんなに面白い日でしたかね。',
          worst: 'ちょっと調子がよすぎませんか。',
        },
      },
      {
        text: '「勉強になることばかりでした」と持ち上げる',
        delta: { trust: 8, creep: 3 },
        tags: ['flattery', 'over_praise'],
        speech: {
          good: 'いやいや、私こそ。',
          neutral: 'そう言ってもらえるなら。',
          bad: '……そういうの、いいですから。',
          worst: 'そこまで言われると、かえって白けます。',
        },
      },
    ],
  },
  {
    id: 'cb_bad_lie',
    title: '林の中から',
    description:
      '相手の球が林に入った。木の間から相手がこちらを見る。ここからどう出るかで、今日の空気が決まる。',
    stage: COMEBACK_HOLE,
    choices: [
      {
        text: '「出すだけにしましょう。次で取り返せます」と冷静に言う',
        delta: { trust: 11, focus: 3 },
        tags: ['logic', 'safe_play'],
        speech: {
          good: '……そうですね。冷静だ。',
          neutral: 'まぁ、それが妥当でしょうね。',
          bad: 'そんなことは分かってますよ。',
          worst: '……いちいち指図されたくない。',
        },
      },
      {
        text: '「狙えますよ。ここで決めたら気持ちいいでしょう」と煽る',
        delta: { trust: 11, fun: 4, creep: 2 },
        tags: ['bold', 'challenge'],
        speech: {
          good: 'はは、言うねえ。じゃあ狙うか。',
          neutral: 'まぁ、そういう手もありますね。',
          bad: '……無責任なことを言わないでください。',
          worst: '面白がってませんか、それ。',
        },
      },
      {
        text: '黙って離れ、打ちやすいように立ち位置を空ける',
        delta: { trust: 9, focus: 4 },
        tags: ['etiquette', 'silence'],
        speech: {
          good: '……気が利きますね。助かりました。',
          neutral: 'どうも。',
          bad: '別に、そこまでされなくても。',
          worst: '……何も言わないんですね。',
        },
      },
      {
        text: '「一緒に探しますよ」と林に分け入る',
        delta: { trust: 10, fun: 2, creep: 2 },
        tags: ['team', 'over_support'],
        speech: {
          good: 'いや、そこまでしてもらって。ありがとう。',
          neutral: 'まぁ、助かります。',
          bad: 'いいですよ、自分でやりますから。',
          worst: 'そこまでされると、こっちが気を遣う。',
        },
      },
    ],
  },
  {
    id: 'cb_phone_call',
    title: '鳴った電話',
    description:
      '相手の携帯が鳴った。少し離れて話し、戻ってきた顔が硬い。「……すみません、仕事の話で」',
    stage: COMEBACK_HOLE,
    choices: [
      {
        text: '「大丈夫ですか。何かあれば言ってください」と正面から聞く',
        delta: { trust: 11, fun: -1 },
        tags: ['honesty', 'serious'],
        speech: {
          good: '……いや、大したことじゃないんです。ありがとう。',
          neutral: 'ええ、まぁ、なんとかなります。',
          bad: 'そこまで踏み込まれても困ります。',
          worst: '……仕事の話は、今はいいでしょう。',
        },
      },
      {
        text: '「残り2ホール、忘れて打ちましょう」と切り替えを促す',
        delta: { trust: 12, focus: 3 },
        tags: ['fair_compete', 'kiai'],
        speech: {
          good: '……そうですね。せっかくの一日だ。',
          neutral: 'まぁ、そうしましょうか。',
          bad: '簡単に言いますね。',
          worst: '忘れられるなら苦労しません。',
        },
      },
      {
        text: '何も聞かず、いつもどおりに振る舞う',
        delta: { trust: 9, creep: -2 },
        tags: ['distance', 'neutral'],
        speech: {
          good: '……そういう気の遣い方、ありがたいです。',
          neutral: 'どうも。',
          bad: '……興味ないんですかね。',
          worst: '他人事だと思ってるでしょう。',
        },
      },
      {
        text: '「そういうときこそ、いいスコアが出るものです」と明るく言う',
        delta: { trust: 8, fun: 5, creep: 2 },
        tags: ['humor', 'ride_the_mood'],
        speech: {
          good: 'はは、それは初耳だ。試してみますか。',
          neutral: 'そうだといいですけどね。',
          bad: '……そんな軽い話じゃないんですよ。',
          worst: 'ふざけてるんですか。',
        },
      },
    ],
  },
  {
    id: 'cb_water_hazard',
    title: '池の前',
    description:
      '池越えの一打。相手が長く迷っている。「……どう思います」と、はじめてこちらに判断を委ねてきた。',
    stage: COMEBACK_HOLE,
    choices: [
      {
        text: '「刻みましょう。ここで無理をする場面じゃない」と言い切る',
        delta: { trust: 11, focus: 3 },
        tags: ['logic', 'avoid_risk'],
        speech: {
          good: 'はっきり言ってくれる人は貴重です。',
          neutral: 'まぁ、それが無難でしょうね。',
          bad: 'つまらないことを言いますね。',
          worst: '……人の楽しみを削らないでください。',
        },
      },
      {
        text: '「越えましょう。届く距離です」と背中を押す',
        delta: { trust: 12, fun: 3, creep: 2 },
        tags: ['bold', 'back_up'],
        speech: {
          good: '……よし、行きます。あなたが言うなら。',
          neutral: 'まぁ、やってみますか。',
          bad: '無責任に煽らないでください。',
          worst: '池に入れたら責任取れるんですか。',
        },
      },
      {
        text: '「決めるのはご自身です。どちらでも合わせます」と返す',
        delta: { trust: 10, creep: -2 },
        tags: ['etiquette', 'fair_compete'],
        speech: {
          good: '……そうですね。自分で決めます。いい返しだ。',
          neutral: 'まぁ、そうですよね。',
          bad: '聞いてるのはこっちなんですが。',
          worst: '……逃げましたね、今。',
        },
      },
      {
        text: '「○○さんなら絶対に越えられますよ！」と力強く言う',
        delta: { trust: 8, fun: 4, creep: 4 },
        tags: ['over_praise', 'hype'],
        speech: {
          good: 'はは、そこまで言われたら行くしかない。',
          neutral: 'まぁ、やってみますよ。',
          bad: '……根拠のない話は結構です。',
          worst: 'そういう持ち上げ方、疲れるんですよ。',
        },
      },
    ],
  },
];
