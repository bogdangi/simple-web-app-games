const games = [
    {
        name: 'Speed Reader',
        description: 'Train your reading speed with comprehension checks. Tracks your progress over time.',
        path: 'games/speed-reader/index.html'
    }
];

function renderGames() {
    const grid = document.querySelector('.games-grid');

    if (games.length === 0) {
        grid.innerHTML = '<p style="color:#aaa; grid-column:1/-1; text-align:center;">No games yet. Time to build some!</p>';
        return;
    }

    grid.innerHTML = games.map(game => `
        <a href="${game.path}" class="game-card">
            <h2>${game.name}</h2>
            <p>${game.description}</p>
        </a>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderGames);
