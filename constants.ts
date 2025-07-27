import type { PlayerClass, PlayerRace, PlayerLoyalty, PlayerBackstory, PlayerTrait, PlayerFault, EquipmentPack, CityMap, GridMap, GameMap } from './types';
import { SwordIcon, WandIcon, DaggerIcon, ClericIcon, RangerIcon, BardIcon, PaladinIcon, DruidIcon, MonkIcon, SorcererIcon, WarlockIcon } from './components/Icon';

export const STORAGE_KEY = 'gemini-dm-campaigns';
export const SUMMARIZATION_THRESHOLD = 11; // 1 initial prompt + 5 pairs of Player/DM turns

export const CITY_MAPS: { [id: string]: CityMap } = {
  'silverhaven': {
    id: 'silverhaven',
    name: 'Silverhaven',
    type: 'city',
    imageUrl: 'https://i.ibb.co/S6Kcm1P/fantasy-city.png',
    entryPointId: 'silverhaven_gate',
    locations: [
      { id: 'weary_wanderer_tavern', name: 'The Weary Wanderer', icon: '🍺', description: 'A cozy but dimly lit tavern, filled with the smell of old wood, spilled ale, and roasting meat.', position: { top: '25%', left: '30%' } },
      { id: 'gilded_anvil_smith', name: 'The Gilded Anvil', icon: '🔨', description: 'The clang of hammer on steel rings out from this renowned blacksmith, known for its fine weapons and armor.', position: { top: '50%', left: '55%' } },
      { id: 'alchemists_folly_shop', name: "The Alchemist's Folly", icon: '🧪', description: 'A cluttered shop filled with bubbling potions, strange ingredients, and the faint smell of sulfur.', position: { top: '30%', left: '70%' } },
      { id: 'silverhaven_market', name: 'Market Square', icon: '🎪', description: 'The bustling heart of the city, where merchants hawk their wares and town criers announce the latest news.', position: { top: '75%', left: '40%' } },
      { id: 'silverhaven_gate', name: 'City Gates', icon: '🚪', description: 'The main gates of Silverhaven, heavily guarded. They open to the roads leading into the surrounding wilderness.', position: { top: '90%', left: '50%' } },
    ]
  }
};

export const LOCAL_MAPS: { [id: string]: GridMap } = {
  'silverwood_forest': {
    id: 'silverwood_forest',
    name: 'Silverwood Forest',
    type: 'grid',
    startPosition: { x: 5, y: 9 }, // Start just outside the gate
    tiles: Array.from({ length: 10 }, (_, y) => Array.from({ length: 10 }, (_, x) => {
        if (x === 5 && y === 9) return { x, y, terrain: 'city_gate', description: "The gates of Silverhaven.", icon: '🚪', encounterChance: 0 };
        if (y > 7) return { x, y, terrain: 'plains', description: 'Open plains surround the city.', icon: '🌾', encounterChance: 0.1 };
        if (x < 2 || x > 7 || y < 2) return { x, y, terrain: 'hills', description: 'Rolling hills make for tough travel.', icon: '🌄', encounterChance: 0.2 };
        return { x, y, terrain: 'forest', description: 'The dense Silverwood forest. The light grows dim.', icon: '🌲', encounterChance: 0.3 };
    }))
  }
};

export const ALL_MAPS: { [id: string]: GameMap } = {
    ...CITY_MAPS,
    ...LOCAL_MAPS
};

