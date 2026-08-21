# Game Design Document

*Working title: **Chao Draft**. See [`README.md`](../../README.md) for the trademark note. This document assumes you've read [`chao-garden-research.md`](../00-research/chao-garden-research.md) — it's referenced throughout as "the source material."*

> **Revision note (2026-08-20):** This is a substantial rewrite. The original design paired a Slay-the-Spire node-map run with a Dota Underlords-style multi-Chao board (Fruit economy, Species Tag synergy breakpoints, board leveling). Both are now **cut**. In their place: a single Chao competes in a 24-entrant single-elimination **Tournament**, Karate Bouts are removed (races only), and **Breeding** — previously a deferred post-MVP idea — is now the game's central meta-progression mechanic. Card system, stats, alignment, and evolution are largely unchanged. Anywhere this doc proposes a concrete number or formula that hasn't been playtested, it's flagged as a placeholder — see §8 and the open questions in [`roadmap.md`](../03-roadmap/roadmap.md).

## 0. Elevator pitch

Raise a creature by drafting cards instead of feeding animals, MTG-style. Enter it into a 24-entrant single-elimination Tournament, structured as a Slay-the-Spire-style bracket: race, get eliminated or advance, retreat to your Environment between rounds to draft a few more cards and train. Every event resolves on its own — you were never the one in the water — so the only decisions that matter are what you draft, what you bond, and what you load before the race starts. Win or place well enough in the Final Race, and your Chao breeds with an opponent of your choosing; the resulting foal enters the next Tournament, weaker than either parent but carrying a faint trace of their specialization. Lose without being chosen to breed, and the run is over.

## 1. Design pillars

These are the constraints every system below has to satisfy. Any feature that violates one of these needs a specific justification in its own section.

1. **You coach, you don't pilot.** The source material auto-resolves Races from stats and trained behavior (research §6). No system in this game should ask the player to directly control a Chao mid-race. All player agency happens *before* the race: what you drafted, what you bonded, what you loaded. **Flagged exception, proposed 2026-08-21, deliberately deferred (roadmap.md Phase 7 #9):** real-time "Skill Cards" playable *during* a Race at critical moments, paired with a future full race visualization — a genuine, acknowledged carve-out from this pillar rather than a silent contradiction, not designed or built yet.
2. **Two axes, not one.** The source material's alignment (Hero/Dark/Neutral) and stat-color dominance are independent (research §5). The card system must preserve two independent axes of build identity — not collapse everything into "which color are you."
3. **The rarity layer should feel discovered, not stated.** The source material hides stat grades behind visible feeding choices (research §3). Card rarity should read the same way in play: you learn a card is powerful by what it does on the field, and pack odds should reward, not spoil, that discovery.
4. **A run is a Tournament, and Tournaments should want to end well.** Where the original design bounded a run by a Chao's lifespan, it's now bounded by the bracket: you're eliminated, or you make the Final Race and (maybe) breed. Finishing well should matter more than finishing fast, and losing without a breeding pick should genuinely end the run — see §6.6.

## 2. Inspiration-to-system map

| Source Chao Garden system | MTG Draft idea borrowed | Slay the Spire idea borrowed | Autochess idea borrowed | Becomes, in this design |
|---|---|---|---|---|
| Feeding animals (stat + body + behavior) | Booster draft: pick cards, pass packs, build a limited pool | Card rewards define your build over a run | — | **Bond Cards**, drafted and fused onto a Chao (§4.2) |
| Chaos Drives (pure stat, no body change) | Common "filler" stat cards that round out a curve | — | — | **Potion Cards** (renamed from "Regimen Cards" 2026-08-20, §4.2) |
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

