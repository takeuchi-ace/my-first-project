/**
 * GameScreenSimple 用の厳選イベント
 * 全choiceに speech (rank別セリフ) を持つ。
 * front: stage 1-2 (8件) → 4件抽選
 * back:  stage 7-9 (8件) → 4件抽選
 */
import { GameEvent } from '../types';

export const frontEvents: GameEvent[] = [
  {
    id: 'c_parking_greeting',
    title: '駐車場での第一声',
    description: '駐車場で相手と合流。第一印象が決まる瞬間だ。',
    stage: 1,
    choices: [
      {
        text: '「本日はよろしくお願いします！」と深々お辞儀',
        delta: { trust: 4, fun: 1 },
        tags: ['etiquette'],
        speech: {
          good: '丁寧な挨拶ですね。こちらこそよろしくお願いします。',
          neutral: 'よろしくお願いします。',
          bad: '少し堅すぎませんか…。',
          worst: '…形式的すぎませんか。',
        },
      },
      {
        text: '「いやー楽しみですね！天気も最高！」',
        delta: { fun: 5, trust: 2 },
        tags: ['humor'],
        speech: {
          good: '本当に！最高のゴルフ日和ですね！',
          neutral: 'そうですね、天気はいいですね。',
          bad: '…テンション高いな。',
          worst: 'ちょっと馴れ馴れしくないですか。',
        },
      },
      {
        text: '「お車素敵ですね！何にお乗りで？」',
        delta: { fun: 4, trust: 1, creep: 2 },
        tags: ['flattery'],
        speech: {
          good: 'いやいや、そんな。ありがとうございます。',
          neutral: 'まぁ…普通の車ですよ。',
          bad: '車の話…興味ないです。',
          worst: 'そういうの、ちょっと嫌です。',
        },
      },
    ],
  },
  {
    id: 'c_first_tee',
    title: '相手の第一打',
    description: '朝一番のティーショット。相手が緊張した面持ちで構えている。',
    stage: 1,
    choices: [
      {
        text: '「リラックスして！楽しんでいきましょう！」と声をかける',
        delta: { fun: 5, trust: 3 },
        tags: ['humor'],
        speech: {
          good: 'ありがとうございます。気楽にいきます。',
          neutral: '…ありがとうございます。',
          bad: '集中してるときに話しかけないで…。',
          worst: '黙っていてもらえますか。',
        },
      },
      {
        text: '静かに見守る（集中の邪魔をしない）',
        delta: { trust: 4, fun: 1 },
        tags: ['etiquette'],
        speech: {
          good: 'ちょうどいい距離感です。ありがとうございます。',
          neutral: '問題ありません。',
          bad: 'もう少し声をかけてもらえると助かります。',
          worst: '少し冷たい印象ですね。',
        },
      },
      {
        text: '「ナイスショット出ますよ！」と応援する',
        delta: { fun: 4, trust: 2 },
        tags: ['flattery'],
        speech: {
          good: 'ありがとうございます。いい球が出ました。',
          neutral: 'どうかな…頑張ります。',
          bad: 'プレッシャーかけないで…。',
          worst: '応援している場合じゃないんですが。',
        },
      },
    ],
  },
  {
    id: 'c_praise_shot',
    title: '相手のナイスショット',
    description: '相手がフェアウェイど真ん中にナイスショットを放った。',
    // ショット後の場面なので stage 2。stage 1 は「スタート前」ビート専用
    stage: 2,
    choices: [
      {
        text: '「ナイスショット！さすがですね！」',
        delta: { fun: 5, trust: 3 },
        tags: ['flattery'],
        speech: {
          good: 'いやぁ、今日は調子いいかも！',
          neutral: 'ありがとうございます。たまたまですよ。',
          bad: '…お世辞はいらないです。',
          worst: 'そんな大げさに言わないでください。',
        },
      },
      {
        text: '「いい球ですね。風向き的にも完璧だ」と分析的に褒める',
        delta: { fun: 3, trust: 4 },
        tags: ['serious'],
        speech: {
          good: 'よく見てますね。そう、風も計算したんです。',
          neutral: 'なるほど…そういう見方もあるんですね。',
          bad: '分析されすぎると少し緊張します。',
          worst: '評論家のようなのはやめてください。',
        },
      },
      {
        text: '「うわ、負けてられないな！」と闘志を見せる',
        delta: { fun: 4, focus: 5 },
        tags: ['bold'],
        speech: {
          good: 'いいですね、その意気です。',
          neutral: 'まぁ…頑張ってください。',
          bad: '張り合わなくていいんですけど…。',
          worst: '勝負ではないんですが。',
        },
      },
    ],
  },
  {
    id: 'c_bunker_trouble',
    title: '相手がバンカーに入れた',
    description: '相手のボールがバンカーに吸い込まれた。顔が曇っている。',
    stage: 2,
    choices: [
      {
        text: '「バンカーは出すだけでOKですよ！」と励ます',
        delta: { trust: 3, fun: 3 },
        tags: ['humor', 'back_up'],
        speech: {
          good: 'そうですね、気楽にいきます。',
          neutral: '…まぁ、そうですね。',
          bad: '分かっています…。',
          worst: 'アドバイスは要りません。',
        },
      },
      {
        text: '何も言わずに自分のプレーに集中する',
        delta: { trust: 2, focus: 4 },
        tags: ['distance'],
        speech: {
          good: '集中できました。ありがとうございます。',
          neutral: '大丈夫です。',
          bad: '一言あると嬉しいです。',
          worst: '少し無関心に感じました。',
        },
      },
      {
        text: '「砂質が柔らかいから56度で開いて打てば…」と技術アドバイス', delta: { trust: 6, fun: -1, creep: 6 },
        tags: ['over_support'],
        speech: {
          good: 'おっ、詳しいですね。参考にします！',
          neutral: 'はぁ…ありがとうございます。',
          bad: '教えてもらわなくても…。',
          worst: 'コーチではないので、勘弁してください。',
        },
      },
    ],
  },
  {
    id: 'c_cart_talk',
    title: 'カート移動中の会話',
    description: 'カートで次のホールへ移動中。二人きりの時間だ。',
    stage: 2,
    choices: [
      {
        text: '「普段はどのくらいの頻度でラウンドされるんですか？」',
        delta: { trust: 3, fun: 2 },
        tags: ['honesty'],
        speech: {
          good: '月に2回くらいです。最近はもっと行きたいんですが。',
          neutral: '…まぁ、月1くらいですかね。',
          bad: 'そういう質問、面接みたいですね。',
          worst: 'プライベートなことは…。',
        },
      },
      {
        text: '景色を眺めながら「いいコースですね」と穏やかに話す',
        delta: { trust: 4, fun: 3 },
        tags: ['etiquette'],
        speech: {
          good: '本当に。こういう時間が一番いいですよね。',
          neutral: 'そうですね。',
          bad: '…まぁ、普通のコースですけど。',
          worst: '社交辞令はいいです。',
        },
      },
      {
        text: '「この後の戦略、一緒に考えましょう！」と提案',
        delta: { fun: 4, trust: 1, focus: 3 },
        tags: ['bold'],
        speech: {
          good: 'いいですね。ここからが勝負です。',
          neutral: '戦略…そうですね。',
          bad: '一緒にって…別にいいですけど。',
          worst: 'そこまで真剣にやらなくていいんですが。',
        },
      },
    ],
  },
  {
    id: 'c_water_hazard',
    title: '池越えのティーショット',
    description: '次のホールは目の前に大きな池。相手が「嫌だな…」とつぶやいた。',
    stage: 2,
    choices: [
      {
        text: '「大丈夫！超えますよ！」とポジティブに',
        delta: { fun: 4, trust: 2 },
        tags: ['humor'],
        speech: {
          good: 'よし！その一言で勇気出た！',
          neutral: '…だといいんですが。',
          bad: '簡単に言わないでください…。',
          worst: '無責任なこと言わないで。',
        },
      },
      {
        text: '「刻んでもいいと思いますよ。無理は禁物です」',
        delta: { trust: 5, fun: 1 },
        tags: ['honesty'],
        speech: {
          good: 'そうですね。冷静なアドバイス、ありがとうございます。',
          neutral: '…刻みますか。それもありですね。',
          bad: '弱気なことを言わないでください。',
          worst: '消極的すぎる。',
        },
      },
      {
        text: '「自分も池に入れたことありますよ（笑）」と自虐で場を和ませる',
        delta: { fun: 5, trust: 3 },
        tags: ['humor'],
        speech: {
          good: 'それを聞いたら気が楽になりました。',
          neutral: 'そうなんですね…。まぁ、よくあることです。',
          bad: '…自分の話はいいから。',
          worst: '笑えない。',
        },
      },
    ],
  },
  {
    id: 'c_slow_play',
    title: '前の組が遅い',
    description: '前の組のプレーが遅く、待ち時間が続いている。相手がイライラし始めた。',
    stage: 2,
    choices: [
      {
        text: '「ストレッチでもしましょうか」と気を紛らわせる',
        delta: { trust: 3, fun: 3 },
        tags: ['humor'],
        speech: {
          good: 'いいアイデアですね。体も温まりますし。',
          neutral: 'まぁ…そうですね。',
          bad: 'ストレッチって…。',
          worst: 'そういう問題じゃない。',
        },
      },
      {
        text: '「こういう時もありますよね」と共感する',
        delta: { trust: 4, fun: 2 },
        tags: ['honesty'],
        speech: {
          good: 'そうですね。焦ってもしょうがないです。',
          neutral: 'まぁ…ね。',
          bad: '分かってますが、イライラするんです。',
          worst: '共感されても解決しない。',
        },
      },
      {
        text: 'マーシャルに連絡して進行を促してもらう',
        delta: { trust: 2, fun: 1, creep: 2 },
        tags: ['bold'],
        speech: {
          good: '行動力ありますね。助かります。',
          neutral: '…そこまでしなくても。',
          bad: 'ちょっとやりすぎじゃない…？',
          worst: '余計なことはしないでください。',
        },
      },
    ],
  },
  {
    id: 'c_your_miss',
    title: '自分がミスショット',
    description: 'あなたのショットが大きく曲がってしまった。相手がこちらを見ている。',
    // プレー中の場面なので stage 2。stage 1 は「スタート前」ビート専用
    stage: 2,
    choices: [
      {
        text: '「やっちゃいました！（笑）」と明るく受け流す',
        delta: { fun: 5, trust: 3 },
        tags: ['humor'],
        speech: {
          good: '大丈夫です、次がありますよ。',
          neutral: 'まぁ…ドンマイ。',
          bad: '…笑えるミスではないですが。',
          worst: 'ヘラヘラしないでください。',
        },
      },
      {
        text: '「すみません、ちょっと力みました」と冷静に反省',
        delta: { trust: 4, fun: 1 },
        tags: ['honesty', 'self_reflect'],
        speech: {
          good: '冷静ですね。次で取り返せますよ。',
          neutral: 'まぁ、そういう時もあります。',
          bad: '…謝らなくていいんですが。',
          worst: '反省している場合ではないでしょう。',
        },
      },
      {
        text: '「風が急に変わった気がして…」と言い訳する',
        delta: { fun: 1, trust: -2, creep: 2 },
        tags: ['safe', 'excuse'],
        speech: {
          good: 'そうかもしれません。風は読みにくいですね。',
          neutral: '…まぁ、そういうことにしておきます。',
          bad: '言い訳はみっともないですよ。',
          worst: '嘘はやめてください。',
        },
      },
    ],
  },
];

