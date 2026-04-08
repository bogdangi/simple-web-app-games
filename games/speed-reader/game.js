const STORAGE_KEY = 'speed-reader-progress';
const MIN_WPM = 60;
// Accuracy thresholds: fraction of parts answered correctly
const ACCURACY_HIGH = 2 / 3; // comfortable / good progress
const ACCURACY_LOW  = 1 / 3; // struggling

// Returns today's date as a local-time YYYY-MM-DD string.
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const MAX_WPM = 400;
const DIAGNOSTIC_SPEEDS = [80, 120, 160, 200, 250];
const RECENT_ROUNDS_COUNT = 7;

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const p = JSON.parse(saved);
            if (typeof p !== 'object' || p === null || Array.isArray(p)) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                if (p.phraseMode === undefined) p.phraseMode = false;
                if (!p.recentWpms) p.recentWpms = [];
                return p;
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    return { wpm: 100, level: 1, points: 0, recentWpms: [], usedTexts: {}, lang: 'en', phraseMode: false, history: [], streak: { lastDate: null, count: 0 }, bestWpm: {}, langStats: {} };
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function computeLevel(recentWpms) {
    if (!recentWpms || recentWpms.length === 0) return null;
    const slice = recentWpms.slice(-RECENT_ROUNDS_COUNT);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

const progress = loadProgress();
// Migrate legacy saves: ensure points field exists
if (progress.points === undefined) progress.points = 0;
// Ensure usedTexts is per-language
if (Array.isArray(progress.usedTexts)) {
    progress.usedTexts = { en: progress.usedTexts };
    saveProgress(progress);
}

// Sync language: URL param > localStorage from main page > saved progress
const urlLang = new URLSearchParams(window.location.search).get('lang');
let lang = urlLang || localStorage.getItem('app-language') || progress.lang || 'en';

function t(key) {
    return UI[lang][key] || UI.en[key] || key;
}

// Game state
let currentTextIndex = -1;
let currentPart = 0;
let partWpm = progress.wpm;
let partResults = [];
let wordTimer = null;

// Reading-screen state (lifted to module level for controls)
let isPaused = false;
let readingWords = [];
let readingWordIndex = 0;
let readingChunkSize = 1;
let readingChunks = null;  // precomputed phrase-mode chunks (array of word arrays) or null
let readingChunkIndex = 0; // current position in readingChunks
let effectivePartWpm = 100; // WPM after complexity cap; set in startPart, used everywhere
let partComplexity = 0;   // avg word length for current part; computed once in startPart
let lastChunkWords = []; // the chunk currently on screen, used to reschedule timer on WPM change
// Diagnostic state
let isDiagnostic = false;
let diagnosticStep = 0;
let diagnosticPassed = MIN_WPM;

// DOM
const wpmDisplay = document.getElementById('wpm-display');
const levelDisplay = document.getElementById('level-display');
const langSelect = document.getElementById('lang-select');
const phraseModeToggle = document.getElementById('phrase-mode-toggle');
const screens = {
    start: document.getElementById('screen-start'),
    reading: document.getElementById('screen-reading'),
    question: document.getElementById('screen-question'),
    feedback: document.getElementById('screen-feedback'),
    summary: document.getElementById('screen-summary'),
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function updateUI() {
    document.querySelectorAll('[data-ui]').forEach(el => {
        const key = el.getAttribute('data-ui');
        const text = t(key);
        if (text) el.textContent = text;
    });
    document.title = t('title');
    updatePauseButton();
    updateHeader();
    updateSlider();
}

function updateHeader() {
    wpmDisplay.textContent = `${t('speed')}: ${progress.wpm} ${t('wpm')}`;
    levelDisplay.textContent = `${t('level')}: ${progress.level}`;
    document.getElementById('points-display').textContent = `${t('points')}: ${progress.points}`;
    const avgWpm = computeLevel(progress.recentWpms);
    if (avgWpm !== null) {
        document.getElementById('points-display').textContent += ` | ${t('avg')}: ${avgWpm} ${t('wpm')}`;
    }
}

function updateSlider() {
    const slider = document.getElementById('speed-slider');
    const display = document.getElementById('slider-value');
    if (slider) slider.value = progress.wpm;
    if (display) display.textContent = `${progress.wpm} ${t('wpm')}`;
}

function getTexts() {
    return TEXTS[lang] || TEXTS.en;
}

function pickText() {
    const texts = getTexts();
    const used = progress.usedTexts[lang] || [];
    const available = [];
    for (let i = 0; i < texts.length; i++) {
        if (!used.includes(i)) available.push(i);
    }
    if (available.length === 0) {
        progress.usedTexts[lang] = [];
        saveProgress(progress);
        return Math.floor(Math.random() * texts.length);
    }
    return available[Math.floor(Math.random() * available.length)];
}

function startRound() {
    currentTextIndex = pickText();
    currentPart = 0;
    partWpm = progress.wpm;
    partResults = [];
    startPart();
}

// Returns the display duration (ms) for a chunk of words, scaling up for
// longer words so that German compound words (and other long tokens) receive
// proportionally more reading time.
// Each word contributes: msPerWord * (wordLen / avgWordLen)^coefficient
// The chunk total is the sum, so word count and word length both matter.
//   coefficient 0   → flat timing (original behaviour)
//   coefficient 0.5 → square-root scaling (default, gentle but effective)
//   coefficient 1   → fully linear with word length
const LENGTH_COEFFICIENT = 0.5;
const AVG_WORD_LENGTH = 5; // typical average across Latin-script languages
// Very short words (1–2 chars) are treated as at least this many chars so
// that single letters like "I" or "a" don't flash by too quickly.
const MIN_WORD_LENGTH = 3;
// Absolute floor (ms) for any chunk regardless of WPM, to keep words legible.
const MIN_CHUNK_MS = 220;

// Pause multipliers applied after a chunk whose last word ends with punctuation.
// These give the reader's brain time to process clause/sentence boundaries,
// improving comprehension (see research on RSVP and sentence-boundary pauses).
const SENTENCE_END_PAUSE = 1.5; // after . ! ?
const CLAUSE_PAUSE = 1.2;       // after , ; :

function getChunkDisplayTime(chunkWords, msPerWord) {
    if (chunkWords.length === 0) return Math.max(msPerWord, MIN_CHUNK_MS);
    // Sum the scaled display time for each word so that both word count and
    // word length contribute to how long the chunk stays on screen.
    // Short words are floored to MIN_WORD_LENGTH to avoid overly brief flashes.
    const total = chunkWords.reduce((sum, word) => {
        const len = Math.max(word.length, MIN_WORD_LENGTH);
        const scale = Math.pow(len / AVG_WORD_LENGTH, LENGTH_COEFFICIENT);
        return sum + msPerWord * scale;
    }, 0);
    return Math.max(Math.round(total), MIN_CHUNK_MS);
}

// Returns a pause multiplier based on the trailing punctuation of the last
// word in the chunk. Sentence-ending punctuation gets a longer pause to let
// the reader process the completed thought.
function getPunctuationPause(chunkWords) {
    if (chunkWords.length === 0) return 1;
    const last = chunkWords[chunkWords.length - 1];
    if (/[.!?]$/.test(last)) return SENTENCE_END_PAUSE;
    if (/[,;:]$/.test(last)) return CLAUSE_PAUSE;
    return 1;
}

// Average letter length of words in a text (punctuation stripped), used to
// estimate reading difficulty. Higher values indicate more complex vocabulary.
function getTextComplexity(text) {
    const words = text
        .split(/\s+/)
        .map(w => w.replace(/[^\p{L}]/gu, ''))
        .filter(Boolean);
    if (words.length === 0) return 0;
    const totalChars = words.reduce((sum, w) => sum + w.length, 0);
    return totalChars / words.length;
}

// Soft speed cap: very long-word texts (e.g. German compound nouns, technical
// vocabulary) are capped at a lower WPM so comprehension doesn't suffer.
// Returns the effective WPM to use and whether the cap was applied.
// Accepts a pre-computed complexity value (avg letter length per word).
function getEffectiveWpm(complexity, wpm) {
    if (complexity >= 7.5) return { wpm: Math.min(wpm, 250), capped: wpm > 250 };
    if (complexity >= 6.5) return { wpm: Math.min(wpm, 350), capped: wpm > 350 };
    return { wpm, capped: false };
}

// Maximum words per chunk in standard (non-phrase) mode.
// At lower speeds, 1-word chunks keep each word legible; as speed increases
// the reader can handle 2–3 words at a time (up to MAX_CHUNK_SIZE).
const MAX_CHUNK_SIZE = 3;
const CHUNK_SIZE_WPM_STEP = 150; // one extra word per chunk for each step above 0

// Split text into phrase-boundary chunks. Each chunk ends at sentence-ending
// punctuation (. ! ?) or clause punctuation (, ; :), and is capped at
// MAX_PHRASE_WORDS words so individual chunks remain readable.
const MAX_PHRASE_WORDS = 5;
function buildPhraseChunks(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = [];
    let current = [];
    for (const word of words) {
        current.push(word);
        const isBoundary = /[.!?,;:]$/.test(word);
        if (isBoundary || current.length >= MAX_PHRASE_WORDS) {
            chunks.push([...current]);
            current = [];
        }
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
}

let questionTimer = null;

function clearQuestionTimer() {
    if (questionTimer) {
        clearTimeout(questionTimer);
        questionTimer = null;
    }
}

function showNextChunk() {
    if (isPaused) return;

    // Determine whether reading is complete (phrase mode uses chunk index; standard uses word index)
    const done = readingChunks !== null
        ? readingChunkIndex >= readingChunks.length
        : readingWordIndex >= readingWords.length;

    if (done) {
        wordTimer = null;
        clearQuestionTimer();
        questionTimer = setTimeout(() => {
            questionTimer = null;
            if (!isPaused) showQuestion();
        }, 500);
        return;
    }

    const readingText = document.getElementById('reading-text');
    const progressBar = document.getElementById('progress-bar');
    const msPerWord = 60000 / effectivePartWpm;

    let chunkWords;
    if (readingChunks !== null) {
        // Phrase mode: advance precomputed chunk array (O(1) per tick)
        chunkWords = readingChunks[readingChunkIndex++];
        readingWordIndex += chunkWords.length;
    } else {
        const end = Math.min(readingWordIndex + readingChunkSize, readingWords.length);
        chunkWords = readingWords.slice(readingWordIndex, end);
        readingWordIndex += chunkWords.length;
    }
    readingText.classList.remove('word-appear');
    void readingText.offsetWidth; // force reflow to restart animation
    readingText.textContent = chunkWords.join(' ');
    readingText.classList.add('word-appear');
    lastChunkWords = chunkWords;
    progressBar.style.width = ((readingWordIndex / readingWords.length) * 100) + '%';
    const displayTime = Math.round(getChunkDisplayTime(chunkWords, msPerWord) * getPunctuationPause(chunkWords));
    wordTimer = setTimeout(showNextChunk, displayTime);
}

function updatePauseButton() {
    const btn = document.getElementById('btn-pause');
    btn.textContent = isPaused ? '▶ ' + t('resume') : '⏸ ' + t('pause');
    document.getElementById('btn-replay').setAttribute('aria-label', t('replay'));
    document.getElementById('btn-replay').setAttribute('title', t('replay') + ' (R)');
    btn.setAttribute('title', (isPaused ? t('resume') : t('pause')) + ' (Space/Enter)');
    document.getElementById('btn-wpm-minus').setAttribute('title', '-10 ' + t('wpm') + ' (←)');
    document.getElementById('btn-wpm-plus').setAttribute('title', '+10 ' + t('wpm') + ' (→)');

}

function startPart() {
    document.getElementById('part-number').textContent = currentPart + 1;
    showScreen('reading');

    const texts = getTexts();
    const part = texts[currentTextIndex].parts[currentPart];
    partComplexity = getTextComplexity(part.text);
    const { wpm: cappedWpm, capped } = getEffectiveWpm(partComplexity, partWpm);
    const speedCappedNote = document.getElementById('speed-capped-note');
    effectivePartWpm = cappedWpm;
    document.getElementById('current-speed').textContent = effectivePartWpm;
    speedCappedNote.classList.toggle('hidden', !capped);
    speedCappedNote.textContent = capped
        ? `Effective speed: ${effectivePartWpm} WPM (target: ${partWpm} WPM)`
        : '';

    readingWords = part.text.split(/\s+/).filter(Boolean);
    readingWordIndex = 0;

    if (progress.phraseMode) {
        // Precompute all phrase chunks once so showNextChunk() is O(1) per tick
        readingChunks = buildPhraseChunks(part.text);
        readingChunkIndex = 0;
        readingChunkSize = null;
    } else {
        readingChunks = null;
        readingChunkSize = Math.max(1, Math.min(MAX_CHUNK_SIZE, Math.floor(effectivePartWpm / CHUNK_SIZE_WPM_STEP) + 1));
    }
    isPaused = false;

    document.getElementById('reading-text').textContent = '';
    document.getElementById('progress-bar').style.width = '0%';
    updatePauseButton();

    showNextChunk();
}

function togglePause() {
    if (!screens.reading.classList.contains('active')) return;
    isPaused = !isPaused;
    if (isPaused) {
        if (wordTimer !== null) {
            clearTimeout(wordTimer);
            wordTimer = null;
        }
    } else {
        showNextChunk();
    }
    updatePauseButton();
}

function replayPart() {
    if (!screens.reading.classList.contains('active')) return;
    if (wordTimer !== null) {
        clearTimeout(wordTimer);
        wordTimer = null;
    }
    readingWordIndex = 0;
    readingChunkIndex = 0;
    isPaused = false;
    document.getElementById('reading-text').textContent = '';
    document.getElementById('progress-bar').style.width = '0%';
    updatePauseButton();
    showNextChunk();
}

function adjustWpm(delta) {
    if (!screens.reading.classList.contains('active')) return;
    partWpm = Math.max(MIN_WPM, partWpm + delta);

    // Recompute effective WPM with cached complexity cap (O(1) — no text re-scan)
    const { wpm: cappedWpm, capped } = getEffectiveWpm(partComplexity, partWpm);
    effectivePartWpm = cappedWpm;
    document.getElementById('current-speed').textContent = effectivePartWpm;
    document.getElementById('speed-capped-note').classList.toggle('hidden', !capped);

    // Update standard-mode chunk size for new speed
    if (readingChunks === null) {
        readingChunkSize = Math.max(1, Math.min(MAX_CHUNK_SIZE, Math.floor(effectivePartWpm / CHUNK_SIZE_WPM_STEP) + 1));
    }

    // Reschedule the pending chunk timer using the new effective WPM and pause multiplier
    if (!isPaused && wordTimer !== null) {
        clearTimeout(wordTimer);
        const msPerWord = 60000 / effectivePartWpm;
        wordTimer = setTimeout(showNextChunk, Math.round(getChunkDisplayTime(lastChunkWords, msPerWord) * getPunctuationPause(lastChunkWords)));
    }
}

function showQuestion() {
    const texts = getTexts();
    const part = texts[currentTextIndex].parts[currentPart];
    document.getElementById('question-text').textContent = part.question;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    part.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.addEventListener('click', () => handleAnswer(i));
        container.appendChild(btn);
    });

    showScreen('question');
}

function handleAnswer(selected) {
    const texts = getTexts();
    const part = texts[currentTextIndex].parts[currentPart];
    const isCorrect = selected === part.correct;
    partResults.push(isCorrect);

    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        if (i === part.correct) btn.classList.add('correct');
        if (i === selected && !isCorrect) btn.classList.add('wrong');
    });

    setTimeout(() => showFeedback(isCorrect, part), 600);
}

