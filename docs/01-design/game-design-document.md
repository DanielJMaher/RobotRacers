# Game Design Document

*Working title: **Chao Draft**. See [`README.md`](../../README.md) for the trademark note. This document assumes you've read [`chao-garden-research.md`](../00-research/chao-garden-research.md) — it's referenced throughout as "the source material."*

## 0. Elevator pitch

Raise a creature across one bounded lifetime by drafting cards instead of feeding animals. Build your stable the way Slay the Spire builds a deck — node by node, choice by choice, one run at a time. Manage that stable the way you'd manage an autochess board — economy, levels, synergy breakpoints, duplicates. Then let your creatures do what they always did in the source game: fight and race on their own, because you were never the one in the water.

## 1. Design pillars

These are the four constraints every system below has to satisfy. Any feature that violates one of these needs a specific justification in its own section.

1. **You coach, you don't pilot.** The source material already auto-resolves Races and Karate Bouts from stats and trained behavior (research §2 & §7). No system in this game should ask the player to directly control a Chao mid-event. All player agency happens *before* the event: what you drafted, what you bonded, what you loaded.
2. **Two axes, not one.** The source material's alignment (Hero/Dark/Neutral) and stat-color dominance are independent (research §5). The card system must preserve two independent axes of build identity — not collapse everything into "which color are you."
3. **The rarity layer should feel discovered, not stated.** The source material hides stat grades behind visible feeding choices (research §3). Card rarity should read the same way in play: you learn a card is powerful by what it does on the field, and pack odds should reward, not spoil, that discovery.
4. **The run is a lifetime, and lifetimes should want to end well.** The source material already treats a Chao's life as a bounded arc with partial carryover (research §9). A run should have a natural, in-fiction reason to end — not just "you lost" — and finishing it well should matter more than finishing it fast.

## 2. Inspiration-to-system map

| Source Chao Garden system | MTG Draft idea borrowed | Slay the Spire idea borrowed | Autochess idea borrowed | Becomes, in this design |
|---|---|---|---|---|
| Feeding animals (stat + body + behavior) | Booster draft: pick cards, pass packs, build a limited pool | Card rewards define your build over a run | — | **Bond Cards**, drafted and fused onto a Chao (§4.2) |
| Chaos Drives (pure stat, no body change) | Common "filler" stat cards that round out a curve | — | — | **Regimen Cards** (§4.2) |
| Fruit / one-off buffs | Instants as combat tricks | Combat-turn energy economy | — | **Technique Cards** played mid-Race/Bout (§4.2, §6) |
| Animal-mimicked behavior | Keyword abilities on creatures | — | — | Keywords granted by Bond Cards (§4.2) |
| Alignment slider (Hero/Dark/Neutral) | Color pie's order/chaos moral coding | — | — | **Alignment** derived from net color balance of bonded cards (§3.3) |
| Stat-color dominance → 2nd evolution | Color identity & two-color archetypes (guilds) | — | — | **Species/Archetype identity**, color pairs as build-arounds (§4.4) |
| Hidden stat grades (E–S) | Card rarity (common → mythic) | — | — | **Card rarity tiers** (§4.3) |
| Multiple animals of the same type reinforcing a look | — | — | Buying 3 copies of a unit to star it up | **Awakening**: 3 copies of a Bond Card fuse into a stronger version (§5.4) |
| Raising one Chao at a time | — | — | Managing a full board of units | **Garden Board**: a roster of 2–6 Chao (§5.1) |
| — | — | — | Gold economy, interest, shop rerolls | **Fruit economy**, shop rerolls at Draft nodes (§5.2) |
| — | — | — | Alliance/trait breakpoints (2/4/6 units) | **Species Tag synergy breakpoints** (§5.5) |
| — | — | — | Win/loss streak bonuses | Race/Bout streak bonuses (§5.6) |
| Chao Karate auto-resolution | — | — | Auto-battler combat resolution | **Karate Bout** resolution algorithm (§6.1) |
| Chao Race legs, forks, obstacles | — | Turn-based encounters with player-chosen cards | — | **Race Legs**, Technique cards spent per leg (§6.2) |
| Single continuous Garden save | — | Bounded runs, branching map, relics | — | **Generation** = one run; map nodes; **Charms** (§7) |
| Lifespan → reincarnation @ 10% stats | — | Meta-progression between runs | — | **Reincarnation** as the run-to-run carry-over (§7.5) |
| Chao Kindergarten (passive training node) | — | "?" event nodes | — | **Kindergarten Event** map node (§7.3) |
| Black Market Chao | Draft singles / sideboard | Shop node, card removal service | Shop reroll for gold | **Black Market** node (§7.3) |
| Breeding (2-parent inheritance) | — | — | — | Kept largely as-is as a late-run/NG+ system; see §8 |