export const PLAYER_CLASSES: PlayerClass[] = [
  {
    name: 'Warrior',
    description: 'A master of combat, strong and resilient. Relies on martial prowess.',
    icon: SwordIcon,
    classFeature: "Second Wind. You have a limited well of stamina that you can draw on to protect yourself from harm.",
    synergies: {
        Dwarf: "Your dwarven toughness combined with warrior training makes you a true bastion, granting you additional hit points.",
        "Half-Orc": "Your savage attacks are even more potent, allowing you to deal extra damage on critical hits."
    }
  },
  {
    name: 'Mage',
    description: 'A wielder of arcane energies, intelligent and powerful. Casts potent spells.',
    icon: WandIcon,
    classFeature: "Arcane Recovery. You have learned to regain some of your magical energy through a short rest.",
    synergies: {
        Elf: "Your elven mind is naturally attuned to the arcane, granting you an additional cantrip.",
        Gnome: "Your inventive nature allows you to substitute esoteric components for your spells more easily."
    }
  },
  {
    name: 'Rogue',
    description: 'A creature of shadow, agile and cunning. Excels in stealth and trickery.',
    icon: DaggerIcon,
    classFeature: "Sneak Attack. You know how to strike subtly and exploit a foe's distraction, dealing extra damage.",
    synergies: {
        Halfling: "Your natural stealth and luck make you almost invisible in the shadows, giving you an edge on stealth checks.",
        Tiefling: "Your infernal legacy grants you the ability to cast the Darkness spell once per day, creating a perfect environment for your roguish talents."
    }
  },
  {
    name: 'Cleric',
    description: 'A devout follower of a deity, channeling divine power for healing and protection.',
    icon: ClericIcon,
    classFeature: "Channel Divinity. You can channel divine energy to fuel magical effects, such as turning undead.",
    synergies: {
        Aasimar: "Your celestial blood resonates with your divine magic, amplifying your healing spells.",
        Human: "Your versatile nature allows you to be proficient in heavy armor, making you a tougher front-line support."
    }
  },
  {
    name: 'Ranger',
    description: 'A skilled hunter and tracker, at home in the wilderness with a loyal animal companion.',
    icon: RangerIcon,
    classFeature: "Favored Enemy. You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy.",
    synergies: {
        Elf: "You have advantage on saving throws against being charmed, and magic can’t put you to sleep. Your woodland home makes you a master tracker.",
        Genasi: "Your elemental nature grants you resistance to a damage type related to your element, making you a hardier survivalist.",
        "Thri-kreen": "Your natural camouflage and survival instincts make you an apex predator in any environment, granting expertise in Survival checks."
    }
  },
  {
    name: 'Bard',
    description: 'A charismatic performer whose music and words can inspire allies and mesmerize foes.',
    icon: BardIcon,
    classFeature: "Bardic Inspiration. You can inspire others through stirring words or music, giving them a bonus on a roll.",
    synergies: {
        Tiefling: "Your natural charm is enhanced, giving you an edge in persuasive performances.",
        "Half-Orc": "Your powerful voice can be used for booming war chants, giving your inspiration a more intimidating effect."
    }
  },
   {
    name: 'Paladin',
    description: 'A holy warrior bound by an oath, a beacon of hope against the forces of darkness.',
    icon: PaladinIcon,
    classFeature: "Divine Smite. When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage.",
    synergies: {
        Dragonborn: "Your draconic ancestry can be channeled into your smites, changing the damage type to match your breath weapon.",
        Aasimar: "Your celestial nature empowers your Lay on Hands, allowing you to heal more wounds."
    }
  },
  {
    name: 'Druid',
    description: 'A guardian of the natural world, able to shapeshift and command the power of nature.',
    icon: DruidIcon,
    classFeature: "Wild Shape. As an action, you can magically assume the shape of a beast that you have seen before.",
    synergies: {
        Firbolg: "Your connection to the forest is profound, granting you the ability to speak with small beasts at will.",
        Genasi: "Your Wild Shapes can take on elemental characteristics, such as a fire-resistant bear or a swimming badger."
    }
  },
  {
    name: 'Monk',
    description: 'A master of martial arts, using disciplined control of their body as a deadly weapon.',
    icon: MonkIcon,
    classFeature: "Ki. Your training harnesses the mystic energy of ki. You can use it to fuel special abilities like Flurry of Blows or Patient Defense.",
    synergies: {
        Elf: "Your elven grace makes your movements more fluid, increasing your base speed.",
        Human: "Your adaptability allows you to learn an additional martial discipline from a monastery.",
        "Thri-kreen": "Your multiple limbs can be used in your martial arts, allowing you to make an additional unarmed strike as a bonus action once per combat."
    }
  },
  {
    name: 'Sorcerer',
    description: 'A spellcaster who draws power from an innate gift or a draconic bloodline.',
    icon: SorcererIcon,
    classFeature: "Metamagic. You can twist your spells to suit your needs, such as changing a spell's range or making it more subtle.",
    synergies: {
        Dragonborn: "If your sorcerous origin is Draconic Bloodline, your powers are amplified, granting you a stronger connection to your draconic ancestor.",
        Aasimar: "Your magic can manifest with a divine, radiant quality, allowing you to change the damage type of certain spells to radiant."
    }
  },
  {
    name: 'Warlock',
    description: 'A magic-user who gains power through a pact with a powerful otherworldly entity.',
    icon: WarlockIcon,
    classFeature: "Pact Magic. Your arcane research and the magic bestowed on you by your patron have given you a facility with spells.",
    synergies: {
        Tiefling: "Your infernal heritage may be tied to your patron, giving you a deeper understanding and more potent invocations.",
        Gnome: "Your patron finds your inquisitive nature amusing, occasionally granting you cryptic clues about ancient artifacts."
    }
  },
];