function showFeedback(isCorrect, part) {
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const detail = document.getElementById('feedback-detail');
    const proofSection = document.getElementById('proof-section');
    const proofText = document.getElementById('proof-text');

    if (isDiagnostic) {
        proofSection.classList.add('hidden');
        if (isCorrect) {
            // Record the speed the user just passed, then advance to the next step.
            diagnosticPassed = DIAGNOSTIC_SPEEDS[diagnosticStep];
            diagnosticStep++;
            icon.textContent = '\u2713';
            icon.style.color = '#4ecca3';
            title.textContent = t('correct');
            if (diagnosticStep < DIAGNOSTIC_SPEEDS.length) {
                detail.textContent = t('diagnosticNext').replace('{wpm}', DIAGNOSTIC_SPEEDS[diagnosticStep]);
            } else {
                detail.textContent = t('diagnosticDone').replace('{wpm}', diagnosticPassed);
            }
        } else {
            // User failed at this speed. diagnosticPassed holds the last speed they
            // successfully passed (or MIN_WPM as the safe floor if they failed the
            // very first step), so we stop here and use that as the calibrated speed.
            icon.textContent = '\u2717';
            icon.style.color = '#e74c3c';
            title.textContent = t('notQuite');
            detail.textContent = t('diagnosticDone').replace('{wpm}', diagnosticPassed);
            diagnosticStep = DIAGNOSTIC_SPEEDS.length; // mark as done
        }
        showScreen('feedback');
        return;
    }

    if (isCorrect) {
        icon.textContent = '\u2713';
        icon.style.color = '#4ecca3';
        title.textContent = t('correct');
        detail.textContent = t('nextPartSpeed').replace('{wpm}', partWpm + 20);
        proofSection.classList.add('hidden');
        partWpm += 20;
    } else {
        icon.textContent = '\u2717';
        icon.style.color = '#e74c3c';
        title.textContent = t('notQuite');
        const correctAnswer = part.options[part.correct];
        detail.textContent = t('theAnswerWas').replace('{answer}', correctAnswer);
        proofSection.classList.remove('hidden');
        proofText.textContent = part.text;
    }

    showScreen('feedback');
}

