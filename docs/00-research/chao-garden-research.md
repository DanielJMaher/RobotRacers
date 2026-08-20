# Research: The Chao Garden (Sonic Adventure DX / SA2B)

This is the baseline system every design decision in the GDD is deliberately measured against. Sourced from Chao Island (the community's canonical stat/mechanics wiki), Sonic Wiki Zone, and long-form player guides. Where sources conflict slightly across games (SA1 vs SA2B vs later re-releases), the DX/SA2B-era behavior is used since that's the version referenced in the brief.

## 1. Stats

Seven stats total, though the original 5-year-old design is really "5 physical + 2 hidden social."

| Stat | Color | Drives it | Notes |
|---|---|---|---|
| **Swim** | Yellow | Yellow animals, yellow Chaos Drives | Chao learn to swim at 100 points. Doubles as the **defense** stat in Chao Karate (reduces incoming damage). |
| **Fly** | Purple | Purple animals, purple Chaos Drives | Chao can fly in the garden at 100 points. |
| **Run** | Green | Green animals, green Chaos Drives | Governs walk/run speed; doubles as **attack speed** (frequency) in Chao Karate. |
| **Power** | Red | Red animals, red Chaos Drives | Doubles as **damage dealt + knockback** in Chao Karate; also resolves Race obstacles like the beach-ball push. |
| **Stamina** | — | Any fruit | Must be the *highest* stat for a Chao to stay "Normal" type. Guides treat it as the stat to prioritize first because it underlies general race performance. |
| **Mind / Intelligence** | — | Interaction, some items | Governs how well a Chao learns Kindergarten lessons and executes techniques. |
| **Luck** | — | Special items | Minor, mostly affects Karate crit-ish variance and some race RNG. |

A fifth "color," blue, exists on some items and nudges a little of everything at once — a soft "all-stats" pool distinct from the four hard-typed ones.

Sources: [Chao Island — Stats](https://chao-island.com/info-center/basics/stats.html), [Chao Island Wiki — Stats](https://chao-island.com/wiki/Stats)

## 2. Feeding: animals vs. Chaos Drives vs. fruit

This is the system being replaced, so its exact shape matters:

- **Animals** (found in the adventure fields, e.g. rabbit, bird, fish, chicken): give a stat boost **and** two side effects — the Chao sprouts matching **body parts** (ears, tail, wings, fins) and starts **mimicking that animal's behavior** (e.g., enough rabbit and the Chao starts hopping). Stacking animals from every color group produces a "jack of all trades, master of none" generalist.
- **Chaos Drives**: pure stat injection (~+1.6 to the relevant stat, scaled by the Chao's hidden grade) with **no** body-part change and **no** behavior change — the min-maxer's tool, used to top up a stat after the *look* has already been locked in with animals.
- **Fruit**: raises Stamina (and some fruit raise Mind/Luck), no body-part change.

The standard advanced-player strategy — pick one stat to specialize in, feed the matching animals for the *look*, then top off the number with same-colored Drives — is effectively a "commit to an archetype, then optimize the numbers" pattern. That pattern is the direct ancestor of "pick a color pair, then draft to fill the curve."

Sources: [Chao Island Wiki — Chaos Drives](https://chao-island.com/wiki/Chaos_Drives), [Chao Island — Chaos Drives (SA2)](https://chao-island.com/info-center/training-sa2/chaos-drives.html), [Steam Guide — Fusion's Chao Editor](https://steamcommunity.com/sharedfiles/filedetails/?id=715315042)

## 3. Hidden grades (the genetics layer)

Every stat has a **hidden Grade** from **E to S** that acts as a multiplier on how many points a given animal/Drive/fruit actually grants — two Chao fed the identical diet can land at very different final numbers because of this invisible modifier. Grades aren't shown directly in-game; players infer them (or use a Chao Doctor/stat-tracking tool) by watching gains per item.

This hidden-power-level-under-a-visible-surface is a strong structural precedent for **card rarity** — a system where the "same slot" can be filled by a much stronger version of a similar effect, discoverable through play rather than stated up front.

Source: [Chao Island — Breeding](https://chao-island.com/info-center/advanced/breeding.html)

## 4. Alignment: Hero / Dark / Neutral

A hidden slider from **-1 (Dark) to +1 (Hero)**, moved by which characters interact with the Chao (Sonic/Tails/Knuckles push Hero; Shadow/Rouge/Eggman push Dark; equal exposure holds Neutral) and by how the Chao is treated (petting vs. hitting). This is **orthogonal** to the stat-dominance system below — a Chao's *alignment* and its *stat specialty* are two independent axes that both bear on what it becomes.

Source: [Chao Island — Alignment](https://chao-island.com/info-center/life-cycle/alignment.html)

## 5. Evolution

Two evolutions per lifetime, each a cocoon event:

- **First evolution**: determined by the alignment slider at the moment of evolving → Hero / Dark / Neutral form, each with a distinct look and idle personality.
- **Second evolution**: determined by which *color* of animal/Drive the Chao has been fed the most of at that point → locks in a stat-driven "type" (and, per Chao Island's Type Combinations gallery, animals fed *after* this point keep morphing the Chao toward hybrid types, e.g., a Hero Chao that keeps eating fish-type animals drifts toward a Hero/Swim hybrid appearance).

So: **alignment picks the moral axis, stat-color exposure picks the mechanical archetype**, and they compose. That two-axis composition is a major structural idea carried into the redesign (see GDD §3).

Sources: [Chao Island Wiki — Evolution](https://chao-island.com/wiki/Evolution), [Chao Island — Alignment](https://chao-island.com/info-center/life-cycle/alignment.html), [Chao Island — Type Combinations](https://chao-island.com/gallery/advanced-evolution/types.html)

## 6. Racing

Two tiers per course: **Beginner** races (child Chao) and **Jewel** races (adult Chao, unlocked by winning the matching Beginner race), five/six courses culminating in Jewel Cups. Competitive Jewel performance wants Swim+Fly+Run+Power summing to roughly **6,751+**. Courses aren't just a stat check — they have **routing** (a fork where a Chao can walk one path or fly/swim a shortcut) and **stat-gated obstacles** (a beach-ball push resolved by Power). Placement is what's scored, not head-to-head combat.

Sources: [Sonic Wiki Zone — Chao Race](https://sonic.fandom.com/wiki/Chao_Race), [Chao Island Wiki — Chao Races (SADX)](https://chao-island.com/wiki/Chao_Races_(SADX)), [Chao Island — Races (SA1)](https://chao-island.com/info-center/training-sa1/races.html)

## 7. Chao Karate

The other stat-driven minigame, and structurally the closer of the two to an autobattler: Chao fight **autonomously** (you don't directly control them mid-bout) with **Run = attack speed, Power = damage + knockback, Swim = defense**. You prepare the fighter beforehand; the bout itself resolves on its own. This "you build it, it fights itself" shape is exactly the autochess resolution model, and it already exists natively in the source game — it just wasn't blended with the Garden's raising loop before.

Sources: [Chao Island Wiki — Chao Karate](https://chao-island.com/wiki/Chao_Karate), [Chao Island Wiki — Classroom](https://chao-island.com/wiki/Classroom)

## 8. Breeding & genetic inheritance

Two adult Chao (opposite reproductive types) can mate **once per lifetime** (a Heart Fruit resets this). The egg's stat grades are inherited via a two-allele system: each parent contributes one hidden allele per stat, the child expresses one of them, and the *other* stays hidden in the child's own genome to potentially surface a generation later — real Mendelian-style dominant/recessive inheritance, not simple averaging. E.g. two Grade-B Swim parents cap the child at B in Swim, but a B-parent × S-parent pairing can (with enough attempts) produce an S child.

Sources: [Chao Island — Breeding](https://chao-island.com/info-center/advanced/breeding.html), [Sonic Wiki Zone — Chao breeding](https://sonic.fandom.com/wiki/Chao_breeding)

## 9. Lifespan, death, and reincarnation

A Chao's life is tracked by two hidden countdown values; it lives roughly **5 real-world years** (~3 hours per in-game "year" in modern releases) before the counters hit zero. At that point:

- If **happiness** was kept high enough, the Chao **reincarnates**: a pink cocoon, and it comes back as a new egg retaining **10% of its final stat points**, with levels reset but stat *grades* preserved.
- If not, it's a white cocoon and the Chao is simply gone.

This is a built-in **roguelite meta-progression mechanic already present in the source game** — a bounded run (a lifetime) that, played well, seeds the next one. It's the single best pre-existing hook for wrapping a Slay-the-Spire-style run structure around the Garden loop, because the source material already frames a Chao's life as a bounded, restartable arc with partial carry-over.

Sources: [Chao Island Wiki — Age](https://chao-island.com/wiki/Age), [Chao Island Wiki — Death & Reincarnation](https://chao-island.com/wiki/Death_%26_Reincarnation), [Chao Island — Death](https://chao-island.com/info-center/life-cycle/death.html)

## 10. Kindergarten

A schoolhouse where a Chao can be left in class to pick up techniques (instrument-playing, and in some releases things like tic-tac-toe) and raise Mind, gated by lesson difficulty vs. the Chao's current Mind stat. Functionally: a passive, low-agency "training" node distinct from active feeding — a useful precedent for a non-combat, non-draft map node (see GDD §7, *Kindergarten Event*).

Source: [Chao Island — Chao Kindergarten](https://chao-island.com/info-center/kindergarten/kindergarten.html)

## 11. What this means for the redesign

Reading these ten systems together, four structural facts fall out that shape everything in the GDD:

1. **The player is a coach, not a pilot.** Both Races and Karate Bouts already auto-resolve from stats + trained behavior. An autochess "build it, then watch it fight" model isn't a stretch grafted onto the source material — it's already how the source material works.
2. **There are already two orthogonal creature axes** (alignment, and stat-color dominance) composing into a final form. A color-pie-based card system with a separate order/chaos lean maps onto this almost without translation.
3. **There's already a hidden-rarity layer** (stat grades E–S) underneath a visible-effect layer (which animal/Drive you fed). That's a rarity system waiting for a name.
4. **There's already a bounded-run-with-partial-carryover loop** (lifespan → reincarnation @ 10% stats). A Slay-the-Spire-style single-run structure isn't replacing anything — it's naming a structure the source material already has.
