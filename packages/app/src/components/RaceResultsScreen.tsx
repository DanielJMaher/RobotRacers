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

export function RaceResultsScreen({ result, onContinue }: RaceResultsScreenProps) {
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
              <tr key={entry.chaoId} className={entry.eliminated ? 'is-eliminated' : ''}>
                <td>
                  {index + 1}
                  {ordinalSuffix(index + 1)}
                </td>
                <td>
                  {entry.name}
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
                      {leg.legType} {formatSeconds(leg.seconds)}
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
