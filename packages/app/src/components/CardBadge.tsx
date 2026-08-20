import type { Card } from '@chao-draft/sim';

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

function describeCard(card: Card): string {
  switch (card.type) {
    case 'bond':
      return `${card.slot} · ${card.statGrants.map((g) => `${g.stat} +${g.min}-${g.max}`).join(', ')}`;
    case 'regimen':
      return card.statGrants.map((g) => `${g.stat} +${g.min}-${g.max}`).join(', ');
    case 'technique':
      return `${card.scope} · ${card.energyCost} energy`;
    case 'trait':
      return 'Trait';
    case 'item':
      return 'Item';
    case 'habitat':
      return `+${card.fruitPerRound} Fruit/round`;
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
      <div className="card-badge-header">
        <span>{COLOR_LABEL[card.color]}</span>
        <strong>{card.name}</strong>
      </div>
      <div className="card-badge-rarity">{card.rarity}</div>
      <div className="card-badge-desc">{describeCard(card)}</div>
    </button>
  );
}
