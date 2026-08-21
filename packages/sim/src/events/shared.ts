import type {
  Chao,
  EffectOp,
  ItemCard,
  SimEvent,
  StaticModifier,
  TechniqueCard,
  TriggerCondition,
  TriggeredEffect,
} from '../types';

// Resolution entry point for both Race and Bout: a Chao shows up at full
// health. `currentStamina` is the in-the-moment HP pool (distinct from the
// `stats.stamina` base value it's reset from) — see the Chao doc comment in
// types.ts.
export function resetCurrentStamina(chao: Chao): Chao {
  return { ...chao, currentStamina: chao.stats.stamina };
}

export interface Triggerable {
  source: 'bond' | 'trait' | 'item' | 'technique';
  cardId: string;
  effect: TriggeredEffect;
}

// True iff an equipped Item's effect is a passive StaticModifier ({stat,
// amount}) rather than a TriggeredEffect ({trigger, apply}) — the two
// shapes ItemCard.effect can be (types.ts). A StaticModifier is applied
// once at equip time (chao/bonding.ts's equipItem) and reversed at unequip,
// never collected here as something that "fires" during a Race.
function isStaticModifier(effect: ItemCard['effect']): effect is StaticModifier {
  return !('trigger' in effect);
}

// Gathers every currently-active TriggeredEffect on a Chao: Bond Card
// keywords (still equipped — GDD §3.5), Trait Cards (always active, max 2),
// equipped Items whose effect is a real trigger (not a passive
// StaticModifier — those are folded into base stats directly, see
// isStaticModifier above), and whichever Technique Cards were pre-loaded
// for this specific event (GDD §6.3 — chosen before the event starts, not
// mid-event). Architecture.md §5.3 calls for Traits and Techniques to share
// one trigger-matching implementation rather than two parallel systems;
// Bond keywords and Item effects use the same TriggeredEffect shape
// (KeywordEffect is a type alias for it) so they share it too.
export function collectTriggerables(chao: Chao, loadedTechniques: TechniqueCard[]): Triggerable[] {
  const triggerables: Triggerable[] = [];
  // Bonding is cumulative now (GDD §3.5, corrected 2026-08-20) — the same
  // keyword-bearing card bonded multiple times (5 Penguins) contributes its
  // keyword 5 separate times here, and fires 5 separate times when its
  // trigger matches. That's intentional, not a dedup bug: it matches the
  // "stacking intensifies everything, not just raw stats" philosophy.
  for (const { card } of chao.bondedCards) {
    if (card.keyword) {
      triggerables.push({ source: 'bond', cardId: card.id, effect: card.keyword });
    }
  }
  for (const trait of chao.traits) {
    triggerables.push({ source: 'trait', cardId: trait.id, effect: trait.effect });
  }
  for (const item of chao.items) {
    if (!isStaticModifier(item.effect)) {
      triggerables.push({ source: 'item', cardId: item.id, effect: item.effect });
    }
  }
  for (const technique of loadedTechniques) {
    triggerables.push({ source: 'technique', cardId: technique.id, effect: technique.effect });
  }
  return triggerables;
}

export interface AppliedEffect {
  chao: Chao;
  events: SimEvent[];
  // Ops that affect the CALLER's own control flow (skip a roll, end a Leg,
  // prevent damage on the hit currently being resolved, ...) rather than
  // mutating the Chao directly. Each op carries the context it needs (its
  // in-progress damage calculation, its in-progress dodge roll) that this
  // function has no visibility into — so it hands them back for the
  // Race/Bout resolver to interpret at the exact point that context exists,
  // instead of guessing at a generic mutation here.
  controlOps: EffectOp[];
}

