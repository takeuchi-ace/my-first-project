import { GameEvent } from '../types';

/**
 * 女性キャラ専用イベント（20本）
 *
 * - 女性キャラ（gender: 'female'）とのラウンドで30%の確率で出現
 * - カテゴリ：距離感・仕事観・空気・信頼・孤独
 *
 * 【口調の設計】
 * 旧版は20件すべてが「A:媚び / B:誠実 / C:共感 / D:ズレ」の同一骨格で、
 * 誠実系の素の delta が trust +6〜8 と突出していた。結果、女性4人 × 20件 =
 * 80回の遭遇すべてで「誠実な方」が正解になり、文面を読まずに口調だけで解けた。
 * 千鶴（老舗料亭女将）・桐生（マーケター）・早瀬（税理士）・ミツキ（美容経営）
 * という別人4人が、完全に同じ反応を返していた。
 *
 * 誠実さは正解のままにしつつ、その中身を割った。判定は素の delta ではなく
 * タグ（＝キャラの好み）が決める。素の値は口調ごとにほぼ揃えてある。
 *
 *   礼儀 etiquette … 千鶴 etiquette{t6,f2} が刺さる（彼女の最強反応）
 *   論理 logic     … 早瀬 logic{t5,f3} が刺さる
 *   ノリ humor     … ミツキ humor{f6,t3} が刺さる（彼女の最強反応）
 *   誠実 honesty   … 千鶴・桐生・早瀬に効く。ミツキには届かない
 *   共感 ethics    … 無難。誰にも刺さらないが誰も傷つけない
 *   媚び flattery  … 千鶴だけ flattery{f3,t2} を持つので致命傷にならない
 *   絶賛 over_praise / 踏込 bold … 外し
 *
 * 4件の構成をローテーションさせ、どの口調も4人全員には刺さらないようにしてある。
 *   A型 礼儀/論理/ノリ/媚び … 千鶴・早瀬・ミツキに正解あり（桐生は無難止まり）
 *   B型 誠実/礼儀/ノリ/絶賛 … 4人とも正解あり
 *   C型 誠実/論理/共感/媚び … 千鶴・桐生・早瀬に正解あり（ミツキは無難止まり）
 *   D型 ノリ/共感/礼儀/踏込 … 千鶴・ミツキに正解あり（桐生・早瀬は被害を抑える局面）
 *
 * 結果、4人の最良手が全員一致するのは 20件中2件（旧版は20件中20件）。
 * 残る2件は早瀬で誠実と論理がほぼ同点になるケースで、どちらを選んでも good。
 */
