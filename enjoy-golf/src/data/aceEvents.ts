/**
 * ⚠️ 未使用ファイル（2026-07-25 時点）
 *
 * このファイルはどこからも import されていない。稼働している相談ラウンドは
 * `aceConsults.ts`（悩み42件・ACEの回答つき）で、aceEngine.ts がそちらを読む。
 * 本ファイルはその前段の草稿で、悩みの題材20件は aceConsults 側に書き直されて
 * 引き継がれている（回答文はより練られたものに差し替え済み）。
 *
 * 参照用に残してあるだけなので、削除して問題ない。
 * 逆にこちらを使いたい場合は aceEngine.ts の import 先を差し替えること。
 *
 * ── 以下、当初の設計メモ ──
 *
 * エースラウンド専用イベント（20件） — 相談モード
 *
 * プレイヤーが仕事やプライベートの悩みを打ち明け、
 * エースが返答する「相談ラウンド」形式。
 *
 * description = プレイヤーの悩み（prompt）
 * choices[].text = エースの返答（response）
 *
 * 全選択肢がポジティブ。間違いは存在しない。
 * どれを選んでも親密度 +1。
 * delta は全てゼロ（エースラウンドではゲージを使わない）。
 *
 * bestMood フラグ: true のイベントでは表情が best になる。
 * category: 'work' | 'private'
 */

import { GameEvent } from '../types';

const D0 = { fun: 0, trust: 0, creep: 0, focus: 0 };

export interface AceEvent extends GameEvent {
  bestMood?: boolean;
  consultCategory: 'work' | 'private';
}

