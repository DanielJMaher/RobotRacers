import type { BodyRegion, BondCard, Card, Chao, ItemCard, PotionCard, Stat, TechniqueCard, TraitCard } from '@chao-draft/sim';
import { MAX_TRAITS } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface GardenScreenProps {
  chao: Chao;
  pool: Card[];
  usedPoolIndices: Set<number>;
  selectedTechniqueIds: Set<string>;
  actionMessage: string | null;
  onDismissActionMessage: () => void;
  onBondCard: (card: BondCard, poolIndex: number) => void;
  onAwakenBondCard: (card: BondCard, poolIndices: [number, number, number]) => void;
  onConsumePotion: (card: PotionCard, poolIndex: number) => void;
  onBondTrait: (card: TraitCard) => void;
  onUnbondTrait: (card: TraitCard) => void;
  onEquipItem: (card: ItemCard) => void;
  onUnequipItem: (card: ItemCard) => void;
  onToggleTechnique: (id: string) => void;
}

// Traits/Items aren't consumed from the pool like Bond/Potion cards — the
// same drafted copy can be equipped, unequipped, and re-equipped freely
// (Chao.items' doc comment), so there's no usedPoolIndices-style bookkeeping
// for them. But `chao.traits`/`chao.items` only holds card data, not which
// specific pool copy each entry came from — if two identical-id copies were
// drafted, there's no way to tell "which one" is equipped. This resolves
// that the same stable way Awakening's grouping above does: sort a card
// id's pool copies by poolIndex and treat the first N (N = how many of that
// id are currently in chao.traits/.items) as "the equipped ones" — good
// enough for a UI toggle, not meant to survive a save/load round-trip.
function withEquippedFlag<T extends Card>(
  entries: { card: T; poolIndex: number }[],
  equippedCards: { id: string }[],
): { card: T; poolIndex: number; equipped: boolean }[] {
  const equippedCounts = new Map<string, number>();
  for (const c of equippedCards) equippedCounts.set(c.id, (equippedCounts.get(c.id) ?? 0) + 1);
  const seenSoFar = new Map<string, number>();
  return entries.map(({ card, poolIndex }) => {
    const seen = seenSoFar.get(card.id) ?? 0;
    seenSoFar.set(card.id, seen + 1);
    return { card, poolIndex, equipped: seen < (equippedCounts.get(card.id) ?? 0) };
  });
}

const AWAKENING_COPIES_NEEDED = 3;

// Locked 5-region set (GDD §3.5, corrected 2026-08-20) — replaces the old
// 4-slot list. Bonding is cumulative now, so this drives a per-region "look"
// summary and a bonding-history list instead of a slot grid.
const REGION_ORDER: BodyRegion[] = ['legs', 'arms', 'back', 'head', 'torso'];
const STAT_ORDER: Stat[] = [
  'swim',
  'fly',
  'run',
  'power',
  'climb',
  'jump',
  'stamina',
  'mind',
  'luck',
];

