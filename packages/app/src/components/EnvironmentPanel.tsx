import { canPlantSeed, type Environment } from '@chao-draft/sim';

interface EnvironmentPanelProps {
  environment: Environment;
  onPlantSeed: (seedIndex: number, slotIndex: number) => void;
}

export function EnvironmentPanel({ environment, onPlantSeed }: EnvironmentPanelProps) {
  return (
    <div className="garden-column">
      <h3>Environment</h3>
      <p>
        Fruit: <strong>{environment.fruit}</strong>
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