export const PLAYER_RACES: PlayerRace[] = [
  { name: 'Human', description: 'Ambitious and versatile, humans are found everywhere, their short lives driving them to greatness.', imageUrl: 'https://i.ibb.co/6r1yM7G/human.png', attributeBonuses: { Strength: 1, Dexterity: 1, Constitution: 1, Intelligence: 1, Wisdom: 1, Charisma: 1 }, racialTrait: "Resourcefulness. Humans are adaptable and can quickly learn new skills, often finding surprising solutions to problems.", speed: 30 },
  { name: 'Elf', description: 'Graceful and perceptive, elves live for centuries, mastering magic and swordplay.', imageUrl: 'https://i.ibb.co/P9LqfHq/elf.png', attributeBonuses: { Dexterity: 2 }, racialTrait: "Fey Ancestry. You have advantage on saving throws against being charmed, and magic can’t put you to sleep.", speed: 30 },
  { name: 'Dwarf', description: 'Resilient artisans of the mountain, with a deep connection to stone, steel, and tradition.', imageUrl: 'https://i.ibb.co/yQdC1Q1/dwarf.png', attributeBonuses: { Constitution: 2 }, racialTrait: "Dwarven Resilience. You have advantage on saving throws against poison, and you have resistance against poison damage.", speed: 25 },
  { name: 'Halfling', description: 'Cheerful and curious, these small folk are known for their uncanny luck and love of comfort.', imageUrl: 'https://i.ibb.co/6gS9V1Y/halfling.png', attributeBonuses: { Dexterity: 2 }, racialTrait: "Lucky. When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.", speed: 25 },
  { name: 'Dragonborn', description: 'A proud, honorable race of draconic humanoids who value clan and skill above all else.', imageUrl: 'https://i.ibb.co/k2DyrzG/dragonborn.png', attributeBonuses: { Strength: 2, Charisma: 1 }, racialTrait: "Breath Weapon. You can use your action to exhale destructive energy. The type is determined by your draconic ancestry.", speed: 30 },
  { name: 'Tiefling', description: 'Descended from an infernal bloodline, tieflings are charismatic and cunning survivors.', imageUrl: 'https://i.ibb.co/yYcRzWc/tiefling.png', attributeBonuses: { Charisma: 2, Intelligence: 1 }, racialTrait: "Infernal Legacy. You know the Thaumaturgy cantrip. Once you reach 3rd level, you can cast the Hellish Rebuke spell as a 2nd-level spell once per day.", speed: 30 },
  { name: 'Gnome', description: 'Inventive and whimsical, gnomes are small in stature but large in intellect and creativity.', imageUrl: 'https://i.ibb.co/bF9p3Yc/gnome.png', attributeBonuses: { Intelligence: 2 }, racialTrait: "Gnome Cunning. You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.", speed: 25 },
  { name: 'Half-Orc', description: 'Combining human and orcish traits, they are often passionate individuals with formidable strength.', imageUrl: 'https://i.ibb.co/LQr9mQd/half-orc.png', attributeBonuses: { Strength: 2, Constitution: 1 }, racialTrait: "Relentless Endurance. When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can’t use this feature again until you finish a long rest.", speed: 30 },
  { name: 'Aasimar', description: 'Celestial champions touched by the powers of Mount Celestia, born to serve as guardians.', imageUrl: 'https://i.ibb.co/7C7pCmn/aasimar.png', attributeBonuses: { Charisma: 2 }, racialTrait: "Celestial Resistance. You have resistance to necrotic damage and radiant damage.", speed: 30 },
  { name: 'Genasi', description: 'Humanoids infused with the power of the elements, their appearance often hinting at their lineage.', imageUrl: 'https://i.ibb.co/hK7YgMP/genasi.png', attributeBonuses: { Constitution: 2 }, racialTrait: "Elemental Manifestation. Your body is infused with an element (Air, Earth, Fire, or Water), granting you a cantrip and damage resistance related to that element.", speed: 30 },
  { name: 'Goliath', description: 'Massive and powerful mountain dwellers, driven by a competitive spirit and a sense of fair play.', imageUrl: 'https://i.ibb.co/q0wZzcj/goliath.png', attributeBonuses: { Strength: 2, Constitution: 1 }, racialTrait: "Stone's Endurance. You can focus yourself to occasionally shrug off injury. When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total.", speed: 30 },
  { name: 'Firbolg', description: 'Wise and gentle giants of the forest, who prefer a peaceful and hidden existence.', imageUrl: 'https://i.ibb.co/3s6dp6b/firbolg.png', attributeBonuses: { Wisdom: 2, Strength: 1 }, racialTrait: "Firbolg Magic. You can cast Detect Magic and Disguise Self with this trait. You can also become invisible as a bonus action.", speed: 30 },
  { name: 'Thri-kreen', description: 'Insectoid nomads of the deserts and plains, known for their psionic abilities and hunting prowess.', imageUrl: 'https://i.ibb.co/XDrjC9s/thri-kreen.png', attributeBonuses: { Dexterity: 2, Wisdom: 1 }, racialTrait: "Chameleon Carapace. You can change the color of your carapace to match your surroundings, granting advantage on Stealth checks. You also do not need to sleep.", speed: 35 },
];