**Revised 2026-08-21 — tiered strength model, replacing the original flat 1-color-1-stat mapping below.** The original version of this section assigned exactly one stat per color (Stamina→Green, Run→Red, Power→Black, Fly→Blue, Swim→White), with Climb/Jump bolted on afterward as secondary lanes on Black/Red. That flat model is now superseded by a full **Strong / Good / Okay / Blind Spot** profile per color across all 7 Leg-relevant stats (§3.1), tied to a concrete animal-habitat theme per color (the user's own framing) instead of an arbitrary MTG-style stat/color pairing:

- 🟢 **Green — forest animals**
- 🔵 **Blue — swimming/waterside animals**
- ⚪ **White — flying/cliff-dwelling animals**
- ⚫ **Black — bugs**
- 🔴 **Red — open-plains animals**

| Stat | 🟢 Green | 🔵 Blue | ⚪ White | ⚫ Black | 🔴 Red |
|---|---|---|---|---|---|
| Stamina | **Strong** | Okay | Blind | Good | Good |
| Climb | Good | Blind | **Strong** | Good | Blind |
| Power | Good | Good | Okay | **Strong** | Okay |
| Jump | Okay | Blind | Good | **Strong** | Good |
| Swim | Blind | **Strong** | Blind | Blind | Blind |
| Fly | Blind | Blind | **Strong** | Okay | Blind |
| Run | Blind | Okay | Blind | Blind | **Strong** |

Every stat has exactly one color where it's genuinely Strong. Black and White each get *two* Strong stats rather than one — Power+Jump for Black (bugs are a theme built around two simultaneous headline physical feats, not one), Climb+Fly for White (flight and cliff-climbing are the same theme, not two separate ones). Green/Blue/Red keep a single clean Strong stat each (Stamina/Swim/Run respectively).

**A decisive, deliberate break from the old mapping:** Blue and White swap what they're best at — Blue was Fly, is now Swim; White was Swim, is now Fly. Climb and Jump, previously secondary afterthoughts bolted onto Black/Red with no real identity of their own, now have genuine Strong homes (White and Black respectively) — this directly answers a real gap an implementation-time playtest review flagged: Climb and Jump had only 3 cards each in the whole 106-card set, no Rare or Legendary at either stat, while procedurally-generated Tournament entrants rolled them freely — see `roadmap.md`'s playtest-prep notes.

Swim is the single most exclusive stat in this table — only Blue ever rises above Blind Spot on it, matching how specialized real swimming ability actually is versus, say, raw Power (which nobody is fully blind to). Fly and Run are nearly as exclusive. This is intentional: a hard blind spot is what makes a color's *identity* legible, not just its strengths — matches the existing splash-tax logic already treating "off-color" as a real cost (§4.4), now with a design reason a blind-spot stat is worth actually being bad at.

**Not yet done — tracked as immediate next work, not part of this revision:** re-authoring the actual 90+ existing Bond/Potion cards across `green.ts`/`red.ts`/`black.ts`/`blue.ts`/`white.ts` against this table (today's cards still reflect the old flat mapping), and expanding the roster of named creatures behind those cards from the current ~21 up toward 50, of varying power *and* Fruit cost (a small/cheap creature like an Otter granting a modest bonus for 1 Fruit, a larger/rarer one like a Dolphin costing more Fruit for a bigger grant) — a genuinely new acquisition-cost axis Bond Cards don't have today (today's Fruit cost only applies to off-color splash tax, §4.4, never to bonding an on-color card). Both are real, sequenced follow-up work, not done in this pass.

**Grounded against the actual source material, 2026-08-21** — the user provided local copies of `chao-island.com`'s SA1/SA2 Small Animal reference pages (saved under `docs/00-research/`, the live site blocks automated fetching) rather than relying on second-hand summaries. Two real, useful findings for when the 50-creature pass above happens:

- **SA1 (Dreamcast) and SA2 use genuinely different animal-data shapes, and both map cleanly onto our existing rarity-gated-complexity split (the open TODO in §3.5) rather than contradicting it.** SA1 Dreamcast's 15 animals (5 groups of 3: Swim/Fly/Run/Power/Random) are almost all a single clean stat bump plus at most one small secondary bump, with **zero negative values anywhere in the whole table** (e.g. Otter: Swim +2.0 only; Kangaroo: Run +1.2, Power +0.8) — this is a close match for how our Commons already work. SA2's 21 animals (7 groups: the same 4 plus Random/Mythical/Ghost) are richer and routinely negative (e.g. Otter: Swim +4.4, Fly −0.4, Run +0.8, Power −1.6; Rabbit: Fly +0.8, Run +4.0, Power −1.6) — a much closer match for our Uncommon+ "Penguin" pattern (§3.5). **Correction to something said earlier in conversation but not written down before this:** the claim that "real animals always touch every stat with mixed signs" was true only of the SA2/Modern data pulled via web search, not of original SA1 Dreamcast data — now that the real page is in hand, SA1's simpler pattern actually *supports* keeping Commons simple, rather than being evidence to loosen that rule.
- **SA2's 3 extra groups beyond the basic 4 map onto concepts we already have.** *Mythical* (Dragon/Phoenix/Unicorn) grants strong values across the board — a natural Rare/Legendary flavor. *Ghost* (Bat/Half Fish/Skeleton Dog) grants stats **plus a unique mechanical effect** (Skeleton Dog specifically *removes* animal parts and unlocks hat-wearing) — a direct real-world precedent for our existing Uncommon+ keyword-bearing Bond Cards, not just a flavor coincidence. *Random* (Raccoon/Sheep/Skunk) is a modest, balanced, all-positive spread across all 4 stats — a plausible template for a "generalist/off-color-flexible" card archetype we don't currently have a name for.
- **Body-part transfer uses 7 slots in SA1/DX** (Arms, Ears, Forehead, Horns, Feet, Tail, Wings; SA2/Battle adds an 8th, Face), and **a single animal typically contributes to several slots at once** (e.g. Otter: Arms+Ears+Feet+Tail from one creature) — more granular than our current 5 Body Regions (Legs/Arms/Back/Head/Torso, §3.5). Also confirmed: the source game **replaces** a slot's part with whichever animal was fed most recently, not an accumulated blend — a real divergence from our own "discrete top-contributor-wins" rule (§3.5), noted here for the record rather than changed, since that rule was already a deliberate decision, not an oversight.

Two-color archetypes exist exactly like MTG guilds and work as draft signposts (the full 10-pair table, with example cards, is in [`card-set-list.md`](card-set-list.md#guild-archetypes)) — that table still reflects the old color/stat mapping and needs a pass once the card re-authoring above happens. Several of the existing archetype identities (Brawler, Bruiser, Sentinel, Trickster) were also written with Karate Bout in mind and will need a race-only reframe — flagged as a content follow-up, not resolved in this pass.

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

Post-second-evolution, continued bonding still visually mutates the Chao — every Bond Card ever bonded keeps contributing, compounding the look further (see §3.5) — matching the source material's "keeps morphing based on what you feed it" behavior even more directly than the original design did.

### 3.5 Body Regions & bonding: cumulative, not replaceable (corrected 2026-08-20)

**This section replaces an earlier, incorrect version of the design.** The original write-up had 4 exclusive Bond Slots where bonding a new card *deleted* whatever was there before. That's wrong, and the fix isn't cosmetic — it changes how Bond Cards, stats, and visuals all work together. Corrected model, grounded in how the source material's feeding actually behaves:

- **A Chao can bond any number of Bond Cards over its lifetime.** There is no slot limit and no replacement. Feeding 5 of the same card stacks its effect 5×; feeding a second, different card afterward *adds on top of*, never erases, what's already there. **Clarified 2026-08-20: each physical drafted copy is one-time use.** Stacking "5 Penguins" means owning and bonding 5 separate drafted Penguin cards — not re-using one copy 5 times. A card is spent the instant it's bonded (or fused via Awakening, §4.6), gone from the pool for good, same lifecycle as Habitat and Seed cards.
- **One card can affect multiple Body Regions at once, with a mix of positive and negative grants.** The user's own example: a Penguin card touches *Legs* (+Swim, −Run), *Arms* (+Swim, −Power), and *Back* (−Fly) — five separate rolls across three regions, from one card. This is a real, textured push-and-pull, not a single stat stick.
- **Negatives are always smaller in magnitude than positives, as a hard authoring rule.** Stacking "opposed" creature types (Penguin *and* Monkey) dilutes a build — it never zeroes it out. You can always go wide and still come out net-positive somewhere.
- **Body Regions (locked 2026-08-20):** **Legs, Arms, Back, Head, Torso** — five regions, replacing the original four (which conflated Legs/Feet and Arms/Hands and had no Torso).
- **Card complexity is rarity-gated (working default — TODO to reconsider once there's real content to evaluate it against, see roadmap.md):** Commons stay simple — one region, one or two positive stat grants, easy to read at a glance. The full multi-region, mixed-sign "Penguin" pattern is reserved for Uncommon and above, where a card is meant to be a harder, more textured evaluation. This mirrors the existing rarity language (commons are simple, legendaries are complex) rather than inventing a new axis.
- **Visual appearance blends from the *entire* bonding history, per region — not from whatever's "currently equipped."** A Chao fed Penguins-then-Monkeys looks like a Penguin/Monkey hybrid; a Chao fed Rabbits-then-Elephants looks like a Rabbit/Elephant hybrid — even if the two ended up with similar final stat totals, they should *not* look similar. The look is keyed to specific bonding history, region by region, not to net stats. **Blend algorithm (decided 2026-08-20):** per region, whichever Species Tag has accumulated the most bonded contributions to that region simply *wins* — a discrete swap to that tag's body mutation asset, not a true rendered blend. A genuine proportional visual blend ("60% Penguin legs, 40% Rabbit legs") is real future design space, but explicitly not worth planning around now — it depends on a production art pipeline (hand-made assets, not AI-generated art/models) that isn't being built anytime soon.
- **Cards can grant special traversal abilities, not just stat numbers (mechanism decided 2026-08-20).** The user's example: an Elephant-flavored card could let a Chao "walk the riverbed" instead of swimming. This gets its **own dedicated EffectOp** (working name: `grantAlternateRoute` — exact shape TBD at implementation time, e.g. carrying which Leg type it applies to and what it lets the Chao ignore), deliberately separate from the existing Fly/Swim fork's threshold check (§5.1) rather than just an extension of it — a card like this is a distinct creature-flavored shortcut, not a bigger number feeding the same mechanic.
- **Chao coloring (decided 2026-08-20): purely cosmetic.** Skin/fur color pattern, distinct from the 5-color card pie (§3.2), carries no mechanical weight — flavor only, at least for now. Simplest option, and keeps "color" unambiguous (the card-color pie is the only one that does anything mechanically; alignment is its own separate axis, §3.3).

**Consequences for what's already built** (Phase 0's bonding engine, `packages/sim/src/chao/bonding.ts`, and most of the 91 authored cards) are real and not yet implemented — see roadmap.md for the concrete migration this requires before Phase 3 work resumes.

### 3.6 A Chao's lifetime is now a Tournament, not a Generation

The original design bounded a run by an **Age budget** ticking down across a branching map, ending in a happiness-gated cocoon/reincarnation check. That's gone. A Chao's competitive lifetime is now bounded by **the bracket** (§6): it plays until eliminated, or reaches the Final Race and — if it places well enough — breeds. See §6.6 for exactly what ends a run and what, if anything, is preserved when it does.

**Shelved (2026-08-20), not cut:** does **Happiness** still exist as a tracked value? The original design used it to gate the reincarnation cocoon; that gate is gone. Explicitly parked rather than decided either way — the user flagged it as "could definitely become an interesting balance mechanic" and wants to revisit it deliberately later rather than have it disappear by default or get bolted onto something prematurely now.

## 4. The card system

### 4.1 Why cards replace feeding, mechanically

Feeding in the source material is really three separable effects bundled into one action (stat, body, behavior — research §2). Splitting them into distinct card types is what makes a *draft* meaningful: in the source game there's no scarcity or opportunity cost to feeding (go find another rabbit), so there's no real choice. A draft imposes scarcity — you can't have every card, and passing (or simply not picking) a card is a real cost.

### 4.2 Card types

| Type | Source-material equivalent | Attaches to | Lifespan | Effect |
|---|---|---|---|---|
| **Bond Card** | Animal | A Chao — cumulatively, across any number of Body Regions (§3.5, **corrected 2026-08-20**) | Permanent, additive — never overwritten or replaced | One or more stat grants (rarity-scaled rolls, §4.3), each tagged to a Body Region and each *possibly negative* — Commons touch one region with positive grants only, Uncommon+ can span multiple regions with a deliberate mix of positive and negative (negatives always smaller in magnitude, §3.5). Cosmetic body mutation per affected region, blending with every other card ever bonded rather than replacing it. Carries 1–2 **Species Tags** (Rabbit, Bird, Fish, Dragon, Insect, Beast, …) — cosmetic/flavor only now that board-wide synergy breakpoints are cut (§2), but feeds the visual-blend weighting per region. |
| **Potion Card** (renamed from "Regimen Card" 2026-08-20 — same card, clearer name) | Chaos Drive | Consumed, no slot | One-time | Flat stat grant, no cosmetic change, no keyword. The "pure numbers" card — always safe to take late in a pack when nothing else fits. **Color-blending added 2026-08-20:** a Potion can carry up to 2 `secondaryColors` alongside its primary color (3 total), rarity-gated the same way Bond Card complexity is (§3.5) — Common stays single-color, Uncommon introduces 2-color blends, Rare/Legendary use 3-color blends with bigger per-stat grants. Blending doesn't touch color identity/splash tax (§4.4) — a consumed card was never "attached" in the sense that section scopes alignment to. |
| **Technique Card** | Fruit / trained technique | Held in a Technique hand, played during a Race Leg | Consumed on use (Legendary techniques are Exile-on-use — once per Tournament) | A combat trick: costs Energy (§5.2), resolves an immediate effect scoped to the current Leg (e.g. "auto-win the Power check on this Obstacle leg"). No longer usable in a Bout — that scope is gone. |
| **Trait Card** | Behavior mimicry | A Chao, max 2 concurrent, not slot-limited | Permanent | A passive triggered ability tied to Race-relevant triggers only (`leg_start`, `leg_won`, `race_start`, `stamina_below`) now that Bout-only triggers (`on_hit`, `on_dodge`, `round_start`, `bout_start`) have no resolver to fire in. |
| **Item Card** | Toys/emblems | A Chao, freely re-equippable | Permanent while equipped, movable | Colorless — draftable and usable regardless of a Chao's color identity. The answer to being color-screwed out of a pack. |
| **Habitat Card** | — (new; land-equivalent) | One of your Environment's 3 Habitat Slots (§6.9), not a Chao | Permanent once placed — can be grown, never swapped (§6.9) | Generates Fruit of its color at Tournament start and after every race; 3 of the same color combine into a stronger "2-star" Habitat; can be seeded (below) to diversify its output. Revived 2026-08-20 — see §6.9 for the full economy. |
| **Seed Card** | — (new) | One of a filled Habitat's Seed slots (§6.9), not a Chao | Permanent once planted — one-time plant, no replanting | Carries a single color. Planted into a Habitat, converts 1 unit of that Habitat's Fruit output to the Seed's color. Drafted from both the Draft Booster and the Environment Interlude booster. New 2026-08-20. |

**Content follow-up (not resolved in this pass):** a number of already-authored cards (`packages/sim/src/cards/data/*.ts`) have keywords written around Bout-only triggers (Warthog Tusks' on-hit Knockback+, Jackrabbit Reflex's "always acts first in round 1," Coral Turtle Shell's Bulwark, etc.). These aren't broken — they simply never fire under a race-only resolver, the same way any trigger that never matches just stays silent — but they should eventually be reflavored into Race-relevant effects or explicitly retired. Tracked in the roadmap.

### 4.3 Rarity

Four tiers, mapped onto the source material's E–S hidden-grade idea (research §3) but made *visible on the card* — the "hidden" part of the source system is instead expressed through **grade-roll variance within a rarity**, not through hiding the rarity itself:

| Rarity | Pack frequency (per 15-card pack) | Design space |
|---|---|---|
| Common | 10 | Simple, single-effect, define the baseline curve. Potion cards (renamed from "Regimen" 2026-08-20) are mostly here — Common Potions stay single-color, per §4.2's blending rule. |
| Uncommon | 3 | A Bond Card with one keyword, or a Trait/Item with a real decision attached. |
| Rare | 1–2 | Strong keyword, often bends a whole archetype, alignment-relevant. |
| Legendary | ~1 in 8 packs | Build-around, run-defining. Often a unique Technique or an Awakening-adjacent Bond Card. |

A card's **grade roll** (visible as a small range on the card, e.g. "Swim +12–18") reintroduces the source material's per-instance variance without hiding rarity itself.

**Resolved (2026-08-20):** this "15-card pack" frequency table describes the *Draft Booster* format from the original design, and it **does** still have a place in the Tournament: it runs once, at the very start of a Tournament, before Round 1 (§6.2's bracket diagram). The much smaller Environment Interlude booster (§6.3, 3 packs of 3 cards, no passing) is a separate, additional card-acquisition moment, not a replacement for this one.

### 4.4 Color identity, splash cost, and archetypes

A Chao's **color identity** is the union of colors among its currently-bonded cards. Bonding a card outside that identity costs extra Fruit (a "splash tax") — **funded again** now that Fruit, Habitats, and Seeds are revived (§6.9, decided 2026-08-20). Reviving the currency resolves *what pays it*; the exact tax curve (flat, or scaling with how far outside the identity a color is) is still a balance/tuning question for Phase 6, same as the rest of this system's numbers.

**Implemented 2026-08-20 (roadmap.md Phase 4):** the tax is now actually enforced, not just computed — `tournament/environment.ts`'s `bondCardWithSplashTax()` blocks a bond outright if the Environment's Fruit balance is short. **Decided at implementation time:** Fruit is tracked as a single pooled number, not per-color — the tax check is color-agnostic (any Fruit, colored or Wildcard, pays it), which is simpler than the per-color bookkeeping a "must match the off-color specifically" rule would need. This does mean a Seed's color (§6.9) is presently flavor/display only, not something any mechanic reads — see that section's own implementation note.

**Superseded 2026-08-21 (playtest-prep, per the user's direct request) — Fruit is now genuinely per-color, and every card has a real base cost, not just off-color ones.** The pooled-Fruit decision above is reversed: `Environment.fruit` is now a `FruitPool` (one number per `StatColor` plus a `colorless`/Wildcard bucket), and **every Bond Card, Potion Card, and Awakening now costs Fruit in its own color to use, regardless of color identity** — previously an on-color bond was completely free, which is exactly why there was no real cost-benefit tension to bonding an entire drafted pool onto a Chao in one sitting. Splash tax (the off-color surcharge above) still exists, unchanged in amount, but now draws specifically from the `colorless`/Wildcard bucket rather than "any Fruit" — a real use for Wildcard Fruit's flexibility, not just a description of it. Base costs are a first-draft placeholder tied to rarity (`FRUIT_COST_BY_RARITY`: common 1, uncommon 2, rare 3, legendary 4), same tuning status as everything else in this file — real per-creature costs (a cheap Otter vs. an expensive Dolphin, §3.2) are the still-pending 50-creature pass, not this change. Awakening costs 3x a single copy's base cost (fusing 3 at once) plus one splash-tax charge if off-color. This also means a Seed's color is no longer flavor-only — see §6.9's own implementation note for the real per-color conversion this unlocked.

Ten guild-style two-color archetypes still exist (five listed in §3.2, the remaining five in [`card-set-list.md`](card-set-list.md#guild-archetypes)). Draft **signals** still work as in MTG for both the pack-passing Draft Booster and, in a smaller way, the Environment Interlude booster (§4.5).

### 4.5 Draft format

Two different card-acquisition moments exist side by side (confirmed 2026-08-20 — both survive, neither replaces the other):

- **Draft Booster** (original format): open a 15-card pack, pick one, pass the rest to the next of 3–7 AI bot seats; repeat for 3 packs. Everything picked joins your pool. Runs **once per Tournament, before Round 1** (§6.2).
- **Environment Interlude Booster** (new, §6.3): 3 packs of 3 cards each, pick 1 per pack, no passing — a solo choice, not a shared draft. Much smaller stakes per pick. Runs **twice per Tournament** (after Round 1, after Round 2).

AI drafter bots (for the pack-passing Draft Booster) have simple archetype-affinity weights (see [`architecture.md`](../02-technical/architecture.md#bot-drafting) for the algorithm) so that packs feel like they're being fought over, not handed to you.

### 4.6 Duplicates & Awakening

Drafting **three copies of the same named Bond Card** (anywhere in your pool) lets you fuse them into that card's **Awakened** version the next time you bond it — a single stronger card, not three simultaneously equipped ones. This was originally framed as an autochess-board mechanic (porting the 3-copies-to-star-up idea), but it's really always been a card-level mechanic that doesn't need a board at all, so it survives the §2 cut unchanged in spirit.

**Tuning (decided 2026-08-20):** an Awakened card's stat grant is worth **3.5×** a single copy's average grant — deliberately *more* than three copies stacked additively would total (3.0×), not less. A single copy of Bramble Hare granting an average of 8 Stamina would Awaken into a card averaging 28 Stamina (8 × 3.5), not a diminishing-returns 20 (8 × 2.5). This was a deliberate choice to reward duplicate-heavy drafting as a real alternate strategy (mirroring Auto Chess/Underlords, where 3-starring is often *better* than fielding 3 separate weaker units) rather than a soft consolation prize.

**Implemented 2026-08-20 (roadmap.md Phase 5.5), alongside Bond Cards becoming one-time use.** `chao/bonding.ts`'s `awakenBondCard()` is exactly the formula above — deterministic (no grade roll at all, unlike a normal bond), producing one `BondedCard` history entry flagged `awakened`. **Resolved an ambiguity in this section's own "the next time you bond it" phrasing**: having 3 copies does not force-convert your next bond into an Awakening — the player gets an explicit choice, presented in the UI as a separate "Awaken (uses 3)" option alongside the normal per-copy "Bond" action, available whenever 3+ unused copies of a card exist.

**Real bug found and fixed 2026-08-21 — the user reported Awakening "doesn't work" after hitting this directly.** Once every card gained a Fruit cost (§4.2/§4.4, playtest-prep), Awakening's 3x cost was checked against the card's *exact* color only, with no fallback — and with only 3 Habitat slots for 5 colors (§6.9), at least 2 colors are *always* stuck at 0 native Fruit forever. Any 3-copy stack in one of those colors was therefore permanently un-Awaken-able, no matter how much Wildcard Fruit was banked — directly contradicting §6.9's own "a Wildcard Fruit spends as any color" rule, which splash tax already honored but the new base cost didn't. Fixed: colorless Fruit now covers a shortfall in the base cost too, for Awakening and every other paid action (bonding, Potions) alike — see §6.9's own note on `chargeFruit`.

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

**Race timing, added 2026-08-20 (roadmap.md Phase 5.5).** Every Leg now also has a **time**, in seconds to the tenth, shown on a real per-race Results screen (not just log narration) — replacing "check the scrolling log to see how it went" with an actual ranked table. This is a *display-layer* computation only: it doesn't change pass/fail, DNF, elimination, scoring, or ranking, all of which are still exactly the stat-check/Stamina mechanics above. Calibrated so a brand-new, near-zero-stat Gen-1 baby averages roughly **9.0 seconds per Leg** regardless of course length (a real calibration target, not made up per-race) — better stats make a Leg faster, a fumbled Leg costs extra time, harder Legs take longer. Exact constants are a first-draft placeholder, same tuning status as the difficulty/variance numbers above.

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

#### Breeding: stat inheritance (decided 2026-08-20 — v1, simplified)

The earlier proposal here (a randomized per-stat blend weight plus a random 10–20% strength factor) is **replaced** with a flat, deterministic formula for now:

```
for each stat:
  baby.stat = round(0.10 * parentA.stat + 0.10 * parentB.stat)
```

That's it — no randomness, no per-stat lean. Each parent contributes a flat 10% of their own value; since both parents are usually similar magnitude, this lands the baby at roughly 20% of a single parent's strength (or 10% of their *combined* total), comfortably inside the originally-requested "10–20% as strong as parents" range without needing two separate random rolls to get there. This deliberately drops the "not 50/50" per-stat-lean texture from the earlier proposal — that's a reasonable thing to reintroduce in a future balance pass, not lost, just not worth the complexity for a first working version.

#### Breeding: cosmetic and skill inheritance — **deferred to a future "Next Up" discussion**

Not decided yet, on purpose. For v1, a baby simply starts as a fresh Chao with **empty Bond Slots, no Traits, no Items** — a blank slate — with only its stats pre-seeded per the formula above. It does *not* yet get "a slightly modified base Chao" look, a partial inherited keyword, or the specialization-creeps-in-over-many-Tournaments curve the user originally described — all of that is real, good design that's being set aside for a dedicated future session rather than rushed alongside the simpler stat decision. Alignment is unaffected by this deferral: with no bonded cards at all, a v1 baby is simply Neutral by construction (§3.3), regardless of parentage — exactly the fallback case the original proposal already called out.

**Implemented 2026-08-20 (roadmap.md Phase 5).** `tournament/breeding.ts`'s `computeBreedingPools`/`breedChao`/`prepareNextTournament` are exactly the above, with one decision made at implementation time that the docs hadn't pinned down: **if the player is one of the 3 finalists and breeds, their own baby becomes the Chao they actually play as in the next Tournament** — inherited stats, then a fresh Draft Booster and normal bonding on top of that baseline — rather than the player always starting fresh regardless of breeding outcome. The other 2 finalists' babies still become NPC lineage entrants either way. See §6.5's implementation note for how this fits the next-Tournament roster.

### 6.5 Tournament-to-tournament progression

**Resolved 2026-08-20, and much simpler than the earlier "persistent pool" framing suggested.** There is no abstract pool for now — just direct lineage carryover, literal Chao (not stat templates), tracked with real parent/child links:

- Each of the 3 Final Race finalists who breeds contributes **exactly one baby** to the next Tournament's 24 slots — always 3 lineage babies, always 21 freshly, purely randomly generated entrants. No draw rate to tune, no pool size to cap, because there's no pool: it's a fixed 3-and-21 split every single time.
- **Worked example** (the user's own, 2026-08-20): Tournament 1 is the player + 23 random Gen-1 entrants. Say the player wins (1st place) and breeds with whoever they picked — say an entrant who placed 4th overall (a perfectly legal pick; 1st place's only exclusions are the other two finalists, GDD §6.4). 2nd place and 3rd place *also* each bred with someone from their own eligible pool. Tournament 2 (Gen 2) now has: the player's own baby (inheriting a flat 10% of two above-average parents' stats, per §6.4 — stronger than a fresh baseline Chao, nowhere near parent strength), plus 2nd place's baby, plus 3rd place's baby — three known lineage entrants — and 21 freshly random Gen-2 entrants filling the rest. If the player places top 3 again in Tournament 2, the same pattern repeats into Tournament 3: their own new baby, plus the babies of whichever *other* two Tournament-2 finalists bred — chao whose **parents** the player has direct race history against, even though the babies themselves are new.
- **Scope (resolved):** local to the player's own save, for now. This will want to be multiplayer/shared eventually (a natural bridge to the async-ghost idea in §7), but that's explicitly not soon.
- **Documented future enhancement, not built now:** pulling from the broader pool of *eliminated* (non-finalist) Chao to help generate Gen 2 through Gen X entrants — a genuine "rolling lineage" where losers' bloodlines can also resurface, not just the 3 finalists' — is good design, deliberately deferred rather than built alongside this simpler v1.

See §6.8 for how a player actually inspects this lineage in play — **not built yet** (deliberately deferred, roadmap.md Phase 5), see that section's own implementation note.

**Implemented 2026-08-20 (roadmap.md Phase 5).** `prepareNextTournament` does exactly the 3-babies-plus-21-fresh split above, drawing all 24 next-Tournament names from one shared shuffle so nothing collides. Verified live: a Gen-2 Chao correctly carried a lineage name (not "Your Chao") with non-zero inherited stats the moment its Draft Booster completed, confirming the player was genuinely playing as their own baby (§6.4's implementation note) rather than a blank Chao.

### 6.6 Scoring & Elimination

- **Elimination is final.** If the player's Chao is eliminated from the bracket and isn't chosen by any of the three Final Race finalists as a breeding partner, the run ends — full stop, no soft continuation, no fresh Chao handed to the player. This was a deliberate choice (confirmed 2026-08-20), consistent with pillar #4's "should genuinely end."
- **Score (decided 2026-08-20):** each race awards points by placement — **1st place scores 6, then 1 fewer per place behind** (2nd: 5, 3rd: 4, 4th: 3, 5th: 2, 6th: 1), summed across every race the player's Chao runs over the whole Tournament. A DNF is treated as last place for that race's field (lowest score available, not zero — a DNF still isn't worse than showing up dead last, it just doesn't out-rank anyone). **Technical prerequisite this exposes:** scoring every place, not just picking out the last-place eliminee, means the Race resolver needs to rank *all* racers in a group against each other, not just resolve the player's one Chao in isolation — group-stage elimination already implicitly needed this (you can't identify "last place" without ranking everyone), so this doesn't add new scope, it just makes explicit that Phase 3's bracket work needs full-field ranking, not single-Chao pass/fail.
- The player can inspect their Chao at any time — both its stats and its current visual/cosmetic state.

**Implementation-time clarification (2026-08-20, roadmap.md Phase 5):** the "and isn't chosen by any of the three Final Race finalists as a breeding partner" clause above reads, taken literally, as a possible rescue mechanic — an early-eliminated Chao surviving into the next Tournament if some finalist later happens to pick them as a partner. **Decided against this**: elimination is instantly and unconditionally final the moment it happens, with no dependency on later breeding picks. Reaching the Final Race is the only path that ever leads to a breeding pick, since the group-stage elimination logic (already shipped in Phase 3, unchanged here) ends the run outright before the Final Race is ever reached. The quoted clause is being left as-written rather than edited, since it doesn't materially conflict with play in practice — every entrant who ever gets *chosen* as a breeding partner is, by construction, chosen from among entrants still tracked in that Tournament's roster, and the player either reaches the Final Race and breeds, or doesn't and the run is over; there's no third case this clause was actually needed to resolve.

### 6.7 Entrant generation & scouting

**Decided 2026-08-20:** start cheap, write up the richer version for later rather than building it now.

**Entrant generation, v1 (build this first):** the 23 non-player entrants get a procedural stat-and-cosmetic roll — randomized but plausible stat totals (no actual draft, no bonding decisions), fast to generate and simulate 23-at-a-time every Tournament.

**Entrant generation, v2 (written up now, deferred implementation):** each non-player entrant instead runs its own scaled-down version of the real pipeline —

1. Run the entrant through the same bot-drafting heuristic already built for the player's Draft Booster (`packages/sim/src/draft/bots.ts`) — same pack, same 3-round/15-card structure, just no human seat.
2. **New requirement this needs that doesn't exist yet:** a *bot bonding heuristic* — today's bots only know how to draft, nothing decides how a bot bonds its drafted pool onto its Chao. Proposed approach: greedily bond whichever Bond Card in the entrant's pool scores highest by the same `rawPower`-style heuristic already used for drafting (`packages/sim/src/draft/bots.ts`'s `rawPower`), respecting whatever color affinity the entrant's draft already committed to — bonding cumulative and unbounded (§3.5, corrected 2026-08-20), so this is "bond your best cards in some order," not "fill N slots."
3. Optionally run the entrant through its own Environment Interlude booster picks between rounds, same as the player.

This is meaningfully more expensive (23× a mini-draft-plus-bonding pass, potentially repeated at each Interlude) but produces genuinely textured rivals — each one *made choices*, addressing the design risk in §8. Revisit once the v1 loop is proven and playtesting shows the bracket feels hollow.

**Scouting (v1, build this now alongside entrant generation):** even though only the player's own bracket path is actively played (§6.2), **any** entrant — including ones the player hasn't raced yet — should be inspectable via a fuzzy, icon-based "scouting read" per Leg-relevant stat (Swim, Fly, Run, Power, Climb, Jump, Stamina): something like a 1–5 icon rating per stat, bucketed from the entrant's real numbers rather than showing exact figures, so a player can look at a rival and think "I bet that one's a strong swimmer" without being handed a spreadsheet. This is a lightweight derived-data function (`computeScoutingRead(chao) → Record<Stat, 1|2|3|4|5>` or similar), not a new simulation system.

**Full bracket visibility (v2, written up now, deferred):** letting the player actually *watch* (not just scout) other groups' races — full event-log playback for off-path races, not just a final placement — is a documented future upgrade once the core loop and scouting are both proven out.

### 6.8 Chao inspection & lineage (new, 2026-08-20)

Beyond the fuzzy scouting read (§6.7), any entrant can be opened into a full **inspection screen**:

- **Name, Height, Weight** — new cosmetic/flavor attributes, not previously in the design. Proposed default: rolled at creation within a reasonable range, lightly correlated with dominant stat color for flavor (e.g., a Power/Stamina-heavy Chao trends heavier and stockier, a Fly-heavy one trends lighter) — exact formula is a low-priority placeholder, not worth a real design pass yet. These give the player something concrete to reason about an opponent's *build* even before (or instead of) the deferred full cosmetic-inheritance system (§6.4) exists.
- **Record** — the entrant's own tournament results (placements, wins).
- **"Raced this Chao" indicator** — appears if the player has personally raced this exact entrant before (realistically: earlier in the *same* bracket, since an individual Chao competes in one Tournament and then either breeds or is done — see §6.5). Clicking it opens the player's head-to-head history against this specific Chao.
- **"Raced its predecessors" indicator** — appears if this entrant's parent(s) are Chao the player has previously raced, in an earlier Tournament (a lineage baby carries this recognizability forward even though the baby itself is new). Clicking it opens the player's history against the lineage, not just the individual.
- **Lineage tab** — the entrant's full ancestry chain, each ancestor shown with its own overall record and Height/Weight (or a picture, once art exists) to gauge build at a glance.

The point of all of this, per the user: it gives the player genuine information to refine strategy and improve their odds — not just flavor. This is a real feature to design and build (data model: each Chao needs a stable id, parent-A/parent-B links, and a persisted record; the player's save needs a per-Chao-id and per-lineage head-to-head history), not implemented yet — tracked in roadmap.md.

**Explicitly deferred at Phase 5 (2026-08-20), decided rather than merely delayed:** breeding, next-Tournament generation, and playing as your own baby (§6.4/§6.5) are all real and implemented; this section's inspection screen is not, since it needs the parent-id graph and persisted history above, neither of which exist yet, and wasn't required by Phase 5's own completion bar. Same treatment as Phase 4's deferred race-reward hooks — a deliberate scope cut, not an oversight.

### 6.9 The Environment: Habitats, Fruit, and Seeds (revived 2026-08-20)

Habitat Cards and the Fruit economy were cut in the original Tournament pivot (§2) for lack of a funding purpose once the multi-Chao board went away. Brought back after further discussion — scoped to a single Chao's Environment, with real new mechanics beyond what the pre-pivot design had.

**Habitat slots.** The Environment has exactly **3 Habitat Slots**. A filled slot generates Fruit of that Habitat's color at two trigger points: Tournament start, and after every race. Base rate: **2 Fruit** per trigger.

**Seeds.** A new card type (§4.2), draftable from both the big Draft Booster and the small Environment Interlude booster. Planting a Seed of color X into a filled Habitat converts **1 unit** of that Habitat's output to color X. A base (un-combined) Habitat has room for **1 planted Seed** — e.g. a Green Habitat with a Black Seed planted produces 1 Green + 1 Black Fruit per trigger instead of 2 Green. Seeds are a **one-time plant** — no replanting, no swapping the color once placed.

**Combining — Habitat "2-star" fusion (mirrors Awakening, §4.6).** Drafting 3 Habitat Cards of the same color lets you combine them into one upgraded Habitat: **+1 base Fruit** (3 instead of 2) and **+1 Seed slot** (2 instead of 1). A fully-seeded 2-star Habitat (e.g. a 2-star Green with a Blue Seed and a Red Seed planted) produces 1 Green + 1 Blue + 1 Red — by construction, a Habitat always retains at least 1 unit of its native color no matter how many Seeds are planted, since Seeds can never convert *every* unit. (A further 3-star tier is unaddressed — not designed, not promised either way.)

**Placement locks in; growth doesn't.** Once the initial Draft Booster completes, you choose a color (or Open Fort) freely for each of your 3 slots — **superseded 2026-08-21, see this section's own implementation note: this used to mean placing whichever Habitat Cards the draft randomly handed you, not a free choice** — and that choice is **permanent** once you continue to the Tournament. A placed Habitat can be grown (combined to 2-star, seeded) but never swapped for a different Habitat. This is a deliberate asymmetry with Bond Cards, which never lock anything in at all — bonding is cumulative and unbounded, so there's always room to add more (§3.5, corrected 2026-08-20 — this line originally described the old, wrong "4 exclusive slots, overwritable" model) — Habitat commitment is meant to be a real, weighty decision, not a flexible one, and that weight is intentional, not a gap to be embarrassed about. A future item or event that allows re-basing a locked Habitat is a reasonable idea for later, not built now.

**"Open Fort" — deliberately leaving a slot empty.** Filling every slot isn't mandatory, and isn't always correct. An empty slot produces **1 colorless Wildcard Fruit** per trigger (the same Tournament-start/after-every-race cadence as a filled Habitat, at half the volume) instead of 2 same-colored Fruit — but a Wildcard Fruit spends as *any* color. This rewards a real, deliberately-encouraged strategic archetype: hedge your Habitat colors early, see how your actual Bond-card draft leans, and either commit late or simply run thin-but-flexible for the whole Tournament. Trading raw volume for perfect flexibility is a genuine build, not a consolation prize for a bad draft. *(Interpretation flagged: this assumes the Wildcard Fruit recurs every trigger point like a filled Habitat would, just at half rate — not a single one-time reward. Correct this if that's not the intent.)*

**Race rewards tied into this economy:**

- **Fastest Leg** (best completion of a given Leg among the field): a random reward — a Fruit of a random color, or (added 2026-08-20) a chance at a Seed instead — so a Chao doing *well* still gets occasional access to Seed-planting, not just a losing streak.
- **Back-to-back last place** (two Legs in a row finishing last): a Fruit of a random color **and** a Seed — an explicit comeback tool, handing out flexibility along with currency, not just currency.
- **Future idea, not built now:** a bonus for winning by a large margin, specifically to reward and incentivize mono-color/heavily-specialized builds — a counterweight to the diversification pull Seeds create.

**Future idea, not built now — TODO to consider:** spending a Wildcard Fruit specifically on a colorless Item Card (§4.2) at a **2-for-1 trade value** (1 Wildcard Fruit counts as 2 regular Fruit toward a colorless card's cost) — reinforcing that Items and Wildcard Fruit are both "the flexible option," and giving Wildcard Fruit a reason to be spent deliberately rather than just being strictly-worse-but-flexible Fruit.

Splash tax (§4.4) is funded by this economy again. Exact numbers (base Fruit rates, tax curve, Seed drop odds) are all real balance/tuning work for Phase 6 — this section resolves the *mechanism*, not the final tuning.

**Implemented 2026-08-20 (roadmap.md Phase 4).** All of the above is real code (`packages/sim/src/tournament/environment.ts`, `interlude.ts`), with two implementation-time decisions worth recording:

- **Fruit is a single pooled number, not tracked per-color.** §4.4's splash tax was decided to be color-agnostic (pay from any Fruit, colored or Wildcard), which means a Seed's `color` and a Habitat's `fixedColors` are presently **flavor and display only** — they change what a slot's UI shows itself producing (matching this section's own worked examples), but not the actual spendable total, which only Habitat star level and Open Fort status affect. A future mechanic that reads Fruit by color specifically would need to re-introduce per-color tracking; nothing does today.
- **The Interlude Booster draws from a flat pool across all rarities**, not a rarity-slotted structure like the main Draft Booster — this section and §4.5 don't specify a curve for the smaller format, so this is an explicit placeholder, not a considered choice.
- **Race rewards (Fastest Leg, back-to-back last place) are deliberately deferred**, not part of this phase — they need genuinely new per-Leg cross-racer tracking that didn't exist anywhere in the sim, and this phase's own "done" bar didn't require them. See roadmap.md Phase 4.

**Revised 2026-08-21 (playtest-prep, per the user's direct request) — Fruit is genuinely per-color now, and the Tournament-start trigger is a special one-off, not the same rate as every other trigger.** Concretely:

- **`triggerFruitGain` now writes into a per-color bucket**, not a single pooled number — a filled slot's output lands in its own color, an Open Fort slot's output lands in `colorless`. Rate is unchanged (2 Fruit/trigger per 1-star slot, 3 for 2-star, 1 Wildcard for Open Fort).
- **A planted Seed now genuinely converts 1 unit of a slot's output to the Seed's own color** — no longer flavor/display only (§4.4's original implementation note). This falls out for free from `seedSlots` always equalling `(total units − 1)`: capping conversions at `seedSlots` (already enforced by `canPlantSeed`) automatically leaves at least 1 native-color unit untouched, exactly the invariant this section's own text already promised.
- **New `triggerInitialFruitGain`, used once, only at the "continue to Tournament" transition** (replacing the plain `triggerFruitGain` call that used to fire there): doubles the normal per-slot yield and adds a flat +4 `colorless` bonus on top — a real opening budget, requested directly by the user once every card started costing Fruit to use (§4.4). The recurring after-every-race trigger is untouched, deliberately — the user was explicit that only the initial grant should double.
- **Every Bond/Potion Card and Awakening now costs Fruit in its own color** (§4.4) — `bondCardWithSplashTax`, the new `consumePotionWithCost`, and the new `awakenBondCardWithCost` all charge `FRUIT_COST_BY_RARITY[card.rarity]` from the card's own color bucket (3x that for Awakening), in addition to whatever splash tax an off-color card still owes from the `colorless` bucket.

**Two more real bugs found and fixed, 2026-08-21, both hit directly by the user in the same playtest:**

- **Habitat colors are now a genuinely free choice, not a random draw.** The Draft Booster used to hand the player exactly 3 *random* bonus Habitat cards (one per pack, `draft/pool.ts`'s `drawBonusHabitat`) as the *only* way to get a color into a slot — the user ended up "stuck with 1 white and 2 black" with zero say in it, flatly contradicting this section's own "an open selection" framing. Fixed: a new `setHabitatChoice()` lets the player freely pick any color (or Open Fort) for each of the 3 slots directly, no card or draft dependency, re-pickable until "Continue to Tournament" locks it in. `drawBonusHabitat` itself is unchanged and still fires — a bonus drafted Habitat Card is now purely optional upside, usable to fill a slot left at Open Fort or grow an already-chosen matching-color slot to 2-star (unchanged `placeHabitatCard` logic).
- **Colorless Fruit now covers a shortfall in the base cost, not just splash tax** (see §4.6's Awakening note above for the full bug this caused) — `chargeFruit()` draws down the card's own color first, then colorless for whatever's left, for both the base cost *and* tax. This was the direct cause of "Awakening doesn't work": with only 3 slots for 5 colors, a card in one of the 2 always-unfunded colors was permanently unusable under the old same-color-only rule, no matter how much Wildcard Fruit was banked — now fixed for bonding, Awakening, and Potions alike.

## 7. Multiplayer / async note

Bot-generated Tournament entrants (§6.5) are the natural home for the "async ghost" idea from the original design: instead of (or alongside) procedurally generated opponents, some of the 21 non-baby entrant slots each Tournament could be populated by real other players' saved Chao lineages, snapshotted server-side. Because Race resolution is a pure function of a Chao's stats/cards + a seed, this requires no new resolver logic — only a new source for where an entrant's `Chao` data comes from. Still explicitly post-MVP; not required for a single-player Tournament loop to work.

## 8. Design risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| A single bad Race can end the entire run (§6.6) — this is now *confirmed* intentional, not a placeholder, but it's still a high-variance structure. | Roguelites can get away with harsh elimination if losing still *feels* meaningful (a story, a score) — if it just feels like bad luck with no narrative or skill signal, it reads as unfair rather than tense. | Lean hard on the event-log narration (already built, GDD §5.1/architecture.md §5.1) so *why* a Chao lost is always legible, and make sure scoring (§6.6) rewards how far a run got, not just win/loss, so an early elimination still has something to show for it. |
| The 23 non-player Tournament entrants start with a cheap procedural stat roll (§6.7, v1) — a wall of stat blocks with no visible drafting/personality reads very differently from 23 other "chao that made choices," which is exactly why v2 (a real mini-draft + bonding pass per entrant) exists as a written-up upgrade rather than being dropped. | The whole design's identity is built on cards + drafting mattering — if opponents are just numbers, half the game's texture is invisible to the player. | The scouting-icon feature (§6.7) is the interim mitigation — even a procedurally-rolled entrant reads as "a strong swimmer" rather than a bare number. Upgrade to v2 generation once the core loop is proven and playtesting shows the bracket feels hollow. |
| Breeding's three-tier exclusion pool (1st/2nd/3rd place have progressively narrower eligible partners, §6.4) is intricate — a player choosing a breeding partner needs to understand *why* certain chao are greyed out. | Confusing exclusion rules undermine what should be a triumphant, legible moment (you won, now pick your favorite rival to carry on your line). | UI should show *why* a given entrant is ineligible (e.g., "made it to the Final 6 — 2nd place can't pick them"), not just grey them out silently. |
| Several already-authored cards (§4.2) have keywords written for a Bout that no longer exists — they're inert, not broken, but a player drafting them gets a dead-feeling card. | Undermines pillar #3 (rarity/power should be *discovered*, not a trap) if a drafted Rare or Legendary quietly does nothing. | Content follow-up pass (roadmap.md) to reflavor Bout-only keywords into Race-relevant effects before this card set is treated as ship-ready, not just left as a known gap indefinitely. |
| The revived Fruit/Habitat/Seed economy (§6.9) is a genuinely deep system — 3 Habitat Slots, 2-star combining, Seeds, Wildcard Fruit, and per-Leg reward hooks all interacting at once. Real risk of the same "too many resource layers" problem the original autochess-board cut was meant to solve. | The user explicitly flagged this ("we will have to balance and tune this") — it's a known tradeoff being made deliberately for the fun it adds, not an oversight. | Build it as specified, but watch closely in playtesting for whether a new player can form a mental model of it quickly; the "Open Fort" strategy in particular needs to read as a real, viable choice and not just a trap for players who didn't understand the system. |
| Habitat placement being **permanent** (§6.9) is a much harsher commitment than anything else in the design (Bond Cards, Items, even Breeding partner choice all have some flexibility or are one-shot decisions with limited downside) — a bad early placement has no in-system fix for the rest of the Tournament. | A single irreversible decision this early, with this much downstream weight, risks feeling punishing rather than strategic if a player doesn't yet understand the stakes when they make it. | The user already has a mitigation in mind (a future item/event to re-base a locked Habitat) — just not built now. Worth prioritizing that sooner rather than later if playtesting shows this specific lock-in feels bad rather than tense. |
