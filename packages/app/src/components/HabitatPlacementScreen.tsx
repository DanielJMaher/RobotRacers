import type { StatColor } from '@chao-draft/sim';
import { canPlaceHabitatCard, type Environment } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface HabitatPlacementScreenProps {
  environment: Environment;
  onChoose: (slotIndex: number, color: StatColor | undefined) => void;
  onPlace: (cardIndex: number, slotIndex: number) => void;
  onContinue: () => void;
}

const COLOR_CHOICES: { color: StatColor; label: string }[] = [
  { color: 'green', label: '🟢 Green' },
  { color: 'red', label: '🔴 Red' },
  { color: 'black', label: '⚫ Black' },
  { color: 'blue', label: '🔵 Blue' },
  { color: 'white', label: '⚪ White' },
];

export function HabitatPlacementScreen({ environment, onChoose, onPlace, onContinue }: HabitatPlacementScreenProps) {
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
      <h2>Choose Your Habitats</h2>
      <p>
        Pick a color (or Open Fort) for each of your 3 Environment slots — freely, any color, any slot,
        no draft required. Freely re-pickable until you continue; once the Tournament begins, a slot's
        color locks in for good (it can still be grown to 2-star with a matching drafted Habitat card
        below, never swapped to a different color). Open Fort produces 1 colorless Wildcard Fruit per
        trigger instead of sitting inert — a real, deliberate strategy, not a placeholder.
      </p>

      <h3>Environment Slots</h3>
      <ul className="standings-list">
        {environment.slots.map((slot, slotIndex) => {
          const locked = slot?.starLevel === 2;
          return (
            <li key={slotIndex}>
              <span>
                Slot {slotIndex + 1}:{' '}
                {slot ? `${slot.color} (${slot.starLevel}-star, ${slot.seedSlots} Seed slot(s))` : 'Open Fort'}
                {locked ? ' — locked in (2-star)' : ''}
              </span>
              <span className="scouting-icons">
                {COLOR_CHOICES.map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    className="slot-assign-btn"
                    disabled={locked}
                    aria-pressed={slot?.color === color}
                    onClick={() => onChoose(slotIndex, color)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="slot-assign-btn"
                  disabled={locked}
                  aria-pressed={slot === undefined}
                  onClick={() => onChoose(slotIndex, undefined)}
                >
                  Open Fort
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {environment.unplacedHabitats.length > 0 && (
        <>
          <h3>Drawn Habitat Cards ({environment.unplacedHabitats.length})</h3>
          <p className="hint-text">
            A bonus card from your draft — place it to fill an Open Fort slot, or grow an already-chosen
            matching-color slot to 2-star (+1 base Fruit, +1 Seed slot).
          </p>
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
        </>
      )}

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
