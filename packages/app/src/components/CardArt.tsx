import type { ReactElement } from 'react';
import type { Card, Rarity, SpeciesTag, StatColor } from '@chao-draft/sim';

// Basic procedural filler art (roadmap.md, requested directly by the user)
// so every card has *some* visual identity instead of a blank text badge,
// without a real art pipeline or asset budget. Everything here is generated
// from the card's own data (color/rarity/type/speciesTags) — no external
// images, no network calls, nothing hand-authored per card. A future real
// art pass (see roadmap.md's trademark/art checklist) replaces this
// wholesale; this is deliberately simple "flat icon" style, not final art.

const COLOR_GRADIENTS: Record<StatColor | 'colorless', [string, string]> = {
  green: ['#1b4d1f', '#5fb768'],
  red: ['#5c1414', '#d9564f'],
  black: ['#15171c', '#4b5563'],
  blue: ['#0d3b5c', '#4fb3e8'],
  white: ['#6b7a82', '#e4ecef'],
  colorless: ['#33363f', '#8f95a3'],
};

const RARITY_RING: Record<Rarity, string | null> = {
  common: null,
  uncommon: '#3b82f6',
  rare: '#a855f7',
  legendary: '#f59e0b',
};

// FNV-1a — deterministic per-card-id "seed" for icon rotation/flip jitter,
// so same-type/same-species cards don't all render as identical clones.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number, spikes: number): string {
  const points: string[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
  }
  return points.join(' ');
}

const SILHOUETTE = 'rgba(255,255,255,0.88)';
const SILHOUETTE_STROKE = 'rgba(0,0,0,0.3)';

function RabbitIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <ellipse cx={70} cy={54} rx={17} ry={12} />
      <circle cx={70} cy={35} r={10} />
      <ellipse cx={63} cy={18} rx={4} ry={13} transform="rotate(-12 63 18)" />
      <ellipse cx={77} cy={18} rx={4} ry={13} transform="rotate(12 77 18)" />
    </g>
  );
}

function BirdIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <ellipse cx={68} cy={46} rx={15} ry={10} />
      <circle cx={84} cy={38} r={6} />
      <polygon points="90,38 98,36 90,41" />
      <path d="M60,42 Q45,32 58,52 Q64,50 60,42 Z" />
      <polygon points="53,50 44,54 53,58" />
    </g>
  );
}

function FishIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <ellipse cx={72} cy={45} rx={17} ry={9} />
      <polygon points="55,45 40,36 40,54" />
      <polygon points="68,36 76,25 82,37" />
      <circle cx={84} cy={42} r={1.6} fill={SILHOUETTE_STROKE} stroke="none" />
    </g>
  );
}

function ReptileIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <path d="M42,52 Q56,34 72,48 Q88,34 100,44 Q90,58 72,54 Q56,62 42,52 Z" />
      <circle cx={40} cy={49} r={5} />
      <polygon points="60,38 64,30 68,38" />
      <polygon points="74,42 78,34 82,42" />
    </g>
  );
}

function InsectIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <circle cx={54} cy={46} r={9} />
      <circle cx={70} cy={45} r={7} />
      <circle cx={83} cy={44} r={5} />
      <path d="M50,38 L42,26" strokeWidth={1.5} fill="none" />
      <path d="M58,38 L54,24" strokeWidth={1.5} fill="none" />
      <path d="M50,50 L38,52" strokeWidth={1.5} fill="none" />
      <path d="M58,54 L50,62" strokeWidth={1.5} fill="none" />
    </g>
  );
}

function BeastIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <ellipse cx={65} cy={52} rx={18} ry={10} />
      <circle cx={89} cy={41} r={8} />
      <polygon points="84,32 87,24 90,33" />
      <polygon points="92,33 96,25 98,34" />
      <path d="M50,58 Q38,50 44,42" fill="none" strokeWidth={2} />
      <path d="M56,62 L56,70" strokeWidth={1.5} />
      <path d="M68,63 L68,71" strokeWidth={1.5} />
      <path d="M78,62 L78,70" strokeWidth={1.5} />
    </g>
  );
}

function DragonIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <path d="M42,54 Q58,36 76,50 Q92,36 102,46 Q90,60 74,55 Q58,63 42,54 Z" />
      <circle cx={40} cy={51} r={6} />
      <polygon points="35,46 30,38 38,42" />
      <polygon points="36,52 28,52 35,58" />
      <polygon points="70,32 78,18 82,34" />
      <polygon points="86,32 94,20 96,36" />
    </g>
  );
}

