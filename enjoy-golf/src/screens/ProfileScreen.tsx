import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { characters } from '../data/characters';
import { aceConsultPool } from '../data/aceConsults';
import { getTagInsight } from '../data/tagInsights';
import { Strategy, drawStrategyOptions } from '../data/strategies';
import { RoundMood, pickRoundMood, getRoundMood } from '../data/roundMoods';
import { itemsByCharacter } from '../data/items';
import { useGameStore } from '../store/useGameStore';
import { FaceSprite } from '../faces';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const PRE_ROUND_AUTO_MS = 1000;
const PRE_ROUND_FADE_MS = 300;

/** 集められる言葉の総数（相談プールのうち名言として提示されるもの） */
const ACE_QUOTE_TOTAL = aceConsultPool.filter((c) => c.isQuote).length;

export default function ProfileScreen({ route, navigation }: Props) {
  const { characterId, autoStart } = route.params;
  const store = useGameStore();

  /**
   * 一緒に回って分かったこと。同じ意味の文が重複しないよう文面で重複を除く。
   *
   * 保存側でも likesTags / hatesTags と交差させているが、ここでも取り直す。
   * 交差を入れる前に保存された分には的中率2割の混ざり物が残っているため、
   * 表示のたびに絞れば古い保存もそのまま正しくなる。
   */
  const discoveries = useMemo(() => {
    const d = store.getDiscovered(characterId);
    const c = characters.find((x) => x.id === characterId);
    const actual = { liked: c?.likesTags ?? [], hated: c?.hatesTags ?? [] };
    const uniq = (tags: typeof d.liked, kind: 'liked' | 'hated') => [
      ...new Set(
        tags
          .filter((t) => actual[kind].includes(t))
          .map((t) => getTagInsight(t, kind))
          .filter((x): x is string => !!x)
      ),
    ];
    return { liked: uniq(d.liked, 'liked'), hated: uniq(d.hated, 'hated') };
  }, [store, characterId]);
  const character = useMemo(
    () => characters.find((c) => c.id === characterId)!,
    [characterId],
  );

  /**
   * これまでの成績。
   * 相談ラウンドは評価しない場なので記録していない（エースには出ない）。
   */
  /**
   * この相手からもらえる道具。
   * 未取得ならヒントを出す。条件を隠したままだと運で集まるだけになる。
   */
  const gifts = useMemo(
    () =>
      itemsByCharacter(characterId).map((it) => ({
        item: it,
        owned: store.ownedItems.includes(it.id),
      })),
    [characterId, store.ownedItems]
  );

  const record = useMemo(() => {
    const rounds = store.getRoundsPlayed(characterId);
    if (rounds === 0) return null;
    return { rounds, best: store.getPersonalBest(characterId) };
  }, [store, characterId]);

  const isContracted = store.contractedCharacterIds.includes(characterId);
  const totalCharCount = characters.length;

  // ===== Pre-round line modal state =====
  const [showPreRound, setShowPreRound] = useState(false);
  const preRoundOpacity = useRef(new Animated.Value(0)).current;
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  // ===== 今日の作戦（宣言の3択）=====
  // 相手の一言を聞いたあとに決める。順序が逆だと「誰と回るか」を
  // 忘れたまま賭けることになり、読む材料が活きない。
  // 相談ラウンドは創業者と本音で話す場なので宣言しない。
  const [strategyOptions, setStrategyOptions] = useState<Strategy[] | null>(null);
  const [roundMood, setRoundMood] = useState<RoundMood | null>(null);
  const strategyOpacity = useRef(new Animated.Value(0)).current;

  const openStrategyPicker = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setShowPreRound(false);
    if (character.isAce) {
      navigation.replace('GameSimple', { characterId });
      return;
    }
    setStrategyOptions(drawStrategyOptions(characterId));
    // 乱数で引かない。この画面は戻れるので、引き直せると
    // 「上機嫌が出るまで入り直す」が最適手になってしまう
    setRoundMood(
      getRoundMood(
        pickRoundMood(characterId, store.roundsSinceLastCompetition + store.totalContracts)
      )
    );
    strategyOpacity.setValue(0);
    Animated.timing(strategyOpacity, {
      toValue: 1,
      duration: PRE_ROUND_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [character.isAce, characterId, navigation, strategyOpacity, store]);

  const startRound = useCallback(
    (strategy: Strategy) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStrategyOptions(null);
      navigation.replace('GameSimple', {
        characterId,
        strategy: strategy.id,
        roundMood: roundMood?.id ?? null,
      });
    },
    [characterId, navigation, roundMood]
  );

  /**
   * 連戦の次の相手として開かれたときは、作戦の宣言をすぐ出す。
   *
   * 連戦でも作戦と機嫌は要る（賭けの層が抜けると、ただ長いだけになる）。
   * 宣言の UI はこの画面にしか無いので、連戦もここを通す。
   * プロフィールが一瞬見えることで「誰が来たか」も分かる。
   */
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!autoStart || autoOpened.current) return;
    autoOpened.current = true;
    openStrategyPicker();
  }, [autoStart, openStrategyPicker]);

  const handleRoundPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (character.preRoundLine) {
      // Show pre-round line modal
      setShowPreRound(true);
      preRoundOpacity.setValue(0);

      Animated.timing(preRoundOpacity, {
        toValue: 1,
        duration: PRE_ROUND_FADE_MS,
        useNativeDriver: true,
      }).start();

      // Auto advance
      autoTimerRef.current = setTimeout(() => {
        openStrategyPicker();
      }, PRE_ROUND_AUTO_MS);
    } else {
      // No line → 作戦の宣言へ
      openStrategyPicker();
    }
  }, [character, preRoundOpacity, openStrategyPicker]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 連戦の途中で抜けるなら、そこで放棄する。
    // 放置すると摩耗が連戦用の値のまま残り、次に始めた連戦が
    // 前回の続きから始まってしまう。記録は残さない（打ち切りは成績ではない）
    if (store.getRun()) store.abandonRun();
    navigation.goBack();
  }, [navigation, store]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} style={styles.headerBack}>
          <Text style={styles.headerBackText}>{'< 戻る'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <Text style={styles.headerRight}>
          契約 {store.contractedCharacterIds.length}/{totalCharCount}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarFrame}>
            <FaceSprite mood={3} scale={3} characterId={characterId} titleMode />
          </View>
        </View>

        {/* Name */}
        <Text style={styles.charName}>{character.name}</Text>
        {character.title ? (
          <Text style={styles.charTitle}>{character.title}</Text>
        ) : null}
        {character.fullName !== character.name ? (
          <Text style={styles.charFullName}>{character.fullName}</Text>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItemNarrow}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>{character.avgScore18}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ショット</Text>
            <Text style={styles.statValueShot}>{character.shotShape}</Text>
          </View>
        </View>

        {/* Motto */}
        <View style={styles.mottoCard}>
          <Text style={styles.mottoLabel}>座右の銘</Text>
          <Text style={styles.mottoText}>{character.motto}</Text>
        </View>

        {/* 気質（role）。hint（攻略のヒント）や targetHint（紹介文）とは別の
            人物描写で、これまでどこにも表示されていなかった */}
        {character.role && (
          <Text style={styles.roleText}>{character.role}</Text>
        )}

        {/* Hint */}
        {character.hint && (
          <Text style={styles.hintText}>{character.hint}</Text>
        )}

        {/* もらいもの。取ったら中身、まだなら取り方のヒント。
            相手ごとに2つあるので、1つずつカードにすると同じ見出しが並ぶ。
            取得済みと未取得でまとめる */}
        {gifts.some((g) => g.owned) && (
          <View style={styles.discoveryCard}>
            <Text style={styles.discoveryTitle}>もらったもの</Text>
            {gifts
              .filter((g) => g.owned)
              .map(({ item }) => (
                <View key={item.id} style={styles.giftRow}>
                  <Text style={styles.giftName}>{item.name}</Text>
                  <Text style={styles.giftDesc}>{item.desc}</Text>
                </View>
              ))}
          </View>
        )}

        {gifts.some((g) => !g.owned) && (
          <View style={styles.discoveryCard}>
            <Text style={styles.discoveryTitle}>もらえそうなもの</Text>
            {gifts
              .filter((g) => !g.owned)
              .map(({ item }) => (
                <View key={item.id} style={styles.giftRow}>
                  <Text style={styles.giftLocked}>？？？</Text>
                  <Text style={styles.giftDesc}>{item.hint}</Text>
                </View>
              ))}
          </View>
        )}

        {/* これまでの成績。
            グレードと接待スコアは毎ラウンド計算していたのに保存も表示もしていなかった。
            狙う数字が無いと、契約済みの相手を再訪する理由がなくなる */}
        {record && (
          <View style={styles.discoveryCard}>
            <Text style={styles.discoveryTitle}>これまでの成績</Text>
            <View style={styles.recordRow}>
              <Text style={styles.recordLabel}>自己ベスト</Text>
              <Text style={styles.recordValue}>
                {record.best
                  ? `${record.best.grade}（${record.best.score}）`
                  : '—'}
              </Text>
            </View>
            <View style={styles.recordRow}>
              <Text style={styles.recordLabel}>回った回数</Text>
              <Text style={styles.recordValue}>{record.rounds}回</Text>
            </View>
          </View>
        )}

        {/* 一緒に回って分かったこと。
            ヒントが最初から与えられる手がかりなのに対し、こちらは回った回数だけ増える。
            タグ名は内部の都合なので出さず、日本語の一文に置き換える */}
        {(discoveries.liked.length > 0 || discoveries.hated.length > 0) && (
          <View style={styles.discoveryCard}>
            <Text style={styles.discoveryTitle}>一緒に回って分かったこと</Text>
            {discoveries.liked.map((t, i) => (
              <Text key={`dl${i}`} style={styles.discoveryLiked}>・{t}</Text>
            ))}
            {discoveries.hated.map((t, i) => (
              <Text key={`dh${i}`} style={styles.discoveryHated}>・{t}</Text>
            ))}
          </View>
        )}

        {/* もらった言葉（エースのみ）
            相談ラウンドで発動した名言は端末に残るが、これまで表示する場所がなかった。
            ラウンドの入口であるこの画面に置いて、読み返せるようにする。 */}
        {character.isAce && store.aceQuotes.length > 0 && (
          <View style={styles.quotesCard}>
            <Text style={styles.quotesLabel}>
              もらった言葉 {store.aceQuotes.length} / {ACE_QUOTE_TOTAL}
            </Text>
            {store.aceQuotes.map((q, i) => (
              <Text key={i} style={styles.quoteLine}>
                {'「'}{q}{'」'}
              </Text>
            ))}
          </View>
        )}

        {/* Status */}
        <View style={isContracted ? styles.statusContracted : styles.statusUncontracted}>
          <Text style={isContracted ? styles.statusContractedText : styles.statusUncontractedText}>
            {isContracted ? (character.isAce ? '顧問契約済' : '契約済') : '未契約'}
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ height: 24 }} />

        {/* Round button */}
        <Pressable
          style={({ pressed }) => [
            styles.roundButton,
            pressed && styles.roundButtonPressed,
          ]}
          onPress={handleRoundPress}
        >
          <Text style={styles.roundButtonText}>ラウンドする</Text>
        </Pressable>

        {/* Back button */}
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </Pressable>
      </ScrollView>

      {/* ===== Pre-round line modal overlay ===== */}
      {showPreRound && (
        <Pressable style={styles.preRoundOverlay} onPress={openStrategyPicker}>
          <Animated.View style={[styles.preRoundContent, { opacity: preRoundOpacity }]}>
            <View style={styles.preRoundFaceWrap}>
              <FaceSprite mood={4} scale={2} characterId={characterId} />
            </View>
            <View style={styles.preRoundBubble}>
              <Text style={styles.preRoundText}>
                {'\u300C'}{character.preRoundLine}{'\u300D'}
              </Text>
            </View>
            <Text style={styles.preRoundSkip}>TAPでスキップ</Text>
          </Animated.View>
        </Pressable>
      )}

      {/* ===== 今日の作戦 =====
          外側のタップでは閉じない。宣言せずに始められると賭けが成立しない */}
      {strategyOptions && (
        <View style={styles.strategyOverlay}>
          <Animated.View style={[styles.strategyContent, { opacity: strategyOpacity }]}>
            {roundMood && (
              <Text style={styles.strategyTell}>{roundMood.tell}</Text>
            )}
            <Text style={styles.strategyTitle}>今日はどう攻めますか</Text>
            <Text style={styles.strategyNote}>
              決めた路線で押すほど、当たれば大きく伸び、外せば裏目に出ます
            </Text>
            {strategyOptions.map((s) => (
              <Pressable
                key={s.id}
                style={({ pressed }) => [
                  styles.strategyCard,
                  pressed && styles.strategyCardPressed,
                ]}
                onPress={() => startRound(s)}
              >
                <Text style={styles.strategyLabel}>{s.label}</Text>
                <Text style={styles.strategyVow}>{s.vow}</Text>
              </Pressable>
            ))}
            {/* 宣言せずに閉じる道は残す。塞ぐと、様子を見に来ただけの人が
                作戦を選ぶまで画面から出られなくなる。
                閉じても機嫌は変わらない（`pickRoundMood`）ので粘り得にはならない */}
            <Pressable
              style={({ pressed }) => [
                styles.strategyCancel,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => setStrategyOptions(null)}
            >
              <Text style={styles.strategyCancelText}>やめる</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ===== Header =====
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBack: {
    paddingRight: 12,
  },
  headerBackText: {
    color: COLORS.textCream,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
  },
  headerRight: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 12,
  },
  // ===== Content =====
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexGrow: 1,
    // 上詰めのままだと画面が高いほど下が空く（430×932 で下3割が空白だった）。
    // 内容が画面より高いときは flexGrow で伸びた分がゼロになり、従来どおり上端から並ぶ。
    justifyContent: 'center',
  },
  // ===== Avatar =====
  avatarContainer: {
    marginBottom: 16,
  },
  avatarFrame: {
    width: 108,
    height: 108,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // ===== Name =====
  charName: {
    color: COLORS.textCream,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  charFullName: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  charTitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  // ===== Stats =====
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    // 中央寄せの親の中では内容幅に縮んでしまい、球筋が折り返していたので横幅を伸ばす
    alignSelf: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  // Avg は2桁なので幅を取らせず、余った幅を球筋側に回す
  statItemNarrow: {
    width: 56,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '700',
  },
  // 球筋は最長16字（「パワーフェードという名のスライス」）まであるので少し詰める
  statValueShot: {
    color: COLORS.textCream,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 16,
  },
  // ===== Motto =====
  roleText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  quotesCard: {
    backgroundColor: 'rgba(255,215,0,0.07)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    marginBottom: 12,
    width: '100%',
  },
  quotesLabel: {
    color: '#FFD700',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  quoteLine: {
    color: COLORS.textCream,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 8,
  },
  mottoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  mottoLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 2,
  },
  mottoText: {
    color: COLORS.textCream,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  // ===== Hint =====
  /** 一緒に回って分かったこと */
  /** 2つ以上並ぶので、行の間を空ける */
  giftRow: {
    marginTop: 8,
  },
  giftName: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  giftLocked: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  giftDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 19,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recordLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  recordValue: {
    color: '#f0e6c8',
    fontSize: 14,
    fontWeight: '700',
  },
  discoveryCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  discoveryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d8d8c8',
    marginBottom: 8,
  },
  discoveryLiked: {
    fontSize: 13,
    color: '#8FD48F',
    lineHeight: 21,
  },
  discoveryHated: {
    fontSize: 13,
    color: '#E39A9A',
    lineHeight: 21,
  },
  hintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  // ===== Status =====
  statusContracted: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
  },
  statusContractedText: {
    color: '#88DD88',
    fontSize: 12,
    fontWeight: '600',
  },
  statusUncontracted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusUncontractedText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '600',
  },
  // ===== Buttons =====
  roundButton: {
    backgroundColor: COLORS.woodDark,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: COLORS.woodLight,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  roundButtonPressed: {
    opacity: 0.7,
  },
  roundButtonText: {
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  // ===== Pre-round overlay =====
  preRoundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  preRoundContent: {
    alignItems: 'center',
  },
  preRoundFaceWrap: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  preRoundBubble: {
    backgroundColor: '#1e5035',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    marginBottom: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  preRoundText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  preRoundSkip: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
  // ===== 今日の作戦 =====
  strategyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 110,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  strategyContent: {
    width: '100%',
    maxWidth: 340,
  },
  strategyTell: {
    color: '#E8D9A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  strategyTitle: {
    color: '#f5f5f5',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  strategyNote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  strategyCard: {
    backgroundColor: '#1e5035',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  strategyCardPressed: {
    backgroundColor: '#2a6b47',
  },
  strategyLabel: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  strategyVow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
  },
  strategyCancel: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  strategyCancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
});
