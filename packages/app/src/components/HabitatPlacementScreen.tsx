import type { Environment, StatColor } from '@chao-draft/sim';

interface HabitatPlacementScreenProps {
  environment: Environment;
  onChoose: (slotIndex: number, color: StatColor | undefined) => void;
  onContinue: () => void;
}

const COLOR_CHOICES: { color: StatColor; label: string }[] = [
  { color: 'green', label: '🟢 Green' },
  { color: 'red', label: '🔴 Red' },
  { color: 'black', label: '⚫ Black' },
  { color: 'blue', label: '🔵 Blue' },
  { color: 'white', label: '⚪ White' },
];

// Drawn-Habitat-card placement (bonus per-pack cards, 2-star combining) was
// removed 2026-08-21, per the user's direct request: it was vestigial once
// habitat choice became free, and its "Continue" guard (must place every
// still-placeable card first) was blocking the player from ever reaching
// the Tournament in the common case where a bonus card had nowhere useful
// left to go. Draft/pool.ts no longer hands out bonus Habitat cards at all
// (see draft/engine.ts's startRound), so environment.unplacedHabitats is
// now always empty — there is genuinely nothing left to place here.
export function HabitatPlacementScreen({ environment, onChoose, onContinue }: HabitatPlacementScreenProps) {
  return (
    <section>
      <h2>Choose Your Habitats</h2>
      <p>
        Pick a color (or Open Fort) for each of your 3 Environment slots — freely, any color, any slot.
        Freely re-pickable until you continue; once the Tournament begins, a slot's color locks in for
        good. Open Fort produces 1 colorless Wildcard Fruit per trigger instead of sitting inert — a
        real, deliberate strategy, not a placeholder.
      </p>

      <h3>Environment Slots</h3>
      <ul className="standings-list">
        {environment.slots.map((slot, slotIndex) => (
          <li key={slotIndex}>
            <span>
              Slot {slotIndex + 1}:{' '}
              {slot ? `${slot.color} (${slot.starLevel}-star, ${slot.seedSlots} Seed slot(s))` : 'Open Fort'}
            </span>
            <span className="scouting-icons">
              {COLOR_CHOICES.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  className="slot-assign-btn"
                  aria-pressed={slot?.color === color}
                  onClick={() => onChoose(slotIndex, color)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="slot-assign-btn"
                aria-pressed={slot === undefined}
                onClick={() => onChoose(slotIndex, undefined)}
              >
                Open Fort
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div className="event-buttons">
        <button type="button" onClick={onContinue}>
          Continue to Tournament
        </button>
      </div>
    </section>
  );
}