## 3. The Chao

### 3.1 Stats

Same five physical stats as the source material, unchanged in name and function, because they already do exactly what's needed (research §1 — Swim doubles as defense, Run as attack speed, Power as damage, which is already an autobattler stat block):

| Stat | Role in a Race Leg | Role in a Karate Bout |
|---|---|---|
| Swim | Resolves Water legs | Defense (damage reduction) |
| Fly | Resolves Air/shortcut legs | Evasion (dodge chance) — **new**, see §3.4 |
| Run | Resolves overall pace / Sprint legs | Attack frequency |
| Power | Resolves Obstacle legs (pushing, climbing) | Damage dealt + knockback |
| Stamina | Determines whether a Chao finishes at all (DNF threshold) | Hit points |

Mind and Luck are kept as minor modifiers (Mind affects Technique success chance and Kindergarten-event outcomes; Luck affects crit-style variance) rather than headline stats — they were minor in the source material and stay minor here.

### 3.2 The color pie

Every stat is assigned a color, MTG-style. This is the load-bearing translation of the whole design: **a Bond/Regimen/Technique card's color tells you which stat it primarily raises, and its color *identity* tells you which archetype it belongs to.**

| Stat | Color | Identity (Slay-the-Spire-style flavor of "what this archetype does") |
|---|---|---|
| Stamina | 🟢 Green | Endurance, growth, sustain — the "ramp" color. Big-picture, outlasts. |
| Run | 🔴 Red | Speed, aggression, tempo — extra attacks, haste, low-cost cards. |
| Power | ⚫ Black | Force, sacrifice, high-damage single effects. |
| Fly | 🔵 Blue | Evasion, tempo, card selection — "see more, dodge more." |
| Swim | ⚪ White | Defense, protection, order — damage prevention and stabilizing. |

Two-color archetypes exist exactly like MTG guilds and work as draft signposts (a full list is in [`card-set-list.md`](card-set-list.md)):

| Pair | Archetype name | Plays like |
|---|---|---|
| 🔴🟢 Run/Stamina | **Sprinter** | Aggro racer — wins Sprint legs early, needs Stamina to not gas out. |
| ⚪🔵 Swim/Fly | **Glider** | Tempo/evasion — takes the shortcut fork, avoids Karate damage entirely. |
| ⚫🔴 Power/Run | **Brawler** | Karate specialist — fast, hard-hitting, low defense. |
| 🟢⚫ Stamina/Power | **Bruiser** | Tanky Karate build — outlasts, hits hard late. |
| ⚪🟢 Swim/Stamina | **Warden** | Defensive control — DNF-proof, wins by not losing. |

