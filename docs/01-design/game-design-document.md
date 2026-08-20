# Game Design Document

*Working title: **Chao Draft**. See [`README.md`](../../README.md) for the trademark note. This document assumes you've read [`chao-garden-research.md`](../00-research/chao-garden-research.md) — it's referenced throughout as "the source material."*

> **Revision note (2026-08-20):** This is a substantial rewrite. The original design paired a Slay-the-Spire node-map run with a Dota Underlords-style multi-Chao board (Fruit economy, Species Tag synergy breakpoints, board leveling). Both are now **cut**. In their place: a single Chao competes in a 24-entrant single-elimination **Tournament**, Karate Bouts are removed (races only), and **Breeding** — previously a deferred post-MVP idea — is now the game's central meta-progression mechanic. Card system, stats, alignment, and evolution are largely unchanged. Anywhere this doc proposes a concrete number or formula that hasn't been playtested, it's flagged as a placeholder — see §8 and the open questions in [`roadmap.md`](../03-roadmap/roadmap.md).

## 0. Elevator pitch

Raise a creature by drafting cards instead of feeding animals, MTG-style. Enter it into a 24-entrant single-elimination Tournament, structured as a Slay-the-Spire-style bracket: race, get eliminated or advance, retreat to your Environment between rounds to draft a few more cards and train. Every event resolves on its own — you were never the one in the water — so the only decisions that matter are what you draft, what you bond, and what you load before the race starts. Win or place well enough in the Final Race, and your Chao breeds with an opponent of your choosing; the resulting foal enters the next Tournament, weaker than either parent but carrying a faint trace of their specialization. Lose without being chosen to breed, and the run is over.

## 1. Design pillars

These are the constraints every system below has to satisfy. Any feature that violates one of these needs a specific justification in its own section.

1. **You coach, you don't pilot.** The source material auto-resolves Races from stats and trained behavior (research §6). No system in this game should ask the player to directly control a Chao mid-race. All player agency happens *before* the race: what you drafted, what you bonded, what you loaded.
2. **Two axes, not one.** The source material's alignment (Hero/Dark/Neutral) and stat-color dominance are independent (research §5). The card system must preserve two independent axes of build identity — not collapse everything into "which color are you."
3. **The rarity layer should feel discovered, not stated.** The source material hides stat grades behind visible feeding choices (research §3). Card rarity should read the same way in play: you learn a card is powerful by what it does on the field, and pack odds should reward, not spoil, that discovery.
4. **A run is a Tournament, and Tournaments should want to end well.** Where the original design bounded a run by a Chao's lifespan, it's now bounded by the bracket: you're eliminated, or you make the Final Race and (maybe) breed. Finishing well should matter more than finishing fast, and losing without a breeding pick should genuinely end the run — see §6.6.

## 2. Inspiration-to-system map

| Source Chao Garden system | MTG Draft idea borrowed | Slay the Spire idea borrowed | Autochess idea borrowed | Becomes, in this design |
|---|---|---|---|---|
| Feeding animals (stat + body + behavior) | Booster draft: pick cards, pass packs, build a limited pool | Card rewards define your build over a run | — | **Bond Cards**, drafted and fused onto a Chao (§4.2) |
| Chaos Drives (pure stat, no body change) | Common "filler" stat cards that round out a curve | — | — | **Regimen Cards** (§4.2) |
| Fruit / one-off buffs | Instants as combat tricks | Race-scoped energy economy | — | **Technique Cards** played mid-Race (§4.2, §5) |
| Animal-mimicked behavior | Keyword abilities on creatures | — | — | Keywords granted by Bond Cards (§4.2) |
| Alignment slider (Hero/Dark/Neutral) | Color pie's order/chaos moral coding | — | — | **Alignment** derived from net color balance of bonded cards (§3.3) |
| Stat-color dominance → 2nd evolution | Color identity & two-color archetypes (guilds) | — | — | **Species/Archetype identity**, color pairs as build-arounds (§4.4) |
| Hidden stat grades (E–S) | Card rarity (common → mythic) | — | — | **Card rarity tiers** (§4.3) |
| Multiple animals of the same type reinforcing a look | — | — | Buying 3 copies of a unit to star it up | **Awakening**: 3 copies of a Bond Card fuse into a stronger version (§4.6) |
| Chao Race legs, forks, obstacles | — | Turn-based encounters with player-chosen cards | — | **Race Legs**, Technique cards spent per leg (§5.1) |
| Single continuous Garden save | — | Bounded runs, branching map, relics | — | **Tournament** = one run; a 24-entrant bracket instead of a map (§6) |
| Breeding (2-parent inheritance) | — | Meta-progression between runs | — | **Breeding** at the Final Race — now core, not deferred (§6.4) |
| Black Market Chao | Draft singles / sideboard | — | Shop reroll for gold | *Cut* — was funded by the now-removed Fruit economy; see §7 open question |
| Chao Karate auto-resolution | — | — | Auto-battler combat resolution | *Cut.* Races only, for now — see the 2026-08-20 revision note above |

