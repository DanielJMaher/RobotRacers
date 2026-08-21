import { useState } from 'react';
import {
  computeBreedingPools,
  computeScoutingRead,
  type NextTournamentSetup,
  type ScoutingRead,
  type TournamentState,
} from '@chao-draft/sim';

interface BreedingScreenProps {
  tournament: TournamentState;
  setup: NextTournamentSetup | null; // null until the player confirms a partner
  onConfirmPartner: (partnerId: string) => void;
  onStartNextTournament: () => void;
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

function ordinalSuffix(n: number): string {
  return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
}

export function BreedingScreen({ tournament, setup, onConfirmPartner, onStartNextTournament }: BreedingScreenProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(undefined);

  const ranking = tournament.finalRanking!;
  const placement = (ranking.indexOf(tournament.playerChaoId) + 1) as 1 | 2 | 3;

  const nameById = Object.fromEntries(
    Object.values(tournament.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
  );

  if (setup) {
    return (
      <section>
        <h2>Breeding Results</h2>
        <ul className="standings-list">
          {setup.breeding.pairs.map((pair) => (
            <li key={pair.finalistId} className={pair.finalistId === tournament.playerChaoId ? 'is-player' : ''}>
              <span>
                {nameById[pair.finalistId]} bred with {nameById[pair.partnerId]} → {pair.baby.name} is born.
              </span>
            </li>
          ))}
        </ul>
        <p>Your baby, {setup.playerBaby.name}, is your new Chao for the next Tournament.</p>
        <div className="event-buttons">
          <button type="button" onClick={onStartNextTournament}>
            Start Next Tournament
          </button>
        </div>
      </section>
    );
  }

  const pools = computeBreedingPools(tournament);
  const pool = placement === 1 ? pools.first : placement === 2 ? pools.second : pools.third;

  return (
    <section>
      <h2>
        Final Race complete — you placed {placement}
        {ordinalSuffix(placement)}!
      </h2>
      <p>
        Choose a breeding partner ({pool.length} eligible). {placement === 1 && '1st place excludes only the other 2 finalists.'}
        {placement === 2 && '2nd place excludes anyone who reached Round 3.'}
        {placement === 3 && '3rd place is narrowed to only Chao eliminated in Round 1.'}
      </p>
      <ul className="standings-list">
        {pool.map((id) => {
          const chao = tournament.entrants[id]!.chao;
          const read = computeScoutingRead(chao);
          return (
            <li key={id} className={selectedPartnerId === id ? 'is-player' : ''}>
              <button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setSelectedPartnerId(id)}>
                {chao.name}
              </button>
              <span className="scouting-icons">
                {SCOUTING_ORDER.map(({ key, label }) => (
                  <span key={key}>
                    {' '}
                    {label}:{scoutingBar(read[key])}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="event-buttons">
        <button type="button" disabled={selectedPartnerId === undefined} onClick={() => onConfirmPartner(selectedPartnerId!)}>
          Confirm Breeding
        </button>
      </div>
    </section>
  );
}
