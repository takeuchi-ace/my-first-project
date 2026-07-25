/**
 * キャラクターポートレート（SVG）
 *
 * - 3キャラ分（田中・鬼塚・坊っちゃん）+ ロックシルエット
 * - SvgXml で描画、PortraitArea にはめ込む
 * - hasPortrait() で対応済みか判定（未対応キャラは既存アバターを表示）
 */

import React from 'react';
import { SvgXml } from 'react-native-svg';
import { CharacterId } from '../types';

/* ================================================================
   共通パレット
   skin=#F3C7A6  shadow=#E8B894  hair=#2B1B12
   suit=#1E2A3A  shirt=#EDE7DC
   ================================================================ */

/* ────────────────────────────────────────
   田中 (ID:1) — 銀行マン
   きっちり分け目、メガネ、ネイビースーツ、ブルータイ
   ──────────────────────────────────────── */
const TANAKA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Shoulders / Suit -->
  <path d="M40 256 L60 185 C70 170, 95 158, 128 155 C161 158, 186 170, 196 185 L216 256 Z"
        fill="#1E2A3A"/>
  <!-- Suit lapel left -->
  <path d="M88 175 L108 195 L100 256 L72 256 Z" fill="#232F42"/>
  <!-- Suit lapel right -->
  <path d="M168 175 L148 195 L156 256 L184 256 Z" fill="#232F42"/>
  <!-- Shirt collar -->
  <path d="M108 165 L118 185 L128 175 L138 185 L148 165 C142 160,134 158,128 157 C122 158,114 160,108 165 Z"
        fill="#EDE7DC"/>
  <!-- Tie -->
  <polygon points="128,175 122,195 128,256 134,195" fill="#3B5998"/>
  <!-- Tie knot -->
  <ellipse cx="128" cy="178" rx="6" ry="4" fill="#2D4580"/>
  <!-- Neck -->
  <rect x="116" y="140" width="24" height="22" rx="6" fill="#F3C7A6"/>
  <rect x="118" y="148" width="20" height="14" rx="4" fill="#E8B894" opacity="0.4"/>
  <!-- Head shape -->
  <ellipse cx="128" cy="100" rx="52" ry="58" fill="#F3C7A6"/>
  <!-- Jaw shadow -->
  <ellipse cx="128" cy="128" rx="40" ry="18" fill="#E8B894" opacity="0.35"/>
  <!-- Hair (neat, center-parted) -->
  <path d="M76 88 C76 52, 100 32, 128 30 C156 32, 180 52, 180 88
           L180 72 C180 42, 158 22, 128 20 C98 22, 76 42, 76 72 Z"
        fill="#2B1B12"/>
  <!-- Part line -->
  <line x1="128" y1="20" x2="128" y2="50" stroke="#1A0F08" stroke-width="1.5"/>
  <!-- Side hair -->
  <path d="M76 88 L74 96 C73 100, 76 100, 78 96 Z" fill="#2B1B12"/>
  <path d="M180 88 L182 96 C183 100, 180 100, 178 96 Z" fill="#2B1B12"/>
  <!-- Eyebrows -->
  <path d="M96 86 Q108 80, 118 85" stroke="#2B1B12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M138 85 Q148 80, 160 86" stroke="#2B1B12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Glasses frame -->
  <rect x="93" y="89" width="28" height="20" rx="3" stroke="#5C5040" stroke-width="2" fill="none"/>
  <rect x="135" y="89" width="28" height="20" rx="3" stroke="#5C5040" stroke-width="2" fill="none"/>
  <line x1="121" y1="97" x2="135" y2="97" stroke="#5C5040" stroke-width="1.5"/>
  <line x1="93" y1="95" x2="82" y2="90" stroke="#5C5040" stroke-width="1.5"/>
  <line x1="163" y1="95" x2="174" y2="90" stroke="#5C5040" stroke-width="1.5"/>
  <!-- Eyes (behind glasses) -->
  <ellipse cx="107" cy="98" rx="5" ry="5" fill="#fff"/>
  <ellipse cx="149" cy="98" rx="5" ry="5" fill="#fff"/>
  <ellipse cx="108" cy="98" rx="3" ry="3" fill="#1A1A1A"/>
  <ellipse cx="150" cy="98" rx="3" ry="3" fill="#1A1A1A"/>
  <ellipse cx="109" cy="97" rx="1" ry="1" fill="#fff"/>
  <ellipse cx="151" cy="97" rx="1" ry="1" fill="#fff"/>
  <!-- Nose -->
  <path d="M126 104 Q128 112, 130 104" stroke="#E0B08A" stroke-width="1.2" fill="none"/>
  <!-- Mouth (serious, tight-lipped) -->
  <line x1="118" y1="120" x2="138" y2="120" stroke="#C49070" stroke-width="1.8" stroke-linecap="round"/>
  <!-- Ears -->
  <ellipse cx="76" cy="100" rx="6" ry="10" fill="#F3C7A6"/>
  <ellipse cx="76" cy="100" rx="3" ry="6" fill="#E8B894" opacity="0.5"/>
  <ellipse cx="180" cy="100" rx="6" ry="10" fill="#F3C7A6"/>
  <ellipse cx="180" cy="100" rx="3" ry="6" fill="#E8B894" opacity="0.5"/>
  <!-- Scorecard in breast pocket -->
  <rect x="90" y="200" width="12" height="16" rx="1" fill="#fff" opacity="0.7"/>
  <line x1="93" y1="204" x2="99" y2="204" stroke="#999" stroke-width="0.5"/>
  <line x1="93" y1="207" x2="99" y2="207" stroke="#999" stroke-width="0.5"/>
  <line x1="93" y1="210" x2="97" y2="210" stroke="#999" stroke-width="0.5"/>
