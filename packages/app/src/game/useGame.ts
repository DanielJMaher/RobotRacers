import { useCallback, useRef, useState } from 'react';
import type {
  BondCard,
  Card,
  Chao,
  DraftState,
  Environment,
  HabitatCard,
  InterludeDraftState,
  NextTournamentSetup,
  PotionCard,
  RaceResult,
  SeedCard,
  TechniqueCard,
  TournamentState,
} from '@chao-draft/sim';
import {
  addAvailableSeed,
  advancePlayerGroupRace,
  advanceTick,
  awakenBondCard as awakenBondCardOnChao,
  bondCardWithSplashTax,
  buildCardPool,
  computeBreedingPools,
  computeRaceTiming,
  computeSplashTax,
  consumePotion as consumePotionOnChao,
  coreGardenSet,
  createChao,
  createDraft,
  createEnvironment,
  createInterludeDraft,
  createRng,
  createTournament,
  DEFAULT_SPLASH_TAX,
  pickInterludeCard as pickInterludeCardOnState,
  placeHabitatCard as placeHabitatCardOnEnvironment,
  plantSeed as plantSeedOnEnvironment,
  prepareNextTournament,
  runFinalRace,
  startRound,
  triggerFruitGain,
} from '@chao-draft/sim';
import { narrateDraftPick, narrateSimEvent } from './narration';

export interface RaceResultEntry {
  chaoId: string;
  name: string;
  eliminated: boolean;
  // A DNF's totalSeconds only covers the legs it actually attempted before
  // running out of Stamina — never comparable to a finisher's total time
  // (an early DNF can look "faster" than the winner). Surfaced separately
  // so the UI never presents a DNF's partial time as if it were a real
  // result (playtest-prep fix, 2026-08-21 — caught by review before a live
  // playtest: the Results table had no DNF indicator at all).
  dnf: boolean;
  timing: ReturnType<typeof computeRaceTiming>;
}

export interface PendingRaceResult {
  entries: RaceResultEntry[]; // ranked best to worst
  isFinalRace: boolean;
}

function buildRaceResultEntries(
  ranking: string[],
  results: Record<string, RaceResult>,
  nameById: Record<string, string>,
  eliminatedChaoId: string | undefined,
): RaceResultEntry[] {
  return ranking.map((chaoId) => {
    const result = results[chaoId]!;
    return {
      chaoId,
      name: nameById[chaoId] ?? chaoId,
      eliminated: chaoId === eliminatedChaoId,
      dnf: !result.finished,
      timing: computeRaceTiming(result.finalChao, result.events),
    };
  });
}

const CARD_POOL = buildCardPool(coreGardenSet);
const SEAT_COUNT = 4;
const PLAYER_SEAT_INDEX = 0;
const PLAYER_SEAT_ID = `seat-${PLAYER_SEAT_INDEX}`;

export type Phase = 'draft' | 'habitat_placement' | 'tournament' | 'interlude' | 'breeding';

