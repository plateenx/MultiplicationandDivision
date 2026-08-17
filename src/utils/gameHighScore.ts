// Game High Score management utility with localStorage persistence

const HIGH_SCORE_KEY_PREFIX = 'game_highscore_';

export const getGameHighScore = (gameId: string): number => {
  try {
    const val = localStorage.getItem(`${HIGH_SCORE_KEY_PREFIX}${gameId}`);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const saveGameHighScore = (gameId: string, currentScore: number): number => {
  try {
    const existing = getGameHighScore(gameId);
    if (currentScore > existing) {
      localStorage.setItem(`${HIGH_SCORE_KEY_PREFIX}${gameId}`, currentScore.toString());
      return currentScore;
    }
    return existing;
  } catch {
    return currentScore;
  }
};
