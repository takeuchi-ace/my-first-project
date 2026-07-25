import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Character, CharacterId } from '../types';
import { characters } from '../data/characters';
import {
  getContractCount,
  isAceUnlocked,
  getAceBalls,
  isContracted,
  canUnlock,
  getPendingReveals,
  clearPendingReveals,
  isCompetitionAvailable,
  getNextCompetition,
  getClearedCompetitions,
  isCompetitionCleared,
  onCompetitionStart,
} from '../data/globalState';
import { competitionMap } from '../data/competitionData';
import { CompetitionId } from '../types';
import { FaceSprite } from '../faces';
import { LockedPortrait } from '../portraits';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type CharStatus = 'locked' | 'available' | 'contracted';

/* ===== Design Tokens ===== */
const GOLD = '#C9A44C';
const GOLD_DIM = 'rgba(201,164,76,0.6)';
const WOOD_BASE = '#3A2618';
const WOOD_DARK = '#2B1B12';
const WOOD_LIGHT = '#4A2F1D';
const FOREST = '#173F2C';
const PORTRAIT_BG = '#1C4A34';
const FRAME_INNER_CLR = '#5C3A20';
const CREAM = '#E8DCC8';

/* ===== Layout ===== */
const CARD_GAP = 20;
const CONTENT_PAD = 16;
const CARD_MAX_W = 260;
const AVATAR_SIZE = 64;

/* ===== All character IDs (flat, tier-ordered) ===== */
const ALL_IDS: CharacterId[] = characters.map((c) => c.id);

const charMap = new Map(characters.map((c, i) => [c.id, { char: c, idx: i }]));

const getShortName = (name: string): string => {
  const i = name.indexOf('・');
  return i >= 0 ? name.slice(i + 1) : name;
};

/* ===== Responsive columns ===== */
const getCols = (w: number): number => {
  if (w >= 1100) return 4;
  if (w >= 800) return 3;
  return 2;
};

/* ===== Wood Grain (subtle header texture) ===== */
const GRAIN_DATA = Array.from({ length: 20 }, (_, i) => ({
  top: i * 10 + (i % 3) * 3,
  height: i % 3 === 0 ? 1 : 0.5,
  color: i % 2 === 0 ? WOOD_LIGHT : WOOD_DARK,
  opacity: 0.1 + (i % 5) * 0.025,
}));

function WoodGrain() {
  return (
    <>
      {GRAIN_DATA.map((g, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: g.top,
            height: g.height,
            backgroundColor: g.color,
            opacity: g.opacity,
          }}
        />
      ))}
    </>
  );
}

