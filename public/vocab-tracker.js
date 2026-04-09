(function () {
    'use strict';

    var STORAGE_KEY = 'vocab-tracker';

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                if (data && data.words) {
                    if (data.version === 1) {
                        var keys = Object.keys(data.words);
                        for (var i = 0; i < keys.length; i++) {
                            var e = data.words[keys[i]];
                            e.failCount = e.seenCount - e.correctCount;
                            delete e.source;
                            delete e.contexts;
                        }
                        data.version = 2;
                        save(data);
                    }
                    return data;
                }
            }
        } catch (_) { /* corrupted — start fresh */ }
        return { version: 2, words: {} };
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function makeKey(lang, word) {
        return lang + ':' + word.trim().toLowerCase();
    }

    function mastery(entry) {
        if (entry.seenCount < 3) return 'new';
        if (entry.correctCount >= 5 && entry.correctCount / entry.seenCount >= 0.70) return 'mastered';
        return 'learning';
    }

    function recordWords(opts) {
        var words = opts.words;
        var lang = opts.lang;
        var correct = opts.correct;
        if (!words || !words.length || !lang) return;

        var data = load();
        var today = new Date().toISOString().slice(0, 10);

        for (var i = 0; i < words.length; i++) {
            var w = words[i].trim().toLowerCase();
            if (!w) continue;
            var key = makeKey(lang, w);
            var entry = data.words[key];

            if (entry) {
                entry.seenCount++;
                if (correct) entry.correctCount++;
                else entry.failCount++;
                entry.lastSeen = today;
            } else {
                data.words[key] = {
                    word: w,
                    lang: lang,
                    firstSeen: today,
                    lastSeen: today,
                    seenCount: 1,
                    correctCount: correct ? 1 : 0,
                    failCount: correct ? 0 : 1
                };
            }
        }

        save(data);
    }

    function recordWord(opts) {
        if (!opts.word || !opts.lang) return;
        recordWords({ words: [opts.word], lang: opts.lang, correct: opts.correct });
    }

    function getWords(lang) {
        var data = load();
        var results = [];
        var keys = Object.keys(data.words);
        for (var i = 0; i < keys.length; i++) {
            var entry = data.words[keys[i]];
            if (entry.lang === lang) {
                results.push(Object.assign({}, entry, { mastery: mastery(entry) }));
            }
        }
        results.sort(function (a, b) {
            return a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : 0;
        });
        return results;
    }

    function getStats(lang) {
        var words = getWords(lang);
        var stats = { total: words.length, mastered: 0, learning: 0, newWords: 0 };
        for (var i = 0; i < words.length; i++) {
            if (words[i].mastery === 'mastered') stats.mastered++;
            else if (words[i].mastery === 'learning') stats.learning++;
            else stats.newWords++;
        }
        return stats;
    }

    function getAllWords() {
        var data = load();
        var results = [];
        var keys = Object.keys(data.words);
        for (var i = 0; i < keys.length; i++) {
            var entry = data.words[keys[i]];
            results.push(Object.assign({}, entry, { mastery: mastery(entry) }));
        }
        return results;
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    window.VocabTracker = {
        recordWord: recordWord,
        recordWords: recordWords,
        getWords: getWords,
        getStats: getStats,
        getAllWords: getAllWords,
        clear: clear
    };
})();
