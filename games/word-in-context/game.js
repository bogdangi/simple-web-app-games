const STORAGE_KEY = 'word-in-context-progress';
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 15;
const DEFAULT_QUESTIONS = 10;

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const p = JSON.parse(saved);
            if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
                return p;
            }
        } catch (e) {
            // fall through
        }
        localStorage.removeItem(STORAGE_KEY);
    }
    return { totalScore: 0, totalPlayed: 0, streak: 0, bestStreak: 0, usedIndices: {}, lang: 'en' };
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const progress = loadProgress();

// Sync language from URL param, app-level localStorage, or saved progress
const urlLang = new URLSearchParams(window.location.search).get('lang');
let lang = urlLang || localStorage.getItem('app-language') || progress.lang || 'en';
if (!UI[lang]) lang = 'en';

function t(key) {
    return (UI[lang] && UI[lang][key]) || (UI.en && UI.en[key]) || key;
}

// ─── Game state ───────────────────────────────────────────────────────────────
let questionsPerRound = DEFAULT_QUESTIONS;
let roundQuestions = [];      // shuffled puzzles for this round
let currentIndex = 0;         // position in roundQuestions
let roundScore = 0;
let roundHistory = [];        // { correct: bool } per question

// ─── DOM references ───────────────────────────────────────────────────────────
const screens = {
    start: document.getElementById('screen-start'),
    question: document.getElementById('screen-question'),
    feedback: document.getElementById('screen-feedback'),
    summary: document.getElementById('screen-summary'),
};

const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const questionCounter = document.getElementById('question-counter');
const progressBar = document.getElementById('progress-bar');
const sentenceText = document.getElementById('sentence-text');
const sentenceArea = document.getElementById('sentence-area');
const optionsContainer = document.getElementById('options-container');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackTitle = document.getElementById('feedback-title');
const correctWordBox = document.getElementById('correct-word-box');
const correctWasLabel = document.getElementById('correct-was-label');
const correctWordValue = document.getElementById('correct-word-value');
const explanationLabel = document.getElementById('explanation-label');
const explanationText = document.getElementById('explanation-text');
const summaryScoreDisplay = document.getElementById('summary-score-display');
const summaryMessage = document.getElementById('summary-message');
const summaryBreakdown = document.getElementById('summary-breakdown');
const langSelect = document.getElementById('lang-select');
const qtyMinus = document.getElementById('qty-minus');
const qtyPlus = document.getElementById('qty-plus');
const qtyValue = document.getElementById('qty-value');

// ─── Screen management ────────────────────────────────────────────────────────
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ─── UI text rendering ────────────────────────────────────────────────────────
function updateUIText() {
    document.querySelectorAll('[data-ui]').forEach(el => {
        const key = el.getAttribute('data-ui');
        const text = t(key);
        if (text) el.textContent = text;
    });
    updateStatsDisplay();
    qtyValue.textContent = questionsPerRound;
}

function updateStatsDisplay() {
    scoreDisplay.textContent = `${t('score')}: ${progress.totalScore}`;
    streakDisplay.textContent = `${t('streak')}: ${progress.streak}`;
}

// ─── Puzzle pool ──────────────────────────────────────────────────────────────
function getPuzzles() {
    return PUZZLES[lang] || PUZZLES.en || [];
}

function pickRoundPuzzles() {
    const pool = getPuzzles();
    const used = progress.usedIndices[lang] || [];

    // Reset used indices if we've cycled through all puzzles
    let available = pool.map((_, i) => i).filter(i => !used.includes(i));
    if (available.length < questionsPerRound) {
        progress.usedIndices[lang] = [];
        available = pool.map((_, i) => i);
    }

    // Shuffle and pick
    const shuffled = available.slice().sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(questionsPerRound, pool.length));
    progress.usedIndices[lang] = (progress.usedIndices[lang] || []).concat(picked);
    saveProgress();

    return picked.map(i => ({
        ...pool[i],
        options: pool[i].options.slice().sort(() => Math.random() - 0.5),
    }));
}

// ─── Game flow ────────────────────────────────────────────────────────────────
function startRound() {
    roundQuestions = pickRoundPuzzles();
    currentIndex = 0;
    roundScore = 0;
    roundHistory = [];
    showQuestion();
}

