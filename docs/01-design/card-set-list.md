# Example Card Set — "Core Garden" (working set, ~95 cards)

Purpose of this doc: prove the framework in [`game-design-document.md`](game-design-document.md) produces real, distinct draftable choices — not just prove the framework exists. Treat this as a first draft set (MTG calls this "a core set"): mostly straightforward, a few build-arounds per color, enough duplicates seeded in to make Awakening (§5.4 of the GDD) a real in-draft decision.

Legend: **C**ommon / **U**ncommon / **R**are / **L**egendary. Bond Cards list their slot (He=Head, Ba=Back, Ha=Hands, Fe=Feet) and Species Tag(s). Technique cards list Energy cost.

**"Potion" cards below were renamed from "Regimen" 2026-08-20** (GDD §4.2, roadmap.md Phase 5.6) — same cards, same numbers, clearer name. That pass also added 10 new blended Potions (2–3 colors, rarity-gated) not yet reflected in this doc's per-color tables — see `packages/sim/src/cards/data/potions.ts` for the full current list.

## 🟢 Green — Stamina (Endurance / Growth / Sustain)

| Name | Rarity | Type | Slot/Cost | Effect | Tags |
|---|---|---|---|---|---|
| Packleaf Tortoise | C | Bond | Fe | +Stamina (8–12). Body: shell. | Reptile |
| Bramble Hare | C | Bond | Fe | +Stamina (6–10), +Run (2–4). Body: long ears. | Rabbit |
| Meadow Fawn | C | Bond | Ba | +Stamina (7–11). *Keyword:* **Graze** — regen 1 Stamina between Legs. | Beast |
| Deeproot Fruit | C | Potion | — | +Stamina (10–14) flat, no body change. | — |
| Sunlit Berries | C | Potion | — | +Stamina (4–6) and +1 Mind. | — |
| Second Wind | U | Technique | 1 | This Leg: this Chao cannot DNF regardless of remaining Stamina. | — |
| Old Growth | U | Bond | Ba | +Stamina (14–20). *Keyword:* **Rooted** — +50% effect from all future Green Potion cards. | Beast |
| Tortoiseshell Ward | U | Trait | — | Whenever this Chao would DNF a Race, instead finish last with full streak credit (once per Generation). | — |
| Hollow Log Den | U | Bond | Ba | +Stamina (12–16), +Swim (4–6). Body: mossy shell-plates. | Reptile, Beast |
| Evergreen Warden | R | Bond | Fe | +Stamina (18–24). *Keyword:* **Unshakeable** — immune to the first negative Technique played against this Chao each Bout. | Beast |
| Ancient Grove Blessing | R | Trait | — | This Chao's Stamina stat is also used as a second defense check in Karate Bouts (average with Swim). | — |
| Heartroot | R | Potion | — | +Stamina (20–28) flat. If this Chao is already the highest-Stamina Chao on your board, double the gain. | — |
| Thousand-Year Chao-Oak | L | Bond | Ba | +Stamina (28–36). *Keyword:* **Evergreen** — this Bond Card cannot be overwritten by future bonding (permanent slot lock). Body: bark plating, small canopy. | Beast, Reptile |
| Bountiful Harvest | L | Technique | 2 | This Race: gain +1 Fruit for every Leg this Chao completes, win or lose. | — |

## 🔴 Red — Run (Speed / Aggression / Tempo)

