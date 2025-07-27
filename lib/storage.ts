import type { GameState } from '../types';
import { STORAGE_KEY } from '../constants';

const MAX_SAVED_GAMES = 2;

export function getCampaigns(): GameState[] {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return [];
    
    const campaigns: GameState[] = JSON.parse(savedData);
    // Sort by most recently updated
    return campaigns.sort((a, b) => b.lastUpdated - a.lastUpdated);
  } catch (error) {
    console.error("Failed to load campaigns from local storage:", error);
    return [];
  }
}

export function saveCampaign(gameState: GameState) {
  try {
    const campaigns = getCampaigns();
    const existingIndex = campaigns.findIndex(c => c.id === gameState.id);

    const updatedGameState = { ...gameState, lastUpdated: Date.now() };

    if (existingIndex > -1) {
      // Update existing campaign
      campaigns[existingIndex] = updatedGameState;
    } else {
      // Add new campaign
      campaigns.push(updatedGameState);
    }

    // Sort and keep only the most recent games
    const sortedCampaigns = campaigns.sort((a, b) => b.lastUpdated - a.lastUpdated);
    const prunedCampaigns = sortedCampaigns.slice(0, MAX_SAVED_GAMES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedCampaigns));
  } catch (error) {
    console.error("Failed to save campaign to local storage:", error);
  }
}