All 5 colors pair into 10 unique two-color archetypes total. The remaining 5 (Sentinel, Vanguard, Trickster, Skirmisher, Naturalist) are listed with the rest in [`card-set-list.md`](card-set-list.md#guild-archetypes) alongside example cards, so this file stays focused on the framework rather than the content.

### 3.3 Alignment: a second, independent axis

Per research §5, alignment must stay orthogonal to stat archetype. It's derived automatically from the **net color balance of every card currently bonded/attached to a Chao** — no separate mechanic to track:

- White + Green cards pull toward **Hero** (order, protection, growth).
- Black + Red cards pull toward **Dark** (force, sacrifice, aggression).
- Blue cards are alignment-neutral (intellect isn't moral) and act as a damper — a Blue-heavy Chao resists drifting either way even if it also holds a couple of White or Black cards.

This is recomputed continuously (not locked at evolution) so late-game re-bonding can genuinely swing a Chao's alignment, same as the source material lets late feeding keep nudging the slider.

### 3.4 Evolution

Two evolutions per Generation, matching the source material's two-cocoon structure:

- **First Evolution** (early-run, roughly Act 1 boss): locks in **Hero / Dark / Neutral** form based on the alignment axis at that moment. Cosmetic + a small passive (Hero: +Stamina regen between nodes; Dark: +Fruit from wins; Neutral: cheaper off-color splash cost — see §4.4).
- **Second Evolution** (Act 2 boss): locks in the **dominant stat color** as a mechanical archetype, exactly as the source material's second evolution reads color-dominance (research §5). This is also where the **Fly** stat's new Evasion role (§3.1) is granted as a body change — wings aren't just cosmetic here, a Fly-dominant second evolution is the only way to access dodge chance in Karate Bouts, mirroring how the source material only lets a Chao fly in the garden after hitting the Fly threshold.

Post-second-evolution, continued bonding still visually mutates the Chao (new Bond Cards override old ones in the same slot — see §4.2), matching the source material's "keeps morphing based on what you feed it after evolving" behavior (research §5).

### 3.5 Body / Bond slots

Four slots, standing in for the source material's head/back/hand/foot animal-part locations:

| Slot | Typical Bond Card flavor |
|---|---|
| Head | Sensory/perception keywords (evasion, card selection) |
| Back | Wings/fins/shell — Fly and Swim-leaning keywords |
| Hands | Power/Run-leaning keywords (attack, grip, climb) |
| Feet | Run/Stamina-leaning keywords (speed, endurance) |

Bonding a new Bond Card into an occupied slot **replaces** the old one (its stat/keyword/cosmetic are lost) — this preserves the source material's real tension around re-feeding a different animal type over an already-shaped Chao, and it's the main sink for "I drafted a better version of this slot, do I commit to the swap" decisions.

### 3.6 Lifespan & reincarnation

Kept essentially 1:1 from research §9, because it's the mechanic that makes the Slay-the-Spire run structure fit at all (see §7.5):

- A Generation has a fixed **Age budget** (map length, not real-world time — no need to replicate the "3 hours per Chao-year" real-time pacing).
- Ending the run — win or lose the final Boss node — triggers the cocoon check.
- **Happiness** (tracked from how a Chao is treated at Rest Garden nodes and whether it DNFs races) above threshold → **pink cocoon**: reincarnate, carry 10% of final stats and one drafted card "recipe" (unlocked permanently for future starting pools) into the next Generation.
- Below threshold → **white cocoon**: the Generation ends clean, nothing carries forward except meta-unlocks earned along the way (see §7.6).

## 4. The card system

### 4.1 Why cards replace feeding, mechanically

Feeding in the source material is really three separable effects bundled into one action (stat, body, behavior — research §2). Splitting them into distinct card types is what makes a *draft* meaningful: in the source game there's no scarcity or opportunity cost to feeding (go find another rabbit), so there's no real choice. A draft imposes scarcity — you can't have every card, packs are shared with other drafters, and passing a card is a real cost. That scarcity is the entire reason to borrow MTG's draft format rather than just reskinning "buy stats in a shop."

### 4.2 Card types

| Type | Source-material equivalent | Attaches to | Lifespan | Effect |
|---|---|---|---|---|
| **Bond Card** | Animal | A Chao, in one of 4 Bond Slots (§3.5) | Permanent until overwritten | Stat grant (with a rarity-scaled roll toward the card's grade ceiling — see §4.3) + cosmetic body mutation + a passive keyword. Carries 1–2 **Species Tags** (Rabbit, Bird, Fish, Dragon, Insect, Beast, …) for synergy (§5.5). |
| **Regimen Card** | Chaos Drive | Consumed, no slot | One-time | Flat stat grant, no cosmetic change, no keyword. The "pure numbers" card — always safe to take late in a pack when nothing else fits. |
| **Technique Card** | Fruit / trained technique | Held in a Technique hand, played during a Race Leg or Karate round | Consumed on use (Legendary techniques are Exile-on-use — once per Generation) | A combat trick: costs Energy (§6.3), resolves an immediate effect scoped to the current Leg/round (e.g. "auto-win the Power check on this Obstacle leg," "this round, Swim is treated as 999 for defense"). |
| **Trait Card** | Behavior mimicry | A Chao, max 2 concurrent, not slot-limited | Permanent | A passive triggered ability, not a stat stick (e.g. "whenever this Chao wins a Leg, gain 1 Fruit"). |
| **Item Card** | Toys/emblems | A Chao, freely re-equippable each Garden phase | Permanent while equipped, movable | Colorless — draftable and usable regardless of a Chao's color identity. The answer to being color-screwed out of a pack. |
| **Habitat Card** | — (new; land-equivalent) | Your **Garden Board**, not a Chao | Permanent | Passive Fruit income each round, and reduces splash cost (§4.4) for its color. Functions like a dual land: fixing, not power. |

### 4.3 Rarity

Four tiers, mapped onto the source material's E–S hidden-grade idea (research §3) but made *visible on the card* — the "hidden" part of the source system is instead expressed through **grade-roll variance within a rarity**, not through hiding the rarity itself (pillar #3: discovered through play, not spoiled at the pack level, but also not opaque to the point of being unreadable):

| Rarity | Pack frequency (per 15-card pack) | Design space |
|---|---|---|
| Common | 10 | Simple, single-effect, define the baseline curve. Regimen cards are mostly here. |
| Uncommon | 3 | A Bond Card with one keyword, or a Trait/Item with a real decision attached. |
| Rare | 1–2 | Strong keyword, often bends a whole archetype, alignment-relevant. |
| Legendary | ~1 in 8 packs | Build-around, run-defining. Often a unique Technique or an Awakening-adjacent Bond Card. Named individuals, not generic species (flavor precedent: the source game's unique/rare Chao types). |

A card's **grade roll** (visible as a small range on the card, e.g. "Swim +12–18") reintroduces the source material's per-instance variance without hiding rarity itself — two commons of the same name aren't always identical, echoing hidden genetics without needing a whole allele system on every basic card.

### 4.4 Color identity, splash cost, and archetypes

A Chao's **color identity** is the union of colors among its currently-bonded cards. Bonding a card whose color isn't already in that identity costs extra Fruit (a **splash tax**), scaling with how far outside the identity it is (0 extra for on-color, small tax for a card sharing a color with the identity, larger tax for a fully foreign color) — this is the design's version of MTG mana-fixing pressure, translated into a currency cost instead of a deckbuilding restriction, because a Chao doesn't build a 40-card deck — it just accumulates whatever you bond onto it.

Ten guild-style two-color archetypes exist (five listed in §3.2, the remaining five are each pair's mirror emphasis — full table in the card set doc). Draft **signals** work exactly as in MTG: if a color is being passed unusually often in the packs you're seeing, other drafters (bots, or other players in a multiplayer draft) aren't taking it, and it's open.

### 4.5 Draft format

At a **Draft Booster** map node:

1. Open a pack of 15 cards.
2. Pick one, pass the rest to the next seat (3–7 AI drafter bots by default, seeded per-run; live players replace bots in multiplayer drafts — see [`architecture.md`](../02-technical/architecture.md#multiplayer--async-model)).
3. Repeat until packs are empty. Standard MTG "3 packs, 15 cards, passing alternates direction each pack" structure.
4. Everything you picked joins your **pool** — a shared resource across your whole Garden Board, not a single Chao's deck. Any Chao can be bonded with any pool card, subject to the slot rules and splash tax above.

AI drafter bots have simple archetype-affinity weights (see [`architecture.md`](../02-technical/architecture.md#bot-drafting) for the algorithm) so that packs feel like they're being fought over, not handed to you.

## 5. The roster & autochess layer

### 5.1 The Garden Board

You don't raise one Chao — you manage a **board** of 2–6, unlocked by spending **Levels** (bought with Fruit, Underlords-style). Board size caps how many Chao can be actively entered into Race/Karate nodes and therefore how much of your drafted pool you can actually put to use — the direct analog of an autochess board-size cap limiting how many units you can field.

### 5.2 Fruit economy

Fruit is the soft currency, generated from three sources, echoing the Underlords economy loop:

- **Base income** each round.
- **Habitat Cards** on your board (§4.2).
- **Placement/streak bonus**: consecutive Race/Bout wins *or* losses both generate bonus Fruit (win streak rewards momentum; loss streak is a comeback mechanism), taken directly from Underlords' dual win/loss streak design.

Spend Fruit on: leveling up board size, rerolling/refreshing a Black Market node's offered singles, paying splash tax, or rushing a Rest Garden action.

### 5.3 Shops vs. draft

Two distinct ways to acquire cards, deliberately kept separate:

- **Draft Boosters** (map nodes): the primary source, pick-based, scarce, shapes archetype identity.
- **Black Market** (map nodes, §7.3): buy *specific known* singles with Fruit — the autochess "shop reroll" analog, used to fill a known gap (e.g. "I need one more Bird-tag card to hit my breakpoint") rather than to build identity.

### 5.4 Duplicates & Awakening

Drafting **three copies of the same named Bond Card** (across the whole pool, regardless of which Chao they end up on) lets you fuse them into that card's **Awakened** version when next bonded — stronger stat roll, upgraded keyword — directly porting the autochess star-up mechanic (3 copies → 2-star unit) onto cards instead of units. This is the design's strongest single piece of "why autochess and not just MTG": drafting *dupes* is normally a wasted pick in MTG limited, and here it's an explicit alternate strategy, exactly like it is in Auto Chess/Underlords.

### 5.5 Species Tag synergy breakpoints

Every Bond Card carries 1–2 **Species Tags** (Rabbit, Bird, Fish, Dragon, Insect, Beast, …) — the direct descendant of the source material's literal animal types, and already hinted at by the source's own Type Combinations system (research §5). Count tags across every Bond Card currently equipped anywhere on your board; hitting a breakpoint grants a board-wide passive, Underlords-Alliance-style:

| Tag count | Bonus tier |
|---|---|
| 2 | Minor: small flat stat bonus board-wide |
| 4 | Moderate: a shared keyword board-wide |
| 6 | Major: unlocks a board-wide Technique card, free, every Generation |

This is what makes drafting "off-archetype" commons still valuable — a mediocre Bond Card that shares a tag with your build-around can be worth taking over a stronger card that doesn't.

### 5.6 Streaks & placement

Race nodes and Karate Bouts report a **placement**, not just win/lose, and both streak types (win and loss, per §5.2) bank Fruit — this keeps a bad Race from being a dead node the way a Slay-the-Spire fight never is, and keeps the economy from being purely a snowball for whoever's already ahead, matching Underlords' comeback-friendly design intent.

## 6. Combat & race resolution

Per pillar #1, none of this is played directly — it's simulated from Chao stats, bonded cards, and pre-loaded Technique cards.

### 6.1 Karate Bout resolution

A Bout is a small number of automatic rounds (default 3) against an opposing Chao (an AI Rival board, an Elite node, or async ghost data — see §9):

1. Each round, **Run** determines turn order/attack count (higher Run = more actions this round, ties broken by Luck).
2. Each action: attacker's **Power** vs. defender's **Swim** resolves damage (`damage = max(1, Power − Swim/2)`, tunable).
3. Defender's **Fly**-derived Evasion (only available post-second-evolution, §3.4) rolls a dodge chance before damage applies.
4. **Stamina** is the hit-point pool; 0 Stamina ends the Bout.
5. Trait Cards trigger on their listed conditions (start of Bout, on-hit, on-dodge, etc.) throughout.
6. Any pre-loaded Technique cards fire when their trigger condition is met (player chose *which* to load and in *what priority* before the Bout started — that's the entire player decision for this event).

### 6.2 Race Leg resolution

A Race is a sequence of **Legs** (Start, then 2–4 of Sprint/Obstacle/Water/Air, matching the source material's course variety and forks — research §6):

1. Each Leg checks the relevant stat (Sprint→Run, Obstacle→Power, Water→Swim, Air→Fly) against a course-defined difficulty curve.
2. Where the source material has a literal fork (walk vs. fly/swim shortcut), the Leg is resolved twice — once to see whether the Chao *takes* the shortcut (a Fly or Swim threshold check) and once for the shortcut Leg itself if taken.
3. **Stamina** decrements each Leg; hitting 0 before the finish is a DNF (no placement, no streak credit, but no elimination from the run — matches pillar #4, a bad Race shouldn't end a Generation on the spot).
4. Same as Karate: pre-loaded Technique cards fire on trigger, spending the Energy budget set before the Race began.

### 6.3 Energy

A small per-event budget (default 3, modified by Traits/Items/Habitat bonuses) spent to *load* Technique cards before a Race/Bout begins — Slay-the-Spire's energy economy, but front-loaded into a setup phase rather than spent turn-by-turn mid-combat, since pillar #1 rules out mid-event player input. This keeps the STS-style resource-tension ("I have more good tricks than Energy to load them") without contradicting the "you coach, don't pilot" pillar.

## 7. Run structure

### 7.1 A run is a Generation

One playthrough, from hatching to cocoon, bounded by the Age budget (§3.6).

### 7.2 The map

A branching node graph across 3 Acts, Slay-the-Spire-shaped:

```
Act 1                          Act 2                          Act 3
[Hatch]
   |
   +--[Draft]--[Race]--+
   |                    +--[Kindergarten?]--[Draft]--[Elite]--+--[Draft]--[Race]--[Boss: Chaos Cup]
   +--[Race]--[Draft]---+                                     |
                          \--[Black Market]--[Rest Garden]----/
```

(Indicative only — actual graph is procedurally generated per run with seeded branching, same as Slay the Spire's map generator.)

### 7.3 Node types

| Node | What happens | Source-material root |
|---|---|---|
| Draft Booster | §4.5 | Feeding, generalized |
| Race | §6.2 | Chao Race |
| Karate Bout | §6.1 | Chao Karate |
| Elite Rival | A Karate Bout or Race against a harder, hand-tuned AI board; better rewards | New (autochess "raid boss" convention) |
| Kindergarten Event | A narrative "?"-style choice node with Mind-gated outcomes | Chao Kindergarten (research §10) |
| Rest Garden | Choose one: restore Stamina/Happiness, remove a card from your pool (deck-thinning, STS-style), or attempt an early reincarnation gamble | New, STS rest-site structure |
| Black Market | §5.3 | Black Market Chao |
| Boss: Chaos Cup | Act-ending Race+Bout combo against a named Rival | New, STS boss-fight convention |

### 7.4 Charms

Permanent, run-wide passive items found at Elite/Boss nodes and rare event outcomes — the direct relic equivalent (e.g. "Chaos Emerald Shard: +1 Energy," "Lucky Ring: reroll one failed Leg check per Race"). Not drafted from packs; found, so they don't compete with the color-identity economy.

### 7.5 Reincarnation as meta-progression

Exactly as scoped in §3.6 and research §9: a well-ended Generation carries 10% of final stats plus one permanently-unlocked card recipe forward. This is the game's *only* run-to-run power carryover by design — deliberately thin, because Slay the Spire's model (and the source material's own reincarnation rule) both treat meta-progression as a *small* nudge, not a power escalator. The bulk of "getting better at the game" should be player skill (drafting, archetype reading) and unlocked *content variety* (§7.6), not stat inflation.

### 7.6 Difficulty Rank

After a full Generation completes (reincarnated or not), a Difficulty Rank unlocks — Ascension-style modifiers for repeat runs (tougher Elite/Boss AI, stingier Fruit income, smaller starting Age budget) rather than a story gate. Also the unlock track for cosmetic-only rewards (new Chao base looks, alternate Habitat art) to keep long-term goals from being stat-shaped.

## 8. Breeding (kept, scoped down)

Full genetic-allele breeding (research §8) is **explicitly out of scope for MVP** (see roadmap) but is documented here because it's a natural post-MVP layer: two Chao that both survive to the end of a Generation on the same board could produce an egg that becomes the following Generation's starting Chao, with the same dominant/recessive grade-inheritance the source material uses, applied to card-grade rolls instead of raw stats. Cut for MVP because it requires the multi-Chao-survival and cross-Generation state tracking that reincarnation alone (§7.5) already covers more simply.

## 9. Multiplayer / async note

Draft bots (§4.5) and Rival boards (§7.2) are AI by default so the whole loop works single-player. The natural multiplayer extension — live human co-drafters, and async "ghost" Race/Bout results pulled from other players' finished Generations as your Elite/Rival opponents (Slay the Spire's own asynchronous-ghost convention, by way of its dev's earlier work) — is scoped in [`architecture.md`](../02-technical/architecture.md#multiplayer--async-model) as a post-MVP milestone, not a launch requirement.

## 10. Design risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Draft + autochess + roguelike is three resource-management layers (Fruit, Energy, pool scarcity) stacked at once — could overwhelm a player who just wants to raise a cute creature. | Source material's core appeal is low-stakes, ambient care. Over-systematizing it risks losing that entirely. | MVP scope (roadmap) deliberately sequences layers: draft+bonding first and playable *alone* before autochess-board and run-map layers are added, so each layer can be play-tested for whether it's additive or just noisy. |
| "You coach, don't pilot" (pillar 1) may read as low-agency compared to genre expectations for a "battler." | Players raised on active-battle genre conventions may expect direct control. | Lean into pre-event *loadout* decisions (Technique priority order, Trait choice) as the skill expression, and make sure the resolution log is legible (a Race/Bout should be watchable and readable, not a black-box number, so the auto-resolution still feels earned). |
| Splash tax (§4.4) needs careful tuning — too cheap and color identity is meaningless, too expensive and off-color Legendary pulls are unusable, which feels bad in a game with pack-opening dopamine built in. | Directly affects draft-pick satisfaction. | Tune splash tax against the Habitat-card fixing rate (§4.2) as one combined knob, not independently; playtest against the "did I ever regret taking the powerful off-color card" question specifically. |
| Species Tag breakpoints (§5.5) and color archetypes (§3.2) are two overlapping build-around axes (tag synergy vs. color synergy) — could produce contradictory draft signals. | Two orthogonal systems both saying "take this" or "don't" can confuse rather than deepen decisions. | Keep tag breakpoints *board-wide* and color archetypes *per-Chao* — they answer different questions ("what should my board look like" vs. "what should this Chao look like") so they should rarely conflict once framed that way in the UI (§ in architecture doc). |