const SPECIES_ICON: Record<SpeciesTag, () => ReactElement> = {
  rabbit: RabbitIcon,
  bird: BirdIcon,
  fish: FishIcon,
  reptile: ReptileIcon,
  insect: InsectIcon,
  beast: BeastIcon,
  dragon: DragonIcon,
};

function PotionIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <rect x={65} y={16} width={10} height={12} rx={1.5} />
      <rect x={62} y={12} width={16} height={5} rx={1.5} />
      <path d="M63,28 L58,42 Q56,58 70,58 Q84,58 82,42 L77,28 Z" />
      <path d="M58,44 Q70,50 82,44" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
      <circle cx={66} cy={50} r={1.6} fill="rgba(255,255,255,0.6)" stroke="none" />
      <circle cx={74} cy={47} r={1.2} fill="rgba(255,255,255,0.6)" stroke="none" />
    </g>
  );
}

function TechniqueIcon() {
  return (
    <polygon
      points="76,16 54,48 66,48 62,70 88,36 74,36"
      fill={SILHOUETTE}
      stroke={SILHOUETTE_STROKE}
      strokeWidth={1}
    />
  );
}

function TraitIcon() {
  return (
    <polygon
      points={starPoints(70, 44, 20, 9, 5)}
      fill={SILHOUETTE}
      stroke={SILHOUETTE_STROKE}
      strokeWidth={1}
    />
  );
}

function ItemIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <polygon points="70,16 92,32 84,62 56,62 48,32" />
      <path d="M70,16 L70,62 M48,32 L92,32" stroke="rgba(0,0,0,0.3)" strokeWidth={1} fill="none" />
    </g>
  );
}

function HabitatIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <path d="M30,64 Q70,20 110,64 Z" />
      <rect x={90} y={40} width={4} height={14} />
      <circle cx={92} cy={34} r={9} />
    </g>
  );
}

function SeedIcon() {
  return (
    <g fill={SILHOUETTE} stroke={SILHOUETTE_STROKE} strokeWidth={1}>
      <ellipse cx={70} cy={62} rx={6} ry={4} />
      <path d="M70,62 L70,38" stroke={SILHOUETTE} strokeWidth={2.5} fill="none" />
      <path d="M70,48 Q54,42 56,28 Q72,32 70,48 Z" />
      <path d="M70,42 Q86,36 86,22 Q68,26 70,42 Z" />
    </g>
  );
}

function renderIcon(card: Card): ReactElement {
  switch (card.type) {
    case 'bond': {
      const Icon = SPECIES_ICON[card.speciesTags[0] ?? 'beast'];
      return <Icon />;
    }
    case 'potion':
      return <PotionIcon />;
    case 'technique':
      return <TechniqueIcon />;
    case 'trait':
      return <TraitIcon />;
    case 'item':
      return <ItemIcon />;
    case 'habitat':
      return <HabitatIcon />;
    case 'seed':
      return <SeedIcon />;
    default: {
      const _exhaustive: never = card;
      return _exhaustive;
    }
  }
}

interface CardArtProps {
  card: Card;
}

export function CardArt({ card }: CardArtProps) {
  const seed = hashString(card.id);
  const [from, to] = COLOR_GRADIENTS[card.color];
  const ring = RARITY_RING[card.rarity];
  const gradientId = `card-art-grad-${seed}`;
  const glowId = `card-art-glow-${seed}`;
  const rotation = ((seed % 13) - 6) * 1.2; // small jitter, -7.2..7.2 degrees
  const flip = seed % 2 === 0;
  const isRareOrAbove = card.rarity === 'rare' || card.rarity === 'legendary';

  return (
    <svg viewBox="0 0 140 80" className="card-art" role="img" aria-label={`${card.name} art`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        {isRareOrAbove && (
          <radialGradient id={glowId} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        )}
      </defs>
      <rect
        x={1}
        y={1}
        width={138}
        height={78}
        rx={6}
        fill={`url(#${gradientId})`}
        stroke={ring ?? 'rgba(0,0,0,0.35)'}
        strokeWidth={ring ? 2 : 1}
      />
      {isRareOrAbove && <rect x={1} y={1} width={138} height={78} rx={6} fill={`url(#${glowId})`} />}
      {card.rarity === 'legendary' &&
        [
          [16, 14],
          [122, 18],
          [14, 66],
          [124, 62],
        ].map(([sx, sy], i) => (
          <polygon
            key={i}
            points={starPoints(sx!, sy!, 4, 1.6, 4)}
            fill="rgba(255,236,179,0.85)"
          />
        ))}
      <g
        transform={`translate(70,45) rotate(${rotation}) ${flip ? 'scale(-1,1)' : ''} translate(-70,-45)`}
      >
        {renderIcon(card)}
      </g>
    </svg>
  );
}
