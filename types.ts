import React from 'react';

export interface Attributes {
  Strength: number;
  Dexterity: number;
  Constitution: number;
  Intelligence: number;
  Wisdom: number;
  Charisma: number;
}

export interface PlayerRace {
  name: string;
  description: string;
  imageUrl: string;
  attributeBonuses: Partial<Attributes>;
  racialTrait: string;
  speed: number; // feet per turn, translates to grid movement
}

export interface PlayerClass {
  name:string;
  description:string;
  icon: React.FC;
  classFeature: string;
  synergies: { [raceName: string]: string };
}

export interface PlayerLoyalty {
  name: string;
  description: string;
}

export interface PlayerBackstory {
  name: string;
  description: string;
}

export interface PlayerTrait {
  name: string;
  description: string;
  synergies?: { [key: string]: string };
}

export interface PlayerFault {
    name: string;
    description: string;
    synergies?: { [key: string]: string };
}

export interface StoryEntry {
  type: 'dm' | 'player' | 'info';
  text: string;
  systemInstructionOverride?: string;
}

export interface MapTile {
    x: number;
    y: number;
    terrain: 'forest' | 'plains' | 'hills' | 'mountains' | 'swamp' | 'road' | 'city_gate';
    description: string;
    icon: string;
    encounterChance: number; // 0.0 to 1.0
}

export interface GridMap {
    id: string;
    name: string;
    type: 'grid';
    tiles: MapTile[][];
    startPosition: { x: number; y: number };
}

export interface CityLocation {
    id: string;
    name: string;
    icon: string;
    description: string;
    position: { top: string; left: string; };
}

export interface CityMap {
    id: string;
    name: string;
    type: 'city';
    imageUrl?: string;
    locations: CityLocation[];
    entryPointId: string; // e.g., 'city_gate_to_world'
}

export type GameMap = GridMap | CityMap;


export interface GeminiStoryResponse {
  scene: string;
  summaryForImage: string;
  ambiance: string;
  isGameOver: boolean;
  gameOverReason: string;
  suggestedActions: string[];
  skillCheck: { skill: string; difficultyClass: number; } | null;
  shopInventory: { name: string; cost: string; }[] | null;
  readableContent: { title: string; text: string; } | null;
  transaction: { type: 'buy' | 'sell'; itemName: string; cost: number; } | null;
}

export interface GeminiRecommendationResponse {
  suggestedName: string;
  suggestedBackstory: string;
}

export interface EquipmentPack {
    name: string;
    items: string[];
}

export interface CharacterProfile {
    characterName: string;
    playerRace: PlayerRace;
    playerClass: PlayerClass;
    playerLoyalty: PlayerLoyalty;
    playerBackstory: PlayerBackstory;
    customBackstory: string;
    playerTraits: PlayerTrait[];
    playerFaults: PlayerFault[];
    attributes: Attributes;
    weaponStyle: string;
    spells: string[];
    equipmentPack: EquipmentPack;
    inventory: string[];
    synergyBonus: string | null;
    traitAndFaultSynergies: string[];
}

export type CampaignType = 'Normal' | 'Family';

export interface GameState {
  id: string; // timestamp based
  name: string;
  type: CampaignType;
  lastUpdated: number;
  characterProfiles: CharacterProfile[];
  storyHistory: StoryEntry[];
  sceneImage: string;
  ambiance: string;
  isGameOver: boolean;
  gameOverReason: string;
  suggestedActions: string[];
  skillCheck: GeminiStoryResponse['skillCheck'];
  
  // New Map State
  currentMapId: string; // e.g., 'silverhaven_city' or 'silverwood_forest_grid'
  currentCityLocationId: string | null; // e.g., 'tavern', 'blacksmith'. Null if on city map.
  partyGridPosition: { x: number, y: number } | null; // Null if in a city location.
  movementPoints: number; // For grid-based travel
  visitedTiles: { [key: string]: boolean }; // For Fog of War, key is "x,y"
  partyGold: number;
  revealedMapIds: string[]; // For purchased maps

  // Contextual Content
  shopInventory: { name: string; cost: string; }[] | null;
  readableContent: { title: string; text: string; } | null;
}

export type MapAction = { type: 'travel_city', locationId: string } | { type: 'travel_grid', newPosition: { x: number, y: number } } | { type: 'leave_city' } | { type: 'return_to_city_map' };

export type CharacterCreationStep = 'choice' | 'race' | 'class' | 'loyalty' | 'backstory' | 'traits' | 'faults' | 'attributes' | 'gear' | 'inventory' | 'recommendations' | 'name' | 'prebuilt';