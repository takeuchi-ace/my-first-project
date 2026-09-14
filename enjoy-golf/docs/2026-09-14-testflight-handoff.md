# Enjoy Golf Quest — TestFlight 引き継ぎメモ（2026-09-14）

## いまどこ

- **Web は公開中**: https://enjoy-golf.vercel.app/ （中身は最新）
- **iOS はビルド前**。下ごしらえは終わっていて、`eas build` を叩けば通る状態
- **Android は後回し**（`android.package` だけ入れてある）
- 未プッシュのコミットが3件。プッシュは Claude の自動モードでブロックされるため人が叩く

```bash
cd ~/おもちゃ箱 && git push origin main
```

> git root は **`~/おもちゃ箱`**（親）。`enjoy-golf` 単体ではない。
> `git add -A` は別プロジェクトを巻き込むので、常にパスを明示する。

## 確定していること（変更不可・変更しないこと）

| 項目 | 値 |
|---|---|
| bundle ID / package | `jp.co.hinano.enjoygolfquest` |
| 名義 | 株式会社HINANO（麺の細道と同じ Apple アカウント） |
| 表示名 | Enjoy Golf Quest（ホーム画面は `ENJOY GOLF`） |
| version / buildNumber | 1.0.0 / 1 |
| 配布 | まず **TestFlight 内部テストのみ**（ベータ審査なし） |

麺の細道の bundle ID は `jp.co.hinano.mennohosomichi`。D-U-N-S 登録名は
`HINANO, K.K.`（Inc. ではない）。Apple 側の法人名はそちらに揃える。

## 次にやること

```bash
cd ~/おもちゃ箱/enjoy-golf
npx eas-cli@latest login                                     # HINANO の Apple/Expo アカウント
npx eas-cli@latest build --platform ios --profile production # 20〜30分
```

初回は bundle ID の登録と証明書の作成を聞かれる。すべて EAS に任せてよい。

そのあと（人の作業）:

1. App Store Connect でアプリを登録（名前 / バンドルID / SKU）
2. `.ipa` を **Transporter** で上げる（EAS の submit キューは遅い）
3. TestFlight → 内部テスト。ASC の「ユーザとアクセス」にいる人を入れる

**ビルドが終わったら `.ipa` のパスを Claude に渡すこと。**
`CFBundleVersion` の確認と、直近の修正がバンドルに入っているかのバイト列照合を
毎回やる（1.0 で「修正の入っていないビルドを審査に出していた」事故が起きた箇所）。
Hermes バイトコードなので `strings` では日本語を拾えない。utf-8 と utf-16-le の両方で照合する。

## 未決の判断（人が決める）

**1. iPhone では音が一切鳴らない**
効果音は Web Audio API で合成していて、ネイティブには Web Audio が無い。落ちはしないが、
タイトルの「音 ON / OFF」が何もしないボタンになる。選択肢:

- ネイティブでは音のトグルを出さない（最小修正）
- 同じ波形を WAV に書き出して `expo-audio` で鳴らす（自作素材なのでライセンス問題なし・半日程度）
- このまま出す

**2. `supportsTablet: true` のまま**
審査に出すと iPad のスクリーンショットも要求され、iPad で崩れていれば指摘対象。
iPhone 専用にするなら `false` にするのが楽。TestFlight 内部テストには影響しない。

## 審査で論点になるところ

- **年齢制限は 12+**。酒の描写が33箇所（ビール・乾杯・スキットル・胃薬）。
  年齢制限の質問で「アルコール…の使用または言及」は**「まれ/軽度」**と答える。
  賭博は非該当（「ニアピン勝負、負けたら焼肉」だけで通貨を賭けない）
- **幻想画の肖像**。21枚は写実寄りの人物画。実在の人物に似ていると Guideline 5.2.1 の対象。
  生成元を知る人が確認すること。ドット絵側は帽子の模様も抽象的で商標に見えるものは無い
- **ACEロゴのスプラッシュ**は「HINANO による弁護士法人エースの広告」という建て付け。
  麺の細道 1.0 と同じ構成で通っている。審査メモには
  **「第三者の広告SDKは使っていない。スポンサーのロゴ画像である」と書き分ける**
- **通信ゼロ・ログインなし**。プライバシー申告は「データを収集していません」。
  審査情報の「サインインが必要です」のチェックは**外す**
- スクショは 6.5インチ必須（`1284×2778`）。α付きPNGは弾かれる

## 実機でしか確かめられないこと

1. **パットの引き操作が ScrollView に取られないか**（最優先）。
   `onMoveShouldSetPanResponderCapture` で先取りしているが、iOS のネイティブ
   ScrollView は独自のジェスチャ認識を持つ。「引いてもスクロールする」なら追加対応が要る
2. 幻想画モーダルを**端末の戻る操作**で閉じられるか（`onRequestClose` は配線済み）
3. ドット絵の見え方。ネイティブには `image-rendering: pixelated` 相当が無く、縮小補間はOS任せ
4. ノッチ端末でヘッダーが潜らないこと（対策は入れたが実機未確認）

## このセッションで直した iOS 固有のバグ（5件）

Web では一度も出なかったもの。同種の見落としを疑うときの参考に。

1. 木目ヘッダーが 56pt 固定で安全域を取らず、ノッチ/Dynamic Island に潜る
2. 紹介画面（ヘッダー非表示）も同様に安全域なし
3. AsyncStorage が動的 import で、失敗しても無言でセーブ無し起動になる経路があった
4. **画面端スワイプでラウンドから抜けられた**。`replace` 遷移で下にキャラ選択が残るため、
   ラウンド消滅／初回契約の幻想画を見逃す（二度と出ない）／連戦の run が残る
5. **連戦中にアプリを落とすと摩耗が失われた**。`run` を保存しない設計のため
   `wearBefore` ごと消え、連戦用の 10 が本物として残る。`runWearBefore` を保存して解決

## 手順・道具

- **Web の公開**: `npx expo export --platform web && npx vercel --prod --yes`
  反映確認は `dist/_expo/static/js/web/` のハッシュと本番 HTML のハッシュ一致で見る
- **回帰**: `node tools/regression.js`（数分）。基準値はファイル内に書いてある。
  **比較は同じファイルで取った値どうしで行う**（以前 scratchpad に置いて2度消え、
  書き直したら条件が変わって比較できなくなった）
- **型**: `npx tsc --noEmit` / **依存**: `npx expo-doctor@latest`（現在 18/18）
- 設計と実測の記録は `AUDIT_EVENT_QA_v2.md`（追記式・古い節も残す）

## 触ってはいけないもの

- `src/logic/engine.ts` の契約判定（`CONTRACT_TRUST_MIN` 84・creep 上限・`improvement > 0`）は
  実測で詰めた値。動かすなら回帰を取り直す
- プレイヤーの発言テキストそのもの（極端な選択肢も含めて意図的に残してある）
- 難易度を下げる方向の変更
