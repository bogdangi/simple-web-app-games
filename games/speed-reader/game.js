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

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return { wpm: 100, level: 1, usedTexts: {}, lang: 'en', history: [], streak: { lastDate: null, count: 0 }, bestWpm: {}, langStats: {} };
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const progress = loadProgress();
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
let lastChunkWords = []; // the chunk currently on screen, used to reschedule timer on WPM change

// DOM
const wpmDisplay = document.getElementById('wpm-display');
const levelDisplay = document.getElementById('level-display');
const langSelect = document.getElementById('lang-select');
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
    updatePauseButton();
    updateHeader();
}

function updateHeader() {
    wpmDisplay.textContent = `${t('speed')}: ${progress.wpm} ${t('wpm')}`;
    levelDisplay.textContent = `${t('level')}: ${progress.level}`;
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

let questionTimer = null;

function clearQuestionTimer() {
    if (questionTimer) {
        clearTimeout(questionTimer);
        questionTimer = null;
    }
}

function showNextChunk() {
    if (isPaused) return;
    if (readingWordIndex >= readingWords.length) {
        wordTimer = null;
        clearQuestionTimer();
        questionTimer = setTimeout(() => {
            questionTimer = null;
            if (!isPaused && readingWordIndex >= readingWords.length) {
                showQuestion();
            }
        }, 500);
        return;
    }
    const readingText = document.getElementById('reading-text');
    const progressBar = document.getElementById('progress-bar');
    const msPerWord = 60000 / partWpm;

    const end = Math.min(readingWordIndex + readingChunkSize, readingWords.length);
    const chunkWords = readingWords.slice(readingWordIndex, end);
    readingText.classList.remove('word-appear');
    void readingText.offsetWidth; // force reflow to restart animation
    readingText.textContent = chunkWords.join(' ');
    readingText.classList.add('word-appear');
    readingWordIndex = end;
    lastChunkWords = chunkWords;
    progressBar.style.width = ((readingWordIndex / readingWords.length) * 100) + '%';
    wordTimer = setTimeout(showNextChunk, getChunkDisplayTime(chunkWords, msPerWord));
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
    document.getElementById('current-speed').textContent = partWpm;
    showScreen('reading');

    const texts = getTexts();
    const part = texts[currentTextIndex].parts[currentPart];
    readingWords = part.text.split(/\s+/);
    readingWordIndex = 0;
    readingChunkSize = Math.max(1, Math.min(3, Math.floor(partWpm / 150) + 1));
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
    isPaused = false;
    document.getElementById('reading-text').textContent = '';
    document.getElementById('progress-bar').style.width = '0%';
    updatePauseButton();
    showNextChunk();
}

function adjustWpm(delta) {
    if (!screens.reading.classList.contains('active')) return;
    partWpm = Math.max(MIN_WPM, partWpm + delta);
    document.getElementById('current-speed').textContent = partWpm;
    readingChunkSize = Math.max(1, Math.min(3, Math.floor(partWpm / 150) + 1));
    // Reschedule the pending chunk timer using the new WPM so the display
    // duration of the current on-screen chunk reflects the updated speed.
    if (!isPaused && wordTimer !== null) {
        clearTimeout(wordTimer);
        const msPerWord = 60000 / partWpm;
        wordTimer = setTimeout(showNextChunk, getChunkDisplayTime(lastChunkWords, msPerWord));
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
    progress.level++;
    if (!progress.usedTexts[lang]) progress.usedTexts[lang] = [];
    progress.usedTexts[lang].push(currentTextIndex);

    updateAnalytics({ lang, wpm: newWpm, correctCount, totalParts: 3 });

    saveProgress(progress);
    updateHeader();

    document.getElementById('analytics-section').innerHTML = buildAnalyticsHTML();
    document.getElementById('start-analytics').innerHTML = buildStartAnalyticsHTML();

    showScreen('summary');
}

// Language switching
langSelect.value = lang;
langSelect.addEventListener('change', () => {
    lang = langSelect.value;
    progress.lang = lang;
    saveProgress(progress);
    localStorage.setItem('app-language', lang);
    updateUI();
    document.getElementById('start-analytics').innerHTML = buildStartAnalyticsHTML();
    // If in the middle of reading, stop and go back to start
    if (wordTimer) {
        clearTimeout(wordTimer);
        wordTimer = null;
    }
    isPaused = false;
    showScreen('start');
});

document.getElementById('btn-next-round').addEventListener('click', startRound);
document.getElementById('btn-start').addEventListener('click', startRound);

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

    // Best comfortable WPM (≥ ACCURACY_HIGH correct)
    if (session.correctCount >= 2) {
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
    if (acc >= 0.8) return currentWpm + 20;
    if (acc < 0.5) return Math.max(MIN_WPM, currentWpm - 20);
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
            <span class="dot dot-yellow"></span>1/3
            <span class="dot dot-red"></span>0/3
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
    const trendKey = last5acc >= 0.8 ? 'pushForward' : last5acc < 0.5 ? 'slowDown' : 'maintain';
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
    if (last10.length > 0) chips += `<span class="stat-chip">${t('rollingAccuracy').split('(')[0].trim()}: ${rollingAcc}%</span>`;
    if (bestWpm) chips += `<span class="stat-chip">\u2605 ${bestWpm} ${t('wpm')}</span>`;

    return chips ? `<div class="start-stats-row">${chips}</div>` : '';
}
