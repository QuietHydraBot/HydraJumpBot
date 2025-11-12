/* official/js-SET_NAME-SET_CODE.js
   SET_NAME
*/
(function (OFF) {
  // 1) Metadata used by packs
  OFF.registerMeta({

////// Colorless /////
"Barrels of Blasting Jelly": { type: "Artifact", mana: "{1}" },
"Bender's Waterskin": { type: "Artifact", mana: "{3}" },
"Mechanical Glider": { type: "Artifact — Equipment", mana: "{1}" },

////// White /////
"Aang, Air Nomad": { type: "Legendary Creature — Human Avatar Ally", mana: "{3}{W}{W}" },
"Aang, the Last Airbender": { type: "Legendary Creature — Human Avatar Ally", mana: "{3}{W}" },
"Aang's Defense": { type: "Instant", mana: "{W}" },
"Aardvark Sloth": { type: "Creature — Sloth Beast", mana: "{3}{W}" },
"Airbending Lesson": { type: "Instant — Lesson", mana: "{2}{W}" },
"Allied Teamwork": { type: "Enchantment", mana: "{2}{W}" },
"Appa, Aang's Companion": { type: "Legendary Creature — Bison Ally", mana: "{3}{W}" },
"Avatar Enthusiasts": { type: "Creature — Human Peasant Ally", mana: "{2}{W}" },
"Glider Kids": { type: "Creature — Human Pilot Ally", mana: "{2}{W}" },
"Jeong Jeong's Deserters": { type: "Creature — Human Rebel Ally", mana: "{1}{W}" },
"Katara, Heroic Healer": { type: "Legendary Creature — Human Warrior Ally", mana: "{4}{W}" },
"Kyoshi Warrior Guard": { type: "Creature — Human Warrior Ally", mana: "{1}{W}" },
"Master Piandao": { type: "Legendary Creature — Human Warrior Ally", mana: "{4}{W}" },
"Momo, Rambunctious Rascal": { type: "Legendary Creature — Lemur Bat Ally", mana: "{2}{W}" },
"Path to Redemption": { type: "Enchantment — Aura", mana: "{1}{W}" },
"Rabaroo Troop": { type: "Creature — Rabbit Kangaroo", mana: "{3}{W}{W}" },
"Razor Rings": { type: "Instant", mana: "{1}{W}" },
"Sledding Otter-Penguin": { type: "Creature — Otter Bird", mana: "{2}{W}" },
"Sokka, Wolf Cove's Protector": { type: "Legendary Creature — Human Warrior Ally", mana: "{2}{W}" },
"Thriving Heath": { type: "Land", mana: "" },
"Tundra Wall": { type: "Creature — Wall", mana: "{1}{W}" },
"Wolf Cove Villager": { type: "Creature — Human Peasant", mana: "{W}" },

////// Blue /////
"Deny Entry": { type: "Instant", mana: "{2}{U}" },
"First-Time Flyer": { type: "Creature — Human Pilot Ally", mana: "{1}{U}" },
"Flexible Waterbender": { type: "Creature — Human Warrior Ally", mana: "{3}{U}" },
"Flying Dolphin-Fish": { type: "Creature — Whale Fish", mana: "{1}{U}" },
"Geyser Leaper": { type: "Creature — Human Warrior Ally", mana: "{4}{U}" },
"Giant Koi": { type: "Creature — Fish", mana: "{4}{U}{U}" },
"Iguana Parrot": { type: "Creature — Lizard Bird Pirate", mana: "{2}{U}" },
"It'll Quench Ya!": { type: "Instant — Lesson", mana: "{1}{U}" },
"Katara, Bending Prodigy": { type: "Legendary Creature — Human Warrior Ally", mana: "{2}{U}" },
"Lost in the Spirit World": { type: "Sorcery", mana: "{2}{U}" },
"Master Pakku": { type: "Legendary Creature — Human Advisor Ally", mana: "{1}{U}" },
"Otter-Penguin": { type: "Creature — Otter Bird", mana: "{1}{U}" },
"Rowdy Snowballers": { type: "Creature — Human Peasant Ally", mana: "{2}{U}" },
"Serpent of the Pass": { type: "Creature — Serpent", mana: "{5}{U}{U}" },
"The Terror of Serpent's Pass": { type: "Legendary Creature — Serpent", mana: "{5}{U}{U}" },
"Thriving Isle": { type: "Land", mana: "" },
"Turtle-Seals": { type: "Creature — Turtle Seal", mana: "{3}{U}" },
"Water Whip": { type: "Sorcery — Lesson", mana: "{U}{U}" },
"Waterbending Lesson": { type: "Sorcery — Lesson", mana: "{3}{U}" },
"Watery Grasp": { type: "Enchantment — Aura", mana: "{U}" },

////// Black /////
"Azula Always Lies": { type: "Instant — Lesson", mana: "{1}{B}" },
"Beetle-Headed Merchants": { type: "Creature — Human Citizen", mana: "{4}{B}" },
"Buzzard-Wasp Colony": { type: "Creature — Bird Insect", mana: "{3}{B}" },
"Cat-Gator": { type: "Creature — Fish Crocodile", mana: "{6}{B}" },
"Corrupt Court Official": { type: "Creature — Human Advisor", mana: "{1}{B}" },
"Dai Li Indoctrination": { type: "Sorcery — Lesson", mana: "{1}{B}" },
"Elephant-Rat": { type: "Creature — Elephant Rat", mana: "{1}{B}" },
"Epic Downfall": { type: "Sorcery", mana: "{1}{B}" },
"Feed the Swarm": { type: "Sorcery", mana: "{1}{B}" },
"Fire Nation Ambushers": { type: "Creature — Human Soldier", mana: "{2}{B}" },
"Fire Nation Engineer": { type: "Creature — Human Artificer", mana: "{2}{B}" },
"Fire Nation Sentinels": { type: "Creature — Human Soldier", mana: "{3}{B}{B}" },
"Gilacorn": { type: "Creature — Lizard", mana: "{B}" },
"Heartless Act": { type: "Instant", mana: "{1}{B}" },
"Hog-Monkey": { type: "Creature — Boar Monkey", mana: "{2}{B}" },
"Lion Vulture": { type: "Creature — Cat Bird", mana: "{3}{B}" },
"Merchant of Many Hats": { type: "Creature — Human Peasant Ally", mana: "{1}{B}" },
"Ozai's Cruelty": { type: "Sorcery — Lesson", mana: "{2}{B}" },
"Purple Pentapus": { type: "Creature — Octopus Starfish", mana: "{B}" },
"Thriving Moor": { type: "Land", mana: "" },

////// Red /////
"Capital Guard": { type: "Creature — Human Soldier", mana: "{1}{R}" },
"Deserter's Disciple": { type: "Creature — Human Rebel Ally", mana: "{1}{R}" },
"Dragon Moose": { type: "Creature — Dragon Elk", mana: "{3}{R}" },
"Explosive Shot": { type: "Sorcery", mana: "{1}{R}" },
"Fire Nation Archers": { type: "Creature — Human Archer", mana: "{3}{R}" },
"Fire Nation Soldier": { type: "Creature — Human Soldier", mana: "{2}{R}" },
"Fire Nation's Conquest": { type: "Enchantment", mana: "{2}{R}" },
"Fire Sages": { type: "Creature — Human Cleric", mana: "{1}{R}" },
"How to Start a Riot": { type: "Instant — Lesson", mana: "{2}{R}" },
"Iroh, Firebending Instructor": { type: "Legendary Creature — Human Noble Ally", mana: "{2}{R}" },
"Komodo Rhino": { type: "Creature — Lizard Rhino", mana: "{3}{R}" },
"Lightning Strike": { type: "Instant", mana: "{1}{R}" },
"Loyal Fire Sage": { type: "Creature — Human Cleric Ally", mana: "{2}{R}" },
"Mongoose Lizard": { type: "Creature — Mongoose Lizard", mana: "{4}{R}{R}" },
"Roku's Mastery": { type: "Instant", mana: "{X}{R}{R}" },
"Rough Rhino Cavalry": { type: "Creature — Human Mercenary", mana: "{4}{R}" },
"Run Amok": { type: "Instant", mana: "{1}{R}" },
"Thriving Bluff": { type: "Land", mana: "" },
"Warship Scout": { type: "Creature — Human Scout", mana: "{R}" },
"Yuyan Archers": { type: "Creature — Human Archer", mana: "{1}{R}" },
"Zhao, the Seething Flame": { type: "Legendary Creature — Human Soldier", mana: "{4}{R}" },
"Zuko, Avatar Hunter": { type: "Legendary Creature — Human Noble", mana: "{3}{R}{R}" },
"Zuko, Exiled Prince": { type: "Legendary Creature — Human Noble", mana: "{3}{R}" },
"Zuko's Offense": { type: "Sorcery", mana: "{R}" },

////// Green /////
"Badgermole": { type: "Creature — Badger Mole", mana: "{4}{G}" },
"Bumi, Eclectic Earthbender": { type: "Legendary Creature — Human Noble Ally", mana: "{3}{G}{G}" },
"Earth Rumble": { type: "Sorcery", mana: "{3}{G}" },
"Earthbending Lesson": { type: "Sorcery — Lesson", mana: "{3}{G}" },
"Eel-Hounds": { type: "Creature — Fish Dog", mana: "{3}{G}" },
"Explore": { type: "Sorcery", mana: "{1}{G}" },
"Flopsie, Bumi's Buddy": { type: "Legendary Creature — Ape Goat", mana: "{4}{G}{G}" },
"Frog-Squirrels": { type: "Creature — Frog Squirrel", mana: "{1}{G}" },
"Haru, Hidden Talent": { type: "Legendary Creature — Human Peasant Ally", mana: "{1}{G}" },
"Hippo-Cows": { type: "Creature — Hippo Ox", mana: "{4}{G}" },
"Match the Odds": { type: "Sorcery — Lesson", mana: "{2}{G}" },
"Ostrich-Horse": { type: "Creature — Bird Horse", mana: "{2}{G}" },
"Pillar Launch": { type: "Instant", mana: "{G}" },
"Raucous Audience": { type: "Creature — Human Citizen", mana: "{1}{G}" },
"Rebellious Captives": { type: "Creature — Human Peasant Ally", mana: "{1}{G}" },
"Rocky Rebuke": { type: "Instant", mana: "{1}{G}" },
"Saber-Tooth Moose-Lion": { type: "Creature — Elk Cat", mana: "{4}{G}{G}" },
"Seismic Tutelage": { type: "Enchantment — Aura", mana: "{3}{G}" },
"Thriving Grove": { type: "Land", mana: "" },
"Toph, the Blind Bandit": { type: "Legendary Creature — Human Warrior Ally", mana: "{2}{G}" },
"Turtle-Duck": { type: "Creature — Turtle Bird", mana: "{G}" },

////// White Blue /////
"Cat-Owl": { type: "Creature — Cat Bird", mana: "{3}{W/U}" },
"Sokka, Lateral Strategist": { type: "Legendary Creature — Human Warrior Ally", mana: "{1}{W/U}{W/U}" },

////// White Black /////
"Hei Bai, Spirit of Balance": { type: "Legendary Creature — Bear Spirit", mana: "{2}{W/B}{W/B}" },
"Pretending Poxbearers": { type: "Creature — Human Citizen Ally", mana: "{1}{W/B}" },

////// White Green /////
"Earth Kingdom Soldier": { type: "Creature — Human Soldier", mana: "{4}{G/W}" },
"Suki, Kyoshi Warrior": { type: "Legendary Creature — Human Warrior Ally", mana: "{2}{G/W}{G/W}" },

////// Blue Red /////
"Abandon Attachments": { type: "Instant — Lesson", mana: "{1}{U/R}" },

////// Black Red /////
"Vindictive Warden": { type: "Creature — Human Soldier", mana: "{2}{B/R}" },

////// Black Green /////
"Earth Village Ruffians": { type: "Creature — Human Soldier Rogue", mana: "{2}{B/G}" },
"Long Feng, Grand Secretariat": { type: "Legendary Creature — Human Advisor", mana: "{1}{B/G}{B/G}" },

////// Red Green /////
"Hog-Monkey Rampage": { type: "Instant", mana: "{1}{R/G}" },

  });

  // 2) Register packs
  OFF.registerPacks("jumpstart", [
    
{//PACK -- Aang Tutorial
  id: "js-TLA-Aang",
  kind: "Jumpstart",
  name: "Aang Tutorial",
  theme: "Aang's Defense",
  set: "Avatar Beginner",
  colors: ["W"],
  tags: ["official"],
  deck: [
    CARD("Aang, Air Nomad", 1),
    CARD("Appa, Aang's Companion", 1),
    CARD("Momo, Rambunctious Rascal", 1),
    CARD("Katara, Heroic Healer", 1),
    CARD("Sokka, Wolf Cove's Protector", 1),
    CARD("Aardvark Sloth", 1),
    CARD("Sledding Otter-Penguin", 1),
    CARD("Tundra Wall", 1),
    CARD("Wolf Cove Villager", 1),
    CARD("Aang's Defense", 1),
    CARD("Razor Rings", 1),
    CARD("Path to Redemption", 1),
    // LANDS
    CARD("Plains", 8),
  ]
},

{//PACK -- Allies
  id: "js-TLA-Allies",
  kind: "Jumpstart",
  name: "Allies",
  theme: "Creature Synergy",
  set: "Avatar Beginner",
  colors: ["W"],
  tags: ["official"],
  deck: [
    CARD("Aang, the Last Airbender", 1),
    CARD("Suki, Kyoshi Warrior", 1),
    CARD("Rabaroo Troop", 1),
    CARD("Master Piandao", 1),
    CARD("Kyoshi Warrior Guard", 1),
    CARD("Jeong Jeong's Deserters", 1),
    CARD("Glider Kids", 1),
    CARD("Avatar Enthusiasts", 1),
    CARD("Airbending Lesson", 1),
    CARD("Path to Redemption", 1),
    CARD("Allied Teamwork", 1),
    CARD("Mechanical Glider", 1),
    // LANDS
    CARD("Thriving Heath", 1),
    CARD("Plains", 7),
  ]
},

{//PACK -- Spells
  id: "js-TLA-Spells",
  kind: "Jumpstart",
  name: "Spells",
  theme: "Spellcasting",
  set: "Avatar Beginner",
  colors: ["U"],
  tags: ["official"],
  deck: [
    CARD("Master Pakku", 1),
    CARD("First-Time Flyer", 1),
    CARD("Geyser Leaper", 1),
    CARD("Iguana Parrot", 1),
    CARD("Rowdy Snowballers", 1),
    CARD("Serpent of the Pass", 1),
    CARD("Turtle-Seals", 1),
    CARD("Abandon Attachments", 1),
    CARD("It'll Quench Ya!", 1),
    CARD("Lost in the Spirit World", 1),
    CARD("Water Whip", 1),
    CARD("Barrels of Blasting Jelly", 1),
    // LANDS
    CARD("Thriving Isle", 1),
    CARD("Island", 7),
  ]
},

{//PACK -- Waterbending
  id: "js-TLA-Waterbending",
  kind: "Jumpstart",
  name: "Waterbending",
  theme: "Waterbend",
  set: "Avatar Beginner",
  colors: ["U"],
  tags: ["official"],
  deck: [
    CARD("The Terror of Serpent's Pass", 1),
    CARD("Katara, Bending Prodigy", 1),
    CARD("Sokka, Lateral Strategist", 1),
    CARD("Cat-Owl", 1),
    CARD("Flexible Waterbender", 1),
    CARD("Flying Dolphin-Fish", 1),
    CARD("Giant Koi", 1),
    CARD("Otter-Penguin", 1),
    CARD("Deny Entry", 1),
    CARD("Waterbending Lesson", 1),
    CARD("Watery Grasp", 1),
    CARD("Bender's Waterskin", 1),
    // LANDS
    CARD("Thriving Isle", 1),
    CARD("Island", 7),
  ]
},

{//PACK -- Attacking
  id: "js-TLA-Attacking",
  kind: "Jumpstart",
  name: "Attacking",
  theme: "Attacking",
  set: "Avatar Beginner",
  colors: ["B"],
  tags: ["official"],
  deck: [
    CARD("Beetle-Headed Merchants", 1),
    CARD("Cat-Gator", 1),
    CARD("Corrupt Court Official", 1),
    CARD("Fire Nation Ambushers", 1),
    CARD("Hei Bai, Spirit of Balance", 1),
    CARD("Lion Vulture", 1),
    CARD("Merchant of Many Hats", 1),
    CARD("Pretending Poxbearers", 1),
    CARD("Purple Pentapus", 1),
    CARD("Heartless Act", 1),
    CARD("Dai Li Indoctrination", 1),
    CARD("Epic Downfall", 1),
    // LANDS
    CARD("Thriving Moor", 1),
    CARD("Swamp", 7),
  ]
},

{//PACK -- Counters
  id: "js-TLA-Counters",
  kind: "Jumpstart",
  name: "Counters",
  theme: "Counters",
  set: "Avatar Beginner",
  colors: ["B"],
  tags: ["official"],
  deck: [
    CARD("Buzzard-Wasp Colony", 1),
    CARD("Earth Village Ruffians", 1),
    CARD("Elephant-Rat", 1),
    CARD("Fire Nation Engineer", 1),
    CARD("Fire Nation Sentinels", 1),
    CARD("Gilacorn", 1),
    CARD("Hog-Monkey", 1),
    CARD("Long Feng, Grand Secretariat", 1),
    CARD("Azula Always Lies", 1),
    CARD("Dai Li Indoctrination", 1),
    CARD("Feed the Swarm", 1),
    CARD("Ozai's Cruelty", 1),
    // LANDS
    CARD("Thriving Moor", 1),
    CARD("Swamp", 7),
  ]
},

{//PACK -- Zuko Tutorial
  id: "js-TLA-Zuko",
  kind: "Jumpstart",
  name: "Zuko Tutorial",
  theme: "Zuko's Offense",
  set: "Avatar Beginner",
  colors: ["R"],
  tags: ["official"],
  deck: [
    CARD("Zuko, Avatar Hunter", 1),
    CARD("Iroh, Firebending Instructor", 1),
    CARD("Zhao, the Seething Flame", 1),
    CARD("Warship Scout", 1),
    CARD("Komodo Rhino", 1),
    CARD("Fire Nation Soldier", 1),
    CARD("Dragon Moose", 1),
    CARD("Capital Guard", 1),
    CARD("Run Amok", 1),
    CARD("Explosive Shot", 1),
    CARD("Zuko's Offense", 1),
    CARD("Fire Nation's Conquest", 1),
    // LANDS
    CARD("Mountain", 8),
  ]
},

{//PACK -- Firebending
  id: "js-TLA-Firebend",
  kind: "Jumpstart",
  name: "Firebending",
  theme: "Firebend",
  set: "Avatar Beginner",
  colors: ["R"],
  tags: ["official"],
  deck: [
    CARD("Zuko, Exiled Prince", 1),
    CARD("Deserter's Disciple", 1),
    CARD("Fire Nation Archers", 1),
    CARD("Fire Sages", 1),
    CARD("Loyal Fire Sage", 1),
    CARD("Mongoose Lizard", 1),
    CARD("Rough Rhino Cavalry", 1),
    CARD("Vindictive Warden", 1),
    CARD("Yuyan Archers", 1),
    CARD("How to Start a Riot", 1),
    CARD("Lightning Strike", 1),
    CARD("Roku's Mastery", 1),
    // LANDS
    CARD("Thriving Bluff", 1),
    CARD("Mountain", 7),
  ]
},

{//PACK -- Earthbending
  id: "js-TLA-Earthbending",
  kind: "Jumpstart",
  name: "Earthbending",
  theme: "Earthbend",
  set: "Avatar Beginner",
  colors: ["G"],
  tags: ["official"],
  deck: [
    CARD("Toph, the Blind Bandit", 1),
    CARD("Badgermole", 1),
    CARD("Bumi, Eclectic Earthbender", 1),
    CARD("Earth Kingdom Soldier", 1),
    CARD("Earth Village Ruffians", 1),
    CARD("Haru, Hidden Talent", 1),
    CARD("Rebellious Captives", 1),
    CARD("Pillar Launch", 1),
    CARD("Rocky Rebuke", 1),
    CARD("Earth Rumble", 1),
    CARD("Earthbending Lesson", 1),
    CARD("Explore", 1),
    // LANDS
    CARD("Thriving Grove", 1),
    CARD("Forest", 7),
  ]
},

{//PACK -- Big Creatures
  id: "js-TLA-Big_Creatures",
  kind: "Jumpstart",
  name: "Big Creatures",
  theme: "Power Matters",
  set: "Avatar Beginner",
  colors: ["G"],
  tags: ["official"],
  deck: [
    CARD("Eel-Hounds", 1),
    CARD("Flopsie, Bumi's Buddy", 1),
    CARD("Frog-Squirrels", 1),
    CARD("Hippo-Cows", 1),
    CARD("Ostrich-Horse", 1),
    CARD("Raucous Audience", 1),
    CARD("Saber-Tooth Moose-Lion", 1),
    CARD("Turtle-Duck", 1),
    CARD("Hog-Monkey Rampage", 1),
    CARD("Match the Odds", 1),
    CARD("Seismic Tutelage", 1),
    CARD("Mechanical Glider", 1),
    // LANDS
    CARD("Thriving Grove", 1),
    CARD("Forest", 7),
  ]
},

  ]);
})(window.OFFICIAL);
