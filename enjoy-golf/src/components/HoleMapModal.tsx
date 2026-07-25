/**
 * HoleMapModal — 9 ホール俯瞰図の一覧モーダル
 *
 * GameScreen のヘッダーから開く想定。3 列 × 3 行で全ホールを表示し、
 * 現在のホールはハイライト表示する。
 */

import React from 'react';
import { Modal, Pressable, View, Text, StyleSheet, ScrollView } from 'react-native';
import { CharacterId } from '../types';
import { getCourseLayout } from '../data/holeLayouts';
import { HoleMap } from './HoleMap';

interface Props {
  visible: boolean;
  characterId: CharacterId;
  currentHole: number;
  onClose: () => void;
}

export function HoleMapModal({ visible, characterId, currentHole, onClose }: Props) {
  const course = getCourseLayout(characterId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>コースマップ</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            {course.map((hole) => {
              const isCurrent = hole.hole === currentHole;
              return (
                <View
                  key={hole.hole}
                  style={[styles.cell, isCurrent && styles.cellCurrent]}
                >
                  <HoleMap layout={hole} width={92} height={92} />
                  <View style={styles.cellInfo}>
                    <Text style={[styles.cellHole, isCurrent && styles.cellHoleCurrent]}>
                      H{hole.hole}
                    </Text>
                    <Text style={styles.cellPar}>P{hole.par}</Text>
                    <Text style={styles.cellYards}>{hole.yards}y</Text>
                  </View>
                  {hole.nickname && (
                    <Text style={styles.cellNickname} numberOfLines={1}>
                      {hole.nickname}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.legend}>
            <LegendItem color="#5fa86c" label="フェアウェイ" />
            <LegendItem color="#9ad77a" label="グリーン" />
            <LegendItem color="#e8d27a" label="バンカー" />
            <LegendItem color="#4d9ed6" label="池" />
            <LegendItem color="#1a3d22" label="樹木" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#1f3d2c',
    borderWidth: 2,
    borderColor: '#C9A44C',
    borderRadius: 12,
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#F5E6C8',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  cell: {
    width: '32%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cellCurrent: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  cellInfo: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    alignItems: 'center',
  },
  cellHole: {
    color: '#F5E6C8',
    fontSize: 11,
    fontWeight: '700',
  },
  cellHoleCurrent: {
    color: '#FFD700',
  },
  cellPar: {
    color: 'rgba(245, 230, 200, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  cellYards: {
    color: 'rgba(245, 230, 200, 0.6)',
    fontSize: 9,
  },
  cellNickname: {
    color: 'rgba(245, 230, 200, 0.7)',
    fontSize: 9,
    marginTop: 1,
    maxWidth: '100%',
  },
  legend: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  legendLabel: {
    color: 'rgba(245, 230, 200, 0.85)',
    fontSize: 10,
  },
});
