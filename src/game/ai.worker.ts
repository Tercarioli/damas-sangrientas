import { chooseMove, difficultyConfig } from './ai';
import type { GameSettings, GameState } from './types';
self.onmessage = (event: MessageEvent<{ state: GameState; difficulty: GameSettings['difficulty'] }>) => {
  const { state, difficulty } = event.data, config = difficultyConfig(difficulty);
  self.postMessage(chooseMove(state, config.depth, config.timeMs));
};