document.getElementById('btn-next').addEventListener('click', () => {
    if (isDiagnostic) {
        if (diagnosticStep < DIAGNOSTIC_SPEEDS.length) {
            runDiagnosticStep();
        } else {
            finishDiagnostic();
        }
        return;
    }
    currentPart++;
    if (currentPart < 3) {
        startPart();
    } else {
        showSummary();
    }
});

function showSummary() {
    const correctCount = partResults.filter(r => r).length;

    const resultsContainer = document.getElementById('summary-results');
    resultsContainer.innerHTML = partResults.map((r, i) => `
        <div class="summary-part">
            <span class="label">${t('partLabel').replace('{n}', i + 1)}</span>
            <span class="result ${r ? 'correct' : 'wrong'}">${r ? t('resultCorrect') : t('resultWrong')}</span>
        </div>
    `).join('');

    let wpmDelta;
    let scoreLabel;
    if (correctCount === 3) {
        wpmDelta = 40;
        scoreLabel = t('scorePerfect');
    } else if (correctCount === 2) {
        wpmDelta = 20;
        scoreLabel = t('scoreGood');
    } else if (correctCount === 1) {
        wpmDelta = 0;
        scoreLabel = t('scoreNeedsWork');
    } else {
        wpmDelta = -20;
        scoreLabel = t('scorePractice');
    }

    document.getElementById('summary-score').textContent = scoreLabel;

    const newWpm = Math.max(MIN_WPM, progress.wpm + wpmDelta);
    const actualDelta = newWpm - progress.wpm;

    const wpmChangeEl = document.getElementById('summary-wpm-change');
    if (actualDelta > 0) {
        wpmChangeEl.innerHTML = `<span class="wpm-up">${t('speedUp').replace('{old}', progress.wpm).replace('{new}', newWpm).replace('{delta}', actualDelta)}</span>`;
    } else if (actualDelta < 0) {
        wpmChangeEl.innerHTML = `<span class="wpm-down">${t('speedDown').replace('{old}', progress.wpm).replace('{new}', newWpm).replace('{delta}', actualDelta)}</span>`;
    } else {
        wpmChangeEl.innerHTML = `<span class="wpm-same">${t('speedSame').replace('{wpm}', newWpm)}</span>`;
    }

    progress.wpm = newWpm;
    const pointsByScore = [-1, 0, 1, 2];
    const pointsDelta = pointsByScore[correctCount];
    progress.points = Math.max(0, progress.points + pointsDelta);
    progress.level = Math.floor(progress.points / 3) + 1;
    if (!progress.recentWpms) progress.recentWpms = [];
    progress.recentWpms.push(newWpm);
    if (progress.recentWpms.length > RECENT_ROUNDS_COUNT) {
        progress.recentWpms.shift();
    }
    if (!progress.usedTexts[lang]) progress.usedTexts[lang] = [];
    progress.usedTexts[lang].push(currentTextIndex);

    updateAnalytics({ lang, wpm: newWpm, correctCount, totalParts: 3 });

    saveProgress(progress);
    updateHeader();

    document.getElementById('analytics-section').innerHTML = buildAnalyticsHTML();
    document.getElementById('start-analytics').innerHTML = buildStartAnalyticsHTML();

    showScreen('summary');
}