export function GardenScreen({
  chao,
  pool,
  usedPoolIndices,
  selectedTechniqueIds,
  actionMessage,
  onDismissActionMessage,
  onBondCard,
  onAwakenBondCard,
  onConsumePotion,
  onBondTrait,
  onUnbondTrait,
  onEquipItem,
  onUnequipItem,
  onToggleTechnique,
}: GardenScreenProps) {
  // Bond Cards are one-time use (roadmap.md, corrected 2026-08-20): bonding
  // consumes the specific drafted copy, so only still-unused ones are shown
  // here at all — `poolIndex` (position in the full pool, not just among
  // Bond Cards) is what onBondCard/onAwakenBondCard actually consume.
  const unusedBondEntries = pool
    .map((card, poolIndex) => ({ card, poolIndex }))
    .filter(
      (entry): entry is { card: BondCard; poolIndex: number } =>
        entry.card.type === 'bond' && !usedPoolIndices.has(entry.poolIndex),
    );
  // Potions are one-time use too (roadmap.md Phase 5.5, rebranded from
  // Regimen 2026-08-20) — same poolIndex-based consumption tracking as Bond
  // Cards, reusing the same `usedPoolIndices` set.
  const unusedPotionEntries = pool
    .map((card, poolIndex) => ({ card, poolIndex }))
    .filter(
      (entry): entry is { card: PotionCard; poolIndex: number } =>
        entry.card.type === 'potion' && !usedPoolIndices.has(entry.poolIndex),
    );
  // Traits/Items are shown for the WHOLE pool, not gated by usedPoolIndices
  // (that set only ever tracks one-time-use Bond/Potion spends) — see
  // withEquippedFlag's doc comment for how "equipped" is derived per copy.
  const traitEntries = withEquippedFlag(
    pool
      .map((card, poolIndex) => ({ card, poolIndex }))
      .filter((e): e is { card: TraitCard; poolIndex: number } => e.card.type === 'trait'),
    chao.traits,
  );
  const itemEntries = withEquippedFlag(
    pool
      .map((card, poolIndex) => ({ card, poolIndex }))
      .filter((e): e is { card: ItemCard; poolIndex: number } => e.card.type === 'item'),
    chao.items,
  );
  const techniqueCards = pool.filter((c): c is TechniqueCard => c.type === 'technique');
  const loadedTechniques = techniqueCards.filter((c) => selectedTechniqueIds.has(c.id));

  // Awakening (GDD §4.6): 3 unused copies of the same Bond Card can fuse
  // into one enhanced application instead of being bonded individually.
  const awakeningGroups = new Map<string, number[]>();
  for (const { card, poolIndex } of unusedBondEntries) {
    const indices = awakeningGroups.get(card.id) ?? [];
    indices.push(poolIndex);
    awakeningGroups.set(card.id, indices);
  }
  const awakenableCards = unusedBondEntries
    .filter(({ card }) => (awakeningGroups.get(card.id)?.length ?? 0) >= AWAKENING_COPIES_NEEDED)
    .reduce<{ card: BondCard; poolIndices: [number, number, number] }[]>((acc, { card }) => {
      if (acc.some((entry) => entry.card.id === card.id)) return acc; // one Awaken option per card id
      const indices = awakeningGroups.get(card.id)!.slice(0, AWAKENING_COPIES_NEEDED) as [number, number, number];
      acc.push({ card, poolIndices: indices });
      return acc;
    }, []);

  return (
    <section className="garden">
      <div className="garden-column">
        <h2>{chao.name}</h2>
        <p>
          Alignment: <strong>{chao.alignment}</strong> ({chao.alignmentValue.toFixed(2)})
          <br />
          Colors: {chao.colorIdentity.length > 0 ? chao.colorIdentity.join(', ') : 'none yet'}
          <br />
          Evolution stage: {chao.evolutionStage}
          {chao.evolvedAlignment !== undefined && <> — locked {chao.evolvedAlignment}</>}
          {chao.evolvedColor !== undefined && <>, {chao.evolvedColor}</>}
        </p>

        <table className="stat-table">
          <tbody>
            {STAT_ORDER.map((stat) => (
              <tr key={stat}>
                <td>{stat}</td>
                <td>{chao.stats[stat]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Body Regions</h3>
        <ul className="slot-list">
          {REGION_ORDER.map((region) => (
            <li key={region}>
              <strong>{region}:</strong> {chao.regionLooks[region] ?? 'unmarked'}
            </li>
          ))}
        </ul>

        <h3>Bonding History ({chao.bondedCards.length})</h3>
        <ul className="bonding-history-list">
          {chao.bondedCards.map((bonded, index) => (
            <li key={`${bonded.card.id}-${index}`}>
              {bonded.awakened ? '★ ' : ''}
              {bonded.card.name} → {Object.keys(bonded.card.bodyMutations).join(', ')}
            </li>
          ))}
        </ul>
      </div>

      <div className="garden-column">
        {/* Blocked-bond feedback (playtest-prep fix, 2026-08-21): previously
            a blocked bond only ever logged a line in the Event Log, far below
            the fold — clicking an unaffordable card looked identical to
            clicking nothing. Shown right above the grid it applies to. */}
        {actionMessage && (
          <div className="action-message">
            {actionMessage}
            <button type="button" onClick={onDismissActionMessage} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        <h3>Bond Cards ({unusedBondEntries.length})</h3>
        <p className="hint-text">Bonding is one-time use — a card is spent the moment you bond it.</p>
        <div className="card-grid">
          {unusedBondEntries.map(({ card, poolIndex }) => (
            <CardBadge key={poolIndex} card={card} onClick={() => onBondCard(card, poolIndex)} />
          ))}
        </div>

        {awakenableCards.length > 0 && (
          <>
            <h3>Awakening Available</h3>
            <ul className="standings-list">
              {awakenableCards.map(({ card, poolIndices }) => (
                <li key={card.id}>
                  <span>{card.name} — 3.5x a single copy's average grant</span>
                  <button
                    type="button"
                    className="slot-assign-btn"
                    onClick={() => onAwakenBondCard(card, poolIndices)}
                  >
                    Awaken (uses 3)
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3>Potions ({unusedPotionEntries.length})</h3>
        <p className="hint-text">Potions are one-time use — a card is spent the moment you drink it.</p>
        <div className="card-grid">
          {unusedPotionEntries.map(({ card, poolIndex }) => (
            <CardBadge key={poolIndex} card={card} onClick={() => onConsumePotion(card, poolIndex)} />
          ))}
        </div>

        <h3>Traits ({chao.traits.length}/{MAX_TRAITS} active)</h3>
        <p className="hint-text">
          Always-on passive effects that fire during Races. Click to bond (costs Fruit); click an active one to
          unbond and free the slot (no refund).
        </p>
        <div className="card-grid">
          {traitEntries.map(({ card, poolIndex, equipped }) => (
            <CardBadge
              key={poolIndex}
              card={card}
              selected={equipped}
              onClick={() => (equipped ? onUnbondTrait(card) : onBondTrait(card))}
            />
          ))}
        </div>

        <h3>Items ({chao.items.length} equipped)</h3>
        <p className="hint-text">
          Freely re-equippable gear — a passive stat bonus or a Race-time effect. Click to equip (costs Fruit); click
          an equipped one to unequip (no refund).
        </p>
        <div className="card-grid">
          {itemEntries.map(({ card, poolIndex, equipped }) => (
            <CardBadge
              key={poolIndex}
              card={card}
              selected={equipped}
              onClick={() => (equipped ? onUnequipItem(card) : onEquipItem(card))}
            />
          ))}
        </div>

        <h3>Techniques — click to load before an event ({loadedTechniques.length} loaded)</h3>
        <div className="card-grid">
          {techniqueCards.map((card, index) => (
            <CardBadge
              key={`${card.id}-${index}`}
              card={card}
              selected={selectedTechniqueIds.has(card.id)}
              onClick={() => onToggleTechnique(card.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