| Name | Rarity | Type | Slot/Cost | Effect | Tags |
|---|---|---|---|---|---|
| Skitter Finch | C | Bond | Fe | +Run (7–11). Body: quick-tap feet. | Bird |
| Dustdash Lizard | C | Bond | Fe | +Run (8–12). *Keyword:* **Bolt** — first Sprint Leg each Race auto-succeeds. | Reptile |
| Firecracker Beetle | C | Bond | Ha | +Run (6–9), +Power (2–4). Body: bright wing-case. | Insect |
| Quickstep Draught | C | Potion | — | +Run (10–14) flat. | — |
| Racing Stripe Tonic | C | Potion | — | +Run (5–8), +1 Luck. | — |
| Adrenaline Rush | U | Technique | 1 | This round: this Chao takes two actions instead of one in the Karate Bout. | — |
| Cinder Sprinter | U | Bond | Fe | +Run (13–18). *Keyword:* **Overclock** — +Run scales up the more Fruit you have banked (cap +6). | Beast |
| Startling Cry | U | Trait | — | The first time each Bout this Chao is targeted by an enemy Technique, gain +Run equal to half this Chao's current Run for the rest of the Bout. | — |
| Jackrabbit Reflex | U | Bond | He | +Run (10–14). Body: alert long ears. *Keyword:* **First Move** — always acts first in round 1 of a Karate Bout. | Rabbit |
| Blazing Comet Wing | R | Bond | Ba | +Run (16–22), +Fly (4–6). Body: trailing sparks. | Bird |
| False Start | R | Technique | 2 | This Race: this Chao's Run is doubled for the Start leg only. | — |
| Feral Momentum | R | Trait | — | Each Leg this Chao wins in a row, gain a stacking +2 Run for the rest of the Race. | — |
| Sonic Boom Sprinter | L | Bond | Fe | +Run (24–32). *Keyword:* **Breakneck** — this Chao always takes the shortcut fork in a Race, no threshold check needed. Body: motion-blur streaks. | Beast |
| Photo Finish | L | Technique | 3 | This Race: if this Chao is currently in 2nd place or worse on the final Leg, instantly move up one placement. | — |

## ⚫ Black — Power (Force / Sacrifice / Damage)

