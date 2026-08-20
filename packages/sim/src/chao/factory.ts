import type { Chao, Stat } from '../types';

const ZERO_STATS: Record<Stat, number> = {
  swim: 0,
  fly: 0,
  run: 0,
  power: 0,
  climb: 0,
  jump: 0,
  stamina: 0,
  mind: 0,
  luck: 0,
};

export interface CreateChaoParams {
  id: string;
  name: string;
  bornGeneration: number;
}

export function createChao(params: CreateChaoParams): Chao {
  return {
    id: params.id,
    name: params.name,
    bornGeneration: params.bornGeneration,
    stats: { ...ZERO_STATS },
    bondedCards: [],
    traits: [],
    items: [],
    speciesTagCounts: {},
    colorIdentity: [],
    alignment: 'neutral',
    alignmentValue: 0,
    regionLooks: {},
    evolutionStage: 0,
    age: 0,
    happiness: 50,
    currentStamina: 0,
  };
}
