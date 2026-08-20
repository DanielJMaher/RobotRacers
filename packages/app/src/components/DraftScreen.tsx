import type { Card } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface DraftScreenProps {
  pack: Card[];
  currentRound: number;
  currentPick: number;
  packsPerDraft: number;
  packSize: number;
  onPick: (index: number) => void;
}

export function DraftScreen({
  pack,
  currentRound,
  currentPick,
  packsPerDraft,
  packSize,
  onPick,
}: DraftScreenProps) {
  return (
    <section>
      <h2>
        Draft — Pack {currentRound + 1} of {packsPerDraft}, Pick {currentPick + 1} of {packSize}
      </h2>
      <p>Pick one card. The rest pass to the next seat.</p>
      <div className="card-grid">
        {pack.map((card, index) => (
          <CardBadge key={`${card.id}-${index}`} card={card} onClick={() => onPick(index)} />
        ))}
      </div>
    </section>
  );
}
