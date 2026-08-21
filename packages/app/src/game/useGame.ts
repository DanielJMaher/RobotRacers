import { useCallback, useRef, useState } from 'react';
import type {
  BondCard,
  Card,
  Chao,
  DraftState,
  Environment,
  InterludeDraftState,
  ItemCard,
  NextTournamentSetup,
  PotionCard,
  RaceResult,
  SeedCard,
  StatColor,
  TechniqueCard,
  TournamentState,
  TraitCard,
} from '@chao-draft/sim';
import {
  addAvailableSeed,
  advancePlayerGroupRace,
  advanceTick,
  applyFruitEvents,
  awakenBondCardWithCost,
  awakenTraitWithCost,
  bondCardWithSplashTax,
  bondTraitWithCost,
  buildCardPool,
  computeBreedingPools,
  computeRaceTiming,
  computeSplashTax,
  consumePotionWithCost,
  coreGardenSet,
  createChao,
  createDraft,
  createEnvironment,
  createInterludeDraft,
  createRng,
  createTournament,
  DEFAULT_SPLASH_TAX,
  equipItemWithCost,
  FRUIT_COST_BY_RARITY,
  MAX_TRAITS,
  pickInterludeCard as pickInterludeCardOnState,
  plantSeed as plantSeedOnEnvironment,
  prepareNextTournament,
  runFinalRace,
  setHabitatChoice as setHabitatChoiceOnEnvironment,
  startRound,
  triggerFruitGain,
  triggerInitialFruitGain,
  unbondTrait as unbondTraitOnChao,
  unequipItem as unequipItemOnChao,
} from '@chao-draft/sim';
import { narrateDraftPick, narrateSimEvent } from './narration';

export interface RaceResultEntry {
  chaoId: string;
  name: string;
  isPlayer: boolean;
  eliminated: boolean;
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
  playerChaoId: string,
): RaceResultEntry[] {
  return ranking.map((chaoId) => {
    const result = results[chaoId]!;
    return {
      chaoId,
      name: nameById[chaoId] ?? chaoId,
      isPlayer: chaoId === playerChaoId,
      eliminated: chaoId === eliminatedChaoId,
      timing: computeRaceTiming(result.finalChao, result.events),
    };
  });
}

const CARD_POOL = buildCardPool(coreGardenSet);
const SEAT_COUNT = 4;
const PLAYER_SEAT_INDEX = 0;
const PLAYER_SEAT_ID = `seat-${PLAYER_SEAT_INDEX}`;

export type Phase = 'draft' | 'habitat_placement' | 'tournament' | 'interlude' | 'breeding';

// Every card now costs Fruit of its own color to use (playtest-prep,
// revised 2026-08-21, per the user's direct request: "when we use a card we
// are paying the card's cost in the appropriate colored fruit... there needs
// to be a cost benefit struggle"). Previously an on-color bond was
// completely free — only reaching off-identity ever cost anything, which is
// exactly why there was no real economic tension to using an entire drafted
// pool. The card's own color is drawn down first; Wildcard/colorless Fruit
// covers whatever's left short — for BOTH the base cost and any off-color
// splash tax — matching the GDD's own "Wildcard Fruit spends as any color"
// rule (§6.9). Fixed 2026-08-21: the base cost used to require the full
// amount from the card's exact color with no fallback, which meant any
// color a player's 3 Habitat slots didn't happen to cover (structurally
// at least 2 of the 5 colors, always) was permanently unusable no matter
// how much Wildcard Fruit was banked — a real bug the user hit directly
// (Awakening "not working" was this, not a separate issue).
function describeFruitShortfall(environment: Environment, color: BondCard['color'], baseCost: number, tax: number): string {
  const need = baseCost + tax;
  const have = environment.fruit[color] + environment.fruit.colorless;
  const taxNote = tax > 0 ? ` (${baseCost} base + ${tax} off-color splash tax)` : '';
  return `${need} Fruit total${taxNote} — have ${environment.fruit[color]} ${color} + ${environment.fruit.colorless} Wildcard (${have} combined)`;
}

