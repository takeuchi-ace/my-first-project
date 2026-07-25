import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { characters } from '../data/characters';
import { FaceSprite } from '../faces';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

const AVATAR_COLORS = [
  '#3498db', '#e67e22', '#9b59b6', '#2c3e50', '#d35400',
  '#16a085', '#c0392b', '#2980b9', '#e74c3c', '#f39c12',
  '#1abc9c', '#8e44ad', '#27ae60', '#34495e', '#e74c3c',
  '#FFD700',
];

const charMap = new Map(characters.map((c, i) => [c.id, { char: c, idx: i }]));

const getShortName = (name: string): string => {
  const i = name.indexOf('・');
  return i >= 0 ? name.slice(i + 1) : name;
};

export default function IntroScreen({ navigation, route }: Props) {
  const { contractedCharId, newlyUnlockedIds, isAceContract, isRepeatAce, lunchMood } = route.params;
  const contracted = charMap.get(contractedCharId);
  const contractedChar = contracted?.char;
  const contractedIdx = contracted?.idx ?? 0;
  const avatarColor = isAceContract
    ? '#FFD700'
    : AVATAR_COLORS[contractedIdx % AVATAR_COLORS.length];

  const newChars = newlyUnlockedIds
    .map((id) => charMap.get(id))
    .filter(Boolean)
    .map((e) => e!.char);

  // Check if ACE was newly unlocked
  const aceChar = useMemo(() => newChars.find((c) => c.isAce), [newChars]);
  const nonAceChars = useMemo(() => newChars.filter((c) => !c.isAce), [newChars]);

  const [showHints, setShowHints] = useState(false);
  const [showContractHint, setShowContractHint] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const contractHintAnim = useRef(new Animated.Value(0)).current;

  // 昼印象テキスト判定
  const lunchPositive = lunchMood === 'good';
  const lunchNegative = lunchMood === 'bad';

  useEffect(() => {
    // Step 1: Fade in (introLine visible)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Step 2: targetHint after 0.8s
    const hintTimer = setTimeout(() => {
      setShowHints(true);
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Step 3: contract hint after 1.6s (0.8s + 0.8s)
    const contractHintTimer = setTimeout(() => {
      setShowContractHint(true);
      Animated.timing(contractHintAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1600);

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(contractHintTimer);
    };
  }, []);

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.introContent, { opacity: fadeAnim }]}>
        {/* Face */}
        <View style={isAceContract ? styles.aceFaceWrap : styles.faceWrap}>
          <FaceSprite mood={5} scale={2.5} characterId={contractedCharId} />
        </View>
        <Text style={styles.charName}>{contractedChar?.name ?? ''}</Text>

        {/* introLine */}
        <View style={styles.speechBubble}>
          <Text style={styles.introLine}>
            {contractedChar?.introLine ?? ''}
          </Text>
        </View>

        {/* Target hints (appear after 0.8s) */}
        {showHints && (nonAceChars.length > 0 || aceChar) && (
          <Animated.View style={[styles.hintsBox, { opacity: hintAnim }]}>
            {nonAceChars.map((c) => (
              <View key={c.id} style={styles.hintCard}>
                <Text style={styles.hintText}>{c.targetHint}</Text>
              </View>
            ))}
            {aceChar && (
              <View style={styles.aceUnlockCard}>
                <Text style={styles.aceUnlockTitle}>特別な人物</Text>
                <Text style={styles.aceUnlockName}>{aceChar.name}</Text>
                <Text style={styles.aceUnlockDesc}>
                  あなたの実績が認められました。
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Lunch impact text (appear with hints) */}
        {showHints && (lunchPositive || lunchNegative) && (
          <Animated.View style={[styles.lunchImpactBox, { opacity: hintAnim }]}>
            {lunchPositive && (
              <Text style={styles.lunchPositiveText}>
                昼の時間、良かったですね。
              </Text>
            )}
            {lunchNegative && (
              <Text style={styles.lunchNegativeText}>
                午後は少し考えさせられました。
              </Text>
            )}
          </Animated.View>
        )}

        {/* Contract hint text + button (appear after 1.6s) */}
        {showContractHint && (
          <Animated.View
            style={[styles.contractHintArea, { opacity: contractHintAnim }]}
          >
            {isAceContract ? (
              <>
                <Text style={styles.aceHintTop}>
                  {isRepeatAce
                    ? '今日もいい時間でしたね。'
                    : '紹介、ではありません。'}
                </Text>
                <Text style={styles.aceHintBottom}>
                  {isRepeatAce
                    ? 'これからも、末永くよろしくお願いします。'
                    : '顧問としてご一緒しましょう。'}
                </Text>
              </>
            ) : (
              <Text style={styles.contractHintText}>
                契約の話も、前向きに進めましょう。
              </Text>
            )}

            <TouchableOpacity
              style={isAceContract ? styles.aceButton : styles.acceptButton}
              onPress={handleDone}
              activeOpacity={0.7}
            >
              <Text
                style={
                  isAceContract ? styles.aceButtonText : styles.acceptText
                }
              >
                {isAceContract ? '了解' : '紹介を受ける'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26,71,42,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  introContent: { alignItems: 'center', width: '100%' },

  faceWrap: {
    marginBottom: 8,
  },
  aceFaceWrap: {
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 4,
  },

  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  aceAvatarCircle: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  charName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },

  speechBubble: {
    backgroundColor: '#2d6a3f',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  introLine: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },

  hintsBox: { width: '100%', marginBottom: 16 },
  hintCard: {
    backgroundColor: '#234f34',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  hintText: {
    fontSize: 14,
    color: '#c8e6c4',
    lineHeight: 20,
  },
  aceUnlockCard: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  aceUnlockTitle: {
    fontSize: 12,
    color: 'rgba(255,215,0,0.7)',
    marginBottom: 4,
  },
  aceUnlockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  aceUnlockDesc: {
    fontSize: 13,
    color: 'rgba(255,215,0,0.6)',
  },

  // Lunch impact
  lunchImpactBox: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  lunchPositiveText: {
    fontSize: 15,
    color: '#FFB74D',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  lunchNegativeText: {
    fontSize: 15,
    color: '#e57373',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Contract hint area (step 3)
  contractHintArea: { alignItems: 'center', width: '100%' },
  contractHintText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },

  // ACE hint
  aceHintTop: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 6,
  },
  aceHintBottom: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },

  // Buttons
  acceptButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  acceptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  aceButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  aceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a472a',
  },
});
