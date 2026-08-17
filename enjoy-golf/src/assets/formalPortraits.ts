import { ImageSourcePropType } from 'react-native';

/**
 * 幻想画は Metro がビルド時に確実に収集できるよう、静的 require で列挙する。
 * 動的な require(`...${id}.jpg`) は使わないこと。
 */
export const FORMAL_PORTRAITS: Record<number, ImageSourcePropType> = {
  1: require('../../assets/character-art/character_01.jpg'),
  2: require('../../assets/character-art/character_02.jpg'),
  3: require('../../assets/character-art/character_03.jpg'),
  4: require('../../assets/character-art/character_04.jpg'),
  5: require('../../assets/character-art/character_05.jpg'),
  6: require('../../assets/character-art/character_06.jpg'),
  7: require('../../assets/character-art/character_07.jpg'),
  8: require('../../assets/character-art/character_08.jpg'),
  9: require('../../assets/character-art/character_09.jpg'),
  10: require('../../assets/character-art/character_10.jpg'),
  11: require('../../assets/character-art/character_11.jpg'),
  12: require('../../assets/character-art/character_12.jpg'),
  13: require('../../assets/character-art/character_13.jpg'),
  14: require('../../assets/character-art/character_14.jpg'),
  15: require('../../assets/character-art/character_15.jpg'),
  16: require('../../assets/character-art/character_16.jpg'),
  17: require('../../assets/character-art/character_17.jpg'),
  18: require('../../assets/character-art/character_18.jpg'),
  19: require('../../assets/character-art/character_19.jpg'),
  20: require('../../assets/character-art/character_20.jpg'),
  21: require('../../assets/character-art/character_21.jpg'),
};

export const getFormalPortrait = (characterId: number): ImageSourcePropType => {
  return FORMAL_PORTRAITS[characterId] ?? FORMAL_PORTRAITS[1];
};
