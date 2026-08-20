import './App.css';
import { DraftScreen } from './components/DraftScreen';
import { EventLogPanel } from './components/EventLogPanel';
import { GardenScreen } from './components/GardenScreen';
import { TournamentPanel } from './components/TournamentPanel';
import { useGame } from './game/useGame';

export function App() {
  const game = useGame();

  return (
    <main className="app">
      <h1>Chao Draft</h1>
      <p className="subtitle">
        Draft cards, bond them onto your Chao, then compete in the Tournament. See{' '}
        <code>docs/03-roadmap/roadmap.md</code> for scope.
      </p>

      {game.phase === 'draft' && (
        <DraftScreen
          pack={game.playerPack}
          currentRound={game.draft.currentRound}
          currentPick={game.draft.currentPick}
          packsPerDraft={game.draft.packsPerDraft}
          packSize={game.draft.packSize}
          onPick={game.pickCard}
        />
      )}

      {game.phase === 'tournament' && game.chao && game.tournament && (
        <div className="tournament-layout">
          <GardenScreen
            chao={game.chao}
            pool={game.playerPool}
            selectedTechniqueIds={game.selectedTechniqueIds}
            onBondCard={game.bondBondCard}
            onConsumeRegimen={game.consumeRegimenCard}
            onToggleTechnique={game.toggleTechnique}
          />
          <TournamentPanel
            tournament={game.tournament}
            loadedTechniqueCount={game.selectedTechniqueIds.size}
            onRunNextRace={game.runNextGroupRace}
            onRunFinalRace={game.runFinalRace}
          />
          <EventLogPanel log={game.log} />
        </div>
      )}
    </main>
  );
}
