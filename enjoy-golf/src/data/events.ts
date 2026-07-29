import { GameEvent } from '../types';

export const events: GameEvent[] = [
  // ============================================================
  //  STAGE 1 — 挨拶・様子見・軽め（10本）
  // ============================================================

  {
    id: 'first_tee_tension',
    title: '相手の第一打',
    description: '朝一番のティーショット。相手が緊張した面持ちで構えている。',
    stage: 1,
    choices: [
      { text: '「リラックスして！楽しんでいきましょう！」と声をかける', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '静かに見守る（集中の邪魔をしない）', delta: { trust: 4, fun: 1 }, tags: ['etiquette'] },
      { text: '「ナイスショット出ますよ！」と応援する', delta: { fun: 4, trust: 2 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'praise_shot',
    title: '相手のナイスショット',
    description: '相手がフェアウェイど真ん中にナイスショットを放った。',
    stage: 1,
    choices: [
      { text: '「ナイスショット！さすがですね！」', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
      { text: '「いい球ですね。風向き的にも完璧だ」と分析的に褒める', delta: { fun: 3, trust: 4 }, tags: ['serious'] },
      { text: '「うわ、負けてられないな！」と闘志を見せる', delta: { fun: 4, focus: 5 }, tags: ['bold'] },
    ],
  },
  {
    id: 'parking_greeting',
    title: '駐車場での第一声',
    description: '駐車場で相手と合流。第一印象が決まる瞬間だ。',
    stage: 1,
    choices: [
      { text: '「本日はよろしくお願いします！」と深々お辞儀', delta: { trust: 4, fun: 1 }, tags: ['etiquette'] },
      { text: '「いやー楽しみですね！天気も最高！」', delta: { fun: 5, trust: 2 }, tags: ['humor'] },
      { text: '「お車素敵ですね！何にお乗りで？」', delta: { fun: 4, trust: 1, creep: 2 }, tags: ['flattery'] },
      { text: '相手の荷物を率先して運ぶ', delta: { trust: 3, fun: 2, creep: 1 }, tags: ['etiquette', 'over_support'] },
    ],
  },
  {
    id: 'locker_room',
    title: 'ロッカールームにて',
    description: '着替え中、相手が「最近調子どう？」と聞いてきた。ゴルフ談義のチャンスだ。',
    stage: 1,
    choices: [
      { text: '「○○さんこそ、相変わらずお忙しいですか？」と返す', delta: { trust: 3, fun: 2 }, tags: ['safe'] },
      { text: '「○○さんのスイング見るの楽しみです！」', delta: { fun: 5, trust: 2 }, tags: ['flattery'] },
      { text: '「今日は○○さんから色々教えてもらいたいです」', delta: { fun: 4, trust: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'practice_green',
    title: '練習グリーンでの偵察',
    description: '練習グリーンで相手のパッティングを観察できる。腕前を探るチャンスだ。',
    stage: 1,
    choices: [
      { text: 'さりげなく観察して腕前を測る', delta: { focus: 5, trust: 1 }, tags: ['serious'] },
      { text: '「今日のグリーン速そうですね」と情報交換', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['safe'] },
      { text: '「うまいなぁ…教えてもらっていいですか？」', delta: { fun: 5, trust: 2 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'cart_seat',
    title: 'カートの席',
    description: 'カートに乗り込む。助手席と後部座席、どちらに座る？',
    stage: 1,
    choices: [
      { text: '相手に助手席を譲り後ろに座る', delta: { trust: 3, fun: 1 }, tags: ['etiquette'] },
      { text: '「隣いいですか？」と助手席へ', delta: { fun: 4, trust: 2 }, tags: ['bold'] },
      { text: '「どちらがお好みですか？」と聞く', delta: { trust: 2, fun: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'weather_small_talk',
    title: '天気トーク',
    description: '「今日は暑くなりそうですね」と相手が空を見上げた。',
    stage: 1,
    choices: [
      { text: '「水分しっかり取りましょう！」とペットボトルを渡す', delta: { trust: 3, fun: 2, creep: 1 }, tags: ['over_support'] },
      { text: '「暑い方がスコア伸びるって言いますよ！」', delta: { fun: 5, trust: 1 }, tags: ['humor'] },
      { text: '「日焼け止め塗り直しましょうか」と冷静に', delta: { fun: 1, trust: 2, focus: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'first_hole_result',
    title: '相手の出だし',
    description: '1番ホール、相手がまさかのダブルボギースタート。少し動揺している。',
    // プレー開始後の場面なので stage 2（前半）。stage 1 は「スタート前」ビート専用
    stage: 2,
    choices: [
      { text: '「まだ始まったばかりですよ！全然大丈夫！」と励ます', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '「風が読みにくい1番ホールですからね」とフォロー', delta: { fun: 3, trust: 4 }, tags: ['safe'] },
      { text: '「次で取り返しましょう！」と前向きに', delta: { fun: 4, trust: 2, focus: 3 }, tags: ['bold'] },
    ],
  },
  {
    id: 'tee_marker_advice',
    title: 'ティーマーカー選び',
    description: '相手が「今日はバックティーにしようかな…でも風強いな」と迷っている。',
    stage: 1,
    choices: [
      { text: '「バックティーでいきましょう！さすがですね」', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '「風が強いのでレギュラーもアリかもですね」と正直に', delta: { trust: 4, fun: 1 }, tags: ['honesty'] },
      { text: '「○○さんのお好きなティーで！」と任せる', delta: { fun: 3, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'club_brand_chat',
    title: 'クラブの話題',
    description: '相手が最新モデルのドライバーを見せてきた。「これ、いいんだよ」と嬉しそうだ。',
    stage: 1,
    choices: [
      { text: '「すごい！打たせてもらっていいですか？」', delta: { fun: 6, trust: 3 }, tags: ['flattery'] },
      { text: '「自分もそのモデル気になってたんです」', delta: { fun: 4, trust: 2 }, tags: ['safe'] },
      { text: '「道具より腕前ですよ。さすがです」', delta: { fun: 3, trust: 4 }, tags: ['flattery', 'humor'] },
    ],
  },

  // ============================================================
  //  STAGE 2 — 前半序盤・褒めインフレ・グレーゾーン始動（10本）
  // ============================================================

  // ===== 必須 A: OBボール蹴り =====
  {
    id: 'ob_kick',
    title: '相手のOB完全アウト！',
    description: '相手のボールが白杭の外へ大きく飛んだ。あなたは相手より先にボールの近くにいる。蹴って白杭内に戻せそうだ。',
    stage: 2,
    choices: [
      { text: '躓いたふりしてボールを蹴り戻してあげる', delta: { fun: 8, trust: 3, creep: 15, focus: 10 }, tags: ['cheat_physical'] },
      { text: '何もせず「OBですね…ドンマイです！」と声をかける', delta: { trust: 5, fun: -2 }, tags: ['honesty'] },
      { text: '「大丈夫！まだ前半ですよ！」と明るく励ます', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'praise_inflate_1',
    title: '褒めが止まらない',
    description: '相手のアプローチが見事にピンそばに着いた。どこまで褒める？',
    stage: 2,
    choices: [
      { text: '「ナイスオン！」とシンプルに', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: '「教科書に載せたいショットですね！」', delta: { fun: 6, trust: 2, creep: 3 }, tags: ['flattery'] },
      { text: '「もうプロ転向した方がいいですよ！」', delta: { fun: 8, trust: -1, creep: 6 }, tags: ['flattery', 'over_support'] },
      { text: '黙って拍手だけする', delta: { trust: 4, fun: 1 }, tags: ['serious'] },
    ],
  },
  {
    id: 'divot_repair',
    title: '相手のディボット跡',
    description: '相手がショット後、ディボット跡を直さず歩き出した。あなたはどうする？',
    stage: 2,
    choices: [
      { text: 'さりげなく自分が直す', delta: { trust: 4, fun: 1 }, tags: ['etiquette'] },
      { text: '「あ、直しときますね！」と声をかけて直す', delta: { trust: 3, fun: 2, creep: 2 }, tags: ['etiquette', 'over_support'] },
      { text: '何も言わずスルーする', delta: { fun: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'opponent_shank',
    title: '相手の大シャンク',
    description: '相手のショットが大きくシャンクした。明らかに恥ずかしそうだ。',
    stage: 2,
    choices: [
      { text: '「風ですかね！次いきましょう！」と流す', delta: { fun: 5, trust: 4 }, tags: ['humor'] },
      { text: '「実は自分もさっきから…」と自虐で返す', delta: { fun: 6, trust: 3 }, tags: ['humor'] },
      { text: '「グリップが少し…」とアドバイスしかける', delta: { fun: -2, trust: -1, creep: 3 }, tags: ['serious'] },
      { text: '見なかったふりをして景色を眺める', delta: { trust: 3, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'phone_ring',
    title: '相手の携帯が鳴る',
    description: 'ティーグラウンドで相手のスマホが鳴った。相手が「しまった…」と焦っている。',
    stage: 2,
    choices: [
      { text: '「大丈夫ですよ、急用かもしれませんし！」と気にしない', delta: { trust: 5, fun: 3 }, tags: ['safe'] },
      { text: '「出てください！こっちは待ってますから」と快く', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '「マナーモードの仕方教えましょうか？笑」と冗談', delta: { fun: 5, trust: 1, creep: 2 }, tags: ['humor'] },
    ],
  },
  {
    id: 'caddy_tip',
    title: 'キャディさんへの態度',
    description: 'キャディさんが相手のクラブを丁寧に拭いている。相手は少し恐縮した様子でそれを見ている。あなたはどう振る舞う？',
    stage: 2,
    choices: [
      { text: '「ありがとうございます」と丁寧にお礼を言う', delta: { trust: 5, fun: 1 }, tags: ['etiquette'] },
      { text: '当然という態度で受け取る', delta: { trust: -3, creep: 2 }, tags: ['neutral'] },
      { text: '「いつも助かります！」とチップを渡す', delta: { fun: 3, trust: 2, creep: 3 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'fairway_walk',
    title: 'フェアウェイの歩き方',
    description: '相手のボール方向へ一緒に歩いている。会話のチャンスだ。',
    stage: 2,
    choices: [
      { text: '趣味の話で盛り上がる', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '黙ってゴルフに集中する', delta: { focus: 5, trust: 1 }, tags: ['serious'] },
      { text: '「このコース何回目ですか？」と質問する', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
    ],
  },
  {
    id: 'opponent_tee_up',
    title: '相手のティーアップ',
    description: '相手がティーアップに手間取っている。風が強い。',
    stage: 2,
    choices: [
      { text: '風除けとして横に立ってあげる', delta: { fun: 3, trust: 3, creep: 2 }, tags: ['over_support'] },
      { text: '静かに待つ', delta: { trust: 3, fun: 1 }, tags: ['etiquette'] },
      { text: '「この風、厄介ですね！」と共感する', delta: { fun: 4, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'photo_request',
    title: '写真を撮りましょうか？',
    description: '景色のいいホールに来た。相手が「いい景色だな」と呟いた。',
    stage: 2,
    choices: [
      { text: '「写真撮りましょうか！」とスマホを構える', delta: { fun: 5, trust: 2 }, tags: ['safe'] },
      { text: '「ツーショット撮りませんか？」', delta: { fun: 6, trust: 3, creep: 2 }, tags: ['bold'] },
      { text: '「本当ですね」と一緒に眺める', delta: { fun: 3, trust: 3 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'ball_search_help',
    title: '相手のボール探し',
    description: '相手のボールがラフに消えた。「あれ、どこ行った？」と探している。',
    stage: 2,
    choices: [
      { text: '全力でボールを探してあげる', delta: { fun: 4, trust: 4, focus: -3 }, tags: ['over_support'] },
      { text: '「あの辺じゃないですか？」と方向だけ伝える', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: 'こっそり自分のボールを相手のボールとして置く', delta: { fun: 5, creep: 12, trust: -3 }, tags: ['cheat_physical'] },
    ],
  },

  // ============================================================
  //  STAGE 3 — トラブル本格化（10本）
  // ============================================================

  // ===== 必須 D: キャディ口裏合わせ =====
  {
    id: 'caddy_conspire',
    title: 'キャディさんとの密談',
    description: '相手がさっきOBを打ったのにスコアに入れ忘れている。相手がトイレに行った隙にキャディに「さっきのOB、黙っておいて」と頼めるチャンスだ。',
    stage: 3,
    choices: [
      { text: 'キャディに口裏合わせを頼む', delta: { focus: 8, creep: 18, trust: -8 }, tags: ['cheat_physical'] },
      { text: '何も言わず正々堂々プレーする', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: 'キャディに「今日のおすすめ攻略」を聞く', delta: { focus: 5, fun: 3 }, tags: ['safe'] },
    ],
  },
  {
    id: 'rain_start',
    title: '突然の雨',
    description: 'プレー中に突然雨が降り始めた。相手は少し不機嫌そうだ。',
    stage: 3,
    choices: [
      { text: '「雨のゴルフも乙ですよ！」とポジティブに', delta: { fun: 6, trust: 2 }, tags: ['humor', 'hype'] },
      { text: '自分の傘を相手に差し出す', delta: { trust: 5, fun: 3, focus: -3 }, tags: ['over_support'] },
      { text: '「雨脚が強いうちは待った方が早いですよ」と休憩を提案する', delta: { trust: 3, fun: 1, focus: 5 }, tags: ['logic', 'safe'] },
    ],
  },
  {
    id: 'green_line_step',
    title: 'パットライン事件',
    description: '相手のパット前、あなたが相手のラインを踏みそうな位置にいる。相手がちらっとこちらを見た。',
    stage: 3,
    choices: [
      { text: '気づいてすぐ大きく迂回する', delta: { trust: 4, fun: -1 }, tags: ['etiquette', 'honesty'] },
      { text: 'そのまま気にせず歩く', delta: { trust: -5, creep: 5 }, tags: ['neutral'] },
      { text: '「あぶない！ライン大事ですもんね」と笑って避ける', delta: { fun: 3, trust: 1 }, tags: ['humor'] },
    ],
  },
  {
    id: 'slow_play_pressure',
    title: 'スロープレー警告',
    description: 'マーシャルに「少しペースを上げてください」と言われた。相手が気まずそうだ。',
    stage: 3,
    choices: [
      { text: '「すみません、自分のせいです」と庇う', delta: { trust: 6, fun: 2, focus: -3 }, tags: ['honesty'] },
      { text: '「テンポよくいきましょう！」と切り替える', delta: { fun: 4, focus: 5 }, tags: ['bold'] },
      { text: '「マーシャルもうるさいですねぇ」と愚痴る', delta: { fun: 3, trust: -2, creep: 2 }, tags: ['humor'] },
    ],
  },
  {
    id: 'lost_ball_gray',
    title: '相手のロストボール？',
    description: '相手のボールが見つからない。ロスト宣告の3分が迫る。あなたの足元に似たボールが…',
    stage: 3,
    choices: [
      { text: '「これじゃないですか？」と指差す（実は違うボール）', delta: { fun: 5, creep: 10, trust: -2 }, tags: ['cheat_physical'] },
      { text: '「残念ですけど暫定球で行きましょう」と正直に', delta: { trust: 4, fun: -1 }, tags: ['honesty'] },
      { text: '制限時間ギリギリまで一緒に探す', delta: { trust: 5, fun: 2, focus: -5 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'wind_club_advice',
    title: '相手のクラブ選び',
    description: '強い向かい風。相手が「何番で打とうか…」と迷っている。',
    stage: 3,
    choices: [
      { text: '「1番手上げた方がいいかもですね」とアドバイス', delta: { fun: 3, trust: 4, focus: 3 }, tags: ['serious'] },
      { text: '「風に負けない気合で！」と精神論', delta: { fun: 5, trust: 1 }, tags: ['humor', 'bold'] },
      { text: '「お好きなクラブでどうぞ」と任せる', delta: { fun: 1, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'waiting_group',
    title: '前の組待ち',
    description: '前の組が詰まっている。待ち時間が長い。相手がイライラし始めた。',
    stage: 3,
    choices: [
      { text: '「こういう時こそ雑談しましょう！」', delta: { fun: 6, trust: 3 }, tags: ['humor'] },
      { text: '「素振りでもしてウォームアップしましょう」', delta: { fun: 2, trust: 2, focus: 5 }, tags: ['serious'] },
      { text: '「前の組に声かけてきましょうか？」', delta: { fun: -1, trust: -2, creep: 4 }, tags: ['bold'] },
      { text: '静かに待つ', delta: { trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'club_wipe_service',
    title: '相手のクラブを拭く',
    description: '相手がショット後、泥だらけのクラブを持っている。あなたのタオルは綺麗だ。',
    stage: 3,
    choices: [
      { text: '「拭きますよ！」とクラブを受け取って拭く', delta: { fun: 4, trust: 2, creep: 5 }, tags: ['over_support'] },
      { text: '自分のタオルをさりげなく差し出す', delta: { trust: 4, fun: 2 }, tags: ['etiquette'] },
      { text: '何もしない（キャディの仕事だ）', delta: { trust: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'opponent_triple',
    title: '相手のトリプルボギー',
    description: '相手が珍しく大叩きした。明らかに落ち込んでいる。',
    stage: 3,
    choices: [
      { text: '「ゴルフはこういうのがあるから面白い！」', delta: { fun: 5, trust: 4 }, tags: ['humor'] },
      { text: '「自分なんて毎ホールこうですよ」と自虐', delta: { fun: 6, trust: 3 }, tags: ['humor'] },
      { text: '黙って次のホールに向かう', delta: { trust: 3, fun: -1 }, tags: ['serious'] },
      { text: '「大丈夫！まだ全然取り返せます！」', delta: { fun: 4, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'opponent_ball_mark',
    title: '相手のボールマーク',
    description: 'グリーン上に大きなピッチマーク。相手のボールが作ったものだが、本人は気づいていない。',
    stage: 3,
    choices: [
      { text: 'さりげなく自分が直しておく', delta: { trust: 4, fun: 1, focus: 1 }, tags: ['etiquette'] },
      { text: '「ここ、マークありますよ」と本人に気づかせる', delta: { trust: 3, fun: 1, focus: 2 }, tags: ['honesty'] },
      { text: '「今日はグリーン荒れてますね」と場全体の話にして空気で伝える', delta: { trust: 2, fun: 4, creep: 1 }, tags: ['humor', 'distance'] },
    ],
  },

  // ============================================================
  //  STAGE 4 — スコアごまかし・バンカー・空気読み（10本）
  // ============================================================

  // ===== 必須 B: スコア虚偽申告 =====
  {
    id: 'score_lie',
    title: 'えっと…ボギーだったかな？',
    description: 'ホールアウト後、相手が「えっと…ボギーだったかな？」と呟く。あなたは見ていた。実際はトリプルボギーだった。',
    stage: 4,
    choices: [
      { text: '「ボギーでしたね！」と嘘で合わせてあげる', delta: { fun: 5, creep: 12, trust: -5 }, tags: ['cheat_score'] },
      { text: '「トリプルボギーだったと思いますよ」と正直に', delta: { trust: 8, fun: -3 }, tags: ['honesty'] },
      { text: '「ダブルボギーくらいですかね…」と曖昧に', delta: { fun: 3, creep: 5, trust: -2 }, tags: ['cheat_score', 'safe'] },
      { text: '「キャディさん、いくつでしたっけ？」と委ねる', delta: { trust: 4, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'bunker_trouble',
    title: '相手のバンカー苦戦',
    description: '相手がバンカーに入り3回打っても出ない。焦りと恥ずかしさが見える。',
    stage: 4,
    choices: [
      { text: '「バンカーはプロでも苦労しますよ！」と励ます', delta: { fun: 5, trust: 4 }, tags: ['humor'] },
      { text: '黙って見守る（口を出さない方がいい）', delta: { trust: 3, focus: 3 }, tags: ['serious'] },
      { text: '相手が目を離した隙にボールをバンカー縁へ蹴る', delta: { fun: 5, creep: 12, trust: -3 }, tags: ['cheat_physical'] },
      { text: '「フェース開いて打つといいらしいですよ」', delta: { fun: 2, trust: 2, creep: 2 }, tags: ['serious'] },
    ],
  },
  {
    id: 'opponent_irritated',
    title: '相手の機嫌が悪い',
    description: '相手が連続ボギーでイライラしている。雰囲気が重い。',
    stage: 4,
    choices: [
      { text: '「今日は風が強いですからね」と外的要因のせいにする', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: '「次のホール、勝負しましょう！」と気分転換', delta: { fun: 6, trust: 2 }, tags: ['bold'] },
      { text: '黙ってプレーに集中する', delta: { trust: 3, focus: 5 }, tags: ['serious'] },
      { text: '「すごいアイアンショットさっきありましたよ！」', delta: { fun: 5, trust: 1, creep: 2 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'ob_borderline',
    title: '相手のOB際どいボール',
    description: '相手のボールが白杭ギリギリに止まった。微妙にOBに見えるが…',
    stage: 4,
    choices: [
      { text: '「セーフですよ！ギリギリ！」と甘く判定', delta: { fun: 5, trust: 1, creep: 8 }, tags: ['cheat_score'] },
      { text: '「キャディさん、どう見えます？」と第三者に委ねる', delta: { trust: 4, fun: 1 }, tags: ['honesty'] },
      { text: '「際どいですね…」と相手に判断させる', delta: { trust: 2, fun: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'double_hit',
    title: '相手の二度打ち疑惑',
    description: '相手のショットが変な音を立てた。二度打ちしたかもしれない。相手は気づいていない。あなただけが見た。',
    stage: 4,
    choices: [
      { text: '「今、二度打ちだったかもしれませんね…」と正直に伝える', delta: { trust: 8, fun: -3, creep: -3 }, tags: ['honesty'] },
      { text: '何も言わずスルーしてあげる', delta: { fun: 3, creep: 5, trust: -1 }, tags: ['cheat_score'] },
      { text: '「変な音しましたね！芝のせいかな？」とぼかす', delta: { fun: 4, creep: 3, trust: -1 }, tags: ['humor'] },
    ],
  },
  {
    id: 'companion_mood',
    title: '同伴者の空気',
    description: '4人プレーの別の同伴者が明らかにつまらなそうにしている。相手も気にしている。',
    stage: 4,
    choices: [
      { text: 'その人にも積極的に話しかける', delta: { fun: 4, trust: 4 }, tags: ['etiquette'] },
      { text: '相手だけに集中する（接待対象だから）', delta: { fun: 2, trust: -1, focus: 5 }, tags: ['serious'] },
      { text: '「○○さんも調子どうですか？」とさりげなく', delta: { fun: 5, trust: 3 }, tags: ['safe'] },
    ],
  },
  {
    id: 'praise_textbook',
    title: '褒めエスカレート',
    description: '相手のパットが入った。どんどん褒めが過激になってきた自分。止まるか？',
    stage: 4,
    choices: [
      { text: '「もはや芸術です！これ、教科書に載せたい！」', delta: { fun: 8, trust: -1, creep: 8 }, tags: ['flattery', 'over_support'] },
      { text: '「ナイスパット」と落ち着いて', delta: { fun: 3, trust: 4 }, tags: ['safe'] },
      { text: '「読みが完璧ですね。ラインの見方教えてください」', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'rough_ball_nudge',
    title: '相手のラフのボール',
    description: '相手のボールが深いラフに埋まっている。先に見つけたあなた、足で少し浮かせてあげられる。',
    stage: 4,
    choices: [
      { text: '足で少し浮かせてから「ここです！」と呼ぶ', delta: { fun: 5, creep: 12, trust: -2 }, tags: ['cheat_physical'] },
      { text: '「ここです！ちょっと沈んでますね…」と正直に', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '「ラフですけどいいライですよ！」とポジティブに', delta: { fun: 4, trust: 2 }, tags: ['humor'] },
    ],
  },
  {
    id: 'opponent_work_grumble',
    title: '相手の仕事の愚痴',
    description: '相手がプレー中にぼそっと「最近、部下が使えなくてさ…」と漏らした。',
    stage: 4,
    choices: [
      { text: '「大変ですね…」と真剣に聞く', delta: { trust: 5, fun: -1 }, tags: ['serious'] },
      { text: '「ゴルフで発散しましょう！」と切り替える', delta: { fun: 5, trust: 2 }, tags: ['humor'] },
      { text: '「わかります！自分もですよ！」と共感する', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: '「でも○○さんの下で働けるのは幸せですよ」', delta: { fun: 3, trust: 1, creep: 4 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'mulligan_offer',
    title: '相手にマリガン提案',
    description: '相手のティーショットが大きくスライスした。「マリガンいきましょうか？」と言えるが…',
    stage: 4,
    choices: [
      { text: '「マリガンで！もう1球いきましょう！」', delta: { fun: 6, trust: 2, creep: 5 }, tags: ['cheat_score', 'over_support'] },
      { text: '何も言わない（マリガンは邪道）', delta: { trust: 4, fun: -1 }, tags: ['honesty'] },
      { text: '「まだ行けますよ！あの辺に落ちてるかも」と励ます', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
    ],
  },

  // ============================================================
  //  STAGE 5 — 昼食・酒・休憩（12本）
  // ============================================================

  // ===== 必須 C: 信頼回復イベント =====
  {
    id: 'wallet_honesty',
    title: '昨夜の財布事件',
    description: '「昨夜、財布落としたんだよね。まぁゴルフ優先で来ちゃった」と相手が言う。',
    stage: 5,
    choices: [
      { text: '「一緒に探しましょう！ゴルフより大事です」', delta: { trust: 15, fun: -5, focus: -8 }, tags: ['honesty', 'serious'] },
      { text: '「大丈夫ですよ、きっと届けられてます！」', delta: { fun: 3, trust: -2 }, tags: ['safe'] },
      { text: '「帰りに交番寄りましょう。届け出手伝います」', delta: { trust: 12, fun: 2 }, tags: ['honesty'] },
      { text: '「財布より今日のスコアの方が問題ですよ！」と笑う', delta: { fun: 8, trust: -3, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'business_talk',
    title: 'カートでの商談トーク',
    description: '移動中に相手が「ところで例の案件だけど…」とビジネスの話を切り出した。',
    // カート移動中の場面なので stage 6。stage 5 は「昼食の追加会話」ビート専用
    stage: 6,
    choices: [
      { text: '真剣にビジネスの話に応じる', delta: { trust: 5, fun: -3, focus: 5 }, tags: ['serious'] },
      { text: '「まずはゴルフを楽しみましょう！仕事は後で！」', delta: { fun: 5, trust: -1 }, tags: ['humor'] },
      { text: '「もちろん！お任せください！」と全肯定', delta: { fun: 3, trust: 2, creep: 3 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'lunch_break',
    title: '昼食タイム',
    description: 'ハーフ終了後の昼食。相手が「好きなもの頼んでいいよ」と言う。',
    stage: 5,
    choices: [
      { text: '相手と同じものを頼む', delta: { fun: 3, trust: 2 }, tags: ['safe'] },
      { text: '一番高いステーキを頼む', delta: { fun: 5, creep: 5, trust: -2 }, tags: ['bold'] },
      { text: '「おすすめは何ですか？」と相手に聞く', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'beer_first',
    title: '昼ビール',
    description: '相手が「ビール飲む？」と聞いてきた。午後のプレーもあるが…',
    stage: 5,
    choices: [
      { text: '「いただきます！」と一緒に飲む', delta: { fun: 8, trust: 4, focus: -5 }, tags: ['alcohol'] },
      { text: '「午後もあるのでウーロン茶で」と断る', delta: { trust: 2, fun: -2, focus: 5 }, tags: ['serious'] },
      { text: '「じゃあ一杯だけ！」と控えめに', delta: { fun: 5, trust: 3, focus: -2 }, tags: ['alcohol', 'safe'] },
    ],
  },
  {
    id: 'sake_pressure',
    title: '日本酒の追加',
    description: '相手がいい気分になって「日本酒もいこうか！」と追加を勧めてくる。',
    stage: 5,
    choices: [
      { text: '「最高ですね！いきましょう！」', delta: { fun: 10, trust: 5, focus: -10, creep: 2 }, tags: ['alcohol', 'bold'] },
      { text: '「さすがにちょっと…午後がヤバくなります」', delta: { trust: 3, fun: -2, focus: 3 }, tags: ['honesty'] },
      { text: '「○○さんが飲むなら付き合います！」', delta: { fun: 6, trust: 2, focus: -6, creep: 3 }, tags: ['alcohol', 'flattery'] },
    ],
  },
  {
    id: 'drunk_praise',
    title: '酔った勢いの褒め',
    description: 'すでに3杯目。相手はかなり上機嫌で声も大きくなっている。場も少し緩んできた。あなたはどう振る舞う？',
    stage: 5,
    choices: [
      { text: '「○○さんと回れて本当に光栄です！」', delta: { fun: 6, trust: 3, creep: 3 }, tags: ['alcohol', 'flattery'] },
      { text: '「○○さんの経営理念、本にしてほしいです！」', delta: { fun: 8, trust: -1, creep: 8 }, tags: ['alcohol', 'flattery', 'over_support'] },
      { text: '「いい酒ですね。午後も頑張りましょう」と締める', delta: { fun: 4, trust: 4 }, tags: ['alcohol', 'safe'] },
    ],
  },
  {
    id: 'lunch_bill',
    title: '昼食の会計',
    description: '昼食の伝票が来た。相手が財布を出そうとしている。',
    stage: 5,
    choices: [
      { text: '「ここは自分が！」と先にレジへ走る', delta: { fun: 4, trust: 3, creep: 3 }, tags: ['over_support'] },
      { text: '「ありがとうございます」とご馳走になる', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: '「割り勘にしましょう」と提案', delta: { trust: 4, fun: -1 }, tags: ['honesty'] },
      { text: '「ここは持ちますので、帰りのお茶はお願いします」', delta: { trust: 5, fun: 3 }, tags: ['etiquette'] },
    ],
  },
  {
    id: 'alcohol_confession',
    title: '相手の酒の本音',
    description: '酒が入って相手が「実はうちの会社、ちょっと大変でさ…」とポロリ。',
    stage: 5,
    choices: [
      { text: '「何かお力になれることがあれば」と真剣に聞く', delta: { trust: 10, fun: -2 }, tags: ['alcohol', 'honesty', 'serious'] },
      { text: '「大丈夫ですよ！○○さんなら乗り越えられます」', delta: { fun: 5, trust: 3, creep: 2 }, tags: ['alcohol', 'flattery'] },
      { text: '「午後いいプレーで気分転換しましょう！」', delta: { fun: 6, trust: 1 }, tags: ['alcohol', 'humor'] },
    ],
  },
  {
    id: 'opponent_lunch_mood',
    title: '相手の昼食中の表情',
    description: '昼食中、相手が箸を止めてスコアカードを眺めている。前半のスコアが気になるようだ。',
    stage: 5,
    choices: [
      { text: '「後半は別のゲームですよ！切り替えましょう」', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '「前半のあのバーディ、本当にすごかったです」と良い記憶を引き出す', delta: { fun: 6, trust: 4 }, tags: ['flattery'] },
      { text: '「スコアより今日の時間を楽しみましょう」', delta: { fun: 4, trust: 5 }, tags: ['honesty'] },
    ],
  },
  {
    id: 'alcohol_wobble',
    title: '相手の足元がふらつく',
    description: '昼の酒が相手に効いてきた。カートから降りる時にふらっとした。',
    stage: 5,
    choices: [
      { text: '「大丈夫ですか？」とさりげなく手を添える', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '「効いてきましたね！笑」と笑い飛ばす', delta: { fun: 6, trust: 2, creep: 2 }, tags: ['alcohol', 'humor'] },
      { text: '「水を飲んでからにしましょう」と率直に止める', delta: { trust: 3, fun: 1, focus: 3 }, tags: ['honesty'] },
    ],
  },
  {
    id: 'trust_recovery_family',
    title: '相手からの家族の話',
    description: '相手が「お子さん何歳？」と聞いてきた。プライベートな話題だ。',
    stage: 5,
    choices: [
      { text: '素直に家族の話をする', delta: { trust: 8, fun: 3 }, tags: ['honesty'] },
      { text: '「娘がゴルフやりたいって言ってて」と関連話題に', delta: { fun: 6, trust: 5 }, tags: ['honesty', 'humor'] },
      { text: '「仕事の話に戻りましょうか」とかわす', delta: { trust: -3, fun: -2 }, tags: ['serious'] },
    ],
  },
  {
    id: 'afternoon_toast',
    title: '午後の乾杯',
    description: '午後スタート前に相手が「もう一杯だけ！」とハイボールを頼もうとしている。',
    stage: 5,
    choices: [
      { text: '「いきましょう！乾杯！」', delta: { fun: 8, trust: 4, focus: -8 }, tags: ['alcohol', 'bold'] },
      { text: '「自分はスポドリで乾杯します！」', delta: { fun: 3, trust: 2, focus: 3 }, tags: ['safe'] },
      { text: '「帰りの運転大丈夫ですか？」と心配する', delta: { trust: 5, fun: -3 }, tags: ['honesty', 'serious'] },
    ],
  },

  // ============================================================
  //  STAGE 6 — 違和感が効く・やりすぎ注意（9本）
  // ============================================================

  // ===== 必須 E: スコアカード改ざん =====
  {
    id: 'scorecard_tamper',
    title: '相手のスコアカード',
    description: '昼休憩中、スコアカードを見ると相手のスコアが酷い。相手が席を外している間に数字を良く書き直してあげられそうだが…',
    stage: 6,
    choices: [
      { text: '相手のスコアをこっそり良く書き直す', delta: { fun: 5, creep: 20, trust: -10 }, tags: ['cheat_score'] },
      { text: 'そのまま正直に残す', delta: { trust: 6, fun: -2 }, tags: ['honesty'] },
      { text: '「午後は巻き返しましょう！」とポジティブ宣言', delta: { fun: 5, trust: 2, focus: 3 }, tags: ['bold', 'humor'] },
    ],
  },
  {
    id: 'rival_encounter',
    title: '相手のライバル登場',
    description: '隣のコースで相手の商売敵がプレーしている。相手の表情が少し硬くなった。',
    stage: 6,
    choices: [
      { text: '「気にせず自分たちのゴルフを楽しみましょう」', delta: { fun: 3, trust: 5 }, tags: ['serious'] },
      { text: '「あの人よりスコア良いですよ、絶対！」とおだてる', delta: { fun: 5, trust: 1, creep: 3 }, tags: ['flattery'] },
      { text: '「今度あの方ともご一緒しましょうか？」', delta: { trust: -3, creep: 5, fun: -2 }, tags: ['bold'] },
    ],
  },
  {
    id: 'afternoon_fatigue',
    title: '相手の午後の疲れ',
    description: '午後に入り相手のペースが明らかに落ちてきた。少しだるそうだ。',
    stage: 6,
    choices: [
      { text: '「エナジードリンク買ってきますよ！」', delta: { fun: 5, trust: 2, creep: 2 }, tags: ['over_support'] },
      { text: '「踏ん張りどころですね！」と気合を入れ合う', delta: { fun: 4, trust: 3, focus: 3 }, tags: ['bold'] },
      { text: '自分もペースを落として相手に合わせる', delta: { trust: 4, fun: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'praise_philosophy',
    title: '褒め崩壊寸前',
    description: '相手のパーセーブ。あなたの褒めがもう手に負えないレベルに。',
    stage: 6,
    choices: [
      { text: '「その精神、自社の経営理念にしたいです！」', delta: { fun: 10, trust: -5, creep: 12 }, tags: ['flattery', 'over_support'] },
      { text: '「ナイスパー！安定してますね」と控えめに', delta: { fun: 3, trust: 5 }, tags: ['safe'] },
      { text: '「やっぱりすごいなぁ」と素直に感嘆', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'suspicious_glance',
    title: '怪しまれている？',
    description: '相手がプレー中にじっとこちらを見ている。何か気づかれたか…？',
    stage: 6,
    choices: [
      { text: '「何か気になることありますか？」と直接聞く', delta: { trust: 6, fun: -2, creep: -5 }, tags: ['honesty'] },
      { text: '気にせず普通にプレーする', delta: { trust: 2, focus: 3 }, tags: ['safe'] },
      { text: '「あ、日焼け止め塗り直します？」と話題をそらす', delta: { fun: 2, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'drop_zone_cheat',
    title: '相手のドロップ位置',
    description: '相手のペナルティドロップ。正規の位置より10ヤードほど良い場所にドロップさせてあげられる。',
    stage: 6,
    choices: [
      { text: '「この辺でいいんじゃないですか？」と良い位置を指す', delta: { fun: 5, creep: 10, trust: -3 }, tags: ['cheat_physical'] },
      { text: '「キャディさん、正しい位置どこですか？」', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '口を出さない', delta: { trust: 2, fun: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'opponent_silent_6',
    title: '相手が無言になった',
    description: '後半に入り、相手が急に黙り込んだ。スコアが悪いせいか、何か気に障ったか。',
    stage: 6,
    choices: [
      { text: '「大丈夫ですか？何か気になることが？」', delta: { trust: 5, fun: -1 }, tags: ['honesty', 'serious'] },
      { text: '黙ってそっとしておく', delta: { trust: 3, fun: -2 }, tags: ['safe'] },
      { text: '「次のホール、面白い攻め方知ってますよ！」と盛り上げる', delta: { fun: 6, trust: 2 }, tags: ['humor'] },
      { text: '「お疲れなら少し休みませんか？」', delta: { trust: 4, fun: 1 }, tags: ['etiquette'] },
    ],
  },
  {
    id: 'wrong_ball',
    title: '相手の誤球',
    description: '相手がラフから打ったボール、よく見ると別の人のボールだった。相手はまだ気づいていない。',
    stage: 6,
    choices: [
      { text: '「あ、それ違うボールかもしれません…」と伝える', delta: { trust: 6, fun: -1 }, tags: ['honesty'] },
      { text: '黙ってやり過ごす（ペナルティを避けてあげる）', delta: { fun: 3, creep: 10, trust: -3 }, tags: ['cheat_score'] },
      { text: '「ボール似てますもんね、紛らわしい！」とフォローしつつ伝える', delta: { trust: 5, fun: 3 }, tags: ['honesty', 'humor'] },
    ],
  },
  {
    id: 'score_counting_pressure',
    title: '相手のスコア確認',
    description: '相手が「今の自分いくつだっけ？ちゃんと数えてた？」と聞いてきた。実際より1打多かった気がする。',
    stage: 6,
    choices: [
      { text: '「1打多かったと思いますよ」と正直に伝える', delta: { trust: 5, fun: -1 }, tags: ['honesty'] },
      { text: '「合ってますよ！」と少なめに答えてあげる', delta: { fun: 3, creep: 4, trust: -1 }, tags: ['cheat_score'] },
      { text: '「キャディさんに確認しましょう」と委ねる', delta: { trust: 4, fun: 1 }, tags: ['safe'] },
    ],
  },

  // ============================================================
  //  STAGE 7 — 事故りやすい・過剰接待ゾーン（9本）
  // ============================================================

  // ===== 必須 F: 池ポチャ救出ダイブ =====
  {
    id: 'pond_dive',
    title: '池ポチャ救出劇',
    description: '相手のお気に入りボールが池に落ちた。「あのボール好きだったんだよな…」',
    stage: 7,
    choices: [
      { text: '靴を脱いで池に飛び込みボールを拾う', delta: { fun: 10, trust: 3, creep: 12, focus: -10 }, tags: ['over_support', 'bold'] },
      { text: '「新しいボールありますよ！どうぞ使ってください」', delta: { fun: 5, trust: 5 }, tags: ['safe'] },
      { text: 'キャディに網で取ってもらうよう頼む', delta: { fun: 2, trust: 2 }, tags: ['neutral'] },
      { text: '「あのボール、自分が念力で引き寄せます！」とボケる', delta: { fun: 8, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'cup_pull_etiquette',
    title: '相手のパット、旗抜き',
    description: '相手のパット。旗を抜くべきタイミング。さりげない所作が問われる。',
    stage: 7,
    choices: [
      { text: 'タイミングよく旗を抜き、静かに保持する', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '旗を抜くのを忘れて慌てる', delta: { trust: -2, fun: 3 }, tags: ['humor'] },
      { text: '旗を抜いた後、「右かな？」とラインを読んであげる', delta: { fun: 3, trust: 1, creep: 4 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'umbrella_service',
    title: '相手への傘係',
    description: '小雨が再び降り始めた。あなたは傘を2本持っている。',
    stage: 7,
    choices: [
      { text: '相手のショット中、傘をさしてあげる', delta: { fun: 5, trust: 3, creep: 6 }, tags: ['over_support'] },
      { text: '「傘どうぞ」と1本渡す', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '自分だけ傘をさす（相手は帽子がある）', delta: { fun: -2, trust: -1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'opponent_anger_burst',
    title: '相手の爆発',
    description: '相手がミスショット連発で「くそっ！」とクラブを地面に叩きつけた。',
    stage: 7,
    choices: [
      { text: '黙って見守る。落ち着くまで待つ', delta: { trust: 5, fun: -2 }, tags: ['serious'] },
      { text: '「そういう時もありますよ。切り替えましょう」', delta: { fun: 3, trust: 4 }, tags: ['safe'] },
      { text: '「ナイスファイト！その悔しさが大事です！」', delta: { fun: 5, trust: 1, creep: 3 }, tags: ['bold', 'flattery'] },
      { text: '「深呼吸しましょう。吸って〜吐いて〜」', delta: { fun: 6, trust: 2, creep: 2 }, tags: ['humor'] },
    ],
  },
  {
    id: 'score_memory_gray',
    title: '相手のスコア記憶違い',
    description: '相手が「前のホール、自分6だったよね？」と聞いてくる。実際は7だった気がするが…',
    stage: 7,
    choices: [
      { text: '「7だったと思いますよ」と正直に', delta: { trust: 6, fun: -3 }, tags: ['honesty'] },
      { text: '「6でしたね！」と合わせてあげる', delta: { fun: 3, creep: 8, trust: -3 }, tags: ['cheat_score'] },
      { text: '「ちょっと自信ないですね…キャディさん？」と委ねる', delta: { trust: 4, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'opponent_work_call',
    title: '相手に仕事の電話',
    description: '相手のスマホが鳴った。「ごめん、ちょっと出ていい？」と申し訳なさそうだ。',
    stage: 7,
    choices: [
      { text: '「もちろん！ゆっくりどうぞ」と快く待つ', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '「大事な電話なら先に進んでますね！」と気を遣う', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['bold'] },
      { text: '電話中にこっそり相手のスコアを良く書き直す', delta: { creep: 15, trust: -5, focus: 5 }, tags: ['cheat_score'] },
    ],
  },
  {
    id: 'excessive_bow',
    title: '過剰なお辞儀',
    description: '相手のナイスショット後。何度もお辞儀しそうになる自分。',
    stage: 7,
    choices: [
      { text: '普通に「ナイスショット！」と声をかける', delta: { fun: 3, trust: 4 }, tags: ['safe'] },
      { text: '「素晴らしい！本当に素晴らしい！」と何度も頭を下げる', delta: { fun: 5, trust: -3, creep: 10 }, tags: ['over_support', 'flattery'] },
      { text: '拍手だけ。言葉は不要', delta: { trust: 3, fun: 2 }, tags: ['serious'] },
    ],
  },
  {
    id: 'tee_peg_pickup',
    title: '相手の折れたティー',
    description: '相手のティーショット後、折れたティーが飛んだ。拾うべきか。',
    stage: 7,
    choices: [
      { text: 'さりげなく拾ってポケットに入れる', delta: { trust: 3, fun: 1 }, tags: ['etiquette'] },
      { text: '「ティーどうぞ！」と新品を差し出す', delta: { fun: 3, trust: 2, creep: 2 }, tags: ['over_support'] },
      { text: '気にしない', delta: {}, tags: ['neutral'] },
    ],
  },
  {
    id: 'trust_recovery_mistake',
    title: '相手の飲み物をこぼす',
    description: 'カート移動中、段差でガタン！相手の飲み物がこぼれた。相手が少し驚いている。',
    stage: 7,
    choices: [
      { text: '「すみません！新しいの買ってきます！」と全力謝罪', delta: { trust: 8, fun: 2, creep: -3 }, tags: ['honesty', 'etiquette'] },
      { text: '「うわ、ごめんなさい！大丈夫ですか？」', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '「このコースの道、酷いですね！」と道のせいにする', delta: { fun: 3, trust: -3, creep: 3 }, tags: ['humor'] },
    ],
  },

  // ============================================================
  //  STAGE 8 — 終盤の攻防・信頼回復チャンス（8本）
  // ============================================================

  {
    id: 'sunset_approach',
    title: '夕暮れのアプローチ',
    description: '夕日が美しい。相手が「いいコースだったな」と感慨深げだ。',
    stage: 8,
    choices: [
      { text: '「本当に最高の一日でした。ありがとうございます」', delta: { fun: 5, trust: 5 }, tags: ['honesty'] },
      { text: '「また来ましょう！次も楽しみです！」', delta: { fun: 6, trust: 3 }, tags: ['bold', 'humor'] },
      { text: '「この景色、写真撮っていいですか？」', delta: { fun: 3, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'final_stretch_cheat',
    title: '相手のボールが木の根元',
    description: '終盤、相手のボールが木の根元に。あなたが先に見つけた。少し動かせば打ちやすくなる。',
    stage: 8,
    choices: [
      { text: '足で少し蹴って打ちやすい位置に動かしてあげる', delta: { fun: 5, creep: 15, trust: -5 }, tags: ['cheat_physical'] },
      { text: '「ここです。ちょっと厳しい位置ですね…」と正直に', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '「アンプレ宣言した方がいいかもですね」とアドバイス', delta: { trust: 4, fun: 2 }, tags: ['serious'] },
    ],
  },
  {
    id: 'trust_recovery_honest_score',
    title: '相手のスコア申告ミス',
    description: '相手が「このホール、パーだね」と言ったが、あなたの記憶では実際はボギーだった。相手に有利なミスだ。',
    stage: 8,
    choices: [
      { text: '「ボギーだったと思いますよ」と正直に伝える', delta: { trust: 12, fun: -2, creep: -5 }, tags: ['honesty'] },
      { text: 'そのまま「パーでしたね！」と合わせてあげる', delta: { fun: 3, creep: 8, trust: -3 }, tags: ['cheat_score'] },
      { text: '「あれ？一打多かった気がしますが…キャディさん？」', delta: { trust: 5, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'opponent_good_mood',
    title: '相手が上機嫌',
    description: '終盤に相手がバーディ。「今日は来てよかった！」と上機嫌だ。',
    stage: 8,
    choices: [
      { text: '「○○さんのおかげで最高の一日です！」', delta: { fun: 6, trust: 4 }, tags: ['flattery'] },
      { text: '「バーディおめでとうございます！乾杯しましょう！」', delta: { fun: 8, trust: 3, focus: -3 }, tags: ['bold', 'alcohol'] },
      { text: '「次回もぜひお願いします」とさりげなく次を約束', delta: { trust: 5, fun: 3 }, tags: ['safe'] },
    ],
  },
  {
    id: 'alcohol_aftermath',
    title: '相手に酒が祟る',
    description: '終盤、昼の酒が相手に完全に効いている。パットの距離感が合わず苦笑いしている。',
    stage: 8,
    choices: [
      { text: '「お互い飲みすぎましたね！笑」と一緒に笑う', delta: { fun: 6, trust: 4 }, tags: ['alcohol', 'humor'] },
      { text: '「水飲んで落ち着きましょう」とケアする', delta: { trust: 5, fun: 2 }, tags: ['alcohol', 'safe'] },
      { text: '「このパット、OKにしちゃいましょう！」とOK出す', delta: { fun: 5, trust: 2, creep: 5 }, tags: ['alcohol', 'cheat_score'] },
    ],
  },
  {
    id: 'trust_recovery_caddy_thanks',
    title: 'キャディへの感謝',
    description: '18ホール近く。キャディさんが「今日は楽しかったです」と。相手も聞いている。',
    stage: 8,
    choices: [
      { text: '「こちらこそ！本当にありがとうございました」と深くお辞儀', delta: { trust: 8, fun: 3, creep: -3 }, tags: ['etiquette', 'honesty'] },
      { text: '「○○さんのおかげで楽しかったですよね！」', delta: { fun: 5, trust: 3, creep: 2 }, tags: ['flattery'] },
      { text: 'チップを多めに渡す', delta: { fun: 2, trust: 3, creep: 2 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'final_score_compare',
    title: '相手のスコア不安',
    description: '残り2ホール。相手が「今日ダメだったなぁ…何打だろう」と落ち込みながらスコアを数え始めた。',
    stage: 8,
    choices: [
      { text: '「まだ2ホールありますよ！」と励ます', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '「スコアより楽しい一日でしたよ」と切り替える', delta: { trust: 5, fun: 4 }, tags: ['honesty'] },
      { text: '「2、3打少なく数えときましょうか？笑」と冗談めかす', delta: { fun: 6, trust: -1, creep: 5 }, tags: ['cheat_score', 'humor'] },
    ],
  },
  {
    id: 'trust_recovery_apology',
    title: '相手をねぎらう',
    description: '終盤、相手がため息をつく。「今日は調子出なかったな…」とスコアに落ち込んでいる。',
    stage: 8,
    choices: [
      { text: '「スコアじゃなく、一緒に回れたことが嬉しいです」と伝える', delta: { trust: 10, fun: 3, creep: -3 }, tags: ['honesty', 'etiquette'] },
      { text: '「次こそリベンジしましょう！」と前向きに', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「いや、あのバーディはすごかったですよ！」とハイライトを振り返る', delta: { fun: 5, trust: 4 }, tags: ['flattery'] },
    ],
  },

  // ============================================================
  //  STAGE 9 — 締め・エモ・表彰・帰り際（8本）
  // ============================================================

  {
    id: 'last_putt',
    title: '相手の最終パット',
    description: '最後のホール。相手に2mのパットが残った。入ればパーだが、微妙な距離だ。',
    // プレー中の場面なので stage 8（終盤）。stage 9 は「ラウンド後の締め」ビート専用
    stage: 8,
    choices: [
      { text: '「OK！入ったことにしましょう！」とOKを出す', delta: { fun: 5, trust: 3, creep: 5 }, tags: ['cheat_score'] },
      { text: '「最後はびしっと決めてください！」と見守る', delta: { trust: 5, fun: 4 }, tags: ['honesty', 'bold'] },
      { text: '「このパット入ったら打ち上げ奢りますよ！」と盛り上げる', delta: { fun: 8, trust: 2, creep: 2 }, tags: ['humor', 'bold'] },
    ],
  },
  {
    id: 'scoring_table',
    title: '最終スコア集計',
    description: 'ラウンド終了。スコアカードを最終集計する。相手のスコアが微妙に合っていない…2打少ない気がする。',
    stage: 9,
    choices: [
      { text: '「ここ、計算合ってないかもしれません」と指摘する', delta: { trust: 6, fun: -1 }, tags: ['honesty'] },
      { text: 'そのまま署名する（相手に有利なまま）', delta: { fun: 3, creep: 8, trust: -3 }, tags: ['cheat_score'] },
      { text: '「細かいこと気にせず楽しかったです！」と流す', delta: { fun: 5, trust: 1, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'bath_house_chat',
    title: '風呂トーク',
    description: 'プレー後のお風呂。相手と並んで湯船に浸かっている。',
    stage: 9,
    choices: [
      { text: '「いやー気持ちいいですね！最高の一日でした」', delta: { fun: 5, trust: 4 }, tags: ['safe'] },
      { text: '「次はいつ行けますかね？」と次回を打診', delta: { fun: 4, trust: 5 }, tags: ['bold'] },
      { text: '「今日の反省点を活かして次こそは…！」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['serious'] },
      { text: '相手の背中を流しましょうかと申し出る', delta: { fun: 5, trust: -2, creep: 10 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'award_ceremony',
    title: '相手の表彰',
    description: 'コンペ形式の表彰。相手がニアピン賞を取った。',
    stage: 9,
    choices: [
      { text: '心からの拍手を送る', delta: { fun: 4, trust: 5 }, tags: ['etiquette'] },
      { text: '「さすが！あのショットは本当にすごかった！」', delta: { fun: 6, trust: 3 }, tags: ['flattery'] },
      { text: '「悔しい！次こそは自分が！」と健闘を称える', delta: { fun: 5, trust: 2 }, tags: ['bold', 'humor'] },
    ],
  },
  {
    id: 'farewell_gift',
    title: '相手へのお土産',
    description: 'プロショップの前を通りかかった。相手への手土産を買うチャンスだ。',
    stage: 9,
    choices: [
      { text: 'さりげなくボールを1ダース買って渡す', delta: { fun: 5, trust: 5, creep: 2 }, tags: ['etiquette'] },
      { text: '「何かいいですか？」と一緒に見て回る', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: '高級グローブをプレゼントする', delta: { fun: 6, trust: 2, creep: 6 }, tags: ['over_support'] },
      { text: '特に何も買わない', delta: { trust: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'parking_farewell',
    title: '駐車場での別れ',
    description: '帰り際、駐車場で相手と最後の会話。今日の印象が最終的に固まる瞬間。',
    stage: 9,
    choices: [
      { text: '「今日は本当にありがとうございました」と深々お辞儀', delta: { trust: 5, fun: 3 }, tags: ['etiquette', 'honesty'] },
      { text: '「車出るまで見送りますね！」', delta: { fun: 3, trust: 3, creep: 3 }, tags: ['over_support'] },
      { text: '「またやりましょう！連絡します！」', delta: { fun: 5, trust: 4 }, tags: ['bold'] },
      { text: '「お気をつけて！」と手を振る', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
    ],
  },
  {
    id: 'follow_up_promise',
    title: '後日連絡の約束',
    description: '別れ際に相手が「また連絡するよ」と言ってくれた。',
    stage: 9,
    choices: [
      { text: '「ぜひ！楽しみにしてます！」と笑顔で', delta: { fun: 5, trust: 5 }, tags: ['honesty'] },
      { text: '「自分からもご連絡しますね」と積極的に', delta: { fun: 3, trust: 4 }, tags: ['bold'] },
      { text: '「その時はぜひ○○コースに！」と具体的に提案', delta: { fun: 4, trust: 3, creep: 2 }, tags: ['bold', 'flattery'] },
    ],
  },
  {
    id: 'car_send_off',
    title: '最後の見送り',
    description: '相手の車が駐車場から出ようとしている。あなたはまだ残っている。',
    stage: 9,
    choices: [
      { text: '車が見えなくなるまでお辞儀を続ける', delta: { trust: 1, fun: 1, creep: 6 }, tags: ['over_support', 'etiquette'] },
      { text: '手を振って見送る', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '「お気をつけて！」と一礼してさっと自分も帰る', delta: { trust: 4, fun: 1, focus: 2 }, tags: ['etiquette'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 1 — 追加イベント（8本）
  // ============================================================

  {
    id: 'morning_stretch_offer',
    title: 'ストレッチのお誘い',
    description: 'スタート前、相手がカートの横で軽く体を動かしている。準備運動のタイミングだ。',
    stage: 1,
    choices: [
      { text: '「一緒にストレッチしましょう！」と声をかける', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: 'さりげなく相手のストレッチを手伝おうとする', delta: { fun: 3, trust: 2, creep: 3 }, tags: ['over_support'] },
      { text: '「肩周りほぐすといいらしいですよ」と情報提供', delta: { fun: 3, trust: 3 }, tags: ['serious'] },
      { text: '「その柔軟性に全財産賭けます」と感激しすぎる', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'tee_time_waiting',
    title: 'スタート時間待ち',
    description: 'スタートまであと10分。相手と二人でクラブハウス前に立っている。',
    stage: 1,
    choices: [
      { text: '「今日のコースはどんな印象ですか？」と聞く', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: '「今日は絶対楽しいラウンドになりますよ！」と気合を入れる', delta: { fun: 5, trust: 2 }, tags: ['bold'] },
      { text: '静かにコースを眺めて準備を整える', delta: { trust: 2, focus: 5 }, tags: ['serious'] },
    ],
  },
  {
    id: 'scorecard_handover',
    title: 'スコアカードの受け渡し',
    description: 'スタート前にスコアカードを受け取った。どちらが記録するか決めなければならない。',
    stage: 1,
    choices: [
      { text: '「自分が記録しますよ！」と申し出る', delta: { fun: 3, trust: 3 }, tags: ['etiquette'] },
      { text: '「○○さんに任せてもいいですか？」と聞く', delta: { trust: 2, fun: 2 }, tags: ['safe'] },
      { text: '「自分が書く代わりに○○さんの打数は少なめに…笑」とジョークを言う', delta: { fun: 5, trust: 1, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'rival_club_boast',
    title: '相手のゴルフ歴自慢',
    description: '「ゴルフ歴20年になるんだよ」と相手が誇らしげに話す。貫禄がある。',
    stage: 1,
    choices: [
      { text: '「それはすごい！さすがですね！」と素直に感嘆', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
      { text: '「20年！自分の人生そのものですね…」としんみり感動する', delta: { fun: 4, trust: 2 }, tags: ['humor'] },
      { text: '「20年、ですか。……20年。それは、20年ということですよね」と数字を噛みしめ続ける', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
      { text: '「自分もいつか20年続けたいです」と真剣に', delta: { fun: 3, trust: 4 }, tags: ['serious'] },
    ],
  },
  {
    id: 'morning_coffee',
    title: '朝のコーヒー',
    description: 'クラブハウスのカウンターにコーヒーが置いてある。相手に渡すか。',
    stage: 1,
    choices: [
      { text: '「コーヒーどうですか？」とカップを差し出す', delta: { fun: 4, trust: 4 }, tags: ['etiquette'] },
      { text: '自分だけ飲む（相手はもう持っている）', delta: { fun: 1, trust: 1 }, tags: ['neutral'] },
      { text: '「ブラックですか？ミルクですか？砂糖は？甘さは何段階で？豆の種類は？」と細かく聞きすぎる', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'first_swing_comment',
    title: '練習スイングへの反応',
    description: '相手が素振りをした。鋭いスイングだった。どう反応する？',
    stage: 1,
    choices: [
      { text: '「いいスイングですね！」とシンプルに褒める', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '黙って見守る（集中の邪魔をしない）', delta: { trust: 3, focus: 2 }, tags: ['serious'] },
      { text: '「今の素振りだけで、今日は勝てないと分かりました。……いえ、本気で言っています」と真顔で言う', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'handicap_inquiry',
    title: 'ハンデの確認',
    description: '「ハンデいくつ？」と相手が聞いてきた。ゴルフの腕前を測る自然な質問だ。',
    stage: 1,
    choices: [
      { text: '正直にハンデを答える', delta: { trust: 5, fun: 2 }, tags: ['honesty'] },
      { text: '「○○さんより少し多いくらいかな…笑」と謙遜する', delta: { fun: 5, trust: 3 }, tags: ['humor', 'safe'] },
      { text: '「ハンデをいただくのは、こちらが失礼にあたる気がします。……いえ、本当に、結構です」と何度も辞退する', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },
  {
    id: 'glove_compliment',
    title: '相手のグローブ',
    description: '相手が新品の白いグローブをはめている。とても綺麗だ。',
    stage: 1,
    choices: [
      { text: '「きれいなグローブですね」とさりげなく触れる', delta: { fun: 3, trust: 2 }, tags: ['safe'] },
      { text: '「そのグローブ、どこのブランドですか？」と興味を示す', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '「そのグローブ、どちらのものですか。同じものを買います。色も、サイズも、同じもので」と静かにメモを取る', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 2 — 追加イベント（8本）
  // ============================================================

  {
    id: 'cart_drink_service',
    title: 'カートの飲み物',
    description: 'カートに冷えた飲み物が積まれている。相手はまだ気づいていない。',
    stage: 2,
    choices: [
      { text: '「飲み物ありますよ！」と気づかせてあげる', delta: { fun: 4, trust: 3 }, tags: ['etiquette'] },
      { text: '自分で取って相手にも差し出す', delta: { fun: 4, trust: 4, creep: 1 }, tags: ['over_support'] },
      { text: '打つたびに飲み物を差し出し、専属ドリンク係と化す', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'bad_lie_reaction',
    title: '相手の悪いライ',
    description: '相手のボールが斜面の悪いライに止まった。打ちにくそうにしている。',
    stage: 2,
    choices: [
      { text: '「難しいライですね…落ち着いてどうぞ」と声をかける', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: '「こういうライって腕の見せどころですよ！」と盛り上げる', delta: { fun: 5, trust: 2 }, tags: ['bold'] },
      { text: '足でさりげなくライを平らにならしてあげる', delta: { fun: 4, creep: 11, trust: -2 }, tags: ['cheat_physical'] },
      { text: '「つらそうですね…自分が代わりに打ちましょうか？笑」とジョーク', delta: { fun: 5, trust: 1 }, tags: ['humor'] },
    ],
  },
  {
    id: 'opponent_great_drive',
    title: '相手の豪快ドライバー',
    description: '相手のドライバーがフェアウェイを300ヤード飛んだ。飛距離に圧倒された。',
    stage: 2,
    choices: [
      { text: '「すごい飛距離！！」と素直に驚く', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
      { text: '「風も味方してくれましたね！」と褒めつつ分析する', delta: { fun: 4, trust: 4 }, tags: ['serious'] },
      { text: '「…すみません、少し黙らせてください。今の一打、言葉にすると軽くなるので」と帽子を取って立ち尽くす', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'tee_box_etiquette',
    title: 'ティーグラウンドの順番',
    description: '自分が先にティーに立ったが、相手の方が先に打つべきだったかもしれない。',
    stage: 2,
    choices: [
      { text: '「先どうぞ！」と相手に譲る', delta: { trust: 4, fun: 2 }, tags: ['etiquette'] },
      { text: '「自分から打っていいですか？」と確認してから打つ', delta: { trust: 3, fun: 2 }, tags: ['safe'] },
      { text: '気にせず打つ', delta: { trust: -2, fun: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'rough_advice',
    title: '相手のラフ攻略',
    description: '相手のボールが深いラフに入った。どう打ち出すか迷っている様子だ。',
    stage: 2,
    choices: [
      { text: '「グリップを短く持つといいですよ」とアドバイスする', delta: { trust: 3, fun: 2, focus: 3 }, tags: ['serious'] },
      { text: '「力で持ってっちゃいましょう！」と大雑把に応援', delta: { fun: 5, trust: 1 }, tags: ['humor'] },
      { text: '相手が見ていない隙に手でボールをラフから出してあげる', delta: { fun: 5, creep: 13, trust: -3 }, tags: ['cheat_physical'] },
    ],
  },
  {
    id: 'opponent_birdie_miss',
    title: '相手のバーディ惜しい！',
    description: '相手のバーディパットが惜しくもカップを外れた。「あーっ！」と悔しがっている。',
    stage: 2,
    choices: [
      { text: '「惜しい！ほんとに惜しかった！」と一緒に悔しむ', delta: { fun: 5, trust: 4 }, tags: ['safe'] },
      { text: '「あれは入ったと思いましたよ！ツイてないだけです」', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '「OK。あれは入りました」とOKを出す', delta: { fun: 7, trust: -4, creep: 14 }, tags: ['cheat_score', 'extreme'] },
    ],
  },
  {
    id: 'water_hazard_near',
    title: '水際の一打',
    description: '相手のボールが池のすぐ手前に止まっている。際どい位置で、打ち方を誤ると池に入る。',
    stage: 2,
    choices: [
      { text: '「ここからフルスイングは危ないですよ…」と忠告', delta: { trust: 4, fun: 1 }, tags: ['honesty'] },
      { text: '「大丈夫！池には飛ばない距離感で打てますよ！」と励ます', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: 'そっとボールを池から遠ざけた安全な位置に蹴って移動させる', delta: { fun: 4, creep: 10, trust: -1 }, tags: ['cheat_physical'] },
    ],
  },
  {
    id: 'course_guide_info',
    title: 'コースの難関ホール説明',
    description: '「このコース、どのホールが難しいか知ってる？」と相手が聞いてきた。',
    stage: 2,
    choices: [
      { text: '「7番が特に難しいですよ。池が絡むんで」と詳しく教える', delta: { trust: 4, fun: 3, focus: 3 }, tags: ['serious'] },
      { text: '「全部難しいですよ！笑 でも○○さんなら余裕じゃないですか」', delta: { fun: 5, trust: 2 }, tags: ['flattery', 'humor'] },
      { text: '「知りません…一緒に探検しましょう！」', delta: { fun: 4, trust: 2 }, tags: ['safe'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 3 — 追加イベント（9本）
  // ============================================================

  {
    id: 'sand_trap_escape',
    title: 'バンカーからの脱出劇',
    description: '相手がバンカーから見事に脱出した！グリーンに乗った。',
    stage: 3,
    choices: [
      { text: '「ナイスアウト！すごい！」と拍手', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
      { text: '「砂の取り方が薄かったですね。あの厚さは狙って出せるものじゃないです」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['analysis_praise', 'honesty'] },
      { text: '「これは本物のゴルフです」と泣きそうになる', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'caddy_praise_moment',
    title: 'キャディさんの神読み',
    description: 'キャディさんが「左に切れます」と読んだ通りにパットが転がって入った。相手が感動している。',
    stage: 3,
    choices: [
      { text: '「すごいキャディさんですね！」と相手に同意する', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: 'キャディさんにも「ありがとうございます！」とお礼を言う', delta: { trust: 5, fun: 3 }, tags: ['etiquette'] },
      { text: '「キャディさんまで変わるんですね」と熱弁する', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },
  {
    id: 'pin_position_check',
    title: 'ピン位置の確認',
    description: '相手がグリーンのピン位置を遠くから確認しようとしている。どこにあるか分かりにくい。',
    stage: 3,
    choices: [
      { text: '「奥の方に見えますよ」と教えてあげる', delta: { fun: 3, trust: 3, focus: 2 }, tags: ['safe'] },
      { text: 'キャディに確認してもらう', delta: { trust: 3, fun: 2, focus: 3 }, tags: ['serious'] },
      { text: '相手より先に走ってグリーンまで確認しに行く', delta: { fun: 4, trust: 2, creep: 4 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'opponent_slice_habit',
    title: '相手のスライス癖',
    description: '相手が「またスライスだ…癖が直らないんだよな」とぼやいた。',
    stage: 3,
    choices: [
      { text: '「グリップを少しストロングにするといいかもですよ」とアドバイス', delta: { trust: 3, fun: 2, focus: 3 }, tags: ['serious'] },
      { text: '「スライスも個性ですよ！独特の弾道でカッコいい！」', delta: { fun: 5, trust: 2 }, tags: ['flattery', 'humor'] },
      { text: '「それはスライスではなくアートです！！」と訂正する', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'opponent_yips',
    title: '相手がイップス気味',
    description: 'ショートパットで相手の手が震えている。イップス気味に見える。',
    stage: 3,
    choices: [
      { text: '「OK！入りましたよ！」とOKを出してあげる', delta: { fun: 5, trust: 3, creep: 4 }, tags: ['cheat_score', 'over_support'] },
      { text: '「深呼吸して、いつも通りにどうぞ」と静かに', delta: { trust: 4, fun: 2 }, tags: ['safe'] },
      { text: '「大丈夫！自分もイップスですよ！全員そうです！笑」と共感で盛り上げる', delta: { fun: 6, trust: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'lost_ball_drop',
    title: '暫定球の処理',
    description: '相手のボールがなかなか見つからない。暫定球を打った方がいいか迷っている。',
    stage: 3,
    choices: [
      { text: '「3分以内に見つからなければ暫定球ですね」と正確に伝える', delta: { trust: 4, fun: 1, focus: 3 }, tags: ['honesty', 'serious'] },
      { text: '「もう少し探しましょう！」と一緒に草をかき分ける', delta: { fun: 4, trust: 3, focus: -2 }, tags: ['over_support'] },
      { text: '「あった！ここじゃないですか！」と言いながら新しいボールをそっと置く', delta: { fun: 5, creep: 11, trust: -3 }, tags: ['cheat_physical'] },
    ],
  },
  {
    id: 'uphill_lie_help',
    title: '上り傾斜での助言',
    description: '相手が急な上り傾斜から打とうとしている。バランスを崩しそうだ。',
    stage: 3,
    choices: [
      { text: '「重心を低くして打つといいですよ」とアドバイス', delta: { trust: 3, fun: 2, focus: 3 }, tags: ['serious'] },
      { text: '「上り傾斜はボールが上がりやすいので1番手下げるといいですよ」', delta: { fun: 3, trust: 4, focus: 2 }, tags: ['serious'] },
      { text: 'さりげなく相手の背中を支えるように立つ', delta: { fun: 3, trust: 2, creep: 4 }, tags: ['over_support'] },
      { text: '「気合いで！」と一言だけ言う', delta: { fun: 4, trust: 1 }, tags: ['humor'] },
    ],
  },
  {
    id: 'trust_recovery_honest_mistake',
    title: '自分のミスを正直に認める',
    description: '相手のパットラインを誤って踏んでしまった。相手はまだ気づいていない。',
    stage: 3,
    choices: [
      { text: '「ライン踏んでしまいました！すみません、修復させてください」とすぐに謝る', delta: { trust: 10, fun: 1, creep: -4 }, tags: ['honesty', 'etiquette'] },
      { text: 'ラインを直してから「あ、ちょっと踏みそうだったかも…」と小声で言う', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '気づかなかったふりをする', delta: { trust: -3, creep: 3 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'cart_path_navigation',
    title: 'カートの道案内',
    description: 'カートで次のホールへの道が分かれている。どちらに進むか迷っている。',
    stage: 3,
    choices: [
      { text: '「こっちだと思います！」と自信を持って案内する', delta: { fun: 4, trust: 2 }, tags: ['bold'] },
      { text: 'キャディさんに確認する', delta: { trust: 3, fun: 2, focus: 2 }, tags: ['safe'] },
      { text: '「迷子になっても○○さんと一緒なら楽しいですよ！」と笑う', delta: { fun: 5, trust: 2 }, tags: ['humor'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 4 — 追加イベント（9本）
  // ============================================================

  {
    id: 'scorecard_calculation',
    title: 'スコア計算の手伝い',
    description: 'ホールアウト後、相手がスコアを計算している。少し戸惑っているようだ。',
    stage: 4,
    choices: [
      { text: '「計算します！」とスコアカードを受け取る', delta: { fun: 3, trust: 3 }, tags: ['etiquette'] },
      { text: 'さりげなく1打少なめに計算してカードを渡す', delta: { fun: 4, creep: 9, trust: -3 }, tags: ['cheat_score'] },
      { text: '「集計よりプレー内容ですよ」と計算よりプレーを称える', delta: { fun: 5, trust: 2 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'greenside_drama',
    title: 'グリーンサイドの攻防',
    description: 'グリーン周りのアプローチ。相手がピンまで10ヤードのところから打とうとしている。',
    stage: 4,
    choices: [
      { text: '「ピンまでどれくらいか測りますよ」と距離を計算してあげる', delta: { fun: 1, trust: 1, creep: 4 }, tags: ['over_support', 'logic'] },
      { text: '「どんなイメージで打つか決まりましたか？」と確認する', delta: { trust: 3, fun: 2, focus: 1 }, tags: ['etiquette'] },
      { text: '静かに見守る', delta: { trust: 3, focus: 4 }, tags: ['serious'] },
    ],
  },
  {
    id: 'distraction_noise',
    title: '隣ホールの騒音',
    description: '隣のホールから大きな笑い声が聞こえてきた。相手の集中が乱れそうだ。',
    stage: 4,
    choices: [
      { text: '「楽しそうですね…こちらも負けずに！」と気にしない', delta: { fun: 4, trust: 2 }, tags: ['humor'] },
      { text: '身を張って相手の視界に入り、注意をそらさないようにする', delta: { trust: 3, fun: 2, creep: 4 }, tags: ['over_support'] },
      { text: '隣のグループに「静かにして！」と言いに行く', delta: { fun: 2, trust: -2, creep: 5 }, tags: ['bold'] },
    ],
  },
  {
    id: 'flag_attend_precise',
    title: '旗の位置とピン係',
    description: '相手のアプローチショット前、旗を持つよう頼まれた。どの距離感で持つか。',
    stage: 4,
    choices: [
      { text: '旗をしっかり保持し、ショット後すぐに抜く', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '旗を持ちながら「狙いやすいですよ！」と声をかける', delta: { fun: 4, trust: 2 }, tags: ['safe'] },
      { text: 'ショットのタイミングでそっと旗を動かしてピンの位置を相手に有利な方向へ示す', delta: { fun: 3, creep: 8, trust: -2 }, tags: ['cheat_physical'] },
    ],
  },
  {
    id: 'opponent_knee_pain',
    title: '相手の膝の痛み',
    description: '歩いていると相手が「膝がちょっとね…」と言った。無理をしているようだ。',
    stage: 4,
    choices: [
      { text: '「無理しないでください！カートで移動しましょう」', delta: { trust: 5, fun: 3 }, tags: ['etiquette'] },
      { text: '「湿布持ってますよ！貼りますか？」と用意良く', delta: { fun: 4, trust: 4, creep: 2 }, tags: ['over_support'] },
      { text: '「いつから。階段は。正座は。何科でした」と問診が止まらない', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'wind_read_together',
    title: '風の読み合い',
    description: 'ティーグラウンドで風向きを読んでいる。相手も迷っている。',
    stage: 4,
    choices: [
      { text: '「右から来てますね。少し左を狙いましょう」と情報共有', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['serious'] },
      { text: '「風？気合で突っ切りましょう！」とメンタル重視', delta: { fun: 5, trust: 1 }, tags: ['bold'] },
      { text: '「○○さんの感覚を信じてください」と引き立てる', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
    ],
  },
  {
    id: 'tree_trouble_options',
    title: '木の間を抜けるか',
    description: '相手のボールが木の間に入った。林の中からの難しいショットを強いられている。',
    stage: 4,
    choices: [
      { text: '「リスクが高いのでレイアップが現実的かもですよ」と正直に言う', delta: { trust: 4, fun: 1 }, tags: ['honesty'] },
      { text: '「いけますよ！チャレンジしてみましょう！」と背中を押す', delta: { fun: 5, trust: 2 }, tags: ['bold'] },
      { text: 'ルールの範囲内で一番良い救済の受け方を調べる', delta: { trust: 4, fun: 2, focus: 3 }, tags: ['serious'] },
    ],
  },
  {
    id: 'opponent_complains_course',
    title: '相手のコース批判',
    description: '「このコース、メンテナンスが悪いね」と相手がグチを言い始めた。',
    stage: 4,
    choices: [
      { text: '「確かに…でもそれが腕の見せどころですね」と前向きにかわす', delta: { fun: 4, trust: 3 }, tags: ['humor'] },
      { text: '「そうですよ！最悪です！次は別のコースにしましょう！」と強く同調する', delta: { fun: 3, trust: 1, creep: 3 }, tags: ['flattery'] },
      { text: '「コースの方が恐縮してますよ」とコースをかばう', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },
  {
    id: 'trust_recovery_wrong_advice',
    title: '間違ったアドバイスを訂正',
    description: '少し前に「右を狙って」と言ったが、それが間違いでOBになりそうだった。',
    stage: 4,
    choices: [
      { text: '「さっきの自分のアドバイス、間違ってました。本当に申し訳ありません」と頭を下げる', delta: { trust: 9, fun: 1, creep: -4 }, tags: ['honesty', 'serious'] },
      { text: '「あの状況では仕方なかったですね…」と曖昧にかわす', delta: { trust: 2, fun: 1 }, tags: ['safe'] },
      { text: '「風のせいです！自分は悪くないです！笑」とジョーク気味に言う', delta: { fun: 4, trust: -1, creep: 2 }, tags: ['humor'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 5 — 追加イベント（9本）
  // ============================================================

  {
    id: 'lunch_menu_extreme',
    title: '昼食メニューの攻防',
    description: '昼食のメニューを相手が選んでいる。「何食べようかな」と悩んでいる。',
    stage: 5,
    choices: [
      { text: '「ここの名物、ゴルフ飯ランキング1位らしいですよ！」と情報提供', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: '「同じものを。選んだ方が正解なので」と合わせる', delta: { fun: 4, trust: 2, creep: 3 }, tags: ['flattery', 'extreme'] },
      { text: '相手が選びやすいようにメニューの特徴を簡単に説明する', delta: { fun: 3, trust: 4 }, tags: ['etiquette'] },
    ],
  },
  {
    id: 'whiskey_offer',
    title: 'ウイスキー登場',
    description: '「ウイスキーのソーダ割、飲む？」と相手が高級ウイスキーを取り出した。昼食中だ。',
    stage: 5,
    choices: [
      { text: '「いただきます！いいウイスキーですね」と嗜む', delta: { fun: 6, trust: 4, focus: -5 }, tags: ['alcohol'] },
      { text: '「午後もあるのでちょっとだけ…」と控えめに飲む', delta: { fun: 4, trust: 3, focus: -2 }, tags: ['alcohol', 'safe'] },
      { text: '「運転があるので申し訳ないです」と断る', delta: { trust: 3, fun: -1, focus: 2 }, tags: ['honesty'] },
      { text: '「飲みながら回る人、初めて見ました」と付き合う', delta: { fun: 5, trust: 2, creep: 2, focus: -6 }, tags: ['alcohol', 'bold', 'extreme'] },
    ],
  },
  {
    id: 'lunch_topic_golf',
    title: '昼食中のゴルフ談義',
    description: '昼食中に「ゴルフって本当に奥深いよね」と相手が語り始めた。',
    stage: 5,
    choices: [
      { text: '「そうですよね。今日も色々気づかされました」と真剣に聞く', delta: { fun: 4, trust: 5 }, tags: ['serious'] },
      { text: '「○○さんのプレーを見ていると本当にそう思います！」と相手の話に結びつける', delta: { fun: 5, trust: 3 }, tags: ['flattery'] },
      { text: '笑って聞き流す', delta: { fun: 2, trust: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'beer_second_round',
    title: '2杯目のビール',
    description: '相手が「もう1杯どう？」とビールを追加しようとしている。最初の1杯は飲んだ。',
    stage: 5,
    choices: [
      { text: '「いきましょう！乾杯！」と合わせる', delta: { fun: 7, trust: 4, focus: -6 }, tags: ['alcohol', 'bold'] },
      { text: '「もう少し様子を見てからにします」と慎重に', delta: { trust: 2, fun: -1, focus: 2 }, tags: ['safe'] },
      { text: '「100杯でも付き合います」と豪語する', delta: { fun: 5, trust: 2, creep: 2, focus: -6 }, tags: ['alcohol', 'bold', 'extreme'] },
    ],
  },
  {
    id: 'rest_room_wait',
    title: 'お手洗い待ち',
    description: '昼食後、相手がお手洗いに行っている。数分の待ち時間がある。',
    stage: 5,
    choices: [
      { text: 'スマホで午後のコース情報を確認する', delta: { focus: 5 }, tags: ['serious'] },
      { text: '飲み物を用意して相手が戻るのを待つ', delta: { trust: 3, fun: 2, creep: 1 }, tags: ['over_support'] },
      { text: '相手のスコアカードをこっそり確認する', delta: { focus: 3, creep: 4 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'trust_recovery_lunch_bill',
    title: '昼食代を正直に提案',
    description: '昼食の会計で、相手が前回の接待費を「立て替えてもらってたね」と言い出した。',
    stage: 5,
    choices: [
      { text: '「今日は自分が払います！お気にしないでください」と正直に申し出る', delta: { trust: 9, fun: 2, creep: -2 }, tags: ['honesty', 'etiquette'] },
      { text: '「え、覚えてましたか！じゃあありがたく！」とありがたく受け取る', delta: { fun: 4, trust: 3 }, tags: ['safe'] },
      { text: '「そんなこと気にしなくていいですよ！」と大げさに断る', delta: { fun: 3, trust: 2 }, tags: ['safe'] },
    ],
  },
  {
    id: 'afternoon_pep_talk',
    title: '午後のスタート前激励',
    description: '昼休憩が終わり、午後のスタートへ向かう時間だ。相手を盛り上げるチャンス。',
    stage: 5,
    choices: [
      { text: '「午後は前半以上に楽しみましょう！」と笑顔で', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「前半の反省を活かして！」と真剣に意気込む', delta: { fun: 3, trust: 3, focus: 5 }, tags: ['serious'] },
      { text: '「午後は伝説になります！！録画しておくべきでした！！」と宣言する', delta: { fun: 5, trust: 2, creep: 2 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },
  {
    id: 'lunch_score_review',
    title: '前半スコアの見直し',
    description: '昼食中、キャディがスコアカードを渡してきた。前半のスコアが記録されている。',
    stage: 5,
    choices: [
      { text: 'スコアをそのまま確認して返す', delta: { trust: 3, fun: 1 }, tags: ['honesty'] },
      { text: '相手の前半スコアを1〜2打少なく書き直してから返す', delta: { fun: 4, creep: 12, trust: -5 }, tags: ['cheat_score'] },
      { text: '「前半の良かったところを振り返りましょう！」と切り替える', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'afternoon_focus_prep',
    title: '午後への集中準備',
    description: '昼食後、相手が真剣な表情で練習グリーンに向かおうとしている。',
    stage: 5,
    choices: [
      { text: '「一緒にパット練習しましょうか？」と声をかける', delta: { fun: 3, trust: 4, focus: 3 }, tags: ['safe'] },
      { text: '「集中したいですよね、邪魔しないようにします」と空気を読む', delta: { trust: 5, fun: 1 }, tags: ['serious', 'etiquette'] },
      { text: 'キャディに頼んで相手のパット練習用ボールを余分に用意してもらう', delta: { trust: 3, fun: 2, creep: 3 }, tags: ['over_support'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 6 — 追加イベント（9本）
  // ============================================================

  {
    id: 'par3_hole_in_one_near',
    title: 'ホールインワン目前',
    description: 'パー3で相手のボールがピンそばに止まった。惜しい！',
    stage: 6,
    choices: [
      { text: '「惜しい！ホールインワン一歩手前！」と興奮する', delta: { fun: 6, trust: 3 }, tags: ['flattery'] },
      { text: '「番手をひとつ落として入られてましたよね。あれが効いてます」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['analysis_praise', 'honesty'] },
      { text: '「惜しい、じゃないです！！事件です！！」と言い切る', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'tough_putt_read',
    title: 'ラインの難読みパット',
    description: '相手が難しいパットラインを前に「どっちに切れるかな」と悩んでいる。',
    stage: 6,
    choices: [
      { text: '「少し右に曲がると思いますよ」と自分なりの読みを伝える', delta: { fun: 3, trust: 3, focus: 2 }, tags: ['serious'] },
      { text: '「○○さんの読みを信じましょう！経験値が違います！」と相手に委ねる', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '「左です。左しかない。左に賭けます。もし右に切れたら自分が謝ります。左です」と繰り返す', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },
  {
    id: 'sand_wedge_borrow',
    title: '相手のサンドウェッジを借りる',
    description: '「自分のサンドウェッジ、試してみない？」と相手がクラブを貸してくれた。',
    stage: 6,
    choices: [
      { text: '「ありがとうございます！打ってみます」と素直に借りる', delta: { fun: 5, trust: 3 }, tags: ['safe'] },
      { text: '「遠慮します。自分のクラブで勝負します」と断る', delta: { trust: 3, fun: 1 }, tags: ['honesty'] },
      { text: '借りたクラブで打ち、相手の前で大げさに感動する', delta: { fun: 6, trust: 2, creep: 3 }, tags: ['flattery', 'humor'] },
    ],
  },
  {
    id: 'sunset_hole_appreciation',
    title: '夕方前の美しいホール',
    description: '午後のラウンドで光の具合が美しいホールに差し掛かった。',
    stage: 6,
    choices: [
      { text: '「きれいですね」と静かに感動を共有する', delta: { fun: 3, trust: 4 }, tags: ['safe'] },
      { text: '「写真に収めたいですね！」とカメラを向ける', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「この時間にここに立てているのは、○○さんのペース配分のおかげです。……本当に、そう思っています」と目を合わせずに言う', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },
  {
    id: 'trust_recovery_score_correction',
    title: '自分の記録ミスを正直に謝る',
    description: '前のホールのスコア記録を1打多く書いてしまったことに気づいた。相手のスコアだ。',
    stage: 6,
    choices: [
      { text: '「すみません、前のホール1打多く書いてしまいました。訂正してもいいですか」と正直に謝る', delta: { trust: 10, fun: 1, creep: -5 }, tags: ['honesty', 'etiquette'] },
      { text: 'そのまま何も言わない（相手に不利な修正だから）', delta: { trust: -2, creep: 3 }, tags: ['neutral'] },
      { text: '「キャディさん、前のホール確認できますか？」と確認を依頼する', delta: { trust: 4, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'opponent_eagle_chance',
    title: '相手のイーグルチャンス',
    description: 'ロングホールで相手の第2打がグリーンに乗り、長いイーグルパットが残った。',
    stage: 6,
    choices: [
      { text: '「イーグルパットですよ！！」と興奮して盛り上げる', delta: { fun: 6, trust: 3 }, tags: ['flattery', 'bold'] },
      { text: 'パットラインを一緒に読んで入る確率を上げる', delta: { fun: 4, trust: 4, focus: 3 }, tags: ['serious', 'over_support'] },
      { text: '「OK、イーグルで」とOKを出す', delta: { fun: 10, trust: -5, creep: 18 }, tags: ['cheat_score', 'extreme'] },
    ],
  },
  {
    id: 'equipment_malfunction',
    title: '相手のクラブが壊れた',
    description: 'ショット後に相手のクラブのシャフトにひびが入った。大事なクラブだったようだ。',
    stage: 6,
    choices: [
      { text: '「大丈夫ですか？残念ですね…代わりに何か使えますか？」', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '「後でリシャフトすれば直せますよ！良い機会です！」と前向きに', delta: { fun: 4, trust: 3 }, tags: ['humor'] },
      { text: 'クラブを全部差し出し「素手でやります」と言う', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'caddy_mistake',
    title: 'キャディさんのミス',
    description: 'キャディさんがクラブを間違えて渡してしまった。相手が少し不満そうだ。',
    stage: 6,
    choices: [
      { text: '「よくありますよ！大丈夫ですよ」とキャディさんをフォローする', delta: { fun: 3, trust: 3 }, tags: ['etiquette'] },
      { text: 'すぐ正しいクラブを取りに行く', delta: { trust: 4, fun: 2, creep: 2 }, tags: ['over_support'] },
      { text: 'キャディさんに厳しく注意する', delta: { trust: -3, creep: 4, fun: -2 }, tags: ['bold'] },
    ],
  },
  {
    id: 'evening_chill',
    title: '夕方の冷え込み',
    description: '夕方になり急に気温が下がってきた。相手が少し寒そうだ。',
    stage: 6,
    choices: [
      { text: '「寒くなりましたね。ウィンドブレーカーありますよ」と差し出す', delta: { fun: 4, trust: 4, creep: 2 }, tags: ['over_support'] },
      { text: '「もうひと踏ん張りですよ！」と気合を入れ合う', delta: { fun: 4, trust: 2 }, tags: ['bold'] },
      { text: 'カートのヒーターをオンにする', delta: { trust: 3, fun: 3 }, tags: ['etiquette'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 7 — 追加イベント（9本）
  // ============================================================

  {
    id: 'approach_lip_out',
    title: 'カップの縁で止まる',
    description: '相手の絶妙なアプローチがカップの縁で止まった。「入れ！入れ！」という惜しいシーンだった。',
    stage: 7,
    choices: [
      { text: '「あと転がり半回転でしたね。ラインは読み切ってました」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['analysis_praise', 'honesty'] },
      { text: '「OK！縁で止まったのは入ったと同じですよ！」とOKを出す', delta: { fun: 5, trust: 2, creep: 5 }, tags: ['cheat_score'] },
      { text: '「記録はバーディで」とOKを出す', delta: { fun: 10, trust: -5, creep: 17 }, tags: ['cheat_score', 'extreme'] },
    ],
  },
  {
    id: 'partner_score_gap',
    title: 'スコア差が開いてきた',
    description: '後半に入り、相手のスコアが大きく崩れてきた。差が開いてきたことを相手も意識している。',
    stage: 7,
    choices: [
      { text: '「スコアより楽しんでいきましょう！」と明るく言う', delta: { fun: 5, trust: 3 }, tags: ['humor'] },
      { text: '「後半は全然あり得ますよ！盛り返しましょう！」と励ます', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「自分もわざとミスしてスコアを合わせますよ！」と申し出る', delta: { fun: 4, trust: -2, creep: 5 }, tags: ['humor'] },
    ],
  },
  {
    id: 'caddy_ball_advice',
    title: 'キャディさんのボール提案',
    description: 'キャディさんが「使い古しのボールをスペアに持ってますよ」と教えてくれた。相手にも必要そうだ。',
    stage: 7,
    choices: [
      { text: 'キャディさんのボールを相手にすぐ渡す', delta: { trust: 4, fun: 3, creep: 2 }, tags: ['over_support'] },
      { text: '「使いますか？」と相手に確認する', delta: { trust: 3, fun: 2 }, tags: ['safe'] },
      { text: '「自分のボール余ってます」と自分のを差し出す', delta: { fun: 5, trust: 2, creep: 6 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'back9_motivation',
    title: '後半の盛り上げ役',
    description: '10番ホールのティーグラウンドに立った。後半戦だ。雰囲気を作るチャンス。',
    stage: 7,
    choices: [
      { text: '「さあ後半戦！楽しんでいきましょう！」と声をかける', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「後半は作戦を変えていきましょう！」と戦略を提案', delta: { fun: 4, trust: 3, focus: 3 }, tags: ['serious'] },
      { text: '「後半、歴史が動きますよ！！絶対に見逃せない！！」と言い残す', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },
  {
    id: 'trust_recovery_caddy_apology',
    title: '相手に代わってキャディに謝る',
    description: '相手が感情的になってキャディさんに少し失礼な言葉を言ってしまった。',
    stage: 7,
    choices: [
      { text: '後でキャディさんに「さっきは申し訳なかったです」と代わりに謝る', delta: { trust: 9, fun: 2, creep: -3 }, tags: ['honesty', 'etiquette'] },
      { text: 'その場ですぐフォローする言葉をかける', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: 'スルーする（余計なことを言わない方がいい）', delta: { trust: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'rough_to_green_drama',
    title: '深いラフから直接グリーン',
    description: '相手が深いラフから強引にグリーンを狙った。奇跡的にグリーンへ乗った！',
    stage: 7,
    choices: [
      { text: '「すごい！ラフから直接グリーン！！」と大喜びする', delta: { fun: 6, trust: 3 }, tags: ['flattery'] },
      { text: '「刻む選択もあった場面で、ラフの抵抗を計算に入れて振り切りましたね」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['analysis_praise', 'honesty'] },
      { text: 'あの深いラフからのオンは物理法則を超えた奇跡だとキャディに語り聞かせる', delta: { fun: 8, trust: 1, creep: 5 }, tags: ['flattery', 'over_support'] },
    ],
  },
  {
    id: 'penalty_decision',
    title: 'ペナルティの判断',
    description: '相手のボールが動いた気がした。相手は気づいていない。1打罰が発生するケースかもしれない。',
    stage: 7,
    choices: [
      { text: '「今ボール動きましたよね？1打罰かも…確認しますか？」と正直に伝える', delta: { trust: 8, fun: -2, creep: -3 }, tags: ['honesty'] },
      { text: '黙ってやり過ごす（相手に有利なように）', delta: { fun: 3, creep: 9, trust: -2 }, tags: ['cheat_score'] },
      { text: 'キャディに確認を委ねる', delta: { trust: 3, fun: 1 }, tags: ['safe'] },
    ],
  },
  {
    id: 'late_hole_photo',
    title: '後半ホールの記念写真',
    description: '景色が素晴らしいホールに来た。「ここ撮ってほしいな」と相手が言った。',
    stage: 7,
    choices: [
      { text: '「もちろん！一番いいアングルで撮りますよ！」と喜んで撮る', delta: { fun: 5, trust: 4 }, tags: ['safe'] },
      { text: '「いい写真になりますよ！」と複数カット撮影する', delta: { fun: 6, trust: 3, creep: 2 }, tags: ['over_support'] },
      { text: '「もう少し右です。あと三枚だけ」と撮り続ける', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'gallery_impression',
    title: '同組の人たちへの印象管理',
    description: '同組の別の人たちが自分と相手の様子を見ている。接待ぶりが露骨だろうか。',
    stage: 7,
    choices: [
      { text: '自然に振る舞い、同組全員に気を配る', delta: { trust: 4, fun: 3 }, tags: ['etiquette'] },
      { text: '相手だけに集中し続ける（それが接待だから）', delta: { fun: 2, trust: 2, focus: 4 }, tags: ['serious'] },
      { text: '「皆さん！！ここ見てください！！今日一番の場面です！！」と周囲に呼びかける', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 8 — 追加イベント（9本）
  // ============================================================

  {
    id: 'final_holes_catchup',
    title: '残り3ホールの逆転',
    description: '残り3ホール。相手が「後3ホール、がんばるか」と気合を入れ直している。',
    stage: 8,
    choices: [
      { text: '「絶対いけますよ！応援してます！」と熱く背中を押す', delta: { fun: 5, trust: 3 }, tags: ['bold'] },
      { text: '「最後まで一緒に楽しみましょう！」と穏やかに', delta: { fun: 4, trust: 4 }, tags: ['safe'] },
      { text: '相手のボールをこっそり少し前に移動させてアドバンテージを作る', delta: { fun: 4, creep: 13, trust: -4 }, tags: ['cheat_physical'] },
    ],
  },
  {
    id: 'dramatic_birdie',
    title: '劇的なバーディパット',
    description: '相手が長い距離のバーディパットを沈めた！素晴らしいプレーだ。',
    stage: 8,
    choices: [
      { text: '「最高！！バーディおめでとうございます！」と大喜びする', delta: { fun: 7, trust: 4 }, tags: ['flattery'] },
      { text: '「あのラインを最後まで信じて打ち切りましたね」', delta: { fun: 3, trust: 3, focus: 3 }, tags: ['analysis_praise', 'honesty'] },
      { text: '「今のでもう元は取れました」と拝む', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'final_strategy_talk',
    title: '最終ホールの作戦',
    description: '最終ホール前。相手が「どこ狙えばいい？」と聞いてきた。',
    stage: 8,
    choices: [
      { text: '「フェアウェイ左サイドを狙うと安全ですよ」と真剣に伝える', delta: { trust: 4, fun: 2, focus: 3 }, tags: ['serious'] },
      { text: '「○○さんの判断を信じます！」と委ねる', delta: { fun: 3, trust: 3 }, tags: ['flattery'] },
      { text: '「ど真ん中で。不可能はないです」と背中を押す', delta: { fun: 6, trust: 1, creep: 7 }, tags: ['flattery', 'bold'] },
    ],
  },
  {
    id: 'score_cheat_final_holes',
    title: '最終盤のスコア記録',
    description: '残り2ホール。相手がスコアを記録しながら「もう1打少なかったら…」と呟いた。',
    stage: 8,
    choices: [
      { text: '正確に記録する', delta: { trust: 5, fun: 1 }, tags: ['honesty'] },
      { text: '「そうですね、あれはOKにしておきましょう」と1打減らしてあげる', delta: { fun: 4, creep: 8, trust: -2 }, tags: ['cheat_score'] },
      { text: '「気にしない気にしない！今日は楽しかったですよ！」と流す', delta: { fun: 4, trust: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'physical_exhaustion',
    title: '相手の疲労困憊',
    description: '18ホール近く、相手が「さすがに疲れたな…」とぐったりしている。',
    stage: 8,
    choices: [
      { text: '「本当にお疲れ様でした！最後までさすがです！」と労う', delta: { fun: 4, trust: 5 }, tags: ['etiquette', 'flattery'] },
      { text: '「カートで移動しましょう！あとは乗って楽しみましょう」', delta: { fun: 4, trust: 4 }, tags: ['safe'] },
      { text: '「塩分も冷却スプレーもあります」と荷物を広げる', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'trust_recovery_overthought',
    title: '過干渉を反省する',
    description: '今日何度もアドバイスしすぎた気がした。相手に「少しうるさかったかな」と思い始めている。',
    stage: 8,
    choices: [
      { text: '「今日、色々口を出しすぎてしまいました。申し訳ないです」と素直に謝る', delta: { trust: 10, fun: 2, creep: -6 }, tags: ['honesty', 'etiquette'] },
      { text: '最後のホールは何も言わず黙って一緒に回る', delta: { trust: 5, fun: 1, focus: 3 }, tags: ['serious'] },
      { text: '「これからも気になったらアドバイスしますよ！笑」と言い切る', delta: { fun: 4, trust: 1, creep: 3 }, tags: ['humor'] },
    ],
  },
  {
    id: 'final_hole_birdie_attempt',
    title: '最終ホールのバーディチャレンジ',
    description: '18番ホール。相手に1m強のバーディパットが残っている。入れば最高の締めくくりだ。',
    stage: 8,
    choices: [
      { text: '静かに見守る（集中を乱さない）', delta: { trust: 5, fun: 3 }, tags: ['serious', 'etiquette'] },
      { text: '「入る！絶対入る！！」と応援する', delta: { fun: 6, trust: 2 }, tags: ['bold'] },
      { text: 'こっそりカップをわずかに有利な位置に調整しようとする', delta: { fun: 4, creep: 18, trust: -6 }, tags: ['cheat_physical', 'extreme'] },
    ],
  },
  {
    id: 'end_of_round_reflection',
    title: 'ラウンド終了後の感謝',
    description: '18ホールを終えてグリーンを出た。相手が深呼吸をした。',
    stage: 8,
    choices: [
      { text: '「今日は本当に楽しかったです。ありがとうございました」と心から伝える', delta: { fun: 5, trust: 6 }, tags: ['honesty', 'etiquette'] },
      { text: '「お疲れ様でした！次回もよろしくお願いします」と笑顔で', delta: { fun: 4, trust: 4 }, tags: ['safe'] },
      { text: '「実は各ホールでメモを取っていました。全部で九枚あります。清書してお渡しします」とノートを差し出す', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'last_hole_ok_putt',
    title: '最終ホールのOKパット',
    description: '18番グリーン。相手に40cmのパットが残った。疲れた様子だ。',
    stage: 8,
    choices: [
      { text: '「OK！お疲れ様でした！」とOKを出す', delta: { fun: 5, trust: 3, creep: 3 }, tags: ['cheat_score'] },
      { text: '「最後、自分で締めてください！」と打たせる', delta: { trust: 4, fun: 4 }, tags: ['honesty', 'bold'] },
      { text: '「締めの一打、お願いします。ここまで来たら入ります！」と応援する', delta: { fun: 5, trust: 4 }, tags: ['safe'] },
    ],
  },

  // ============================================================
  //  NEW STAGE 9 — 追加イベント（8本）
  // ============================================================

  {
    id: 'clubhouse_drink',
    title: 'クラブハウスでの締めの一杯',
    description: 'プレー後、クラブハウスで「一杯やろう」と相手が誘ってきた。',
    stage: 9,
    choices: [
      { text: '「ぜひ！お疲れ様でした！」と乾杯する', delta: { fun: 7, trust: 5 }, tags: ['alcohol', 'bold'] },
      { text: '「車ですが…ノンアルで乾杯させてください！」', delta: { fun: 4, trust: 3, focus: 2 }, tags: ['honesty', 'safe'] },
      { text: '「今日一日ありがとうございました。ビール最高ですね」と感謝を込めて飲む', delta: { fun: 6, trust: 5 }, tags: ['alcohol', 'honesty'] },
    ],
  },
  {
    id: 'total_score_debrief',
    title: '最終スコアの総括',
    description: '全スコアが出揃った。相手のトータルスコアを見て何と言う？',
    stage: 9,
    choices: [
      { text: '「いいスコアでしたよ！楽しいラウンドでした」と称える', delta: { fun: 5, trust: 4 }, tags: ['flattery', 'safe'] },
      { text: '「次回はさらに良いスコアで！リベンジしましょう！」と前向きに', delta: { fun: 5, trust: 3 }, tags: ['bold', 'humor'] },
      { text: '「全ホール記録してあります。パーオン率、フェアウェイキープ率、平均パット数。製本してお送りします」と資料を出す', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'pro_shop_browse',
    title: 'プロショップでの買い物',
    description: 'プロショップで相手がウェアを見ている。「これいいな」と手に取った。',
    stage: 9,
    choices: [
      { text: '「似合いそうですね！」と後押しする', delta: { fun: 4, trust: 3 }, tags: ['flattery'] },
      { text: '何も言わず一緒に見て回る', delta: { fun: 3, trust: 3 }, tags: ['safe'] },
      { text: 'さりげなく先に購入して「プレゼントです！」と渡す', delta: { fun: 6, trust: 2, creep: 6 }, tags: ['over_support'] },
    ],
  },
  {
    id: 'next_round_planning',
    title: '次回のラウンド計画',
    description: '帰り際、「また来月やろうか？」と相手が言ってくれた。',
    stage: 9,
    choices: [
      { text: '「ぜひ！また一緒に回りたいです！」と素直に喜ぶ', delta: { fun: 5, trust: 5 }, tags: ['honesty', 'bold'] },
      { text: '「予定を調整してご連絡します！」と真剣に返す', delta: { trust: 5, fun: 3 }, tags: ['serious'] },
      { text: '「半年分、先に押さえてあります」と手帳を開く', delta: { fun: 6, trust: -2, creep: 7 }, tags: ['over_support', 'extreme'] },
    ],
  },
  {
    id: 'bath_towel_offer',
    title: 'お風呂のタオル問題',
    description: '浴場でタオルが足りなそうだ。自分には予備がある。',
    stage: 9,
    choices: [
      { text: '「タオル余ってますよ、使いますか？」と声をかける', delta: { trust: 4, fun: 3 }, tags: ['etiquette'] },
      { text: 'さりげなくタオルを差し出す', delta: { trust: 4, fun: 2, creep: 2 }, tags: ['over_support'] },
      { text: '何も言わない（相手のプライベートに干渉しない）', delta: { trust: 2, fun: 1 }, tags: ['neutral'] },
    ],
  },
  {
    id: 'taxi_call_help',
    title: 'タクシーの手配',
    description: '相手が「タクシー呼びたいんだけど」と言った。アプリが使いにくそうだ。',
    stage: 9,
    choices: [
      { text: '「アプリで呼びますよ！」とすぐに手配する', delta: { fun: 4, trust: 4 }, tags: ['etiquette'] },
      { text: '「一緒に乗って途中まで送りますよ」と申し出る', delta: { fun: 3, trust: 2, creep: 4 }, tags: ['over_support'] },
      { text: '「アプリ教えますね！次から使えますよ」と自立を支援する', delta: { fun: 1, trust: 3, focus: 3 }, tags: ['logic', 'honesty'] },
    ],
  },
  {
    id: 'final_impression_share',
    title: '今日の総括トーク',
    description: 'お風呂でくつろぎながら相手が「今日どうだった？」と今日のラウンドを振り返ろうとしている。',
    stage: 9,
    choices: [
      { text: '「楽しかったです！またご一緒できれば嬉しいです」と正直に', delta: { fun: 5, trust: 6 }, tags: ['honesty'] },
      { text: '「○○さんのプレーから勉強になりました！」と謙虚に', delta: { fun: 4, trust: 4 }, tags: ['flattery', 'safe'] },
      { text: '「人生変わりました。本当に」と握手を離さない', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'business_card_exchange',
    title: '名刺交換のタイミング',
    description: '帰り際、まだ名刺交換をしていなかったことに気づいた。',
    stage: 9,
    choices: [
      { text: '「そういえば名刺を！」とタイミングよく名刺を渡す', delta: { trust: 5, fun: 2 }, tags: ['etiquette'] },
      { text: '「もう顔を覚えてもらえましたよね！笑」と名刺なしで済ませる', delta: { fun: 5, trust: 2 }, tags: ['humor'] },
      { text: '名刺を渡しながら「裏にゴルフ戦績も書いてあります！」とウソをつく', delta: { fun: 6, trust: 1, creep: 3 }, tags: ['humor', 'bold'] },
    ],
  },

  // ============================================================
  //  極端が正解になる局面（6本・2026-07-25 追加）
  //
  //  3択が「無難」「誠実・論理」「極端」の3系統に分かれており、
  //  どれが正解かは相手の好みで変わる。無難は誰に対しても neutral 止まりで、
  //  相手を読めた時だけ good に届く。
  //  極端が刺さるのは8人（鬼塚・光山・巌・松本・星野・金城・篠原・ミツキ）、
  //  残る13人には creep が跳ねる。
  // ============================================================

  {
    id: 'tee_stage_cheer',
    title: '送り出しの一言',
    description: '相手がティーグラウンドに立った。少し硬い表情だ。場の空気を作れるタイミングだ。',
    stage: 3,
    choices: [
      { text: '「いい流れ来てますよ」と静かに送り出す', delta: { fun: 2, trust: 3 }, tags: ['safe'] },
      { text: '「風も味方してます。番手はそのままでいけますよ」と根拠を添える', delta: { fun: 1, trust: 3, focus: 3 }, tags: ['logic'] },
      { text: '「ここ一番！！○○さんの見せ場です！！ギャラリーが息を止めてます！！」と全力で盛り上げる', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },
  {
    id: 'wide_hole_carry',
    title: '広いホールでの一打',
    description: '視界の開けたホールに出た。相手が「ここは飛ばせるな」と言っている。',
    stage: 2,
    choices: [
      { text: '「無理せずフェアウェイキープでいきましょう」と抑える', delta: { fun: 0, trust: 3, focus: 4 }, tags: ['safe', 'avoid_risk', 'serious'] },
      { text: '「風も追ってます。いい距離出ますよ」と後押しする', delta: { fun: 2, trust: 3, focus: 3 }, tags: ['logic'] },
      { text: '「振り切りましょう！！今日は刻むの無しで！！自分も全部ドライバーでいきます！！」と煽る', delta: { fun: 7, trust: 3, creep: 3 }, tags: ['bold', 'risk', 'kiai', 'extreme'] },
    ],
  },
  {
    id: 'finish_pose_praise',
    title: '止まったフィニッシュ',
    description: '相手のスイングが決まった。フィニッシュがそのまま静止している。',
    stage: 4,
    choices: [
      { text: '「今の、フィニッシュが綺麗でした」と一言添える', delta: { fun: 2, trust: 3 }, tags: ['safe'] },
      { text: '「あの体重移動は真似できないですね」と技術に触れる', delta: { fun: 2, trust: 4, focus: 2 }, tags: ['logic', 'analysis_praise'] },
      { text: '「今のフィニッシュ、もう一度だけ見せてもらえませんか。……もう一度、お願いします」と静かに頼み続ける', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'over_praise', 'extreme'] },
    ],
  },
  {
    id: 'veteran_hands',
    title: '年季の入った所作',
    description: '相手が慣れた手つきでライを確かめている。長く続けてきた人の動きだ。',
    stage: 6,
    choices: [
      { text: '「手際がいいですね」と素直に言う', delta: { fun: 1, trust: 3 }, tags: ['safe'] },
      { text: '「そのライの見方、どう判断してるんですか」と聞く', delta: { fun: 1, trust: 3, focus: 2 }, tags: ['logic'] },
      { text: '「その手つきだけで負けました」と持ち上げる', delta: { fun: 6, trust: 5, creep: 4 }, tags: ['flattery', 'extreme'] },
    ],
  },
  {
    id: 'back_nine_switch',
    title: '「ここからだな」',
    description: '後半も終盤に入った。相手が前を見ながら「ここからだな」と呟いた。',
    stage: 7,
    choices: [
      { text: '「そうですね、ここからです」と短く返す', delta: { fun: 1, trust: 3 }, tags: ['safe'] },
      { text: '「残り3ホール、パー狙いで十分ですよ」と現実的に返す', delta: { fun: 1, trust: 3, focus: 3 }, tags: ['logic'] },
      { text: '「ここからです！！声出していきます！！残り全部持っていきましょう！！」と気合を入れる', delta: { fun: 7, trust: 4, creep: 3 }, tags: ['humor', 'hype', 'extreme'] },
    ],
  },
  {
    id: 'tucked_pin_dare',
    title: '奥に切られたピン',
    description: '残り2ホール。ピンは奥の難しい位置に切られている。手前から刻むこともできる。',
    stage: 8,
    choices: [
      { text: '「安全に手前から攻めましょう」と提案する', delta: { fun: 0, trust: 3, focus: 4 }, tags: ['safe', 'avoid_risk', 'serious'] },
      { text: '「ピンまで残り何ヤードか測りますか」と確認する', delta: { fun: 1, trust: 3, focus: 4 }, tags: ['logic'] },
      { text: '「ここはピンを直接狙いましょう！！最後に一番いい絵を作りましょう！！自分も付き合います！！」と攻めを勧める', delta: { fun: 7, trust: 3, creep: 3 }, tags: ['bold', 'risk', 'kiai', 'extreme'] },
    ],
  },

// ============================================================
//  イベント統計（倍増フェーズ後）
// ============================================================
// 総数: 154本（既存76 + 新規78）
// stage別:
//   s1 = 10(既存) + 8(新規) = 18本
//   s2 = 10(既存) + 8(新規) = 18本
//   s3 = 10(既存) + 9(新規) = 19本
//   s4 = 10(既存) + 9(新規) = 19本
//   s5 = 12(既存) + 9(新規) = 21本
//   s6 =  9(既存) + 9(新規) = 18本
//   s7 =  9(既存) + 9(新規) = 18本
//   s8 =  8(既存) + 9(新規) = 17本
//   s9 =  8(既存) + 8(新規) = 16本
//
// 新規78本のうち extreme タグ付き選択肢を持つイベント数: 33本
//   s1: morning_stretch_offer, rival_club_boast, first_swing_comment,
//       handicap_inquiry, glove_compliment, morning_coffee (6本)
//   s2: cart_drink_service, opponent_great_drive, opponent_birdie_miss (3本)
//   s3: sand_trap_escape, caddy_praise_moment, opponent_slice_habit (3本)
//   s4: opponent_knee_pain, opponent_complains_course (2本)
//   s5: lunch_menu_extreme, whiskey_offer, beer_second_round,
//       afternoon_pep_talk (4本)
//   s6: par3_hole_in_one_near, tough_putt_read, sunset_hole_appreciation,
//       opponent_eagle_chance, equipment_malfunction (5本)
//   s7: approach_lip_out, back9_motivation, late_hole_photo,
//       gallery_impression (4本)
//   s8: dramatic_birdie, physical_exhaustion, end_of_round_reflection,
//       final_hole_birdie_attempt (4本)
//   s9: total_score_debrief, next_round_planning, final_impression_share (3本)
//
//   extreme 内訳:
//   - flattery/humor extreme (高fun, creep 12-18, trust 負):
//       morning_stretch_offer, rival_club_boast, first_swing_comment,
//       handicap_inquiry, glove_compliment, opponent_great_drive,
//       sand_trap_escape, caddy_praise_moment, opponent_slice_habit,
//       opponent_complains_course, lunch_menu_extreme, afternoon_pep_talk,
//       par3_hole_in_one_near, tough_putt_read, sunset_hole_appreciation,
//       back9_motivation, gallery_impression, dramatic_birdie,
//       end_of_round_reflection, total_score_debrief,
//       final_impression_share (21本)
//   - over_support extreme (overwhelming help, creep 10-15):
//       morning_coffee, cart_drink_service, opponent_knee_pain,
//       equipment_malfunction, late_hole_photo, physical_exhaustion,
//       next_round_planning (7本)
//   - cheat extreme (very risky cheating, creep 15-20):
//       opponent_birdie_miss, whiskey_offer, beer_second_round,
//       opponent_eagle_chance, approach_lip_out,
//       final_hole_birdie_attempt (6本)
//
// 信頼回復イベント（honesty tag, trust >= 8, creep 負）: 5本
//   trust_recovery_honest_mistake  (s3, trust+10, creep-4)
//   trust_recovery_wrong_advice    (s4, trust+9,  creep-4)
//   trust_recovery_lunch_bill      (s5, trust+9,  creep-2)
//   trust_recovery_score_correction(s6, trust+10, creep-5)
//   trust_recovery_caddy_apology   (s7, trust+9,  creep-3)
//   trust_recovery_overthought     (s8, trust+10, creep-6)
//
// 新規 cheat_physical イベント: 4本
//   bad_lie_reaction          (s2, 足でライを平らに)
//   rough_advice              (s2, 手でボールをラフから出す)
//   lost_ball_drop            (s3, 新ボールをそっと配置)
//   final_hole_birdie_attempt (s8, カップ位置調整, extreme兼務)
//
// 新規 cheat_score イベント: 8本
//   opponent_birdie_miss (s2), scorecard_calculation (s4),
//   opponent_yips (s3), lunch_score_review (s5),
//   opponent_eagle_chance (s6), approach_lip_out (s7),
//   penalty_decision (s7), score_cheat_final_holes (s8),
//   last_hole_ok_putt (s8)
//
// alcohol 含む新規イベント: 3本
//   whiskey_offer (s5), beer_second_round (s5),
//   clubhouse_drink (s9)

];