export const PLAYER_LOYALTIES: PlayerLoyalty[] = [
    { name: 'Lawful Good', description: 'Acts with compassion and always tries to do what is right and just.' },
    { name: 'Neutral Good', description: 'Does the best they can to help others according to their needs.' },
    { name: 'Chaotic Good', description: 'Follows their own conscience to do good, regardless of rules.' },
    { name: 'Lawful Neutral', description: 'Acts as law, tradition, or a personal code directs them.' },
    { name: 'True Neutral', description: 'Avoids taking sides, seeking balance in all things.' },
    { name: 'Chaotic Neutral', description: 'Follows their whims, valuing their own freedom above all else.' },
    { name: 'Lawful Evil', description: 'Methodically takes what they want, within a code of tradition or order.' },
    { name: 'Neutral Evil', description: 'Is out for themselves, pure and simple, without honor and without variation.' },
    { name: 'Chaotic Evil', description: 'Acts with arbitrary violence and is spurred by greed, hatred, or bloodlust.' },
];

export const PLAYER_BACKSTORIES: PlayerBackstory[] = [
    { name: 'Noble', description: 'You come from a wealthy, respected family, accustomed to a life of privilege and power.' },
    { name: 'Outcast', description: 'Shunned by your community, you have learned to survive alone on the fringes of society.' },
    { name: 'Soldier', description: 'You are a trained warrior, shaped by years of discipline and battle in a formal army.' },
    { name: 'Acolyte', description: 'You spent your life in service to a temple, learning sacred rites and powerful secrets.' },
    { name: 'Criminal', description: 'You have a history of breaking the law, relying on your wits and connections to get by.' },
    { name: 'Folk Hero', description: 'You are a champion of the common people, hailed for your deeds of courage and kindness.' },
    { name: 'Hermit', description: 'You lived in seclusion for a long time, gaining unique insights or discovering a great secret.' },
    { name: 'Entertainer', description: 'You lived a life of performance, captivating audiences with your music, dance, or stories.' },
    { name: 'Sailor', description: 'You spent years on the high seas, facing down storms, pirates, and bizarre sea monsters.' },
    { name: 'Guild Artisan', description: "You are a member of an artisan's guild, skilled in a particular craft and possessing influential connections." },
    { name: 'Custom', description: 'Your past is your own to write. Define the history that shaped you.' },
];

export const PLAYER_TRAITS: PlayerTrait[] = [
    { name: 'Brave', description: 'You stand firm in the face of fear.', synergies: { 'Class:Warrior': "Your bravery inspires allies in combat, allowing you to grant one ally advantage on their next attack roll, once per encounter.", "Race:Halfling": "Your courage defies your size. When a larger ally is defeated, you gain temporary hit points from a surge of protective valor." } },
    { name: 'Cunning', description: 'You are clever, and find solutions others miss.', synergies: { 'Class:Rogue': "Your cunning mind helps you create openings. You can use your bonus action to grant an ally advantage on their attack roll against a creature within 5 feet of you.", "Race:Gnome": "Your gnomish intellect for complex problems gives you advantage on checks to disarm magical traps." } },
    { name: 'Compassionate', description: 'You feel for others and try to help them.', synergies: { 'Class:Cleric': "Your compassion enhances your healing. When you heal an ally, they also gain a +1 bonus to their Armor Class until their next turn." } },
    { name: 'Honorable', description: 'Your word is your bond.', synergies: { 'Class:Paladin': "Your strict code of honor makes your divine smites more potent against enemies who use deception and poison." } },
    { name: 'Ambitious', description: 'You are driven to achieve greatness.' },
    { name: 'Pious', description: 'Your faith is your guide and shield.', synergies: { 'Class:Cleric': "Your unshakeable piety allows you to reroll a 1 on any healing die.", 'Class:Paladin': "Your faith is a literal shield. You can add your Charisma modifier to a saving throw you would otherwise fail, once per long rest." } },
    { name: 'Witty', description: 'You have a clever and inventive humor.', synergies: { 'Class:Bard': "Your wit sharpens your Vicious Mockery cantrip, causing it to deal an extra die of damage." } },
    { name: 'Patient', description: 'You can tolerate delays without becoming annoyed.', synergies: { 'Class:Ranger': "Your patience makes you an excellent ambush predator. If you remain hidden for a full round before attacking, your first attack is an automatic critical hit." } },
    { name: 'Curious', description: 'You are eager to know or learn something new.', synergies: { 'Class:Mage': "Your curiosity about the arcane allows you to attempt to cast a spell from a scroll even if it's not on your class's spell list." } },
    { name: 'Loyal', description: 'You show firm and constant support to your allies.' },
    { name: 'Stoic', description: 'You endure hardship without showing feelings or complaining.', synergies: { 'Race:Dwarf': "Your stoicism, combined with Dwarven Resilience, makes you immune to fear effects." } },
    { name: 'Optimistic', description: 'You are hopeful and confident about the future.' },
];

