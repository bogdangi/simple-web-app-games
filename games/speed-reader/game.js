const STORAGE_KEY = 'speed-reader-progress';
const MIN_WPM = 60;

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return { wpm: 100, level: 1, usedTexts: {}, lang: 'en' };
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

function startPart() {
    document.getElementById('part-number').textContent = currentPart + 1;
    document.getElementById('current-speed').textContent = partWpm;
    showScreen('reading');

    const texts = getTexts();
    const part = texts[currentTextIndex].parts[currentPart];
    const words = part.text.split(/\s+/);
    const msPerWord = 60000 / partWpm;

    const readingText = document.getElementById('reading-text');
    const progressBar = document.getElementById('progress-bar');
    let wordIndex = 0;

    const chunkSize = Math.max(1, Math.min(3, Math.floor(partWpm / 150) + 1));

    readingText.textContent = '';
    progressBar.style.width = '0%';

    function showNextChunk() {
        if (wordIndex >= words.length) {
            wordTimer = null;
            setTimeout(() => showQuestion(), 500);
            return;
        }
        const end = Math.min(wordIndex + chunkSize, words.length);
        const chunkWords = words.slice(wordIndex, end);
        readingText.classList.remove('word-appear');
        void readingText.offsetWidth; // force reflow to restart animation
        readingText.textContent = chunkWords.join(' ');
        readingText.classList.add('word-appear');
        wordIndex = end;
        progressBar.style.width = ((wordIndex / words.length) * 100) + '%';
        wordTimer = setTimeout(showNextChunk, getChunkDisplayTime(chunkWords, msPerWord));
    }

    showNextChunk();
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
    saveProgress(progress);
    updateHeader();

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
    // If in the middle of reading, stop and go back to start
    if (wordTimer) {
        clearTimeout(wordTimer);
        wordTimer = null;
    }
    showScreen('start');
});

document.getElementById('btn-next-round').addEventListener('click', startRound);
document.getElementById('btn-start').addEventListener('click', startRound);

updateUI();
