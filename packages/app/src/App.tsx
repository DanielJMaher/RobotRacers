import './App.css';
import { DraftScreen } from './components/DraftScreen';
import { GardenScreen } from './components/GardenScreen';
import { useGame } from './game/useGame';

export function App() {
  const game = useGame();

  return (
    <main className="app">
      <h1>Chao Draft</h1>
      <p className="subtitle">
        Draft cards, bond them onto your Chao, then run a Race. See{' '}
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

      {game.phase === 'garden' && game.chao && (
        <GardenScreen
          chao={game.chao}
          pool={game.playerPool}
          log={game.log}
          onBondCard={game.bondBondCard}
          onConsumeRegimen={game.consumeRegimenCard}
          onRunRace={game.runRace}
        />
      )}
    </main>
  );
}