export const PLAYER_FAULTS: PlayerFault[] = [
    { name: 'Arrogant', description: 'You believe you are better than others.', synergies: { 'Class:Mage': "Your arrogance in your arcane superiority gives you disadvantage on checks to identify magic created by divine casters (Clerics, Paladins).", "Race:Elf": "Your elven pride makes you dismiss the concerns of 'lesser' races, giving you disadvantage on Charisma (Persuasion) checks with non-elves." } },
    { name: 'Greedy', description: 'You desire wealth and possessions above all else.', synergies: { 'Race:Dwarf': "Your dwarven lust for gold is a serious affliction. You must make a Wisdom saving throw to avoid attempting to steal any valuable gems or jewelry you see.", 'Class:Rogue': "Your greed makes you take unnecessary risks. You have disadvantage on checks to spot traps on treasure chests." } },
    { name: 'Reckless', description: 'You act without thinking of the consequences.', synergies: { 'Class:Warrior': "Your reckless charges leave you exposed. Enemies have advantage on their first attack against you after you move more than half your speed towards them." } },
    { name: 'Suspicious', description: "You don't trust anyone.", synergies: { 'Class:Rogue': "Your paranoia makes teamwork difficult. You cannot benefit from the 'Help' action from other players." } },
    { name: 'Lazy', description: 'You avoid hard work whenever possible.' },
    { name: 'Vengeful', description: 'You will go to any lengths to punish those who have wronged you.' },
    { name: 'Impatient', description: 'You are quickly irritated or provoked by delays.', synergies: { 'Class:Mage': "Your impatience with spellcasting rituals means any spell with a casting time longer than 1 action has a chance to fail spectacularly." } },
    { name: 'Pessimistic', description: 'You tend to see the worst aspect of things.' },
    { name: 'Gullible', description: 'You are easily persuaded to believe something.', synergies: { 'Race:Human': "Your human desire to fit in makes you especially gullible. You have disadvantage on Wisdom (Insight) checks to detect lies." } },
    { name: 'Paranoid', description: 'You are unreasonably suspicious or mistrustful.' },
    { name: 'Overconfident', description: 'You are excessively confident in your own abilities.' },
    { name: 'Short-tempered', description: 'You have a tendency to lose your temper quickly.', synergies: { 'Race:Half-Orc': "Your half-orc temper is explosive. If you take damage, you must succeed a Wisdom saving throw or be forced to attack the creature that damaged you on your next turn." } },
];

export const ATTRIBUTES_LIST: (keyof import('./types').Attributes)[] = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
export const STANDARD_ATTRIBUTE_ARRAY = [15, 14, 13, 12, 10, 8];

interface GearOptions {
    [key: string]: {
        weaponStyles: string[];
        equipmentPacks: EquipmentPack[];
        spells?: {
            list: { name: string; description: string; }[];
            max: number;
        } | null
    }
}

const DUNGEONEERS_PACK: EquipmentPack = { name: "Dungeoneer's Pack", items: ["Backpack", "Crowbar", "Hammer", "10 pitons", "10 torches", "Tinderbox", "10 days of rations", "Waterskin", "50 feet of hempen rope"] };
const EXPLORERS_PACK: EquipmentPack = { name: "Explorer's Pack", items: ["Backpack", "Bedroll", "Mess kit", "Tinderbox", "10 torches", "10 days of rations", "Waterskin", "50 feet of hempen rope"] };
const SCHOLARS_PACK: EquipmentPack = { name: "Scholar's Pack", items: ["Backpack", "Book of lore", "Bottle of ink", "Ink pen", "10 sheets of parchment", "Little bag of sand", "Small knife"] };
const PRIESTS_PACK: EquipmentPack = { name: "Priest's Pack", items: ["Backpack", "Blanket", "10 candles", "Tinderbox", "Alms box", "2 blocks of incense", "Censer", "Vestments", "2 days of rations", "Waterskin"] };
const BURGLARS_PACK: EquipmentPack = { name: "Burglar's Pack", items: ["Backpack", "Bag of 1,000 ball bearings", "10 feet of string", "Bell", "5 candles", "Crowbar", "Hammer", "Hooded lantern", "2 flasks of oil", "5 days of rations", "Tinderbox", "Waterskin", "50 feet of hempen rope"] };
const DIPLOMATS_PACK: EquipmentPack = { name: "Diplomat's Pack", items: ["Chest", "2 cases for maps and scrolls", "Set of fine clothes", "Bottle of ink", "Ink pen", "Lamp", "2 flasks of oil", "5 sheets of paper", "Vial of perfume", "Sealing wax", "Soap"] };
const ENTERTAINERS_PACK: EquipmentPack = { name: "Entertainer's Pack", items: ["Backpack", "Bedroll", "2 costumes", "5 candles", "5 days of rations", "Waterskin", "Disguise kit"] };