/* ===== Main ===== */
export default function HomeScreen({ navigation }: Props) {
  const { width: screenW } = useWindowDimensions();
  const cols = getCols(screenW);
  const cardW = Math.min(
    (screenW - CONTENT_PAD * 2 - CARD_GAP * (cols - 1)) / cols,
    CARD_MAX_W
  );

  const [selected, setSelected] = useState<Character | null>(null);
  const [contracts, setContracts] = useState(getContractCount());
  const [aceUnlocked, setAceUnlocked] = useState(isAceUnlocked());
  const [aceBallCount, setAceBallCount] = useState(getAceBalls());
  const [tick, setTick] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  // Competition state
  const [compAvailable, setCompAvailable] = useState(false);
  const [nextCompId, setNextCompId] = useState<CompetitionId | null>(null);
  const [clearedComps, setClearedComps] = useState<CompetitionId[]>([]);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const revealAnims = useRef(new Map<CharacterId, Animated.Value>()).current;

  useFocusEffect(
    useCallback(() => {
      setContracts(getContractCount());
      setAceUnlocked(isAceUnlocked());
      setAceBallCount(getAceBalls());
      setCompAvailable(isCompetitionAvailable());
      setNextCompId(getNextCompetition());
      setClearedComps(getClearedCompetitions());
      setTick((t) => t + 1);

      const reveals = getPendingReveals();
      if (reveals.length > 0) {
        clearPendingReveals();
        reveals.forEach((id) => revealAnims.set(id, new Animated.Value(0)));

        setToastVisible(true);
        Animated.sequence([
          Animated.timing(toastAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(toastAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => setToastVisible(false));

        Animated.stagger(
          200,
          reveals.map((id) =>
            Animated.timing(revealAnims.get(id)!, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            })
          )
        ).start(() => {
          reveals.forEach((id) => revealAnims.delete(id));
          setTick((t) => t + 1);
        });
      }
    }, [])
  );

  const getStatus = (char: Character): CharStatus => {
    if (isContracted(char.id)) return 'contracted';
    if (canUnlock(char)) return 'available';
    return 'locked';
  };

  const handleStart = () => {
    if (!selected) return;
    const id = selected.id;
    setSelected(null);
    navigation.navigate('Game', { characterId: id });
  };

  /* ===== Card: PortraitArea + InfoStrip inside frame, Name + Motto outside ===== */
  const renderCard = (id: CharacterId) => {
    const entry = charMap.get(id)!;
    const char = entry.char;
    const status = getStatus(char);
    const sn = getShortName(char.name);
    const isAce = char.isAce;
    const anim = revealAnims.get(id);
    const isLocked = status === 'locked';

    /* ---- Shared frame content ---- */
    const frameContent = (
      <View
        style={[
          styles.frame,
          isAce && !isLocked && styles.frameAce,
          isLocked && styles.frameLocked,
        ]}
      >
        <View style={[styles.frameInner, isLocked && styles.frameInnerLocked]}>
          {/* PortraitArea (upper) */}
          <View
            style={[
              styles.portraitArea,
              isLocked && styles.portraitAreaLocked,
            ]}
          >
            {isLocked ? (
              <LockedPortrait size={AVATAR_SIZE} />
            ) : (
              <FaceSprite mood={3} scale={2} characterId={char.id} titleMode />
            )}
          </View>
          {/* InfoStrip (lower) */}
          <View style={styles.infoStrip}>
            <Text
              style={[styles.infoText, isLocked && styles.infoTextLocked]}
              numberOfLines={1}
            >
              {isLocked
                ? '- - -'
                : `Avg ${char.avgScore18} | ${char.shotShape}`}
            </Text>
          </View>
        </View>
        {/* Contracted badge (top-right) */}
        {status === 'contracted' && (
          <Text style={styles.contractedBadge}>✔</Text>
        )}
        {/* ACE label (top-left) */}
        {isAce && !isLocked && (
          <Text style={styles.aceFrameLabel}>ACE</Text>
        )}
      </View>
    );

    /* ---- Text below frame ---- */
    const textContent = (
      <>
        <Text
          style={[
            styles.cardName,
            isAce && !isLocked && styles.cardNameAce,
            isLocked && styles.cardNameLocked,
          ]}
          numberOfLines={1}
        >
          {isLocked ? '？？？' : char.name}
        </Text>
        <Text
          style={[styles.cardMotto, isLocked && styles.cardMottoLocked]}
          numberOfLines={1}
        >
          {isLocked ? '……' : `「${char.motto}」`}
        </Text>
      </>
    );

    /* ---- Reveal animation ---- */
    if (anim) {
      const scale = anim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.92, 1.05, 1],
      });
      const opacity = anim.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 0.5, 1],
      });
      return (
        <Animated.View
          key={id}
          style={[
            styles.cardContainer,
            { width: cardW, transform: [{ scale }], opacity },
          ]}
        >
          {frameContent}
          {textContent}
        </Animated.View>
      );
    }

    /* ---- Locked ---- */
    if (isLocked) {
      return (
        <View key={id} style={[styles.cardContainer, { width: cardW }]}>
          {frameContent}
          {textContent}
        </View>
      );
    }

    /* ---- Available / Contracted ---- */
    return (
      <TouchableOpacity
        key={id}
        style={[styles.cardContainer, { width: cardW }]}
        onPress={() => setSelected(char)}
        activeOpacity={0.85}
      >
        {frameContent}
        {textContent}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ========================================
          Header — ダークウォルナット木目（維持）
          ======================================== */}
      <View style={styles.header}>
        <WoodGrain />
        <View style={styles.contractInfoRow}>
          <Text style={styles.contractInfoText}>
            契約 {contracts} / 16{'    '}顧問契約：{aceUnlocked ? '済' : '未'}
          </Text>
        </View>
        <Text style={styles.title}>ENJOY GOLF</Text>
        <Text style={styles.subtitle}>接待ゴルフ倶楽部</Text>
        <View style={styles.goldLine} />
      </View>

      {/* ACE badge */}
      {aceUnlocked && (
        <View style={styles.aceBadge}>
          <Text style={styles.aceBadgeText}>
            {aceBallCount > 0
              ? `ACE BALL ×${aceBallCount}`
              : 'ACE BALL ×0（補充するにはエースラウンドへ）'}
          </Text>
        </View>
      )}

      {/* ========================================
          Competition Banner
          ======================================== */}
      {compAvailable && nextCompId && (() => {
        const comp = competitionMap.get(nextCompId);
        if (!comp) return null;
        const referrer = characters.find((c) => c.id === comp.referrerId);
        return (
          <TouchableOpacity
            style={styles.compBanner}
            activeOpacity={0.8}
            onPress={() => {
              onCompetitionStart();
              navigation.navigate('Competition', { competitionId: nextCompId });
            }}
          >
            <Text style={styles.compBannerTitle}>{comp.name}</Text>
            <Text style={styles.compBannerComment}>
              {referrer?.name ?? ''}「{comp.referrerComment}」
            </Text>
            <Text style={styles.compBannerAction}>参加する →</Text>
          </TouchableOpacity>
        );
      })()}

      {/* Cleared competitions (常設) */}
      {clearedComps.map((cid) => {
        const comp = competitionMap.get(cid);
        if (!comp) return null;
        return (
          <TouchableOpacity
            key={cid}
            style={styles.compClearedBanner}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('Competition', { competitionId: cid });
            }}
          >
            <Text style={styles.compClearedTitle}>{comp.name}</Text>
            <Text style={styles.compClearedLabel}>クリア済み・常設</Text>
          </TouchableOpacity>
        );
      })}

      {/* ========================================
          Grid Content — 名簿ボード
          ======================================== */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instruction}>相手を選んでください</Text>
        <View style={styles.grid}>
          {ALL_IDS.map((id) => renderCard(id))}
        </View>
      </ScrollView>

      {/* ========================================
          Toast
          ======================================== */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>紹介が発生しました</Text>
        </Animated.View>
      )}

      {/* ========================================
          Detail Modal
          ======================================== */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selected && (
              <>
                <View style={styles.modalAvatarRow}>
                  <FaceSprite mood={3} scale={2} characterId={selected.id} titleMode />
                </View>

                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalRole}>{selected.role}</Text>

                {selected.isAce && (
                  <View style={styles.modalAceTag}>
                    <Text style={styles.modalAceTagText}>FINAL BOSS</Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>平均スコア（18H）</Text>
                  <Text style={styles.modalValue}>{selected.avgScore18}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>持ち球</Text>
                  <Text style={styles.modalValue}>{selected.shotShape}</Text>
                </View>
                <View style={styles.modalMottoBox}>
                  <Text style={styles.modalMottoLabel}>座右の銘</Text>
                  <Text style={styles.modalMottoText}>
                    「{selected.motto}」
                  </Text>
                </View>

                {isContracted(selected.id) && (
                  <Text style={styles.modalContracted}>
                    契約済み（再挑戦可）
                  </Text>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSelected(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>戻る</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStart}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.startText}>この相手で開始</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FOREST },

  /* ────── Header (wood grain, maintained) ────── */
  header: {
    backgroundColor: WOOD_BASE,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  contractInfoRow: { alignItems: 'flex-end', marginBottom: 4 },
  contractInfoText: { fontSize: 11, color: GOLD, letterSpacing: 0.5 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: GOLD_DIM,
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: 2,
  },
  goldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GOLD,
  },

  /* ────── ACE badge ────── */
  aceBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginTop: 8,
  },
  aceBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: GOLD,
    letterSpacing: 1,
  },

  /* ────── Competition Banner ────── */
  compBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    alignItems: 'center',
  },
  compBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 4,
  },
  compBannerComment: {
    fontSize: 12,
    color: CREAM,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  compBannerAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: GOLD,
  },
  compClearedBanner: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(201,164,76,0.3)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compClearedTitle: {
    fontSize: 13,
    color: GOLD_DIM,
  },
  compClearedLabel: {
    fontSize: 10,
    color: 'rgba(201,164,76,0.5)',
  },

  /* ────── Content ────── */
  scrollContent: {
    paddingHorizontal: CONTENT_PAD,
    paddingTop: 12,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    color: GOLD_DIM,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },

  /* ────── Grid (flat roster board) ────── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: CARD_GAP,
  },

  /* ────── Card container ────── */
  cardContainer: {
    alignItems: 'center',
  },

  /* ────── Frame (額縁 — 直角, 3px金縁) ────── */
  frame: {
    width: '100%',
    borderWidth: 3,
    borderColor: GOLD,
    backgroundColor: FOREST,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  frameAce: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
  },
  frameLocked: {
    borderColor: 'rgba(201,164,76,0.3)',
  },
  frameInner: {
    margin: 2,
    borderWidth: 1,
    borderColor: FRAME_INNER_CLR,
  },
  frameInnerLocked: {
    borderColor: 'rgba(92,58,32,0.25)',
  },

  /* ────── PortraitArea (upper half of frame) ────── */
  portraitArea: {
    height: AVATAR_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PORTRAIT_BG,
  },
  portraitAreaLocked: {
    backgroundColor: '#102A1D',
  },

  /* ────── InfoStrip (lower band inside frame) ────── */
  infoStrip: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 10,
    color: 'rgba(232,226,214,0.65)',
    textAlign: 'center',
  },
  infoTextLocked: {
    color: 'rgba(255,255,255,0.12)',
  },

  /* ────── (Avatar/Silhouette removed — now using FaceSprite / LockedPortrait) ────── */

  /* ────── Contracted badge (frame top-right) ────── */
  contractedBadge: {
    position: 'absolute',
    top: 5,
    right: 6,
    fontSize: 11,
    color: GOLD,
    fontWeight: 'bold',
    zIndex: 1,
  },

  /* ────── ACE label (frame top-left) ────── */
  aceFrameLabel: {
    position: 'absolute',
    top: 5,
    left: 6,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
    zIndex: 1,
  },

  /* ────── Card text (name plate + motto below frame) ────── */
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CREAM,
    marginTop: 5,
    textAlign: 'center',
  },
  cardNameAce: { color: '#FFD700' },
  cardNameLocked: { color: 'rgba(255,255,255,0.2)' },
  cardMotto: {
    fontSize: 9,
    color: 'rgba(232,220,200,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 1,
  },
  cardMottoLocked: {
    color: 'rgba(255,255,255,0.1)',
  },

  /* ────── Toast ────── */
  toast: {
    position: 'absolute',
    top: 150,
    alignSelf: 'center',
    backgroundColor: 'rgba(58,38,24,0.95)',
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 1,
  },

  /* ────── Modal ────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#1E3A28',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: GOLD,
  },
  modalAvatarRow: { alignItems: 'center', marginBottom: 12 },
  /* (modalPortraitFrame / modalAvatar removed — now using FaceSprite) */
  modalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CREAM,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalRole: {
    fontSize: 13,
    color: 'rgba(232,220,200,0.65)',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalAceTag: {
    alignSelf: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  modalAceTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.35,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: { fontSize: 14, color: 'rgba(232,220,200,0.65)' },
  modalValue: { fontSize: 16, fontWeight: 'bold', color: CREAM },
  modalMottoBox: {
    backgroundColor: 'rgba(201,164,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,164,76,0.2)',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalMottoLabel: { fontSize: 11, color: GOLD_DIM, marginBottom: 4 },
  modalMottoText: {
    fontSize: 15,
    color: CREAM,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalContracted: {
    fontSize: 12,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  startButton: {
    flex: 2,
    backgroundColor: GOLD,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startText: { fontSize: 15, color: WOOD_DARK, fontWeight: 'bold' },
});
