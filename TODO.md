# Work Plan

## Backlog (Analyst Findings)

### P0 — Bugs (functional issues)
_All P0 bugs fixed — moved to Done_

### P1 — i18n (untranslated strings visible to users)
_All P1 bugs fixed — moved to Done_

### P2 — Accessibility
_All P2 bugs fixed — moved to Done_

### P3 — Responsive design
_All P3 bugs fixed — moved to Done_

### P4 — Low priority / polish
_All P4 bugs fixed — moved to Done_

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
- [x] UI-005: Fixed CSS selector `#qty-value` → `#questions-count` in WIC style.css
- [x] UI-006: Removed empty `aria-label=""` from WIC sentence-area div
- [x] UI-008: Added `aria-label` to speed-reader control buttons (-10, restart, +10)
- [x] UI-009: Added `.btn-secondary:focus-visible` style in speed-reader
- [x] UI-010: Added `.filter-btn:focus-visible` style in vocabulary page
- [x] UI-012: Home h1 uses `clamp(1.8rem, 5vw, 2.5rem)` — scales on narrow viewports
- [x] UI-014: Vocab grid uses `minmax(min(280px, 100%), 1fr)` — no overflow at 320px
- [x] QA-005: Replaced biased sort shuffle with Fisher-Yates in WIC game.js
- [x] QA-011: Added MAX_WPM cap to speed-reader adjustWpm function
- [x] UI-016: Removed `!important` from WIC `.hidden` class for consistency
- [x] UI-021: Added offline fallback Response in SW when both fetch and cache miss

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
