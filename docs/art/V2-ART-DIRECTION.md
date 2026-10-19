# V2 — The Second Offering

The user's supplied key visual establishes the art direction: detailed gothic pixel art, warm candlelight on worn wood, almost black blue shadows, an ominous gaze, and articulated wooden limbs collected in wire wastebaskets.

## Shipped assets and layers

- `public/art/workshop-v2.png`: original generated environmental background, 1680 × 944, approximately 2 MB. Created with the built-in ImageGen tool using the supplied key visual as a style/composition reference. No external image API, runtime downloads or stock assets.
- `src/render/board.ts`: live 8 × 8 perspective board and actual game pieces, drawn at 400 × 270 with nearest-neighbor display. The background contains no baked-in board or game pieces.
- `src/render/body.ts`: low-resolution wooden automata, persistent wounds and wire wastebaskets. Actual lost limbs are rendered inside the correct basket; the background contains no decorative amputations that could contradict health state.
- `src/render/bodyMotion.ts`: four independent falling trajectories, staggered within a multiple-capture injury sequence. Settled positions remain inside the basket. Heads are never detached.
- `src/render/projection.ts`: shared projection for drawing, DOM hit polygons and inverse mouse mapping. Normalized coordinates stay consistent across responsive screen sizes.
- `src/style.css`: readable dark metal health plates, blood bars, warm type, candle flicker and ambient particles. Reduced/off perception settings continue to work.

## Final ImageGen prompt

Use case: stylized-concept. Asset type: production videogame environment background, 16:9 wide landscape. Reference image is the attached LAST MOVE key visual, as style and atmosphere reference. Create a closely matching dark ornate candlelit workshop, meticulously crafted retro gothic pixel art, visibly square clustered pixels and limited amber/black/oxblood palette, dithered shadows, no smooth painterly rendering. Viewer seated facing a wooden tabletop. Top quarter: enormous ominous amber eyes barely visible in black darkness centered high, dangling strings and chains. At far left and far right only: tall warm candles, brass candleholders, old books and gears, dense intricate hand drawn pixel detail. Bottom two thirds: EMPTY FLAT dark brown wooden tabletop with subtle wood grain and warm candle glints; empty central area spanning x=20%-80% from y=28%-93% for a separately coded interactive checkerboard. The left and right lower margins should also be fairly dark and EMPTY for separately animated wooden puppets and wire wastebaskets. Crucial: do NOT draw a checkerboard, any board, any pieces, baskets, severed limbs, mannequins, characters or UI into the background. No text, no letters, no logo, no watermark. This is only the environmental layer; game objects will be rendered live. The result should have the same beautiful sinister candlelit pixel-art visual richness of the reference, while reserving clear usable central space.

## Version preservation

Git tag `v1.0.0` points to the original playable release at commit `002a7e6`. `public/v1/` contains the frozen original production build with relative asset and worker URLs. V2 links directly to `v1/index.html`, which also works in the local Vite development server. V2 development lives on `codex/v2-pixel-art`.