export const GEAR_OPTIONS: GearOptions = {
    Warrior: {
        weaponStyles: ['Sword and Shield', 'Greatsword', 'Dual Wielding Axes', 'Custom Weapon'],
        equipmentPacks: [DUNGEONEERS_PACK, EXPLORERS_PACK],
        spells: null
    },
    Mage: {
        weaponStyles: ['Quarterstaff', 'Dagger', 'Custom Weapon'],
        equipmentPacks: [SCHOLARS_PACK, EXPLORERS_PACK],
        spells: {
            list: [
                { name: "Magic Missile", description: "You create three magical darts. Each dart hits a creature of your choice that you can see within range and deals 1d4+1 force damage." },
                { name: "Fire Bolt", description: "You hurl a mote of fire at a creature or object within range, dealing fire damage." },
                { name: "Ray of Frost", description: "A frigid beam of blue-white light streaks toward a creature, dealing cold damage and reducing its speed." },
                { name: "Shield", description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC." },
                { name: "Sleep", description: "You send creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect." },
                { name: "Detect Magic", description: "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic." }
            ],
            max: 3
        }
    },
    Rogue: {
        weaponStyles: ['Dual Daggers', 'Shortbow', 'Rapier', 'Custom Weapon'],
        equipmentPacks: [BURGLARS_PACK, DUNGEONEERS_PACK],
        spells: null
    },
    Cleric: {
        weaponStyles: ['Mace and Shield', 'Warhammer', 'Custom Weapon'],
        equipmentPacks: [PRIESTS_PACK, EXPLORERS_PACK],
        spells: {
            list: [
                { name: "Cure Wounds", description: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier." },
                { name: "Guiding Bolt", description: "A flash of light streaks toward a creature of your choice. Make a ranged spell attack. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage." },
                { name: "Sanctuary", description: "You ward a creature within range against attack. Until the spell ends, any creature who targets the warded creature with an attack or a harmful spell must first make a Wisdom saving throw." },
                { name: "Bless", description: "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw." },
                { name: "Shield of Faith", description: "A shimmering field appears and surrounds a creature of your choice within range, granting it a +2 bonus to AC for the duration." }
            ],
            max: 2
        }
    },
    Ranger: {
        weaponStyles: ['Longbow and Shortsword', 'Dual Scimitars', 'Custom Weapon'],
        equipmentPacks: [EXPLORERS_PACK, DUNGEONEERS_PACK],
        spells: null
    },
    Bard: {
        weaponStyles: ['Rapier', 'Longsword', 'Lute (as club)', 'Custom Weapon'],
        equipmentPacks: [DIPLOMATS_PACK, ENTERTAINERS_PACK],
        spells: {
            list: [
                { name: "Vicious Mockery", description: "You unleash a string of insults at a creature. If it can hear you, it must make a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on its next attack roll." },
                { name: "Healing Word", description: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs." },
                { name: "Charm Person", description: "You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and does so with advantage if you or your companions are fighting it." },
                { name: "Tasha's Hideous Laughter", description: "A creature of your choice that you can see within range perceives everything as hilariously funny and falls into fits of laughter if this spell affects it." }
            ],
            max: 2
        }
    },
    Paladin: {
        weaponStyles: ['Longsword and Shield', 'Maul', 'Custom Weapon'],
        equipmentPacks: [PRIESTS_PACK, EXPLORERS_PACK],
        spells: {
            list: [
                { name: "Divine Favor", description: "Your prayer empowers you with divine radiance. Until the spell ends, your weapon attacks deal an extra 1d4 radiant damage on a hit." },
                { name: "Protection from Evil and Good", description: "Until the spell ends, one willing creature you touch is protected against certain types of creatures: aberrations, celestials, elementals, fey, fiends, and undead." },
                { name: "Thunderous Smite", description: "The first time you hit with a melee weapon attack during this spell's duration, your weapon rings with thunder that is audible within 300 feet of you, and the attack deals an extra 2d6 thunder damage to the target." }
            ],
            max: 1
        }
    },
    Druid: {
        weaponStyles: ['Scimitar and Shield', 'Wooden Staff', 'Custom Weapon'],
        equipmentPacks: [EXPLORERS_PACK, SCHOLARS_PACK],
        spells: {
            list: [
                { name: "Entangle", description: "Grasping weeds and vines sprout from the ground in a 20-foot square. For the duration, these plants turn the ground in the area into difficult terrain." },
                { name: "Thorn Whip", description: "You create a long, vine-like whip that lashes out at your command toward a creature in range. Make a melee spell attack against the target. If the attack hits, the creature takes 1d6 piercing damage, and if the creature is Large or smaller, you pull the creature up to 10 feet closer to you." },
                { name: "Goodberry", description: "Up to ten berries appear in your hand and are infused with magic for the duration. A creature can use its action to eat one berry. Eating a berry restores 1 hit point, and the berry provides enough nourishment to sustain a creature for one day." },
                { name: "Speak with Animals", description: "You gain the ability to comprehend and verbally communicate with beasts for the duration." }
            ],
            max: 2
        }
    },
    Monk: {
        weaponStyles: ['Unarmed Strikes', 'Shortsword', 'Quarterstaff', 'Custom Weapon'],
        equipmentPacks: [DUNGEONEERS_PACK, EXPLORERS_PACK],
        spells: null
    },
    Sorcerer: {
        weaponStyles: ['Dagger', 'Light Crossbow', 'Custom Weapon'],
        equipmentPacks: [EXPLORERS_PACK, DUNGEONEERS_PACK],
        spells: {
            list: [
                { name: "Chromatic Orb", description: "You hurl a 4-inch-diameter sphere of energy at a creature. You choose acid, cold, fire, lightning, poison, or thunder for the type of orb you create, and then make a ranged spell attack against the target." },
                { name: "Mage Armor", description: "You touch a willing creature who isn't wearing armor, and a protective magical force surrounds it until the spell ends. The target's base AC becomes 13 + its Dexterity modifier." },
                { name: "Burning Hands", description: "As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw." },
                { name: "Feather Fall", description: "Choose up to five falling creatures within range. A falling creature's rate of descent slows to 60 feet per round until the spell ends." }
            ],
            max: 2
        }
    },
    Warlock: {
        weaponStyles: ['Dagger', 'Light Crossbow', 'Custom Weapon'],
        equipmentPacks: [SCHOLARS_PACK, DUNGEONEERS_PACK],
        spells: {
            list: [
                { name: "Eldritch Blast", description: "A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage." },
                { name: "Hex", description: "You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 necrotic damage to the target whenever you hit it with an attack." },
                { name: "Armor of Agathys", description: "A protective magical force surrounds you, manifesting as a spectral frost that covers you and your gear. You gain 5 temporary hit points for the duration. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage." },
                { name: "Hellish Rebuke", description: "You point your finger, and the creature that damaged you is momentarily surrounded by hellish flames. The creature must make a Dexterity saving throw. It takes 2d10 fire damage on a failed save, or half as much damage on a successful one." }
            ],
            max: 2
        }
    }
};

export const AMBIANCE_MUSIC: { [key: string]: string } = {
    tavern: "https://storage.googleapis.com/gemini-dm-sounds/tavern.mp3",
    combat: "https://storage.googleapis.com/gemini-dm-sounds/combat.mp3",
    forest: "https://storage.googleapis.com/gemini-dm-sounds/forest.mp3",
    cave: "https://storage.googleapis.com/gemini-dm-sounds/cave.mp3",
    dungeon: "https://storage.googleapis.com/gemini-dm-sounds/dungeon.mp3",
    travel: "https://storage.googleapis.com/gemini-dm-sounds/calm.mp3",
    city: "https://storage.googleapis.com/gemini-dm-sounds/calm.mp3",
    default: "https://storage.googleapis.com/gemini-dm-sounds/calm.mp3"
};

export const TAVERN_START_PROMPT = `The adventure begins for a party of newly formed adventurers. They are meeting for the first time in "The Weary Wanderer," a cozy but dimly lit tavern in the bustling port city of Silverhaven. The air is thick with the smell of old wood, spilled ale, and roasting meat. A bard plays a soft tune in the corner. The party has been gathered by a mysterious letter promising a lucrative job. Please describe the scene as they wait for their contact. Here are the characters:\n\n{characterSummaries}`;

const BASE_SYSTEM_INSTRUCTION = `You are an expert Dungeon Master for a tabletop role-playing game. Your goal is to create an engaging, descriptive, and responsive story.
You will receive the entire history of the game so far, including the initial character sheet(s) and a log of all previous DM descriptions and player actions.
Your response MUST be a single, valid JSON object that adheres to the provided schema.

Key Responsibilities:
1.  **Scene Description:** Narrate the world. Describe the environment, NPCs, and events in a compelling way (in the 'scene' field).
2.  **Player Agency:** Present 3-4 clear 'suggestedActions' to the player. The last action should always be "Do something else..." to allow for custom input.
3.  **Image Summary:** Provide a concise, visual summary of the scene in the 'summaryForImage' field. This should be a simple prompt for an image generation AI, focusing on key subjects, the setting, and the mood (e.g., "A dwarf warrior stands in a dark cave, holding a glowing axe").
4.  **Ambiance:** Set the mood with a one or two-word 'ambiance' descriptor (e.g., 'tavern', 'combat', 'forest', 'travel', 'city').
5.  **Game State:** Manage the 'isGameOver' flag. If the story concludes or the party is defeated, set it to true and provide a 'gameOverReason'.
6.  **Skill Checks:** When a player's action has an uncertain outcome, use the 'skillCheck' object to request a roll. Define the 'skill' (e.g., "Strength (Athletics)", "Perception", "Deception") and the 'difficultyClass' (DC) the player must beat. Only request a check when necessary. Do not request a check for simple, guaranteed actions.
7.  **Character Consistency:** Remember the player characters' details (race, class, traits, faults) from their initial prompt and have the world react to them appropriately. For example, a menacing Half-Orc might get a different reaction in town than a charming Halfling. If a character has a synergy bonus or flaw, weave it into the story.
8.  **Inventory:** Keep track of the players' inventory (provided in the initial prompt). Their actions may add or remove items.
9.  **Contextual Content:** If a player's action leads them to a shop, populate the 'shopInventory' field with a list of items and their costs. You can also include special items like a 'Map of [Region]' which, when purchased, will reveal the world map for that region. If they read a book or note, populate the 'readableContent' field with its title and text. Otherwise, leave these fields null.
10. **Transactions**: If the player's action is to buy or sell an item, reflect this in the narrative. You MUST also populate the 'transaction' object with the 'type' ('buy' or 'sell'), 'itemName', and the final 'cost' as an integer. This is how the player's inventory and gold will be updated, so it is critical. For example, if the player sells "Old Sword", respond with a scene like "The merchant pays you 5 gold for the sword." and a transaction object: { "type": "sell", "itemName": "Old Sword", "cost": 5 }.
11. **Tone:** Maintain the specified tone (Normal or Family-friendly) throughout the entire adventure.`;

export const SYSTEM_INSTRUCTION_CITY_ACTION = `${BASE_SYSTEM_INSTRUCTION}
The party is currently inside a city or building. The last player action describes what they want to do (e.g., "Go to the blacksmith", "Talk to the bartender"). Respond to this action within the city context. If they choose to leave a location like a tavern, their next logical step is the city streets, so describe that scene and provide relevant city-based actions.`;

export const SYSTEM_INSTRUCTION_EXPLORE = `${BASE_SYSTEM_INSTRUCTION}
The party is exploring a grid-based wilderness map. The last player action was to move to a new grid tile. Your task is to describe what happens upon entering this new tile.
Based on the party's skills (e.g., a high Perception Ranger might spot something hidden, a high Wisdom character might notice something is wrong), the terrain, and the tile's encounter chance, create a compelling event.
This event could be:
- A simple, descriptive narrative of the terrain.
- An unexpected encounter with friendly or hostile NPCs (bandits, merchants).
- The discovery of a hidden location (cave, ruin) or a clue for a side quest.
- A combat encounter.
- A trap or environmental hazard that requires a skill check.
Player skills are VERY important. A party with high Perception should find things more often. A party with low Constitution might get exhausted. Weave their abilities into the narration.`;


export const SYSTEM_INSTRUCTION_NORMAL = BASE_SYSTEM_INSTRUCTION;

export const SYSTEM_INSTRUCTION_FAMILY = `${BASE_SYSTEM_INSTRUCTION}
**IMPORTANT**: This is a 'Family' game. The tone must be suitable for children. Avoid graphic violence, gore, death, and complex moral dilemmas. Combat should be described in a non-lethal, "knocked out" or "scared away" manner. Themes should be heroic and lighthearted.`;

const BASE_SUMMARIZE_INSTRUCTION = `You are a summarization AI. You will be given a story history from a role-playing game. Your task is to create a concise summary of the key events, character states, and important items.
Focus on:
- Major plot points that have occurred.
- Significant NPCs the players have met.
- Any important items or clues they have found.
- The party's current location and immediate goal.
- Any unresolved mysteries or quests.
Your summary should be a few paragraphs long and capture the essential information needed for the game to continue without losing context.`;

export const SYSTEM_INSTRUCTION_SUMMARIZE_NORMAL = BASE_SUMMARIZE_INSTRUCTION;
export const SYSTEM_INSTRUCTION_SUMMARIZE_FAMILY = `${BASE_SUMMARIZE_INSTRUCTION}
**IMPORTANT**: The summary should maintain a family-friendly tone, omitting any scary or intense details.`;

export const SYSTEM_INSTRUCTION_RECOMMENDATION = "You are a creative assistant for a fantasy role-playing game. Generate a fitting name and a short, inspiring backstory (2-3 sentences) for the character described in the prompt. Your response must be a single, valid JSON object that adheres to the provided schema.";