// Diagnostic functions
function startDiagnostic() {
    isDiagnostic = true;
    diagnosticStep = 0;
    diagnosticPassed = MIN_WPM;
    runDiagnosticStep();
}

function runDiagnosticStep() {
    currentTextIndex = pickText();
    currentPart = 0;
    partWpm = DIAGNOSTIC_SPEEDS[diagnosticStep];
    partResults = [];
    const banner = document.getElementById('diagnostic-banner');
    if (banner) {
        banner.classList.remove('hidden');
        banner.textContent = t('diagnosticStep')
            .replace('{n}', diagnosticStep + 1)
            .replace('{total}', DIAGNOSTIC_SPEEDS.length);
    }
    startPart();
}

function finishDiagnostic() {
    isDiagnostic = false;
    progress.wpm = Math.max(MIN_WPM, diagnosticPassed);
    saveProgress(progress);
    updateSlider();
    updateHeader();
    const banner = document.getElementById('diagnostic-banner');
    if (banner) banner.classList.add('hidden');
    showScreen('start');
}

// Language switching
function normalizeLang(value) {
    const supportedLangs = Array.from(langSelect.options).map((option) => option.value);
    const fallbackLang = supportedLangs.includes(progress.lang)
        ? progress.lang
        : (supportedLangs.includes('en') ? 'en' : supportedLangs[0]);
    return supportedLangs.includes(value) ? value : fallbackLang;
}

