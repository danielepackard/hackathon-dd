// Game state
let players = [];
let playerIdCounter = 0;

// Species and Class options
const speciesOptions = [
    'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 
    'Half-Elf', 'Half-Orc', 'Tiefling', 'Aasimar', 'Firbolg', 
    'Goliath', 'Kenku', 'Lizardfolk', 'Tabaxi', 'Triton', 'Warforged'
];

const classOptions = [
    'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
    'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
    'Artificer', 'Blood Hunter'
];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicTheme();
    initializePlayers();
    initializeCampaignOptions();
    initializeStartGame();
    initializeModal();
});

// Musical Theme Functions
function initializeMusicTheme() {
    const musicThemeSelect = document.getElementById('music-theme');
    const musicCustomInput = document.getElementById('music-custom');
    const musicVoiceBtn = document.getElementById('music-voice-btn');
    const musicVoiceStatus = document.getElementById('music-voice-status');

    musicThemeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            musicCustomInput.style.display = 'block';
            musicCustomInput.focus();
        } else {
            musicCustomInput.style.display = 'none';
            musicCustomInput.value = '';
        }
    });

    musicVoiceBtn.addEventListener('click', () => {
        startVoiceRecognition(musicCustomInput, musicVoiceBtn, musicVoiceStatus);
    });
}

// Player Management Functions
function initializePlayers() {
    const addPlayerBtn = document.getElementById('add-player-btn');
    addPlayerBtn.addEventListener('click', addPlayer);
    
    // Add initial player
    addPlayer();
}

function addPlayer() {
    const playerId = playerIdCounter++;
    const player = {
        id: playerId,
        species: '',
        class: '',
        customSpecies: '',
        customClass: ''
    };
    players.push(player);
    renderPlayers();
}

function removePlayer(playerId) {
    players = players.filter(p => p.id !== playerId);
    renderPlayers();
}

