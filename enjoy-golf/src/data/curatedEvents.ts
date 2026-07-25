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
          bad: 'ちょっと堅すぎるかな…。',
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
          good: 'ありがとう！よし、気楽にいくか！',
          neutral: 'うん…ありがとう。',
          bad: '集中してるときに話しかけないで…。',
          worst: '黙っていてもらえますか。',
        },
      },
      {
        text: '静かに見守る（集中の邪魔をしない）',
        delta: { trust: 4, fun: 1 },
        tags: ['etiquette'],
        speech: {
          good: 'ありがとう、ちょうどいい距離感だね。',
          neutral: 'うん、問題ないよ。',
          bad: 'もう少し声かけてくれると助かるかな。',
          worst: 'ちょっと冷たい印象だな。',
        },
      },
      {
        text: '「ナイスショット出ますよ！」と応援する',
        delta: { fun: 4, trust: 2 },
        tags: ['flattery'],
        speech: {
          good: 'ありがとう！いい球出たよ！',
          neutral: 'どうかな…頑張ります。',
          bad: 'プレッシャーかけないで…。',
          worst: '応援してる場合じゃないだろ。',
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
          neutral: 'ありがとう。たまたまですよ。',
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
          bad: '分析されすぎると少し緊張するかな。',
          worst: '評論家みたいなのはやめてくれ。',
        },
      },
      {
        text: '「うわ、負けてられないな！」と闘志を見せる',
        delta: { fun: 4, focus: 5 },
        tags: ['bold'],
        speech: {
          good: 'いいね！その意気だ！',
          neutral: 'まぁ…頑張ってください。',
          bad: '張り合わなくていいんですけど…。',
          worst: '勝負じゃないんだけど。',
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
          good: 'そうだよね！気楽にいくよ。',
          neutral: 'うん…まぁそうだよね。',
          bad: '分かってるよ…。',
          worst: 'アドバイスはいらない。',
        },
      },
      {
        text: '何も言わずに自分のプレーに集中する',
        delta: { trust: 2, focus: 4 },
        tags: ['distance'],
        speech: {
          good: '集中できたよ、ありがとう。',
          neutral: '大丈夫。',
          bad: '一言あると嬉しいかな。',
          worst: '少し無関心に感じたよ。',
        },
      },
      {
        text: '「砂質が柔らかいから56度で開いて打てば…」と技術アドバイス',
        delta: { trust: 1, fun: -1, creep: 3 },
        tags: ['over_support'],
        speech: {
          good: 'おっ、詳しいですね。参考にします！',
          neutral: 'はぁ…ありがとうございます。',
          bad: '教えてもらわなくても…。',
          worst: 'コーチじゃないんだから勘弁してくれ。',
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
          good: '月に2回くらいかな。最近はもっと行きたいんだけど。',
          neutral: '…まぁ、月1くらいですかね。',
          bad: 'そういう質問、面接みたいだな。',
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
          good: 'いいね！ここからが勝負だ！',
          neutral: '戦略…そうですね。',
          bad: '一緒にって…別にいいですけど。',
          worst: 'そこまで真剣にやらなくていいんだけど。',
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
          neutral: '…だといいんだけどね。',
          bad: '簡単に言わないでよ…。',
          worst: '無責任なこと言わないで。',
        },
      },
      {
        text: '「刻んでもいいと思いますよ。無理は禁物です」',
        delta: { trust: 5, fun: 1 },
        tags: ['honesty'],
        speech: {
          good: 'そうだね。冷静なアドバイスありがとう。',
          neutral: '…刻むか。それもありか。',
          bad: '弱気なこと言わないでくれよ。',
          worst: '消極的すぎる。',
        },
      },
      {
        text: '「俺も池に入れたことありますよ（笑）」と自虐で場を和ませる',
        delta: { fun: 5, trust: 3 },
        tags: ['humor'],
        speech: {
          good: 'ハハハ！それ聞いたら気が楽になった！',
          neutral: 'そうなんだ…。まぁ、よくあることだよね。',
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
          good: 'いいアイデアだね！体も温まるし。',
          neutral: 'まぁ…そうだね。',
          bad: 'ストレッチって…。',
          worst: 'そういう問題じゃない。',
        },
      },
      {
        text: '「こういう時もありますよね」と共感する',
        delta: { trust: 4, fun: 2 },
        tags: ['honesty'],
        speech: {
          good: 'そうだよね。焦ってもしょうがない。',
          neutral: 'まぁ…ね。',
          bad: '分かってるけど、イライラするんだよ。',
          worst: '共感されても解決しない。',
        },
      },
      {
        text: 'マーシャルに連絡して進行を促してもらう',
        delta: { trust: 2, fun: 1, creep: 2 },
        tags: ['bold'],
        speech: {
          good: 'おっ、行動力あるね。助かる。',
          neutral: '…そこまでしなくても。',
          bad: 'ちょっとやりすぎじゃない…？',
          worst: '余計なことしないでくれ。',
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
          good: 'ハハハ！大丈夫大丈夫！次があるよ！',
          neutral: 'まぁ…ドンマイ。',
          bad: '…笑えるミスじゃないけど。',
          worst: 'ヘラヘラしないでくれ。',
        },
      },
      {
        text: '「すみません、ちょっと力みました」と冷静に反省',
        delta: { trust: 4, fun: 1 },
        tags: ['honesty', 'self_reflect'],
        speech: {
          good: '冷静だね。次で取り返せるよ。',
          neutral: 'まぁ、そういう時もあるよ。',
          bad: '…謝らなくていいんだけど。',
          worst: '反省してる場合じゃないだろ。',
        },
      },
      {
        text: '「風が急に変わった気がして…」と言い訳する',
        delta: { fun: 1, trust: -2, creep: 2 },
        tags: ['safe', 'excuse'],
        speech: {
          good: 'そうかもね。風、読みにくいよね。',
          neutral: '…まぁ、そういうことにしておこう。',
          bad: '言い訳はみっともないよ。',
          worst: '嘘つくなよ。',
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
          good: 'ありがとう！気が利くね。',
          neutral: 'あ、どうも。',
          bad: '…自分で持ってるから。',
          worst: '気を遣わないでくれ。',
        },
      },
      {
        text: '「後半はスコアより楽しみましょう！」と切り替えを提案',
        delta: { fun: 5, trust: 3 },
        tags: ['humor', 'ride_the_mood'],
        speech: {
          good: 'そうだね！楽しむのが一番！',
          neutral: 'まぁ…そうかもね。',
          bad: 'こっちはスコア気にしてるんだけど。',
          worst: '勝手に方針決めないで。',
        },
      },
      {
        text: '自分のペースを落として相手に合わせる',
        delta: { trust: 5, fun: 1 },
        tags: ['honesty'],
        speech: {
          good: 'ペース合わせてくれてありがとう。',
          neutral: '気遣い助かる。',
          bad: 'そこまでしなくていいよ。',
          worst: '無理してない？',
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
          good: 'いやぁ、嬉しいね！自信あったんだ。',
          neutral: 'ありがとう。偶然ですよ。',
          bad: '…プロは大げさでしょ。',
          worst: 'そこまで持ち上げなくていい。',
        },
      },
      {
        text: '「何ヤードでした？参考にしたい」と技術的に聞く',
        delta: { trust: 4, fun: 2 },
        tags: ['logic', 'analysis_praise'],
        speech: {
          good: '85ヤード。52度で軽めに打ったよ。',
          neutral: '…65くらいかな。',
          bad: '聞いてどうするの？',
          worst: 'いちいち聞かないでくれ。',
        },
      },
      {
        text: '拍手だけして静かに称える',
        delta: { trust: 3, fun: 2 },
        tags: ['etiquette'],
        speech: {
          good: '…いい反応だ。嬉しいね。',
          neutral: '…ありがとう。',
          bad: '…もうちょっと反応してくれてもいいのに。',
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
          good: '謙虚だね。でもいいプレーしてるよ。',
          neutral: 'そうなんだ…。',
          bad: '嘘でしょ。結構良いじゃないですか。',
          worst: '…白々しいな。',
        },
      },
      {
        text: '「今日は相手のゴルフを楽しんでます！」と返す',
        delta: { fun: 5, trust: 4 },
        tags: ['humor'],
        speech: {
          good: 'おっ、嬉しいこと言ってくれるね！',
          neutral: 'まぁ…ありがとう。',
          bad: '…お世辞じゃないよね？',
          worst: '意味分からない。',
        },
      },
      {
        text: '正確にスコアを伝え、分析を共有する',
        delta: { trust: 4, fun: 1, focus: 3 },
        tags: ['logic'],
        speech: {
          good: 'しっかり管理してるんだね。さすがだ。',
          neutral: 'なるほど…。',
          bad: '…そこまで細かくなくていいんだけど。',
          worst: '数字ばかり気にしすぎじゃない？',
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
          good: 'よし！盛り上がってきた！',
          neutral: 'じゃあ、やりましょうか。',
          bad: '…ノリがいいね。',
          worst: '軽いな。',
        },
      },
      {
        text: '「勝負は苦手なので…」と丁重に断る',
        delta: { trust: 2, fun: -1 },
        tags: ['safe'],
        speech: {
          good: 'そっか。無理しなくていいよ。',
          neutral: '…まぁ、いいけど。',
          bad: 'つまんないな。',
          worst: 'ノリ悪いね。',
        },
      },
      {
        text: '「負けた方がジュース奢りで！」とカジュアルに',
        delta: { fun: 5, trust: 4 },
        tags: ['humor'],
        speech: {
          good: 'ハハハ！いいね！それくらいがちょうどいい！',
          neutral: 'まぁ…それくらいなら。',
          bad: '子供じゃないんだから…。',
          worst: '…しょうもない。',
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
          bad: '…まだ終わってないんだけど。',
          worst: '…まとめに入るの早くない？',
        },
      },
      {
        text: '「最後、ベストショット出しましょう！」と盛り上げる',
        delta: { fun: 5, trust: 2, focus: 3 },
        tags: ['hype', 'challenge'],
        speech: {
          good: 'よし！最後まで全力でいくぞ！',
          neutral: '…頑張りましょう。',
          bad: '疲れてるんだけど…。',
          worst: '暑苦しい。',
        },
      },
      {
        text: '静かに夕日を眺め、余韻を共有する',
        delta: { trust: 4, fun: 4 },
        tags: ['silence'],
        speech: {
          good: 'いい時間だったね。',
          neutral: '綺麗だね。',
          bad: '少しは何か話そうか。',
          worst: 'ちょっと気まずいね。',
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
          good: 'おっ、そう見える？参考にするよ。',
          neutral: '…そうかな。',
          bad: '読みは自分でやりたいんだけど。',
          worst: 'アドバイスはいらない。',
        },
      },
      {
        text: '黙って見守る',
        delta: { trust: 4, fun: 1 },
        tags: ['etiquette'],
        speech: {
          good: '集中できた、ありがとう。',
          neutral: 'うん。',
          bad: '一言あると嬉しい。',
          worst: '少し寂しいかな。',
        },
      },
      {
        text: '「入れ！入れ！」と小声で応援',
        delta: { fun: 4, trust: 2 },
        tags: ['hype'],
        speech: {
          good: '入った！応援のおかげだ！',
          neutral: '…ありがとう。',
          bad: 'うるさいな…集中させて。',
          worst: 'やめてくれ。',
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
          good: 'すみません…ありがとう。すぐ終わります。',
          neutral: '…すみません。',
          bad: '…余計な気遣い。',
          worst: '…放っておいてくれ。',
        },
      },
      {
        text: '気づかないフリをして待つ',
        delta: { trust: 3, fun: 1 },
        tags: ['distance'],
        speech: {
          good: '…さりげない気遣いだな。助かる。',
          neutral: '…。',
          bad: '…聞こえてるよね？',
          worst: '…無視かよ。',
        },
      },
      {
        text: '「マナーモードにしましょう！」と注意する',
        delta: { trust: -2, fun: -2, creep: 4 },
        tags: ['etiquette', 'pressure'],
        speech: {
          good: 'あ、すみません！そうですね。',
          neutral: '…はい、すみません。',
          bad: '…分かってるよ。',
          worst: '指図しないでくれ。',
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
          good: '…入った！最高の締めだ！',
          neutral: '…よし。まずまずだな。',
          bad: '…集中したかったんだけど。',
          worst: '…黙って見てるだけか。',
        },
      },
      {
        text: '「このライン、右に切れそうですね」とさりげなく助言する',
        delta: { fun: 2, trust: 4 },
        tags: ['honesty'],
        speech: {
          good: 'おっ、読み通りだ！ありがとう！',
          neutral: '…参考にするよ。',
          bad: '余計なこと言わないでくれ。',
          worst: '集中してるんだ、黙っててくれ。',
        },
      },
      {
        text: '「入れてください！最高の一日にしましょう！」と声をかける',
        delta: { fun: 5, trust: 3 },
        tags: ['hype', 'kiai'],
        speech: {
          good: 'よし、気合い入った！…入ったぞ！',
          neutral: '…プレッシャーかけないでくれ。',
          bad: '静かにしてくれないか。',
          worst: 'うるさい。集中できない。',
        },
      },
    ],
  },
];
