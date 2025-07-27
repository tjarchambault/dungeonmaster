import type { CharacterProfile } from '../types';
import { PLAYER_RACES, PLAYER_CLASSES, PLAYER_LOYALTIES, PLAYER_BACKSTORIES, PLAYER_TRAITS, PLAYER_FAULTS, GEAR_OPTIONS } from '../constants';

// Helper function to find data from constants
const findRace = (name: string) => PLAYER_RACES.find(r => r.name === name)!;
const findClass = (name: string) => PLAYER_CLASSES.find(c => c.name === name)!;
const findLoyalty = (name: string) => PLAYER_LOYALTIES.find(l => l.name === name)!;
const findBackstory = (name: string) => PLAYER_BACKSTORIES.find(b => b.name === name)!;
const findTraits = (names: string[]) => names.map(n => PLAYER_TRAITS.find(t => t.name === n)!);
const findFaults = (names: string[]) => names.map(n => PLAYER_FAULTS.find(f => f.name === n)!);
const findEquipment = (className: string, packName: string) => GEAR_OPTIONS[className].equipmentPacks.find(p => p.name === packName)!;

export const PREBUILT_CHARACTERS: CharacterProfile[] = [
  {
    characterName: 'Valerius Ironhand',
    playerRace: findRace('Dwarf'),
    playerClass: findClass('Warrior'),
    playerLoyalty: findLoyalty('Lawful Good'),
    playerBackstory: findBackstory('Soldier'),
    customBackstory: '',
    playerTraits: findTraits(['Brave', 'Loyal']),
    playerFaults: findFaults(['Suspicious', 'Short-tempered']),
    attributes: { Strength: 15, Dexterity: 10, Constitution: 14, Intelligence: 8, Wisdom: 12, Charisma: 13 },
    weaponStyle: 'Sword and Shield',
    spells: [],
    equipmentPack: findEquipment('Warrior', "Dungeoneer's Pack"),
    inventory: findEquipment('Warrior', "Dungeoneer's Pack").items,
    synergyBonus: findClass('Warrior').synergies['Dwarf'],
    traitAndFaultSynergies: ["Your bravery inspires allies in combat, allowing you to grant one ally advantage on their next attack roll, once per encounter.", "Your stoicism, combined with Dwarven Resilience, makes you immune to fear effects."]
  },
  {
    characterName: 'Lyra Swiftwind',
    playerRace: findRace('Elf'),
    playerClass: findClass('Ranger'),
    playerLoyalty: findLoyalty('Chaotic Good'),
    playerBackstory: findBackstory('Outcast'),
    customBackstory: '',
    playerTraits: findTraits(['Patient', 'Curious']),
    playerFaults: findFaults(['Reckless', 'Pessimistic']),
    attributes: { Strength: 10, Dexterity: 15, Constitution: 12, Intelligence: 13, Wisdom: 14, Charisma: 8 },
    weaponStyle: 'Longbow and Shortsword',
    spells: [],
    equipmentPack: findEquipment('Ranger', "Explorer's Pack"),
    inventory: findEquipment('Ranger', "Explorer's Pack").items,
    synergyBonus: findClass('Ranger').synergies['Elf'],
    traitAndFaultSynergies: ["Your patience makes you an excellent ambush predator. If you remain hidden for a full round before attacking, your first attack is an automatic critical hit."]
  },
  {
    characterName: 'Zanther the Magnificent',
    playerRace: findRace('Gnome'),
    playerClass: findClass('Mage'),
    playerLoyalty: findLoyalty('Chaotic Neutral'),
    playerBackstory: findBackstory('Guild Artisan'),
    customBackstory: '',
    playerTraits: findTraits(['Witty', 'Ambitious']),
    playerFaults: findFaults(['Arrogant', 'Greedy']),
    attributes: { Strength: 8, Dexterity: 13, Constitution: 12, Intelligence: 15, Wisdom: 10, Charisma: 14 },
    weaponStyle: 'Quarterstaff',
    spells: ["Magic Missile", "Fire Bolt", "Shield"],
    equipmentPack: findEquipment('Mage', "Scholar's Pack"),
    inventory: findEquipment('Mage', "Scholar's Pack").items,
    synergyBonus: findClass('Mage').synergies['Gnome'],
    traitAndFaultSynergies: ["Your gnomish intellect for complex problems gives you advantage on checks to disarm magical traps.", "Your arrogance in your arcane superiority gives you disadvantage on checks to identify magic created by divine casters (Clerics, Paladins)."]
  },
  {
    characterName: 'Seraphina Lightbringer',
    playerRace: findRace('Aasimar'),
    playerClass: findClass('Paladin'),
    playerLoyalty: findLoyalty('Lawful Good'),
    playerBackstory: findBackstory('Acolyte'),
    customBackstory: '',
    playerTraits: findTraits(['Honorable', 'Compassionate']),
    playerFaults: findFaults(['Overconfident', 'Gullible']),
    attributes: { Strength: 14, Dexterity: 8, Constitution: 13, Intelligence: 10, Wisdom: 12, Charisma: 15 },
    weaponStyle: 'Longsword and Shield',
    spells: ["Divine Favor"],
    equipmentPack: findEquipment('Paladin', "Priest's Pack"),
    inventory: findEquipment('Paladin', "Priest's Pack").items,
    synergyBonus: findClass('Paladin').synergies['Aasimar'],
    traitAndFaultSynergies: ["Your strict code of honor makes your divine smites more potent against enemies who use deception and poison."]
  }
];