export const backEvents: GameEvent[] = [
  {
    id: 'c_back_fatigue',
    title: '後半の疲れ',
    description: '後半に入り、相手の足取りが重い。暑さもあって疲労が見える。',
    stage: 7,
    choices: [
      {
        text: '「水分取りましょう！」と自分のドリンクを差し出す',
        delta: { trust: 4, fun: 2 },
        tags: ['etiquette'],
        speech: {
          good: 'ありがとうございます。気が利きますね。',
          neutral: 'あ、どうも。',
          bad: '…自分で持っていますので。',
          worst: '気を遣わないでください。',
        },
      },
      {
        text: '「後半はスコアより楽しみましょう！」と切り替えを提案',
        delta: { fun: 5, trust: 3 },
        tags: ['humor', 'ride_the_mood'],
        speech: {
          good: 'そうですね。楽しむのが一番です。',
          neutral: 'まぁ…そうかもしれません。',
          bad: 'こちらはスコアを気にしているんですが。',
          worst: '勝手に方針決めないで。',
        },
      },
      {
        text: '自分のペースを落として相手に合わせる',
        delta: { trust: 5, fun: 1 },
        tags: ['honesty'],
        speech: {
          good: 'ペースを合わせてくれてありがとうございます。',
          neutral: '気遣い、助かります。',
          bad: 'そこまでしなくていいですよ。',
          worst: '無理していませんか？',
        },
      },
    ],
  },
  {
    id: 'c_rival_approach',
    title: '相手の絶妙アプローチ',
    description: '相手が見事なアプローチショットでピン傍1mにつけた。',
    stage: 7,
    choices: [
      {
        text: '「今の最高でしたね！プロみたいだ！」と素直に称える',
        delta: { fun: 5, trust: 3 },
        tags: ['flattery'],
        speech: {
          good: 'いやぁ、嬉しいです。自信ありました。',
          neutral: 'ありがとうございます。偶然ですよ。',
          bad: '…プロは大げさですよ。',
          worst: 'そこまで持ち上げなくていいです。',
        },
      },
      {
        text: '「何ヤードでした？参考にしたい」と技術的に聞く',
        delta: { trust: 4, fun: 2 },
        tags: ['logic', 'analysis_praise'],
        speech: {
          good: '85ヤードです。52度で軽めに打ちました。',
          neutral: '…85くらいですかね。',
          bad: '聞いてどうするんですか？',
          worst: 'いちいち聞かないでください。',
        },
      },
      {
        text: '拍手だけして静かに称える',
        delta: { trust: 3, fun: 2 },
        tags: ['etiquette'],
        speech: {
          good: '…いい反応ですね。嬉しいです。',
          neutral: '…ありがとうございます。',
          bad: '…もう少し反応してくれてもいいのに。',
          worst: '…拍手だけ？',
        },
      },
    ],
  },
  {
    id: 'c_score_talk',
    title: 'スコアの話題',
    description: '「今日のスコア、どうですか？」と相手が聞いてきた。',
    stage: 8,
    choices: [
      {
        text: '「いやー全然ダメですよ」と謙遜する',
        delta: { trust: 3, fun: 2 },
        tags: ['honesty'],
        speech: {
          good: '謙虚ですね。でもいいプレーしてますよ。',
          neutral: 'そうなんですね…。',
          bad: '嘘でしょ。結構良いじゃないですか。',
          worst: '…白々しいですね。',
        },
      },
      {
        text: '「今日は相手のゴルフを楽しんでます！」と返す',
        delta: { fun: 5, trust: 4 },
        tags: ['humor'],
        speech: {
          good: '嬉しいことを言ってくれますね。',
          neutral: 'まぁ…ありがとうございます。',
          bad: '…お世辞じゃないですよね？',
          worst: '意味が分かりません。',
        },
      },
      {
        text: '正確にスコアを伝え、分析を共有する',
        delta: { trust: 4, fun: 1, focus: 3 },
        tags: ['logic'],
        speech: {
          good: 'しっかり管理してるんですね。さすがです。',
          neutral: 'なるほど…。',
          bad: '…そこまで細かくなくていいんですが。',
          worst: '数字ばかり気にしすぎではないですか？',
        },
      },
    ],
  },
  {
    id: 'c_bet_proposal',
    title: '「ニアピン勝負しない？」',
    description: '相手が「この後のショートホール、ニアピン勝負しませんか？」と提案してきた。',
    stage: 8,
    choices: [
      {
        text: '「いいですね！やりましょう！」と乗る',
        delta: { fun: 5, trust: 3, focus: 3 },
        tags: ['bold', 'fair_compete', 'ride_the_mood'],
        speech: {
          good: 'いいですね、盛り上がってきました。',
          neutral: 'じゃあ、やりましょうか。',
          bad: '…ノリがいいですね。',
          worst: '少し軽いですね。',
        },
      },
      {
        text: '「勝負は苦手なので…」と丁重に断る',
        delta: { trust: 2, fun: -1 },
        tags: ['safe'],
        speech: {
          good: 'そうですか。無理しなくていいですよ。',
          neutral: '…まぁ、いいですけど。',
          bad: 'つまらないですね。',
          worst: 'ノリが悪いですね。',
        },
      },
      {
        text: '「負けた方がジュース奢りで！」とカジュアルに',
        delta: { fun: 5, trust: 4 },
        tags: ['humor'],
        speech: {
          good: 'いいですね。それくらいがちょうどいいです。',
          neutral: 'まぁ…それくらいなら。',
          bad: '子供じゃないんですから…。',
          worst: '…しょうもないですね。',
        },
      },
    ],
  },
  {
    id: 'c_sunset_hole',
    title: '夕日のロングホール',
    description: '最終ホールが近づき、美しい夕日が差し込んでいる。相手も感慨深そうだ。',
    // プレー中の場面なので stage 8。stage 9 は「ラウンド後の締め」ビート専用
    stage: 8,
    choices: [
      {
        text: '「今日は本当にいいラウンドでした」と感謝を伝える',
        delta: { trust: 5, fun: 3 },
        tags: ['honesty'],
        speech: {
          good: 'こちらこそ。また一緒に回りましょう。',
          neutral: 'そうですね。お疲れ様でした。',
          bad: '…まだ終わっていないんですが。',
          worst: '…まとめに入るのが早くないですか？',
        },
      },
      {
        text: '「最後、ベストショット出しましょう！」と盛り上げる',
        delta: { fun: 5, trust: 2, focus: 3 },
        tags: ['hype', 'challenge'],
        speech: {
          good: '最後まで全力でいきましょう。',
          neutral: '…頑張りましょう。',
          bad: '疲れているんですが…。',
          worst: '少し暑苦しいですね。',
        },
      },
      {
        text: '静かに夕日を眺め、余韻を共有する',
        delta: { trust: 4, fun: 4 },
        tags: ['silence'],
        speech: {
          good: 'いい時間でした。',
          neutral: '綺麗ですね。',
          bad: '少しは何か話しましょうか。',
          worst: '少し気まずいですね。',
        },
      },
    ],
  },
  {
    id: 'c_putt_advice',
    title: '相手のパッティング',
    description: '相手が長いパットに挑もうとしている。ラインが読みにくそうだ。',
    stage: 7,
    choices: [
      {
        text: '「右に曲がりそうですね」とさりげなくヒント',
        delta: { trust: 3, fun: 2 },
        tags: ['honesty'],
        speech: {
          good: 'そう見えますか。参考にします。',
          neutral: '…そうですかね。',
          bad: '読みは自分でやりたいんですが。',
          worst: 'アドバイスは要りません。',
        },
      },
      {
        text: '黙って見守る',
        delta: { trust: 4, fun: 1 },
        tags: ['etiquette'],
        speech: {
          good: '集中できました。ありがとうございます。',
          neutral: 'はい。',
          bad: '一言あると嬉しいです。',
          worst: '少し寂しいですね。',
        },
      },
      {
        text: '「入れ！入れ！」と小声で応援',
        delta: { fun: 4, trust: 2 },
        tags: ['hype'],
        speech: {
          good: '入りました。応援のおかげです。',
          neutral: '…ありがとうございます。',
          bad: 'うるさいです…集中させてください。',
          worst: 'やめてください。',
        },
      },
    ],
  },
  {
    id: 'c_phone_ring',
    title: '相手のスマホが鳴った',
    description: 'プレー中に相手のスマホが鳴った。相手が気まずそうにしている。',
    stage: 8,
    choices: [
      {
        text: '「お先にどうぞ、大丈夫ですよ」と笑顔で促す',
        delta: { trust: 5, fun: 2 },
        tags: ['etiquette'],
        speech: {
          good: 'すみません…ありがとうございます。すぐ終わります。',
          neutral: '…すみません。',
          bad: '…余計な気遣い。',
          worst: '…放っておいてください。',
        },
      },
      {
        text: '気づかないフリをして待つ',
        delta: { trust: 3, fun: 1 },
        tags: ['distance'],
        speech: {
          good: '…さりげない気遣いですね。助かります。',
          neutral: '…。',
          bad: '…聞こえてますよね？',
          worst: '…無視ですか。',
        },
      },
      {
        text: '「マナーモードにしましょう！」と注意する',
        delta: { trust: -2, fun: -2, creep: 4 },
        tags: ['etiquette', 'pressure'],
        speech: {
          good: 'あ、すみません！そうですね。',
          neutral: '…はい、すみません。',
          bad: '…分かってます。',
          worst: '指図しないでください。',
        },
      },
    ],
  },
  {
    id: 'c_final_putt',
    title: '最終パット',
    description: '最終ホール。相手の最後のパットが残っている。今日を締めくくる一打だ。',
    // 最終パットのミニゲームと重なるため stage 8。stage 9 は「ラウンド後の締め」ビート専用
    stage: 8,
    choices: [
      {
        text: '息を止めて静かに見守る',
        delta: { trust: 5, fun: 3 },
        tags: ['etiquette'],
        speech: {
          good: '…入りました。最高の締めです。',
          neutral: '…よし。まずまずです。',
          bad: '…集中したかったんですが。',
          worst: '…黙って見てるだけですか。',
        },
      },
      {
        text: '「このライン、右に切れそうですね」とさりげなく助言する',
        delta: { fun: 2, trust: 4 },
        tags: ['honesty'],
        speech: {
          good: '読み通りです。ありがとうございます。',
          neutral: '…参考にします。',
          bad: '余計なことは言わないでください。',
          worst: '集中してるので、黙っていてください。',
        },
      },
      {
        text: '「入れてください！最高の一日にしましょう！」と声をかける',
        delta: { fun: 5, trust: 3 },
        tags: ['hype', 'kiai'],
        speech: {
          good: '気合いが入りました。…入りました。',
          neutral: '…プレッシャーをかけないでください。',
          bad: '静かにしてもらえますか。',
          worst: 'うるさいです。集中できません。',
        },
      },
    ],
  },
];
