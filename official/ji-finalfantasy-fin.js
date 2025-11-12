/* official/ji-SET_NAME-SET_CODE.js
   Jump In! — SETNAME
*/
(function (OFF) {
  // 1) Cards for Set
OFF.registerMeta({

////// Colorless /////
"Capital City": { type: "Land — Town", mana: "" },
"Genji Glove": { type: "Artifact — Equipment", mana: "{5}" },
"Lion Heart": { type: "Artifact — Equipment", mana: "{4}" },
"Lunatic Pandora": { type: "Legendary Artifact", mana: "{1}" },
"Monk's Fist": { type: "Artifact — Equipment", mana: "{2}" },

////// Black /////
"Ahriman": { type: "Creature — Eye Horror", mana: "{2}{B}" },
"Al Bhed Salvagers": { type: "Creature — Human Artificer Warrior", mana: "{2}{B}" },
"Ardyn, the Usurper": { type: "Legendary Creature — Elder Human Noble", mana: "{5}{B}{B}{B}" },
"Cornered by Black Mages": { type: "Sorcery", mana: "{1}{B}{B}" },
"Fang, Fearless l'Cie": { type: "Legendary Creature — Human Warrior", mana: "{2}{B}" },
"Fight On!": { type: "Instant", mana: "{2}{B}" },
"Gaius van Baelsar": { type: "Legendary Creature — Human Soldier", mana: "{2}{B}{B}" },
"Hecteyes": { type: "Creature — Ooze Horror", mana: "{1}{B}" },
"Jecht, Reluctant Guardian // Braska's Final Aeon": { type: "Legendary Creature — Human Warrior // Legendary Enchantment Creature — Saga Nightmare", mana: "{3}{B}" },
"Malboro": { type: "Creature — Plant Horror", mana: "{4}{B}{B}" },
"Namazu Trader": { type: "Creature — Fish Citizen", mana: "{3}{B}" },
"Ninja's Blades": { type: "Artifact — Equipment", mana: "{2}{B}" },
"Phantom Train": { type: "Artifact — Vehicle", mana: "{3}{B}" },
"Poison the Waters": { type: "Sorcery", mana: "{1}{B}" },
"Reno and Rude": { type: "Legendary Creature — Human Assassin", mana: "{1}{B}" },
"Resentful Revelation": { type: "Sorcery", mana: "{1}{B}" },
"Sephiroth, Fabled SOLDIER // Sephiroth, One-Winged Angel": { type: "Legendary Creature — Human Avatar Soldier // Legendary Creature — Angel Nightmare Avatar", mana: "{2}{B}" },
"Sephiroth's Intervention": { type: "Instant", mana: "{3}{B}" },
"Shambling Cie'th": { type: "Creature — Mutant Horror", mana: "{2}{B}" },
"Shinra Reinforcements": { type: "Creature — Human Soldier", mana: "{2}{B}" },
"Sidequest: Hunt the Mark // Yiazmat, Ultimate Mark": { type: "Enchantment // Legendary Creature — Dragon", mana: "{3}{B}{B}" },
"Summon: Primal Odin": { type: "Enchantment Creature — Saga Knight", mana: "{4}{B}{B}" },
"The Final Days": { type: "Sorcery", mana: "{2}{B}{B}" },
"Tonberry": { type: "Creature — Salamander Horror", mana: "{B}" },
"Undercity Dire Rat": { type: "Creature — Rat", mana: "{1}{B}" },
"Vayne's Treachery": { type: "Instant", mana: "{1}{B}" },
"Vincent Valentine // Galian Beast": { type: "Legendary Creature — Assassin // Legendary Creature — Werewolf Beast", mana: "{2}{B}{B}" },

////// Green /////
"Balamb T-Rexaur": { type: "Creature — Dinosaur", mana: "{4}{G}{G}" },
"Bartz and Boko": { type: "Legendary Creature — Human Bird", mana: "{3}{G}{G}" },
"Chocobo Kick": { type: "Sorcery", mana: "{1}{G}" },
"Chocobo Racetrack": { type: "Artifact", mana: "{3}{G}{G}" },
"Commune with Beavers": { type: "Sorcery", mana: "{G}" },
"Gysahl Greens": { type: "Sorcery", mana: "{1}{G}" },
"Prishe's Wanderings": { type: "Instant", mana: "{2}{G}" },
"Quina, Qu Gourmet": { type: "Legendary Creature — Qu", mana: "{2}{G}" },
"Reach the Horizon": { type: "Sorcery", mana: "{3}{G}" },
"Ride the Shoopuf": { type: "Enchantment", mana: "{1}{G}" },
"Sazh Katzroy": { type: "Legendary Creature — Human Pilot", mana: "{3}{G}" },
"Sazh's Chocobo": { type: "Creature — Bird", mana: "{G}" },
"Sidequest: Raise a Chocobo // Black Chocobo": { type: "Enchantment // Creature — Bird", mana: "{1}{G}" },
"Summon: Fat Chocobo": { type: "Enchantment Creature — Saga Bird", mana: "{4}{G}" },
"Summon: Fenrir": { type: "Enchantment Creature — Saga Wolf", mana: "{2}{G}" },
"Tifa Lockhart": { type: "Legendary Creature — Human Monk", mana: "{1}{G}" },
"Town Greeter": { type: "Creature — Human Citizen", mana: "{1}{G}" },
"Traveling Chocobo": { type: "Creature — Bird", mana: "{2}{G}" },

////// Red /////
"Barret Wallace": { type: "Legendary Creature — Human Rebel", mana: "{3}{R}" },
"Call the Mountain Chocobo": { type: "Sorcery", mana: "{3}{R}" },
"Coral Sword": { type: "Artifact — Equipment", mana: "{R}" },
"Freya Crescent": { type: "Legendary Creature — Rat Knight", mana: "{R}" },
"Haste Magic": { type: "Instant", mana: "{1}{R}" },
"Hill Gigas": { type: "Creature — Giant", mana: "{4}{R}{R}" },
"Item Shopkeep": { type: "Creature — Human Citizen", mana: "{1}{R}" },
"Laughing Mad": { type: "Instant", mana: "{2}{R}" },
"Light of Judgment": { type: "Instant", mana: "{4}{R}" },
"Prompto Argentum": { type: "Legendary Creature — Human Scout", mana: "{1}{R}" },
"Raubahn, Bull of Ala Mhigo": { type: "Legendary Creature — Human Warrior", mana: "{1}{R}" },
"Red Mage's Rapier": { type: "Artifact — Equipment", mana: "{1}{R}" },
"Sabotender": { type: "Creature — Plant", mana: "{1}{R}" },
"Samurai's Katana": { type: "Artifact — Equipment", mana: "{2}{R}" },
"Self-Destruct": { type: "Instant", mana: "{1}{R}" },
"Sidequest: Play Blitzball // World Champion, Celestial Weapon": { type: "Enchantment // Legendary Artifact — Equipment", mana: "{2}{R}" },
"Sorceress's Schemes": { type: "Sorcery", mana: "{3}{R}" },
"Suplex": { type: "Sorcery", mana: "{1}{R}" },
"Thunder Magic": { type: "Instant", mana: "{R}" },
"Warrior's Sword": { type: "Artifact — Equipment", mana: "{3}{R}" },
"Zell Dincht": { type: "Legendary Creature — Human Monk", mana: "{2}{R}" },

////// Blue /////
"Cargo Ship": { type: "Artifact — Vehicle", mana: "{1}{U}" },
"Dreams of Laguna": { type: "Instant", mana: "{1}{U}" },
"Edgar, King of Figaro": { type: "Legendary Creature — Human Artificer Noble", mana: "{4}{U}{U}" },
"Eject": { type: "Instant", mana: "{3}{U}" },
"Ice Flan": { type: "Creature — Elemental Ooze", mana: "{4}{U}{U}" },
"Ice Magic": { type: "Instant", mana: "{1}{U}" },
"Il Mheg Pixie": { type: "Creature — Faerie", mana: "{1}{U}" },
"Jill, Shiva's Dominant // Shiva, Warden of Ice": { type: "Legendary Creature — Human Noble Warrior // Legendary Enchantment Creature — Saga Elemental", mana: "{2}{U}" },
"Memories Returning": { type: "Sorcery", mana: "{2}{U}{U}" },
"Relm's Sketching": { type: "Sorcery", mana: "{2}{U}{U}" },
"Retrieve the Esper": { type: "Sorcery", mana: "{3}{U}" },
"Rook Turret": { type: "Artifact Creature — Construct", mana: "{3}{U}" },
"Sage's Nouliths": { type: "Artifact — Equipment", mana: "{1}{U}" },
"Sahagin": { type: "Creature — Merfolk Warrior", mana: "{1}{U}" },
"Scorpion Sentinel": { type: "Artifact Creature — Robot Scorpion", mana: "{1}{U}" },
"Sleep Magic": { type: "Enchantment — Aura", mana: "{U}" },
"Stuck in Summoner's Sanctum": { type: "Enchantment — Aura", mana: "{2}{U}" },
"Swallowed by Leviathan": { type: "Instant", mana: "{2}{U}" },
"Syncopate": { type: "Instant", mana: "{X}{U}" },
"The Lunar Whale": { type: "Legendary Artifact — Vehicle", mana: "{3}{U}" },
"The Prima Vista": { type: "Legendary Artifact — Vehicle", mana: "{4}{U}" },
"Thief's Knife": { type: "Artifact — Equipment", mana: "{2}{U}" },
"Ultros, Obnoxious Octopus": { type: "Legendary Creature — Octopus", mana: "{1}{U}" },
"Valkyrie Aerial Unit": { type: "Artifact Creature — Construct", mana: "{5}{U}{U}" },

////// White /////
"Adelbert Steiner": { type: "Legendary Creature — Human Knight", mana: "{1}{W}" },
"Aerith Rescue Mission": { type: "Sorcery", mana: "{3}{W}" },
"Ashe, Princess of Dalmasca": { type: "Legendary Creature — Human Rebel Noble", mana: "{2}{W}" },
"Auron's Inspiration": { type: "Instant", mana: "{2}{W}" },
"Cloud, Midgar Mercenary": { type: "Legendary Creature — Human Soldier Mercenary", mana: "{W}{W}" },
"Cloudbound Moogle": { type: "Creature — Moogle", mana: "{3}{W}{W}" },
"Dion, Bahamut's Dominant // Bahamut, Warden of Light": { type: "Legendary Creature — Human Noble Knight // Legendary Enchantment Creature — Saga Dragon", mana: "{3}{W}" },
"Dragoon's Lance": { type: "Artifact — Equipment", mana: "{1}{W}" },
"Dwarven Castle Guard": { type: "Creature — Dwarf Soldier", mana: "{1}{W}" },
"G'raha Tia": { type: "Legendary Creature — Cat Archer", mana: "{4}{W}" },
"Gaelicat": { type: "Creature — Cat", mana: "{2}{W}" },
"Machinist's Arsenal": { type: "Artifact — Equipment", mana: "{4}{W}" },
"Magitek Armor": { type: "Artifact — Vehicle", mana: "{3}{W}" },
"Moogles' Valor": { type: "Instant", mana: "{3}{W}{W}" },
"Paladin's Arms": { type: "Artifact — Equipment", mana: "{2}{W}" },
"Sidequest: Catch a Fish // Cooking Campsite": { type: "Enchantment // Land", mana: "{2}{W}" },
"Slash of Light": { type: "Instant", mana: "{1}{W}" },
"Snow Villiers": { type: "Legendary Creature — Human Rebel Monk", mana: "{2}{W}" },
"Summon: Choco/Mog": { type: "Enchantment Creature — Saga Bird Moogle", mana: "{2}{W}" },
"Summon: Knights of Round": { type: "Enchantment Creature — Saga Knight", mana: "{6}{W}{W}" },
"Summon: Primal Garuda": { type: "Enchantment Creature — Saga Harpy", mana: "{3}{W}" },
"Weapons Vendor": { type: "Creature — Human Artificer", mana: "{3}{W}" },
"White Auracite": { type: "Artifact", mana: "{2}{W}{W}" },
"White Mage's Staff": { type: "Artifact — Equipment", mana: "{1}{W}" },
"You're Not Alone": { type: "Instant", mana: "{W}" },
"Zack Fair": { type: "Legendary Creature — Human Soldier", mana: "{W}" },

////// Red Green /////
"Gongaga, Reactor Town": { type: "Land — Town", mana: "" },
"Rydia, Summoner of Mist": { type: "Legendary Creature — Human Shaman", mana: "{R}{G}" },

////// Blue Black /////
"Emet-Selch, Unsundered // Hades, Sorcerer of Eld": { type: "Legendary Creature — Elder Wizard // Legendary Creature — Avatar", mana: "{1}{U}{B}" },
"Locke Cole": { type: "Legendary Creature — Human Rogue", mana: "{1}{U}{B}" },
"Treno, Dark City": { type: "Land — Town", mana: "" },
"Ultimecia, Time Sorceress // Ultimecia, Omnipotent": { type: "Legendary Creature — Human Warlock // Legendary Creature — Nightmare Warlock", mana: "{3}{U}{B}" },

////// Blue Red /////
"Baron, Airship Kingdom": { type: "Land — Town", mana: "" },
"Shantotto, Tactician Magician": { type: "Legendary Creature — Dwarf Wizard", mana: "{1}{U}{R}" },
"Tellah, Great Sage": { type: "Legendary Creature — Human Wizard", mana: "{3}{U}{R}" },
"The Emperor of Palamecia // The Lord Master of Hell": { type: "Legendary Creature — Human Noble Wizard // Legendary Creature — Demon Noble Wizard", mana: "{U}{R}" },
"Vivi Ornitier": { type: "Legendary Creature — Wizard", mana: "{1}{U}{R}" },

////// White Black /////
"Insomnia, Crown City": { type: "Land — Town", mana: "" },
"Judge Magister Gabranth": { type: "Legendary Creature — Human Advisor Knight", mana: "{W}{B}" },
"Rufus Shinra": { type: "Legendary Creature — Human Noble", mana: "{1}{W}{B}" },

////// White Green /////
"Garnet, Princess of Alexandria": { type: "Legendary Creature — Human Noble Cleric", mana: "{G}{W}" },
"Rinoa Heartilly": { type: "Legendary Creature — Human Rebel Warlock", mana: "{3}{G}{W}" },
"Windurst, Federation Center": { type: "Land — Town", mana: "" },

});




// 2) Packs
OFF.registerPacks("jumpin", [

{//PACK -- Artifacts
      id: "ji-FIN-Artifacts",
      kind: "JUMPIN",
      name: "Artifacts",
      theme: "Artifacts",
      set: "Final Fantasy",
      colors: ["U"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Valkyrie Aerial Unit", 1),
        CARD("Rook Turret", 1),
        CARD("Ice Flan", 1),
        CARD("Retrieve the Esper", 1),
        CARD("Sleep Magic", 1),
        CARD("Stuck in Summoner's Sanctum", 1),
        CARD("Cargo Ship", 1),
        CARD("Thief's Knife", 1),
        CARD("Lunatic Pandora", 1),
        CARD("Capital City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Edgar, King of Figaro", weight: 50 }, { name: "The Lunar Whale", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Eject", weight: 50 }, { name: "Relm's Sketching", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Sage's Nouliths", weight: 50 }, { name: "Scorpion Sentinel", weight: 50 }]
        }
      ]
    },

{//PACK -- Bold
      id: "ji-FIN-Bold",
      kind: "JUMPIN",
      name: "Bold",
      theme: "Equipment",
      set: "Final Fantasy",
      colors: ["R"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Raubahn, Bull of Ala Mhigo", 1),
        CARD("Barret Wallace", 1),
        CARD("Freya Crescent", 1),
        CARD("Item Shopkeep", 1),
        CARD("Hill Gigas", 1),
        CARD("Sidequest: Play Blitzball", 1),
        CARD("Red Mage's Rapier", 1),
        CARD("Warrior's Sword", 1),
        CARD("Capital City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Coral Sword", weight: 50 }, { name: "Samurai's Katana", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Self-Destruct", weight: 50 }, { name: "Lion Heart", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Suplex", weight: 50 }, { name: "Thunder Magic", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Haste Magic", weight: 50 }, { name: "Laughing Mad", weight: 50 }]
        }
      ]
    },

{//PACK -- Chocobo
      id: "ji-FIN-Bold",
      kind: "JUMPIN",
      name: "Chocobo",
      theme: "Birds",
      set: "Final Fantasy",
      colors: ["G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Sazh's Chocobo", 1),
        CARD("Summon: Fat Chocobo", 1),
        CARD("Balamb T-Rexaur", 1),
        CARD("Prishe's Wanderings", 1),
        CARD("Gysahl Greens", 1),
        CARD("Chocobo Kick", 1),
        CARD("Sidequest: Raise a Chocobo", 1),
        CARD("Ride the Shoopuf", 1),
        CARD("Chocobo Racetrack", 1),
        CARD("Capital City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Traveling Chocobo", weight: 20 }, { name: "Sazh Katzroy", weight: 40 }, { name: "Bartz and Boko", weight: 40 }]
        },
        {
          slot: 12,
          options: [{ name: "Reach the Horizon", weight: 50 }, { name: "Summon: Fenrir", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Commune with Beavers", weight: 50 }, { name: "Town Greeter", weight: 50 }]
        }
      ]
    },

{//PACK -- Devious
      id: "ji-FIN-Devious",
      kind: "JUMPIN",
      name: "Devious",
      theme: "Graveyard",
      set: "Final Fantasy",
      colors: ["B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Fang, Fearless l'Cie", 1),
        CARD("Shambling Cie'th", 1),
        CARD("Shinra Reinforcements", 1),
        CARD("Malboro", 1),
        CARD("Fight On!", 1),
        CARD("Poison the Waters", 1),
        CARD("Resentful Revelation", 1),
        CARD("Sidequest: Hunt the Mark", 1),
        CARD("Capital City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Ardyn, the Usurper", weight: 50 }, { name: "Ninja's Blades", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Reno and Rude", weight: 50 }, { name: "Tonberry", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Hecteyes", weight: 50 }, { name: "Undercity Dire Rat", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Cornered by Black Mages", weight: 50 }, { name: "Sephiroth's Intervention", weight: 50 }]
        }
      ]
    },

{//PACK -- Mage
      id: "ji-FIN-Mage",
      kind: "JUMPIN",
      name: "Mage",
      theme: "Spellslinger",
      set: "Final Fantasy",
      colors: ["U", "R"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Shantotto, Tactician Magician", 1),
        CARD("The Emperor of Palamecia", 1),
        CARD("Ultros, Obnoxious Octopus", 1),
        CARD("Prompto Argentum", 1),
        CARD("Sahagin", 1),
        CARD("Dreams of Laguna", 1),
        CARD("Ice Magic", 1),
        CARD("Baron, Airship Kingdom", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 9,
          options: [{ name: "Vivi Ornitier", weight: 60 }, { name: "Tellah, Great Sage", weight: 20 }, { name: "Memories Returning", weight: 20 }]
        },
        {
          slot: 10,
          options: [{ name: "Sorceress's Schemes", weight: 50 }, { name: "The Prima Vista", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Relm's Sketching", weight: 50 }, { name: "Laughing Mad", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Syncopate", weight: 50 }, { name: "Light of Judgment", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Retrieve the Esper", weight: 50 }, { name: "Call the Mountain Chocobo", weight: 50 }]
        }
      ]
    },

{//PACK -- Merciless
      id: "ji-FIN-Merciless",
      kind: "JUMPIN",
      name: "Merciless",
      theme: "Sacrifice",
      set: "Final Fantasy",
      colors: ["W", "B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("G'raha Tia", 1),
        CARD("Rufus Shinra", 1),
        CARD("Ahriman", 1),
        CARD("Undercity Dire Rat", 1),
        CARD("Namazu Trader", 1),
        CARD("Dwarven Castle Guard", 1),
        CARD("Vayne's Treachery", 1),
        CARD("Phantom Train", 1),
        CARD("Insomnia, Crown City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Sephiroth, Fabled SOLDIER", weight: 20 }, { name: "Vincent Valentine", weight: 40 }, { name: "Summon: Primal Odin", weight: 40 }]
        },
        {
          slot: 11,
          options: [{ name: "Judge Magister Gabranth", weight: 50 }, { name: "Al Bhed Salvagers", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Summon: Primal Garuda", weight: 50 }, { name: "Gaius van Baelsar", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Sephiroth's Intervention", weight: 50 }, { name: "White Auracite", weight: 50 }]
        }
      ]
    },

{//PACK -- Scheming
      id: "ji-FIN-Scheming",
      kind: "JUMPIN",
      name: "Scheming",
      theme: "Attacking",
      set: "Final Fantasy",
      colors: ["U", "B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Ultimecia, Time Sorceress", 1),
        CARD("Locke Cole", 1),
        CARD("Il Mheg Pixie", 1),
        CARD("Dreams of Laguna", 1),
        CARD("The Final Days", 1),
        CARD("Retrieve the Esper", 1),
        CARD("Resentful Revelation", 1),
        CARD("Treno, Dark City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 9,
          options: [{ name: "Emet-Selch, Unsundered", weight: 20 }, { name: "Jecht, Reluctant Guardian", weight: 40 }, { name: "Jill, Shiva's Dominant", weight: 40 }]
        },
        {
          slot: 10,
          options: [{ name: "Swallowed by Leviathan", weight: 50 }, { name: "Sleep Magic", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Malboro", weight: 50 }, { name: "Ice Flan", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Ice Magic", weight: 50 }, { name: "Stuck in Summoner's Sanctum", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Syncopate", weight: 50 }, { name: "Hecteyes", weight: 50 }]
        }
      ]
    },

{//PACK -- Valiant
      id: "ji-FIN-Valiant",
      kind: "JUMPIN",
      name: "Valiant",
      theme: "Tokens",
      set: "Final Fantasy",
      colors: ["W", "G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Garnet, Princess of Alexandria", 1),
        CARD("Rinoa Heartilly", 1),
        CARD("Quina, Qu Gourmet", 1),
        CARD("Dwarven Castle Guard", 1),
        CARD("Summon: Fat Chocobo", 1),
        CARD("Summon: Choco/Mog", 1),
        CARD("Aerith Rescue Mission", 1),
        CARD("Magitek Armor", 1),
        CARD("Windurst, Federation Center", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Summon: Knights of Round", weight: 20 }, { name: "Moogles' Valor", weight: 40 }, { name: "Dion, Bahamut's Dominant", weight: 40 }]
        },
        {
          slot: 11,
          options: [{ name: "Snow Villiers", weight: 50 }, { name: "Auron's Inspiration", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "You're Not Alone", weight: 50 }, { name: "Slash of Light", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Balamb T-Rexaur", weight: 50 }, { name: "Cloudbound Moogle", weight: 50 }]
        }
      ]
    },

{//PACK -- Weapons
      id: "ji-FIN-Weapons",
      kind: "JUMPIN",
      name: "Weapons",
      theme: "Equipment",
      set: "Final Fantasy",
      colors: ["W"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Zack Fair", 1),
        CARD("Ashe, Princess of Dalmasca", 1),
        CARD("Adelbert Steiner", 1),
        CARD("Cloudbound Moogle", 1),
        CARD("Slash of Light", 1),
        CARD("Dragoon's Lance", 1),
        CARD("Lion Heart", 1),
        CARD("White Auracite", 1),
        CARD("Capital City", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Cloud, Midgar Mercenary", weight: 20 }, { name: "Genji Glove", weight: 40 }, { name: "Machinist's Arsenal", weight: 40 }]
        },
        {
          slot: 11,
          options: [{ name: "Sidequest: Catch a Fish", weight: 40 }, { name: "Weapons Vendor", weight: 40 }]
        },
        {
          slot: 12,
          options: [{ name: "Paladin's Arms", weight: 50 }, { name: "White Mage's Staff", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Monk's Fist", weight: 50 }, { name: "Gaelicat", weight: 50 }]
        }
      ]
    },

{//PACK -- Wild
      id: "ji-FIN-Wild",
      kind: "JUMPIN",
      name: "Wild",
      theme: "Go Big",
      set: "Final Fantasy",
      colors: ["R", "G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Rydia, Summoner of Mist", 1),
        CARD("Summon: Fenrir", 1),
        CARD("Sabotender", 1),
        CARD("Town Greeter", 1),
        CARD("Prishe's Wanderings", 1),
        CARD("Reach the Horizon", 1),
        CARD("Chocobo Kick", 1),
        CARD("Chocobo Racetrack", 1),
        CARD("Gongaga, Reactor Town", 1),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Traveling Chocobo", weight: 20 }, { name: "Tifa Lockhart", weight: 40 }, { name: "Zell Dincht", weight: 40 }]
        },
        {
          slot: 11,
          options: [{ name: "Sazh's Chocobo", weight: 50 }, { name: "Ride the Shoopuf", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Hill Gigas", weight: 50 }, { name: "Balamb T-Rexaur", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Gysahl Greens", weight: 50 }, { name: "Call the Mountain Chocobo", weight: 50 }]
        }
      ]
    },


]);
})(window.OFFICIAL);
