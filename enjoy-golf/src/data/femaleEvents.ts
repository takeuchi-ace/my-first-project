import { GameEvent } from '../types';

/**
 * 女性キャラ専用イベント（20本）
 *
 * - 女性キャラ（gender: 'female'）とのラウンドで30%の確率で出現
 * - カテゴリ：距離感・仕事観・空気・信頼・孤独
 * - 4択構造: A:媚び系 / B:誠実系 / C:共感系 / D:ズレ系
 */
export const femaleEvents: GameEvent[] = [
  // ===== 1: 女性経営者って相談相手少ないんですよね =====
  {
    id: 'female_1',
    title: '相談相手の不在',
    description: '「女性経営者って相談相手少ないんですよね。」とふと漏らす。',
    stage: 0,
    choices: [
      { text: '「自分がいつでも相談に乗りますよ！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery', 'over_support'] },
      { text: '「確かに、少数だからこそ大変ですよね」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'ethics'] },
      { text: '「わかります、孤独って辛いですよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['humor'] },
      { text: '「男性も同じですよ」', delta: { trust: -4, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 2: 可愛げないって言われるんです =====
  {
    id: 'female_2',
    title: '可愛げないと言われて',
    description: '「可愛げないって言われるんです。」と苦笑する。',
    stage: 0,
    choices: [
      { text: '「そんなことないですよ、素敵です！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery'] },
      { text: '「仕事ができる証拠じゃないですか」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「言われたら傷つきますよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「気にしなくていいんじゃないですか」', delta: { trust: -4, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 3: 接待って、だいたい分かりますよ？ =====
  {
    id: 'female_3',
    title: '接待の本音',
    description: '「接待って、だいたい分かりますよ？」と鋭い目で笑う。',
    stage: 0,
    choices: [
      { text: '「いやいや、今日は純粋に楽しんでます！」', delta: { trust: -4, fun: 2, creep: 8, focus: 0 }, tags: ['flattery', 'hype'] },
      { text: '「…正直、半分は仕事です」', delta: { trust: 8, fun: 2, creep: 0, focus: 4 }, tags: ['honesty'] },
      { text: '「鋭いですね。見透かされてます」', delta: { trust: 4, fun: 6, creep: 2, focus: 2 }, tags: ['humor'] },
      { text: '「そういうものですよね」', delta: { trust: -2, fun: -2, creep: 4, focus: 0 }, tags: ['distance', 'safe'] },
    ],
  },

  // ===== 4: 決断って孤独ですよね =====
  {
    id: 'female_4',
    title: '決断の孤独',
    description: '「決断って孤独ですよね。」と遠くを見つめる。',
    stage: 0,
    choices: [
      { text: '「大丈夫、あなたの判断は正しいです！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「責任が伴う分、重いですよね」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「自分もそう感じることがあります」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「まぁ、慣れますよ」', delta: { trust: -6, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 5: 距離近い人、苦手なんです =====
  {
    id: 'female_5',
    title: '距離感の話',
    description: '「距離近い人、苦手なんです。」と率直に言う。',
    stage: 0,
    choices: [
      { text: '「自分は違いますよ！安心してください」', delta: { trust: -4, fun: 0, creep: 8, focus: 0 }, tags: ['flattery', 'over_support'] },
      { text: '「わかりました。適度な距離を保ちますね」', delta: { trust: 8, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'distance'] },
      { text: '「自分のペースって大事ですよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「え、自分は近いですか？」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['humor'] },
    ],
  },

  // ===== 6: 数字と感情、どっち信じます？ =====
  {
    id: 'female_6',
    title: '数字と感情',
    description: '「数字と感情、どっち信じます？」と聞いてくる。',
    stage: 0,
    choices: [
      { text: '「もちろんあなたの感情を！」', delta: { trust: -4, fun: 2, creep: 8, focus: 0 }, tags: ['flattery'] },
      { text: '「場面によりますが、判断には数字が必要です」', delta: { trust: 6, fun: 2, creep: 0, focus: 6 }, tags: ['honesty', 'logic'] },
      { text: '「どちらも大事ですよね。バランスかな」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「あまり考えたことないです」', delta: { trust: -4, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 7: 今日の服、攻めすぎました？ =====
  {
    id: 'female_7',
    title: '服装の話',
    description: '「今日の服、攻めすぎました？」と笑いながら聞く。',
    stage: 0,
    choices: [
      { text: '「最高に似合ってますよ！」', delta: { trust: -2, fun: 4, creep: 6, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「ゴルフウェアとしてはいい感じですね」', delta: { trust: 4, fun: 4, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「攻めてるくらいがちょうどいいですよ」', delta: { trust: 4, fun: 6, creep: 2, focus: 0 }, tags: ['humor'] },
      { text: '「…あまり気にしたことないです」', delta: { trust: -4, fun: -4, creep: 4, focus: 0 }, tags: ['distance', 'silence'] },
    ],
  },

  // ===== 8: ゴルフより○○の方が好きなんです =====
  {
    id: 'female_8',
    title: 'ゴルフ以外の趣味',
    description: '「実はゴルフより旅行の方が好きなんです。」と打ち明ける。',
    stage: 0,
    choices: [
      { text: '「ゴルフも絶対上手くなりますよ！」', delta: { trust: -4, fun: 0, creep: 6, focus: 0 }, tags: ['flattery', 'hype'] },
      { text: '「正直でいいですね。どこが好きですか？」', delta: { trust: 6, fun: 4, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「わかります、旅行いいですよね」', delta: { trust: 4, fun: 6, creep: 2, focus: 0 }, tags: ['humor'] },
      { text: '「じゃあなぜゴルフを？」', delta: { trust: -2, fun: -2, creep: 4, focus: 2 }, tags: ['logic'] },
    ],
  },

  // ===== 9: 海見ると落ち着くんですよね =====
  {
    id: 'female_9',
    title: '海の話',
    description: 'コースから海が見える。「海見ると落ち着くんですよね。」と呟く。',
    stage: 0,
    choices: [
      { text: '「今度海辺のコースを予約しますね！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery', 'over_support'] },
      { text: '「いい景色ですよね。少し休憩しましょう」', delta: { trust: 6, fun: 4, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「わかります。自然って癒されますよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「さ、次のホール行きましょう」', delta: { trust: -4, fun: -4, creep: 4, focus: 2 }, tags: ['serious'] },
    ],
  },

  // ===== 10: 約束と結果、どっち重視？ =====
  {
    id: 'female_10',
    title: '約束と結果',
    description: '「約束と結果、どっち重視？」と真剣に聞く。',
    stage: 0,
    choices: [
      { text: '「あなたが大事にする方で！」', delta: { trust: -4, fun: 0, creep: 8, focus: 0 }, tags: ['flattery'] },
      { text: '「約束を守った上で結果を出すのが理想です」', delta: { trust: 8, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「難しい質問ですね…自分も悩みます」', delta: { trust: 4, fun: 2, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「結果がすべてでしょう」', delta: { trust: -2, fun: -2, creep: 4, focus: 2 }, tags: ['bold'] },
    ],
  },

  // ===== 11: 信頼って何だと思います？ =====
  {
    id: 'female_11',
    title: '信頼の定義',
    description: '「信頼って何だと思います？」と静かに問う。',
    stage: 0,
    choices: [
      { text: '「あなたみたいな人を信頼するってことです」', delta: { trust: -4, fun: 2, creep: 8, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「言葉と行動が一致していることだと思います」', delta: { trust: 8, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'ethics'] },
      { text: '「時間をかけて築くものですよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['serious'] },
      { text: '「考えたことないですね」', delta: { trust: -6, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 12: 尊敬って怖さと紙一重ですよね =====
  {
    id: 'female_12',
    title: '尊敬と恐怖',
    description: '「尊敬って怖さと紙一重ですよね。」と意味深に笑う。',
    stage: 0,
    choices: [
      { text: '「あなたは尊敬されてますよ！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery'] },
      { text: '「その通りだと思います。力は畏怖を伴う」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「深いですね。考えさせられます」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「怖い人って嫌じゃないですか」', delta: { trust: -4, fun: -2, creep: 4, focus: 0 }, tags: ['humor'] },
    ],
  },

  // ===== 13: 今日は集中できてないかも =====
  {
    id: 'female_13',
    title: '集中力の波',
    description: '「今日は集中できてないかも。」とクラブを握り直す。',
    stage: 0,
    choices: [
      { text: '「大丈夫！調子上がりますよ！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery', 'hype'] },
      { text: '「そういう日もありますよ。焦らずいきましょう」', delta: { trust: 6, fun: 4, creep: 0, focus: 4 }, tags: ['honesty'] },
      { text: '「自分もそうです。一緒に頑張りましょう」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['humor'] },
      { text: '「集中できないと困りますね」', delta: { trust: -4, fun: -4, creep: 4, focus: 0 }, tags: ['serious'] },
    ],
  },

  // ===== 14: 年齢って武器になりますか？ =====
  {
    id: 'female_14',
    title: '年齢と武器',
    description: '「年齢って武器になりますか？」と真面目に聞く。',
    stage: 0,
    choices: [
      { text: '「全然お若く見えますよ！」', delta: { trust: -4, fun: 2, creep: 8, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「経験は間違いなく武器になります」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「年齢じゃなく、その人次第だと思います」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「年齢の話はちょっと…」', delta: { trust: -4, fun: -4, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 15: 私、気遣われるの嫌いなんです =====
  {
    id: 'female_15',
    title: '気遣い不要宣言',
    description: '「私、気遣われるの嫌いなんです。」と真っ直ぐ言う。',
    stage: 0,
    choices: [
      { text: '「そんなつもりないですよ！自然体です！」', delta: { trust: -2, fun: 0, creep: 6, focus: 0 }, tags: ['flattery'] },
      { text: '「了解です。対等にいきましょう」', delta: { trust: 8, fun: 4, creep: 0, focus: 4 }, tags: ['honesty', 'sportsmanship'] },
      { text: '「強いですね。見習いたいです」', delta: { trust: 4, fun: 2, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「え、気遣ってました？」', delta: { trust: -2, fun: 2, creep: 4, focus: 0 }, tags: ['humor'] },
    ],
  },

  // ===== 16: ライバルって必要ですか？ =====
  {
    id: 'female_16',
    title: 'ライバル論',
    description: '「ライバルって必要ですか？」と考え込む。',
    stage: 0,
    choices: [
      { text: '「あなたにライバルなんていませんよ！」', delta: { trust: -4, fun: 2, creep: 8, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「いた方が成長できると思います」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「難しいですよね。刺激にも焦りにもなる」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「別にいなくても…」', delta: { trust: -4, fun: -2, creep: 4, focus: 0 }, tags: ['distance'] },
    ],
  },

  // ===== 17: 今、ちょっと焦りましたよね？ =====
  {
    id: 'female_17',
    title: '焦りを見抜かれる',
    description: '「今、ちょっと焦りましたよね？」と鋭く指摘する。',
    stage: 0,
    choices: [
      { text: '「全然余裕ですよ！」', delta: { trust: -6, fun: 0, creep: 8, focus: -2 }, tags: ['flattery', 'hype'] },
      { text: '「…バレてました？正直少し」', delta: { trust: 8, fun: 4, creep: 0, focus: 4 }, tags: ['honesty'] },
      { text: '「鋭いですね。観察力すごい」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['humor'] },
      { text: '「別に焦ってないですけど」', delta: { trust: -4, fun: -2, creep: 6, focus: 0 }, tags: ['distance', 'bold'] },
    ],
  },

  // ===== 18: 自然体って大事ですよね =====
  {
    id: 'female_18',
    title: '自然体の大切さ',
    description: '「自然体って大事ですよね。」と穏やかに言う。',
    stage: 0,
    choices: [
      { text: '「あなたはいつも自然体で素敵です！」', delta: { trust: -2, fun: 2, creep: 6, focus: 0 }, tags: ['flattery', 'over_praise'] },
      { text: '「同感です。無理しない関係がいいですよね」', delta: { trust: 6, fun: 4, creep: 0, focus: 4 }, tags: ['honesty'] },
      { text: '「でも難しいですよね、つい気を遣っちゃう」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「自然体って何ですかね」', delta: { trust: -2, fun: -2, creep: 4, focus: 0 }, tags: ['logic'] },
    ],
  },

  // ===== 19: 今日は素で話せました =====
  {
    id: 'female_19',
    title: '素の会話',
    description: '「今日は素で話せました。」と嬉しそうに微笑む。',
    stage: 0,
    choices: [
      { text: '「自分もです！最高の一日でした！」', delta: { trust: 0, fun: 4, creep: 6, focus: 0 }, tags: ['flattery', 'hype'] },
      { text: '「こちらこそ。楽しかったです」', delta: { trust: 6, fun: 6, creep: 0, focus: 2 }, tags: ['honesty'] },
      { text: '「素で話せるって貴重ですよね」', delta: { trust: 4, fun: 4, creep: 2, focus: 2 }, tags: ['ethics'] },
      { text: '「そうですか」', delta: { trust: -4, fun: -4, creep: 4, focus: 0 }, tags: ['silence', 'distance'] },
    ],
  },

  // ===== 20: 楽しいって才能ですよね =====
  {
    id: 'female_20',
    title: '楽しむ才能',
    description: '「楽しいって才能ですよね。」と笑いながら言う。',
    stage: 0,
    choices: [
      { text: '「あなたと一緒だから楽しいんです！」', delta: { trust: -2, fun: 4, creep: 6, focus: 0 }, tags: ['flattery'] },
      { text: '「才能というか、意識の問題かもしれません」', delta: { trust: 6, fun: 2, creep: 0, focus: 4 }, tags: ['honesty', 'logic'] },
      { text: '「確かに！楽しめる人って強いですよね」', delta: { trust: 4, fun: 6, creep: 2, focus: 0 }, tags: ['humor'] },
      { text: '「楽しいだけじゃダメでしょう」', delta: { trust: -4, fun: -4, creep: 4, focus: 0 }, tags: ['serious'] },
    ],
  },
];