</svg>
`;

/* ────────────────────────────────────────
   鬼塚 (ID:2) — 体育会系社長
   ツンツン髪、太い眉、日焼け肌、ベスト、オレンジタイ、タオル
   ──────────────────────────────────────── */
const ONIZUKA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Shoulders / Vest -->
  <path d="M38 256 L58 188 C68 170, 93 158, 128 155 C163 158, 188 170, 198 188 L218 256 Z"
        fill="#2C4A32"/>
  <!-- Shirt underneath -->
  <path d="M75 195 L85 256 L171 256 L181 195 C170 175, 145 162, 128 160 C111 162, 86 175, 75 195 Z"
        fill="#EDE7DC"/>
  <!-- Vest overlay -->
  <path d="M38 256 L58 188 C68 172, 85 164, 100 162 L92 195 L85 256 Z" fill="#2C4A32"/>
  <path d="M218 256 L198 188 C188 172, 171 164, 156 162 L164 195 L171 256 Z" fill="#2C4A32"/>
  <!-- Open collar -->
  <path d="M108 162 L118 182 L128 172 L138 182 L148 162"
        stroke="#EDE7DC" stroke-width="2" fill="none"/>
  <!-- Orange tie (loose) -->
  <polygon points="128,173 120,198 128,245 136,198" fill="#E67E22"/>
  <ellipse cx="128" cy="176" rx="7" ry="4" fill="#CC6A1A"/>
  <!-- Neck (tanned) -->
  <rect x="114" y="138" width="28" height="24" rx="7" fill="#EDBA8A"/>
  <rect x="116" y="148" width="24" height="14" rx="5" fill="#DCA872" opacity="0.4"/>
  <!-- Head shape (wider jaw) -->
  <ellipse cx="128" cy="96" rx="54" ry="56" fill="#EDBA8A"/>
  <!-- Jaw shadow -->
  <ellipse cx="128" cy="122" rx="44" ry="16" fill="#DCA872" opacity="0.3"/>
  <!-- Hair (spiky) -->
  <polygon points="85,60 78,30 95,50" fill="#2B1B12"/>
  <polygon points="100,48 92,18 110,40" fill="#2B1B12"/>
  <polygon points="118,42 112,10 130,34" fill="#2B1B12"/>
  <polygon points="138,34 128,5 148,28" fill="#2B1B12"/>
  <polygon points="155,42 150,12 165,36" fill="#2B1B12"/>
  <polygon points="168,52 164,24 178,46" fill="#2B1B12"/>
  <!-- Hair base -->
  <path d="M78 70 C78 48, 98 30, 128 28 C158 30, 178 48, 178 70
           L178 60 C178 38, 158 20, 128 18 C98 20, 78 38, 78 60 Z"
        fill="#2B1B12"/>
  <!-- Thick eyebrows -->
  <path d="M92 80 Q107 72, 120 79" stroke="#2B1B12" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M136 79 Q149 72, 164 80" stroke="#2B1B12" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Eyes (confident, slightly narrow) -->
  <ellipse cx="106" cy="94" rx="8" ry="6" fill="#fff"/>
  <ellipse cx="150" cy="94" rx="8" ry="6" fill="#fff"/>
  <ellipse cx="107" cy="94" rx="4" ry="4.5" fill="#1A1A1A"/>
  <ellipse cx="151" cy="94" rx="4" ry="4.5" fill="#1A1A1A"/>
  <ellipse cx="108" cy="93" rx="1.5" ry="1.5" fill="#fff"/>
  <ellipse cx="152" cy="93" rx="1.5" ry="1.5" fill="#fff"/>
  <!-- Lower eyelid (confident squint) -->
  <path d="M98 98 Q106 101, 114 98" stroke="#DCA872" stroke-width="0.8" fill="none"/>
  <path d="M142 98 Q150 101, 158 98" stroke="#DCA872" stroke-width="0.8" fill="none"/>
  <!-- Nose (wider, strong) -->
  <path d="M124 100 Q128 114, 132 100" stroke="#D9A06E" stroke-width="1.5" fill="none"/>
  <path d="M122 112 Q128 116, 134 112" stroke="#D9A06E" stroke-width="1" fill="none"/>
  <!-- Mouth (confident grin) -->
  <path d="M110 124 Q120 136, 128 136 Q136 136, 146 124"
        stroke="#C08060" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Teeth hint -->
  <path d="M116 128 Q128 134, 140 128" fill="#fff" opacity="0.7"/>
  <!-- Ears -->
  <ellipse cx="74" cy="96" rx="7" ry="11" fill="#EDBA8A"/>
  <ellipse cx="74" cy="96" rx="3.5" ry="7" fill="#DCA872" opacity="0.5"/>
  <ellipse cx="182" cy="96" rx="7" ry="11" fill="#EDBA8A"/>
  <ellipse cx="182" cy="96" rx="3.5" ry="7" fill="#DCA872" opacity="0.5"/>
  <!-- Towel on left shoulder -->
  <path d="M44 210 Q52 195, 68 190 L74 205 Q58 210, 50 225 Z" fill="#F5F0E6" opacity="0.85"/>
  <path d="M46 215 Q54 200, 68 195" stroke="#D5CFC0" stroke-width="0.5" fill="none"/>
</svg>
`;

