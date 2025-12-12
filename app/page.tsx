"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Player {
  id: number;
  name: string;
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
    { id: 0, name: 'Gahegus', species: 'Human', class: 'Fighter', customSpecies: '', customClass: '' },
    { id: 1, name: 'Aria', species: 'Elf', class: 'Ranger', customSpecies: '', customClass: '' },
    { id: 2, name: 'Borus', species: 'Dwarf', class: 'Cleric', customSpecies: '', customClass: '' }
  ]);
  const [playerIdCounter, setPlayerIdCounter] = useState(3);
  
  const [musicTheme, setMusicTheme] = useState("adventurous");
  const [musicCustom, setMusicCustom] = useState("");
  const [showMusicCustom, setShowMusicCustom] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [campaignLength, setCampaignLength] = useState("normal");
  const [genre, setGenre] = useState("Exploration");
  const [genreCustom, setGenreCustom] = useState("");
  const [showGenreCustom, setShowGenreCustom] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [modalPlayerIndex, setModalPlayerIndex] = useState(0);

  const addPlayer = () => {
    if (players.length >= 3) {
      return; // Maximum 3 players allowed
    }
    setPlayers(prevPlayers => [...prevPlayers, { 
      id: playerIdCounter, 
      name: '',
      species: '', 
      class: '',
      customSpecies: '',
      customClass: ''
    }]);
    setPlayerIdCounter(prev => prev + 1);
  };

  const removePlayer = (id: number) => {
    setPlayers(prevPlayers => {
      if (prevPlayers.length > 3) {
        return prevPlayers.filter(p => p.id !== id);
      }
      return prevPlayers;
    });
  };

  const updatePlayer = (id: number, field: keyof Player, value: string) => {
    setPlayers(prevPlayers => prevPlayers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const getCharacterImage = (player: Player) => {
    // Get the actual species value (handle custom species)
    const species = player.species === 'custom' ? player.customSpecies : player.species;
    
    // If no species is selected, don't show an image
    if (!species || species.trim() === '') {
      return null;
    }
    
    // Available images mapped to species (case-insensitive matching)
    // Maps all species to the most relevant available image
    const speciesImageMap: { [key: string]: string } = {
      // Exact matches
      'aasimar': '/images/Aasimar.png',
      'dragonborn': '/images/Dragonborn.png',
      'dwarf': '/images/dwarf.png',
      
      // Human-like species -> use fighter (generic adventurer)
      'human': '/images/fighter.png',
      'half-elf': '/images/fighter.png',
      'half-orc': '/images/barbarian.png',
      
      // Small/agile species -> use monk or bard
      'halfling': '/images/monk.png',
      'gnome': '/images/monk.png',
      'kenku': '/images/monk.png',
      'tabaxi': '/images/monk.png',
      
      // Nature-oriented species -> use druid
      'elf': '/images/druid.png',
      'firbolg': '/images/druid.png',
      'triton': '/images/druid.png',
      
      // Strong/warrior species -> use barbarian or fighter
      'goliath': '/images/barbarian.png',
      'lizardfolk': '/images/barbarian.png',
      
      // Mystical/divine species -> use cleric
      'tiefling': '/images/Cleric.png',
      'warforged': '/images/fighter.png',
    };
    
    // Normalize species name for matching (lowercase, trim)
    const normalizedSpecies = species.toLowerCase().trim();
    
    // Return matching image if found
    if (speciesImageMap[normalizedSpecies]) {
      return speciesImageMap[normalizedSpecies];
    }
    
    // Fallback: use fighter image for any unmatched species
    return '/images/fighter.png';
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

  const handleGenerateMusic = async () => {
    if (!musicCustom.trim()) {
      return;
    }

    setIsGeneratingMusic(true);
    try {
      const response = await fetch("/api/music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: musicCustom.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate music");
      }

      const data = await response.json();
      if (data.success && data.audio) {
        // Store audio data in localStorage for use in play page
        localStorage.setItem("generated-music-audio", data.audio);
        
        // Convert base64 audio to playable format
        const audioData = atob(data.audio);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create and play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
        
        // Clean up the object URL after playback ends
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        });
        
        console.log("Music generated and playing successfully");
      }
    } catch (error) {
      console.error("Music generation error:", error);
      alert(error instanceof Error ? error.message : "Failed to generate music. Please try again.");
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleStartGame = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Also stop any other audio elements that might be playing
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    const gameData = {
      musicTheme: musicTheme === 'custom' ? musicCustom : musicTheme,
      players: players.map((p, index) => ({
        playerNumber: index + 1,
        name: p.name,
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

  const isValid = campaignLength && genre && players.length === 3 && players.every(p => 
    p.name && (p.species || p.customSpecies) && (p.class || p.customClass)
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
                {showMusicCustom && (
                  <div className="configure-custom-input-group">
                    <input
                      type="text"
                      id="music-custom"
                      className="configure-custom-input"
                      placeholder="Or type your custom musical theme..."
                      value={musicCustom}
                      onChange={(e) => setMusicCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && musicCustom.trim() && !isGeneratingMusic) {
                          handleGenerateMusic();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="configure-music-submit-btn"
                      onClick={handleGenerateMusic}
                      disabled={!musicCustom.trim() || isGeneratingMusic}
                    >
                      {isGeneratingMusic ? "Generating..." : "Generate Music"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Campaign Options Section */}
            <section className={`configure-section configure-section-compact`}>
              <h2 className="configure-section-title">📜 Campaign Options</h2>
              
              <div className="configure-input-group configure-input-group-row">
                <div className="configure-input-group-inline">
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

                <div className="configure-input-group-inline">
                  <label htmlFor="campaign-genre">Genre:</label>
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
                </div>
              </div>
              {showGenreCustom && (
                <div className="configure-input-group">
                  <input
                    type="text"
                    id="genre-custom"
                    className="configure-custom-input"
                    placeholder="Or type your custom genre..."
                    value={genreCustom}
                    onChange={(e) => setGenreCustom(e.target.value)}
                  />
                </div>
              )}
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
                      {players.length > 3 && (
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
                      <label>Name:</label>
                      <input
                        type="text"
                        placeholder="Enter character name..."
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                        className="configure-player-text-input"
                      />
                    </div>
                    <div className="configure-player-input-group">
                      <label>Species:</label>
                      <select
                        value={player.species}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setPlayers(prevPlayers => prevPlayers.map(p => {
                            if (p.id === player.id) {
                              if (newValue === 'custom') {
                                return { ...p, species: 'custom', customSpecies: p.customSpecies };
                              } else {
                                return { ...p, species: newValue, customSpecies: '' };
                              }
                            }
                            return p;
                          }));
                        }}
                        className="configure-dropdown"
                      >
                        <option value="">Select species...</option>
                        {speciesOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      {player.species === 'custom' && (
                        <input
                          type="text"
                          placeholder="Enter custom species..."
                          value={player.customSpecies}
                          onChange={(e) => updatePlayer(player.id, 'customSpecies', e.target.value)}
                          className="configure-player-text-input"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                    </div>
                    <div className="configure-player-input-group">
                      <label>Class:</label>
                      <select
                        value={player.class}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setPlayers(prevPlayers => prevPlayers.map(p => {
                            if (p.id === player.id) {
                              if (newValue === 'custom') {
                                return { ...p, class: 'custom', customClass: p.customClass };
                              } else {
                                return { ...p, class: newValue, customClass: '' };
                              }
                            }
                            return p;
                          }));
                        }}
                        className="configure-dropdown"
                      >
                        <option value="">Select class...</option>
                        {classOptions.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="custom">Custom...</option>
                      </select>
                      {player.class === 'custom' && (
                        <input
                          type="text"
                          placeholder="Enter custom class..."
                          value={player.customClass}
                          onChange={(e) => updatePlayer(player.id, 'customClass', e.target.value)}
                          className="configure-player-text-input"
                          style={{ marginTop: '8px' }}
                        />
                      )}
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
              <p><strong>Name:</strong> {modalPlayer.name || 'Not set'}</p>
              <p><strong>Species:</strong> {modalPlayer.species === 'custom' ? modalPlayer.customSpecies : modalPlayer.species || 'Not selected'}</p>
              <p><strong>Class:</strong> {modalPlayer.class === 'custom' ? modalPlayer.customClass : modalPlayer.class || 'Not selected'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
