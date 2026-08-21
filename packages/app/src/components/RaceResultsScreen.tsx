import { useState } from 'react';
import type { PendingRaceResult } from '../game/useGame';

interface RaceResultsScreenProps {
  result: PendingRaceResult;
  onContinue: () => void;
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

function ordinalSuffix(n: number): string {
  return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
}

const LEG_EMOJI: Record<string, string> = {
  start: '🚩',
  sprint: '🏃',
  obstacle: '🪨',
  climb: '🧗',
  jump: '🦘',
  water: '🌊',
  air: '🪂',
};

function legLabel(legType: string): string {
  return `${LEG_EMOJI[legType] ?? ''} ${legType}`.trim();
}

// Leg-by-leg reveal (added 2026-08-21, requested directly by the user): a
// Race previously had no UI of its own at all — clicking "Run Race" jumped
// straight from a button click to a finished results table, with nothing to
// watch in between (a real "boring for a minute or two" gap the user flagged
// before a playtest). Pillar #1 ("you coach, you don't pilot," GDD §1) rules
// out letting the player actually steer a race mid-run, so this can't be
// interactive control — it's spectacle instead: Legs reveal one at a time
// behind a "Next Leg"/"Skip to End" pair, with a call-out for the player's
// own Chao specifically each step (that's the racer they're actually
// watching for). During the reveal, rows are shown in a NAME-stable order
// (not final placement) precisely so the outcome isn't spoiled by row
// position before any Legs have actually resolved — Place/Total Time only
// appear once the reveal finishes and the table flips to the real results.
// This is deliberately the cheap version (existing per-Leg Event data, just
// paced out client-side) rather than a full animated race track — a bigger
// production version is real future scope, not built here.
export function RaceResultsScreen({ result, onContinue }: RaceResultsScreenProps) {
  const [revealedLegs, setRevealedLegs] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const maxLegs = Math.max(0, ...result.entries.map((e) => e.timing.legs.length));
  const playerEntry = result.entries.find((e) => e.isPlayer);

  let callout: { text: string; fumble: boolean } | undefined;
  if (playerEntry && revealedLegs > 0) {
    const leg = playerEntry.timing.legs[revealedLegs - 1];
    if (leg) {
      callout = {
        text: `Leg ${revealedLegs} (${legLabel(leg.legType)}): ${playerEntry.name} ${
          leg.success ? 'clears it!' : 'fumbles!'
        } (${formatSeconds(leg.seconds)})`,
        fumble: !leg.success,
      };
    } else if (revealedLegs - 1 === playerEntry.timing.legs.length && playerEntry.dnf) {
      callout = { text: `${playerEntry.name} runs out of Stamina — DNF.`, fumble: true };
    }
  }

  if (!showFinal) {
    const watchOrder = [...result.entries].sort((a, b) => a.name.localeCompare(b.name));
    const allRevealed = revealedLegs >= maxLegs;

    return (
      <section>
        <h2>{result.isFinalRace ? 'Final Race' : 'Race'} — Watching...</h2>

        {callout && <p className={callout.fumble ? 'leg-callout leg-callout-fumble' : 'leg-callout'}>{callout.text}</p>}

        <div className="race-results-table-wrap">
          <table className="race-results-table">
            <thead>
              <tr>
                <th>Chao</th>
                <th>Per-Leg</th>
              </tr>
            </thead>
            <tbody>
              {watchOrder.map((entry) => {
                const visibleLegs = entry.timing.legs.slice(0, revealedLegs);
                const justDnfed = revealedLegs >= entry.timing.legs.length && entry.dnf;
                return (
                  <tr key={entry.chaoId} className={entry.isPlayer ? 'is-player' : ''}>
                    <td>
                      {entry.name}
                      {entry.isPlayer ? ' (You)' : ''}
                    </td>
                    <td>
                      {visibleLegs.map((leg, legIndex) => (
                        <span key={legIndex} className={leg.success ? undefined : 'leg-fumbled'}>
                          {legLabel(leg.legType)} {formatSeconds(leg.seconds)}
                          {legIndex < visibleLegs.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {justDnfed && <span className="dnf-label"> DNF</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="event-buttons">
          {!allRevealed ? (
            <>
              <button type="button" onClick={() => setRevealedLegs((n) => n + 1)}>
                Next Leg ({revealedLegs}/{maxLegs})
              </button>
              <button type="button" onClick={() => setShowFinal(true)}>
                Skip to End
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setShowFinal(true)}>
              Reveal Final Results
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2>{result.isFinalRace ? 'Final Race Results' : 'Race Results'}</h2>
      <div className="race-results-table-wrap">
        <table className="race-results-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Chao</th>
              <th>Total Time</th>
              <th>Per-Leg</th>
            </tr>
          </thead>
          <tbody>
            {result.entries.map((entry, index) => (
              <tr key={entry.chaoId} className={entry.eliminated ? 'is-eliminated' : entry.isPlayer ? 'is-player' : ''}>
                <td>
                  {index + 1}
                  {ordinalSuffix(index + 1)}
                </td>
                <td>
                  {entry.name}
                  {entry.isPlayer ? ' (You)' : ''}
                  {entry.eliminated ? ' (eliminated)' : ''}
                </td>
                <td>
                  {/* A DNF's total only covers legs actually attempted — never a
                      real finishing time, so it's never shown as if it were one
                      (a DNF can otherwise look "faster" than the winner). */}
                  {entry.dnf ? (
                    <span className="dnf-label">DNF ({formatSeconds(entry.timing.totalSeconds)} before stopping)</span>
                  ) : (
                    formatSeconds(entry.timing.totalSeconds)
                  )}
                </td>
                <td>
                  {entry.timing.legs.map((leg, legIndex) => (
                    <span key={legIndex} className={leg.success ? undefined : 'leg-fumbled'}>
                      {legLabel(leg.legType)} {formatSeconds(leg.seconds)}
                      {legIndex < entry.timing.legs.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="event-buttons">
        <button type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}
