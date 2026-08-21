import type { Card, DraftSeat } from '@chao-draft/sim';
import { useState } from 'react';
import { CardBadge } from './CardBadge';

interface DraftScreenProps {
  pack: Card[];
  seats: DraftSeat[];
  packsInFront: Card[][];
  currentRound: number;
  currentPick: number;
  packsPerDraft: number;
  packSize: number;
  onPick: (index: number) => void;
}

function seatLabel(seat: DraftSeat, index: number): string {
  return seat.isPlayer ? 'You' : `Bot ${index}`;
}

// Rewritten 2026-08-21, per two direct user requests: (1) "we need to see
// the cards we draft as we draft them so we can see our deck" — the screen
// previously showed only the current pack, with no view of what you'd
// already picked; (2) "I want to see which chao takes which card in the
// draft... make tabs for me to select between each chao so I can see the
// cards they are presented with and what their deck currently looks like."
// Every seat's pack-in-front and accumulated pool were already tracked in
// DraftState — draft/engine.ts resolves every seat's pick each tick, bots
// included — this was purely a missing UI, not a missing sim capability.
// Bot tabs are read-only (no onClick, CardBadge already renders those
// slightly dimmed/disabled) since only the player ever picks interactively.
export function DraftScreen({
  pack,
  seats,
  packsInFront,
  currentRound,
  currentPick,
  packsPerDraft,
  packSize,
  onPick,
}: DraftScreenProps) {
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(0);
  const playerSeatIndex = seats.findIndex((seat) => seat.isPlayer);
  const isViewingPlayer = selectedSeatIndex === playerSeatIndex;
  const selectedSeat = seats[selectedSeatIndex];
  const selectedPack = isViewingPlayer ? pack : (packsInFront[selectedSeatIndex] ?? []);

  return (
    <section>
      <h2>
        Draft — Pack {currentRound + 1} of {packsPerDraft}, Pick {currentPick + 1} of {packSize}
      </h2>

      <div className="seat-tabs">
        {seats.map((seat, index) => (
          <button
            key={seat.seatId}
            type="button"
            className={index === selectedSeatIndex ? 'seat-tab seat-tab-active' : 'seat-tab'}
            onClick={() => setSelectedSeatIndex(index)}
          >
            {seatLabel(seat, index)} ({seat.pool.length})
          </button>
        ))}
      </div>

      {isViewingPlayer ? (
        <p>Pick one card. The rest pass to the next seat.</p>
      ) : (
        <p className="hint-text">
          Spectating {seatLabel(selectedSeat!, selectedSeatIndex)}'s current pack — picks happen automatically, this
          is read-only.
        </p>
      )}
      <div className="card-grid">
        {selectedPack.map((card, index) => (
          <CardBadge
            key={`${card.id}-${index}`}
            card={card}
            {...(isViewingPlayer ? { onClick: () => onPick(index) } : {})}
          />
        ))}
      </div>

      <h3>
        {isViewingPlayer ? 'Your' : `${seatLabel(selectedSeat!, selectedSeatIndex)}'s`} Deck So Far (
        {selectedSeat?.pool.length ?? 0})
      </h3>
      <div className="card-grid">
        {(selectedSeat?.pool ?? []).map((card, index) => (
          <CardBadge key={`${card.id}-${index}`} card={card} />
        ))}
      </div>
    </section>
  );
}