// Orchestrates one session: draft → place drawn Habitat cards (roadmap.md
// Phase 4) → the Tournament bracket → an Environment Interlude Booster after
// Round 1 and Round 2 → Final Race → complete or eliminated. This is
// UI-layer orchestration, not part of @chao-draft/sim — it calls the pure
// sim functions and holds the resulting state as plain React state. A
// single Rng instance lives in a ref (not useState) because it's
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
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  // Cards acquired AFTER the main draft completed (Environment Interlude
  // Booster picks) — kept separate from `draft`'s own seat pool so that
  // state stays scoped to the actual pack-passing draft engine.
  const [extraPool, setExtraPool] = useState<Card[]>([]);
  const [interludeDraft, setInterludeDraft] = useState<InterludeDraftState | null>(null);
  const [interludeRound, setInterludeRound] = useState<1 | 2 | null>(null);
  const [breedingSetup, setBreedingSetup] = useState<NextTournamentSetup | null>(null);
  // Set by startNextTournament (roadmap.md Phase 5) right before kicking off
  // a fresh Draft Booster for the next Tournament — consumed and cleared the
  // moment that draft completes, so the player's baby (not a blank Chao)
  // becomes their starting point and the pre-built lineage roster (2 other
  // babies + 21 fresh) is what createTournament uses instead of generating
  // 23 entirely fresh entrants.
  const [pendingPlayerChao, setPendingPlayerChao] = useState<Chao | null>(null);
  const [pendingOthers, setPendingOthers] = useState<Chao[] | null>(null);
  // Bond Cards are one-time use: bonding (or Awakening) a specific drafted
  // copy consumes it — tracked by its position in `playerPool` (stable for
  // the lifetime of one Tournament, since `draft`'s own pool never mutates
  // and `extraPool` only ever appends) rather than by card id, since
  // duplicates of "the same" card share an id but are separate copies.
  const [usedPoolIndices, setUsedPoolIndices] = useState<Set<number>>(new Set());
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<Set<string>>(new Set());
  const [raceResult, setRaceResult] = useState<PendingRaceResult | null>(null);
  const [log, setLog] = useState<string[]>([]);
  // A blocked bond (insufficient Fruit for splash tax) previously only ever
  // showed up as a line in the scrolling Event Log, which sits well below
  // the fold under the card grids — playtest-prep fix, 2026-08-21, caught by
  // review before a live playtest: clicking a card that can't be afforded
  // looked exactly like clicking nothing at all. Surfaced right above the
  // Bond Cards grid instead; cleared on the next successful bond.
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const appendLog = useCallback((lines: string[]) => {
    if (lines.length === 0) return;
    setLog((prev) => [...prev, ...lines]);
  }, []);

  // The player's live Chao is always read off the Tournament's own entrant
  // record, never a separate piece of state — otherwise bonding a card here
  // and the bracket engine's view of the player's stats could drift apart.
  const chao: Chao | null = tournament ? tournament.entrants[tournament.playerChaoId]!.chao : null;

  const playerPool: Card[] = [...(draft.seats[PLAYER_SEAT_INDEX]?.pool ?? []), ...extraPool];

  const toggleTechnique = useCallback((id: string) => {
    setSelectedTechniqueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // NOTE: these handlers read state directly from the hook's closure rather
  // than via a setState functional updater, and call each setter at most
  // once per invocation. Nesting a second setState call inside another
  // setState's updater function double-fires under React 18 StrictMode's
  // dev-mode double-invocation — reading current state directly here (safe
  // for a single synchronous click handler; there's no concurrent-update
  // race to guard against in this app) avoids that, and crucially keeps
  // rngRef.current() from being called twice per click.
  const pickCard = useCallback(
    (index: number) => {
      const { state: afterTick, events } = advanceTick(draft, index);
      const pickLines = events
        .filter((e) => e.seatId === PLAYER_SEAT_ID)
        .map((e) => narrateDraftPick(e, true));

      if (afterTick.isComplete) {
        const playerSeat = afterTick.seats[PLAYER_SEAT_INDEX]!;
        // Tournament 2+ (roadmap.md Phase 5): startNextTournament stashed
        // the player's own baby + the pre-built 23-entrant roster here right
        // before this draft started. Tournament 1 has neither, so it falls
        // back to a blank Chao and a fully-procedural 23 others, as before.
        const freshChao =
          pendingPlayerChao ?? createChao({ id: 'chao-1', name: 'Your Chao', bornGeneration: 1 });
        const others = pendingOthers ?? undefined;
        const drawnHabitats = playerSeat.pool.filter((c): c is HabitatCard => c.type === 'habitat');
        const drawnSeeds = playerSeat.pool.filter((c): c is SeedCard => c.type === 'seed');
        let env = createEnvironment(drawnHabitats);
        for (const seed of drawnSeeds) env = addAvailableSeed(env, seed);
        // NOTE: the Tournament-start Fruit trigger (GDD §6.9) fires once the
        // player finishes placing Habitats (continueToTournament below), not
        // here — at this point every slot is still empty by construction
        // (createEnvironment starts with 3 Open Forts), so triggering here
        // would always compute against 3 Open Forts regardless of what the
        // player actually places. A real bug caught via a live Playwright
        // pass before this fix landed.

        setDraft(afterTick);
        setTournament(createTournament(freshChao, rngRef.current, others));
        setEnvironment(env);
        setPendingPlayerChao(null);
        setPendingOthers(null);
        setPhase('habitat_placement');
        appendLog([
          ...pickLines,
          `Draft complete! Your pool has ${playerSeat.pool.length} cards, including ${drawnHabitats.length} Habitat card(s).`,
          'Place your Habitat cards into your 3 Environment slots before the Tournament begins.',
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
    [draft, pendingPlayerChao, pendingOthers, appendLog],
  );

  const placeHabitatCard = useCallback(
    (cardIndex: number, slotIndex: number) => {
      if (!environment) return;
      const card = environment.unplacedHabitats[cardIndex];
      setEnvironment(placeHabitatCardOnEnvironment(environment, cardIndex, slotIndex));
      if (card) appendLog([`${card.name} placed into Environment Slot ${slotIndex + 1}.`]);
    },
    [environment, appendLog],
  );

  const continueToTournament = useCallback(() => {
    if (!environment) return;
    // Tournament-start Fruit trigger (GDD §6.9) — fires now, once Habitat
    // placement is finalized, so it reflects what the player actually placed.
    setEnvironment(triggerFruitGain(environment));
    setPhase('tournament');
    appendLog(['The Tournament begins — 24 entrants, 4 groups of 6.']);
  }, [environment, appendLog]);

  const bondBondCard = useCallback(
    (card: BondCard, poolIndex: number) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = bondCardWithSplashTax(playerChao, environment, card, DEFAULT_SPLASH_TAX, rngRef.current);

      if (!result.ok) {
        const needed = computeSplashTax(playerChao, card, DEFAULT_SPLASH_TAX);
        const message = `Can't bond ${card.name} — needs ${needed} Fruit splash tax (off-color), you have ${environment.fruit}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      setActionMessage(null);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
        },
      });
      setEnvironment(result.environment);
      // Bond Cards are one-time use: this specific drafted copy is spent the
      // moment it's bonded, never bondable again.
      setUsedPoolIndices((prev) => new Set(prev).add(poolIndex));
      // Bonding is cumulative now (GDD §3.5, corrected 2026-08-20) — this
      // always adds, never replaces, so the log just names the touched
      // regions rather than talking about a slot being occupied/replaced.
      const regions = Object.keys(card.bodyMutations).join(', ');
      const taxNote = result.taxPaid > 0 ? ` (paid ${result.taxPaid} Fruit splash tax)` : '';
      appendLog([`${card.name} bonds onto ${regions}${taxNote} — spent.`, ...result.events.map((e) => narrateSimEvent(e))]);
    },
    [tournament, environment, appendLog],
  );

  const awakenBondCard = useCallback(
    (card: BondCard, poolIndices: [number, number, number]) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const { chao: awakened, events } = awakenBondCardOnChao(playerChao, card);

      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: awakened },
        },
      });
      setUsedPoolIndices((prev) => {
        const next = new Set(prev);
        for (const i of poolIndices) next.add(i);
        return next;
      });
      const regions = Object.keys(card.bodyMutations).join(', ');
      appendLog([
        `★ ${card.name} Awakened! 3 copies fused onto ${regions} (3.5x average grant) — all 3 spent.`,
        ...events.map((e) => narrateSimEvent(e)),
      ]);
    },
    [tournament, appendLog],
  );

  const consumePotionCard = useCallback(
    (card: PotionCard, poolIndex: number) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const { chao: fed, events } = consumePotionOnChao(playerChao, card, rngRef.current);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: fed },
        },
      });
      // Potions are one-time use, same as Bond Cards (roadmap.md Phase 5.5) —
      // this specific drafted copy is spent the moment it's consumed.
      setUsedPoolIndices((prev) => new Set(prev).add(poolIndex));
      appendLog([`${card.name} is consumed — spent.`, ...events.map((e) => narrateSimEvent(e))]);
    },
    [tournament, appendLog],
  );

  const plantSeed = useCallback(
    (seedIndex: number, slotIndex: number) => {
      if (!environment) return;
      const seed = environment.availableSeeds[seedIndex];
      setEnvironment(plantSeedOnEnvironment(environment, seedIndex, slotIndex));
      if (seed) appendLog([`${seed.name} planted into Environment Slot ${slotIndex + 1}.`]);
    },
    [environment, appendLog],
  );

  const loadedTechniques = playerPool.filter(
    (c): c is TechniqueCard => c.type === 'technique' && selectedTechniqueIds.has(c.id),
  );

  const runNextGroupRace = useCallback(() => {
    if (!tournament || !environment) return;
    const outcome = advancePlayerGroupRace(tournament, loadedTechniques, rngRef.current);
    const nameById = Object.fromEntries(
      Object.values(outcome.state.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
    );
    setTournament(outcome.state);
    // Fruit trigger fires after every race, GDD §6.9.
    const envAfterRace = triggerFruitGain(environment);
    setRaceResult({
      entries: buildRaceResultEntries(outcome.ranking, outcome.results, nameById, outcome.eliminatedChaoId),
      isFinalRace: false,
    });

    const lines = [
      `--- Race (${outcome.course.legs.length} legs: ${outcome.course.legs.map((leg) => leg.type).join(', ')}) ---`,
      ...outcome.raceEvents.map((e) => narrateSimEvent(e, nameById)),
      `${nameById[outcome.eliminatedChaoId] ?? outcome.eliminatedChaoId} is eliminated.`,
    ];

    if (outcome.playerEliminated) {
      setEnvironment(envAfterRace);
      lines.push('Your Chao has been eliminated. No breeding pick this generation — the run is over.');
      appendLog(lines);
      return;
    }

    if (outcome.roundJustCompleted === 1 || outcome.roundJustCompleted === 2) {
      setEnvironment(envAfterRace);
      setInterludeDraft(createInterludeDraft(CARD_POOL, rngRef.current));
      setInterludeRound(outcome.roundJustCompleted);
      setPhase('interlude');
      lines.push(`Round ${outcome.roundJustCompleted} complete! Environment Interlude time.`);
      appendLog(lines);
      return;
    }

    setEnvironment(envAfterRace);
    if (outcome.roundJustCompleted !== undefined) {
      lines.push(`Round ${outcome.roundJustCompleted} complete! Advancing...`);
    }
    appendLog(lines);
  }, [tournament, environment, loadedTechniques, appendLog]);

  const pickInterludeCard = useCallback(
    (index: number) => {
      if (!interludeDraft || !environment) return;
      const next = pickInterludeCardOnState(interludeDraft, index);
      setInterludeDraft(next);

      if (!next.isComplete) return;

      const seeds = next.pickedCards.filter((c): c is SeedCard => c.type === 'seed');
      const nonSeeds = next.pickedCards.filter((c) => c.type !== 'seed');
      let env = environment;
      for (const seed of seeds) env = addAvailableSeed(env, seed);
      setEnvironment(env);
      setExtraPool((prev) => [...prev, ...nonSeeds]);
      setInterludeDraft(null);
      setInterludeRound(null);
      setPhase('tournament');
      appendLog([
        `Environment Interlude complete — picked ${next.pickedCards.map((c) => c.name).join(', ')}.`,
        ...(seeds.length > 0 ? [`${seeds.length} Seed(s) added to your Environment, ready to plant.`] : []),
      ]);
    },
    [interludeDraft, environment, appendLog],
  );

  const runFinalRaceHandler = useCallback(() => {
    if (!tournament || !environment) return;
    const outcome = runFinalRace(tournament, loadedTechniques, rngRef.current);
    const nameById = Object.fromEntries(
      Object.values(outcome.state.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
    );
    setTournament(outcome.state);
    setEnvironment(triggerFruitGain(environment));
    setRaceResult({
      entries: buildRaceResultEntries(outcome.ranking, outcome.results, nameById, undefined),
      isFinalRace: true,
    });
    // Reaching the Final Race always means placing 1st/2nd/3rd of 3, so the
    // player always gets a breeding pick here (GDD §6.4) — decided
    // 2026-08-20: elimination before the Final Race ends the run outright,
    // with no rescue-by-breeding-pick mechanic, so this is the only path
    // that ever reaches 'breeding'.
    setPhase('breeding');

    appendLog([
      `--- Final Race (${outcome.course.legs.length} legs: ${outcome.course.legs.map((leg) => leg.type).join(', ')}) ---`,
      ...outcome.raceEvents.map((e) => narrateSimEvent(e, nameById)),
      `Results: ${outcome.ranking.map((id, i) => `${i + 1}. ${nameById[id]}`).join(', ')}`,
    ]);
  }, [tournament, environment, loadedTechniques, appendLog]);

  const pickBreedingPartner = useCallback(
    (partnerId: string) => {
      if (!tournament) return;
      const pools = computeBreedingPools(tournament);
      const setup = prepareNextTournament(tournament, pools, partnerId, rngRef.current);
      setBreedingSetup(setup);
      const nameById = Object.fromEntries(
        Object.values(tournament.entrants).map((meta) => [meta.chao.id, meta.chao.name]),
      );
      appendLog(
        setup.breeding.pairs.map(
          (pair) => `${nameById[pair.finalistId]} breeds with ${nameById[pair.partnerId]} → ${pair.baby.name} is born.`,
        ),
      );
    },
    [tournament, appendLog],
  );

  const startNextTournament = useCallback(() => {
    if (!breedingSetup) return;
    setPendingPlayerChao(breedingSetup.playerBaby);
    setPendingOthers(breedingSetup.others);
    setDraft(
      createDraft(
        { seed: 1, seatCount: SEAT_COUNT, playerSeatIndex: PLAYER_SEAT_INDEX },
        CARD_POOL,
        rngRef.current,
      ),
    );
    setTournament(null);
    setEnvironment(null);
    setExtraPool([]);
    setUsedPoolIndices(new Set());
    setSelectedTechniqueIds(new Set());
    setBreedingSetup(null);
    setPhase('draft');
    appendLog([`--- ${breedingSetup.playerBaby.name}'s Tournament begins! Draft a fresh pool. ---`]);
  }, [breedingSetup, appendLog]);

  // Restart (playtest-prep fix, 2026-08-21): there was previously no way to
  // start over short of refreshing the whole page (losing everything, since
  // there's no save/load yet) — a real dead-end after an elimination, since
  // `phase` stays 'tournament' and the Garden remains fully interactive
  // (bonding onto a dead run) with no signal anything's actually over besides
  // a log line. This is a full hard reset — a brand-new blank Chao and 23
  // fresh procedural entrants, NOT a continuation via breeding (unlike
  // startNextTournament, which this deliberately doesn't call into) — and a
  // fresh Rng so the whole next run isn't a deterministic continuation of the
  // old one's roll sequence either.
  const restartGame = useCallback(() => {
    rngRef.current = createRng(Date.now() ^ 0x9e3779b9);
    setDraft(
      createDraft(
        { seed: 1, seatCount: SEAT_COUNT, playerSeatIndex: PLAYER_SEAT_INDEX },
        CARD_POOL,
        rngRef.current,
      ),
    );
    setTournament(null);
    setEnvironment(null);
    setExtraPool([]);
    setInterludeDraft(null);
    setInterludeRound(null);
    setBreedingSetup(null);
    setPendingPlayerChao(null);
    setPendingOthers(null);
    setUsedPoolIndices(new Set());
    setSelectedTechniqueIds(new Set());
    setRaceResult(null);
    setActionMessage(null);
    setPhase('draft');
    setLog(['--- New Tournament — draft a fresh pool. ---']);
  }, []);

  const dismissActionMessage = useCallback(() => {
    setActionMessage(null);
  }, []);

  const dismissRaceResult = useCallback(() => {
    setRaceResult(null);
  }, []);

  const playerPack: Card[] = draft.isComplete ? [] : (draft.packsInFront[PLAYER_SEAT_INDEX] ?? []);

  return {
    phase,
    draft,
    playerPack,
    playerPool,
    usedPoolIndices,
    chao,
    tournament,
    environment,
    interludeDraft,
    interludeRound,
    breedingSetup,
    raceResult,
    dismissRaceResult,
    actionMessage,
    dismissActionMessage,
    selectedTechniqueIds,
    log,
    pickCard,
    placeHabitatCard,
    continueToTournament,
    bondBondCard,
    awakenBondCard,
    consumePotionCard,
    plantSeed,
    toggleTechnique,
    runNextGroupRace,
    pickInterludeCard,
    runFinalRace: runFinalRaceHandler,
    pickBreedingPartner,
    startNextTournament,
    restartGame,
  };
}