lang = normalizeLang(lang);
langSelect.value = lang;
document.documentElement.lang = lang;
langSelect.addEventListener('change', () => {
    lang = normalizeLang(langSelect.value);
    langSelect.value = lang;
    document.documentElement.lang = lang;
    progress.lang = lang;
    saveProgress(progress);
    localStorage.setItem('app-language', lang);
    updateUI();
    document.getElementById('start-analytics').innerHTML = buildStartAnalyticsHTML();
    // If in the middle of reading or diagnostic, stop and go back to start
    if (wordTimer) {
        clearTimeout(wordTimer);
        wordTimer = null;
    }
    isPaused = false;
    isDiagnostic = false;
    document.getElementById('diagnostic-banner').classList.add('hidden');
    showScreen('start');
});

// Phrase mode toggle
phraseModeToggle.checked = progress.phraseMode;
phraseModeToggle.addEventListener('change', () => {
    progress.phraseMode = phraseModeToggle.checked;
    saveProgress(progress);
});

document.getElementById('btn-next-round').addEventListener('click', startRound);
document.getElementById('btn-start').addEventListener('click', startRound);
document.getElementById('btn-calibrate').addEventListener('click', startDiagnostic);

const speedSlider = document.getElementById('speed-slider');
speedSlider.addEventListener('input', () => {
    progress.wpm = parseInt(speedSlider.value, 10);
    document.getElementById('slider-value').textContent = `${progress.wpm} ${t('wpm')}`;
    saveProgress(progress);
    updateHeader();
});

