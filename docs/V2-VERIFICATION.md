# V2 verification

Date: 19 October 2026.

## Game logic preservation

The V2 diff leaves `engine.ts`, `health.ts`, `ai.ts`, `ai.worker.ts`, `balance.ts`, `types.ts` and `useGame.ts` unchanged. V1 is retained by tag `v1.0.0` and as its independent production build under `public/v1/`.

## Automated tests

47 tests in four files:

- 34 engine/AI/health tests, including three complete simulated games.
- 4 animation boundary regressions retained from V1.
- 5 projection tests, including all 64 square centers and all 64 DOM button bounding-box centers, board corners and rejection of table/frame clicks.
- 4 basket animation tests: joint origins, staggered multiple amputations, settled limbs inside the basket, and clamped animation times.

TypeScript and Vite production build checked. Production CSS resolves the generated background relative to the deployment directory. Both V1 and V2 include independent AI Worker URLs.

## Browser verification

- Perspective board: selection and legal destination clicks, automatic Keeper response, mandatory captures and multi-jump continuation.
- First amputation: human blood 92, bleeding 3, one detached arm remains inside the left basket.
- Complete V2 match: turn 19, human bleeds out with four missing limbs and four limbs in the basket; Keeper blood 26 with four collected limbs. No browser errors or warnings.
- Play Again: blood 100 for each side, 12 pieces each, no wounds, empty baskets, turn 1.
- Frozen V1 at `/v1/index.html`: original UI, legal player move and original Worker reply reaching turn 3, no errors.
- Visual review in a local iframe at 1440 × 900 and 375 × 812: main board and blood UI visible, no horizontal overflow. On narrow displays the character/basket panels follow the board and can require vertical scrolling.

Safari and auditory quality have not been independently tested. Essential movement/fall feedback remains active in reduced effects mode while decorative sway, dust and flicker are reduced or disabled.
