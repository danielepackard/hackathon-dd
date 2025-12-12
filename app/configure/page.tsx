"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Player, GameConfiguration } from "@/lib/types";

export default function ConfigurePage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [campaignType, setCampaignType] = useState<"custom" | "premade">("custom");
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "", characterName: "", characterClass: "", level: 1 },
  ]);

  const addPlayer = () => {
    setPlayers([
      ...players,
      {
        id: Date.now().toString(),
        name: "",
        characterName: "",
        characterClass: "",
        level: 1,
      },
    ]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  const updatePlayer = (id: string, field: keyof Player, value: string | number) => {
    setPlayers(
      players.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleStartGame = () => {
    const config: GameConfiguration = {
      campaignName,
      players: players.filter((p) => p.name.trim() !== ""),
      difficulty,
      campaignType,
      maxPlayers: players.length,
    };

    // Store configuration in localStorage (or send to API)
    localStorage.setItem("dnd-game-config", JSON.stringify(config));
    
    // Navigate to gameplay page
    router.push("/play");
  };

  const isValid = campaignName.trim() !== "" && players.some((p) => p.name.trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Configure Your D&D Campaign
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Set up your game with players and options before starting your adventure
        </p>

        <div className="space-y-6">
          {/* Campaign Settings */}
          <Card title="Campaign Settings">
            <div className="space-y-4">
              <Input
                label="Campaign Name"
                placeholder="Enter campaign name..."
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                  options={[
                    { value: "easy", label: "Easy" },
                    { value: "medium", label: "Medium" },
                    { value: "hard", label: "Hard" },
                  ]}
                />
                <Select
                  label="Campaign Type"
                  value={campaignType}
                  onChange={(e) =>
                    setCampaignType(e.target.value as "custom" | "premade")
                  }
                  options={[
                    { value: "custom", label: "Custom" },
                    { value: "premade", label: "Premade Campaign" },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Players */}
          <Card title="Players">
            <div className="space-y-4">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Player {index + 1}
                    </h3>
                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Player Name"
                      placeholder="Enter player name..."
                      value={player.name}
                      onChange={(e) =>
                        updatePlayer(player.id, "name", e.target.value)
                      }
                    />
                    <Input
                      label="Character Name"
                      placeholder="Enter character name..."
                      value={player.characterName || ""}
                      onChange={(e) =>
                        updatePlayer(player.id, "characterName", e.target.value)
                      }
                    />
                    <Input
                      label="Character Class"
                      placeholder="e.g., Fighter, Wizard..."
                      value={player.characterClass || ""}
                      onChange={(e) =>
                        updatePlayer(player.id, "characterClass", e.target.value)
                      }
                    />
                    <Input
                      label="Level"
                      type="number"
                      min="1"
                      max="20"
                      value={player.level || 1}
                      onChange={(e) =>
                        updatePlayer(player.id, "level", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>
              ))}
              <Button
                onClick={addPlayer}
                variant="secondary"
                className="w-full"
              >
                + Add Player
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button href="/" variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleStartGame}
              disabled={!isValid}
              className="flex-1"
            >
              Start Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