export const aceEvents: AceEvent[] = [
  // ─── 前半（stage 1-4）：仕事の悩み ───
  {
    id: 'ace_01',
    title: '部下の育成',
    description:
      '「最近、部下が伸び悩んでいて…どう接したらいいか分からないんです。」',
    stage: 1,
    consultCategory: 'work',
    choices: [
      { text: '「待つのも仕事ですよ。芽が出るまで信じましょう。」', delta: D0, tags: ['honesty'] },
      { text: '「一緒にラウンドでも連れてきてください。距離が縮まりますよ。」', delta: D0, tags: ['humor'] },
      { text: '「自分が成長した頃を思い出してみてください。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_02',
    title: '転職の迷い',
    description:
      '「実は…転職を考えていて。でも今の環境を手放すのが怖いんです。」',
    stage: 1,
    consultCategory: 'work',
    choices: [
      { text: '「怖いと思えるのは、真剣な証拠です。」', delta: D0, tags: ['honesty'] },
      { text: '「どっちを選んでも、あなたなら大丈夫ですよ。」', delta: D0, tags: ['bold'] },
      { text: '「まずはゴルフで頭を空にしましょう。答えは後から来ます。」', delta: D0, tags: ['humor'] },
    ],
  },
  {
    id: 'ace_03',
    title: 'プレゼンの不安',
    description:
      '「来週、大きなプレゼンがあるんです。正直、緊張で眠れなくて…」',
    stage: 2,
    consultCategory: 'work',
    choices: [
      { text: '「緊張するのは準備してきた証拠です。自信を持って。」', delta: D0, tags: ['hype'] },
      { text: '「完璧じゃなくていい。伝えたい気持ちがあれば届きます。」', delta: D0, tags: ['honesty'] },
      { text: '「ティーショットと同じです。深呼吸して、振り抜くだけですよ。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_04',
    title: '上司との関係',
    description:
      '「上司とどうも馬が合わなくて…毎日が憂鬱なんです。」',
    stage: 2,
    consultCategory: 'work',
    choices: [
      { text: '「合わない人がいるのは自然なことですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「ゴルフに誘ってみたらどうですか？意外と変わるかも。」', delta: D0, tags: ['humor'] },
      { text: '「無理に合わせなくていい。自分の仕事に集中しましょう。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_05',
    title: 'やりがいの喪失',
    description:
      '「仕事にやりがいを感じなくなってきて…このままでいいのかなって。」',
    stage: 3,
    consultCategory: 'work',
    choices: [
      { text: '「立ち止まれる人は、ちゃんと前を見てる人ですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「やりがいは探すものじゃなく、気づくものかもしれません。」', delta: D0, tags: ['bold'] },
      { text: '「今日みたいに、好きなことをする時間も大事ですよ。」', delta: D0, tags: ['humor'] },
    ],
  },
  {
    id: 'ace_07',
    title: '後輩への嫉妬',
    description:
      '「後輩がどんどん出世していくのを見ると…正直、焦るんです。」',
    stage: 3,
    consultCategory: 'work',
    choices: [
      { text: '「焦りは向上心の裏返しですよ。悪いことじゃない。」', delta: D0, tags: ['honesty'] },
      { text: '「人のスコアは気にしない。自分のベストを出しましょう。」', delta: D0, tags: ['bold'] },
      { text: '「その後輩、きっとあなたの背中を見て育ったんですよ。」', delta: D0, tags: ['hype'] },
    ],
  },
  {
    id: 'ace_08',
    title: '独立の夢',
    description:
      '「いつか独立したいって夢があるんです。でも家族のことを考えると…」',
    stage: 4,
    consultCategory: 'work',
    choices: [
      { text: '「夢を語れる人は、もう半分叶えてますよ。」', delta: D0, tags: ['bold'] },
      { text: '「家族を大事に思える人なら、きっとうまくいきます。」', delta: D0, tags: ['honesty'] },
      { text: '「まずは小さく始めてみませんか。一歩ずつで大丈夫です。」', delta: D0, tags: ['hype'] },
    ],
  },
  {
    id: 'ace_09',
    title: '失敗の後悔',
    description:
      '「大きなプロジェクトで失敗してしまって…まだ引きずってるんです。」',
    stage: 4,
    consultCategory: 'work',
    choices: [
      { text: '「OBを打っても、次のホールがありますよ。」', delta: D0, tags: ['humor'] },
      { text: '「失敗できるほど挑戦した、ということですよ。」', delta: D0, tags: ['bold'] },
      { text: '「引きずれるのは、本気だった証拠です。」', delta: D0, tags: ['honesty'] },
    ],
  },

  // ─── 昼休憩（stage 5） ───
  {
    id: 'ace_06',
    title: '人生の岐路',
    description:
      '「最近よく考えるんです。自分の人生、これでよかったのかなって。」',
    stage: 5,
    consultCategory: 'private',
    bestMood: true,
    choices: [
      { text: '「今日ここにいること自体が、いい人生の証拠ですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「よかったかどうかは、これから決められますよ。」', delta: D0, tags: ['bold'] },
      { text: '「ビール飲みながら考えましょう。急がなくていい。」', delta: D0, tags: ['humor'] },
    ],
  },

  // ─── 後半（stage 6-9）：プライベートの悩み ───
  {
    id: 'ace_10',
    title: '親の介護',
    description:
      '「親の介護が始まりそうで…仕事との両立ができるか不安です。」',
    stage: 6,
    consultCategory: 'private',
    choices: [
      { text: '「一人で抱えなくていいんですよ。頼れる人を探しましょう。」', delta: D0, tags: ['honesty'] },
      { text: '「不安な時こそ、こうして話すのが大事です。」', delta: D0, tags: ['silence'] },
      { text: '「完璧じゃなくていい。できる範囲でいいんです。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_11',
    title: '子どもの進路',
    description:
      '「子どもが進路で悩んでいて…親としてどうアドバイスすべきか…」',
    stage: 6,
    consultCategory: 'private',
    choices: [
      { text: '「見守るのも立派なアドバイスですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「お子さんの話を、まず聞いてあげてください。」', delta: D0, tags: ['silence'] },
      { text: '「親が楽しそうに生きてる姿が、一番の道標ですよ。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_12',
    title: '友人の疎遠',
    description:
      '「学生時代の友人と疎遠になってきて…寂しいなって思うことがあります。」',
    stage: 7,
    consultCategory: 'private',
    choices: [
      { text: '「連絡してみたらどうですか。きっと喜びますよ。」', delta: D0, tags: ['honesty'] },
      { text: '「今日みたいに新しい出会いもありますよ。」', delta: D0, tags: ['humor'] },
      { text: '「離れていても、大事な人は大事なままですよ。」', delta: D0, tags: ['hype'] },
    ],
  },
  {
    id: 'ace_13',
    title: '健康の不安',
    description:
      '「健康診断で引っかかってしまって…年齢には勝てないですね。」',
    stage: 7,
    consultCategory: 'private',
    choices: [
      { text: '「ゴルフしてるだけ、十分健康的ですよ。」', delta: D0, tags: ['humor'] },
      { text: '「気づけたことが大事です。これからケアしましょう。」', delta: D0, tags: ['honesty'] },
      { text: '「僕も同じですよ。一緒に健康になりましょう。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_14',
    title: '夫婦の距離',
    description:
      '「最近、妻との会話が減ってきて…何を話せばいいのか分からなくなって。」',
    stage: 8,
    consultCategory: 'private',
    bestMood: true,
    choices: [
      { text: '「話すことがなくても、一緒にいることが大事ですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「奥様をゴルフに誘ってみては？共通の趣味は距離を縮めます。」', delta: D0, tags: ['humor'] },
      { text: '「ありがとう、を伝えるだけで変わりますよ。」', delta: D0, tags: ['hype'] },
    ],
  },
  {
    id: 'ace_15',
    title: '趣味の時間',
    description:
      '「忙しすぎて、好きなことをする時間がなくて…ゴルフも久しぶりなんです。」',
    stage: 8,
    consultCategory: 'private',
    choices: [
      { text: '「来てくれたじゃないですか。それが大事な一歩ですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「好きなことをする時間は、自分で守らないとですね。」', delta: D0, tags: ['bold'] },
      { text: '「また一緒に来ましょう。約束ですよ。」', delta: D0, tags: ['silence'] },
    ],
  },
  {
    id: 'ace_16',
    title: '孤独感',
    description:
      '「周りに人はいるのに…なんだか孤独を感じることがあるんです。」',
    stage: 9,
    consultCategory: 'private',
    choices: [
      { text: '「今日、こうして話してくれて嬉しいですよ。」', delta: D0, tags: ['honesty'] },
      { text: '「孤独を感じられる人は、人との繋がりを大事にできる人です。」', delta: D0, tags: ['bold'] },
      { text: '「少なくとも僕は、あなたのことを大事に思ってますよ。」', delta: D0, tags: ['hype'] },
    ],
  },
  {
    id: 'ace_17',
    title: '老後の不安',
    description:
      '「定年後のこと、考え始めると不安になるんです。何をすればいいのか…」',
    stage: 9,
    consultCategory: 'private',
    choices: [
      { text: '「ゴルフがあるじゃないですか。一生の趣味ですよ。」', delta: D0, tags: ['humor'] },
      { text: '「不安は備えのチャンスです。今から少しずつ考えましょう。」', delta: D0, tags: ['honesty'] },
      { text: '「その時が来たら、また相談してください。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_18',
    title: '感謝の言葉',
    description:
      '「こうやって話を聞いてもらえるだけで…ありがたいです。」',
    stage: 9,
    consultCategory: 'private',
    choices: [
      { text: '「こちらこそ。いい時間をありがとうございます。」', delta: D0, tags: ['honesty'] },
      { text: '「いつでも声をかけてください。ゴルフのついでに。」', delta: D0, tags: ['humor'] },
      { text: '「話してくれる人がいることが、僕の幸せです。」', delta: D0, tags: ['bold'] },
    ],
  },
  {
    id: 'ace_19',
    title: '夕暮れの振り返り',
    description:
      '「今日一日、いろいろ話しましたね…心が軽くなった気がします。」',
    stage: 9,
    consultCategory: 'private',
    choices: [
      { text: '「ゴルフは不思議ですね。心まで整う。」', delta: D0, tags: ['honesty'] },
      { text: '「いい一日でした。スコアよりずっと大事な一日です。」', delta: D0, tags: ['bold'] },
      { text: '「また来ましょう。話はまだまだありますよ。」', delta: D0, tags: ['humor'] },
    ],
  },
  {
    id: 'ace_20',
    title: '別れ際の約束',
    description:
      '「また…こうして一緒にラウンドしてもらえますか？」',
    stage: 9,
    consultCategory: 'private',
    bestMood: true,
    choices: [
      { text: '「もちろんです。いつでも声をかけてください。」', delta: D0, tags: ['honesty'] },
      { text: '「来年も、再来年も。約束ですよ。」', delta: D0, tags: ['bold'] },
      { text: '「あなたとのラウンドは、僕にとっても特別な時間です。」', delta: D0, tags: ['hype'] },
    ],
  },
];
