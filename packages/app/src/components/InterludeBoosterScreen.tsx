import type { InterludeDraftState } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface InterludeBoosterScreenProps {
  interlude: InterludeDraftState;
  round: 1 | 2;
  onPick: (index: number) => void;
}

export function InterludeBoosterScreen({ interlude, round, onPick }: InterludeBoosterScreenProps) {
  const pack = interlude.packs[interlude.currentPackIndex] ?? [];

  return (
    <section>
      <h2>
        Environment Interlude #{round} — Pack {interlude.currentPackIndex + 1} of {interlude.packs.length}
      </h2>
      <p>Pick one card per pack. No passing — this is a solo choice, much smaller stakes than the main draft.</p>
      <div className="card-grid">
        {pack.map((card, index) => (
          <CardBadge key={`${card.id}-${index}`} card={card} onClick={() => onPick(index)} />
        ))}
      </div>
    </section>
  );
}