| Name | Rarity | Type | Slot/Cost | Effect | Tags |
|---|---|---|---|---|---|
| Snapping Turtle | C | Bond | Ha | +Power (7–11). Body: heavy jaw. | Reptile |
| Iron-Hide Boar | C | Bond | Ha | +Power (8–12). *Keyword:* **Bulldoze** — auto-succeeds Obstacle legs. | Beast |
| Stag Beetle Pincer | C | Bond | Ha | +Power (6–10), +Stamina (2–4). Body: mandibles. | Insect |
| Crushblow Tonic | C | Potion | — | +Power (10–14) flat. | — |
| Grinding Stone | C | Potion | — | +Power (5–8), −Fly (2) *(a genuine downside common — the set's "risk" filler)*. | — |
| Heavy Strike | U | Technique | 1 | This round: this Chao's next hit ignores defender's Swim entirely. | — |
| Warthog Tusks | U | Bond | Ha | +Power (13–18). *Keyword:* **Knockback+** — on hit, delays the defender's next action. | Beast |
| Bloodrock Idol | U | Trait | — | Whenever this Chao's Stamina drops below half, permanently gain +3 Power for the rest of the Generation. | — |
| Ram's Charge | U | Bond | He | +Power (10–14). Body: curled horns. *Keyword:* **Charge** — deals bonus damage on the opening action of a Bout. | Beast |
| Obsidian Claw | R | Bond | Ha | +Power (17–23). *Keyword:* **Rend** — ignores half of Unshakeable/shield-type Trait protections. | Beast |
| Sacrificial Offering | R | Technique | 2 | Sacrifice 10 Stamina: deal Power-equal bonus damage this round, ignoring Evasion. | — |
| Bonebreaker Instinct | R | Trait | — | This Chao's knockback also reduces the defender's Run for the rest of the round. | — |
| Warlord's Fang | L | Bond | Ha | +Power (26–34). *Keyword:* **Executioner** — instantly wins the Bout if this hit would bring the defender below 10% Stamina. Body: dark fang-plating. | Beast |
| Total Eclipse | L | Technique | 3 | This Bout: all of this Chao's actions this round ignore Evasion and Swim both. | — |

## 🔵 Blue — Fly (Evasion / Tempo / Card Selection)

| Name | Rarity | Type | Slot/Cost | Effect | Tags |
|---|---|---|---|---|---|
| Darting Sparrow | C | Bond | Ba | +Fly (7–11). Body: small wings. | Bird |
| Glassfin Guppy | C | Bond | Ba | +Fly (6–10). *Keyword:* **Slipstream** — +10% Evasion vs. the first hit each Bout. | Fish |
| Paper Kite Moth | C | Bond | Ba | +Fly (8–12), +1 Mind. Body: patterned wings. | Insect |
| Windcatcher Draught | C | Potion | — | +Fly (10–14) flat. | — |
| Cloudsight Tonic | C | Potion | — | +Fly (4–6), draw an extra card at your next Draft Booster. | — |
| Feint | U | Technique | 1 | This round: this Chao auto-dodges the next incoming hit. | — |
| Hummingbird Dash | U | Bond | Ba | +Fly (13–18). *Keyword:* **Hover** — always takes the shortcut fork if Fly threshold is met, no roll. | Bird |
| Tidewatcher's Eye | U | Trait | — | At the start of each Draft Booster you open, look at 2 extra cards from the pack before picking (then return them). | — |
| Riptide Minnow | U | Bond | Ba | +Fly (11–15), +Swim (3–5). Body: fin-crest. | Fish |
| Stormpetrel Wing | R | Bond | Ba | +Fly (17–23). *Keyword:* **Evasive Mastery** — Evasion chance doubled vs. Power-type attackers specifically. | Bird |
| Read the Wind | R | Technique | 2 | This Race: reveal the next Leg's type before choosing which Techniques to load. | — |
| Mirage Step | R | Trait | — | The first hit against this Chao each Bout is always evaded, no roll. | — |
| Skydancer, First of Flight | L | Bond | Ba | +Fly (28–36). *Keyword:* **Unbound** — this Chao ignores Air-leg difficulty entirely (auto-max result). Body: iridescent wings, trailing feathers. | Bird |
| Perfect Read | L | Technique | 3 | This Bout: see the opponent's remaining loaded Techniques before choosing your action order for the round. | — |

## ⚪ White — Swim (Defense / Protection / Order)

| Name | Rarity | Type | Slot/Cost | Effect | Tags |
|---|---|---|---|---|---|
| Koi Pond Elder | C | Bond | Ba | +Swim (7–11). Body: trailing fins. | Fish |
| Harbor Seal Pup | C | Bond | Ba | +Swim (8–12). *Keyword:* **Buoyant** — reduces Stamina cost of Water legs. | Beast |
| Reed Crane | C | Bond | Fe | +Swim (6–10), +Fly (2–4). Body: long legs. | Bird |
| Clearwater Draught | C | Potion | — | +Swim (10–14) flat. | — |
| Tidepool Tonic | C | Potion | — | +Swim (5–8), +2 Happiness (Rest Garden currency). | — |
| Guard Stance | U | Technique | 1 | This round: this Chao takes half damage from the next hit. | — |
| Coral Turtle Shell | U | Bond | Ba | +Swim (13–18). *Keyword:* **Bulwark** — the first Karate round each Bout deals 0 damage to this Chao. | Reptile |
| Still Waters | U | Trait | — | If this Chao finishes a Race without using any Techniques, gain double Fruit for that Race. | — |
| Otter Paddle | U | Bond | Fe | +Swim (11–15). *Keyword:* **Current Rider** — auto-succeeds Water legs. | Beast |
| Leviathan's Scale | R | Bond | Ba | +Swim (17–23). *Keyword:* **Aegis** — Trait Cards that would remove this Chao's shields/protections instead fail. | Fish |
| Steady Hand | R | Technique | 2 | This Bout: this Chao cannot be knocked back or have its action order changed this round. | — |
| Guardian's Oath | R | Trait | — | Whenever another Chao on your board would DNF, this Chao may give up its own Leg result to save them (once per Race). | — |
| Ninefold Tide, the Unbroken | L | Bond | Ba | +Swim (28–36). *Keyword:* **Sanctuary** — this Chao cannot take Karate damage below 1 Stamina remaining more than once per Bout (survives lethal once). Body: layered scale-armor, calm expression. | Fish, Reptile |
| Perfect Calm | L | Technique | 3 | This Race: this Chao cannot DNF and automatically wins any single Leg of your choice. | — |

## ⬛ Colorless — Item Cards

Draftable and usable by any Chao regardless of color identity; movable between Chao each Garden phase rather than fused permanently (the "answer" to being color-screwed — see GDD §4.4).

| Name | Rarity | Effect |
|---|---|---|
| Lucky Bell | C | +1 Luck while equipped. |
| Training Weights | C | +2 to this Generation's next Bond Card's stat roll (consumed on next bond). |
| Chao Whistle | C | +1 Energy for this Chao's next Race or Bout only. |
| Tiny Mirror | U | Copy this Chao's highest stat's color as a second, minor color for splash-tax purposes only. |
| Emblem of Passage | U | This Chao ignores splash tax once per Garden phase. |
| Old Bell Collar | U | +5% Fruit from every win this Chao contributes to. |
| Chaos Fragment | R | +1 to all five stats, flat, no cosmetic change. |
| Twin Soul Charm | R | The next Bond Card you fuse on this Chao counts double toward Species Tag breakpoints (§5.5). |
| Second Chance Egg | L | Once per Generation, if this Chao would fail happiness threshold at cocoon time, treat it as passed. |
| Founder's Medallion | L | This Chao's reincarnation stat carryover (normally 10%) becomes 20%. |

## 🌿 Habitat Cards (Garden Board, land-equivalent)

Attach to your **board**, not a Chao. Generate Fruit each round; reduce splash tax for their listed color.

| Name | Rarity | Color fixed | Effect |
|---|---|---|---|
| Sunlit Meadow | C | Green | +1 Fruit/round. Reduces Green splash tax. |
| Windswept Cliff | C | Red | +1 Fruit/round. Reduces Red splash tax. |
| Iron Quarry | C | Black | +1 Fruit/round. Reduces Black splash tax. |
| Cloud Terrace | C | Blue | +1 Fruit/round. Reduces Blue splash tax. |
| Tidepool Cove | C | White | +1 Fruit/round. Reduces White splash tax. |
| Twin Garden Spring | R | Any two (choose at draft) | +2 Fruit/round. Reduces splash tax for both chosen colors. |

## Guild Archetypes {#guild-archetypes}

All 10 two-color pairings across the 5 stat-colors, each with a name and a one-line identity. (Green/Red, Swim/Fly, Power/Run, Stamina/Power, and Swim/Stamina are introduced in the GDD; the remaining five are named here for the first time.)

| Pair | Colors | Archetype | Identity | Signature card above |
|---|---|---|---|---|
| Run / Stamina | 🔴🟢 | **Sprinter** | Aggro racer, wins early, needs Stamina to not gas out. | Sonic Boom Sprinter (L) |
| Swim / Fly | ⚪🔵 | **Glider** | Tempo/evasion, shortcut specialist, avoids fights. | Skydancer, First of Flight (L) |
| Power / Run | ⚫🔴 | **Brawler** | Fast, hard-hitting Karate specialist, low defense. | Warlord's Fang (L) |
| Stamina / Power | 🟢⚫ | **Bruiser** | Tanky heavy hitter, sacrifice-fueled, wins late. | Thousand-Year Chao-Oak + Sacrificial Offering |
| Swim / Stamina | ⚪🟢 | **Warden** | Defensive control, DNF-proof, wins by outlasting. | Ninefold Tide, the Unbroken (L) |
| Swim / Power | ⚪⚫ | **Sentinel** | Counter-puncher — blocks, then punishes. Bulwark + Rend synergy. | Coral Turtle Shell + Obsidian Claw |
| Swim / Run | ⚪🔴 | **Vanguard** | Fast but protected front-runner, survives incidents. | Otter Paddle + Jackrabbit Reflex |
| Fly / Power | 🔵⚫ | **Trickster** | Hit-and-run ambush Karate, evasive burst damage. | Stormpetrel Wing + Heavy Strike |
| Fly / Run | 🔵🔴 | **Skirmisher** | Hyper-mobile tempo racer, lots of small Techniques. | Blazing Comet Wing + Adrenaline Rush |
| Fly / Stamina | 🔵🟢 | **Naturalist** | Value/growth over time, late-game air superiority. | Tidewatcher's Eye + Old Growth |

## Set-design notes

- **Duplicate seeding:** each color's Common Bond Cards are weighted to appear ~2.2x per full draft on average across a full booster set, so seeing a 3rd copy of a specific Common for an Awakening (GDD §5.4) is a real, if uncommon, in-draft event rather than a mathematical impossibility.
- **The one deliberate downside common** (Grinding Stone, Black) exists on purpose — MTG core sets always ship a few "real tradeoff" commons so that late picks in a color aren't *all* strictly good, which is what makes signal-reading in the first place meaningful.
- **Legendaries are all Bond or Technique**, never Potion/Trait/Item — keeps the "build-around bomb" feeling attached to something visible on the Chao itself (a body change or a splashy in-event moment), matching pillar #3 (rarity discovered through play).
- This set is intentionally small (~95 cards vs. a real MTG set's 250+) — it's sized to prove the framework and support internal playtesting, not to ship as final content. The roadmap's content-pass milestone scopes out the actual target set size.
