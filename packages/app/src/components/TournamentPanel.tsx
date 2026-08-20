import { useState } from 'react';
import { computeScoutingRead, type ScoutingRead, type TournamentState } from '@chao-draft/sim';

interface TournamentPanelProps {
  tournament: TournamentState;
  loadedTechniqueCount: number;
  onRunNextRace: () => void;
  onRunFinalRace: () => void;
}

const SCOUTING_ORDER: { key: keyof ScoutingRead; label: string }[] = [
  { key: 'swim', label: 'Swm' },
  { key: 'fly', label: 'Fly' },
  { key: 'run', label: 'Run' },
  { key: 'power', label: 'Pwr' },
  { key: 'climb', label: 'Clb' },
  { key: 'jump', label: 'Jmp' },
  { key: 'stamina', label: 'Stm' },
];

function scoutingBar(rating: 1 | 2 | 3 | 4 | 5 | undefined): string {
  const filled = rating ?? 0;
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

function entrantStatusLabel(meta: TournamentState['entrants'][string]): string {
  if (meta.finalPlacement !== undefined) return `${meta.finalPlacement}${ordinalSuffix(meta.finalPlacement)} place`;
  if (meta.eliminatedInRound !== undefined) return `Eliminated — Round ${meta.eliminatedInRound}`;
  return 'Active';
}

function ordinalSuffix(n: number): string {
  return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
}

// Click-to-inspect entrant row: name + status always visible, scouting icons
// (GDD §6.7 — a fuzzy 1-5 read per Leg-relevant stat) reveal on click. Works
// for any of the 24 entrants, not just ones still in the player's group.
function EntrantRow({ meta, isPlayer }: { meta: TournamentState['entrants'][string]; isPlayer: boolean }) {
  const [scouted, setScouted] = useState(false);
  const read = scouted ? computeScoutingRead(meta.chao) : undefined;

  return (
    <li className={isPlayer ? 'is-player' : meta.eliminatedInRound !== undefined ? 'is-eliminated' : ''}>
      <button type="button" onClick={() => setScouted((s) => !s)} style={{ all: 'unset', cursor: 'pointer' }}>
        {meta.chao.name}
        {isPlayer ? ' (You)' : ''} — {entrantStatusLabel(meta)}
      </button>
      {read && (
        <span className="scouting-icons">
          {SCOUTING_ORDER.map(({ key, label }) => (
            <span key={key}>
              {' '}
              {label}:{scoutingBar(read[key])}
            </span>
          ))}
        </span>
      )}
    </li>
  );
}

const PHASE_LABEL: Record<TournamentState['phase'], string> = {
  round1: 'Round 1 — Group Stage',
  round2: 'Round 2 — Group Stage',
  round3: 'Round 3 — Group Stage',
  final_race: 'Final Race',
  complete: 'Tournament Complete',
  eliminated: 'Eliminated',
};

export function TournamentPanel({
  tournament,
  loadedTechniqueCount,
  onRunNextRace,
  onRunFinalRace,
}: TournamentPanelProps) {
  const allEntrants = Object.values(tournament.entrants).sort((a, b) =>
    a.chao.name.localeCompare(b.chao.name),
  );

  return (
    <div className="garden-column tournament-panel">
      <h3>Tournament</h3>
      <div className="phase-banner">
        <strong>{PHASE_LABEL[tournament.phase]}</strong>
        <br />
        Score: {tournament.playerScore}
        {(tournament.phase === 'round1' || tournament.phase === 'round2' || tournament.phase === 'round3') && (
          <>
            <br />
            Race {tournament.racesRunThisRound + 1} of 3 this round
          </>
        )}
      </div>

      {(tournament.phase === 'round1' || tournament.phase === 'round2' || tournament.phase === 'round3') && (
        <>
          <h4>Current Group ({tournament.activeGroup.length})</h4>
          <ul className="standings-list">
            {tournament.activeGroup.map((id) => (
              <EntrantRow key={id} meta={tournament.entrants[id]!} isPlayer={id === tournament.playerChaoId} />
            ))}
          </ul>
          <button type="button" onClick={onRunNextRace}>
            Run Next Race ({loadedTechniqueCount} technique{loadedTechniqueCount === 1 ? '' : 's'} loaded)
          </button>
        </>
      )}

      {tournament.phase === 'final_race' && (
        <>
          <h4>Finalists</h4>
          <ul className="standings-list">
            {tournament.activeGroup.map((id) => (
              <EntrantRow key={id} meta={tournament.entrants[id]!} isPlayer={id === tournament.playerChaoId} />
            ))}
          </ul>
          <button type="button" onClick={onRunFinalRace}>
            Run Final Race ({loadedTechniqueCount} technique{loadedTechniqueCount === 1 ? '' : 's'} loaded)
          </button>
        </>
      )}

      {tournament.phase === 'complete' && tournament.finalRanking && (
        <>
          <h4>Final Results</h4>
          <ul className="final-results-list">
            {tournament.finalRanking.map((id, index) => {
              const meta = tournament.entrants[id]!;
              return (
                <li key={id}>
                  {index + 1}
                  {ordinalSuffix(index + 1)} — {meta.chao.name}
                  {id === tournament.playerChaoId ? ' (You)' : ''}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tournament.phase === 'eliminated' && (
        <p>Your Chao was eliminated. No breeding pick this generation — the run is over.</p>
      )}

      <h4>All Entrants ({allEntrants.length})</h4>
      <ul className="standings-list">
        {allEntrants.map((meta) => (
          <EntrantRow key={meta.chao.id} meta={meta} isPlayer={meta.isPlayer} />
        ))}
      </ul>
    </div>
  );
}
