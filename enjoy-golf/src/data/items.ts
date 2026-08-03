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
 *  - **こちらが弱っているときに気づかって渡される**（摩耗・振るわないスコア）
 *
 * ## 相手ごとに2つ
 *
 * 1人1つだと、その相手で狙う対象が1回で終わる。
 * 2つ目は「接待に使えそうな実用品」と「クスっと笑えるもの」に寄せて、
 * 1つ目（気に入られて渡される品）と質を変えている。
 *
 * ## いまは集めるだけ
 *
 * 効果は持たせていない。ただし `slot` を先に持たせてあるので、
 * 後から「1枠だけ持っていける」を足すときにデータを作り直さずに済む。
 *
 * ## ヒントは「道具の気配＋ぼんやりした方向」で書く
 *
 * 条件を隠したままだと運で集まるだけになる。かといって達成条件を
 * そのまま書くと、探す楽しみが消えて条件の一覧表になる。
 * `hint` は「どんな道具か」を主にして、そこへ向かう方向だけを
 * ぼんやり添える（数値・回数・イベント名は書かない）。
 */

import { CharacterId, RoundMoodId, StrategyId, Tag } from '../types';

/** 道具の置き場所。効果を足すときの枠。いまは分類の意味しか持たない */
export type ItemSlot = 'bag' | 'wear' | 'green' | 'pocket';

