import { canPlaceHabitatCard, type Environment } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface HabitatPlacementScreenProps {
  environment: Environment;
  onPlace: (cardIndex: number, slotIndex: number) => void;
  onContinue: () => void;
}

export function HabitatPlacementScreen({ environment, onPlace, onContinue }: HabitatPlacementScreenProps) {
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

      <div className="event-buttons">
        <button type="button" onClick={onContinue}>
          Continue to Tournament
        </button>
      </div>
    </section>
  );
}