// Reading controls
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-replay').addEventListener('click', replayPart);
document.getElementById('btn-wpm-minus').addEventListener('click', () => adjustWpm(-10));
document.getElementById('btn-wpm-plus').addEventListener('click', () => adjustWpm(10));

// Keyboard shortcuts (active only on the reading screen)
document.addEventListener('keydown', (e) => {
    if (!screens.reading.classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            adjustWpm(-10);
            break;
        case 'ArrowRight':
            e.preventDefault();
            adjustWpm(10);
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            replayPart();
            break;
    }
});

// Keyboard shortcuts: press 1-4 to pick an answer on the question screen
document.addEventListener('keydown', (e) => {
    if (!screens.question.classList.contains('active')) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const index = parseInt(e.key, 10) - 1;
    const buttons = document.querySelectorAll('.option-btn:not([disabled])');
    if (index >= 0 && index < buttons.length) {
        buttons[index].click();
    }
});

updateUI();
document.getElementById('start-analytics').innerHTML = buildStartAnalyticsHTML();

// ── Analytics helpers ─────────────────────────────────────────────────────────

function updateAnalytics(session) {
    // Ensure fields exist for old saves
    if (!progress.history) progress.history = [];
    if (!progress.streak) progress.streak = { lastDate: null, count: 0 };
    if (!progress.bestWpm) progress.bestWpm = {};
    if (!progress.langStats) progress.langStats = {};

    const today = getTodayDateString();

    // History (keep last 50 entries)
    progress.history.push({
        date: today,
        lang: session.lang,
        wpm: session.wpm,
        correctCount: session.correctCount,
        totalParts: session.totalParts,
    });
    if (progress.history.length > 50) progress.history = progress.history.slice(-50);

    // Streak
    const last = progress.streak.lastDate;
    if (last === today) {
        // already practiced today — no change
    } else if (isDateYesterday(last, today)) {
        progress.streak.count++;
        progress.streak.lastDate = today;
    } else {
        progress.streak = { lastDate: today, count: 1 };
    }

    // Per-language stats
    const ls = progress.langStats;
    if (!ls[session.lang]) ls[session.lang] = { sessions: 0, totalCorrect: 0, totalParts: 0 };
    ls[session.lang].sessions++;
    ls[session.lang].totalCorrect += session.correctCount;
    ls[session.lang].totalParts += session.totalParts;

    // Best comfortable WPM (accuracy ≥ ACCURACY_HIGH)
    if (session.totalParts > 0 && session.correctCount / session.totalParts >= ACCURACY_HIGH) {
        if (!progress.bestWpm[session.lang] || session.wpm > progress.bestWpm[session.lang]) {
            progress.bestWpm[session.lang] = session.wpm;
        }
    }
}

