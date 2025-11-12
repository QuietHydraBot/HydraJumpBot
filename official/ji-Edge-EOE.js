/* official/ji-SET_NAME-SET_CODE.js
   Jump In! — SETNAME
*/
(function (OFF) {
  // 1) Cards for Set
OFF.registerMeta({

////// Colorless /////
"Dawnsire, Sunstar Dreadnought": { type: "Legendary Artifact — Spacecraft", mana: "{5}" },
"Extinguisher Battleship": { type: "Artifact — Spacecraft", mana: "{8}" },
"Lands": { type: "Card", mana: "" },
"Nutrient Block": { type: "Artifact — Food", mana: "{1}" },

////// Black /////
"Beamsaw Prospector": { type: "Creature — Human Artificer", mana: "{1}{B}" },
"Comet Crawler": { type: "Creature — Insect Horror", mana: "{2}{B}" },
"Decode Transmissions": { type: "Sorcery", mana: "{2}{B}" },
"Dubious Delicacy": { type: "Artifact — Food", mana: "{2}{B}" },
"Elegy Acolyte": { type: "Creature — Human Cleric", mana: "{2}{B}{B}" },
"Embrace Oblivion": { type: "Sorcery", mana: "{B}" },
"Fell Gravship": { type: "Artifact — Spacecraft", mana: "{2}{B}" },
"Gravblade Heavy": { type: "Creature — Human Soldier", mana: "{3}{B}" },
"Gravkill": { type: "Instant", mana: "{3}{B}" },
"Gravpack Monoist": { type: "Creature — Human Scout", mana: "{2}{B}" },
"Hullcarver": { type: "Artifact Creature — Robot Assassin", mana: "{B}" },
"Insatiable Skittermaw": { type: "Creature — Insect Horror", mana: "{2}{B}" },
"Lightless Evangel": { type: "Creature — Vampire Cleric", mana: "{1}{B}" },
"Monoist Circuit-Feeder": { type: "Artifact Creature — Nautilus", mana: "{4}{B}{B}" },
"Perigee Beckoner": { type: "Creature — Horror", mana: "{4}{B}" },
"Requiem Monolith": { type: "Artifact", mana: "{2}{B}" },
"Sothera, the Supervoid": { type: "Legendary Enchantment", mana: "{2}{B}{B}" },
"Susur Secundi, Void Altar": { type: "Land — Planet", mana: "" },
"Susurian Dirgecraft": { type: "Artifact — Spacecraft", mana: "{4}{B}" },
"Susurian Voidborn": { type: "Creature — Vampire Soldier", mana: "{2}{B}" },
"Swarm Culler": { type: "Creature — Insect Warrior", mana: "{3}{B}" },
"Temporal Intervention": { type: "Sorcery", mana: "{2}{B}" },
"Timeline Culler": { type: "Creature — Drix Warlock", mana: "{B}{B}" },
"Tragic Trajectory": { type: "Sorcery", mana: "{B}" },
"Umbral Collar Zealot": { type: "Creature — Human Cleric", mana: "{1}{B}" },
"Virus Beetle": { type: "Artifact Creature — Insect", mana: "{1}{B}" },
"Vote Out": { type: "Sorcery", mana: "{3}{B}" },
"Xu-Ifit, Osteoharmonist": { type: "Legendary Creature — Human Wizard", mana: "{1}{B}{B}" },

////// Green /////
"Atmospheric Greenhouse": { type: "Artifact — Spacecraft", mana: "{4}{G}" },
"Biosynthic Burst": { type: "Instant", mana: "{1}{G}" },
"Blooming Stinger": { type: "Creature — Plant Scorpion", mana: "{1}{G}" },
"Broodguard Elite": { type: "Creature — Insect Knight", mana: "{X}{G}{G}" },
"Close Encounter": { type: "Instant", mana: "{1}{G}" },
"Diplomatic Relations": { type: "Instant", mana: "{2}{G}" },
"Drix Fatemaker": { type: "Creature — Drix Wizard", mana: "{3}{G}" },
"Eumidian Terrabotanist": { type: "Creature — Insect Druid", mana: "{1}{G}" },
"Eusocial Engineering": { type: "Enchantment", mana: "{3}{G}{G}" },
"Evendo, Waking Haven": { type: "Land — Planet", mana: "" },
"Galactic Wayfarer": { type: "Creature — Human Scout", mana: "{2}{G}" },
"Gene Pollinator": { type: "Artifact Creature — Robot Insect", mana: "{G}" },
"Glacier Godmaw": { type: "Creature — Leviathan", mana: "{5}{G}{G}" },
"Hemosymbic Mite": { type: "Creature — Mite", mana: "{G}" },
"Icecave Crasher": { type: "Creature — Beast", mana: "{3}{G}" },
"Intrepid Tenderfoot": { type: "Creature — Insect Citizen", mana: "{1}{G}" },
"Larval Scoutlander": { type: "Artifact — Spacecraft", mana: "{2}{G}" },
"Lashwhip Predator": { type: "Creature — Plant Beast", mana: "{4}{G}{G}" },
"Loading Zone": { type: "Enchantment", mana: "{3}{G}" },
"Meltstrider Eulogist": { type: "Creature — Insect Soldier", mana: "{2}{G}" },
"Meltstrider's Resolve": { type: "Enchantment — Aura", mana: "{G}" },
"Mightform Harmonizer": { type: "Creature — Insect Druid", mana: "{2}{G}{G}" },
"Ouroboroid": { type: "Creature — Plant Wurm", mana: "{2}{G}{G}" },
"Sami's Curiosity": { type: "Sorcery", mana: "{G}" },
"Seedship Agrarian": { type: "Creature — Insect Scientist", mana: "{3}{G}" },
"Seedship Impact": { type: "Instant", mana: "{1}{G}" },
"Skystinger": { type: "Creature — Insect Warrior", mana: "{2}{G}" },
"Terrasymbiosis": { type: "Enchantment", mana: "{2}{G}" },
"Thawbringer": { type: "Creature — Insect Scout", mana: "{2}{G}" },

////// Red /////
"Bombard": { type: "Instant", mana: "{2}{R}" },
"Cut Propulsion": { type: "Instant", mana: "{2}{R}" },
"Debris Field Crusher": { type: "Artifact — Spacecraft", mana: "{4}{R}" },
"Devastating Onslaught": { type: "Sorcery", mana: "{X}{X}{R}" },
"Drill Too Deep": { type: "Instant", mana: "{1}{R}" },
"Frontline War-Rager": { type: "Creature — Kavu Soldier", mana: "{2}{R}" },
"Invasive Maneuvers": { type: "Instant", mana: "{1}{R}" },
"Kav Landseeker": { type: "Creature — Kavu Soldier", mana: "{3}{R}" },
"Kavaron Harrier": { type: "Artifact Creature — Robot Soldier", mana: "{R}" },
"Kavaron Turbodrone": { type: "Artifact Creature — Robot Scout", mana: "{2}{R}" },
"Kavaron, Memorial World": { type: "Land — Planet", mana: "" },
"Lithobraking": { type: "Instant", mana: "{2}{R}" },
"Melded Moxite": { type: "Artifact", mana: "{1}{R}" },
"Memorial Team Leader": { type: "Creature — Kavu Soldier", mana: "{3}{R}" },
"Molecular Modifier": { type: "Creature — Kavu Artificer", mana: "{2}{R}" },
"Nebula Dragon": { type: "Creature — Dragon", mana: "{6}{R}" },
"Orbital Plunge": { type: "Sorcery", mana: "{3}{R}" },
"Oreplate Pangolin": { type: "Artifact Creature — Robot Pangolin", mana: "{1}{R}" },
"Plasma Bolt": { type: "Sorcery", mana: "{R}" },
"Red Tiger Mechan": { type: "Artifact Creature — Robot Cat", mana: "{3}{R}" },
"Remnant Elemental": { type: "Creature — Elemental", mana: "{1}{R}" },
"Rig for War": { type: "Instant", mana: "{1}{R}" },
"Rust Harvester": { type: "Artifact Creature — Robot", mana: "{R}" },
"Slagdrill Scrapper": { type: "Artifact Creature — Robot Scout", mana: "{R}" },
"Terrapact Intimidator": { type: "Creature — Kavu Scout", mana: "{1}{R}" },
"Territorial Bruntar": { type: "Creature — Beast", mana: "{4}{R}{R}" },
"Vaultguard Trooper": { type: "Creature — Kavu Soldier", mana: "{4}{R}" },
"Warmaker Gunship": { type: "Artifact — Spacecraft", mana: "{2}{R}" },
"Weftstalker Ardent": { type: "Creature — Drix Artificer", mana: "{2}{R}" },
"Zookeeper Mechan": { type: "Artifact Creature — Robot", mana: "{1}{R}" },

////// Blue /////
"Cloudsculpt Technician": { type: "Creature — Jellyfish Artificer", mana: "{2}{U}" },
"Codecracker Hound": { type: "Creature — Dog", mana: "{2}{U}" },
"Cryogen Relic": { type: "Artifact", mana: "{1}{U}" },
"Cryoshatter": { type: "Enchantment — Aura", mana: "{U}" },
"Divert Disaster": { type: "Instant", mana: "{1}{U}" },
"Gigastorm Titan": { type: "Creature — Elemental", mana: "{4}{U}" },
"Illvoi Galeblade": { type: "Creature — Jellyfish Warrior", mana: "{U}" },
"Illvoi Infiltrator": { type: "Creature — Jellyfish Rogue", mana: "{2}{U}" },
"Illvoi Operative": { type: "Creature — Jellyfish Rogue", mana: "{1}{U}" },
"Lost in Space": { type: "Instant", mana: "{3}{U}" },
"Mechan Assembler": { type: "Artifact Creature — Robot Artificer", mana: "{4}{U}" },
"Mechan Navigator": { type: "Artifact Creature — Robot Pilot", mana: "{1}{U}" },
"Mechan Shieldmate": { type: "Artifact Creature — Robot Soldier", mana: "{1}{U}" },
"Mechanozoa": { type: "Artifact Creature — Robot Jellyfish", mana: "{4}{U}{U}" },
"Mental Modulation": { type: "Instant", mana: "{1}{U}" },
"Mouth of the Storm": { type: "Creature — Elemental", mana: "{6}{U}" },
"Quantum Riddler": { type: "Creature — Sphinx", mana: "{3}{U}{U}" },
"Selfcraft Mechan": { type: "Artifact Creature — Robot Artificer", mana: "{3}{U}" },
"Starbreach Whale": { type: "Creature — Whale", mana: "{4}{U}" },
"Starwinder": { type: "Creature — Leviathan", mana: "{5}{U}{U}" },
"Steelswarm Operator": { type: "Artifact Creature — Robot Soldier", mana: "{1}{U}" },
"Synthesizer Labship": { type: "Artifact — Spacecraft", mana: "{U}" },
"Tractor Beam": { type: "Enchantment — Aura", mana: "{2}{U}{U}" },
"Uthros Psionicist": { type: "Creature — Jellyfish Scientist", mana: "{2}{U}" },
"Uthros Scanship": { type: "Artifact — Spacecraft", mana: "{3}{U}" },
"Uthros, Titanic Godcore": { type: "Land — Planet", mana: "" },

////// White /////
"Adagia, Windswept Bastion": { type: "Land — Planet", mana: "" },
"All-Fates Stalker": { type: "Creature — Drix Assassin", mana: "{3}{W}" },
"Auxiliary Boosters": { type: "Artifact — Equipment", mana: "{4}{W}" },
"Banishing Light": { type: "Enchantment", mana: "{2}{W}" },
"Cosmogrand Zenith": { type: "Creature — Human Soldier", mana: "{2}{W}" },
"Dawnstrike Vanguard": { type: "Creature — Human Knight", mana: "{5}{W}" },
"Dockworker Drone": { type: "Artifact Creature — Robot", mana: "{1}{W}" },
"Dual-Sun Adepts": { type: "Creature — Human Soldier", mana: "{2}{W}" },
"Dual-Sun Technique": { type: "Instant", mana: "{1}{W}" },
"Exosuit Savior": { type: "Creature — Human Soldier", mana: "{2}{W}" },
"Flight-Deck Coordinator": { type: "Creature — Human Soldier", mana: "{2}{W}" },
"Focus Fire": { type: "Instant", mana: "{W}" },
"Honor": { type: "Sorcery", mana: "{W}" },
"Honored Knight-Captain": { type: "Creature — Human Advisor Knight", mana: "{1}{W}" },
"Knight Luminary": { type: "Creature — Human Knight", mana: "{3}{W}" },
"Lumen-Class Frigate": { type: "Artifact — Spacecraft", mana: "{1}{W}" },
"Rayblade Trooper": { type: "Creature — Human Soldier", mana: "{2}{W}" },
"Reroute Systems": { type: "Instant", mana: "{W}" },
"Rescue Skiff": { type: "Artifact — Spacecraft", mana: "{5}{W}" },
"Squire's Lightblade": { type: "Artifact — Equipment", mana: "{W}" },
"Starfighter Pilot": { type: "Creature — Human Pilot", mana: "{1}{W}" },
"Starport Security": { type: "Artifact Creature — Robot Soldier", mana: "{W}" },
"Sunstar Chaplain": { type: "Creature — Human Cleric", mana: "{1}{W}" },
"Wedgelight Rammer": { type: "Artifact — Spacecraft", mana: "{3}{W}" },
"Weftblade Enhancer": { type: "Creature — Drix Artificer", mana: "{5}{W}" },
"Zealous Display": { type: "Instant", mana: "{2}{W}" },

////// Red Green /////
"Biotech Specialist": { type: "Creature — Insect Scientist", mana: "{R}{G}" },
"Rugged Highlands": { type: "Land", mana: "" },
"Tannuk, Memorial Ensign": { type: "Legendary Creature — Kavu Pilot", mana: "{1}{R}{G}" },

////// Blue Black /////
"Alpharael, Dreaming Acolyte": { type: "Legendary Creature — Human Cleric", mana: "{1}{U}{B}" },
"Dismal Backwater": { type: "Land", mana: "" },

////// Blue Green /////
"Biomechan Engineer": { type: "Creature — Insect Artificer", mana: "{G}{U}" },
"Genemorph Imago": { type: "Creature — Insect Druid", mana: "{G}{U}" },
"Thornwood Falls": { type: "Land", mana: "" },

////// White Black /////
"Scoured Barrens": { type: "Land", mana: "" },
"Syr Vondam, Sunstar Exemplar": { type: "Legendary Creature — Human Knight", mana: "{W}{B}" },
"Syr Vondam, the Lucent": { type: "Legendary Creature — Human Knight", mana: "{2}{W}{B}{B}" },

////// White Red /////
"Sami, Ship's Engineer": { type: "Legendary Creature — Human Artificer", mana: "{2}{R}{W}" },
"Wind-Scarred Crag": { type: "Land", mana: "" },





});




// 2) Packs
OFF.registerPacks("jumpin", [

{//PACK -- Artifacts
      id: "ji-EOE-Artifacts",
      kind: "JUMPIN",
      name: "Artifacts",
      theme: "Artifacts",
      set: "Edge of Eternities",
      colors: ["R"],
      tags: ["official"],

      // Fixed cards (always in)
      deck: [
        CARD("Weftstalker Ardent", 1),
        CARD("Oreplate Pangolin", 1),
        CARD("Zookeeper Mechan", 1),
        CARD("Kavaron Turbodrone", 1),
        CARD("Plasma Bolt", 1),
        CARD("Debris Field Crusher", 1),
        CARD("Melded Moxite", 1),
        CARD("Kavaron, Memorial World", 1),
      ],

      // Weighted random slots (single full names; DO NOT split on commas)
      slots: [
        {
          slot: 9,
          options: [{ name: "Devastating Onslaught", weight: 20 }, { name: "Warmaker Gunship", weight: 40 }, { name: "Rust Harvester", weight: 40 }]
        },
        {
          slot: 10,
          options: [{ name: "Kavaron Harrier", weight: 50 }, { name: "Slagdrill Scrapper", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Memorial Team Leader", weight: 50 }, { name: "Molecular Modifier", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Invasive Maneuvers", weight: 50 }, { name: "Cut Propulsion", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Kav Landseeker", weight: 50 }, { name: "Red Tiger Mechan", weight: 50 }]
        }
      ]
    },

{//PACK -- Cosmic
      id: "ji-EOE-Cosmic",
      kind: "JUMPIN",
      name: "Cosmic",
      theme: "Play 2 Spells",
      set: "Edge of Eternities",
      colors: ["U"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Starwinder", 1),
        CARD("Illvoi Infiltrator", 1),
        CARD("Uthros Psionicist", 1),
        CARD("Illvoi Galeblade", 1),
        CARD("Illvoi Operative", 1),
        CARD("Starbreach Whale", 1),
        CARD("Mental Modulation", 1),
        CARD("Tractor Beam", 1),
        CARD("Cryoshatter", 1),
        CARD("Island", 8),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Quantum Riddler", weight: 20 }, { name: "Starwinder", weight: 80 }]
        },
        {
          slot: 11,
          options: [{ name: "Mechan Navigator", weight: 50 }, { name: "Codecracker Hound", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Uthros Scanship", weight: 50 }, { name: "Gigastorm Titan", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Divert Disaster", weight: 50 }, { name: "Lost in Space", weight: 50 }]
        }
      ]
    },

{//PACK -- Greenhouse
      id: "ji-EOE-Greenhouse",
      kind: "JUMPIN",
      name: "Greenhouse",
      theme: "+1/+1",
      set: "Edge of Eternities",
      colors: ["G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Meltstrider Eulogist", 1),
        CARD("Seedship Agrarian", 1),
        CARD("Lashwhip Predator", 1),
        CARD("Broodguard Elite", 1),
        CARD("Intrepid Tenderfoot", 1),
        CARD("Drix Fatemaker", 1),
        CARD("Biosynthic Burst", 1),
        CARD("Diplomatic Relations", 1),
        CARD("Atmospheric Greenhouse", 1),
        CARD("Evendo, Waking Haven", 1),
        CARD("Forest", 7),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Ouroboroid", weight: 20 }, { name: "Terrasymbiosis", weight: 40 }, { name: "Loading Zone", weight: 40 }]
        },
        {
          slot: 12,
          options: [{ name: "Hemosymbic Mite", weight: 50 }, { name: "Blooming Stinger", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Skystinger", weight: 50 }, { name: "Thawbringer", weight: 50 }]
        }
      ]
    },

{//PACK -- Luminaries
      id: "ji-EOE-Luminaries",
      kind: "JUMPIN",
      name: "Luminaries",
      theme: "+1/+1",
      set: "Edge of Eternities",
      colors: ["W"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Rayblade Trooper", 1),
        CARD("Starport Security", 1),
        CARD("Dockworker Drone", 1),
        CARD("Knight Luminary", 1),
        CARD("Weftblade Enhancer", 1),
        CARD("Dual-Sun Technique", 1),
        CARD("Honor", 1),
        CARD("Banishing Light", 1),
        CARD("Auxiliary Boosters", 1),
        CARD("Adagia, Windswept Bastion", 1),
        CARD("Plains", 7),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Cosmogrand Zenith", weight: 20 }, { name: "Lumen-Class Frigate", weight: 80 }]
        },
        {
          slot: 12,
          options: [{ name: "Dual-Sun Adepts", weight: 50 }, { name: "All-Fates Stalker", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Reroute Systems", weight: 50 }, { name: "Focus Fire", weight: 50 }]
        }
      ]
    },

{//PACK -- Pyrrhic
      id: "ji-EOE-Pyrrhic",
      kind: "JUMPIN",
      name: "Pyrrhic",
      theme: "Go Wide?",
      set: "Edge of Eternities",
      colors: ["W","B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Honored Knight-Captain", 1),
        CARD("Syr Vondam, the Lucent", 1),
        CARD("Knight Luminary", 1),
        CARD("Vote Out", 1),
        CARD("Embrace Oblivion", 1),
        CARD("Dubious Delicacy", 1),
        CARD("Auxiliary Boosters", 1),
        CARD("Scoured Barrens", 1),
        CARD("Plains", 3),
        CARD("Swamp", 4),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Syr Vondam, Sunstar Exemplar", weight: 50 }, { name: "Elegy Acolyte", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Timeline Culler", weight: 50 }, { name: "Susurian Voidborn", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Virus Beetle", weight: 50 }, { name: "Beamsaw Prospector", weight: 50 }]
        },
        {
          slot: 14,
          options: [{ name: "Gravpack Monoist", weight: 50 }, { name: "Exosuit Savior", weight: 50 }]
        },
        {
          slot: 15,
          options: [{ name: "Zealous Display", weight: 50 }, { name: "Squire's Lightblade", weight: 50 }]
        }
      ]
    },

{//PACK -- Stations
      id: "ji-EOE-Stations",
      kind: "JUMPIN",
      name: "Stations",
      theme: "Stations",
      set: "Edge of Eternities",
      colors: ["R","W"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Sunstar Chaplain", 1),
        CARD("Sami, Ship's Engineer", 1),
        CARD("Dawnstrike Vanguard", 1),
        CARD("Starfighter Pilot", 1),
        CARD("Zookeeper Mechan", 1),
        CARD("Orbital Plunge", 1),
        CARD("Wedgelight Rammer", 1),
        CARD("Wind-Scarred Crag", 1),
        CARD("plains", 4),
        CARD("mountain", 3),
      ],

      // Weighted slots
      slots: [
        {
          slot: 11,
          options: [{ name: "Dawnsire, Sunstar Dreadnought", weight: 20 }, { name: "Sunstar Chaplain", weight: 80 }]
        },
        {
          slot: 12,
          options: [{ name: "Vaultguard Trooper", weight: 50 }, { name: "Rescue Skiff", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Frontline War-Rager", weight: 50 }, { name: "Flight-Deck Coordinator", weight: 50 }]
        },
        {
          slot: 14,
          options: [{ name: "Squire's Lightblade", weight: 50 }, { name: "Rig for War", weight: 50 }]
        },
        {
          slot: 15,
          options: [{ name: "Drill Too Deep", weight: 50 }, { name: "Melded Moxite", weight: 50 }]
        }
      ]
    },

{//PACK -- Synthesized
      id: "ji-EOE-Synthesized",
      kind: "JUMPIN",
      name: "Synthesized",
      theme: "Artifacts",
      set: "Edge of Eternities",
      colors: ["U","B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Alpharael, Dreaming Acolyte", 1),
        CARD("Mechan Assembler", 1),
        CARD("Monoist Circuit-Feeder", 1),
        CARD("Mechan Shieldmate", 1),
        CARD("Cloudsculpt Technician", 1),
        CARD("Dubious Delicacy", 1),
        CARD("Nutrient Block", 1),
        CARD("Cryogen Relic", 1),
        CARD("Uthros, Titanic Godcore", 1),
        CARD("Dismal Backwater", 1),
        CARD("swamp", 3),
        CARD("island", 3),
      ],

      // Weighted slots
      slots: [
        {
          slot: 13,
          options: [{ name: "Requiem Monolith", weight: 50 }, { name: "Synthesizer Labship", weight: 50 }]
        },
        {
          slot: 14,
          options: [{ name: "Umbral Collar Zealot", weight: 50 }, { name: "Steelswarm Operator", weight: 50 }]
        },
        {
          slot: 15,
          options: [{ name: "Hullcarver", weight: 50 }, { name: "Virus Beetle", weight: 50 }]
        },
        {
          slot: 16,
          options: [{ name: "Selfcraft Mechan", weight: 50 }, { name: "Gravblade Heavy", weight: 50 }]
        }
      ]
    },

{//PACK -- Terraforming
      id: "ji-EOE-Terraforming",
      kind: "JUMPIN",
      name: "Terraforming",
      theme: "Ramp",
      set: "Edge of Eternities",
      colors: ["U","G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Biomechan Engineer", 1),
        CARD("Eumidian Terrabotanist anist", 1),
        CARD("Gene Pollinator", 1),
        CARD("Galactic Wayfarer", 1),
        CARD("Mechanozoa", 1),
        CARD("Lost in Space", 1),
        CARD("Sami's Curiosity", 1),
        CARD("Eusocial Engineering", 1),
        CARD("Thornwood Falls", 1),
        CARD("Forest", 4),
        CARD("Island", 3),
      ],

      // Weighted slots
      slots: [
        {
          slot: 12,
          options: [{ name: "Genemorph Imago", weight: 50 }, { name: "Extinguisher Battleship", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Mouth of the Storm", weight: 50 }, { name: "Glacier Godmaw", weight: 50 }]
        },
        {
          slot: 14,
          options: [{ name: "Close Encounter", weight: 50 }, { name: "Meltstrider's Resolve", weight: 50 }]
        }
      ]
    },

{//PACK -- Void
      id: "ji-EOE-Void",
      kind: "JUMPIN",
      name: "Void",
      theme: "Sacrifice",
      set: "Edge of Eternities",
      colors: ["B"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Lightless Evangel", 1),
        CARD("Umbral Collar Zealot", 1),
        CARD("Gravpack Monoist", 1),
        CARD("Insatiable Skittermaw", 1),
        CARD("Swarm Culler", 1),
        CARD("Gravkill", 1),
        CARD("Tragic Trajectory", 1),
        CARD("Susur Secundi, Void Altar", 1),
        CARD("swamp", 7),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Sothera, the Supervoid", weight: 20 }, { name: "Xu-Ifit, Osteoharmonist", weight: 80 }]
        },
        {
          slot: 11,
          options: [{ name: "Susurian Dirgecraft", weight: 50 }, { name: "Fell Gravship", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Virus Beetle", weight: 50 }, { name: "Beamsaw Prospector", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Perigee Beckoner", weight: 50 }, { name: "Comet Crawler", weight: 0 }]
        },
        {
          slot: 14,
          options: [{ name: "Temporal Intervention", weight: 50 }, { name: "Decode Transmissions", weight: 50 }]
        }
      ]
    },

{//PACK -- Wayfaring
      id: "ji-EOE-Wayfaring",
      kind: "JUMPIN",
      name: "Wayfaring",
      theme: "Landfall",
      set: "Edge of Eternities",
      colors: ["R","G"],
      tags: ["official"],

      // Fixed cards
      deck: [
        CARD("Tannuk, Memorial Ensign", 1),
        CARD("Slagdrill Scrapper", 1),
        CARD("Galactic Wayfarer", 1),
        CARD("Icecave Crasher", 1),
        CARD("Orbital Plunge", 1),
        CARD("Larval Scoutlander", 1),
        CARD("Rugged Highlands", 1),
        CARD("Forest", 4),
        CARD("Mountain", 4),
      ],

      // Weighted slots
      slots: [
        {
          slot: 10,
          options: [{ name: "Biotech Specialist", weight: 50 }, { name: "Mightform Harmonizer", weight: 50 }]
        },
        {
          slot: 11,
          options: [{ name: "Terrapact Intimidator", weight: 50 }, { name: "Remnant Elemental", weight: 50 }]
        },
        {
          slot: 12,
          options: [{ name: "Territorial Bruntar", weight: 50 }, { name: "Nebula Dragon", weight: 50 }]
        },
        {
          slot: 13,
          options: [{ name: "Lithobraking", weight: 50 }, { name: "Seedship Impact", weight: 50 }]
        },
        {
          slot: 14,
          options: [{ name: "Bombard", weight: 50 }, { name: "Biosynthic Burst", weight: 50 }]
        }
      ]
    },














]);
})(window.OFFICIAL);
