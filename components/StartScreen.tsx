
import React, { useState, useEffect } from 'react';
import type { PlayerClass, PlayerRace, PlayerLoyalty, PlayerBackstory, PlayerTrait, PlayerFault, CharacterProfile, Attributes, EquipmentPack, GeminiRecommendationResponse, CharacterCreationStep } from '../types';
import { PLAYER_CLASSES, PLAYER_RACES, PLAYER_LOYALTIES, PLAYER_BACKSTORIES, PLAYER_TRAITS, PLAYER_FAULTS, ATTRIBUTES_LIST, GEAR_OPTIONS } from '../constants';
import { PREBUILT_CHARACTERS } from './prebuiltCharacters';
import { generateCharacterRecommendations } from '../services/geminiService';
import Loading from './Loading';

interface StartScreenProps {
  onGameStart: (profiles: CharacterProfile[]) => void;
  onBack: () => void;
}

const ProgressStep: React.FC<{ step: number; currentStep: number; label: string; isComplete: boolean }> = ({ step, currentStep, label, isComplete }) => {
  const isActive = step === currentStep;
  return (
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isComplete ? 'bg-cyan-500 text-white' : isActive ? 'bg-cyan-700 text-cyan-200 border-2 border-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
        {isComplete ? '✓' : step}
      </div>
      <span className={`ml-2 font-semibold transition-colors duration-300 text-xs md:text-base ${isActive ? 'text-cyan-300' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
};

const StartScreen: React.FC<StartScreenProps> = ({ onGameStart, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: Size, 1: Creation, 2: Summary
  const [creationStep, setCreationStep] = useState<CharacterCreationStep>('choice');
  const [partySize, setPartySize] = useState(1);
  const [finishedProfiles, setFinishedProfiles] = useState<CharacterProfile[]>([]);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  
  // State for the character currently being created
  const [characterName, setCharacterName] = useState('');
  const [selectedRace, setSelectedRace] = useState<PlayerRace | null>(null);
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [selectedLoyalty, setSelectedLoyalty] = useState<PlayerLoyalty | null>(null);
  const [selectedBackstory, setSelectedBackstory] = useState<PlayerBackstory | null>(null);
  const [customBackstory, setCustomBackstory] = useState('');
  const [selectedTraits, setSelectedTraits] = useState<PlayerTrait[]>([]);
  const [selectedFaults, setSelectedFaults] = useState<PlayerFault[]>([]);
  const [attributes, setAttributes] = useState<Attributes>({ Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Wisdom: 0, Charisma: 0 });
  const [selectedWeapon, setSelectedWeapon] = useState<string>('');
  const [customWeaponDescription, setCustomWeaponDescription] = useState('');
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPack | null>(null);
  
  const [baseAttributes, setBaseAttributes] = useState<Attributes>({ Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Wisdom: 0, Charisma: 0 });
  const [attributeInputMode, setAttributeInputMode] = useState<'physical' | 'digital' | null>(null);
  const [manualRollValue, setManualRollValue] = useState('');
  const [rollingState, setRollingState] = useState<{ dice: number[]; total: number | null; } | null>(null);

  const [recommendations, setRecommendations] = useState<GeminiRecommendationResponse | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const creationStepsOrder: CharacterCreationStep[] = ['race', 'class', 'loyalty', 'backstory', 'traits', 'faults', 'attributes', 'gear', 'inventory', 'recommendations', 'name'];
  const MAX_SELECT = 2;

  const resetCurrentCharacterState = () => {
    setCreationStep('choice');
    setCharacterName('');
    setSelectedRace(null);
    setSelectedClass(null);
    setSelectedLoyalty(null);
    setSelectedBackstory(null);
    setCustomBackstory('');
    setSelectedTraits([]);
    setSelectedFaults([]);
    setBaseAttributes({ Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Wisdom: 0, Charisma: 0 });
    setAttributes({ Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Wisdom: 0, Charisma: 0 });
    setSelectedWeapon('');
    setCustomWeaponDescription('');
    setSelectedSpells([]);
    setSelectedEquipment(null);
    setAttributeInputMode(null);
    setManualRollValue('');
    setRollingState(null);
    setRecommendations(null);
    setIsRecommending(false);
    setError(null);
  };

  const repopulateStateForCharacter = (profile: CharacterProfile) => {
    setCharacterName(profile.characterName);
    setSelectedRace(profile.playerRace);
    setSelectedClass(profile.playerClass);
    setSelectedLoyalty(profile.playerLoyalty);
    setSelectedBackstory(profile.playerBackstory);
    setCustomBackstory(profile.customBackstory);
    setSelectedTraits(profile.playerTraits);
    setSelectedFaults(profile.playerFaults);
    setAttributes(profile.attributes);
    
    const finalAttrs = { ...profile.attributes };
    if(profile.playerRace) {
      for (const [attr, bonus] of Object.entries(profile.playerRace.attributeBonuses)) {
        finalAttrs[attr as keyof Attributes] -= bonus || 0;
      }
    }
    setBaseAttributes(finalAttrs);
    
    setAttributeInputMode(null);
    setRollingState(null);

    setSelectedEquipment(profile.equipmentPack);
    setSelectedSpells(profile.spells);
    if (GEAR_OPTIONS[profile.playerClass.name]?.weaponStyles.includes(profile.weaponStyle)) {
        setSelectedWeapon(profile.weaponStyle);
        setCustomWeaponDescription('');
    } else {
        setSelectedWeapon('Custom Weapon');
        setCustomWeaponDescription(profile.weaponStyle);
    }
    setRecommendations(null);
  }
  
  useEffect(() => {
    if (creationStep === 'recommendations' && !recommendations && !isRecommending) {
        const fetchRecommendations = async () => {
            if (!selectedRace || !selectedClass || !selectedLoyalty) {
              setError("Please select Race, Class, and Loyalty before getting recommendations.");
              return;
            }
            setIsRecommending(true);
            setError(null);
            try {
                const result = await generateCharacterRecommendations(selectedRace.name, selectedClass.name, selectedLoyalty.name);
                setRecommendations(result);
            } catch (err) {
                console.error(err);
                setError("Could not generate recommendations at this time. Please proceed manually.");
            } finally {
                setIsRecommending(false);
            }
        };
        fetchRecommendations();
    }
}, [creationStep, selectedRace, selectedClass, selectedLoyalty, recommendations, isRecommending]);

  const handleNext = () => {
    setError(null);

    // --- Validation ---
    if (creationStep === 'race' && !selectedRace) { setError('Please select a race.'); return; }
    if (creationStep === 'class' && !selectedClass) { setError('Please select a class.'); return; }
    if (creationStep === 'loyalty' && !selectedLoyalty) { setError('Please select a loyalty.'); return; }
    if (creationStep === 'backstory' && !selectedBackstory) { setError('Please select a backstory.'); return; }
    if (creationStep === 'backstory' && selectedBackstory?.name === 'Custom' && !customBackstory.trim()) { setError('Please write a custom backstory.'); return; }
    if (creationStep === 'traits' && selectedTraits.length === 0) { setError('Please select at least one trait.'); return; }
    if (creationStep === 'faults' && selectedFaults.length === 0) { setError('Please select at least one fault.'); return; }
    if (creationStep === 'attributes' && Object.values(baseAttributes).some(v => v === 0)) { setError('Please set all attributes.'); return; }
    if (creationStep === 'gear') {
        if(!selectedWeapon) { setError('Please select a weapon style.'); return; }
        if (selectedWeapon === 'Custom Weapon' && !customWeaponDescription.trim()) { setError('Please describe your custom weapon.'); return; }
        if(!selectedEquipment) { setError('Please select an equipment pack.'); return; }
        const gear = GEAR_OPTIONS[selectedClass!.name];
        if(gear?.spells && selectedSpells.length !== gear.spells.max) { setError(`Please select exactly ${gear.spells.max} spells.`); return; }
    }
    if (creationStep === 'name' && !characterName.trim()) { setError('Please enter a name.'); return; }
    
    // --- Finish Character ---
    if (creationStep === 'name') {
        finishCharacter();
    } else {
    // --- Navigation ---
        const currentIndex = creationStepsOrder.indexOf(creationStep);
        if (currentIndex < creationStepsOrder.length - 1) {
            setCreationStep(creationStepsOrder[currentIndex + 1]);
        }
    }
  };

  const finishCharacter = (profile?: CharacterProfile) => {
    let newProfile: CharacterProfile;
    if (profile) {
        newProfile = profile;
    } else {
        const synergyBonus = selectedRace && selectedClass ? selectedClass.synergies[selectedRace.name] || null : null;
        const finalAttributes = { ...baseAttributes };
        if (selectedRace) {
            for (const [attr, bonus] of Object.entries(selectedRace.attributeBonuses)) {
                finalAttributes[attr as keyof Attributes] += bonus || 0;
            }
        }
        const traitAndFaultSynergies = [
            ...selectedTraits.flatMap(t => Object.entries(t.synergies || {}).filter(([key]) => key === `Class:${selectedClass!.name}` || key === `Race:${selectedRace!.name}`).map(([, value]) => value)),
            ...selectedFaults.flatMap(f => Object.entries(f.synergies || {}).filter(([key]) => key === `Class:${selectedClass!.name}` || key === `Race:${selectedRace!.name}`).map(([, value]) => value))
        ];

        newProfile = {
            characterName: characterName.trim(), playerRace: selectedRace!, playerClass: selectedClass!, playerLoyalty: selectedLoyalty!,
            playerBackstory: selectedBackstory!, customBackstory: customBackstory.trim(), playerTraits: selectedTraits, playerFaults: selectedFaults,
            attributes: finalAttributes, 
            weaponStyle: selectedWeapon === 'Custom Weapon' ? customWeaponDescription.trim() : selectedWeapon, 
            spells: selectedSpells, 
            equipmentPack: selectedEquipment!,
            inventory: selectedEquipment!.items,
            synergyBonus,
            traitAndFaultSynergies
        };
    }

    const updatedProfiles = [...finishedProfiles, newProfile];
    setFinishedProfiles(updatedProfiles);

    if (currentCharacterIndex < partySize - 1) {
        setCurrentCharacterIndex(i => i + 1);
        resetCurrentCharacterState();
    } else {
        setCurrentStep(s => s + 1); // Move to final summary
    }
  }

  const handleInternalBack = () => {
    setError(null);
    if (currentStep === 0) {
      onBack();
      return;
    }

    if(currentStep === 1) { // In character creation
      const currentIndex = creationStepsOrder.indexOf(creationStep);

      if (creationStep === 'prebuilt' || creationStep === 'choice') {
          // Go back to party size selection if it's the first character
          if (currentCharacterIndex === 0) {
            setCurrentStep(0);
          } else {
            // Go back to editing the previous character
            const prevCharIndex = currentCharacterIndex - 1;
            const prevProfile = finishedProfiles[prevCharIndex];
            setFinishedProfiles(profiles => profiles.slice(0, prevCharIndex));
            setCurrentCharacterIndex(prevCharIndex);
            repopulateStateForCharacter(prevProfile);
            setCreationStep('name'); // Go to the last step of the previous char
          }
      } else if (currentIndex > 0) {
        setCreationStep(creationStepsOrder[currentIndex - 1]);
      } else {
        // From race back to choice
        setCreationStep('choice');
      }
    } else if (currentStep === 2) { // In summary view
        // Go back to editing the last character
        const lastCharIndex = partySize - 1;
        const lastProfile = finishedProfiles[lastCharIndex];
        setFinishedProfiles(profiles => profiles.slice(0, lastCharIndex));
        setCurrentCharacterIndex(lastCharIndex);
        repopulateStateForCharacter(lastProfile);
        setCurrentStep(1);
        setCreationStep('name');
    }
  };
  
  const handlePrebuiltSelect = (character: CharacterProfile) => {
    finishCharacter(character);
  }

  const handleSetPartySize = (size: number) => {
    setPartySize(size);
    setFinishedProfiles([]);
    setCurrentCharacterIndex(0);
    setCurrentStep(1);
    resetCurrentCharacterState();
  };

  const handleAttributeRoll = (attribute: keyof Attributes) => {
    if (rollingState?.total) return; // Don't re-roll
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => b - a);
    const total = dice.slice(0, 3).reduce((sum, val) => sum + val, 0);
    setRollingState({ dice, total });
  };
  
  const confirmAttributeRoll = (attribute: keyof Attributes) => {
    if (rollingState?.total) {
      setBaseAttributes(prev => ({ ...prev, [attribute]: rollingState.total! }));
      setAttributeInputMode(null);
      setRollingState(null);
      setManualRollValue('');
    }
  };

  const handleManualAttributeConfirm = (attribute: keyof Attributes) => {
      const value = parseInt(manualRollValue, 10);
      if (isNaN(value) || value < 3 || value > 18) {
          setError("Please enter a valid number from 3 to 18 for an attribute score.");
          return;
      }
      setBaseAttributes(prev => ({ ...prev, [attribute]: value }));
      setAttributeInputMode(null);
      setManualRollValue('');
      setError(null);
  };
  
  const getCombinedAttributes = () => {
    const combined = { ...baseAttributes };
    if (selectedRace) {
      for (const [attr, bonus] of Object.entries(selectedRace.attributeBonuses)) {
        if (combined[attr as keyof Attributes] > 0) {
            combined[attr as keyof Attributes] += bonus || 0;
        }
      }
    }
    return combined;
  };

  const toggleTrait = (trait: PlayerTrait) => {
    setSelectedTraits(prev => {
        const isSelected = prev.find(t => t.name === trait.name);
        if (isSelected) {
            return prev.filter(t => t.name !== trait.name);
        }
        if (prev.length < MAX_SELECT) {
            return [...prev, trait];
        }
        return prev;
    });
  };

  const toggleFault = (fault: PlayerFault) => {
    setSelectedFaults(prev => {
        const isSelected = prev.find(f => f.name === fault.name);
        if (isSelected) {
            return prev.filter(f => f.name !== fault.name);
        }
        if (prev.length < MAX_SELECT) {
            return [...prev, fault];
        }
        return prev;
    });
  };

  const toggleSpell = (spellName: string) => {
    const maxSpells = GEAR_OPTIONS[selectedClass!.name].spells!.max;
    setSelectedSpells(prev => {
        const isSelected = prev.includes(spellName);
        if (isSelected) {
            return prev.filter(s => s !== spellName);
        }
        if (prev.length < maxSpells) {
            return [...prev, spellName];
        }
        return prev;
    });
  };

  // --- RENDER LOGIC ---

  const renderCurrentStep = () => {
    switch (creationStep) {
        case 'choice':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">Create Your Character</h2>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <button onClick={() => setCreationStep('race')} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-8 rounded-md text-xl transition-all w-full md:w-80">Create a Custom Character</button>
                        <button onClick={() => setCreationStep('prebuilt')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-md text-xl transition-all w-full md:w-80">Choose a Pre-built Hero</button>
                    </div>
                </div>
            );

        case 'prebuilt':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">Choose a Pre-built Hero</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {PREBUILT_CHARACTERS.map((char, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-left flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-cyan-300">{char.characterName}</h3>
                                    <p className="text-gray-400 italic">{char.playerRace.name} {char.playerClass.name}</p>
                                    <p className="mt-2 text-sm">{char.playerBackstory.description}</p>
                                </div>
                                <button onClick={() => handlePrebuiltSelect(char)} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors w-full">Select {char.characterName}</button>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'race':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">Choose Your Race</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {PLAYER_RACES.map(race => (
                            <div key={race.name} onClick={() => setSelectedRace(race)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRace?.name === race.name ? 'border-cyan-500 bg-cyan-900 bg-opacity-30' : 'border-gray-700 hover:border-cyan-600'}`}>
                                <img src={race.imageUrl} alt={race.name} className="w-full h-32 object-cover rounded-md mb-2"/>
                                <h3 className="font-bold text-lg text-cyan-200">{race.name}</h3>
                                <p className="text-xs text-gray-400">{race.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'class':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">Choose Your Class</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {PLAYER_CLASSES.map(pClass => {
                            const hasSynergy = selectedRace && pClass.synergies[selectedRace.name];
                            return (
                                <div key={pClass.name} onClick={() => setSelectedClass(pClass)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center text-center 
                                    ${selectedClass?.name === pClass.name ? 'border-cyan-500 bg-cyan-900 bg-opacity-30' : 'border-gray-700 hover:border-cyan-600'}
                                    ${hasSynergy ? 'border-yellow-400' : ''}
                                    `}>
                                    <div className={`mb-2 ${hasSynergy ? 'text-yellow-300' : ''}`}><pClass.icon /></div>
                                    <h3 className="font-bold text-lg text-cyan-200">{pClass.name}</h3>
                                    <p className="text-xs text-gray-400 flex-grow">{pClass.description}</p>
                                    {hasSynergy && <p className="text-xs text-yellow-300 mt-2 p-1 bg-yellow-900 bg-opacity-50 rounded italic">{pClass.synergies[selectedRace!.name]}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        case 'loyalty':
             return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">What is your Character's Loyalty?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLAYER_LOYALTIES.map(loyalty => (
                            <div key={loyalty.name} onClick={() => setSelectedLoyalty(loyalty)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedLoyalty?.name === loyalty.name ? 'border-cyan-500 bg-cyan-900 bg-opacity-30' : 'border-gray-700 hover:border-cyan-600'}`}>
                                <h3 className="font-bold text-lg text-cyan-200">{loyalty.name}</h3>
                                <p className="text-sm text-gray-400">{loyalty.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'backstory':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">What is your Character's Backstory?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLAYER_BACKSTORIES.map(backstory => (
                            <div key={backstory.name} onClick={() => setSelectedBackstory(backstory)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedBackstory?.name === backstory.name ? 'border-cyan-500 bg-cyan-900 bg-opacity-30' : 'border-gray-700 hover:border-cyan-600'}`}>
                                <h3 className="font-bold text-lg text-cyan-200">{backstory.name}</h3>
                                <p className="text-sm text-gray-400">{backstory.description}</p>
                            </div>
                        ))}
                    </div>
                    {selectedBackstory?.name === 'Custom' && (
                        <div className="mt-6">
                            <textarea
                                value={customBackstory}
                                onChange={(e) => setCustomBackstory(e.target.value)}
                                placeholder="Describe your unique past..."
                                className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    )}
                </div>
            );
        
        case 'traits':
        case 'faults':
            const isTraits = creationStep === 'traits';
            const items = isTraits ? PLAYER_TRAITS : PLAYER_FAULTS;
            const selectedItems = isTraits ? selectedTraits : selectedFaults;
            const toggleFn = isTraits ? toggleTrait : toggleFault;
            
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-2">Choose {MAX_SELECT} {isTraits ? 'Traits' : 'Faults'}</h2>
                    <p className="text-gray-400 text-center mb-6">These qualities will shape how your character interacts with the world.</p>
                    <div className="space-y-3 max-w-4xl mx-auto">
                        {items.map(item => {
                            const isSelected = !!selectedItems.find(s => s.name === item.name);
                            const synergyText = item.synergies && selectedClass && selectedRace ? (item.synergies[`Class:${selectedClass.name}`] || item.synergies[`Race:${selectedRace.name}`]) : null;

                            return (
                                <div key={item.name} onClick={() => toggleFn(item as any)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center
                                    ${isSelected ? 'border-cyan-500 bg-cyan-900 bg-opacity-30' : 'border-gray-700 hover:border-cyan-600'}
                                    ${synergyText ? (isTraits ? 'border-yellow-400' : 'border-red-500') : ''}
                                    `}
                                >
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg text-cyan-200">{item.name}</h3>
                                        <p className="text-sm text-gray-400">{item.description}</p>
                                         {synergyText && <p className={`text-xs mt-1 p-1 rounded italic ${isTraits ? 'text-yellow-300 bg-yellow-900 bg-opacity-50' : 'text-red-300 bg-red-900 bg-opacity-50'}`}>{synergyText}</p>}
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 ml-4 flex-shrink-0 ${isSelected ? 'bg-cyan-500 border-cyan-300' : 'border-gray-500'}`}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );

        case 'attributes':
            const combinedAttributes = getCombinedAttributes();
            const allAttributesSet = Object.values(baseAttributes).every(v => v > 0);

            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-2">Set Your Attributes</h2>
                    <p className="text-gray-400 text-center mb-6">Determine your character's core strengths and weaknesses. You can roll dice or manually enter scores.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {ATTRIBUTES_LIST.map(attr => (
                            <div key={attr} className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
                                <h3 className="text-xl font-bold text-cyan-300">{attr}</h3>
                                {baseAttributes[attr] === 0 ? (
                                    attributeInputMode === null ? (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <button onClick={() => setAttributeInputMode('physical')} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors">Enter My Roll</button>
                                            <button onClick={() => { setAttributeInputMode('digital'); handleAttributeRoll(attr); }} className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors">Roll For Me</button>
                                        </div>
                                    ) : attributeInputMode === 'physical' ? (
                                        <div className="mt-2">
                                            <input type="number" min="3" max="18" placeholder="3-18" value={manualRollValue} onChange={e => setManualRollValue(e.target.value)} className="w-24 text-center p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                            <button onClick={() => handleManualAttributeConfirm(attr)} className="ml-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors">Set</button>
                                            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                                        </div>
                                    ) : ( // digital
                                        rollingState ? (
                                            <div className="mt-2">
                                                <div className="flex justify-center items-center gap-1 text-sm text-gray-400">
                                                    {rollingState.dice.map((d, i) => <span key={i} className={i < 3 ? 'text-white' : 'line-through'}>{d}</span>)}
                                                </div>
                                                <p className="text-4xl font-bold my-2">{rollingState.total}</p>
                                                <button onClick={() => confirmAttributeRoll(attr)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors">Confirm</button>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Rolling...</p>
                                        )
                                    )
                                ) : (
                                    <p className="text-5xl font-bold my-4">{combinedAttributes[attr]}</p>
                                )}
                                {selectedRace?.attributeBonuses[attr] && baseAttributes[attr] > 0 && <p className="text-sm text-green-400">(+{selectedRace.attributeBonuses[attr]} bonus)</p>}
                            </div>
                        ))}
                    </div>
                     {attributeInputMode && <button onClick={() => setAttributeInputMode(null)} className="text-sm text-gray-400 hover:text-white mt-4 block mx-auto">Cancel Roll</button>}
                </div>
            );
        
        case 'gear':
            const gearOptions = GEAR_OPTIONS[selectedClass!.name];
            if (!gearOptions) return <div>Class not configured for gear.</div>;
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">Select Your Gear</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div>
                            <h3 className="text-xl font-bold text-cyan-300 mb-3">Weapon Style</h3>
                            <div className="space-y-2">
                                {gearOptions.weaponStyles.map(style => (
                                    <button key={style} onClick={() => setSelectedWeapon(style)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedWeapon === style ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>
                             {selectedWeapon === 'Custom Weapon' && (
                                <div className="mt-4">
                                    <input type="text" value={customWeaponDescription} onChange={e => setCustomWeaponDescription(e.target.value)} placeholder="Describe your custom weapon(s)" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-cyan-300 mb-3">Equipment Pack</h3>
                            <div className="space-y-2">
                                {gearOptions.equipmentPacks.map(pack => (
                                     <div key={pack.name} onClick={() => setSelectedEquipment(pack)} className={`p-3 rounded-md transition-colors cursor-pointer ${selectedEquipment?.name === pack.name ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        <h4 className="font-bold">{pack.name}</h4>
                                        <p className="text-xs text-gray-300">{pack.items.join(', ')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {gearOptions.spells && (
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-bold text-cyan-300 mb-3">Spells (Choose {gearOptions.spells.max})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {gearOptions.spells.list.map(spell => {
                                        const isSelected = selectedSpells.includes(spell.name);
                                        return (
                                            <div key={spell.name} onClick={() => toggleSpell(spell.name)} className={`p-3 rounded-md transition-colors cursor-pointer ${isSelected ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                                <h4 className="font-bold">{spell.name}</h4>
                                                <p className="text-xs text-gray-300">{spell.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'inventory': return <div>Inventory (Not Implemented)</div>
        
        case 'recommendations':
            return (
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-6">Creative Suggestions</h2>
                    {isRecommending && <Loading text="The Muse inspires your character..." />}
                    {recommendations && (
                        <div className="p-6 bg-gray-800 rounded-lg max-w-2xl mx-auto animate-fade-in">
                            <h3 className="text-xl font-bold text-cyan-300 mb-2">Suggested Name:</h3>
                            <p className="text-2xl font-semibold mb-6">{recommendations.suggestedName}</p>
                            <h3 className="text-xl font-bold text-cyan-300 mb-2">Suggested Backstory Snippet:</h3>
                            <p className="italic text-gray-300 mb-8">"{recommendations.suggestedBackstory}"</p>
                            <button 
                                onClick={() => {
                                    setCharacterName(recommendations.suggestedName);
                                    if(selectedBackstory?.name === 'Custom') {
                                        setCustomBackstory(recommendations.suggestedBackstory);
                                    }
                                    handleNext();
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors"
                            >
                                Accept Suggestions & Continue
                            </button>
                        </div>
                    )}
                    <p className="text-gray-400 my-4">or</p>
                    <button onClick={handleNext} className="text-cyan-400 hover:text-cyan-200">Continue without suggestions →</button>
                </div>
            );
        
        case 'name':
            return (
                <div>
                    <h2 className="text-3xl font-bold text-center mb-6">What is your Character's Name?</h2>
                    <input
                        type="text"
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        placeholder="Enter character name"
                        className="w-full max-w-md mx-auto block p-4 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-2xl text-center"
                    />
                </div>
            );
        default:
            return <div>Unknown Step</div>;
    }
  };

  if (currentStep === 0) {
      return (
         <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-8">How many adventurers in your party?</h1>
             <div className="flex space-x-6 mb-12">
                {[1, 2, 3, 4].map(size => (
                    <button key={size} onClick={() => handleSetPartySize(size)}
                        className="w-32 h-32 bg-gray-800 hover:bg-cyan-800 border-2 border-gray-700 hover:border-cyan-500 rounded-lg text-6xl font-bold transition-all transform hover:scale-105"
                    >{size}</button>
                ))}
            </div>
             <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">Back</button>
        </div>
      );
  }
  
  if (currentStep === 2) {
      return (
          <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-8">Your Party is Ready!</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {finishedProfiles.map((p, i) => (
                    <div key={i} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-bold text-cyan-300">{p.characterName}</h2>
                        <p className="text-gray-400">{p.playerRace.name} {p.playerClass.name}</p>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-6">
                 <button onClick={handleInternalBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">Back</button>
                <button onClick={() => onGameStart(finishedProfiles)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-md text-xl transition-transform transform hover:scale-105">Begin Adventure!</button>
            </div>
        </div>
      );
  }

  // Character Creation View
  const progressLabels = ['Race', 'Class', 'Loyalty', 'Backstory', 'Traits', 'Faults', 'Attributes', 'Gear', 'Suggest', 'Name'];
  const currentProgressStep = creationStepsOrder.indexOf(creationStep);

  return (
    <div className="min-h-screen bg-gray-800 text-gray-200 p-4 md:p-8 flex flex-col">
        <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">Character {currentCharacterIndex + 1} of {partySize}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                {progressLabels.map((label, i) => (
                    <ProgressStep
                        key={label}
                        step={i + 1}
                        currentStep={currentProgressStep > 8 ? 9 : currentProgressStep + 1} // Combine recommend/name visually
                        label={label}
                        isComplete={i < currentProgressStep}
                    />
                ))}
            </div>
        </div>

        <div className="flex-grow bg-gray-900 p-4 md:p-8 rounded-lg">
            {renderCurrentStep()}
        </div>
        
        {error && <p className="mt-4 text-center text-red-400 bg-red-900 bg-opacity-50 p-2 rounded">{error}</p>}
        
        <div className="mt-6 flex justify-between items-center">
            <button onClick={handleInternalBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">Back</button>
            {creationStep !== 'choice' && creationStep !== 'prebuilt' && (
                 <button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors">
                     {creationStep === 'name' ? `Finish Character ${currentCharacterIndex + 1}` : 'Next'}
                </button>
            )}
        </div>
    </div>
  );
};

export default StartScreen;