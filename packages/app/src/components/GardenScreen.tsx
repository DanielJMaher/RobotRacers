import type { BodyRegion, BondCard, Card, Chao, RegimenCard, Stat, TechniqueCard } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface GardenScreenProps {
  chao: Chao;
  pool: Card[];
  selectedTechniqueIds: Set<string>;
  onBondCard: (card: BondCard) => void;
  onConsumeRegimen: (card: RegimenCard) => void;
  onToggleTechnique: (id: string) => void;
}

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
  selectedTechniqueIds,
  onBondCard,
  onConsumeRegimen,
  onToggleTechnique,
}: GardenScreenProps) {
  const bondCards = pool.filter((c): c is BondCard => c.type === 'bond');
  const regimenCards = pool.filter((c): c is RegimenCard => c.type === 'regimen');
  const techniqueCards = pool.filter((c): c is TechniqueCard => c.type === 'technique');
  const loadedTechniques = techniqueCards.filter((c) => selectedTechniqueIds.has(c.id));

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
              {bonded.card.name} → {Object.keys(bonded.card.bodyMutations).join(', ')}
            </li>
          ))}
        </ul>
      </div>

      <div className="garden-column">
        <h3>Bond Cards ({bondCards.length})</h3>
        <div className="card-grid">
          {bondCards.map((card, index) => (
            <CardBadge key={`${card.id}-${index}`} card={card} onClick={() => onBondCard(card)} />
          ))}
        </div>

        <h3>Regimen Cards ({regimenCards.length})</h3>
        <div className="card-grid">
          {regimenCards.map((card, index) => (
            <CardBadge
              key={`${card.id}-${index}`}
              card={card}
              onClick={() => onConsumeRegimen(card)}
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