function renderPlayers() {
    const container = document.getElementById('players-container');
    container.innerHTML = '';

    players.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-header">
                <span class="player-number">Player ${index + 1}</span>
                <button type="button" class="remove-player" onclick="removePlayer(${player.id})">×</button>
            </div>
            <div class="player-input-group">
                <label>Species:</label>
                <div class="player-input-with-voice">
                    <select class="player-species-select" data-player-id="${player.id}">
                        <option value="">Select species...</option>
                        ${speciesOptions.map(s => `<option value="${s}" ${player.species === s ? 'selected' : ''}>${s}</option>`).join('')}
                        <option value="custom" ${player.species === 'custom' ? 'selected' : ''}>Custom...</option>
                    </select>
                    <button type="button" class="player-voice-btn" data-player-id="${player.id}" data-type="species">🎤</button>
                </div>
                <input type="text" class="player-species-custom" data-player-id="${player.id}" 
                    placeholder="Or type custom species..." 
                    value="${player.customSpecies}"
                    style="display: ${player.species === 'custom' ? 'block' : 'none'}; margin-top: 8px; width: 100%; padding: 8px 12px; font-size: 0.95rem; font-family: 'Cinzel', serif; background: rgba(26, 26, 26, 0.8); border: 2px solid var(--border-color); border-radius: 6px; color: var(--text-light);">
            </div>
            <div class="player-input-group">
                <label>Class:</label>
                <div class="player-input-with-voice">
                    <select class="player-class-select" data-player-id="${player.id}">
                        <option value="">Select class...</option>
                        ${classOptions.map(c => `<option value="${c}" ${player.class === c ? 'selected' : ''}>${c}</option>`).join('')}
                        <option value="custom" ${player.class === 'custom' ? 'selected' : ''}>Custom...</option>
                    </select>
                    <button type="button" class="player-voice-btn" data-player-id="${player.id}" data-type="class">🎤</button>
                </div>
                <input type="text" class="player-class-custom" data-player-id="${player.id}" 
                    placeholder="Or type custom class..." 
                    value="${player.customClass}"
                    style="display: ${player.class === 'custom' ? 'block' : 'none'}; margin-top: 8px; width: 100%; padding: 8px 12px; font-size: 0.95rem; font-family: 'Cinzel', serif; background: rgba(26, 26, 26, 0.8); border: 2px solid var(--border-color); border-radius: 6px; color: var(--text-light);">
            </div>
            <div class="character-preview" onclick="showCharacterModal(${player.id})">
                ${getCharacterImage(player)}
            </div>
        `;
        container.appendChild(playerCard);
    });

    // Attach event listeners
    attachPlayerEventListeners();
}

function attachPlayerEventListeners() {
    // Species select handlers
    document.querySelectorAll('.player-species-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            const customInput = document.querySelector(`.player-species-custom[data-player-id="${playerId}"]`);
            
            if (e.target.value === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
                player.species = 'custom';
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
                player.species = e.target.value;
                player.customSpecies = '';
            }
            updateCharacterImage(playerId);
        });
    });

    // Class select handlers
    document.querySelectorAll('.player-class-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            const customInput = document.querySelector(`.player-class-custom[data-player-id="${playerId}"]`);
            
            if (e.target.value === 'custom') {
                customInput.style.display = 'block';
                customInput.focus();
                player.class = 'custom';
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
                player.class = e.target.value;
                player.customClass = '';
            }
            updateCharacterImage(playerId);
        });
    });

    // Custom input handlers
    document.querySelectorAll('.player-species-custom').forEach(input => {
        input.addEventListener('input', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            player.customSpecies = e.target.value;
            updateCharacterImage(playerId);
        });
    });

    document.querySelectorAll('.player-class-custom').forEach(input => {
        input.addEventListener('input', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            player.customClass = e.target.value;
            updateCharacterImage(playerId);
        });
    });

    // Voice button handlers
    document.querySelectorAll('.player-voice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            const type = e.target.dataset.type;
            const player = players.find(p => p.id === playerId);
            
            let targetInput;
            if (type === 'species') {
                targetInput = document.querySelector(`.player-species-custom[data-player-id="${playerId}"]`);
                if (player.species !== 'custom') {
                    // Switch to custom mode
                    const select = document.querySelector(`.player-species-select[data-player-id="${playerId}"]`);
                    select.value = 'custom';
                    targetInput.style.display = 'block';
                    player.species = 'custom';
                }
            } else {
                targetInput = document.querySelector(`.player-class-custom[data-player-id="${playerId}"]`);
                if (player.class !== 'custom') {
                    // Switch to custom mode
                    const select = document.querySelector(`.player-class-select[data-player-id="${playerId}"]`);
                    select.value = 'custom';
                    targetInput.style.display = 'block';
                    player.class = 'custom';
                }
            }
            
            const statusDiv = document.createElement('div');
            statusDiv.className = 'voice-status';
            statusDiv.style.marginTop = '8px';
            targetInput.parentElement.appendChild(statusDiv);
            
            startVoiceRecognition(targetInput, e.target, statusDiv);
        });
    });
}

function updateCharacterImage(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Find the player card by searching for the select element and traversing up
    const selectElement = document.querySelector(`.player-species-select[data-player-id="${playerId}"]`);
    if (!selectElement) return;
    
    const playerCard = selectElement.closest('.player-card');
    if (!playerCard) return;
    
    const previewDiv = playerCard.querySelector('.character-preview');
    if (previewDiv) {
        previewDiv.innerHTML = getCharacterImage(player);
    }
}

function getCharacterImage(player) {
    const species = player.species === 'custom' ? player.customSpecies : player.species;
    const className = player.class === 'custom' ? player.customClass : player.class;
    
    if (!species && !className) {
        return '<div class="character-placeholder">🎭</div>';
    }
    
    // Generate character image URL using a placeholder service
    // In a real app, you'd use an actual character generation API
    const searchTerms = `${species || 'character'} ${className || 'adventurer'}`.trim();
    const imageUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(searchTerms)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    return `<img src="${imageUrl}" alt="Character" onerror="this.parentElement.innerHTML='<div class=\\'character-placeholder\\'>🎭</div>'">`;
}

function showCharacterModal(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const modal = document.getElementById('character-modal');
    const modalName = document.getElementById('modal-character-name');
    const modalImage = document.getElementById('modal-character-image');
    const modalInfo = document.getElementById('modal-character-info');
    
    const species = player.species === 'custom' ? player.customSpecies : player.species;
    const className = player.class === 'custom' ? player.customClass : player.class;
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    modalName.textContent = `Player ${playerIndex + 1}`;
    
    if (species || className) {
        const searchTerms = `${species || 'character'} ${className || 'adventurer'}`.trim();
        const imageUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(searchTerms)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
        modalImage.innerHTML = `<img src="${imageUrl}" alt="Character" onerror="this.parentElement.innerHTML='<div class=\\'character-placeholder\\'>🎭</div>'">`;
    } else {
        modalImage.innerHTML = '<div class="character-placeholder">🎭</div>';
    }
    
    modalInfo.innerHTML = `
        <p><strong>Species:</strong> ${species || 'Not selected'}</p>
        <p><strong>Class:</strong> ${className || 'Not selected'}</p>
    `;
    
    modal.style.display = 'block';
}

// Campaign Options Functions
function initializeCampaignOptions() {
    const genreSelect = document.getElementById('campaign-genre');
    const genreCustomInput = document.getElementById('genre-custom');
    const genreVoiceBtn = document.getElementById('genre-voice-btn');
    const genreVoiceStatus = document.getElementById('genre-voice-status');

    genreSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            genreCustomInput.style.display = 'block';
            genreCustomInput.focus();
        } else {
            genreCustomInput.style.display = 'none';
            genreCustomInput.value = '';
        }
    });

    genreVoiceBtn.addEventListener('click', () => {
        startVoiceRecognition(genreCustomInput, genreVoiceBtn, genreVoiceStatus);
    });
}

// Start Game Function
function initializeStartGame() {
    const startGameBtn = document.getElementById('start-game-btn');
    startGameBtn.addEventListener('click', () => {
        const gameData = collectGameData();
        console.log('Starting game with data:', gameData);
        
        // Here you would typically send this data to your backend
        alert('Quest Beginning! 🚀\n\nYour adventure is being prepared...\n\nCheck the console for game data.');
    });
}

function collectGameData() {
    const musicTheme = document.getElementById('music-theme').value;
    const musicCustom = document.getElementById('music-custom').value;
    const campaignLength = document.getElementById('campaign-length').value;
    const genre = document.getElementById('campaign-genre').value;
    const genreCustom = document.getElementById('genre-custom').value;
    
    return {
        musicTheme: musicTheme === 'custom' ? musicCustom : musicTheme,
        players: players.map((p, index) => ({
            playerNumber: index + 1,
            species: p.species === 'custom' ? p.customSpecies : p.species,
            class: p.class === 'custom' ? p.customClass : p.class
        })),
        campaignLength: campaignLength,
        genre: genre === 'custom' ? genreCustom : genre
    };
}

// Modal Functions
function initializeModal() {
    const modal = document.getElementById('character-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Voice Recognition Functions
function startVoiceRecognition(inputElement, buttonElement, statusElement) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        statusElement.textContent = 'Speech recognition not supported in this browser.';
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    buttonElement.classList.add('active');
    statusElement.textContent = '🎤 Listening... Speak now!';
    
    recognition.onstart = () => {
        statusElement.textContent = '🎤 Listening... Speak now!';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputElement.value = transcript;
        inputElement.dispatchEvent(new Event('input'));
        statusElement.textContent = `✓ Heard: "${transcript}"`;
        
        // Update player data if this is a player input
        if (inputElement.classList.contains('player-species-custom')) {
            const playerId = parseInt(inputElement.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            if (player) {
                player.customSpecies = transcript;
                updateCharacterImage(playerId);
            }
        } else if (inputElement.classList.contains('player-class-custom')) {
            const playerId = parseInt(inputElement.dataset.playerId);
            const player = players.find(p => p.id === playerId);
            if (player) {
                player.customClass = transcript;
                updateCharacterImage(playerId);
            }
        }
    };
    
    recognition.onerror = (event) => {
        statusElement.textContent = `Error: ${event.error}`;
        buttonElement.classList.remove('active');
    };
    
    recognition.onend = () => {
        buttonElement.classList.remove('active');
        if (statusElement.textContent === '🎤 Listening... Speak now!') {
            statusElement.textContent = '';
        }
    };
    
    recognition.start();
}

// Make removePlayer available globally
window.removePlayer = removePlayer;
window.showCharacterModal = showCharacterModal;

