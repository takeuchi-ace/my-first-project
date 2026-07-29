import React, { useEffect, useRef, useState } from 'react';
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
import { competitionMap } from '../data/competitionData';
import { useGameStore } from '../store/useGameStore';
import { FaceSprite } from '../faces';

type Props = NativeStackScreenProps<RootStackParamList, 'CompetitionResult'>;

export default function CompetitionResultScreen({ navigation, route }: Props) {
  const { result, competitionId } = route.params;
  const comp = competitionMap.get(competitionId)!;
  const targetChar = characters.find((c) => c.id === result.targetCharacterId);
  const store = useGameStore();
  const processed = useRef(false);
  // 画面に入った時点の値で固定する。毎レンダー store を見ると、
  // 下の effect が markCompetitionCleared を呼んだ直後に false へ変わり、
  // 解放メッセージ（この値を表示条件にしている）が即座に消えてしまう。
  const isFirstClear = useRef(!store.isCompetitionCleared(competitionId)).current;

  const [unlockMessage, setUnlockMessage] = useState('');

  // Animations
  const fadeResult = useRef(new Animated.Value(0)).current;
  const fadeMessage = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (result.contractSuccess && isFirstClear) {
      // コンペのクリアは「通常ラウンドの解放」であって契約ではない。
      // 対象キャラの解放条件は competitionClear なので markCompetitionCleared だけで足りる。
      // ここで addContractForCharacter を呼ぶと、1度も回っていない相手が契約済になり、
      // 契約数が水増しされて後続キャラ（ミツキ・早瀬・ハジメ）の解放条件まで狂う。
      store.markCompetitionCleared(competitionId);
      setUnlockMessage(comp.unlockText);
    }
  }, [result, competitionId, comp, isFirstClear, store]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeResult, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeMessage, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeButton, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeResult, fadeMessage, fadeButton]);

  const handleDone = () => {
    navigation.popToTop();
  };

  const successText = result.contractSuccess
    ? comp.awardSuccessText
    : comp.awardFailText;

  return (
    <View style={styles.container}>
      {/* Result Section */}
      <Animated.View style={[styles.resultSection, { opacity: fadeResult }]}>
        <Text style={styles.title}>コンペ結果</Text>
        <Text style={styles.compName}>{comp.name}</Text>

        <View style={styles.faceWrap}>
          <FaceSprite
            mood={result.contractSuccess ? 5 : 3}
            scale={2.5}
            characterId={result.targetCharacterId}
          />
        </View>

        <View style={styles.scoreBox}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>信頼度</Text>
            <Text style={[
              styles.scoreValue,
              result.competitionTrust >= comp.trustThreshold
                ? styles.scoreGood
                : styles.scoreBad,
            ]}>
              {result.competitionTrust}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>評判</Text>
            <Text style={[
              styles.scoreValue,
              result.reputation >= comp.reputationThreshold
                ? styles.scoreGood
                : styles.scoreBad,
            ]}>
              {result.reputation}
            </Text>
          </View>
        </View>

      </Animated.View>

      {/* Message Section */}
      <Animated.View style={[styles.messageSection, { opacity: fadeMessage }]}>
        <Text style={styles.messageText}>{successText}</Text>

        {result.contractSuccess && isFirstClear && unlockMessage !== '' && (
          <View style={styles.unlockBox}>
            <Text style={styles.unlockText}>{unlockMessage}</Text>
          </View>
        )}
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles.buttonWrap, { opacity: fadeButton }]}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.7}
        >
          <Text style={styles.doneBtnText}>
            {result.contractSuccess ? 'ロビーへ戻る' : 'もう一度挑戦する'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a3a2a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Result
  resultSection: { alignItems: 'center', marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  compName: {
    fontSize: 14,
    color: 'rgba(255,215,0,0.6)',
    marginBottom: 16,
  },
  faceWrap: { marginBottom: 16 },

  scoreBox: {
    backgroundColor: '#234f34',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreLabel: { fontSize: 16, color: '#a8d5a2' },
  scoreValue: { fontSize: 20, fontWeight: 'bold' },
  scoreGood: { color: '#4CAF50' },
  scoreBad: { color: '#f44336' },


  // Message
  messageSection: { width: '100%', marginBottom: 24 },
  messageText: {
    fontSize: 15,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  unlockBox: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 12,
  },
  unlockText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Button
  buttonWrap: { alignItems: 'center' },
  doneBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1a3a2a' },
});
