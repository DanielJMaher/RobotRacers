import { useState } from 'react';
import type { BondCard, Card, Chao, RegimenCard, Stat, TechniqueCard } from '@chao-draft/sim';
import { CardBadge } from './CardBadge';

interface GardenScreenProps {
  chao: Chao;
  pool: Card[];
  log: string[];
  onBondCard: (card: BondCard) => void;
  onConsumeRegimen: (card: RegimenCard) => void;
  onRunRace: (loadedTechniques: TechniqueCard[]) => void;
}

const SLOT_ORDER = ['head', 'back', 'hands', 'feet'] as const;
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
  log,
  onBondCard,
  onConsumeRegimen,
  onRunRace,
}: GardenScreenProps) {
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<Set<string>>(new Set());

  const bondCards = pool.filter((c): c is BondCard => c.type === 'bond');
  const regimenCards = pool.filter((c): c is RegimenCard => c.type === 'regimen');
  const techniqueCards = pool.filter((c): c is TechniqueCard => c.type === 'technique');

  function toggleTechnique(id: string) {
    setSelectedTechniqueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

        <h3>Bond Slots</h3>
        <ul className="slot-list">
          {SLOT_ORDER.map((slot) => {
            const bonded = chao.bondSlots[slot];
            return (
              <li key={slot}>
                <strong>{slot}:</strong>{' '}
                {bonded ? `${bonded.card.name} (${bonded.card.bodyMutation})` : 'empty'}
              </li>
            );
          })}
        </ul>

        <div className="event-buttons">
          <button type="button" onClick={() => onRunRace(loadedTechniques)}>
            Run a Race
          </button>
        </div>
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
              onClick={() => toggleTechnique(card.id)}
            />
          ))}
        </div>
      </div>

      <div className="garden-column log-column">
        <h3>Event Log</h3>
        <ul className="event-log">
          {log.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
