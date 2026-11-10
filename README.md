# BattamBeef website (investor demo)

Frontend-only demo. Project rules live in `CLAUDE.md`; the build kit and daily prompts in `kit/`.

## Commands

```bash
npm run dev          # local dev server
npm run lint
npm run typecheck
npm run build        # production build
npm run test:e2e     # browser checks (Playwright, needs a build first)
```

## Where things are

- `src/app/[locale]/` pages (`en`, `km`); `styleguide/` is hidden and not linked
- `src/components/motion/` the interaction kit
- `src/components/shell/` header, mobile menu, bottom bar, footer
- `src/lib/data/` all content, read through the getters in `src/lib/data/index.ts`
- `messages/en.json`, `messages/km.json` all text (`TODO-KM` = Khmer copy still needed)
