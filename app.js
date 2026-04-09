const LANG_KEY = 'app-language';

const APP_UI = {
    en: {
        title: 'Simple Web Games',
        subtitle: 'Pick a game and have fun!',
        noGames: 'No games yet. Time to build some!',
        language: 'Language',
    },
    de: {
        title: 'Einfache Webspiele',
        subtitle: 'W\u00e4hle ein Spiel und hab Spa\u00df!',
        noGames: 'Noch keine Spiele. Zeit, welche zu bauen!',
        language: 'Sprache',
    },
    uk: {
        title: '\u041f\u0440\u043e\u0441\u0442\u0456 \u0432\u0435\u0431-\u0456\u0433\u0440\u0438',
        subtitle: '\u041e\u0431\u0438\u0440\u0430\u0439 \u0433\u0440\u0443 \u0456 \u0440\u043e\u0437\u0432\u0430\u0436\u0430\u0439\u0441\u044f!',
        noGames: '\u0406\u0433\u043e\u0440 \u043f\u043e\u043a\u0438 \u043d\u0435\u043c\u0430\u0454. \u0427\u0430\u0441 \u0441\u0442\u0432\u043e\u0440\u0438\u0442\u0438!',
        language: '\u041c\u043e\u0432\u0430',
    }
};

const games = [
    {
        name: { en: 'Fluency Trainer', de: 'Lese-Trainer', uk: '\u0422\u0440\u0435\u043d\u0430\u0436\u0435\u0440 \u0447\u0438\u0442\u0430\u043d\u043d\u044f' },
        description: {
            en: 'Train your reading fluency with comprehension checks. Tracks your progress over time.',
            de: 'Trainiere deine Lesefähigkeit mit Verst\u00e4ndnisfragen. Dein Fortschritt wird gespeichert.',
            uk: '\u0422\u0440\u0435\u043d\u0443\u0439 \u043f\u043b\u0430\u0432\u043d\u0456\u0441\u0442\u044c \u0447\u0438\u0442\u0430\u043d\u043d\u044f \u0437 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u043a\u043e\u044e \u0440\u043e\u0437\u0443\u043c\u0456\u043d\u043d\u044f. \u041f\u0440\u043e\u0433\u0440\u0435\u0441 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044c\u0441\u044f.',
        },
        path: 'games/speed-reader/index.html'
    }
];

const SUPPORTED_LANGS = Object.keys(APP_UI);

function normalizeLang(value) {
    return SUPPORTED_LANGS.includes(value) ? value : 'en';
}

let lang = normalizeLang(localStorage.getItem(LANG_KEY) || 'en');

function t(key) {
    return APP_UI[lang][key] || APP_UI.en[key] || key;
}

function updateUI() {
    document.querySelectorAll('[data-ui]').forEach(el => {
        const key = el.getAttribute('data-ui');
        const text = t(key);
        if (text) el.textContent = text;
    });
    renderGames();
}

function renderGames() {
    const grid = document.querySelector('.games-grid');

    if (games.length === 0) {
        grid.innerHTML = `<p style="color:#aaa; grid-column:1/-1; text-align:center;">${t('noGames')}</p>`;
        return;
    }

    grid.innerHTML = games.map(game => `
        <a href="${game.path}?lang=${lang}" class="game-card">
            <h2>${game.name[lang] || game.name.en}</h2>
            <p>${game.description[lang] || game.description.en}</p>
        </a>
    `).join('');
}

const langSelect = document.getElementById('lang-select');
langSelect.value = lang;
document.documentElement.lang = lang;
langSelect.addEventListener('change', () => {
    lang = normalizeLang(langSelect.value);
    langSelect.value = lang;
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    updateUI();
});

document.addEventListener('DOMContentLoaded', updateUI);