export const femaleEvents: GameEvent[] = [
  // ===== 1 [B] 相談相手の不在 =====
  {
    id: 'female_1',
    title: '相談相手の不在',
    description: '「女性経営者って相談相手少ないんですよね。」とふと漏らす。',
    stage: 0,
    choices: [
      { text: '「差し支えのない範囲で、伺うだけならできます」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「代わりになれるとは言えませんが、話は聞けます」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「では今日一日、相談役として雇われておきます」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「○○さんほどの方に釣り合う相談相手なんていませんよ！」', delta: { trust: -2, fun: 3, creep: 7, focus: 0 }, tags: ['over_praise'] },
    ],
  },

  // ===== 2 [A] 可愛げないと言われて =====
  {
    id: 'female_2',
    title: '可愛げないと言われて',
    description: '「可愛げないって言われるんです。」と苦笑する。',
    stage: 0,
    choices: [
      { text: '「言った方の物差しの話ですね。私は伺った通りに受け取ります」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「可愛げの有無で仕事の成果は変わらないと思いますが」', delta: { trust: 2, fun: 1, creep: 0, focus: 3 }, tags: ['logic'] },
      { text: '「では今日は私が可愛げ担当をやります」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「そんなことないですよ、十分お可愛らしいです」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 3 [C] 接待の本音 =====
  {
    id: 'female_3',
    title: '接待の本音',
    description: '「接待って、だいたい分かりますよ？」と鋭い目で笑う。',
    stage: 0,
    choices: [
      { text: '「…正直、半分は仕事です」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「分かった上で付き合っていただいてる、ということですよね」', delta: { trust: 4, fun: 1, creep: 0, focus: 5 }, tags: ['logic'] },
      { text: '「見透かされる側は、なかなか居心地が悪いものです」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「いやいや、今日は純粋に楽しんでいるだけです」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 4 [B] 決断の孤独 =====
  {
    id: 'female_4',
    title: '決断の孤独',
    description: '「決断って孤独ですよね。」と遠くを見つめる。',
    stage: 0,
    choices: [
      { text: '「背負う量が違いますから、軽々には言えません」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「その一言だけ伺っておきます。踏み込みはしません」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「今日のパットは全部おひとりで決めていただきますが」', delta: { trust: 2, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「○○さんの判断は絶対に正しいですよ！」', delta: { trust: -2, fun: 3, creep: 7, focus: 0 }, tags: ['over_praise'] },
    ],
  },

  // ===== 5 [B] 距離感の話 =====
  {
    id: 'female_5',
    title: '距離感の話',
    description: '「距離近い人、苦手なんです。」と率直に言う。',
    stage: 0,
    choices: [
      { text: '「承知しました。今の距離のままいきます」', delta: { trust: 3, fun: 1, creep: 0, focus: 3 }, tags: ['etiquette'] },
      { text: '「近いと思ったら、その場で言ってください」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「では1ホールぶん空けて歩きます」', delta: { trust: 2, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「自分は絶対に大丈夫ですから、安心してください！」', delta: { trust: -2, fun: 2, creep: 7, focus: 0 }, tags: ['over_praise'] },
    ],
  },

  // ===== 6 [A] 数字と感情 =====
  {
    id: 'female_6',
    title: '数字と感情',
    description: '「数字と感情、どっち信じます？」と聞いてくる。',
    stage: 0,
    choices: [
      { text: '「判断は数字で、責任の取り方は感情の側だと思います」', delta: { trust: 2, fun: 1, creep: 0, focus: 4 }, tags: ['logic'] },
      { text: '「先に○○さんのお考えを伺ってもいいですか」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「今日のスコアは感情で書いていいですか」', delta: { trust: 2, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「もちろん○○さんの感情の方です」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 7 [D] 服装の話 =====
  {
    id: 'female_7',
    title: '服装の話',
    description: '「今日の服、攻めすぎました？」と笑いながら聞く。',
    stage: 0,
    choices: [
      { text: '「攻めた方が飛ぶと聞いたことがあります」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「気になるなら、それは攻めてるということですよね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「立ち入った感想は控えますが、良いと思います」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「攻めるならもう一段いってよかったのでは」', delta: { trust: 1, fun: 2, creep: 4, focus: 0 }, tags: ['bold'] },
    ],
  },

  // ===== 8 [D] ゴルフ以外の趣味 =====
  {
    id: 'female_8',
    title: 'ゴルフ以外の趣味',
    description: '「実はゴルフより旅行の方が好きなんです。」と打ち明ける。',
    stage: 0,
    choices: [
      { text: '「今日は移動距離の長いコースなので旅行に近いです」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「打ち明けていただけるなら、そちらの話も伺いたいです」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「では旅行の話を伺いながら回りましょう」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「好きじゃないなら、なぜ今日いらしたんですか」', delta: { trust: 1, fun: 2, creep: 4, focus: 0 }, tags: ['bold'] },
    ],
  },

  // ===== 9 [A] 海の話 =====
  {
    id: 'female_9',
    title: '海の話',
    description: 'コースから海が見える。「海見ると落ち着くんですよね。」と呟く。',
    stage: 0,
    choices: [
      { text: '「では少しだけ、ここで止まりましょうか」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「この時間の逆光だと、あと20分は綺麗に見えますね」', delta: { trust: 2, fun: 1, creep: 0, focus: 3 }, tags: ['logic'] },
      { text: '「落ち着きすぎて次の一打が入らなくなりますよ」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「今度、海辺のコースをこちらで押さえておきますね」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 10 [C] 約束と結果 =====
  {
    id: 'female_10',
    title: '約束と結果',
    description: '「約束と結果、どっち重視？」と真剣に聞く。',
    stage: 0,
    choices: [
      { text: '「約束が先です。守れないときは早めに言います」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「約束を守れる範囲でしか請けない、が正確なところです」', delta: { trust: 4, fun: 1, creep: 0, focus: 5 }, tags: ['logic'] },
      { text: '「両方求められる立場は、しんどいですよね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「○○さんが大事にされる方で構いません」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 11 [C] 信頼の定義 =====
  {
    id: 'female_11',
    title: '信頼の定義',
    description: '「信頼って何だと思います？」と静かに問う。',
    stage: 0,
    choices: [
      { text: '「言ったことと、やったことが揃っているかどうかです」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「裏切られる余地を残したまま任せられるか、でしょうか」', delta: { trust: 4, fun: 1, creep: 0, focus: 5 }, tags: ['logic'] },
      { text: '「時間をかけないと分からないもの、という気はします」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「○○さんのような方を信じることだと思います」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 12 [D] 尊敬と恐怖 =====
  {
    id: 'female_12',
    title: '尊敬と恐怖',
    description: '「尊敬って怖さと紙一重ですよね。」と意味深に笑う。',
    stage: 0,
    choices: [
      { text: '「今そう言われた時点で、少し怖いです」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「怖がられる側にも、しんどさはありそうですね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「軽く受け止める話ではなさそうなので、伺っておきます」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「怖がらせている自覚はおありなんですね」', delta: { trust: 1, fun: 2, creep: 4, focus: 0 }, tags: ['bold'] },
    ],
  },

  // ===== 13 [B] 集中力の波 =====
  {
    id: 'female_13',
    title: '集中力の波',
    description: '「今日は集中できてないかも。」とクラブを握り直す。',
    stage: 0,
    choices: [
      { text: '「急かさないので、間を取ってから打ってください」', delta: { trust: 3, fun: 1, creep: 0, focus: 3 }, tags: ['etiquette'] },
      { text: '「私も同じです。お互い期待値は下げていきましょう」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「集中できていない同士、いい勝負になりますね」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「○○さんの集中力が切れるところなんて見たことないです！」', delta: { trust: -2, fun: 3, creep: 7, focus: 0 }, tags: ['over_praise'] },
    ],
  },

  // ===== 14 [A] 年齢と武器 =====
  {
    id: 'female_14',
    title: '年齢と武器',
    description: '「年齢って武器になりますか？」と真面目に聞く。',
    stage: 0,
    choices: [
      { text: '「伺い方によっては失礼になる話なので、慎重に答えます」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「年齢そのものではなく、積んだ回数が武器になります」', delta: { trust: 2, fun: 1, creep: 0, focus: 4 }, tags: ['logic'] },
      { text: '「私は年齢だけが武器なので、他が何もありません」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「そもそも全然お若く見えますよ」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 15 [C] 気遣い不要宣言 =====
  {
    id: 'female_15',
    title: '気遣い不要宣言',
    description: '「私、気遣われるの嫌いなんです。」と真っ直ぐ言う。',
    stage: 0,
    choices: [
      { text: '「了解です。以降は対等でいきます」', delta: { trust: 3, fun: 2, creep: 0, focus: 2 }, tags: ['honesty', 'sportsmanship'] },
      { text: '「では今の一言も気遣いに入るので、取り消しますね」', delta: { trust: 4, fun: 1, creep: 0, focus: 5 }, tags: ['logic'] },
      { text: '「気遣われる側も疲れますよね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「自分は気遣いなんてしてないですよ、素のままです」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 16 [D] ライバル論 =====
  {
    id: 'female_16',
    title: 'ライバル論',
    description: '「ライバルって必要ですか？」と考え込む。',
    stage: 0,
    choices: [
      { text: '「今日のところは私が務めますが、力不足ですね」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「いると焦りますし、いないと緩みますし、難しいですね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「立場によって変わる話なので、○○さんの側で伺います」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「必要かを聞く時点で、もういないんですよね」', delta: { trust: 1, fun: 2, creep: 4, focus: 0 }, tags: ['bold'] },
    ],
  },

  // ===== 17 [B] 焦りを見抜かれる =====
  {
    id: 'female_17',
    title: '焦りを見抜かれる',
    description: '「今、ちょっと焦りましたよね？」と鋭く指摘する。',
    stage: 0,
    choices: [
      { text: '「…焦りました。よく見ていらっしゃいますね」', delta: { trust: 4, fun: 2, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「見えていた前提で、改めて構え直します」', delta: { trust: 3, fun: 1, creep: 0, focus: 3 }, tags: ['etiquette'] },
      { text: '「顔に出ないよう10年練習してきたんですが」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「○○さんの観察眼は本当に人間離れしてますね！」', delta: { trust: -2, fun: 3, creep: 7, focus: 0 }, tags: ['over_praise'] },
    ],
  },

  // ===== 18 [A] 自然体の大切さ =====
  {
    id: 'female_18',
    title: '自然体の大切さ',
    description: '「自然体って大事ですよね。」と穏やかに言う。',
    stage: 0,
    choices: [
      { text: '「無理をしない間合いで進めましょう」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「自然体を意識した時点で自然体ではない、が難しいところで」', delta: { trust: 2, fun: 1, creep: 0, focus: 4 }, tags: ['logic'] },
      { text: '「では自然体で3打ほど叩かせていただきます」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「○○さんはいつも自然体で素敵です」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 19 [C] 素の会話 =====
  {
    id: 'female_19',
    title: '素の会話',
    description: '「今日は素で話せました。」と嬉しそうに微笑む。',
    stage: 0,
    choices: [
      { text: '「こちらこそ、取り繕わずに済みました」', delta: { trust: 3, fun: 2, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「素で話せた日は、だいたい話した中身も残りますね」', delta: { trust: 4, fun: 1, creep: 0, focus: 5 }, tags: ['logic'] },
      { text: '「素で話せる相手って、そう多くはないですよね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「○○さんとご一緒できたおかげです」', delta: { trust: -1, fun: 2, creep: 5, focus: 0 }, tags: ['flattery'] },
    ],
  },

  // ===== 20 [D] 楽しむ才能 =====
  {
    id: 'female_20',
    title: '楽しむ才能',
    description: '「楽しいって才能ですよね。」と笑いながら言う。',
    stage: 0,
    choices: [
      { text: '「その才能、今日はこちらにも分けてください」', delta: { trust: 3, fun: 5, creep: 0, focus: 0 }, tags: ['humor'] },
      { text: '「楽しめる人の方が、結局は長く続きますよね」', delta: { trust: 2, fun: 2, creep: 0, focus: 2 }, tags: ['ethics'] },
      { text: '「そう仰る方とご一緒できるのは、こちらの得です」', delta: { trust: 3, fun: 1, creep: 0, focus: 2 }, tags: ['etiquette'] },
      { text: '「楽しいだけで乗り切れる立場ではないですよね」', delta: { trust: 1, fun: 2, creep: 4, focus: 0 }, tags: ['bold'] },
    ],
  },
];