## 3. The Chao

### 3.1 Stats

Same five physical stats as the source material (research §1), all now scoped to Race Legs only — Karate Bout's damage/evasion roles are gone along with the Bout:

| Stat | Role in a Race Leg |
|---|---|
| Swim | Resolves Water legs |
| Fly | Resolves Air legs and the Flying shortcut fork |
| Run | Resolves Sprint legs |
| Power | Resolves Obstacle legs |
| Stamina | Determines whether a Chao finishes at all (DNF threshold) |
| **Climb** *(new, 2026-08-20)* | Resolves Climb legs — a genuinely distinct stat from Power, not a reflavor of it (see §5.1) |
| **Jump** *(new, 2026-08-20)* | Resolves Jump legs — a genuinely distinct stat from Run, not a reflavor of it (see §5.1) |

Mind and Luck are kept as minor modifiers (Mind affects Technique success chance; Luck affects leg-check variance) rather than headline stats — they were minor in the source material and stay minor here.

### 3.2 The color pie

Every stat is assigned a color, MTG-style. This is the load-bearing translation of the whole design: **a Bond/Regimen/Technique card's color tells you which stat it primarily raises, and its color *identity* tells you which archetype it belongs to.**

| Stat | Color | Identity (Slay-the-Spire-style flavor of "what this archetype does") |
|---|---|---|
| Stamina | 🟢 Green | Endurance, growth, sustain — the "ramp" color. Big-picture, outlasts. |
| Run | 🔴 Red | Speed, aggression, tempo — extra actions, haste, low-cost cards. |
| Power | ⚫ Black | Force, sacrifice, high-impact single effects. |
| Fly | 🔵 Blue | Evasion, tempo, card selection — "see more, take the shortcut." |
| Swim | ⚪ White | Defense, protection, order — stabilizing, DNF-proofing. |

