export const BALANCE = {
  initialBlood: 100, amputationDamage: 8, amputationBleeding: 3,
  aggravatedDamage: 5, aggravatedBleeding: 1, limbs: 4,
  repetitionLimit: 3, quietTurnLimit: 80,
  depths: { EASY: 2, NORMAL: 4, HARD: 6 },
  searchMs: { EASY: 180, NORMAL: 700, HARD: 1800 },
  moveMs: 340, injuryMs: 780, aiPauseMs: 620,
} as const;
