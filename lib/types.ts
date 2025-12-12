// Common types used across the application

export interface PageMetadata {
  title: string;
  description: string;
}

export interface NavItem {
  href: string;
  label: string;
}

// D&D Game Types
export interface Player {
  id: string;
  name: string;
  characterName?: string;
  characterClass?: string;
  level?: number;
}

export interface GameConfiguration {
  campaignName: string;
  players: Player[];
  difficulty: "easy" | "medium" | "hard";
  campaignType: "custom" | "premade";
  maxPlayers: number;
  voiceSettings?: {
    voiceId?: string;
    speed?: number;
    volume?: number;
  };
}

export interface GameState {
  isActive: boolean;
  currentScene?: string;
  players: Player[];
  turnOrder?: string[];
  currentTurn?: string;
  gameHistory: string[];
}