// Builds an accurate "(paid ...)" log note reflecting exactly which bucket
// funded what — since colorless can now cover part of the base cost too,
// not just splash tax, a flat "(paid N {color} Fruit)" would be wrong
// whenever the own color fell short and colorless picked up the difference.
function formatCostNote(color: string, baseCostPaid: number, baseCostFromColorless: number, taxPaid: number): string {
  const ownColorPortion = baseCostPaid - baseCostFromColorless;
  const parts: string[] = [];
  if (ownColorPortion > 0) parts.push(`${ownColorPortion} ${color} Fruit`);
  if (baseCostFromColorless > 0) parts.push(`${baseCostFromColorless} Wildcard Fruit (covering a ${color} shortfall)`);
  if (taxPaid > 0) parts.push(`${taxPaid} Wildcard splash tax`);
  return ` (paid ${parts.join(' + ')})`;
}

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
  // Wildcard (colorless) Fruit confirmation (added 2026-08-21, per the
  // user's direct request: "Uncolored fruits are wild card and can be used
  // for any color, so if a player is about to use that give them a
  // confimration pop up"). Every cost-paying action below computes its
  // result eagerly (a pure function of the current chao/environment, safe
  // to compute without committing) and, ONLY if that result would actually
  // draw on colorless Fruit, defers the real state commit into `onConfirm`
  // here instead of applying it immediately — the confirm/cancel buttons
  // (GardenScreen) either run that closure or drop it entirely, so
  // canceling truly spends nothing.
  const [pendingFruitConfirm, setPendingFruitConfirm] = useState<{ message: string; onConfirm: () => void } | null>(
    null,
  );
  const confirmPendingFruit = useCallback(() => {
    pendingFruitConfirm?.onConfirm();
    setPendingFruitConfirm(null);
  }, [pendingFruitConfirm]);
  const cancelPendingFruit = useCallback(() => {
    setPendingFruitConfirm(null);
  }, []);
  // Shared by every cost-paying action below: runs `commit` immediately if
  // the action's cost never touched Wildcard/colorless Fruit, otherwise
  // defers it behind the confirmation banner instead.
  const gateOnWildcard = useCallback((usesWildcard: boolean, message: string, commit: () => void) => {
    if (usesWildcard) {
      setPendingFruitConfirm({ message, onConfirm: commit });
      return;
    }
    commit();
  }, []);

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
        // No more drawn Habitat cards to collect (removed 2026-08-21,
        // playtest-prep) — createEnvironment always starts with 3 Open
        // Forts now; the player freely chooses each slot's color on the
        // next screen via chooseHabitat, see setHabitatChoice.
        const drawnSeeds = playerSeat.pool.filter((c): c is SeedCard => c.type === 'seed');
        let env = createEnvironment([]);
        for (const seed of drawnSeeds) env = addAvailableSeed(env, seed);
        // NOTE: the Tournament-start Fruit trigger (GDD §6.9) fires once the
        // player finishes choosing Habitats (continueToTournament below),
        // not here — at this point every slot is still empty by
        // construction, so triggering here would always compute against 3
        // empty Open Forts regardless of what the player actually chooses.
        // A real bug caught via a live Playwright pass before this fix
        // landed.

        setDraft(afterTick);
        setTournament(createTournament(freshChao, rngRef.current, others));
        setEnvironment(env);
        setPendingPlayerChao(null);
        setPendingOthers(null);
        setPhase('habitat_placement');
        appendLog([
          ...pickLines,
          `Draft complete! Your pool has ${playerSeat.pool.length} cards.`,
          'Choose your 3 Habitat colors before the Tournament begins.',
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

  // Free habitat choice (playtest-prep, added 2026-08-21, per the user's
  // direct request: "It is an open selection - I can choose any habitat for
  // any of the slots") — the primary way to set a slot's color now, in
  // place of the Draft Booster's random per-pack bonus Habitat card (which
  // previously left the player stuck with whatever 3 colors the RNG handed
  // them). `undefined` clears a slot back to Open Fort. Freely re-choosable
  // up until "Continue to Tournament" — see setHabitatChoice's own comment.
  const chooseHabitat = useCallback(
    (slotIndex: number, color: StatColor | undefined) => {
      if (!environment) return;
      setEnvironment(setHabitatChoiceOnEnvironment(environment, slotIndex, color));
    },
    [environment],
  );

  const continueToTournament = useCallback(() => {
    if (!environment) return;
    // Tournament-start Fruit trigger (GDD §6.9) — fires now, once Habitat
    // placement is finalized, so it reflects what the player actually placed.
    // Doubled, plus a flat colorless bonus, ONLY here (playtest-prep,
    // 2026-08-21, per the user's direct request) — a real opening budget now
    // that every card costs Fruit to use (see bondBondCard/consumePotionCard
    // below). The recurring after-every-race trigger stays at the normal
    // rate (triggerFruitGain, used further down in this file).
    setEnvironment(triggerInitialFruitGain(environment));
    setPhase('tournament');
    appendLog(['The Tournament begins — 24 entrants, 4 groups of 6.']);
  }, [environment, appendLog]);

  const bondBondCard = useCallback(
    (card: BondCard, poolIndex: number) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = bondCardWithSplashTax(playerChao, environment, card, DEFAULT_SPLASH_TAX, rngRef.current);

      if (!result.ok) {
        const baseCost = FRUIT_COST_BY_RARITY[card.rarity];
        const tax = computeSplashTax(playerChao, card, DEFAULT_SPLASH_TAX);
        const message = `Can't bond ${card.name} — needs ${describeFruitShortfall(environment, card.color, baseCost, tax)}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const regions = Object.keys(card.bodyMutations).join(', ');
      const costNote = formatCostNote(card.color, result.baseCostPaid, result.baseCostFromColorless, result.taxPaid);
      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        // Bond Cards are one-time use: this specific drafted copy is spent
        // the moment it's bonded, never bondable again.
        setUsedPoolIndices((prev) => new Set(prev).add(poolIndex));
        // Bonding is cumulative now (GDD §3.5, corrected 2026-08-20) — this
        // always adds, never replaces, so the log just names the touched
        // regions rather than talking about a slot being occupied/replaced.
        appendLog([
          `${card.name} bonds onto ${regions}${costNote} — spent.`,
          ...result.events.map((e) => narrateSimEvent(e)),
        ]);
      };
      gateOnWildcard(
        result.baseCostFromColorless > 0 || result.taxPaid > 0,
        `Bonding ${card.name} will spend Wildcard Fruit${costNote}. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  const awakenBondCard = useCallback(
    (card: BondCard, poolIndices: [number, number, number]) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = awakenBondCardWithCost(playerChao, environment, card, DEFAULT_SPLASH_TAX);

      if (!result.ok) {
        const baseCost = FRUIT_COST_BY_RARITY[card.rarity] * 3;
        const tax = computeSplashTax(playerChao, card, DEFAULT_SPLASH_TAX);
        const message = `Can't Awaken ${card.name} — needs ${describeFruitShortfall(environment, card.color, baseCost, tax)}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const regions = Object.keys(card.bodyMutations).join(', ');
      const costNote = formatCostNote(card.color, result.baseCostPaid, result.baseCostFromColorless, result.taxPaid);
      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        setUsedPoolIndices((prev) => {
          const next = new Set(prev);
          for (const i of poolIndices) next.add(i);
          return next;
        });
        appendLog([
          `★ ${card.name} Awakened!${costNote} 3 copies fused onto ${regions} (3.5x average grant) — all 3 spent.`,
          ...result.events.map((e) => narrateSimEvent(e)),
        ]);
      };
      gateOnWildcard(
        result.baseCostFromColorless > 0 || result.taxPaid > 0,
        `Awakening ${card.name} will spend Wildcard Fruit${costNote}. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  const consumePotionCard = useCallback(
    (card: PotionCard, poolIndex: number) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = consumePotionWithCost(playerChao, environment, card, rngRef.current);

      if (!result.ok) {
        const cost = FRUIT_COST_BY_RARITY[card.rarity];
        const message = `Can't drink ${card.name} — needs ${describeFruitShortfall(environment, card.color, cost, 0)}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const costNote = formatCostNote(card.color, result.costPaid, result.costFromColorless, 0);
      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        // Potions are one-time use, same as Bond Cards (roadmap.md Phase
        // 5.5) — this specific drafted copy is spent the moment it's consumed.
        setUsedPoolIndices((prev) => new Set(prev).add(poolIndex));
        appendLog([`${card.name} is consumed${costNote} — spent.`, ...result.events.map((e) => narrateSimEvent(e))]);
      };
      gateOnWildcard(
        result.costFromColorless > 0,
        `Drinking ${card.name} will spend Wildcard Fruit${costNote}. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  // Trait/Item bonding (added 2026-08-21 — until now chao.traits/chao.items
  // could never actually be populated by anything in the app). Traits are
  // capped at MAX_TRAITS and cost Fruit like a Bond Card (own color + splash
  // tax); a full roster is reported distinctly from a poor one via
  // result.reason, matching bondTraitWithCost's own doc comment. Unlike
  // Bond/Potion cards, Trait/Item pool copies are NOT marked used/spent
  // here — they're freely re-equippable (Chao.items' doc comment), so
  // usedPoolIndices intentionally stays untouched; the Garden UI instead
  // tracks which are *currently equipped* by asking the live Chao directly
  // (chao.traits/chao.items), the same source of truth bonding reads from.
  const bondTrait = useCallback(
    (card: TraitCard) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = bondTraitWithCost(playerChao, environment, card, DEFAULT_SPLASH_TAX);

      if (!result.ok) {
        const message =
          result.reason === 'slots_full'
            ? `Can't bond ${card.name} — only ${MAX_TRAITS} Traits can be active at once. Unbond one first.`
            : `Can't bond ${card.name} — needs ${describeFruitShortfall(environment, card.color, FRUIT_COST_BY_RARITY[card.rarity], computeSplashTax(playerChao, card, DEFAULT_SPLASH_TAX))}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const costNote = formatCostNote(card.color, result.costPaid, result.costFromColorless, result.taxPaid);
      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        appendLog([`${card.name} bonds as a Trait${costNote}.`]);
      };
      gateOnWildcard(
        result.costFromColorless > 0 || result.taxPaid > 0,
        `Bonding ${card.name} will spend Wildcard Fruit${costNote}. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  const unbondTrait = useCallback(
    (card: TraitCard) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const nextChao = unbondTraitOnChao(playerChao, card.id);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: nextChao },
        },
      });
      appendLog([`${card.name} unbonded — no refund, but the slot is free.`]);
    },
    [tournament, appendLog],
  );

  // Trait Awakening (added 2026-08-21, per the user's direct bug report:
  // "awakenning traits didnt seem to work (3 mirage steps)" — Awakening
  // never existed for Traits at all before this, only Bond Cards). Same
  // shape as awakenBondCard above: `poolIndices` are marked used/spent
  // (unlike a normal single-copy Trait bond, which never touches
  // usedPoolIndices) — the 3 fused copies are genuinely consumed, even
  // though ordinary Trait equip/unequip stays freely reversible.
  const awakenTraitCard = useCallback(
    (card: TraitCard, poolIndices: [number, number, number]) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = awakenTraitWithCost(playerChao, environment, card, DEFAULT_SPLASH_TAX);

      if (!result.ok) {
        const message =
          result.reason === 'slots_full'
            ? `Can't Awaken ${card.name} — only ${MAX_TRAITS} Traits can be active at once. Unbond one first.`
            : `Can't Awaken ${card.name} — needs ${describeFruitShortfall(environment, card.color, FRUIT_COST_BY_RARITY[card.rarity] * 3, computeSplashTax(playerChao, card, DEFAULT_SPLASH_TAX))}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const costNote = formatCostNote(card.color, result.costPaid, result.costFromColorless, result.taxPaid);
      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        setUsedPoolIndices((prev) => {
          const next = new Set(prev);
          for (const i of poolIndices) next.add(i);
          return next;
        });
        appendLog([`★ ${card.name} Awakened as a Trait!${costNote} 3 copies fused into 1 (3.5x effect) — all 3 spent.`]);
      };
      gateOnWildcard(
        result.costFromColorless > 0 || result.taxPaid > 0,
        `Awakening ${card.name} will spend Wildcard Fruit${costNote}. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  const equipItem = useCallback(
    (card: ItemCard) => {
      if (!tournament || !environment) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const result = equipItemWithCost(playerChao, environment, card);

      if (!result.ok) {
        const cost = FRUIT_COST_BY_RARITY[card.rarity];
        const message = `Can't equip ${card.name} — needs ${describeFruitShortfall(environment, 'colorless', cost, 0)}.`;
        setActionMessage(message);
        appendLog([message]);
        return;
      }

      const commit = () => {
        setActionMessage(null);
        setTournament({
          ...tournament,
          entrants: {
            ...tournament.entrants,
            [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: result.chao },
          },
        });
        setEnvironment(result.environment);
        appendLog([`${card.name} equipped (paid ${result.costPaid} Wildcard Fruit).`]);
      };
      // Items always pay from colorless (ItemCard.color is always
      // 'colorless' — no "own color" bucket exists for them at all), so
      // every successful equip uses Wildcard Fruit, always confirmed.
      gateOnWildcard(
        true,
        `Equipping ${card.name} will spend ${result.costPaid} Wildcard Fruit. Continue?`,
        commit,
      );
    },
    [tournament, environment, appendLog, gateOnWildcard],
  );

  const unequipItem = useCallback(
    (card: ItemCard) => {
      if (!tournament) return;
      const playerChao = tournament.entrants[tournament.playerChaoId]!.chao;
      const nextChao = unequipItemOnChao(playerChao, card.id);
      setTournament({
        ...tournament,
        entrants: {
          ...tournament.entrants,
          [tournament.playerChaoId]: { ...tournament.entrants[tournament.playerChaoId]!, chao: nextChao },
        },
      });
      appendLog([`${card.name} unequipped — no refund, but freely re-equippable later.`]);
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
    // Fruit trigger fires after every race, GDD §6.9, plus any `fruit_gained`
    // events a Trait/Item/keyword/Technique produced during the Race itself
    // (applyFruitEvents — added 2026-08-21 alongside the Trait/Item rewrite;
    // previously grantFruit ops were narrated in the log but never actually
    // credited to the Environment, a real gap the audit for this task found).
    const envAfterRace = applyFruitEvents(triggerFruitGain(environment), outcome.raceEvents);
    setRaceResult({
      entries: buildRaceResultEntries(
        outcome.ranking,
        outcome.results,
        nameById,
        outcome.eliminatedChaoId,
        tournament.playerChaoId,
      ),
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
    setEnvironment(applyFruitEvents(triggerFruitGain(environment), outcome.raceEvents));
    setRaceResult({
      entries: buildRaceResultEntries(outcome.ranking, outcome.results, nameById, undefined, tournament.playerChaoId),
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
    pendingFruitConfirm,
    confirmPendingFruit,
    cancelPendingFruit,
    selectedTechniqueIds,
    log,
    pickCard,
    chooseHabitat,
    continueToTournament,
    bondBondCard,
    awakenBondCard,
    consumePotionCard,
    bondTrait,
    unbondTrait,
    awakenTraitCard,
    equipItem,
    unequipItem,
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
