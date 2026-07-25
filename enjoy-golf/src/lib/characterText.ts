import { CharacterId, GameEvent, Choice } from '../types';
import { characters } from '../data/characters';

/**
 * イベントテキストへのキャラ名差し込み
 *
 * イベントデータは特定キャラに依存しないよう、対象を
 *   - 「○○さん」（呼びかけ）
 *   - 「相手」（ナレーション・指示）
 * と書いている。表示時にラウンド相手の callName へ差し替える。
 *
 * 差し込み前:  「○○さんこそ、相変わらずお忙しいですか？」「相手のボールが白杭の外へ飛んだ。」
 * 差し込み後:  「田中さんこそ、相変わらずお忙しいですか？」「田中のボールが白杭の外へ飛んだ。」
 *
 * 注意: データ側に「お相手」「相手さん」のような語が入ると壊れる。
 *       対象を指すときは必ず「相手」単体で書くこと。
 */

const NAME_PLACEHOLDER = /○○/g;
const OPPONENT_WORD = /相手/g;

export const getCallName = (characterId: CharacterId): string => {
  const character = characters.find((c) => c.id === characterId);
  return character?.callName ?? '相手';
};

/** 単一のテキストにキャラ名を差し込む */
export function withCharacterName(text: string, characterId: CharacterId): string {
  if (!text) return text;
  const name = getCallName(characterId);
  return text.replace(NAME_PLACEHOLDER, name).replace(OPPONENT_WORD, name);
}

/**
 * イベント全体（タイトル・状況説明・選択肢・セリフ）にキャラ名を差し込む。
 * 元データは共有オブジェクトなので必ずコピーを返す（破壊的変更をしない）。
 */
export function localizeEvent(event: GameEvent, characterId: CharacterId): GameEvent {
  const sub = (t: string) => withCharacterName(t, characterId);

  const choices: Choice[] = event.choices.map((choice) => ({
    ...choice,
    text: sub(choice.text),
    speechOverride: choice.speechOverride ? sub(choice.speechOverride) : choice.speechOverride,
    speech: choice.speech
      ? {
          good: sub(choice.speech.good),
          neutral: sub(choice.speech.neutral),
          bad: sub(choice.speech.bad),
          worst: sub(choice.speech.worst),
        }
      : choice.speech,
  }));

  return {
    ...event,
    title: sub(event.title),
    description: sub(event.description),
    choices,
  };
}
