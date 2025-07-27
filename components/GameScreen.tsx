
import React, { useState, useEffect, useRef } from 'react';
import Loading from './Loading';
import ContextualView from './ContextualView';
import MapPage from './MapPage';
import { DMIcon, PlayerIcon, SpeakerIcon, VolumeIcon, MuteIcon } from './Icon';
import { generateStory, generateSceneImage, summarizeHistory } from '../services/geminiService';
import type { StoryEntry, GameState, GridMap, CityMap, MapAction } from '../types';
import { AMBIANCE_MUSIC, SUMMARIZATION_THRESHOLD, ALL_MAPS, SYSTEM_INSTRUCTION_CITY_ACTION, SYSTEM_INSTRUCTION_EXPLORE } from '../constants';

interface GameScreenProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState, onExit }) => {
    const [loading, setLoading] = useState<{ active: boolean; text: string }>({ active: false, text: '' });
    const [playerInput, setPlayerInput] = useState('');
    const [speakingText, setSpeakingText] = useState<string | null>(null);
    const storyEndRef = useRef<HTMLDivElement | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);

    // --- Skill Check State ---
    const [skillCheckInputMode, setSkillCheckInputMode] = useState<'physical' | 'digital' | null>(null);
    const [manualRollValue, setManualRollValue] = useState('');
    const [digitalRollResult, setDigitalRollResult] = useState<number | null>(null);
    const [skillCheckError, setSkillCheckError] = useState<string|null>(null);

    // --- Audio State ---
    const [musicUrl, setMusicUrl] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.2); // Start at a quieter volume
    const audioRef = useRef<HTMLAudioElement | null>(null);


    // This effect runs once per new campaign to kick off the story.
    useEffect(() => {
        if (gameState.storyHistory.length === 1 && gameState.storyHistory[0].type === 'player') {
            processTurn(gameState.storyHistory, SYSTEM_INSTRUCTION_CITY_ACTION);
        }
    }, [gameState.id]); // Depend on the unique campaign ID
    

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.storyHistory]);

    // --- Audio Effects ---
    useEffect(() => {
        const ambianceKey = gameState.ambiance?.toLowerCase().split(' ')[0] || 'default';
        const newUrl = AMBIANCE_MUSIC[ambianceKey] || AMBIANCE_MUSIC['default'];
        
        if (newUrl && newUrl !== musicUrl) {
            setMusicUrl(newUrl);
        }
    }, [gameState.ambiance]);

    useEffect(() => {
        if (audioRef.current && musicUrl) {
            if (audioRef.current.src !== musicUrl) {
                audioRef.current.src = musicUrl;
            }
            audioRef.current.play().catch(e => {
                console.warn("Audio autoplay was prevented by the browser. User interaction is required to start audio.");
            });
        } else if (audioRef.current && !musicUrl) {
            audioRef.current.pause();
        }
    }, [musicUrl]);
    
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Cleanup speech synthesis on component unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis?.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleSpeak = (textToSpeak: string) => {
        if (!('speechSynthesis' in window) || !textToSpeak) return;

        if (speakingText === textToSpeak) {
            window.speechSynthesis.cancel();
            setSpeakingText(null);
            return;
        }
    
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onstart = () => setSpeakingText(textToSpeak);
        utterance.onend = () => setSpeakingText(null);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e.error);
            setSpeakingText(null);
        };
        
        window.speechSynthesis.speak(utterance);
    };

    const processTurn = async (currentHistory: StoryEntry[], systemInstructionOverride?: string) => {
        setLoading({ active: true, text: systemInstructionOverride === SYSTEM_INSTRUCTION_EXPLORE ? 'Traveling...' : 'The Dungeon Master is pondering...' });

        let historyForGemini = [...currentHistory];

        // Summarization logic
        if (!systemInstructionOverride && historyForGemini.length >= SUMMARIZATION_THRESHOLD) {
            setLoading({ active: true, text: 'The DM is organizing their notes...' });
            try {
                const summaryText = await summarizeHistory(historyForGemini, gameState.type);
                const summaryEntry: StoryEntry = { type: 'info', text: `[Recap of past events]:\n${summaryText}` };
                const initialPrompt = historyForGemini[0];
                const latestPlayerAction = historyForGemini[historyForGemini.length - 1];
                historyForGemini = [initialPrompt, summaryEntry, latestPlayerAction];
            } catch (e) {
                console.error("Failed to summarize history, proceeding with full history:", e);
                const errorEntry: StoryEntry = { type: 'info', text: 'An error occurred while summarizing the story.' };
                setGameState(prev => prev ? ({...prev, storyHistory: [...prev.storyHistory, errorEntry]}) : null);
            }
        }

        try {
            const storyResponse = await generateStory(historyForGemini, gameState.type, systemInstructionOverride);

            const dmEntry: StoryEntry = { type: 'dm', text: storyResponse.scene };
            const newHistory = [...currentHistory, dmEntry];
            
            let finalGameStateUpdate: Partial<GameState> = {
                storyHistory: newHistory,
                suggestedActions: storyResponse.suggestedActions || [],
                skillCheck: storyResponse.skillCheck,
                isGameOver: storyResponse.isGameOver,
                gameOverReason: storyResponse.gameOverReason,
                ambiance: storyResponse.ambiance || 'default',
                shopInventory: storyResponse.shopInventory,
                readableContent: storyResponse.readableContent,
            };

            // Handle transactions
            if (storyResponse.transaction) {
                const { type, itemName, cost } = storyResponse.transaction;
                const currentProfiles = gameState.characterProfiles;
                let newGold = gameState.partyGold;
                let newProfiles = [...currentProfiles];

                if (type === 'sell') {
                    let itemSold = false;
                    newProfiles = currentProfiles.map(p => {
                        if (itemSold) return p;
                        const itemIndex = p.inventory.indexOf(itemName);
                        if (itemIndex > -1) {
                            const newInventory = [...p.inventory];
                            newInventory.splice(itemIndex, 1);
                            itemSold = true;
                            return { ...p, inventory: newInventory };
                        }
                        return p;
                    });
                    if (itemSold) {
                        newGold += cost;
                    }
                } else if (type === 'buy') {
                    if (newGold >= cost) {
                        newGold -= cost;
                        // Add item to the first character's inventory
                        const firstProfile = { ...newProfiles[0] };
                        firstProfile.inventory = [...firstProfile.inventory, itemName];
                        newProfiles[0] = firstProfile;

                        // Check if the purchased item is a map
                        if (itemName.toLowerCase().startsWith('map of ')) {
                            const mapId = itemName.toLowerCase().replace('map of ', '').replace(/\s+/g, '_');
                            if (ALL_MAPS[mapId]) {
                                const currentRevealed = gameState.revealedMapIds || [];
                                if (!currentRevealed.includes(mapId)) {
                                    finalGameStateUpdate.revealedMapIds = [...currentRevealed, mapId];
                                }
                            }
                        }
                    }
                }
                finalGameStateUpdate.characterProfiles = newProfiles;
                finalGameStateUpdate.partyGold = newGold;
            }
            
            if (storyResponse.isGameOver) {
                const infoEntry: StoryEntry = { type: 'info', text: storyResponse.gameOverReason };
                finalGameStateUpdate.storyHistory = [...newHistory, infoEntry];
                finalGameStateUpdate.ambiance = 'default';
            }
            
            setGameState(prev => prev ? ({ ...prev, ...finalGameStateUpdate }) : null);

            // Generate scene image if not on a map view
            const shouldGenerateImage = !storyResponse.shopInventory && !storyResponse.readableContent;
            
            if (shouldGenerateImage) {
                setLoading({ active: true, text: 'A vision forms in the ether...' });
                try {
                    const imageUrl = await generateSceneImage(storyResponse.summaryForImage);
                    setGameState(prev => prev ? ({ ...prev, sceneImage: imageUrl }) : null);
                } catch(imgError) {
                    console.error("Image generation failed, continuing story.", imgError);
                }
            }


        } catch (error: any) {
            console.error("An error occurred during the turn:", error);
            let errorText = 'An unknown mystical interference has occurred.';
            if (error?.error?.status === 'RESOURCE_EXHAUSTED' || error?.error?.code === 429) {
                errorText = "You've made too many requests in a short time. Please wait a moment. (Error: API rate limit)";
            } else if (error instanceof Error) {
                errorText = `The connection to the ethereal plane is unstable. (${error.message})`;
            }
            
            const errorEntry: StoryEntry = { type: 'info', text: errorText };
            setGameState(prev => prev ? ({ ...prev, storyHistory: [...prev.storyHistory, errorEntry] }) : null);
        } finally {
            setLoading({ active: false, text: '' });
        }
    };

    const handlePlayerAction = async (actionText: string) => {
        if (!actionText.trim() || loading.active) return;

        // If player wants to leave and is in a building, handle map transition first.
        if (/leave|exit|go outside/i.test(actionText) && gameState.currentCityLocationId) {
            handleMapAction({ type: 'return_to_city_map' });
            
            // We still want the AI to narrate the return to the streets.
            const newActionText = `The party returns to the streets of ${ALL_MAPS[gameState.currentMapId].name}.`;
            const newPlayerEntry: StoryEntry = { type: 'player', text: newActionText };
            const updatedHistory = [...gameState.storyHistory, newPlayerEntry];
            
            // This state update is temporary, just to show the player's action immediately.
            setGameState(prev => prev ? ({ ...prev, storyHistory: updatedHistory, suggestedActions: [], skillCheck: null, shopInventory: null, readableContent: null }) : null);
            setPlayerInput('');
            
            // Then process the turn with the AI.
            await processTurn(updatedHistory, SYSTEM_INSTRUCTION_CITY_ACTION);
            return;
        }
        
        const newPlayerEntry: StoryEntry = { type: 'player', text: actionText };
        const systemInstruction = gameState.partyGridPosition ? SYSTEM_INSTRUCTION_EXPLORE : SYSTEM_INSTRUCTION_CITY_ACTION;

        const updatedHistory = [...gameState.storyHistory, newPlayerEntry];
        setGameState(prev => prev ? ({ 
            ...prev, 
            storyHistory: updatedHistory, 
            suggestedActions: [], 
            skillCheck: null,
            // Clear contextual views on new action
            shopInventory: null,
            readableContent: null
        }) : null);
        setPlayerInput('');

        setSkillCheckInputMode(null);
        setManualRollValue('');
        setDigitalRollResult(null);
        setSkillCheckError(null);
        
        await processTurn(updatedHistory, systemInstruction);
    };

    const handleMapAction = async (action: MapAction) => {
        // Handle leaving the city to the world map
        if(action.type === 'leave_city') {
            const worldMapId = 'silverwood_forest'; // This could be made dynamic later
            const worldMap = ALL_MAPS[worldMapId] as GridMap;
            const infoEntry: StoryEntry = { type: 'info', text: `The party leaves Silverhaven and enters the ${worldMap.name}.` };
            setGameState(prev => {
                if (!prev) return null;
                const startPosKey = `${worldMap.startPosition.x},${worldMap.startPosition.y}`;
                return {
                    ...prev,
                    currentMapId: worldMapId,
                    currentCityLocationId: null,
                    partyGridPosition: worldMap.startPosition,
                    storyHistory: [...prev.storyHistory, infoEntry],
                    visitedTiles: { ...prev.visitedTiles, [startPosKey]: true },
                    shopInventory: null,
                    readableContent: null,
                };
            });
            return;
        }

        // Handle moving to a new location within the city
        if(action.type === 'travel_city') {
            const cityMap = ALL_MAPS[gameState.currentMapId] as CityMap;
            const destination = cityMap.locations.find(l => l.id === action.locationId);
            if(!destination) return;

            setGameState(prev => prev ? ({ ...prev, currentCityLocationId: action.locationId }) : null);

            const actionText = `The party heads to ${destination.name}.`;
            await handlePlayerAction(actionText);
        }

        // Handle moving on the world grid
        if(action.type === 'travel_grid') {
            const gridMap = ALL_MAPS[gameState.currentMapId] as GridMap;
            const tile = gridMap.tiles[action.newPosition.y][action.newPosition.x];
            
            const newPosKey = `${action.newPosition.x},${action.newPosition.y}`;

            // Handle re-entering a city
            if (tile.terrain === 'city_gate') {
                const cityMapId = 'silverhaven'; // Hardcoded for now
                const cityMap = ALL_MAPS[cityMapId] as CityMap;
                const infoEntry: StoryEntry = { type: 'info', text: `The party returns to the gates of ${cityMap.name}.` };
                setGameState(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        currentMapId: cityMapId,
                        currentCityLocationId: null, // On the streets/at the gate
                        partyGridPosition: null,
                        storyHistory: [...prev.storyHistory, infoEntry],
                    };
                });
                 await handlePlayerAction(`The party arrives at the gates of ${cityMap.name}.`);
                return;
            }
            
            // Standard grid move
            setGameState(prev => prev ? ({ 
                ...prev, 
                partyGridPosition: action.newPosition, 
                movementPoints: prev.movementPoints - 1,
                visitedTiles: { ...prev.visitedTiles, [newPosKey]: true },
            }) : null);
            const actionText = `The party moves through the ${tile.terrain} to a new area.`;
            await handlePlayerAction(actionText);
        }

        // Handle returning to city map from a location
        if (action.type === 'return_to_city_map') {
            const infoEntry: StoryEntry = { type: 'info', text: 'The party returns to the city streets.' };
            setGameState(prev => prev ? ({
                ...prev,
                currentCityLocationId: null,
                storyHistory: [...prev.storyHistory, infoEntry],
                shopInventory: null,
                readableContent: null,
            }) : null);
        }
    };


    const confirmSkillCheckRoll = async (roll: number) => {
        if (!gameState.skillCheck) return;
        
        const resultText = `The party attempts a ${gameState.skillCheck.skill} check (DC ${gameState.skillCheck.difficultyClass}). Rolled a d20: ${roll}.`;
        const infoEntry: StoryEntry = { type: 'info', text: resultText };
        const updatedHistory = [...gameState.storyHistory, infoEntry];
        
        setSkillCheckInputMode(null);
        setManualRollValue('');
        setDigitalRollResult(null);
        setSkillCheckError(null);
        
        const instruction = gameState.partyGridPosition ? SYSTEM_INSTRUCTION_EXPLORE : SYSTEM_INSTRUCTION_CITY_ACTION;
        
        setGameState(prev => prev ? ({ ...prev, storyHistory: updatedHistory, skillCheck: null }) : null);
        
        await processTurn(updatedHistory, instruction);
    };

    const handleManualRollConfirm = () => {
        setSkillCheckError(null);
        const value = parseInt(manualRollValue, 10);
        if (isNaN(value) || value < 1 || value > 20) {
          setSkillCheckError("Please enter a valid number from 1 to 20.");
          return;
        }
        confirmSkillCheckRoll(value);
    };

    const handleDigitalRoll = () => {
        const roll = Math.floor(Math.random() * 20) + 1;
        setDigitalRollResult(roll);
    };


    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-200" style={{ fontFamily: "'Georgia', serif" }}>
            <audio ref={audioRef} loop />
            {loading.active && <Loading text={loading.text} />}
            {isMapOpen && <MapPage gameState={gameState} onClose={() => setIsMapOpen(false)} />}
            
            <header className="w-full p-3 bg-gray-800 shadow-lg z-20 flex justify-between items-center border-b border-gray-700">
                <div className="flex-1">
                    <h1 className="text-lg md:text-xl font-bold text-cyan-400 truncate pr-4">{gameState.name}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? <MuteIcon /> : <VolumeIcon />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => {
                                setVolume(parseFloat(e.target.value));
                                if (isMuted) setIsMuted(false);
                            }}
                            className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <button onClick={() => setIsMapOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex-shrink-0">
                        Map
                    </button>
                    <button onClick={onExit} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex-shrink-0">
                        Exit to Menu
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden w-full h-full flex flex-row">
                 <aside className="w-2/5 h-full bg-black relative flex items-center justify-center transition-all duration-500 border-r-2 border-gray-700">
                    <ContextualView gameState={gameState} onMapAction={handleMapAction} onPlayerAction={handlePlayerAction}/>
                </aside>
                
                <section className="w-3/5 flex-1 flex flex-col p-4 bg-gray-800 bg-opacity-50 overflow-hidden">
                    <div className="flex-1 overflow-y-auto mb-4 p-2 rounded-md bg-black bg-opacity-30 custom-scrollbar">
                        {gameState.storyHistory.map((entry, index) => (
                             (entry.type === 'player' && index === 0) ? null : // Hide the initial system prompt
                            <div key={index} className={`mb-4 flex flex-col ${entry.type === 'player' ? 'items-end' : 'items-start'}`}>
                                {entry.type === 'info' ? (
                                    <div className="w-full text-center p-2 my-2 bg-yellow-900 bg-opacity-70 rounded-lg italic border border-yellow-700">
                                        <p className="whitespace-pre-wrap">{entry.text}</p>
                                    </div>
                                ) : (
                                    <div className={`max-w-xl p-3 rounded-lg shadow-md ${entry.type === 'dm' ? 'bg-indigo-900' : 'bg-cyan-900'}`}>
                                        <div className="flex items-center justify-between mb-1 text-sm font-bold">
                                            <div className={`flex items-center ${entry.type === 'dm' ? 'text-indigo-300' : 'text-cyan-200'}`}>
                                                {entry.type === 'dm' ? <DMIcon /> : <PlayerIcon />}
                                                <span className="ml-2">{entry.type === 'dm' ? 'Dungeon Master' : 'The Party'}</span>
                                            </div>
                                            {entry.type === 'dm' && (
                                                <button onClick={() => handleSpeak(entry.text)} title={speakingText === entry.text ? "Stop reading" : "Read aloud"} className="p-1 rounded-full hover:bg-indigo-700 transition-colors">
                                                    <SpeakerIcon className={speakingText === entry.text ? "text-cyan-300 animate-pulse" : "text-gray-400"} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="whitespace-pre-wrap text-gray-100">{entry.text}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={storyEndRef} />
                    </div>
    
                    {gameState.isGameOver ? (
                        <div className="text-center p-4 bg-black bg-opacity-50 rounded-lg">
                            <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
                            <p className="text-xl mb-6">{gameState.gameOverReason}</p>
                            <button onClick={onExit} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors">
                                Main Menu
                            </button>
                        </div>
                    ) : gameState.skillCheck ? (
                        <div className="text-center p-4 bg-purple-900 bg-opacity-80 rounded-lg border border-purple-600">
                             <h3 className="text-2xl font-bold text-purple-200 mb-2">Skill Check!</h3>
                             <p className="text-lg text-gray-300 mb-4">{gameState.skillCheck.skill} (DC: {gameState.skillCheck.difficultyClass})</p>
                             
                             {!skillCheckInputMode ? (
                                <div className="flex justify-center items-center gap-6">
                                    <button onClick={() => setSkillCheckInputMode('physical')} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors">Enter My Roll</button>
                                    <button onClick={() => setSkillCheckInputMode('digital')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors">Roll For Me</button>
                                </div>
                            ) : skillCheckInputMode === 'physical' ? (
                                <div className="flex flex-col items-center gap-2">
                                    <input type="number" value={manualRollValue} onChange={e => setManualRollValue(e.target.value)} min="1" max="20" placeholder="Enter d20 roll" className="w-48 text-center p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                    {skillCheckError && <p className="text-red-400 text-sm mt-2">{skillCheckError}</p>}
                                    <button onClick={handleManualRollConfirm} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md mt-2">Confirm</button>
                                    <button onClick={() => { setSkillCheckInputMode(null); setSkillCheckError(null); }} className="text-xs text-gray-400 hover:text-white mt-1">Cancel</button>
                                </div>
                            ) : ( // digital mode
                                <div className="flex flex-col items-center">
                                    {!digitalRollResult ? (
                                        <div>
                                            <button onClick={handleDigitalRoll} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-md text-xl transition-colors">Roll d20</button>
                                            <button onClick={() => setSkillCheckInputMode(null)} className="block mx-auto text-xs text-gray-400 hover:text-white mt-2">Cancel</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-5xl font-bold p-4 border-2 rounded-lg border-gray-500 text-gray-200 mb-4">{digitalRollResult}</p>
                                            <button onClick={() => confirmSkillCheckRoll(digitalRollResult)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md text-lg">Confirm & Continue</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                             {gameState.suggestedActions.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                    {gameState.suggestedActions.map((action, i) => (
                                        <button key={i} onClick={() => handlePlayerAction(action)} disabled={loading.active}
                                            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors disabled:opacity-50 text-left">
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); handlePlayerAction(playerInput);}} className="flex">
                                <input
                                    type="text"
                                    value={playerInput}
                                    onChange={(e) => setPlayerInput(e.target.value)}
                                    placeholder="Or type your custom action..."
                                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                    disabled={loading.active || !!gameState.skillCheck}
                                    aria-label="Player action input"
                                />
                                <button
                                    type="submit"
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-r-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    disabled={loading.active || !playerInput.trim() || !!gameState.skillCheck}
                                    aria-label="Submit player action"
                                >
                                    Act
                                </button>
                            </form>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
export default GameScreen;