// The stateful half of "shared trigger execution" (architecture.md §5.3):
// applies whichever EffectOps have an unambiguous mutation (modifyStat,
// restoreStamina, grantFruit) uniformly for both resolvers, and surfaces
// everything else as controlOps. `custom` ops (types.ts's Phase 0/1 escape
// hatch for keyword text that doesn't map to a primitive yet) fire and log
// honestly, with no mechanical effect — see the `custom` EffectOp doc
// comment. `grantFruit` fires a `fruit_gained` event that the app layer
// (useGame.ts) is responsible for actually crediting to the Environment —
// this function only knows about a Chao, not an Environment, so it can't
// credit Fruit itself.
export function applyEffectOps(
  chao: Chao,
  ops: EffectOp[],
  sourceCardId: string,
  sourceKind: Triggerable['source'],
): AppliedEffect {
  let nextChao = chao;
  const events: SimEvent[] = [];
  const controlOps: EffectOp[] = [];

  for (const op of ops) {
    if (op.op === 'modifyStat') {
      nextChao = {
        ...nextChao,
        stats: { ...nextChao.stats, [op.stat]: nextChao.stats[op.stat] + op.amount },
      };
    } else if (op.op === 'restoreStamina') {
      nextChao = {
        ...nextChao,
        currentStamina: Math.min(nextChao.stats.stamina, nextChao.currentStamina + op.amount),
      };
    } else if (op.op === 'grantFruit') {
      events.push({ type: 'fruit_gained', amount: op.amount, reason: sourceCardId });
    } else {
      controlOps.push(op);
    }
  }

  const firedEvent: SimEvent =
    sourceKind === 'technique'
      ? { type: 'technique_fired', cardId: sourceCardId, chaoId: chao.id }
      : sourceKind === 'trait'
        ? { type: 'trait_fired', cardId: sourceCardId, chaoId: chao.id }
        : sourceKind === 'item'
          ? { type: 'item_fired', cardId: sourceCardId, chaoId: chao.id }
          : { type: 'keyword_fired', cardId: sourceCardId, chaoId: chao.id };
  events.push(firedEvent);

  return { chao: nextChao, events, controlOps };
}

export interface FireTriggersResult {
  chao: Chao;
  events: SimEvent[];
  controlOps: EffectOp[];
  // Which (source, cardId) pairs have now consumed a `per_race` onceLimit —
  // pass this back in as `firedOnce` on the next fireTriggers call this Race
  // so a repeated checkpoint (e.g. two Sprint legs in one course) doesn't
  // let a "per race" keyword fire twice. See the doc comment below.
  firedOnce: ReadonlySet<string>;
}

function onceLimitKey(source: Triggerable['source'], cardId: string): string {
  return `${source}:${cardId}`;
}

// Collects every Triggerable on `chao` whose trigger matches `predicate`,
// applies each one in turn (threading the Chao through so multiple firings
// in the same checkpoint stack correctly), and returns the aggregated
// result. This is the single call site race.ts uses at every checkpoint
// (race_start, leg_start, leg_won, stamina_below, ...) — the "shared
// trigger-matching implementation" architecture.md §5.3 asks for.
//
// `firedOnce` enforces `TriggeredEffect.onceLimit: 'per_race'` — added
// 2026-08-21 (per the user's "hook this into races" request): this field
// existed on cards from the start but nothing ever actually checked it,
// so e.g. an `autoWinLeg` keyword with `onceLimit: 'per_race'` would fire
// on EVERY matching Leg in a course, not just the first, if a course
// happened to contain two Legs of that type. `per_round`/`per_bout` are
// Bout-only concepts with no Race-side meaning (Races have no "round");
// `per_generation` would need state persisted across many races within a
// Tournament, a bigger cross-race feature explicitly not built here — both
// are treated as "no limit" for now rather than silently wrong, which
// matches how those onceLimit values already behaved before this fix (i.e.
// unenforced) rather than making them behave differently without being
// asked to design that.
export function fireTriggers(
  chao: Chao,
  loadedTechniques: TechniqueCard[],
  predicate: (trigger: TriggerCondition) => boolean,
  firedOnce: ReadonlySet<string> = new Set(),
): FireTriggersResult {
  let nextChao = chao;
  const events: SimEvent[] = [];
  const controlOps: EffectOp[] = [];
  let nextFiredOnce = firedOnce;

  for (const triggerable of collectTriggerables(nextChao, loadedTechniques)) {
    if (!predicate(triggerable.effect.trigger)) continue;
    const key = onceLimitKey(triggerable.source, triggerable.cardId);
    if (triggerable.effect.onceLimit === 'per_race' && nextFiredOnce.has(key)) continue;

    const applied = applyEffectOps(nextChao, triggerable.effect.apply, triggerable.cardId, triggerable.source);
    nextChao = applied.chao;
    events.push(...applied.events);
    controlOps.push(...applied.controlOps);
    if (triggerable.effect.onceLimit === 'per_race') {
      nextFiredOnce = new Set(nextFiredOnce).add(key);
    }
  }

  return { chao: nextChao, events, controlOps, firedOnce: nextFiredOnce };
}
