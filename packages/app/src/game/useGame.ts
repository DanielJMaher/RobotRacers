import { useCallback, useRef, useState } from 'react';
import type { BondCard, Card, Chao, DraftState, RegimenCard, TechniqueCard, TournamentState } from '@chao-draft/sim';
import {
  advancePlayerGroupRace,
  advanceTick,
  bondCard as bondCardOnChao,
  buildCardPool,
  consumeRegimen as consumeRegimenOnChao,
  coreGardenSet,
  createChao,
  createDraft,
  createRng,
  createTournament,
  runFinalRace,
  startRound,
} from '@chao-draft/sim';
import { narrateDraftPick, narrateSimEvent } from './narration';

const CARD_POOL = buildCardPool(coreGardenSet);
const SEAT_COUNT = 4;
const PLAYER_SEAT_INDEX = 0;
const PLAYER_SEAT_ID = `seat-${PLAYER_SEAT_INDEX}`;

export type Phase = 'draft' | 'tournament';

// Orchestrates one session: draft → the Tournament bracket (roadmap.md
// Phase 3) → bond/train between group races → Final Race → complete or
// eliminated. This is UI-layer orchestration, not part of @chao-draft/sim —
// it calls the pure sim functions and holds the resulting state as plain
// React state. A single Rng instance lives in a ref (not useState) because
// it's mutable-in-place infrastructure threaded through calls, exactly like
// draft/engine.ts's calling convention describes — it isn't itself game data
// that ever needs to trigger a re-render on its own.
export function useGame() {
  const rngRef = useRef(createRng(Date.now() ^ 0x9e3779b9));

  const [draft, setDraft] = useState<DraftState>(() =>
    createDraft(
      { seed: 1, seatCount: SEAT_COUNT, playerSeatIndex: PLAYER_SEAT_INDEX },
      CARD_POOL,
      rngRef.current,
    ),
  );
  const [phase, setPhase] = useState<Phase>('draft');
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((lines: string[]) => {
    if (lines.length === 0) return;
    setLog((prev) => [...prev, ...lines]);
  }, []);

  // The player's live Chao is always read off the Tournament's own entrant
  // record, never a separate piece of state — otherwise bonding a card here
  // and the bracket engine's view of the player's stats could drift apart.
  const chao: Chao | null = tournament ? tournament.entrants[tournament.playerChaoId]!.chao : null;

  const playerPool: Card[] = draft.seats[PLAYER_SEAT_INDEX]?.pool ?? [];

  const toggleTechnique = useCallback((id: string) => {
    setSelectedTechniqueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // NOTE: these handlers read `draft`/`tournament` directly from the hook's
  // closure rather than via a setState functional updater, and call each
  // setter at most once per invocation. Nesting a second setState call
  // inside another setState's updater function double-fires under React 18
  // StrictMode's dev-mode double-invocation — reading current state
  // directly here (safe for a single synchronous click handler; there's no
  // concurrent-update race to guard against in this app) avoids that, and
  // crucially keeps rngRef.current() from being called twice per click.
  const pickCard = useCallback(
    (index: number) => {
      const { state: afterTick, events } = advanceTick(draft, index);
      const pickLines = events
        .filter((e) => e.seatId === PLAYER_SEAT_ID)
        .map((e) => narrateDraftPick(e, true));

      if (afterTick.isComplete) {
        const playerSeat = afterTick.seats[PLAYER_SEAT_INDEX]!;
        const freshChao = createChao({ id: 'chao-1', name: 'Your Chao', bornGeneration: 1 });
        setDraft(afterTick);
        setTournament(createTournament(freshChao, rngRef.current));
        setPhase('tournament');
        appendLog([
          ...pickLines,
          `Draft complete! Your pool has ${playerSeat.pool.length} cards.`,
          'The Tournament begins — 24 entrants, 4 groups of 6.',
        ]);
        return;
      }

      if (afterTick.packsInFront.length === 0) {
        setDraft(startRound(afterTick, CARD_POOL, rngRef.current));
        appendLog(pickLines);
        return;
      }

      setDraft(afterTick);
      appendLog(pickLines);
    },
    [draft, appendLog],
  );

  const bondBondCard = useCallback(
    (card: BondCard) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const { chao: bonded, events } = bondCardOnChao(playerChao, card, rngRef.current);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: bonded },
        },
      });
      // Bonding is cumulative now (GDD §3.5, corrected 2026-08-20) — this
      // always adds, never replaces, so the log just names the touched
      // regions rather than talking about a slot being occupied/replaced.
      const regions = Object.keys(card.bodyMutations).join(', ');
      appendLog([`${card.name} bonds onto ${regions}.`, ...events.map((e) => narrateSimEvent(e))]);
    },
    [tournament, appendLog],
  );

  const consumeRegimenCard = useCallback(
    (card: RegimenCard) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const { chao: fed, events } = consumeRegimenOnChao(playerChao, card, rngRef.current);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: fed },
        },
      });
      appendLog([`${card.name} is consumed.`, ...events.map((e) => narrateSimEvent(e))]);
    },
    [tournament, appendLog],
  );

  const loadedTechniques = playerPool.filter(
    (c): c is TechniqueCard => c.type === 'technique' && selectedTechniqueIds.has(c.id),
  );

  const runNextGroupRace = useCallback(() => {
    if (!tournament) return;
    const outcome = advancePlayerGroupRace(tournament, loadedTechniques, rngRef.current);
    const nameById = Object.fromEntries(
      Object.values(outcome.state.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
    );
    setTournament(outcome.state);

    const lines = [
      `--- Race (${outcome.course.legs.length} legs: ${outcome.course.legs.map((leg) => leg.type).join(', ')}) ---`,
      ...outcome.raceEvents.map((e) => narrateSimEvent(e, nameById)),
      `${nameById[outcome.eliminatedChaoId] ?? outcome.eliminatedChaoId} is eliminated.`,
    ];
    if (outcome.playerEliminated) {
      lines.push('Your Chao has been eliminated. No breeding pick this generation — the run is over.');
    } else if (outcome.roundJustCompleted !== undefined) {
      lines.push(`Round ${outcome.roundJustCompleted} complete! Advancing...`);
    }
    appendLog(lines);
  }, [tournament, loadedTechniques, appendLog]);

  const runFinalRaceHandler = useCallback(() => {
    if (!tournament) return;
    const outcome = runFinalRace(tournament, loadedTechniques, rngRef.current);
    const nameById = Object.fromEntries(
      Object.values(outcome.state.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
    );
    setTournament(outcome.state);

    appendLog([
      `--- Final Race (${outcome.course.legs.length} legs: ${outcome.course.legs.map((leg) => leg.type).join(', ')}) ---`,
      ...outcome.raceEvents.map((e) => narrateSimEvent(e, nameById)),
      `Results: ${outcome.ranking.map((id, i) => `${i + 1}. ${nameById[id]}`).join(', ')}`,
    ]);
  }, [tournament, loadedTechniques, appendLog]);

  const playerPack: Card[] = draft.isComplete ? [] : (draft.packsInFront[PLAYER_SEAT_INDEX] ?? []);

  return {
    phase,
    draft,
    playerPack,
    playerPool,
    chao,
    tournament,
    selectedTechniqueIds,
    log,
    pickCard,
    bondBondCard,
    consumeRegimenCard,
    toggleTechnique,
    runNextGroupRace,
    runFinalRace: runFinalRaceHandler,
  };
}
