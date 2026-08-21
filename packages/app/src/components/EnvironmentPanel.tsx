import type { FruitPool } from '@chao-draft/sim';
import { canPlantSeed, type Environment } from '@chao-draft/sim';

interface EnvironmentPanelProps {
  environment: Environment;
  onPlantSeed: (seedIndex: number, slotIndex: number) => void;
}

// Fixed display order + emoji, matching CardBadge's own color labels.
const FRUIT_ORDER: { key: keyof FruitPool; label: string }[] = [
  { key: 'green', label: '🟢 Green' },
  { key: 'red', label: '🔴 Red' },
  { key: 'black', label: '⚫ Black' },
  { key: 'blue', label: '🔵 Blue' },
  { key: 'white', label: '⚪ White' },
  { key: 'colorless', label: '◽ Wildcard' },
];

export function EnvironmentPanel({ environment, onPlantSeed }: EnvironmentPanelProps) {
  return (
    <div className="garden-column">
      <h3>Environment</h3>
      {/* Per-color Fruit (playtest-prep, revised 2026-08-21) — replaces a
          single pooled number now that every card costs Fruit in its own
          color to use (useGame.ts's bondBondCard/consumePotionCard). Every
          color is always shown, even at 0, so it's always clear at a
          glance which colors are actually affordable right now. */}
      <p className="fruit-breakdown">
        {FRUIT_ORDER.map(({ key, label }) => (
          <span key={key}>
            {label}: <strong>{environment.fruit[key]}</strong>
          </span>
        ))}
      </p>

      <ul className="standings-list">
        {environment.slots.map((slot, slotIndex) => (
          <li key={slotIndex}>
            <span>
              Slot {slotIndex + 1}:{' '}
              {slot
                ? `${slot.color} (${slot.starLevel}-star)${
                    slot.plantedSeedColors.length > 0 ? ` + ${slot.plantedSeedColors.join(', ')} Seed(s)` : ''
                  }`
                : 'Open Fort (empty)'}
            </span>
          </li>
        ))}
      </ul>

      {environment.availableSeeds.length > 0 && (
        <>
          <h4>Seeds to Plant ({environment.availableSeeds.length})</h4>
          <ul className="standings-list">
            {environment.availableSeeds.map((seed, seedIndex) => (
              <li key={`${seed.id}-${seedIndex}`}>
                <span>{seed.name}</span>
                <span className="scouting-icons">
                  {environment.slots.map((_, slotIndex) => (
                    <button
                      key={slotIndex}
                      type="button"
                      className="slot-assign-btn"
                      disabled={!canPlantSeed(environment, slotIndex)}
                      onClick={() => onPlantSeed(seedIndex, slotIndex)}
                    >
                      → Slot {slotIndex + 1}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
