/**
 * もらいもの — 相手ごとの条件を満たすと渡される道具
 *
 * ## なぜ条件をキャラごとに変えるか
 *
 * 「S以上で契約成立」のような一律の条件だと簡単すぎて（実測で技能0.5で38%、
 * 0.8で69%）、初回クリアの過程で21個そろってしまい、集める意味がなくなる。
 * 相手ごとに違う条件にすれば、1つずつが小さな謎になり、
 * 「この人は何をすればくれるのか」を考える対象になる。
 *
 * 条件の質もばらす。
 *  - 気に入られて渡される（スコア・地雷を踏まない・作戦を通す）
 *  - **超怒らせて渡される**（呆れて押し付けられる／根性を買われる）
 *  - 特定の場面で特定の答えをしたとき
 *  - その日の機嫌が合ったとき
 *
 * ## いまは集めるだけ
 *
 * 効果は持たせていない。ただし `slot` を先に持たせてあるので、
 * 後から「1枠だけ持っていける」を足すときにデータを作り直さずに済む。
 *
 * ## ヒントは必ず出す
 *
 * 条件を隠したままだと運で集まるだけになる。
 * `hint` をプロフィールに出して、狙って取れるようにする。
 */

import { CharacterId, RoundMoodId, StrategyId, Tag } from '../types';

/** 道具の置き場所。効果を足すときの枠。いまは分類の意味しか持たない */
export type ItemSlot = 'bag' | 'wear' | 'green' | 'pocket';

export type ItemCondition =
  /** 接待スコアが min 以上（契約の成否は問わない） */
  | { kind: 'score'; min: number }
  /** 相手の地雷を一度も踏まずに契約成立 */
  | { kind: 'noHates' }
  /** 最悪の反応を count 回以上出す（＝超怒らせる） */
  | { kind: 'enrage'; count: number }
  /** 特定のイベントで特定の選択をする（契約の成否は問わない） */
  | { kind: 'choice'; eventId: string; textIncludes: string }
  /** その作戦を宣言して契約成立 */
  | { kind: 'strategy'; strategyId: StrategyId }
  /** その機嫌の日に契約成立 */
  | { kind: 'mood'; moodId: RoundMoodId }
  /** 最終パットを沈めて契約成立 */
  | { kind: 'puttIn' }
  /** 朝イチの自分のショットを PERFECT で決めて契約成立 */
  | { kind: 'perfectShot' }
  /** そのタグを count 回以上使って契約成立 */
  | { kind: 'tagCount'; tag: Tag; count: number }
  /** 一度も creep を稼がずに契約成立（距離を詰めも取りもしない） */
  | { kind: 'lowCreep'; max: number }
  /** 集めた名言が min 個以上（銀座だけが見る条件） */
  | { kind: 'quotes'; min: number }
  /**
   * 全部満たしたとき。
   *
   * 単独の条件だと、狙わずに打っても4割以上もらえてしまうものがあった
   * （noHates 42% / puttIn 47% / perfectShot 50%）。
   * 初回クリアの過程でそろってしまうと集める意味がないので重ねる。
   */
  | { kind: 'all'; of: ItemCondition[] };

export interface GiftItem {
  id: string;
  /** 渡してくる相手 */
  from: CharacterId;
  name: string;
  /** 道具そのものの説明 */
  desc: string;
  /** 渡すときの一言。相手の口調で書く */
  line: string;
  /** プロフィールに出す取り方のヒント */
  hint: string;
  slot: ItemSlot;
  condition: ItemCondition;
}

