import './App.css';
import { BreedingScreen } from './components/BreedingScreen';
import { DraftScreen } from './components/DraftScreen';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { EventLogPanel } from './components/EventLogPanel';
import { GardenScreen } from './components/GardenScreen';
import { HabitatPlacementScreen } from './components/HabitatPlacementScreen';
import { InterludeBoosterScreen } from './components/InterludeBoosterScreen';
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

      {game.phase === 'habitat_placement' && game.environment && (
        <HabitatPlacementScreen
          environment={game.environment}
          onPlace={game.placeHabitatCard}
          onContinue={game.continueToTournament}
        />
      )}

      {game.phase === 'interlude' && game.interludeDraft && game.interludeRound && (
        <InterludeBoosterScreen
          interlude={game.interludeDraft}
          round={game.interludeRound}
          onPick={game.pickInterludeCard}
        />
      )}

      {game.phase === 'breeding' && game.tournament && (
        <BreedingScreen
          tournament={game.tournament}
          setup={game.breedingSetup}
          onConfirmPartner={game.pickBreedingPartner}
          onStartNextTournament={game.startNextTournament}
        />
      )}

      {game.phase === 'tournament' && game.chao && game.tournament && game.environment && (
        <div className="tournament-layout">
          <GardenScreen
            chao={game.chao}
            pool={game.playerPool}
            selectedTechniqueIds={game.selectedTechniqueIds}
            onBondCard={game.bondBondCard}
            onConsumeRegimen={game.consumeRegimenCard}
            onToggleTechnique={game.toggleTechnique}
          />
          <EnvironmentPanel environment={game.environment} onPlantSeed={game.plantSeed} />
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