Two-color archetypes exist exactly like MTG guilds and work as draft signposts (the full 10-pair table, with example cards, is in [`card-set-list.md`](card-set-list.md#guild-archetypes)). Several of the existing archetype identities (Brawler, Bruiser, Sentinel, Trickster) were written with Karate Bout in mind and will need a race-only reframe — flagged as a content follow-up, not resolved in this pass.

**Climb and Jump don't get their own colors.** They're real, distinct stats (§3.1) — not a color-pie expansion. Proposed mapping (my call, not yet confirmed by the user): Climb-granting cards stay Black, since climbing is still thematically Power-adjacent effort; Jump-granting cards stay Red, since jumping is still thematically Run-adjacent explosive movement. A Bond Card can grant Climb or Jump as a *secondary* stat the same way some cards already grant two stats today (e.g. Bramble Hare: Green, grants both Stamina and Run) — the 5-color, 10-guild structure stays intact, it's just that Black now also has a secondary stat lane (Climb) alongside Power, and Red has one (Jump) alongside Run. Flagged as an interpretation, not a locked decision.

### 3.3 Alignment: a second, independent axis

Per research §5, alignment must stay orthogonal to stat archetype. It's derived automatically from the **net color balance of every card currently bonded/attached to a Chao** — no separate mechanic to track:

- White + Green cards pull toward **Hero** (order, protection, growth).
- Black + Red cards pull toward **Dark** (force, sacrifice, aggression).
- Blue cards are alignment-neutral (intellect isn't moral) and act as a damper — a Blue-heavy Chao resists drifting either way even if it also holds a couple of White or Black cards.

This is recomputed continuously (not locked at evolution) so re-bonding during an Environment Interlude (§6.3) can genuinely swing a Chao's alignment.

### 3.4 Evolution

Two evolutions per Tournament, matching the source material's two-cocoon structure — unchanged in spirit from the original design, but simplified now that there's no Bout to gate a combat mechanic behind:

- **First Evolution** (early in the bracket — exact trigger point is an open question, §7): locks in **Hero / Dark / Neutral** form based on the alignment axis at that moment. Cosmetic + a small passive.
- **Second Evolution** (later in the bracket): locks in the **dominant stat color** as a mechanical archetype, exactly as the source material's second evolution reads color-dominance (research §5).

Post-second-evolution, continued bonding still visually mutates the Chao (new Bond Cards override old ones in the same slot — see §3.5), matching the source material's "keeps morphing based on what you feed it after evolving" behavior.

### 3.5 Body / Bond slots

Four slots, standing in for the source material's head/back/hand/foot animal-part locations:

| Slot | Typical Bond Card flavor |
|---|---|
| Head | Sensory/perception keywords |
| Back | Wings/fins/shell — Fly and Swim-leaning keywords |
| Hands | Power-leaning keywords (grip, climb) |
| Feet | Run/Stamina-leaning keywords (speed, endurance) |

Bonding a new Bond Card into an occupied slot **replaces** the old one (its stat/keyword/cosmetic are lost) — this preserves the source material's real tension around re-feeding a different animal type over an already-shaped Chao, and it's the main sink for "I drafted a better version of this slot, do I commit to the swap" decisions.

### 3.6 A Chao's lifetime is now a Tournament, not a Generation

The original design bounded a run by an **Age budget** ticking down across a branching map, ending in a happiness-gated cocoon/reincarnation check. That's gone. A Chao's competitive lifetime is now bounded by **the bracket** (§6): it plays until eliminated, or reaches the Final Race and — if it places well enough — breeds. See §6.6 for exactly what ends a run and what, if anything, is preserved when it does.

**Open question:** does **Happiness** still exist as a tracked value? The original design used it to gate the reincarnation cocoon; that gate is gone, but Happiness could still matter for something else (a tiebreaker, a Kindergarten-style event, an Environment bonus) — or it could be cut entirely along with the old cocoon system. Not yet decided; see roadmap.md.

## 4. The card system

### 4.1 Why cards replace feeding, mechanically

Feeding in the source material is really three separable effects bundled into one action (stat, body, behavior — research §2). Splitting them into distinct card types is what makes a *draft* meaningful: in the source game there's no scarcity or opportunity cost to feeding (go find another rabbit), so there's no real choice. A draft imposes scarcity — you can't have every card, and passing (or simply not picking) a card is a real cost.

### 4.2 Card types

| Type | Source-material equivalent | Attaches to | Lifespan | Effect |
|---|---|---|---|---|
| **Bond Card** | Animal | A Chao, in one of 4 Bond Slots (§3.5) | Permanent until overwritten | Stat grant (with a rarity-scaled roll toward the card's grade ceiling — see §4.3) + cosmetic body mutation + a passive keyword. Carries 1–2 **Species Tags** (Rabbit, Bird, Fish, Dragon, Insect, Beast, …) — cosmetic/flavor only now that board-wide synergy breakpoints are cut (§2). |
| **Regimen Card** | Chaos Drive | Consumed, no slot | One-time | Flat stat grant, no cosmetic change, no keyword. The "pure numbers" card — always safe to take late in a pack when nothing else fits. |
| **Technique Card** | Fruit / trained technique | Held in a Technique hand, played during a Race Leg | Consumed on use (Legendary techniques are Exile-on-use — once per Tournament) | A combat trick: costs Energy (§5.2), resolves an immediate effect scoped to the current Leg (e.g. "auto-win the Power check on this Obstacle leg"). No longer usable in a Bout — that scope is gone. |
| **Trait Card** | Behavior mimicry | A Chao, max 2 concurrent, not slot-limited | Permanent | A passive triggered ability tied to Race-relevant triggers only (`leg_start`, `leg_won`, `race_start`, `stamina_below`) now that Bout-only triggers (`on_hit`, `on_dodge`, `round_start`, `bout_start`) have no resolver to fire in. |
| **Item Card** | Toys/emblems | A Chao, freely re-equippable | Permanent while equipped, movable | Colorless — draftable and usable regardless of a Chao's color identity. The answer to being color-screwed out of a pack. |
| **Habitat Card** | — (new; land-equivalent) | Your **Environment** (§6.3), not a Chao | Permanent | A passive that supports training between rounds — exact effect is an open question now that Fruit income is cut; see §7. |

**Content follow-up (not resolved in this pass):** a number of already-authored cards (`packages/sim/src/cards/data/*.ts`) have keywords written around Bout-only triggers (Warthog Tusks' on-hit Knockback+, Jackrabbit Reflex's "always acts first in round 1," Coral Turtle Shell's Bulwark, etc.). These aren't broken — they simply never fire under a race-only resolver, the same way any trigger that never matches just stays silent — but they should eventually be reflavored into Race-relevant effects or explicitly retired. Tracked in the roadmap.

### 4.3 Rarity

Four tiers, mapped onto the source material's E–S hidden-grade idea (research §3) but made *visible on the card* — the "hidden" part of the source system is instead expressed through **grade-roll variance within a rarity**, not through hiding the rarity itself:

| Rarity | Pack frequency (per 15-card pack) | Design space |
|---|---|---|
| Common | 10 | Simple, single-effect, define the baseline curve. Regimen cards are mostly here. |
| Uncommon | 3 | A Bond Card with one keyword, or a Trait/Item with a real decision attached. |
| Rare | 1–2 | Strong keyword, often bends a whole archetype, alignment-relevant. |
| Legendary | ~1 in 8 packs | Build-around, run-defining. Often a unique Technique or an Awakening-adjacent Bond Card. |

A card's **grade roll** (visible as a small range on the card, e.g. "Swim +12–18") reintroduces the source material's per-instance variance without hiding rarity itself.

**Resolved (2026-08-20):** this "15-card pack" frequency table describes the *Draft Booster* format from the original design, and it **does** still have a place in the Tournament: it runs once, at the very start of a Tournament, before Round 1 (§6.2's bracket diagram). The much smaller Environment Interlude booster (§6.3, 3 packs of 3 cards, no passing) is a separate, additional card-acquisition moment, not a replacement for this one.

### 4.4 Color identity, splash cost, and archetypes

A Chao's **color identity** is the union of colors among its currently-bonded cards. The original design charged extra Fruit (a "splash tax") to bond a card outside that identity — with Fruit gone, this mechanic needs a new currency or a new form entirely (e.g., a hard restriction instead of a soft cost, or something the Environment provides). **Open question**, not resolved in this pass — see roadmap.md.

Ten guild-style two-color archetypes still exist (five listed in §3.2, the remaining five in [`card-set-list.md`](card-set-list.md#guild-archetypes)). Draft **signals** still work as in MTG wherever a pack-passing draft format is actually used (§4.3's open question).

### 4.5 Draft format

Two different card-acquisition moments exist side by side (confirmed 2026-08-20 — both survive, neither replaces the other):

- **Draft Booster** (original format): open a 15-card pack, pick one, pass the rest to the next of 3–7 AI bot seats; repeat for 3 packs. Everything picked joins your pool. Runs **once per Tournament, before Round 1** (§6.2).
- **Environment Interlude Booster** (new, §6.3): 3 packs of 3 cards each, pick 1 per pack, no passing — a solo choice, not a shared draft. Much smaller stakes per pick. Runs **twice per Tournament** (after Round 1, after Round 2).

AI drafter bots (for the pack-passing Draft Booster) have simple archetype-affinity weights (see [`architecture.md`](../02-technical/architecture.md#bot-drafting) for the algorithm) so that packs feel like they're being fought over, not handed to you.

### 4.6 Duplicates & Awakening

Drafting **three copies of the same named Bond Card** (anywhere in your pool) lets you fuse them into that card's **Awakened** version the next time you bond it — a single stronger card, not three simultaneously equipped ones. This was originally framed as an autochess-board mechanic (porting the 3-copies-to-star-up idea), but it's really always been a card-level mechanic that doesn't need a board at all, so it survives the §2 cut unchanged in spirit.

**Tuning (decided 2026-08-20):** an Awakened card's stat grant is worth **3.5×** a single copy's average grant — deliberately *more* than three copies stacked additively would total (3.0×), not less. A single copy of Bramble Hare granting an average of 8 Stamina would Awaken into a card averaging 28 Stamina (8 × 3.5), not a diminishing-returns 20 (8 × 2.5). This was a deliberate choice to reward duplicate-heavy drafting as a real alternate strategy (mirroring Auto Chess/Underlords, where 3-starring is often *better* than fielding 3 separate weaker units) rather than a soft consolation prize.

## 5. Race resolution

Per pillar #1, none of this is played directly — it's simulated from Chao stats, bonded cards, and pre-loaded Technique cards. (Karate Bout resolution is cut — see the revision note at the top of this doc.)

### 5.1 Race Leg resolution

A Race is now a sequence of **5 to 8 Legs**, drawing from at least 3 distinct Leg types per race (expanded from the original Start/Sprint/Obstacle/Water/Air set). **Resolved 2026-08-20:** Climb and Jump are their own Legs checking their own dedicated stats (§3.1) — they don't replace or reflavor Obstacle/Sprint, they sit alongside them, giving up to 7 distinct Leg types total:

| Leg type | Stat checked | Notes |
|---|---|---|
| Sprint | Run | Straightforward pace check. |
| Obstacle | Power | Unchanged from the original design. |
| Climb | Climb *(new stat)* | Distinct from Obstacle/Power — a Chao can be a strong Power racer and a weak climber, or vice versa. |
| Jump | Jump *(new stat)* | Distinct from Sprint/Run, same reasoning. |
| Water | Swim | |
| Air | Fly | |
| (Flying/Swim shortcut fork) | Fly or Swim | Not a Leg type on its own — a fork attached to any Leg, resolved as: a threshold check on the fork's stat decides whether the shortcut is taken, then a second check (same stat) resolves the shortcut Leg itself. Unchanged from the original design. |

Resolution, per Leg:

1. Check the Leg's stat against a course-defined difficulty curve (with a small variance roll, not pure determinism — see roadmap.md's tuning notes).
2. If the Leg has a shortcut fork, resolve it as described above.
3. **Stamina** decrements each Leg; hitting 0 before the finish is a DNF.
4. Pre-loaded Technique cards fire on trigger, spending the Energy budget set before the Race began (§5.2).

**DNF consequence, revised:** in the original design, a DNF didn't eliminate a Chao from its run — only the final cocoon check mattered. Under the Tournament structure, **a Race directly determines elimination** (last place is out, per §6.2) — so a DNF is likely to *mean* elimination now, since finishing last (or not finishing) in an elimination race ends the Chao's Tournament. This is a meaningful tonal shift from the original design's "a bad Race shouldn't end things on the spot" pillar, and is called out explicitly since it's a direct consequence of the harsher elimination structure the user has chosen (§6.6 confirms this is intentional).

### 5.2 Energy

A small per-Race budget (default 3, modified by Traits/Items/Habitat bonuses) spent to *load* Technique cards before a Race begins — Slay-the-Spire's energy economy, front-loaded into a setup phase rather than spent turn-by-turn, since pillar #1 rules out mid-race player input.

## 6. The Tournament

### 6.1 Overview

A run is a single **Tournament**: a 24-entrant single-elimination bracket the player's one Chao competes in alongside 23 others (bot-controlled, or eventually other players' saved lineages — see §7). It replaces the original branching-map "Generation" entirely.

### 6.2 The Bracket

```
[ DRAFT BOOSTER ×1 — §4.5, the original 15-card pack-passing format ]
                              |
Round 1 — 4 groups of 6, 3 races each (last place eliminated per race: 6→5→4→3)
   Group 1        Group 2        Group 3        Group 4
   (6→5→4→3)      (6→5→4→3)      (6→5→4→3)      (6→5→4→3)
        \              /               \              /
         \            /                 \            /
          [ ENVIRONMENT INTERLUDE #1 — §6.3 ]
                |                                |
Round 2 —  Group 1+2 → Group12          Group 3+4 → Group34
           (6→5→4→3)                     (6→5→4→3)
                \                                /
                 \                              /
          [ ENVIRONMENT INTERLUDE #2 — §6.3 ]
                              |
Round 3 —      Group12 + Group34 → Group1234
                    (6→5→4→3)
                              |
                    FINAL RACE (§6.4) — 3 racers, 10 Legs
                              |
                  1st / 2nd / 3rd place determined
                              |
                          BREEDING (§6.4)
```

24 entrants → 12 (after Round 1) → 6 (after Round 2) → 3 (after Round 3) → ranked by the Final Race. The player's Chao occupies one of the 24 slots; **confirmed (2026-08-20): for now, only the player's own bracket path is actively played** — the other groups' races resolve independently in the background to produce the entrants the player's consolidated groups will later contain. Watching (not just playing) other groups' races is a documented future upgrade — see §6.7.

Every group-stage race eliminates exactly the last-place finisher; the group shrinks by one each race until 3 remain, then consolidates with another 3-chao group for the next round.

### 6.3 Environment Interludes

Twice per Tournament — after Round 1 and after Round 2, but **not** between Round 3 and the Final Race — the player returns to their **Environment** (the direct descendant of the original design's "Garden Board," now scoped to a single Chao's support structure rather than a multi-Chao roster):

1. Open 3 Environment Interlude Boosters (3 cards each, §4.5), picking 1 card from each — 3 cards total.
2. Apply drafted cards **to the Environment first** (Habitat Cards, or anything Environment-scoped), *then* train — bond the remaining drafted cards onto the Chao. This ordering is intentional (per the user's spec): you might draft an Environment upgrade that changes what training is worth doing.

### 6.4 The Final Race & Breeding

The Final Race is longer and structurally distinct from a group-stage race — 10 Legs for now ("we will design this better later," per the user). It ranks the surviving 3 entrants 1st/2nd/3rd, which sets up **Breeding**:

- **1st place** picks any other Tournament entrant (from the full 24) to breed with, except the 2nd- and 3rd-place finishers.
- **2nd place** picks any entrant except anyone from the **Group1234** pool (the 6 chao who made it to Round 3).
- **3rd place** picks any entrant except anyone from **Group1234, Group12, or Group34** — narrowing the pool to only chao eliminated in Round 1.

Each pairing produces exactly one baby — **three babies total**, one per finalist — who enter the next Tournament (§6.5). This tiered exclusion means 1st place has the widest breeding pool (21 of 24 possible partners) and 3rd place the narrowest (only Round-1 casualties) — a legibility risk worth watching in playtesting (a player needs to understand *why* they can't pick a given partner; see §8).

#### Breeding: stat and temperament inheritance (proposed algorithm, not yet playtested)

The user's spec: the baby should resemble both parents, should **not** be a flat 50/50 average, and should be **10–20% as strong as the parents**. Proposed formula, per stat:

```
for each stat:
  w = random value in [0.3, 0.7]           // rolled per stat, not once per baby —
                                             // gives the baby its own per-stat lean
                                             // toward one parent or the other
  blended = parentA.stat * w + parentB.stat * (1 - w)

strengthFactor = random value in [0.10, 0.20]   // rolled ONCE per baby, applied to
                                                  // every stat uniformly, so the baby
                                                  // is coherently "one generation weaker"
                                                  // rather than randomly strong in some
                                                  // stats and negligible in others

baby.stat = round(blended * strengthFactor)   // for every stat
```

Alignment/temperament: blend `parentA.alignmentValue` and `parentB.alignmentValue` with the same per-stat-style random weight, but note that alignment is *derived* from currently-bonded cards (§3.3), not stored independently — so this blended value only matters as a **starting bias** if the baby inherits any cards at all (see below); otherwise a card-less baby simply starts Neutral by construction, regardless of parentage.

This is a first-draft proposal, not a locked design — see roadmap.md for the specific numbers (weight range, strength-factor range) flagged as open.

#### Breeding: cosmetic and skill inheritance (proposed algorithm, not yet playtested)

The user's spec: a baby should look like "a slightly modified base Chao" even if its parents are heavily specialized, with **visual specialization creeping in more over the course of the game** as more Tournaments (and generations of breeding) pass. Proposed approach:

- A baby starts with **empty Bond Slots** (a blank cosmetic slate), except for a small number of slots seeded with a scaled-down copy of one parent's Bond Card — this is what gives "a slightly modified base Chao" its modification, rather than a fully blank start.
- The **number of inherited slots** scales with how many Tournaments the lineage has been through: proposed placeholder formula `inheritedSlotCount = min(4, floor(tournamentNumber / 3))` — Tournament 1–2 babies inherit 0 slots (pure base look), Tournament 3–5 babies inherit 1, and so on up to all 4 slots by Tournament 12+. **Not tuned or playtested** — purely illustrative of the intended curve shape (slow creep, not immediate full specialization).
- Any inherited Bond Card's stat grant is rolled down the same way as a stat (10–20% of the original, per the strengthFactor above) — a baby never starts with a parent's full-strength keyword, only a faint echo of it.

### 6.5 Tournament-to-tournament progression

The 3 babies produced by Breeding fill 3 of the next Tournament's 24 slots. The remaining 21 are freshly generated, but **seeded partly from a persistent pool of past Tournament winners** ("thus preserving difficulty," per the user's spec) rather than being purely random every time — meaning the field of opponents should get tougher over the course of a playthrough (or across playthroughs, if this pool is shared) as more winning lineages accumulate. The exact mechanism (how large the pool gets, what fraction of the 21 slots draw from it vs. pure random generation, whether it's local to one player's save or shared/global) is **not yet designed** — see roadmap.md.

### 6.6 Scoring & Elimination

- **Elimination is final.** If the player's Chao is eliminated from the bracket and isn't chosen by any of the three Final Race finalists as a breeding partner, the run ends — full stop, no soft continuation, no fresh Chao handed to the player. This was a deliberate choice (confirmed 2026-08-20), consistent with pillar #4's "should genuinely end."
- **Score** is generated from race placements across the whole run (exact formula not yet designed — "just give points for how they finish in each race," per the user's spec; see roadmap.md).
- The player can inspect their Chao at any time — both its stats and its current visual/cosmetic state.

### 6.7 Entrant generation & scouting

**Decided 2026-08-20:** start cheap, write up the richer version for later rather than building it now.

**Entrant generation, v1 (build this first):** the 23 non-player entrants get a procedural stat-and-cosmetic roll — randomized but plausible stat totals (no actual draft, no bonding decisions), fast to generate and simulate 23-at-a-time every Tournament.

**Entrant generation, v2 (written up now, deferred implementation):** each non-player entrant instead runs its own scaled-down version of the real pipeline —

1. Run the entrant through the same bot-drafting heuristic already built for the player's Draft Booster (`packages/sim/src/draft/bots.ts`) — same pack, same 3-round/15-card structure, just no human seat.
2. **New requirement this needs that doesn't exist yet:** a *bot bonding heuristic* — today's bots only know how to draft, nothing decides how a bot bonds its drafted pool onto its 4 Bond Slots. Proposed approach: for each slot, greedily bond whichever Bond Card in the entrant's pool scores highest by the same `rawPower`-style heuristic already used for drafting (`packages/sim/src/draft/bots.ts`'s `rawPower`), respecting whatever color affinity the entrant's draft already committed to.
3. Optionally run the entrant through its own Environment Interlude booster picks between rounds, same as the player.

This is meaningfully more expensive (23× a mini-draft-plus-bonding pass, potentially repeated at each Interlude) but produces genuinely textured rivals — each one *made choices*, addressing the design risk in §8. Revisit once the v1 loop is proven and playtesting shows the bracket feels hollow.

**Scouting (v1, build this now alongside entrant generation):** even though only the player's own bracket path is actively played (§6.2), **any** entrant — including ones the player hasn't raced yet — should be inspectable via a fuzzy, icon-based "scouting read" per Leg-relevant stat (Swim, Fly, Run, Power, Climb, Jump, Stamina): something like a 1–5 icon rating per stat, bucketed from the entrant's real numbers rather than showing exact figures, so a player can look at a rival and think "I bet that one's a strong swimmer" without being handed a spreadsheet. This is a lightweight derived-data function (`computeScoutingRead(chao) → Record<Stat, 1|2|3|4|5>` or similar), not a new simulation system.

**Full bracket visibility (v2, written up now, deferred):** letting the player actually *watch* (not just scout) other groups' races — full event-log playback for off-path races, not just a final placement — is a documented future upgrade once the core loop and scouting are both proven out.

## 7. Multiplayer / async note

Bot-generated Tournament entrants (§6.5) are the natural home for the "async ghost" idea from the original design: instead of (or alongside) procedurally generated opponents, some of the 21 non-baby entrant slots each Tournament could be populated by real other players' saved Chao lineages, snapshotted server-side. Because Race resolution is a pure function of a Chao's stats/cards + a seed, this requires no new resolver logic — only a new source for where an entrant's `Chao` data comes from. Still explicitly post-MVP; not required for a single-player Tournament loop to work.

## 8. Design risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| A single bad Race can end the entire run (§6.6) — this is now *confirmed* intentional, not a placeholder, but it's still a high-variance structure. | Roguelites can get away with harsh elimination if losing still *feels* meaningful (a story, a score) — if it just feels like bad luck with no narrative or skill signal, it reads as unfair rather than tense. | Lean hard on the event-log narration (already built, GDD §5.1/architecture.md §5.1) so *why* a Chao lost is always legible, and make sure scoring (§6.6) rewards how far a run got, not just win/loss, so an early elimination still has something to show for it. |
| The 23 non-player Tournament entrants start with a cheap procedural stat roll (§6.7, v1) — a wall of stat blocks with no visible drafting/personality reads very differently from 23 other "chao that made choices," which is exactly why v2 (a real mini-draft + bonding pass per entrant) exists as a written-up upgrade rather than being dropped. | The whole design's identity is built on cards + drafting mattering — if opponents are just numbers, half the game's texture is invisible to the player. | The scouting-icon feature (§6.7) is the interim mitigation — even a procedurally-rolled entrant reads as "a strong swimmer" rather than a bare number. Upgrade to v2 generation once the core loop is proven and playtesting shows the bracket feels hollow. |
| Breeding's three-tier exclusion pool (1st/2nd/3rd place have progressively narrower eligible partners, §6.4) is intricate — a player choosing a breeding partner needs to understand *why* certain chao are greyed out. | Confusing exclusion rules undermine what should be a triumphant, legible moment (you won, now pick your favorite rival to carry on your line). | UI should show *why* a given entrant is ineligible (e.g., "made it to the Final 6 — 2nd place can't pick them"), not just grey them out silently. |
| Several already-authored cards (§4.2) have keywords written for a Bout that no longer exists — they're inert, not broken, but a player drafting them gets a dead-feeling card. | Undermines pillar #3 (rarity/power should be *discovered*, not a trap) if a drafted Rare or Legendary quietly does nothing. | Content follow-up pass (roadmap.md) to reflavor Bout-only keywords into Race-relevant effects before this card set is treated as ship-ready, not just left as a known gap indefinitely. |
| Splash tax (§4.4) has no funding source anymore now that Fruit is cut — color identity currently has no cost at all, which may make color commitment meaningless. | Directly affects draft-pick tension; color identity was one of the design's core levers. | Open question, roadmap.md — needs a decision before Phase-level implementation resumes. |