function isDateYesterday(dateStr, today) {
    if (!dateStr) return false;
    // Parse today's local YYYY-MM-DD and compute yesterday using local date arithmetic
    // to avoid UTC-offset surprises from toISOString().
    const [y, m, d] = today.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
    return dateStr === prevStr;
}

function computeRecommendedSpeed(langHistory, currentWpm) {
    const last5 = langHistory.slice(-5);
    if (last5.length === 0) return currentWpm;
    const totalCorrect = last5.reduce((s, h) => s + h.correctCount, 0);
    const totalParts = last5.reduce((s, h) => s + h.totalParts, 0);
    const acc = totalParts > 0 ? totalCorrect / totalParts : 0;
    if (acc >= ACCURACY_HIGH) return currentWpm + 20;
    if (acc < ACCURACY_LOW) return Math.max(MIN_WPM, currentWpm - 20);
    return currentWpm;
}

function buildSpeedChart(sessions) {
    if (sessions.length === 0) return '';
    const maxWpm = Math.max(...sessions.map(h => h.wpm), MIN_WPM);
    const H = 56, barW = 18, gap = 4;
    const W = sessions.length * (barW + gap) - gap;
    const bars = sessions.map((h, i) => {
        const barH = Math.max(4, Math.round((h.wpm / maxWpm) * H));
        const x = i * (barW + gap);
        const y = H - barH;
        const acc = h.correctCount / h.totalParts;
        const color = acc >= ACCURACY_HIGH ? '#4ecca3' : acc >= ACCURACY_LOW ? '#f39c12' : '#e74c3c';
        return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="2"><title>${h.wpm} ${t('wpm')}, ${Math.round(acc * 100)}%</title></rect>`;
    }).join('');
    return `<svg class="speed-chart-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${bars}</svg>`;
}

function buildAnalyticsHTML() {
    if (!progress.history) return '';
    const langHistory = progress.history.filter(h => h.lang === lang);
    const last10 = langHistory.slice(-10);

    let html = `<h3 class="analytics-title">${t('analytics')}</h3>`;

    if (last10.length === 0) {
        html += `<p class="analytics-empty">${t('noHistory')}</p>`;
        return html;
    }

    // Streak
    const streak = (progress.streak && progress.streak.count) || 0;
    if (streak > 0) {
        html += `<div class="analytics-streak">\uD83D\uDD25 ${streak} ${t('dayStreak')}</div>`;
    }

    // Rolling accuracy for current lang
    const totalCorrect = last10.reduce((s, h) => s + h.correctCount, 0);
    const totalParts10 = last10.reduce((s, h) => s + h.totalParts, 0);
    const rollingAcc = totalParts10 > 0 ? Math.round((totalCorrect / totalParts10) * 100) : 0;
    html += `<div class="analytics-row">
        <span class="analytics-label">${t('rollingAccuracy')}</span>
        <div class="acc-bar-wrap"><div class="acc-bar" style="width:${rollingAcc}%"></div></div>
        <span class="acc-value">${rollingAcc}%</span>
    </div>`;

    // Speed vs comprehension chart
    html += `<div class="analytics-row analytics-chart-wrap">
        <span class="analytics-label">${t('speedHistory')}</span>
        ${buildSpeedChart(last10)}
        <span class="chart-legend">
            <span class="dot dot-green"></span>&ge;2/3
            <span class="dot dot-yellow"></span>&ge;1/3
            <span class="dot dot-red"></span>&lt;1/3
        </span>
    </div>`;

    // Best comfortable speed
    const bestWpm = progress.bestWpm && progress.bestWpm[lang];
    if (bestWpm) {
        html += `<div class="analytics-row">
            <span class="analytics-label">${t('bestComfortableSpeed')}</span>
            <strong class="analytics-value">${bestWpm} ${t('wpm')}</strong>
        </div>`;
    }

    // Recommended speed
    const rec = computeRecommendedSpeed(langHistory, progress.wpm);
    const last5acc = (() => {
        const l5 = langHistory.slice(-5);
        if (!l5.length) return 0;
        const c = l5.reduce((s, h) => s + h.correctCount, 0);
        const p = l5.reduce((s, h) => s + h.totalParts, 0);
        return p > 0 ? c / p : 0;
    })();
    const trendKey = last5acc >= ACCURACY_HIGH ? 'pushForward' : last5acc < ACCURACY_LOW ? 'slowDown' : 'maintain';
    html += `<div class="analytics-row">
        <span class="analytics-label">${t('recommendedSpeed')}</span>
        <strong class="analytics-value">${rec} ${t('wpm')}</strong>
        <span class="analytics-trend ${trendKey}">${t(trendKey)}</span>
    </div>`;

    // Per-language stats (only if more than one language used)
    const ls = progress.langStats || {};
    const langs = Object.keys(ls);
    if (langs.length > 1) {
        html += `<div class="analytics-row lang-stats-wrap">
            <span class="analytics-label">${t('langStats')}</span>
            <div class="lang-stats-grid">
            ${langs.map(l => {
                const s = ls[l];
                const a = s.totalParts > 0 ? Math.round((s.totalCorrect / s.totalParts) * 100) : 0;
                return `<div class="lang-stat-item"><span class="lang-name">${l}</span><span>${s.sessions} ${t('sessions')}</span><span class="acc-chip ${a >= 70 ? 'chip-green' : a >= 50 ? 'chip-yellow' : 'chip-red'}">${a}%</span></div>`;
            }).join('')}
            </div>
        </div>`;
    }

    return html;
}

function buildStartAnalyticsHTML() {
    if (!progress.history || progress.history.length === 0) return '';
    const streak = (progress.streak && progress.streak.count) || 0;
    const langHistory = progress.history.filter(h => h.lang === lang);
    const last10 = langHistory.slice(-10);
    if (last10.length === 0 && streak === 0) return '';

    const totalCorrect = last10.reduce((s, h) => s + h.correctCount, 0);
    const totalParts = last10.reduce((s, h) => s + h.totalParts, 0);
    const rollingAcc = totalParts > 0 ? Math.round((totalCorrect / totalParts) * 100) : 0;
    const bestWpm = (progress.bestWpm && progress.bestWpm[lang]) || null;

    let chips = '';
    if (streak > 0) chips += `<span class="stat-chip">\uD83D\uDD25 ${streak} ${t('dayStreak')}</span>`;
    if (last10.length > 0) chips += `<span class="stat-chip">${t('rollingAccuracy')}: ${rollingAcc}%</span>`;
    if (bestWpm) chips += `<span class="stat-chip">\u2605 ${bestWpm} ${t('wpm')}</span>`;

    return chips ? `<div class="start-stats-row">${chips}</div>` : '';
}