/* ────────────────────────────────────────
   坊っちゃん (ID:3) — 二代目オーナー
   まるい顔、ウェーブ髪、丸目（やや鋭い）、紫ニットベスト、やさしい笑み
   ──────────────────────────────────────── */
const BOCCHAN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Shoulders / Knit vest -->
  <path d="M42 256 L62 190 C72 172, 96 160, 128 157 C160 160, 184 172, 194 190 L214 256 Z"
        fill="#7B68AE"/>
  <!-- Knit texture lines -->
  <line x1="62" y1="210" x2="194" y2="210" stroke="#6A5A9A" stroke-width="0.6" opacity="0.5"/>
  <line x1="58" y1="220" x2="198" y2="220" stroke="#6A5A9A" stroke-width="0.6" opacity="0.5"/>
  <line x1="54" y1="230" x2="202" y2="230" stroke="#6A5A9A" stroke-width="0.6" opacity="0.5"/>
  <line x1="50" y1="240" x2="206" y2="240" stroke="#6A5A9A" stroke-width="0.6" opacity="0.5"/>
  <line x1="46" y1="250" x2="210" y2="250" stroke="#6A5A9A" stroke-width="0.6" opacity="0.5"/>
  <!-- Shirt collar underneath -->
  <path d="M108 165 L118 185 L128 175 L138 185 L148 165 C142 160,134 159,128 158 C122 159,114 160,108 165 Z"
        fill="#EDE7DC"/>
  <!-- Neck -->
  <rect x="117" y="140" width="22" height="22" rx="7" fill="#F3C7A6"/>
  <rect x="119" y="150" width="18" height="12" rx="5" fill="#E8B894" opacity="0.35"/>
  <!-- Head shape (rounder, softer) -->
  <ellipse cx="128" cy="96" rx="50" ry="55" fill="#F3C7A6"/>
  <!-- Cheek blush -->
  <ellipse cx="92" cy="112" rx="12" ry="7" fill="#F0B0A0" opacity="0.25"/>
  <ellipse cx="164" cy="112" rx="12" ry="7" fill="#F0B0A0" opacity="0.25"/>
  <!-- Hair (wavy, soft brown) -->
  <path d="M78 82 C78 48, 100 28, 128 26 C156 28, 178 48, 178 82
           L180 68 C182 38, 158 16, 128 14 C98 16, 74 38, 76 68 Z"
        fill="#5C3A20"/>
  <!-- Wavy hair texture -->
  <path d="M82 56 Q90 48, 100 54 Q110 46, 120 52 Q130 44, 140 50 Q150 44, 160 52 Q170 48, 176 58"
        stroke="#4A2E16" stroke-width="2" fill="none"/>
  <path d="M80 68 Q88 60, 96 66 Q104 58, 112 64 Q120 56, 128 62 Q136 56, 144 64 Q152 58, 160 66 Q168 60, 176 68"
        stroke="#4A2E16" stroke-width="1.5" fill="none" opacity="0.6"/>
  <!-- Side fluff -->
  <path d="M78 82 Q72 88, 76 96 Q78 88, 82 84" fill="#5C3A20"/>
  <path d="M178 82 Q184 88, 180 96 Q178 88, 174 84" fill="#5C3A20"/>
  <!-- Eyebrows (soft, thin) -->
  <path d="M96 84 Q106 80, 116 84" stroke="#5C3A20" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M140 84 Q150 80, 160 84" stroke="#5C3A20" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Eyes (round, but with slight sharpness at outer corner) -->
  <ellipse cx="106" cy="96" rx="9" ry="8" fill="#fff"/>
  <ellipse cx="150" cy="96" rx="9" ry="8" fill="#fff"/>
  <ellipse cx="107" cy="97" rx="5" ry="5.5" fill="#3A2820"/>
  <ellipse cx="151" cy="97" rx="5" ry="5.5" fill="#3A2820"/>
  <ellipse cx="108" cy="95.5" rx="2" ry="2" fill="#fff"/>
  <ellipse cx="152" cy="95.5" rx="2" ry="2" fill="#fff"/>
  <!-- Slight sharp outer corner -->
  <path d="M114 92 L118 90" stroke="#C0A090" stroke-width="0.6" fill="none"/>
  <path d="M142 92 L138 90" stroke="#C0A090" stroke-width="0.6" fill="none"/>
  <!-- Nose (small, soft) -->
  <path d="M126 102 Q128 108, 130 102" stroke="#E0B090" stroke-width="1" fill="none"/>
  <!-- Mouth (gentle smile) -->
  <path d="M116 120 Q122 128, 128 128 Q134 128, 140 120"
        stroke="#C09078" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- Ears -->
  <ellipse cx="78" cy="98" rx="6" ry="9" fill="#F3C7A6"/>
  <ellipse cx="78" cy="98" rx="3" ry="5.5" fill="#E8B894" opacity="0.4"/>
  <ellipse cx="178" cy="98" rx="6" ry="9" fill="#F3C7A6"/>
  <ellipse cx="178" cy="98" rx="3" ry="5.5" fill="#E8B894" opacity="0.4"/>
  <!-- Lollipop stick peeking from vest pocket -->
  <line x1="155" y1="200" x2="162" y2="185" stroke="#D4C8B0" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="164" cy="182" r="5" fill="#E04060"/>
  <circle cx="164" cy="182" r="2.5" fill="#F06080" opacity="0.6"/>
