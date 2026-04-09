const LANG_KEY = 'app-language';

const UI = {
    en: {
        title: 'Your Vocabulary',
        backToGames: '\u2190 Back to Games',
        language: 'Language',
        filterAll: 'All',
        filterMastered: 'Mastered',
        filterLearning: 'Learning',
        filterNew: 'New',
        words: 'words',
        mastered: 'mastered',
        learning: 'learning',
        newLabel: 'new',
        seen: 'Seen',
        correct: 'correct',
        fail: 'failed',
        emptyState: 'Play some games to start building your vocabulary!',
    },
    de: {
        title: 'Dein Wortschatz',
        backToGames: '\u2190 Zur\u00fcck zu Spielen',
        language: 'Sprache',
        filterAll: 'Alle',
        filterMastered: 'Gemeistert',
        filterLearning: 'Lernend',
        filterNew: 'Neu',
        words: 'W\u00f6rter',
        mastered: 'gemeistert',
        learning: 'lernend',
        newLabel: 'neu',
        seen: 'Gesehen',
        correct: 'richtig',
        fail: 'falsch',
        emptyState: 'Spiele ein paar Spiele, um deinen Wortschatz aufzubauen!',
    },
    uk: {
        title: '\u0422\u0432\u0456\u0439 \u0441\u043b\u043e\u0432\u043d\u0438\u043a',
        backToGames: '\u2190 \u041d\u0430\u0437\u0430\u0434 \u0434\u043e \u0456\u0433\u043e\u0440',
        language: '\u041c\u043e\u0432\u0430',
        filterAll: '\u0412\u0441\u0456',
        filterMastered: '\u0412\u0438\u0432\u0447\u0435\u043d\u0456',
        filterLearning: '\u0412\u0438\u0432\u0447\u0430\u044e\u0442\u044c\u0441\u044f',
        filterNew: '\u041d\u043e\u0432\u0456',
        words: '\u0441\u043b\u0456\u0432',
        mastered: '\u0432\u0438\u0432\u0447\u0435\u043d\u043e',
        learning: '\u0432\u0438\u0432\u0447\u0430\u0454\u0442\u044c\u0441\u044f',
        newLabel: '\u043d\u043e\u0432\u0456',
        seen: '\u0411\u0430\u0447\u0435\u043d\u043e',
        correct: '\u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e',
        fail: '\u043f\u043e\u043c\u0438\u043b\u043a\u0438',
        emptyState: '\u0417\u0456\u0433\u0440\u0430\u0439 \u043a\u0456\u043b\u044c\u043a\u0430 \u0456\u0433\u043e\u0440, \u0449\u043e\u0431 \u043f\u043e\u0447\u0430\u0442\u0438 \u0431\u0443\u0434\u0443\u0432\u0430\u0442\u0438 \u0441\u0432\u0456\u0439 \u0441\u043b\u043e\u0432\u043d\u0438\u043a!',
    }
};

const SUPPORTED_LANGS = Object.keys(UI);
let lang = SUPPORTED_LANGS.includes(localStorage.getItem(LANG_KEY))
    ? localStorage.getItem(LANG_KEY) : 'en';
let currentFilter = 'all';

function t(key) {
    return (UI[lang] && UI[lang][key]) || UI.en[key] || key;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render() {
    document.querySelectorAll('[data-ui]').forEach(el => {
        const text = t(el.getAttribute('data-ui'));
        if (text) el.textContent = text;
    });

    if (!window.VocabTracker) return;

    const allWords = VocabTracker.getAllWords();
    const emptyEl = document.getElementById('empty-state');
    const listEl = document.getElementById('word-list');

    if (allWords.length === 0) {
        emptyEl.classList.remove('hidden');
        listEl.innerHTML = '';
        document.getElementById('stats-bar').innerHTML = '';
        return;
    }
    emptyEl.classList.add('hidden');

    var mastered = 0, learning = 0, newW = 0;
    for (var i = 0; i < allWords.length; i++) {
        if (allWords[i].mastery === 'mastered') mastered++;
        else if (allWords[i].mastery === 'learning') learning++;
        else newW++;
    }

    document.getElementById('stats-bar').innerHTML =
        '<span class="stat total">' + allWords.length + ' ' + t('words') + '</span>' +
        '<span class="stat mastered">' + mastered + ' ' + t('mastered') + '</span>' +
        '<span class="stat learning">' + learning + ' ' + t('learning') + '</span>' +
        '<span class="stat new-stat">' + newW + ' ' + t('newLabel') + '</span>';

    var filtered = currentFilter === 'all' ? allWords :
        allWords.filter(function (w) { return w.mastery === currentFilter; });

    var byLang = {};
    for (var i = 0; i < filtered.length; i++) {
        var w = filtered[i];
        if (!byLang[w.lang]) byLang[w.lang] = [];
        byLang[w.lang].push(w);
    }

    var langNames = { en: 'English', de: 'Deutsch', uk: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' };
    var html = '';
    var langs = Object.keys(byLang).sort();

    for (var li = 0; li < langs.length; li++) {
        var l = langs[li];
        var words = byLang[l];
        html += '<div class="lang-group">';
        html += '<h2 class="lang-heading">' + (langNames[l] || l) + ' <span class="lang-count">' + words.length + '</span></h2>';
        html += '<div class="words-grid">';

        for (var wi = 0; wi < words.length; wi++) {
            var w = words[wi];
            var masteryLabel = t('filter' + w.mastery.charAt(0).toUpperCase() + w.mastery.slice(1));
            html += '<div class="word-card">' +
                '<div class="word-header">' +
                    '<span class="word-text">' + escapeHtml(w.word) + '</span>' +
                    '<span class="mastery-chip ' + w.mastery + '">' + masteryLabel + '</span>' +
                '</div>' +
                '<div class="word-meta">' +
                    '<span>' + t('seen') + ' ' + w.seenCount + 'x</span>' +
                    '<span>' + w.correctCount + ' ' + t('correct') + '</span>' +
                    '<span>' + (w.failCount || 0) + ' ' + t('fail') + '</span>' +
                '</div>' +
            '</div>';
        }

        html += '</div></div>';
    }

    listEl.innerHTML = html;
}

const langSelect = document.getElementById('lang-select');
langSelect.value = lang;
document.documentElement.lang = lang;
langSelect.addEventListener('change', function () {
    lang = SUPPORTED_LANGS.includes(langSelect.value) ? langSelect.value : 'en';
    langSelect.value = lang;
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    render();
});

document.getElementById('filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    render();
});

document.addEventListener('DOMContentLoaded', render);
