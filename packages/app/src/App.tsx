import './App.css';
import { BreedingScreen } from './components/BreedingScreen';
import { DraftScreen } from './components/DraftScreen';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { EventLogPanel } from './components/EventLogPanel';
import { GardenScreen } from './components/GardenScreen';
import { HabitatPlacementScreen } from './components/HabitatPlacementScreen';
import { InterludeBoosterScreen } from './components/InterludeBoosterScreen';
import { RaceResultsScreen } from './components/RaceResultsScreen';
import { TournamentPanel } from './components/TournamentPanel';
import { useGame } from './game/useGame';

export function App() {
  const game = useGame();

  return (
    <main className="app">
      <div className="app-header-row">
        <h1>Chao Draft</h1>
        {/* Always-available restart (playtest-prep fix, 2026-08-21) — there
            was previously no way to start over short of refreshing the page,
            which loses everything since there's no save/load yet. */}
        <button type="button" className="restart-button" onClick={game.restartGame}>
          Restart
        </button>
      </div>
      <p className="subtitle">
        Draft cards, bond them onto your Chao, then compete in the Tournament. See{' '}
        <code>docs/03-roadmap/roadmap.md</code> for scope.
      </p>

      {game.raceResult ? (
        <RaceResultsScreen result={game.raceResult} onContinue={game.dismissRaceResult} />
      ) : (
        <>
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
              onChoose={game.chooseHabitat}
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
                usedPoolIndices={game.usedPoolIndices}
                selectedTechniqueIds={game.selectedTechniqueIds}
                actionMessage={game.actionMessage}
                onDismissActionMessage={game.dismissActionMessage}
                onBondCard={game.bondBondCard}
                onAwakenBondCard={game.awakenBondCard}
                onConsumePotion={game.consumePotionCard}
                onToggleTechnique={game.toggleTechnique}
              />
              <EnvironmentPanel environment={game.environment} onPlantSeed={game.plantSeed} />
              <TournamentPanel
                tournament={game.tournament}
                loadedTechniqueCount={game.selectedTechniqueIds.size}
                onRunNextRace={game.runNextGroupRace}
                onRunFinalRace={game.runFinalRace}
                onRestart={game.restartGame}
              />
              <EventLogPanel log={game.log} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