</svg>
`;

/* ────────────────────────────────────────
   ロック（シルエット）
   ──────────────────────────────────────── */
const LOCKED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Shoulders silhouette -->
  <path d="M42 256 L64 190 C76 170, 100 158, 128 155 C156 158, 180 170, 192 190 L214 256 Z"
        fill="#252525"/>
  <!-- Head silhouette -->
  <ellipse cx="128" cy="96" rx="48" ry="54" fill="#1E1E1E"/>
  <!-- Neck silhouette -->
  <rect x="116" y="140" width="24" height="20" rx="6" fill="#222"/>
  <!-- Question mark -->
  <text x="128" y="110" text-anchor="middle" font-size="36" font-weight="bold"
        fill="rgba(255,255,255,0.08)" font-family="sans-serif">?</text>
</svg>
`;

/* ================================================================
   Portrait ID Mapping
   ================================================================ */
const PORTRAIT_MAP: Partial<Record<CharacterId, string>> = {
  1: TANAKA_SVG,
  2: ONIZUKA_SVG,
  3: BOCCHAN_SVG,
};

/** ポートレートが用意されているか */
export const hasPortrait = (id: CharacterId): boolean =>
  PORTRAIT_MAP[id] !== undefined;

/* ================================================================
   Portrait Component
   ================================================================ */
interface PortraitProps {
  characterId: CharacterId | null; // null = locked silhouette
  size: number;
}

export function CharacterPortrait({ characterId, size }: PortraitProps) {
  const xml =
    characterId !== null ? PORTRAIT_MAP[characterId] ?? null : null;
  const svgData = xml ?? LOCKED_SVG;

  return <SvgXml xml={svgData} width={size} height={size} />;
}

export function LockedPortrait({ size }: { size: number }) {
  return <SvgXml xml={LOCKED_SVG} width={size} height={size} />;
}
