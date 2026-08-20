import { useCallback, useRef, useState } from 'react';
import type { BondCard, Card, Chao, DraftState, RegimenCard, TechniqueCard } from '@chao-draft/sim';
import {
  advanceTick,
  bondCard as bondCardOnChao,
  buildCardPool,
  consumeRegimen as consumeRegimenOnChao,
  coreGardenSet,
  createChao,
  createDraft,
  createRng,
  resolveBout,
  resolveRace,
  startRound,
} from '@chao-draft/sim';
import { narrateDraftPick, narrateSimEvent } from './narration';
import { DEMO_RACE_COURSE } from './raceCourse';
import { createRivalChao } from './rival';

const CARD_POOL = buildCardPool(coreGardenSet);
const SEAT_COUNT = 4;
const PLAYER_SEAT_INDEX = 0;
const PLAYER_SEAT_ID = `seat-${PLAYER_SEAT_INDEX}`;

export type Phase = 'draft' | 'garden';

// Orchestrates one Phase 1 vertical slice session: draft → bond → run an
// event. This is UI-layer orchestration, not part of @chao-draft/sim — it
// calls the pure sim functions and holds the resulting state as plain React
// state. A single Rng instance lives in a ref (not useState) because it's
// mutable-in-place infrastructure threaded through calls, exactly like
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
  const [chao, setChao] = useState<Chao | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((lines: string[]) => {
    if (lines.length === 0) return;
    setLog((prev) => [...prev, ...lines]);
  }, []);

  // NOTE: these handlers read `draft`/`chao` directly from the hook's
  // closure rather than via a setState functional updater, and call each
  // setter at most once per invocation. Nesting a second setState call
  // inside another setState's updater function double-fires under React 18
  // StrictMode's dev-mode double-invocation — reading current state
  // directly here (safe for a single synchronous click handler; there's no
  // concurrent-update race to guard against in this app) avoids that.
  const pickCard = useCallback(
    (index: number) => {
      const { state: afterTick, events } = advanceTick(draft, index);
      const pickLines = events
        .filter((e) => e.seatId === PLAYER_SEAT_ID)
        .map((e) => narrateDraftPick(e, true));

      if (afterTick.isComplete) {
        const playerSeat = afterTick.seats[PLAYER_SEAT_INDEX]!;
        setDraft(afterTick);
        setChao(createChao({ id: 'chao-1', name: 'Your Chao', bornGeneration: 1 }));
        setPhase('garden');
        appendLog([...pickLines, `Draft complete! Your pool has ${playerSeat.pool.length} cards.`]);
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
      if (!chao) return;
      const { chao: bonded, events, replacedCard } = bondCardOnChao(chao, card, rngRef.current);
      setChao(bonded);
      appendLog([
        replacedCard
          ? `${card.name} replaces ${replacedCard.name} in the ${card.slot} slot.`
          : `${card.name} bonds into the ${card.slot} slot.`,
        ...events.map(narrateSimEvent),
      ]);
    },
    [chao, appendLog],
  );

  const consumeRegimenCard = useCallback(
    (card: RegimenCard) => {
      if (!chao) return;
      const { chao: fed, events } = consumeRegimenOnChao(chao, card, rngRef.current);
      setChao(fed);
      appendLog([`${card.name} is consumed.`, ...events.map(narrateSimEvent)]);
    },
    [chao, appendLog],
  );

  const runRace = useCallback(
    (loadedTechniques: TechniqueCard[]) => {
      if (!chao) return;
      const result = resolveRace({ chao, loadedTechniques }, DEMO_RACE_COURSE, rngRef.current);
      setChao(result.finalChao);
      appendLog([
        '--- Race ---',
        ...result.events.map(narrateSimEvent),
        result.finished
          ? `Finished all ${result.legsCompleted} legs!`
          : `DNF after ${result.legsCompleted} legs.`,
      ]);
    },
    [chao, appendLog],
  );

  const runBout = useCallback(
    (loadedTechniques: TechniqueCard[]) => {
      if (!chao) return;
      const rival = createRivalChao();
      const result = resolveBout(
        { chao, loadedTechniques },
        { chao: rival, loadedTechniques: [] },
        rngRef.current,
      );
      setChao(result.finalA);
      appendLog([
        '--- Karate Bout vs. Training Dummy ---',
        ...result.events.map(narrateSimEvent),
        result.winner === 'a'
          ? 'You win!'
          : result.winner === 'b'
            ? 'The Training Dummy wins.'
            : "It's a draw.",
      ]);
    },
    [chao, appendLog],
  );

  const playerPack: Card[] = draft.isComplete ? [] : (draft.packsInFront[PLAYER_SEAT_INDEX] ?? []);
  const playerPool: Card[] = draft.seats[PLAYER_SEAT_INDEX]?.pool ?? [];

  return {
    phase,
    draft,
    playerPack,
    playerPool,
    chao,
    log,
    pickCard,
    bondBondCard,
    consumeRegimenCard,
    runRace,
    runBout,
  };
}