export type ItemCondition =
  /** 接待スコア（0〜100の内部評価。ゴルフの打数ではない）が min 以上。契約の成否は問わない */
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
  /** creep をほとんど稼がずに契約成立（距離を詰めすぎない。取ることは見ていない） */
  | { kind: 'lowCreep'; max: number }
  /** 集めた名言が min 個以上（銀座だけが見る条件） */
  | { kind: 'quotes'; min: number }
  /**
   * 接待スコア（0〜100の内部評価。ゴルフの打数ではない）が max 以下。契約の成否は問わない。
   *
   * 「うまくやった褒美」だけだと、下手な日に何も起きない。
   * 振るわなかった日に持たせてくれるものがあると、負けた回にも持ち帰りが出る。
   */
  | { kind: 'scoreMax'; max: number }
  /**
   * ラウンドを終えた時点の摩耗が min 以上（契約の成否は問わない）。
   *
   * 摩耗は数字では見せていないので、ヒントは内なる声が出るころ、という言い方にする。
   * 気づかって渡されるものなので契約成立は要らない。
   */
  | { kind: 'wear'; min: number }
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
    hint: '角の丸くなった小さな金物。よほど気に入られた日に。',
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
    hint: '短いのに重い。雨が降り出した場面での一言で。',
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
    hint: '真顔では被せられない配色。笑わせに行くと。',
    slot: 'bag',
    condition: { kind: 'strategy', strategyId: 'laugh' },
  },
  {
    id: 'item_kuroda',
    from: 4,
    name: '削られたパターグリップ',
    desc: '自分の手に合わせて削ったもの。代わりは無い。',
    line: '…要るなら持っていけ。',
    hint: '手に馴染みきった握り。気に入られた日に。',
    slot: 'green',
    condition: { kind: 'score', min: 90 },
  },
  {
    id: 'item_smith',
    from: 5,
    name: 'ルールブック（英語版）',
    desc: '付箋が何十枚も貼られている。',
    line: 'Fair play makes a great game. これはあなたに。',
    hint: '付箋だらけの一冊。球を見失った場面の振る舞いで。',
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
    hint: '毎日ちがう言葉が書いてある紙。気に入られた日に。',
    slot: 'pocket',
    condition: { kind: 'score', min: 88 },
  },
  {
    id: 'item_iwao',
    from: 7,
    name: '古いグリーンフォーク',
    desc: '真鍮に家紋が入っている。',
    line: 'コースへの感謝を忘れんことだ。持っておけ。',
    hint: '家紋入りの真鍮。芝を直したあとの一言で。',
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
    hint: '型は古いが狂いのない計器。理屈で押し通すと。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'logic', count: 5 },
  },
  {
    id: 'item_sato',
    from: 9,
    name: '使い込んだスコアカードホルダー',
    desc: '革が手の形に沈んでいる。',
    line: '今の、本音だったな。持っていけよ。',
    hint: '革が手の形に沈んだ入れもの。地雷を踏まずに終えると。',
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
    hint: '頼まれてもいないのに持ち歩いていたもの。よほど怒らせると。',
    slot: 'pocket',
    condition: { kind: 'enrage', count: 3 },
  },
  {
    id: 'item_daimon',
    from: 11,
    name: '名刺入れ（黒革）',
    desc: '中身は空。渡すために空にしてある。',
    line: '君は分かる側だな。これを持っていけ。',
    hint: '渡すために空にしてある入れもの。踏み込み続けると。',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'bold', count: 4 },
  },
  {
    id: 'item_hoshino',
    from: 12,
    name: '派手なサングラス',
    desc: 'ミラーレンズ。屋内では完全に見えない。',
    line: 'それ映えるよ！はい、あげる！',
    hint: '屋内では何も見えない代物。相手の機嫌が良い日に。',
    slot: 'wear',
    condition: { kind: 'mood', moodId: 'fine' },
  },
  {
    id: 'item_kinjo',
    from: 13,
    name: '銀のスキットル',
    desc: '空だが酒の匂いが残っている。',
    line: '攻めたやつにはこれや。持っていけ。',
    hint: '酒の匂いだけが残る銀の容器。攻めに出ると。',
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
    hint: '几帳面に補充された箱。距離を詰めずに。',
    slot: 'bag',
    condition: { kind: 'lowCreep', max: 12 },
  },
  {
    id: 'item_chizuru',
    from: 15,
    name: '藍染めのタオル',
    desc: '料亭の名が小さく染め抜かれている。',
    line: 'よろしければ、お使いくださいまし。',
    hint: '料亭の名が染め抜かれた布。よほど気に入られた日に。',
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
    hint: '創業から使い続けている一本。言葉がだいぶ集まってから、また訪ねると。',
    slot: 'green',
    condition: { kind: 'quotes', min: 12 },
  },
  {
    id: 'item_shinohara',
    from: 17,
    name: '自作のスコア管理アプリの招待コード',
    desc: '紙に手書きされている。',
    line: '面白い打ち方でしたね。これ、使ってみてください。',
    hint: '紙に手書きされた符号。文句なく気に入られた日に。',
    slot: 'pocket',
    condition: { kind: 'score', min: 96 },
  },
  {
    id: 'item_kiryu',
    from: 18,
    name: '一枚だけのメモ用紙',
    desc: '「嘘は数字に出る」と書いてある。',
    line: '正直でしたね。持っていってください。',
    hint: '「嘘は数字に出る」と書かれた紙。最後の一打を決めて、地雷も踏まずに。',
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
    hint: '一本ずつ形の違う木の小物。正直に押して、地雷も踏まずに。',
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
    hint: 'ラウンド前の確認事項が並んだ一枚。朝イチを完璧に決めて、気に入られると。',
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
    hint: '中身を教えてくれない手縫いのもの。よほど怒らせると。',
    slot: 'pocket',
    condition: { kind: 'enrage', count: 3 },
  },

  // ===== 2つ目 =====
  // 実用品（接待に持っていけるもの）と、クスっと笑えるもの。
  // 1つ目と条件が重ならないようにしてある（同じ条件だと2つ同時に落ちて謎にならない）
  {
    id: 'item_tanaka_2',
    from: 1,
    name: '折りたたみ傘（銀行のロゴ入り）',
    desc: 'ロゴが大きすぎて、傘の柄に見えない。',
    line: '置き傘です。ロゴは、まあ、我慢してください。',
    hint: 'ロゴが大きすぎる雨具。礼を通し続けると。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'etiquette', count: 4 },
  },
  {
    id: 'item_onizuka_2',
    from: 2,
    name: '「必勝」の鉢巻',
    desc: '汗染みが輪になって残っている。',
    line: '巻け。気合が足りん。',
    hint: '汗染みが輪になって残った布。気合を通すと。',
    slot: 'wear',
    condition: { kind: 'tagCount', tag: 'kiai', count: 2 },
  },
  {
    id: 'item_bocchan_2',
    from: 3,
    name: '未開封の高級ドライバー',
    desc: '箱も開いていない。値札が付いたまま。',
    line: 'もらったんだけど、僕には振れなくてさ。あげる。',
    hint: '一度も振られていない道具。もてなしが空回りした日に。',
    slot: 'bag',
    condition: { kind: 'scoreMax', max: 60 },
  },
  {
    id: 'item_kuroda_2',
    from: 4,
    name: 'サインを頼んだボール',
    desc: '「…」だけが書かれている。',
    line: '…書くことがない。',
    hint: '頼んで書いてもらった球。地雷を踏まずに終えると。',
    slot: 'pocket',
    condition: { kind: 'noHates' },
  },
  {
    id: 'item_smith_2',
    from: 5,
    name: 'ウェットティッシュ（社名入り）',
    desc: '一箱まるごと。展示会の残りらしい。',
    line: 'Hygiene first. お持ちください。',
    hint: '展示会の残りらしい一箱。正直に押し通すと。',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'honesty', count: 6 },
  },
  {
    id: 'item_mitsuyama_2',
    from: 6,
    name: '冷感タオル',
    desc: '「ととのう」と刺繍されている。',
    line: '熱くなったら、これで整えましょう！',
    hint: '刺繍の入った布。場を盛り上げ続けると。',
    slot: 'wear',
    condition: { kind: 'tagCount', tag: 'hype', count: 4 },
  },
  {
    id: 'item_iwao_2',
    from: 7,
    name: '替えのスパイク鋲',
    desc: '小さな缶に入っている。工具も一緒。',
    line: '足元が決まらんと、スイングも決まらん。',
    hint: '工具まで入った小さな缶。礼を通し続けると。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'etiquette', count: 6 },
  },
  {
    id: 'item_nakamura_2',
    from: 8,
    name: 'モバイルバッテリー',
    desc: '残量が数字で出る。二台まで同時に充電できる。',
    line: '電源は前提条件です。どうぞ。',
    // ①が「理屈5回」なので、回数で刻むと必ず両方同時に落ちる（4は5に含まれる）。
    // 別の軸にする
    hint: '数字が出る箱。仕組みの話で最適な答えを選ぶと。',
    slot: 'bag',
    condition: {
      kind: 'choice',
      eventId: 'char_8_3',
      textIncludes: '最適解',
    },
  },
  {
    id: 'item_sato_2',
    from: 9,
    name: '虫よけスプレー',
    desc: '半分ほど使ってある。',
    line: '夏場は要りますよ。半分使ってますけど。',
    hint: '半分ほど使ってある噴霧器。正直に押し通すと。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'honesty', count: 6 },
  },
  {
    id: 'item_matsumoto_2',
    from: 10,
    name: '「ナイスショット！」のタオル',
    desc: '刺繍が金糸。使うのがためらわれる。',
    line: 'その一打、額に入れたいくらいです！',
    hint: '金糸の刺繍で使うのがためらわれる布。よほど気に入られた日に。',
    slot: 'wear',
    condition: { kind: 'score', min: 92 },
  },
  {
    id: 'item_daimon_2',
    from: 11,
    name: '宛名のない紹介状',
    desc: '封も糊付けされていない。',
    line: '名前は、君が入れればいい。',
    // ①が「踏み込み4回」なので、6回にすると必ず両方同時に落ちる。別の軸にする
    hint: '封も糊付けされていない書状。立ち位置を問われたときの答えで。',
    slot: 'pocket',
    condition: {
      kind: 'choice',
      eventId: 'char_11_1',
      textIncludes: '自分は自分のスタンス',
    },
  },
  {
    id: 'item_hoshino_2',
    from: 12,
    name: '色紙',
    desc: 'サインが崩れすぎて誰のか読めない。',
    line: 'すごい人のだから。たぶん。',
    hint: '誰のか読めない署名。笑わせ続けると。',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'humor', count: 5 },
  },
  {
    id: 'item_kinjo_2',
    from: 13,
    name: '胃薬（大瓶）',
    desc: '減り方を見るに、常用されている。',
    line: '攻めた後はこれや。効くで。',
    hint: '減り方を見るに常用されている薬。踏み込み続けると。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'bold', count: 5 },
  },
  {
    id: 'item_shiraishi_2',
    from: 14,
    name: '塩キャンディー',
    desc: '熱中症対策用。個包装で20粒ほど。',
    line: '無理は美徳じゃありません。舐めておいてください。',
    hint: '熱中症対策の粒。すり減った体で回り切ると。',
    slot: 'pocket',
    condition: { kind: 'wear', min: 25 },
  },
  {
    id: 'item_chizuru_2',
    from: 15,
    name: '貼るホッカイロ',
    desc: '料亭の名が入った紙袋にまとめて入っている。',
    line: 'お寒いでしょう。お背中にお貼りなさい。',
    hint: '料亭の紙袋にまとめられた温かいもの。もてなしが空回りした日に。',
    slot: 'wear',
    condition: { kind: 'scoreMax', max: 60 },
  },
  {
    id: 'item_ginza_2',
    from: 16,
    name: '事務所のロゴ入りボールペン',
    desc: 'インクが出ない。ロゴだけがきれい。',
    line: 'あ、それ書けないんですけど、記念にどうぞ。',
    hint: 'ロゴだけがきれいな筆記具。言葉が少し集まったころ、また訪ねると。',
    slot: 'pocket',
    condition: { kind: 'quotes', min: 6 },
  },
  {
    id: 'item_shinohara_2',
    from: 17,
    name: 'AI解析の結果',
    desc: 'A4一枚に「個性的」とだけ出力されている。',
    line: 'うちのAI、これしか言わなくて。額に入れてください。',
    hint: '解析にかけた結果の紙。笑わせ続けると。',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'humor', count: 4 },
  },
  {
    id: 'item_kiryu_2',
    from: 18,
    name: 'ラミネートされた投稿',
    desc: '本人が撮ったスクリーンショット。数字に丸が付いている。',
    line: 'これ12万いきました。差し上げます。',
    hint: '本人が撮った画面の写し。笑わせに行くと。',
    slot: 'pocket',
    condition: { kind: 'tagCount', tag: 'humor', count: 3 },
  },
  {
    id: 'item_takamiya_2',
    from: 19,
    name: 'テーピングテープ',
    desc: '工場の備品。品番のシールが貼ってある。',
    line: '巻き方は覚えておくといい。',
    hint: '品番シールの付いた工場の備品。公正に押し通すと。',
    slot: 'bag',
    condition: { kind: 'tagCount', tag: 'sportsmanship', count: 3 },
  },
  {
    id: 'item_hayase_2',
    from: 20,
    name: '領収書ホルダー',
    desc: '仕切りに「交際費」「会議費」と手書きされている。',
    line: '経費で落ちるものだけ入れてください。',
    // 地雷（媚び・煽り）だけだと踏まずに終わる率が高く、狙わなくても41%出た。
    // 好みの理屈を重ねる
    hint: '仕切りに手書きのある入れもの。理屈で押して、地雷も踏まずに。',
    slot: 'bag',
    condition: {
      kind: 'all',
      of: [{ kind: 'noHates' }, { kind: 'tagCount', tag: 'logic', count: 3 }],
    },
  },
  {
    id: 'item_mitsuki_2',
    from: 21,
    name: '小顔ローラー',
    desc: 'ゴルフとは何の関係もない。',
    line: '顔、疲れてるよ。転がしといて〜。',
    hint: 'ゴルフとは何の関係もない道具。怒らせた上に、もてなしも空回りした日に。',
    slot: 'pocket',
    condition: {
      kind: 'all',
      of: [{ kind: 'enrage', count: 1 }, { kind: 'scoreMax', max: 70 }],
    },
  },
];

export const itemsByCharacter = (charId: CharacterId): GiftItem[] =>
  giftItems.filter((i) => i.from === charId);

export const getItem = (id: string): GiftItem | null =>
  giftItems.find((i) => i.id === id) ?? null;

export const GIFT_ITEM_TOTAL = giftItems.length;
