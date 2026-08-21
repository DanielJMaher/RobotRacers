import type { BodyRegion, BondCard, Card, Chao, PotionCard, Stat, TechniqueCard } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface GardenScreenProps {
  chao: Chao;
  pool: Card[];
  usedPoolIndices: Set<number>;
  selectedTechniqueIds: Set<string>;
  onBondCard: (card: BondCard, poolIndex: number) => void;
  onAwakenBondCard: (card: BondCard, poolIndices: [number, number, number]) => void;
  onConsumePotion: (card: PotionCard, poolIndex: number) => void;
  onToggleTechnique: (id: string) => void;
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
  onBondCard,
  onAwakenBondCard,
  onConsumePotion,
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
