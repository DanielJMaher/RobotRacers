import { canPlaceHabitatCard, type Environment } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface HabitatPlacementScreenProps {
  environment: Environment;
  onPlace: (cardIndex: number, slotIndex: number) => void;
  onContinue: () => void;
}

export function HabitatPlacementScreen({ environment, onPlace, onContinue }: HabitatPlacementScreenProps) {
  // Guard against skipping past a still-placeable Habitat card (playtest-prep
  // fix, 2026-08-21): "Continue to Tournament" used to always be enabled, so
  // clicking past this screen with cards still in hand silently discarded
  // them for good (placement only happens here — there's no habitat-placement
  // UI anywhere in the Tournament phase) and permanently starved every seed
  // in `Environment.availableSeeds` of a slot to plant into (planting
  // requires a filled slot). Only disable Continue while at least one
  // unplaced card can still go SOMEWHERE — with only 5 Habitat cards total
  // in the whole game (1 per color) and 3 slots, drafting 4+ distinct colors
  // is possible, and any card that genuinely has nowhere left to go must not
  // soft-lock this screen.
  const hasPlaceableCard = environment.unplacedHabitats.some((_, cardIndex) =>
    environment.slots.some((_, slotIndex) => canPlaceHabitatCard(environment, cardIndex, slotIndex)),
  );

  return (
    <section>
      <h2>Place Your Habitat Cards</h2>
      <p>
        Placement is permanent — a filled slot can only be grown (combine a 2nd same-color card into a
        2-star Habitat), never swapped. Leaving a slot empty is a real strategy ("Open Fort"): it
        produces 1 colorless Wildcard Fruit per trigger instead of sitting inert.
      </p>

      <h3>Environment Slots</h3>
      <ul className="standings-list">
        {environment.slots.map((slot, slotIndex) => (
          <li key={slotIndex}>
            <span>
              Slot {slotIndex + 1}:{' '}
              {slot ? `${slot.color} (${slot.starLevel}-star, ${slot.seedSlots} Seed slot(s))` : 'Open Fort (empty)'}
            </span>
          </li>
        ))}
      </ul>

      <h3>Drawn Habitat Cards ({environment.unplacedHabitats.length})</h3>
      <div className="card-grid">
        {environment.unplacedHabitats.map((card, cardIndex) => (
          <div key={`${card.id}-${cardIndex}`}>
            <CardBadge card={card} />
            <div className="event-buttons">
              {environment.slots.map((_, slotIndex) => (
                <button
                  key={slotIndex}
                  type="button"
                  disabled={!canPlaceHabitatCard(environment, cardIndex, slotIndex)}
                  onClick={() => onPlace(cardIndex, slotIndex)}
                >
                  Place in Slot {slotIndex + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasPlaceableCard && (
        <p className="hint-text">
          You still have a Habitat card that can be placed — place it (or accept losing it) before
          continuing. Habitat cards are gone for good once you leave this screen.
        </p>
      )}
      <div className="event-buttons">
        <button type="button" onClick={onContinue} disabled={hasPlaceableCard}>
          Continue to Tournament
        </button>
      </div>
    </section>
  );
}
