import type { Card } from '@chao-draft/sim';
import { describeStaticModifier, describeTriggeredEffect } from '../game/narration';
import { CardArt } from './CardArt';

interface CardBadgeProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
}

const RARITY_COLOR: Record<Card['rarity'], string> = {
  common: '#8a8a8a',
  uncommon: '#3b82f6',
  rare: '#a855f7',
  legendary: '#f59e0b',
};

const COLOR_LABEL: Record<Card['color'], string> = {
  green: '🟢',
  red: '🔴',
  black: '⚫',
  blue: '🔵',
  white: '⚪',
  colorless: '◽',
};

// Formats a signed number range, handling negative grants cleanly (e.g.
// Grinding Stone's -2 Fly downside) — a bare `+${min}-${max}` template reads
// as "+-2--2" once either bound goes negative.
function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function formatStatGrant(grant: { stat: string; min: number; max: number }): string {
  return grant.min === grant.max
    ? `${grant.stat} ${formatSigned(grant.min)}`
    : `${grant.stat} ${formatSigned(grant.min)} to ${formatSigned(grant.max)}`;
}

function describeCard(card: Card): string {
  switch (card.type) {
    case 'bond': {
      // Each grant carries its own region now (a card can touch several) —
      // GDD §3.5, corrected 2026-08-20 — so the region is shown per-grant
      // rather than once for the whole card.
      const grants = card.statGrants
        .map((grant) => `${grant.region ?? '?'} ${formatStatGrant(grant)}`)
        .join(', ');
      // Keyword description added 2026-08-21 (previously invisible — a
      // Bond Card's keyword could fire during a Race with no way to see
      // what it did short of reading the source data).
      return card.keyword ? `${grants} — ${describeTriggeredEffect(card.keyword)}` : grants;
    }
    case 'potion': {
      const grants = card.statGrants.map(formatStatGrant).join(', ');
      return card.secondaryColors && card.secondaryColors.length > 0
        ? `${grants} (blend: ${[card.color, ...card.secondaryColors].join('/')})`
        : grants;
    }
    case 'technique':
      return `${card.energyCost} energy — ${describeTriggeredEffect(card.effect)}`;
    case 'trait':
      return describeTriggeredEffect(card.effect);
    case 'item':
      return 'trigger' in card.effect ? describeTriggeredEffect(card.effect) : describeStaticModifier(card.effect);
    case 'habitat':
      return `+${card.fruitPerRound} Fruit/round`;
    case 'seed':
      return `Plants into a ${card.color} Habitat`;
    default: {
      const _exhaustive: never = card;
      return _exhaustive;
    }
  }
}

export function CardBadge({ card, onClick, selected }: CardBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="card-badge"
      style={{
        borderColor: RARITY_COLOR[card.rarity],
        outline: selected ? '3px solid #22c55e' : 'none',
      }}
    >
      <CardArt card={card} />
      <div className="card-badge-header">
        <span>{COLOR_LABEL[card.color]}</span>
        <strong>{card.name}</strong>
      </div>
      <div className="card-badge-rarity">{card.rarity}</div>
      <div className="card-badge-desc">{describeCard(card)}</div>
      {card.flavorText && <div className="card-badge-flavor">{card.flavorText}</div>}
    </button>
  );
}