export const giftItems: GiftItem[] = [
  {
    id: 'item_tanaka',
    from: 1,
    name: '真鍮のボールマーカー',
    desc: '銀行の記念品。使い込まれて角が丸い。',
    line: '古いものですが、よければ使ってください。',
    hint: '嫌がることを一度もせず、スコア88以上で契約できたとき',
    slot: 'pocket',
    condition: {
      kind: 'all',
      of: [{ kind: 'noHates' }, { kind: 'score', min: 88 }],
    },
  },
  {
    id: 'item_onizuka',
    from: 2,
    name: '鉛入りの素振り棒',
    desc: '短いのに重い。振ると腕が鳴る。',
    line: '根性だけは認めてやる。持っていけ。',
    // 気合タグは全選択肢750件中5件しかなく「4回」は不可能だった（実測2%）。
    // 鬼塚らしい場面での一言に変える
    hint: '雨でも続けようと言い切ったとき',
    slot: 'bag',
    condition: {
      kind: 'choice',
      eventId: 'char_2_3',
      textIncludes: 'むしろ燃えますね',
    },
  },
  {
    id: 'item_bocchan',
    from: 3,
    name: 'ふざけた柄のヘッドカバー',
    desc: '誰も真顔では被せられない配色。',
    line: 'あはは、これ僕にはもう似合わないからあげるよ。',
    hint: '笑わせる作戦を宣言して契約できたとき',
    slot: 'bag',
    condition: { kind: 'strategy', strategyId: 'laugh' },
  },
  {
    id: 'item_kuroda',
    from: 4,
    name: '削られたパターグリップ',
    desc: '自分の手に合わせて削ったもの。代わりは無い。',
    line: '…要るなら持っていけ。',
    hint: 'スコア90以上を出したとき（契約の成否は問わない）',
    slot: 'green',
    condition: { kind: 'score', min: 90 },
  },
  {
    id: 'item_smith',
    from: 5,
    name: 'ルールブック（英語版）',
    desc: '付箋が何十枚も貼られている。',
    line: 'Fair play makes a great game. これはあなたに。',
    hint: 'ロストボールの場面で、ルール通りに促したとき',
    slot: 'pocket',
    condition: {
      kind: 'choice',
      eventId: 'char_5_3',
      textIncludes: 'ルール通り暫定球',
    },
  },
  {
    id: 'item_mitsuyama',
    from: 6,
    name: '手書きの日めくり',
    desc: '毎日ちがう前向きな言葉が書いてある。',
    line: 'この一打にも感謝です！これ、差し上げます！',
    hint: 'スコア88以上を出したとき（契約の成否は問わない）',
    slot: 'pocket',
    condition: { kind: 'score', min: 88 },
  },
  {
    id: 'item_iwao',
    from: 7,
    name: '古いグリーンフォーク',
    desc: '真鍮に家紋が入っている。',
    line: 'コースへの感謝を忘れんことだ。持っておけ。',
    hint: 'ボールマークを直して、コースへの感謝を口にしたとき',
    slot: 'green',
    condition: {
      kind: 'choice',
      eventId: 'char_7_5',
      textIncludes: 'コースへの感謝',
    },
  },
  {
    id: 'item_nakamura',
    from: 8,
    name: 'レーザー距離計',
    desc: '型は古いが精度は落ちていない。',
    line: '計測は判断の前提です。使ってください。',
    hint: '理屈で通す手を5回以上使って契約できたとき',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'logic', count: 5 },
  },
  {
    id: 'item_sato',
    from: 9,
    name: '使い込んだスコアカードホルダー',
    desc: '革が手の形に沈んでいる。',
    line: '今の、本音だったな。持っていけよ。',
    hint: '嫌がることを一度もせずに契約できたとき',
    slot: 'pocket',
    condition: { kind: 'noHates' },
  },
  {
    id: 'item_matsumoto',
    from: 10,
    name: '実況用の小さなメガホン',
    desc: '誰にも頼まれていないのに持ち歩いていたもの。',
    line: 'ナァァイス！これはもう、あなたのものです！',
    // 褒め殺し相手を怒らせ切るのは難しくない。呆れて押し付けてくる
    hint: '呆れられるほど怒らせてしまったとき（3回）',
    slot: 'pocket',
    condition: { kind: 'enrage', count: 3 },
  },
  {
    id: 'item_daimon',
    from: 11,
    name: '名刺入れ（黒革）',
    desc: '中身は空。渡すために空にしてある。',
    line: '君は分かる側だな。これを持っていけ。',
    hint: '踏み込む手を4回以上通して契約できたとき',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'bold', count: 4 },
  },
  {
    id: 'item_hoshino',
    from: 12,
    name: '派手なサングラス',
    desc: 'ミラーレンズ。屋内では完全に見えない。',
    line: 'それ映えるよ！はい、あげる！',
    hint: '上機嫌の日に契約できたとき',
    slot: 'wear',
    condition: { kind: 'mood', moodId: 'fine' },
  },
  {
    id: 'item_kinjo',
    from: 13,
    name: '銀のスキットル',
    desc: '空だが酒の匂いが残っている。',
    line: '攻めたやつにはこれや。持っていけ。',
    hint: '攻める作戦を宣言して契約できたとき',
    slot: 'pocket',
    condition: { kind: 'strategy', strategyId: 'attack' },
  },
  {
    id: 'item_shiraishi',
    from: 14,
    name: '救急セット（小）',
    desc: '中身が几帳面に補充されている。',
    line: '備えは邪魔になりませんから。お持ちください。',
    // 距離（creep）はプレイヤーに数字で見せていないので、ヒントにも数字は出さない
    hint: '馴れ馴れしい手をほとんど使わずに契約できたとき',
    slot: 'bag',
    condition: { kind: 'lowCreep', max: 12 },
  },
  {
    id: 'item_chizuru',
    from: 15,
    name: '藍染めのタオル',
    desc: '料亭の名が小さく染め抜かれている。',
    line: 'よろしければ、お使いくださいまし。',
    hint: '嫌がることを一度もせず、スコア88以上で契約できたとき',
    slot: 'wear',
    condition: {
      kind: 'all',
      of: [{ kind: 'noHates' }, { kind: 'score', min: 88 }],
    },
  },
  {
    id: 'item_ginza',
    from: 16,
    name: '一本だけのパター',
    desc: '創業のときから使っているもの。',
    line: 'これは、あなたが持っているほうがいい。',
    // 相談ラウンドの接待スコアは常に100なので、スコアでは条件にならない（実測100%）。
    // 集めた言葉の数を条件にする
    hint: 'もらった言葉が12個以上になってから、また相談したとき',
    slot: 'green',
    condition: { kind: 'quotes', min: 12 },
  },
  {
    id: 'item_shinohara',
    from: 17,
    name: '自作のスコア管理アプリの招待コード',
    desc: '紙に手書きされている。',
    line: '面白い打ち方でしたね。これ、使ってみてください。',
    hint: 'スコア96以上を出したとき（契約の成否は問わない）',
    slot: 'pocket',
    condition: { kind: 'score', min: 96 },
  },
  {
    id: 'item_kiryu',
    from: 18,
    name: '一枚だけのメモ用紙',
    desc: '「嘘は数字に出る」と書いてある。',
    line: '正直でしたね。持っていってください。',
    hint: '嫌がることを一度もせず、最終パットを沈めて契約できたとき',
    slot: 'pocket',
    condition: { kind: 'all', of: [{ kind: 'puttIn' }, { kind: 'noHates' }] },
  },
  {
    id: 'item_takamiya',
    from: 19,
    name: '木製のティー（手削り）',
    desc: '一本ずつ形が違う。',
    line: '対等に来る人は好きです。持っていってください。',
    // 佐藤と同じ noHates 一本だと条件も文面も丸かぶりになるので、
    // likesTags の honesty を足して「正直に徹して」を実際の要件にする
    hint: '正直な手を3回以上通して、嫌がることを一度もせずに契約できたとき',
    slot: 'pocket',
    condition: {
      kind: 'all',
      of: [{ kind: 'noHates' }, { kind: 'tagCount', tag: 'honesty', count: 3 }],
    },
  },
  {
    id: 'item_hayase',
    from: 20,
    name: 'A4一枚のチェックリスト',
    desc: 'ラウンド前の確認事項が20項目。',
    line: '前提が揃っている人と回るのは楽です。差し上げます。',
    hint: '朝イチの自分のショットを完璧に決め、スコア92以上で契約できたとき',
    slot: 'bag',
    condition: {
      kind: 'all',
      of: [{ kind: 'perfectShot' }, { kind: 'score', min: 92 }],
    },
  },
  {
    id: 'item_mitsuki',
    from: 21,
    name: '小さなお守り',
    desc: '手縫い。中身は聞いても教えてくれない。',
    line: 'これ持ってて〜。効くかは知らないけど！',
    // ミツキは怒らせても後で笑う相手。振り切った失敗を面白がる
    hint: '呆れられるほど怒らせてしまったとき（3回）',
    slot: 'pocket',
    condition: { kind: 'enrage', count: 3 },
  },
];

export const itemsByCharacter = (charId: CharacterId): GiftItem[] =>
  giftItems.filter((i) => i.from === charId);

export const getItem = (id: string): GiftItem | null =>
  giftItems.find((i) => i.id === id) ?? null;

export const GIFT_ITEM_TOTAL = giftItems.length;
