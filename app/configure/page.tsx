"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Player {
  id: number;
  species: string;
  class: string;
  customSpecies: string;
  customClass: string;
}

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

export default function ConfigurePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, species: '', class: '', customSpecies: '', customClass: '' }
  ]);
  const [playerIdCounter, setPlayerIdCounter] = useState(1);
  
  const [musicTheme, setMusicTheme] = useState("");
  const [musicCustom, setMusicCustom] = useState("");
  const [showMusicCustom, setShowMusicCustom] = useState(false);
  
  const [campaignLength, setCampaignLength] = useState("");
  const [genre, setGenre] = useState("");
  const [genreCustom, setGenreCustom] = useState("");
  const [showGenreCustom, setShowGenreCustom] = useState(false);
  
  const [musicVoiceActive, setMusicVoiceActive] = useState(false);
  const [musicVoiceStatus, setMusicVoiceStatus] = useState("");
  const [genreVoiceActive, setGenreVoiceActive] = useState(false);
  const [genreVoiceStatus, setGenreVoiceStatus] = useState("");
  
  const [playerVoiceActive, setPlayerVoiceActive] = useState<{ [key: string]: boolean }>({});
  const [playerVoiceStatus, setPlayerVoiceStatus] = useState<{ [key: string]: string }>({});
  
  const [showModal, setShowModal] = useState(false);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [modalPlayerIndex, setModalPlayerIndex] = useState(0);
  
  const recognitionRef = useRef<any>(null);

  const addPlayer = () => {
    setPlayers([...players, { 
      id: playerIdCounter, 
      species: '', 
      class: '', 
      customSpecies: '', 
      customClass: '' 
    }]);
    setPlayerIdCounter(playerIdCounter + 1);
  };

  const removePlayer = (id: number) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id: number, field: keyof Player, value: string) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const getCharacterImage = (player: Player) => {
    const species = player.species === 'custom' ? player.customSpecies : player.species;
    const className = player.class === 'custom' ? player.customClass : player.class;
    
    if (!species && !className) {
      return null;
    }
    
    const searchTerms = `${species || 'character'} ${className || 'adventurer'}`.trim();
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(searchTerms)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const showCharacterModal = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const index = players.findIndex(p => p.id === playerId);
      setModalPlayer(player);
      setModalPlayerIndex(index);
      setShowModal(true);
    }
  };

  const startVoiceRecognition = (
    inputElement: HTMLInputElement | null,
    buttonId: string,
    statusSetter: (status: string) => void,
    activeSetter: (active: boolean) => void,
    onResult?: (transcript: string) => void
  ) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      statusSetter('Speech recognition not supported in this browser.');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    activeSetter(true);
    statusSetter('🎤 Listening... Speak now!');
    
    recognition.onstart = () => {
      statusSetter('🎤 Listening... Speak now!');
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (inputElement) {
        inputElement.value = transcript;
        inputElement.dispatchEvent(new Event('input'));
      }
      statusSetter(`✓ Heard: "${transcript}"`);
      if (onResult) {
        onResult(transcript);
      }
    };
    
    recognition.onerror = (event: any) => {
      statusSetter(`Error: ${event.error}`);
      activeSetter(false);
    };
    
    recognition.onend = () => {
      activeSetter(false);
      if (statusSetter.toString().includes('Listening')) {
        statusSetter('');
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStartGame = () => {
    const gameData = {
      musicTheme: musicTheme === 'custom' ? musicCustom : musicTheme,
      players: players.map((p, index) => ({
        playerNumber: index + 1,
        species: p.species === 'custom' ? p.customSpecies : p.species,
        class: p.class === 'custom' ? p.customClass : p.class
      })),
      campaignLength: campaignLength,
      genre: genre === 'custom' ? genreCustom : genre
    };
    
    // Store configuration
    localStorage.setItem("dnd-game-config", JSON.stringify(gameData));
    
    // Navigate to gameplay page
    router.push("/play");
  };

  const isValid = campaignLength && genre && players.some(p => 
    (p.species || p.customSpecies) && (p.class || p.customClass)
  );

  return (
    <div className="configure-page">
      <div className="configure-container">
        <header className="configure-header">
          <h1 className="configure-title">⚔️ Forge Your Adventure ⚔️</h1>
          <p className="configure-subtitle">Prepare your quest, assemble your party, and begin your legend</p>
        </header>

        <main className="configure-form">
          <div className="configure-form-grid">
            {/* Musical Theme Section */}
            <section className={`configure-section configure-section-compact`}>
              <h2 className="configure-section-title">🎵 Musical Theme</h2>
              <div className="configure-input-group">
                <label htmlFor="music-theme">Choose a theme or create your own:</label>
                <div className="configure-input-with-voice">
                  <select
                    id="music-theme"
                    className="configure-dropdown"
                    value={musicTheme}
                    onChange={(e) => {
                      setMusicTheme(e.target.value);
                      setShowMusicCustom(e.target.value === 'custom');
                      if (e.target.value !== 'custom') {
                        setMusicCustom('');
                      }
                    }}
                  >
                    <option value="">Select a theme...</option>
                    <option value="spunky">Spunky</option>
                    <option value="funky">Funky</option>
                    <option value="adventurous">Adventurous</option>
                    <option value="thrilling">Thrilling</option>
                    <option value="eerie">Eerie</option>
                    <option value="spicy">Spicy</option>
                    <option value="classic">Classic</option>
                    <option value="custom">Custom...</option>
                  </select>
                  <button
                    type="button"
                    className={`configure-voice-btn ${musicVoiceActive ? 'active' : ''}`}
                    onClick={() => {
                      const input = document.getElementById('music-custom') as HTMLInputElement;
                      startVoiceRecognition(
                        input,
                        'music',
                        setMusicVoiceStatus,
                        setMusicVoiceActive,
                        (transcript) => {
                          setMusicCustom(transcript);
                          setMusicTheme('custom');
                          setShowMusicCustom(true);
                        }
                      );
                    }}
                    title="Speak your theme"
                  >
                    🎤
                  </button>
                </div>
                {showMusicCustom && (
                  <input
                    type="text"
                    id="music-custom"
                    className="configure-custom-input"
                    placeholder="Or type your custom musical theme..."
                    value={musicCustom}
                    onChange={(e) => setMusicCustom(e.target.value)}
                  />
                )}
                <div className="configure-voice-status">{musicVoiceStatus}</div>
              </div>
            </section>

            {/* Campaign Options Section */}
            <section className={`configure-section configure-section-compact`}>
              <h2 className="configure-section-title">📜 Campaign Options</h2>
              
              <div className="configure-input-group">
                <label htmlFor="campaign-length">Campaign Length:</label>
                <select
                  id="campaign-length"
                  className="configure-dropdown"
                  value={campaignLength}
                  onChange={(e) => setCampaignLength(e.target.value)}
                >
                  <option value="">Select length...</option>
                  <option value="quickie-quickie">Quickie Quickie</option>
                  <option value="quickie">Quickie</option>
                  <option value="short">Short</option>
                  <option value="normal">Normal</option>
                  <option value="long">Long</option>
                  <option value="epic">Epic</option>
                </select>
              </div>

              <div className="configure-input-group">
                <label htmlFor="campaign-genre">Genre:</label>
                <div className="configure-input-with-voice">
                  <select
                    id="campaign-genre"
                    className="configure-dropdown"
                    value={genre}
                    onChange={(e) => {
                      setGenre(e.target.value);
                      setShowGenreCustom(e.target.value === 'custom');
                      if (e.target.value !== 'custom') {
                        setGenreCustom('');
                      }
                    }}
                  >
                    <option value="">Select genre...</option>
                    <option value="Investigation">Investigation</option>
                    <option value="Exploration">Exploration</option>
                    <option value="Heist">Heist</option>
                    <option value="Roleplay and intrigue">Roleplay and intrigue</option>
                    <option value="Combat">Combat</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Low fantasy">Low fantasy</option>
                    <option value="Missions and quest chains">Missions and quest chains</option>
                    <option value="custom">Custom...</option>
                  </select>
                  <button
                    type="button"
                    className={`configure-voice-btn ${genreVoiceActive ? 'active' : ''}`}
                    onClick={() => {
                      const input = document.getElementById('genre-custom') as HTMLInputElement;
                      startVoiceRecognition(
                        input,
                        'genre',
                        setGenreVoiceStatus,
                        setGenreVoiceActive,
                        (transcript) => {
                          setGenreCustom(transcript);
                          setGenre('custom');
                          setShowGenreCustom(true);
                        }
                      );
                    }}
                    title="Speak your genre"
                  >
                    🎤
                  </button>
                </div>
                {showGenreCustom && (
                  <input
                    type="text"
                    id="genre-custom"
                    className="configure-custom-input"
                    placeholder="Or type your custom genre..."
                    value={genreCustom}
                    onChange={(e) => setGenreCustom(e.target.value)}
                  />
                )}
                <div className="configure-voice-status">{genreVoiceStatus}</div>
              </div>
            </section>
          </div>

          {/* Players Section */}
          <section className={`configure-section configure-section-players`}>
            <h2 className="configure-section-title">👥 Your Party</h2>
            <div className="configure-players-container">
              {players.map((player, index) => {
                const characterImage = getCharacterImage(player);
                return (
                  <div key={player.id} className="configure-player-card">
                    <div className="configure-player-header">
                      <span className="configure-player-number">Player {index + 1}</span>
                      {players.length > 1 && (
                        <button
                          type="button"
                          className="configure-remove-player"
                          onClick={() => removePlayer(player.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="configure-player-input-group">
                      <label>Species:</label>
                      <div className="configure-player-input-with-voice">
                        <select
                          value={player.species}
                          onChange={(e) => {
                            updatePlayer(player.id, 'species', e.target.value);
                            if (e.target.value === 'custom') {
                              const customInput = document.getElementById(`species-custom-${player.id}`) as HTMLInputElement;
                              if (customInput) customInput.style.display = 'block';
                            } else {
                              updatePlayer(player.id, 'customSpecies', '');
                              const customInput = document.getElementById(`species-custom-${player.id}`) as HTMLInputElement;
                              if (customInput) customInput.style.display = 'none';
                            }
                          }}
                        >
                          <option value="">Select species...</option>
                          {speciesOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        <button
                          type="button"
                          className={`configure-player-voice-btn ${playerVoiceActive[`species-${player.id}`] ? 'active' : ''}`}
                          onClick={() => {
                            const customInput = document.getElementById(`species-custom-${player.id}`) as HTMLInputElement;
                            if (player.species !== 'custom') {
                              updatePlayer(player.id, 'species', 'custom');
                              if (customInput) customInput.style.display = 'block';
                            }
                            startVoiceRecognition(
                              customInput,
                              `species-${player.id}`,
                              (status) => setPlayerVoiceStatus({ ...playerVoiceStatus, [`species-${player.id}`]: status }),
                              (active) => setPlayerVoiceActive({ ...playerVoiceActive, [`species-${player.id}`]: active }),
                              (transcript) => updatePlayer(player.id, 'customSpecies', transcript)
                            );
                          }}
                        >
                          🎤
                        </button>
                      </div>
                      <input
                        type="text"
                        id={`species-custom-${player.id}`}
                        placeholder="Or type custom species..."
                        value={player.customSpecies}
                        onChange={(e) => updatePlayer(player.id, 'customSpecies', e.target.value)}
                        style={{ display: player.species === 'custom' ? 'block' : 'none', marginTop: '8px', width: '100%', padding: '8px 12px', fontSize: '0.95rem', fontFamily: 'Cinzel, serif', background: 'rgba(26, 26, 26, 0.8)', border: '2px solid var(--dnd-border)', borderRadius: '6px', color: 'var(--dnd-text-light)' }}
                      />
                    </div>
                    <div className="configure-player-input-group">
                      <label>Class:</label>
                      <div className="configure-player-input-with-voice">
                        <select
                          value={player.class}
                          onChange={(e) => {
                            updatePlayer(player.id, 'class', e.target.value);
                            if (e.target.value === 'custom') {
                              const customInput = document.getElementById(`class-custom-${player.id}`) as HTMLInputElement;
                              if (customInput) customInput.style.display = 'block';
                            } else {
                              updatePlayer(player.id, 'customClass', '');
                              const customInput = document.getElementById(`class-custom-${player.id}`) as HTMLInputElement;
                              if (customInput) customInput.style.display = 'none';
                            }
                          }}
                        >
                          <option value="">Select class...</option>
                          {classOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        <button
                          type="button"
                          className={`configure-player-voice-btn ${playerVoiceActive[`class-${player.id}`] ? 'active' : ''}`}
                          onClick={() => {
                            const customInput = document.getElementById(`class-custom-${player.id}`) as HTMLInputElement;
                            if (player.class !== 'custom') {
                              updatePlayer(player.id, 'class', 'custom');
                              if (customInput) customInput.style.display = 'block';
                            }
                            startVoiceRecognition(
                              customInput,
                              `class-${player.id}`,
                              (status) => setPlayerVoiceStatus({ ...playerVoiceStatus, [`class-${player.id}`]: status }),
                              (active) => setPlayerVoiceActive({ ...playerVoiceActive, [`class-${player.id}`]: active }),
                              (transcript) => updatePlayer(player.id, 'customClass', transcript)
                            );
                          }}
                        >
                          🎤
                        </button>
                      </div>
                      <input
                        type="text"
                        id={`class-custom-${player.id}`}
                        placeholder="Or type custom class..."
                        value={player.customClass}
                        onChange={(e) => updatePlayer(player.id, 'customClass', e.target.value)}
                        style={{ display: player.class === 'custom' ? 'block' : 'none', marginTop: '8px', width: '100%', padding: '8px 12px', fontSize: '0.95rem', fontFamily: 'Cinzel, serif', background: 'rgba(26, 26, 26, 0.8)', border: '2px solid var(--dnd-border)', borderRadius: '6px', color: 'var(--dnd-text-light)' }}
                      />
                    </div>
                    <div 
                      className="configure-character-preview" 
                      onClick={() => showCharacterModal(player.id)}
                    >
                      {characterImage ? (
                        <img src={characterImage} alt="Character" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="configure-character-placeholder">🎭</div>';
                        }} />
                      ) : (
                        <div className="configure-character-placeholder">🎭</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" className="configure-add-btn" onClick={addPlayer}>
              + Add Player
            </button>
          </section>

          {/* Start Game Button */}
          <div className="configure-start-game-container">
            <button
              type="button"
              className="configure-start-game-btn"
              onClick={handleStartGame}
              disabled={!isValid}
            >
              🚀 Begin Your Quest
            </button>
          </div>
        </main>
      </div>

      {/* Character Modal */}
      {showModal && modalPlayer && (
        <div className={`configure-modal ${showModal ? 'show' : ''}`} onClick={() => setShowModal(false)}>
          <div className="configure-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="configure-close-modal" onClick={() => setShowModal(false)}>&times;</span>
            <h2 id="modal-character-name">Player {modalPlayerIndex + 1}</h2>
            <div className="configure-character-image-container">
              {getCharacterImage(modalPlayer) ? (
                <img 
                  src={getCharacterImage(modalPlayer)!} 
                  alt="Character"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="configure-character-placeholder">🎭</div>';
                  }}
                />
              ) : (
                <div className="configure-character-placeholder">🎭</div>
              )}
            </div>
            <div className="configure-character-info">
              <p><strong>Species:</strong> {modalPlayer.species === 'custom' ? modalPlayer.customSpecies : modalPlayer.species || 'Not selected'}</p>
              <p><strong>Class:</strong> {modalPlayer.class === 'custom' ? modalPlayer.customClass : modalPlayer.class || 'Not selected'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
