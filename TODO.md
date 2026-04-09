# Work Plan

## Backlog (Analyst Findings)

### P0 — Bugs (functional issues)
_All P0 bugs fixed — moved to Done_

### P1 — i18n (untranslated strings visible to users)
_All P1 bugs fixed — moved to Done_

### P2 — Accessibility
- [ ] UI-005: WIC CSS `#qty-value` targets wrong ID — should be `#questions-count`, styling never applied
- [ ] UI-006: WIC `sentence-area` has empty `aria-label=""` — invisible to screen readers
- [ ] UI-008: Speed-reader control buttons (-10, restart, pause, +10) lack `aria-label` attributes
- [ ] UI-009: Speed-reader `.btn-secondary` has no `:focus-visible` style — no keyboard focus indicator
- [ ] UI-010: Vocabulary `.filter-btn` has no `:focus-visible` style — no keyboard focus indicator

### P3 — Responsive design
- [ ] UI-012: Home page h1 at `2.5rem` can overflow on narrow viewports with long translated titles (Ukrainian)
- [ ] UI-014: Vocabulary `.words-grid` uses `minmax(280px, 1fr)` — wider than 320px container, causes horizontal scroll

### P4 — Low priority / polish
- [ ] QA-005: WIC uses biased `Math.random() - 0.5` shuffle — not uniform distribution
- [ ] QA-011: Speed-reader in-round WPM has no upper bound via arrow keys (only floor at MIN_WPM)
- [ ] UI-016: `.hidden` class uses `!important` in WIC but not in other pages — inconsistent
- [ ] UI-021: SW returns `undefined` when offline + no cache match — no offline fallback page

## In Progress (Assigned by Coordinator)
<!-- Coordinator moves tasks here and assigns to Dev -->

## In Review
<!-- Dev completed, awaiting QA verification -->

## Done
- [x] QA-001/UI-004: Fixed WIC vocab language bug — use `lang` instead of `progress.lang`, sync on init
- [x] QA-010: Fixed speed-reader pause during question transition — togglePause now clears/restarts questionTimer
- [x] QA-012: Removed unused `words/*.json` from SW cache, bumped to `web-games-v6`
- [x] UI-001: Added `gamesListLabel` key to all 3 languages in `APP_UI` (app.js)
- [x] UI-002: Added `readingTextLabel` key to all 3 languages in speed-reader i18n.js
- [x] UI-003: Added `decreaseQuantity`/`increaseQuantity` keys to all 3 languages in WIC i18n.js

---

## Previously Planned Tasks

### Vocabulary Feature
- [ ] Sort words by seen count (descending) instead of encounter order
- [ ] Add sorting controls (alphabetical, by seen count, by fail rate)
- [ ] Distinguish vocabulary words from filler — use dictionary JSON to flag "interesting" words
- [ ] Consider pagination or collapsible language groups — 66 words after 5 questions is overwhelming
- [ ] Clarify language selector on vocab page — it changes UI language but not the word list
- [ ] Enrich dictionary JSON files with definitions, part of speech, examples

### General
- [ ] Fix "gamesListLabel" — `data-ui` key not defined in `APP_UI`, shows raw key in accessibility tree (→ UI-001)
- [ ] Add vocabulary tracking to Fluency Trainer if question format changes to single-word answers
