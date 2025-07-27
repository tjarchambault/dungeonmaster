import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import NewCampaignSetupScreen from './components/NewCampaignSetupScreen';
import ContinueScreen from './components/ContinueScreen';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import Loading from './components/Loading';
import type { GameState, CharacterProfile, CampaignType, StoryEntry } from './types';
import { TAVERN_START_PROMPT, CITY_MAPS } from './constants';
import * as storage from './lib/storage';

type View = 'welcome' | 'setup_type' | 'character_creation' | 'continue' | 'game';

const App: React.FC = () => {
    const [view, setView] = useState<View>('welcome');
    const [savedCampaigns, setSavedCampaigns] = useState<GameState[]>([]);
    const [activeGame, setActiveGame] = useState<GameState | null>(null);
    const [newCampaignType, setNewCampaignType] = useState<CampaignType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setSavedCampaigns(storage.getCampaigns());
        setIsLoading(false);
    }, []);
    
    // Auto-save whenever the active game state changes
    useEffect(() => {
        if (activeGame) {
            storage.saveCampaign(activeGame);
            // Also update the list of saved campaigns in state
            setSavedCampaigns(storage.getCampaigns());
        }
    }, [activeGame]);

    const handleNewCampaign = (type: CampaignType) => {
        setNewCampaignType(type);
        setView('character_creation');
    };

    const handleStartGame = (profiles: CharacterProfile[], type: CampaignType) => {
        const now = Date.now();
        const campaignName = `The ${profiles[0].characterName} Party`;
        
        const characterSummaries = profiles.map((profile, index) => {
            const backstoryText = profile.playerBackstory.name === 'Custom' ? profile.customBackstory : profile.playerBackstory.description;
            const attributesText = Object.entries(profile.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
            const spellsText = profile.spells.length > 0 ? profile.spells.join(', ') : 'None';
            const synergyText = profile.synergyBonus ? `\n- Synergy Bonus: ${profile.synergyBonus}` : '';
            const traitAndFaultSynergiesText = profile.traitAndFaultSynergies.length > 0 ? `\n- Special Abilities & Flaws: ${profile.traitAndFaultSynergies.join(', ')}` : '';

            return `Character ${index + 1}:\n- Name: ${profile.characterName}\n- Race: ${profile.playerRace.name}\n- Class: ${profile.playerClass.name}\n- Loyalty: ${profile.playerLoyalty.name}\n- Traits: ${profile.playerTraits.map(t => t.name).join(', ')}\n- Faults: ${profile.playerFaults.map(f => f.name).join(', ')}\n- Backstory: ${backstoryText}\n- Attributes: ${attributesText}\n- Racial Trait: ${profile.playerRace.racialTrait}\n- Class Feature: ${profile.playerClass.classFeature}${synergyText}${traitAndFaultSynergiesText}\n- Weapon Style: ${profile.weaponStyle}\n- Spells: ${spellsText}\n- Inventory: ${profile.inventory.join(', ')}`;
        }).join('\n\n');
        
        const initialPromptText = TAVERN_START_PROMPT.replace('{characterSummaries}', characterSummaries);
        const initialPrompt: StoryEntry = { type: 'player', text: initialPromptText };
        
        const totalSpeed = profiles.reduce((sum, p) => sum + p.playerRace.speed, 0);
        const averageSpeed = totalSpeed / profiles.length;
        const movementPoints = Math.round(averageSpeed / 5); // 5ft per square in D&D

        const startMap = CITY_MAPS['silverhaven'];
        const startLocation = startMap.locations.find(l => l.id === 'weary_wanderer_tavern')!;
        
        const startPosKey = `${startLocation.position.left},${startLocation.position.top}`;
        
        const newGame: GameState = {
            id: now.toString(),
            name: campaignName,
            type: type,
            lastUpdated: now,
            characterProfiles: profiles,
            storyHistory: [initialPrompt],
            sceneImage: '',
            ambiance: 'tavern',
            isGameOver: false,
            gameOverReason: '',
            suggestedActions: [],
            skillCheck: null,
            currentMapId: 'silverhaven',
            currentCityLocationId: startLocation.id,
            partyGridPosition: null,
            movementPoints: movementPoints,
            visitedTiles: { [startPosKey]: true },
            partyGold: 50,
            shopInventory: null,
            readableContent: null,
            revealedMapIds: [],
        };
        
        setActiveGame(newGame); // This will trigger the useEffect to save
        setView('game');
    };

    const handleLoadGame = (id: string) => {
        const gameToLoad = savedCampaigns.find(c => c.id === id);
        if (gameToLoad) {
            setActiveGame(gameToLoad);
            setView('game');
        }
    };

    const handleExitGame = () => {
        setActiveGame(null);
        setSavedCampaigns(storage.getCampaigns()); // Refresh saved games list
        setView('welcome');
    }

    if (isLoading) {
        return <Loading text="Loading..." />;
    }
    
    // Main App Flow
    if (view === 'game' && activeGame) {
        return <GameScreen gameState={activeGame} setGameState={setActiveGame} onExit={handleExitGame} />;
    }
    
    if (view === 'character_creation' && newCampaignType) {
        return <StartScreen onGameStart={(profiles) => handleStartGame(profiles, newCampaignType)} onBack={() => setView('setup_type')} />;
    }

    if (view === 'setup_type') {
        return <NewCampaignSetupScreen onSelect={handleNewCampaign} onBack={() => setView('welcome')} />;
    }

    if (view === 'continue') {
        return <ContinueScreen campaigns={savedCampaigns} onLoad={handleLoadGame} onBack={() => setView('welcome')} />;
    }

    return <WelcomeScreen onNew={() => setView('setup_type')} onContinue={() => setView('continue')} hasSavedGames={savedCampaigns.length > 0} />;
};

export default App;