function showQuestion() {
    showScreen('question');
    const puzzle = roundQuestions[currentIndex];

    // Progress info
    questionCounter.textContent = `${t('question')} ${currentIndex + 1} ${t('of')} ${roundQuestions.length}`;
    const pct = Math.round(((currentIndex + 1) / roundQuestions.length) * 100);
    progressBar.style.width = `${pct}%`;
    progressBar.parentElement.setAttribute('aria-valuenow', pct);

    // Sentence with blank highlighted
    const parts = puzzle.sentence.split('___');
    sentenceText.innerHTML = parts[0] + '<span class="blank">___</span>' + (parts[1] || '');
    sentenceArea.setAttribute('aria-label', t('readingTextLabel'));

    // Options
    optionsContainer.innerHTML = '';
    puzzle.options.forEach(word => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = word;
        btn.addEventListener('click', () => handleAnswer(word, btn));
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(chosen, btn) {
    // Disable all buttons
    optionsContainer.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        b.classList.add('disabled');
    });

    const puzzle = roundQuestions[currentIndex];
    const isCorrect = chosen === puzzle.answer;

    if (isCorrect) {
        btn.classList.add('correct');
        roundScore++;
        progress.streak++;
        if (progress.streak > progress.bestStreak) progress.bestStreak = progress.streak;
    } else {
        btn.classList.add('wrong');
        // Highlight the correct answer
        optionsContainer.querySelectorAll('.option-btn').forEach(b => {
            if (b.textContent === puzzle.answer) b.classList.add('correct');
        });
        progress.streak = 0;
    }

    roundHistory.push({ correct: isCorrect, chosen });
    progress.totalPlayed++;
    if (isCorrect) progress.totalScore++;
    updateStatsDisplay();
    saveProgress();

    // Show feedback after a short visual delay
    setTimeout(() => showFeedback(isCorrect, chosen, puzzle), 700);
}

function showFeedback(isCorrect, chosen, puzzle) {
    showScreen('feedback');

    if (isCorrect) {
        feedbackIcon.textContent = '✅';
        feedbackTitle.textContent = t('correct');
        correctWordBox.classList.add('hidden');
        explanationLabel.textContent = t('whyCorrect');
        explanationText.textContent = puzzle.correctExplanation || '';
    } else {
        feedbackIcon.textContent = '❌';
        feedbackTitle.textContent = t('wrongChoice');
        correctWordBox.classList.remove('hidden');
        correctWasLabel.textContent = t('correctWas');
        correctWordValue.textContent = puzzle.answer;
        explanationLabel.textContent = t('whyWrong');
        explanationText.textContent = (puzzle.explanations && puzzle.explanations[chosen]) || '';
    }
}

function goNext() {
    currentIndex++;
    if (currentIndex >= roundQuestions.length) {
        showSummary();
    } else {
        showQuestion();
    }
}

function showSummary() {
    showScreen('summary');

    const total = roundQuestions.length;
    const pct = Math.round((roundScore / total) * 100);

    summaryScoreDisplay.innerHTML = `
        <div class="summary-score">${roundScore} / ${total}</div>
        <div class="summary-pct">${pct}%</div>
    `;

    let msgKey = 'keepPracticing';
    if (pct === 100) msgKey = 'perfect';
    else if (pct >= 70) msgKey = 'great';
    else if (pct >= 50) msgKey = 'good';
    summaryMessage.textContent = t(msgKey);

    summaryBreakdown.innerHTML = roundHistory.map((r, i) => {
        const puzzle = roundQuestions[i];
        const cls = r.correct ? 'correct' : 'wrong';
        const icon = r.correct ? '✅' : '❌';
        const shortSentence = puzzle.sentence.replace('___', `<strong>${puzzle.answer}</strong>`);
        return `<div class="breakdown-item ${cls}">${icon} ${shortSentence}</div>`;
    }).join('');
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startRound);
document.getElementById('btn-next').addEventListener('click', goNext);
document.getElementById('btn-play-again').addEventListener('click', () => {
    showScreen('start');
    updateUIText();
});

qtyMinus.addEventListener('click', () => {
    if (questionsPerRound > MIN_QUESTIONS) {
        questionsPerRound--;
        qtyValue.textContent = questionsPerRound;
    }
});
qtyPlus.addEventListener('click', () => {
    if (questionsPerRound < MAX_QUESTIONS) {
        questionsPerRound++;
        qtyValue.textContent = questionsPerRound;
    }
});

langSelect.value = lang;
document.documentElement.lang = lang;
langSelect.addEventListener('change', () => {
    lang = langSelect.value;
    if (!UI[lang]) lang = 'en';
    langSelect.value = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('app-language', lang);
    progress.lang = lang;
    saveProgress();
    updateUIText();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateUIText();
    showScreen('start');
});
