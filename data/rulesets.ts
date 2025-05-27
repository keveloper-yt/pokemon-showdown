// Note: These are the rules that formats use

import type { Learnset } from "../sim/dex-species";

// The list of formats is stored in config/formats.js
export const Rulesets: import('../sim/dex-formats').FormatDataTable = {

	// Rulesets
	///////////////////////////////////////////////////////////////////

	standardag: {
		effectType: 'ValidatorRule',
		name: 'Standard AG',
		desc: "The minimal ruleset for Anything Goes",
		ruleset: [
			'Obtainable', 'Team Preview', 'HP Percentage Mod', 'Cancel Mod', 'Endless Battle Clause',
		],
	},
	standard: {
		effectType: 'ValidatorRule',
		name: 'Standard',
		desc: "The standard ruleset for all official Smogon singles tiers (Ubers, OU, etc.)",
		ruleset: [
			'Standard AG',
			'Sleep Clause Mod', 'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Items Clause', 'Evasion Moves Clause',
		],
	},
	standardnext: {
		effectType: 'ValidatorRule',
		name: 'Standard NEXT',
		desc: "The standard ruleset for the NEXT mod",
		ruleset: [
			'+Unreleased', 'Sleep Clause Mod', 'Species Clause', 'Nickname Clause', 'OHKO Clause', 'HP Percentage Mod', 'Cancel Mod',
		],
		banlist: ['Soul Dew'],
	},
	flatrules: {
		effectType: 'ValidatorRule',
		name: 'Flat Rules',
		desc: "The in-game Flat Rules: Adjust Level Down 50, Species Clause, Item Clause = 1, -Mythical, -Restricted Legendary, Bring 6 Pick 3-6 depending on game type.",
		ruleset: ['Obtainable', 'Team Preview', 'Species Clause', 'Nickname Clause', 'Item Clause = 1', 'Adjust Level Down = 50', 'Picked Team Size = Auto', 'Cancel Mod'],
		banlist: ['Mythical', 'Restricted Legendary'],
	},
	limittworestricted: {
		effectType: 'ValidatorRule',
		name: 'Limit Two Restricted',
		desc: "Limit two restricted Pokémon (flagged with * in the rules list)",
		onValidateTeam(team) {
			const restrictedSpecies = [];
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				if (this.ruleTable.isRestrictedSpecies(species)) restrictedSpecies.push(species.name);
			}
			if (restrictedSpecies.length > 2) {
				return [`You can only use up to two restricted Pok\u00E9mon (you have: ${restrictedSpecies.join(', ')})`];
			}
		},
	},
	limitonerestricted: {
		effectType: 'ValidatorRule',
		name: 'Limit One Restricted',
		desc: "Limit one restricted Pokémon (flagged with * in the rules list)",
		onValidateTeam(team) {
			const restrictedSpecies = [];
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				if (this.ruleTable.isRestrictedSpecies(species)) restrictedSpecies.push(species.name);
			}
			if (restrictedSpecies.length > 1) {
				return [`You can only use one restricted Pok\u00E9mon (you have: ${restrictedSpecies.join(', ')})`];
			}
		},
	},
	standarddoubles: {
		effectType: 'ValidatorRule',
		name: 'Standard Doubles',
		desc: "The standard ruleset for all official Smogon doubles tiers",
		ruleset: [
			'Standard AG',
			'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Moves Clause', 'Gravity Sleep Clause',
		],
	},
	standardoms: {
		effectType: 'ValidatorRule',
		name: 'Standard OMs',
		desc: "The standard ruleset for all Smogon OMs (Almost Any Ability, STABmons, etc.)",
		ruleset: [
			'Standard AG',
			'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Moves Clause', 'Overflow Stat Mod',
		],
	},
	standardnatdex: {
		effectType: 'ValidatorRule',
		name: 'Standard NatDex',
		desc: "The standard ruleset for all National Dex tiers",
		ruleset: [
			'Standard AG', 'NatDex Mod',
			'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Clause', 'Sleep Clause Mod',
		],
	},
	natdexmod: {
		effectType: 'ValidatorRule',
		name: 'NatDex Mod',
		desc: "Mechanics for National Dex formats",
		ruleset: [
			'+Unobtainable', '+Past', 'Sketch Post-Gen 7 Moves',
		],
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			if (species.natDexTier === 'Illegal') {
				if (this.ruleTable.has(`+pokemon:${species.id}`)) return;
				return [`${set.name || set.species} does not exist in the National Dex.`];
			}
			const requireObtainable = this.ruleTable.has('obtainable');
			if (requireObtainable) {
				if (species.natDexTier === "Unreleased") {
					const basePokemon = this.toID(species.baseSpecies);
					if (this.ruleTable.has(`+pokemon:${species.id}`) || this.ruleTable.has(`+basepokemon:${basePokemon}`)) {
						return;
					}
					return [`${set.name || set.species} does not exist in the National Dex.`];
				}
				for (const moveid of set.moves) {
					const move = this.dex.moves.get(moveid);
					if (move.isNonstandard === 'Unobtainable' && move.gen === this.dex.gen || move.id === 'lightofruin') {
						if (this.ruleTable.has(`+move:${move.id}`)) continue;
						const problem = `${set.name}'s move ${move.name} does not exist in the National Dex.`;
						if (this.ruleTable.has('omunobtainablemoves')) {
							const { outOfBattleSpecies } = this.getValidationSpecies(set);
							if (!this.omCheckCanLearn(move, outOfBattleSpecies, this.allSources(outOfBattleSpecies), set, problem)) continue;
						}
						return [problem];
					}
				}
			}
			// Any item that was legal in Gen 7 (Normal Gem for example) should be usable
			if (!set.item) return;
			let item = this.dex.items.get(set.item);
			let gen = this.dex.gen;
			while (item.isNonstandard && gen >= 7) {
				item = this.dex.forGen(gen).items.get(item.id);
				gen--;
			}
			if (requireObtainable && item.isNonstandard) {
				if (this.ruleTable.has(`+item:${item.id}`)) return;
				return [`${set.name}'s item ${item.name} does not exist in Gen ${this.dex.gen}.`];
			}
		},
	},
	standarddraft: {
		effectType: 'ValidatorRule',
		name: 'Standard Draft',
		desc: "The custom Draft League ruleset",
		ruleset: [
			'Obtainable', '+Unreleased', '+CAP', 'Sketch Post-Gen 7 Moves', 'Team Preview', 'Sleep Clause Mod', 'OHKO Clause', 'Evasion Clause', 'Endless Battle Clause', 'HP Percentage Mod', 'Cancel Mod',
		],
		// timer: {starting: 60 * 60, grace: 0, addPerTurn: 10, maxPerTurn: 100, timeoutAutoChoose: true},
	},
	obtainable: {
		effectType: 'ValidatorRule',
		name: 'Obtainable',
		desc: "Makes sure the team is possible to obtain in-game.",
		ruleset: ['Obtainable Moves', 'Obtainable Abilities', 'Obtainable Formes', 'EV Limit = Auto', 'Obtainable Misc'],
		banlist: ['Unreleased', 'Unobtainable', 'Nonexistent'],
		// Mostly hardcoded in team-validator.ts
		onValidateTeam(team, format) {
			let kyuremCount = 0;
			let necrozmaDMCount = 0;
			let necrozmaDWCount = 0;
			let calyrexCount = 0;
			for (const set of team) {
				if (set.species === 'Kyurem-White' || set.species === 'Kyurem-Black') {
					if (kyuremCount > 0) {
						return [
							`You cannot have more than one Kyurem-Black/Kyurem-White.`,
							`(It's untradeable and you can only make one with the DNA Splicers.)`,
						];
					}
					kyuremCount++;
				}
			}
			return [];
		},
	},
	obtainablemoves: {
		effectType: 'ValidatorRule',
		name: 'Obtainable Moves',
		desc: "Makes sure moves are learnable by the species.",
		// Hardcoded in team-validator.ts
	},
	obtainableabilities: {
		effectType: 'ValidatorRule',
		name: 'Obtainable Abilities',
		desc: "Makes sure abilities match the species.",
		// Hardcoded in team-validator.ts
	},
	obtainableformes: {
		effectType: 'ValidatorRule',
		name: 'Obtainable Formes',
		desc: "Makes sure in-battle formes only appear in-battle.",
		// Hardcoded in team-validator.ts
	},
	obtainablemisc: {
		effectType: 'ValidatorRule',
		name: 'Obtainable Misc',
		desc: "Validate all obtainability things that aren't moves/abilities (Hidden Power type, gender, IVs, events, duplicate moves).",
		// Mostly hardcoded in team-validator.ts
		onChangeSet(set) {
			const species = this.dex.species.get(set.species);

			if (species.gender) {
				if (set.gender !== species.gender) {
					set.gender = species.gender;
				}
			} else {
				if (set.gender !== 'M' && set.gender !== 'F') {
					set.gender = '';
				}
			}

			// limit one of each move
			// repealing this will not actually let you USE multiple moves, because of a cart bug:
			// https://twitter.com/DaWoblefet/status/1396217830006132737
			if (set.moves) {
				const hasMove: { [k: string]: true } = {};
				for (const moveId of set.moves) {
					const move = this.dex.moves.get(moveId);
					const moveid = move.id;
					if (hasMove[moveid]) return [`${species.baseSpecies} has multiple copies of ${move.name}.`];
					hasMove[moveid] = true;
				}
			}
		},
	},
	hoennpokedex: {
		effectType: 'ValidatorRule',
		name: 'Hoenn Pokedex',
		desc: "Only allows Pok&eacute;mon native to the Hoenn region (OR/AS)",
		onValidateSet(set, format) {
			const hoennDex = [
				"Abra", "Absol", "Aggron", "Alakazam", "Altaria", "Anorith", "Armaldo", "Aron", "Azumarill", "Azurill", "Bagon", "Baltoy", "Banette", "Barboach", "Beautifly", "Beldum", "Bellossom", "Blaziken", "Breloom", "Budew", "Cacnea", "Cacturne", "Camerupt", "Carvanha", "Cascoon", "Castform", "Chimecho", "Chinchou", "Chingling", "Clamperl", "Claydol", "Combusken", "Corphish", "Corsola", "Cradily", "Crawdaunt", "Crobat", "Delcatty", "Dodrio", "Doduo", "Donphan", "Dusclops", "Dusknoir", "Duskull", "Dustox", "Electrike", "Electrode", "Exploud", "Feebas", "Flygon", "Froslass", "Gallade", "Gardevoir", "Geodude", "Girafarig", "Glalie", "Gloom", "Golbat", "Goldeen", "Golduck", "Golem", "Gorebyss", "Graveler", "Grimer", "Grovyle", "Grumpig", "Gulpin", "Gyarados", "Hariyama", "Heracross", "Horsea", "Huntail", "Igglybuff", "Illumise", "Jigglypuff", "Kadabra", "Kecleon", "Kingdra", "Kirlia", "Koffing", "Lairon", "Lanturn", "Latias", "Latios", "Lileep", "Linoone", "Lombre", "Lotad", "Loudred", "Ludicolo", "Lunatone", "Luvdisc", "Machamp", "Machoke", "Machop", "Magcargo", "Magikarp", "Magnemite", "Magneton", "Magnezone", "Makuhita", "Manectric", "Marill", "Marshtomp", "Masquerain", "Mawile", "Medicham", "Meditite", "Metagross", "Metang", "Mightyena", "Milotic", "Minun", "Mudkip", "Muk", "Natu", "Nincada", "Ninetales", "Ninjask", "Nosepass", "Numel", "Nuzleaf", "Oddish", "Pelipper", "Phanpy", "Pichu", "Pikachu", "Pinsir", "Plusle", "Poochyena", "Probopass", "Psyduck", "Raichu", "Ralts", "Regice", "Regirock", "Registeel", "Relicanth", "Rhydon", "Rhyhorn", "Rhyperior", "Roselia", "Roserade", "Sableye", "Salamence", "Sandshrew", "Sandslash", "Sceptile", "Seadra", "Seaking", "Sealeo", "Seedot", "Seviper", "Sharpedo", "Shedinja", "Shelgon", "Shiftry", "Shroomish", "Shuppet", "Silcoon", "Skarmory", "Skitty", "Slaking", "Slakoth", "Slugma", "Snorunt", "Solrock", "Spheal", "Spinda", "Spoink", "Starmie", "Staryu", "Surskit", "Swablu", "Swalot", "Swampert", "Swellow", "Taillow", "Tentacool", "Tentacruel", "Torchic", "Torkoal", "Trapinch", "Treecko", "Tropius", "Vibrava", "Vigoroth", "Vileplume", "Volbeat", "Voltorb", "Vulpix", "Wailmer", "Wailord", "Walrein", "Weezing", "Whiscash", "Whismur", "Wigglytuff", "Wingull", "Wobbuffet", "Wurmple", "Wynaut", "Xatu", "Zangoose", "Zigzagoon", "Zubat",
			];
			const species = this.dex.species.get(set.species || set.name);
			if (!hoennDex.includes(species.baseSpecies) && !this.ruleTable.has('+' + species.id)) {
				return [species.baseSpecies + " is not in the Hoenn Pokédex."];
			}
		},
	},
	sinnohpokedex: {
		effectType: 'ValidatorRule',
		name: 'Sinnoh Pokedex',
		desc: "Only allows Pok&eacute;mon native to the Sinnoh region (Platinum)",
		onValidateSet(set, format) {
			const sinnohDex = [
				"Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Abra", "Kadabra", "Alakazam", "Magikarp", "Gyarados", "Budew", "Roselia", "Roserade", "Zubat", "Golbat", "Crobat", "Geodude", "Graveler", "Golem", "Onix", "Steelix", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Machop", "Machoke", "Machamp", "Psyduck", "Golduck", "Burmy", "Wormadam", "Mothim", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", "Heracross", "Aipom", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Gastly", "Haunter", "Gengar", "Misdreavus", "Mismagius", "Murkrow", "Honchkrow", "Glameow", "Purugly", "Goldeen", "Seaking", "Barboach", "Whiscash", "Chingling", "Chimecho", "Stunky", "Skuntank", "Meditite", "Medicham", "Bronzor", "Bronzong", "Ponyta", "Rapidash", "Bonsly", "Sudowoodo", "Mime Jr.", "Mr. Mime", "Happiny", "Chansey", "Blissey", "Cleffa", "Clefairy", "Clefable", "Chatot", "Pichu", "Pikachu", "Raichu", "Hoothoot", "Noctowl", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Snorlax", "Unown", "Riolu", "Lucario", "Wooper", "Quagsire", "Wingull", "Pelipper", "Girafarig", "Hippopotas", "Hippowdon", "Azurill", "Marill", "Azumarill", "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Remoraid", "Octillery", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Feebas", "Milotic", "Mantyke", "Mantine", "Snover", "Abomasnow", "Sneasel", "Weavile", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Manaphy", "Rotom", "Gligar", "Gliscor", "Nosepass", "Probopass", "Ralts", "Kirlia", "Gardevoir", "Gallade", "Lickitung", "Lickilicky", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Swablu", "Altaria", "Togepi", "Togetic", "Togekiss", "Houndour", "Houndoom", "Magnemite", "Magneton", "Magnezone", "Tangela", "Tangrowth", "Yanma", "Yanmega", "Tropius", "Rhyhorn", "Rhydon", "Rhyperior", "Duskull", "Dusclops", "Dusknoir", "Porygon", "Porygon2", "Porygon-Z", "Scyther", "Scizor", "Elekid", "Electabuzz", "Electivire", "Magby", "Magmar", "Magmortar", "Swinub", "Piloswine", "Mamoswine", "Snorunt", "Glalie", "Froslass", "Absol", "Giratina",
			];
			const species = this.dex.species.get(set.species || set.name);
			if ((!sinnohDex.includes(species.baseSpecies) || species.gen > 4) && !this.ruleTable.has('+' + species.id)) {
				return [`${species.name} is not in the Sinnoh Pokédex.`];
			}
		},
	},
	oldunovapokedex: {
		effectType: 'ValidatorRule',
		name: 'Old Unova Pokedex',
		desc: "Only allows Pok&eacute;mon native to the Unova region as of the original Black/White games",
		onValidateSet(set, format) {
			const species = this.dex.species.get(set.species || set.name);
			const isUnova = (species.num >= 494 && species.num <= 649) &&
				!['Black', 'White', 'Therian', 'Resolute'].includes(species.forme) && species.gen <= 5;
			if (!isUnova && !this.ruleTable.has('+' + species.id)) {
				return [`${species.baseSpecies} is not in the Old Unova Pokédex.`];
			}
		},
	},
	newunovapokedex: {
		effectType: 'ValidatorRule',
		name: 'New Unova Pokedex',
		desc: "Only allows Pok&eacute;mon native to the Unova region as of the Black 2/White 2 games",
		onValidateSet(set, format) {
			const unovaDex = [
				"Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Purrloin", "Liepard", "Pidove", "Tranquill", "Unfezant", "Unfezant", "Sewaddle", "Swadloon", "Leavanny", "Sunkern", "Sunflora", "Lillipup", "Herdier", "Stoutland", "Mareep", "Flaaffy", "Ampharos", "Psyduck", "Golduck", "Azurill", "Marill", "Azumarill", "Riolu", "Lucario", "Dunsparce", "Audino", "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Venipede", "Whirlipede", "Scolipede", "Koffing", "Weezing", "Magnemite", "Magneton", "Magnezone", "Growlithe", "Arcanine", "Magby", "Magmar", "Magmortar", "Elekid", "Electabuzz", "Electivire", "Rattata", "Raticate", "Zubat", "Golbat", "Crobat", "Grimer", "Muk", "Woobat", "Swoobat", "Roggenrola", "Boldore", "Gigalith", "Onix", "Steelix", "Timburr", "Gurdurr", "Conkeldurr", "Drilbur", "Excadrill", "Skitty", "Delcatty", "Buneary", "Lopunny", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Munna", "Musharna", "Cleffa", "Clefairy", "Clefable", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", "Basculin", "Basculin", "Trubbish", "Garbodor", "Minccino", "Cinccino", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Sandshrew", "Sandslash", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Maractus", "Sigilyph", "Trapinch", "Vibrava", "Flygon", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta", "Archen", "Archeops", "Klink", "Klang", "Klinklang", "Budew", "Roselia", "Roserade", "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Combee", "Vespiquen", "Emolga", "Heracross", "Pinsir", "Blitzle", "Zebstrika", "Buizel", "Floatzel", "Zorua", "Zoroark", "Ducklett", "Swanna", "Karrablast", "Escavalier", "Shelmet", "Accelgor", "Deerling", "Sawsbuck", "Foongus", "Amoonguss", "Castform", "Nosepass", "Probopass", "Aron", "Lairon", "Aggron", "Baltoy", "Claydol", "Larvesta", "Volcarona", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Tynamo", "Eelektrik", "Eelektross", "Frillish", "Jellicent", "Alomomola", "Axew", "Fraxure", "Haxorus", "Zangoose", "Seviper", "Elgyem", "Beheeyem", "Litwick", "Lampent", "Chandelure", "Heatmor", "Durant", "Cubchoo", "Beartic", "Cryogonal", "Tornadus", "Thundurus", "Landorus", "Skorupi", "Drapion", "Skarmory", "Numel", "Camerupt", "Spoink", "Grumpig", "Drifloon", "Drifblim", "Shuppet", "Banette", "Wingull", "Pelipper", "Lunatone", "Solrock", "Absol", "Tangela", "Tangrowth", "Mienfoo", "Mienshao", "Gligar", "Gliscor", "Pawniard", "Bisharp", "Cobalion", "Terrakion", "Virizion", "Tympole", "Palpitoad", "Seismitoad", "Stunfisk", "Shuckle", "Mantyke", "Mantine", "Remoraid", "Octillery", "Corsola", "Staryu", "Starmie", "Wailmer", "Wailord", "Lapras", "Spheal", "Sealeo", "Walrein", "Swablu", "Altaria", "Vulpix", "Ninetales", "Bronzor", "Bronzong", "Sneasel", "Weavile", "Delibird", "Vanillite", "Vanillish", "Vanilluxe", "Swinub", "Piloswine", "Mamoswine", "Ditto", "Beldum", "Metang", "Metagross", "Seel", "Dewgong", "Throh", "Sawk", "Bouffalant", "Druddigon", "Golett", "Golurk", "Deino", "Zweilous", "Hydreigon", "Slakoth", "Vigoroth", "Slaking", "Corphish", "Crawdaunt", "Igglybuff", "Jigglypuff", "Wigglytuff", "Lickitung", "Lickilicky", "Yanma", "Yanmega", "Tropius", "Carnivine", "Croagunk", "Toxicroak", "Larvitar", "Pupitar", "Tyranitar", "Reshiram", "Zekrom", "Kyurem", "Keldeo", "Meloetta", "Genesect",
			];
			const species = this.dex.species.get(set.species || set.name);
			const isUnova = unovaDex.includes(species.baseSpecies) && species.gen <= 5;
			if (!isUnova && !this.ruleTable.has('+' + species.id)) {
				return [`${species.baseSpecies} is not in the New Unova Pokédex.`];
			}
		},
	},
	potd: {
		effectType: 'Rule',
		name: 'PotD',
		desc: "Forces the Pokemon of the Day onto every random team.",
		onBegin() {
			if (global.Config?.potd) {
				this.add('rule', "Pokemon of the Day: " + this.dex.species.get(Config.potd).name);
			}
		},
	},
	forcemonotype: {
		effectType: 'ValidatorRule',
		name: 'Force Monotype',
		desc: `Forces all teams to have the same type. Usage: Force Monotype = [Type], e.g. "Force Monotype = Water"`,
		hasValue: true,
		onValidateRule(value) {
			const type = this.dex.types.get(value);
			if (!type.exists) throw new Error(`Misspelled type "${value}"`);
			// Temporary hardcode until types support generations
			if (
				(['Dark', 'Steel'].includes(type.name) && this.dex.gen < 2) ||
				(type.name === 'Fairy' && this.dex.gen < 6)
			) {
				throw new Error(`Invalid type "${type.name}" in Generation ${this.dex.gen}`);
			}
			if (type.name === 'Stellar') {
				throw new Error(`There are no Stellar-type Pok\u00e9mon.`);
			}
			return type.name;
		},
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const type = this.dex.types.get(this.ruleTable.valueRules.get('forcemonotype')!);
			if (!species.types.map(this.toID).includes(type.id)) {
				return [`${set.species} must have ${type.name} type.`];
			}
		},
	},
	forcemonocolor: {
		effectType: 'ValidatorRule',
		name: 'Force Monocolor',
		desc: `Forces all teams to have Pok&eacute;mon of the same color. Usage: Force Monocolor = [Color], e.g. "Force Monocolor = Blue"`,
		hasValue: true,
		onValidateRule(value) {
			const validColors = ["Black", "Blue", "Brown", "Gray", "Green", "Pink", "Purple", "Red", "White", "Yellow"];
			if (!validColors.map(this.dex.toID).includes(this.dex.toID(value))) {
				throw new Error(`Invalid color "${value}"`);
			}
		},
		onValidateSet(set) {
			const color = this.toID(this.ruleTable.valueRules.get('forcemonocolor'));
			let dex = this.dex;
			if (dex.gen < 5) {
				dex = dex.forGen(5);
			}
			const species = dex.species.get(set.species);
			if (this.toID(species.color) !== color) {
				return [`${set.species} must be the color ${color}.`];
			}
		},
	},
	forceteratype: {
		effectType: 'ValidatorRule',
		name: 'Force Tera Type',
		desc: `Forces all Pok&eacute;mon to have the same Tera Type. Usage: Force Tera Type = [Type], e.g. "Force Tera Type = Dragon"`,
		hasValue: true,
		onValidateRule(value) {
			if (this.dex.gen !== 9) {
				throw new Error(`Terastallization doesn't exist outside of Generation 9.`);
			}
			const type = this.dex.types.get(value);
			if (!type.exists) throw new Error(`Misspelled type "${value}"`);
			if (type.isNonstandard) {
				throw new Error(`Invalid type "${type.name}" in Generation ${this.dex.gen}.`);
			}
		},
		onValidateSet(set) {
			const type = this.dex.types.get(this.ruleTable.valueRules.get('forceteratype')!);
			if (this.toID(set.teraType) !== type.id) {
				return [`${set.species} must have its Tera Type set to ${type.name}.`];
			}
		},
	},
	forceselect: {
		effectType: 'ValidatorRule',
		name: 'Force Select',
		desc: `Forces a Pokemon to be on the team and selected at Team Preview. Usage: Force Select = [Pokemon], e.g. "Force Select = Magikarp"`,
		hasValue: true,
		onValidateRule(value) {
			if (!this.dex.species.get(value).exists) throw new Error(`Misspelled Pokemon "${value}"`);
		},
		onValidateTeam(team) {
			let hasSelection = false;
			const species = this.dex.species.get(this.ruleTable.valueRules.get('forceselect'));
			for (const set of team) {
				if (species.name === set.species) {
					hasSelection = true;
					break;
				}
			}
			if (!hasSelection) {
				return [`Your team must contain ${species.name}.`];
			}
		},
		// hardcoded in sim/side
	},
	evlimits: {
		effectType: 'ValidatorRule',
		name: 'EV Limits',
		desc: "Require EVs to be in specific ranges, such as: \"EV Limits = Atk 0-124 / Def 100-252\"",
		hasValue: true,
		onValidateRule(value) {
			if (!value) throw new Error(`To remove EV limits, use "! EV Limits"`);

			const slashedParts = value.split('/');
			const UINT_REGEX = /^[0-9]{1,4}$/;
			return slashedParts.map(slashedPart => {
				const parts = slashedPart.replace('-', ' - ').replace(/ +/g, ' ').trim().split(' ');
				const [stat, low, hyphen, high] = parts;
				if (parts.length !== 4 || !UINT_REGEX.test(low) || hyphen !== '-' || !UINT_REGEX.test(high)) {
					throw new Error(`EV limits should be in the format "EV Limits = Atk 0-124 / Def 100-252"`);
				}
				const statid = this.dex.toID(stat) as StatID;
				if (!this.dex.stats.ids().includes(statid)) {
					throw new Error(`Unrecognized stat name "${stat}" in "${value}"`);
				}
				return `${statid} ${low}-${high}`;
			}).join(' / ');
		},
		onValidateSet(set) {
			const limits = this.ruleTable.valueRules.get('evlimits')!;
			const problems = [];

			for (const limit of limits.split(' / ')) {
				const [statid, range] = limit.split(' ') as [StatID, string];
				const [low, high] = range.split('-').map(num => parseInt(num));
				const ev = set.evs[statid];

				if (ev < low || ev > high) {
					problems.push(`${set.name || set.species}'s ${this.dex.stats.names[statid]} EV (${ev}) must be ${low}-${high}`);
				}
			}
			return problems;
		},
	},
	teampreview: {
		effectType: 'Rule',
		name: 'Team Preview',
		desc: "Allows each player to see the Pok&eacute;mon on their opponent's team before they choose their lead Pok&eacute;mon",
		onBegin() {
			if (this.ruleTable.has(`teratypepreview`)) {
				this.add('rule', 'Tera Type Preview: Tera Types are shown at Team Preview');
			}
		},
		onTeamPreview() {
			this.add('clearpoke');
			for (const pokemon of this.getAllPokemon()) {
				let details = pokemon.details.replace(', shiny', '');
				this.add('poke', pokemon.side.id, details, '');
			}
			this.makeRequest('teampreview');
			if (this.ruleTable.has(`teratypepreview`)) {
				for (const side of this.sides) {
					let buf = ``;
					for (const pokemon of side.pokemon) {
						buf += buf ? ` / ` : `raw|${side.name}'s Tera Types:<br />`;
						buf += `<psicon pokemon="${pokemon.species.id}" /><psicon type="${pokemon.teraType}" />`;
					}
					this.add(`${buf}`);
				}
			}
		},
	},
	teratypepreview: {
		effectType: 'Rule',
		name: 'Tera Type Preview',
		desc: "Allows each player to see the Tera Type of the Pok&eacute;mon on their opponent's team before they choose their lead Pok&eacute;mon",
		onValidateRule() {
			if (!this.ruleTable.has('teampreview')) {
				throw new Error(`The "Tera Type Preview" rule${this.ruleTable.blame('teratypepreview')} requires Team Preview.`);
			}
		},
		// implemented in team preview
	},
	onevsone: {
		effectType: 'Rule',
		name: 'One vs One',
		desc: "Only allows one Pok&eacute;mon in battle",
		ruleset: ['Picked Team Size = 1'],
	},
	twovstwo: {
		effectType: 'Rule',
		name: 'Two vs Two',
		desc: "Only allows two Pok&eacute;mon in battle",
		ruleset: ['Picked Team Size = 2'],
	},
	littlecup: {
		effectType: 'ValidatorRule',
		name: 'Little Cup',
		desc: "Only allows Pok&eacute;mon that can evolve and don't have any prior evolutions",
		ruleset: ['Max Level = 5'],
		onValidateSet(set) {
			const species = this.dex.species.get(set.species || set.name);
			if (species.prevo && this.dex.species.get(species.prevo).gen <= this.gen) {
				return [set.species + " isn't the first in its evolution family."];
			}
			if (!species.nfe) {
				return [set.species + " doesn't have an evolution family."];
			}
		},
	},
	timerstarting: {
		effectType: 'Rule',
		name: 'Timer Starting',
		desc: "Amount of time given at the start of the battle in seconds",
		hasValue: 'positive-integer',
		// hardcoded in server/room-battle.ts
	},
	dctimer: {
		effectType: 'Rule',
		name: 'DC Timer',
		desc: "Enables or disables the disconnection timer",
		// hardcoded in server/room-battle.ts
	},
	dctimerbank: {
		effectType: 'Rule',
		name: 'DC Timer Bank',
		desc: "Enables or disables the disconnection timer bank",
		// hardcoded in server/room-battle.ts
	},
	timergrace: {
		effectType: 'Rule',
		name: 'Timer Grace',
		desc: "Grace period between timer activation and when total time starts ticking down.",
		hasValue: 'positive-integer',
		// hardcoded in server/room-battle.ts
	},
	timeraddperturn: {
		effectType: 'Rule',
		name: 'Timer Add Per Turn',
		desc: "Amount of additional time given per turn in seconds",
		hasValue: 'integer',
		// hardcoded in server/room-battle.ts
	},
	timermaxperturn: {
		effectType: 'Rule',
		name: 'Timer Max Per Turn',
		desc: "Maximum amount of time allowed per turn in seconds",
		hasValue: 'positive-integer',
		// hardcoded in server/room-battle.ts
	},
	timermaxfirstturn: {
		effectType: 'Rule',
		name: 'Timer Max First Turn',
		desc: "Maximum amount of time allowed for the first turn in seconds",
		hasValue: 'positive-integer',
		// hardcoded in server/room-battle.ts
	},
	timeoutautochoose: {
		effectType: 'Rule',
		name: 'Timeout Auto Choose',
		desc: "Enables or disables automatic selection of moves when a player times out",
		// hardcoded in server/room-battle.ts
	},
	timeraccelerate: {
		effectType: 'Rule',
		name: 'Timer Accelerate',
		desc: "Enables or disables timer acceleration",
		// hardcoded in server/room-battle.ts
	},
	blitz: {
		effectType: 'Rule',
		name: 'Blitz',
		// THIS 100% INTENTIONALLY SAYS TEN SECONDS PER TURN
		// IGNORE Max Per Turn. Add Per Turn IS 5, TRANSLATING TO AN INCREMENT OF 10.
		desc: "Super-fast 'Blitz' timer giving 30 second Team Preview and 10 seconds per turn.",
		onBegin() {
			this.add('rule', 'Blitz: Super-fast timer');
		},
		ruleset: [
			'Timer Starting = 15', 'Timer Grace = 30',
			'Timer Add Per Turn = 5', 'Timer Max Per Turn = 15', 'Timer Max First Turn = 40',
		],
	},
	vgctimer: {
		effectType: 'Rule',
		name: 'VGC Timer',
		desc: "VGC's timer: 90 second Team Preview, 7 minutes Your Time, 1 minute per turn",
		ruleset: [
			'Timer Starting = 420', 'Timer Grace = 90',
			'Timer Add Per Turn = 0', 'Timer Max Per Turn = 55', 'Timer Max First Turn = 90',
			'Timeout Auto Choose', 'DC Timer Bank',
		],
	},
	speciesclause: {
		effectType: 'ValidatorRule',
		name: 'Species Clause',
		desc: "Prevents teams from having more than one Pok&eacute;mon from the same species",
		onBegin() {
			this.add('rule', 'Species Clause: Limit one of each Pokémon');
		},
		onValidateTeam(team, format) {
			const speciesTable = new Set<number>();
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				if (speciesTable.has(species.num)) {
					return [`You are limited to one of each Pokémon by Species Clause.`, `(You have more than one ${species.baseSpecies})`];
				}
				speciesTable.add(species.num);
			}
		},
	},
	nicknameclause: {
		effectType: 'ValidatorRule',
		name: 'Nickname Clause',
		desc: "Prevents teams from having more than one Pok&eacute;mon with the same nickname",
		onValidateTeam(team, format) {
			const nameTable = new Set<string>();
			for (const set of team) {
				const name = set.name;
				if (name) {
					if (name === this.dex.species.get(set.species).baseSpecies) continue;
					if (nameTable.has(name)) {
						return [`Your Pokémon must have different nicknames.`, `(You have more than one ${name})`];
					}
					nameTable.add(name);
				}
			}
			// Illegality of impersonation of other species is
			// hardcoded in team-validator.js, so we are done.
		},
	},
	itemclause: {
		effectType: 'ValidatorRule',
		name: 'Item Clause',
		desc: "Prevents teams from having more than one Pok&eacute;mon with the same item",
		hasValue: 'positive-integer',
		onBegin() {
			this.add('rule', `Item Clause: Limit ${this.ruleTable.valueRules.get('itemclause') || 1} of each item`);
		},
		onValidateRule(value) {
			const num = Number(value);
			if (num < 1 || num > this.ruleTable.maxTeamSize) {
				throw new Error(`Item Clause must be between 1 and ${this.ruleTable.maxTeamSize}.`);
			}
			return value;
		},
		onValidateTeam(team) {
			const itemTable = new this.dex.Multiset<string>();
			for (const set of team) {
				const item = this.toID(set.item);
				if (!item) continue;
				itemTable.add(item);
			}
			const itemLimit = Number(this.ruleTable.valueRules.get('itemclause') || 1);
			for (const [itemid, num] of itemTable) {
				if (num <= itemLimit) continue;
				return [
					`You are limited to ${itemLimit} of each item by Item Clause.`,
					`(You have more than ${itemLimit} ${this.dex.items.get(itemid).name})`,
				];
			}
		},
	},
	abilityclause: {
		effectType: 'ValidatorRule',
		name: 'Ability Clause',
		desc: "Prevents teams from having Pok&eacute;mon with the same ability than allowed",
		hasValue: 'positive-integer',
		onBegin() {
			const num = this.ruleTable.valueRules.get('abilityclause');
			this.add('rule', `${num} Ability Clause: Limit ${num} of each ability`);
		},
		onValidateRule(value) {
			const allowedAbilities = parseInt(value);
			if (allowedAbilities < 1) throw new Error(`Must allow at least 1 of each ability`);
		},
		onValidateTeam(team) {
			if (this.format.id === 'gen8multibility') return;
			const abilityTable = new this.dex.Multiset<string>();
			const base: { [k: string]: string } = {
				airlock: 'cloudnine',
				armortail: 'queenlymajesty',
				battlearmor: 'shellarmor',
				clearbody: 'whitesmoke',
				dazzling: 'queenlymajesty',
				emergencyexit: 'wimpout',
				filter: 'solidrock',
				gooey: 'tanglinghair',
				insomnia: 'vitalspirit',
				ironbarbs: 'roughskin',
				keeneye: 'illuminate',
				libero: 'protean',
				minus: 'plus',
				moxie: 'chillingneigh',
				powerofalchemy: 'receiver',
				propellertail: 'stalwart',
				teravolt: 'moldbreaker',
				turboblaze: 'moldbreaker',
			};
			const num = parseInt(this.ruleTable.valueRules.get('abilityclause')!);
			for (const set of team) {
				let ability = this.toID(set.ability);
				if (!ability) continue;
				if (ability in base) ability = base[ability] as ID;
				if (abilityTable.get(ability) >= num) {
					return [
						`You are limited to ${num} of each ability by Ability Clause.`,
						`(You have more than ${num} ${this.dex.abilities.get(ability).name} variant${num === 1 ? '' : 's'})`,
					];
				}
				abilityTable.add(ability);
			}
		},
	},
	ohkoclause: {
		effectType: 'ValidatorRule',
		name: 'OHKO Clause',
		desc: "Bans all OHKO moves, such as Fissure",
		onBegin() {
			this.add('rule', 'OHKO Clause: OHKO moves are banned');
		},
		onValidateSet(set) {
			const problems: string[] = [];
			if (set.moves) {
				for (const moveId of set.moves) {
					const move = this.dex.moves.get(moveId);
					if (move.ohko) problems.push(move.name + ' is banned by OHKO Clause.');
				}
			}
			return problems;
		},
	},
	evasionclause: {
		effectType: 'ValidatorRule',
		name: 'Evasion Clause',
		desc: "Bans abilities, items, and moves that boost Evasion",
		ruleset: ['Evasion Abilities Clause', 'Evasion Items Clause', 'Evasion Moves Clause'],
		onBegin() {
			this.add('rule', 'Evasion Clause: Evasion abilities, items, and moves are banned');
		},
	},
	evasionabilitiesclause: {
		effectType: 'ValidatorRule',
		name: 'Evasion Abilities Clause',
		desc: "Bans abilities that boost Evasion under certain weather conditions",
		banlist: ['Sand Veil', 'Snow Cloak'],
		onBegin() {
			this.add('rule', 'Evasion Abilities Clause: Evasion abilities are banned');
		},
	},
	evasionitemsclause: {
		effectType: 'ValidatorRule',
		name: 'Evasion Items Clause',
		desc: "Bans items that lower the accuracy of moves used against the user",
		banlist: ['Bright Powder', 'Lax Incense'],
		onBegin() {
			this.add('rule', 'Evasion Items Clause: Evasion items are banned');
		},
	},
	evasionmovesclause: {
		effectType: 'ValidatorRule',
		name: 'Evasion Moves Clause',
		desc: "Bans moves that consistently raise the user's evasion when used",
		banlist: ['Minimize', 'Double Team'],
		onBegin() {
			this.add('rule', 'Evasion Moves Clause: Evasion moves are banned');
		},
	},
	accuracymovesclause: {
		effectType: 'ValidatorRule',
		name: 'Accuracy Moves Clause',
		desc: "Bans moves that have a chance to lower the target's accuracy when used",
		banlist: [
			'Flash', 'Kinesis', 'Leaf Tornado', 'Mirror Shot', 'Mud Bomb', 'Mud-Slap', 'Muddy Water', 'Night Daze', 'Octazooka', 'Sand Attack', 'Smokescreen',
		],
		onBegin() {
			this.add('rule', 'Accuracy Moves Clause: Accuracy-lowering moves are banned');
		},
	},
	sleepmovesclause: {
		effectType: 'ValidatorRule',
		name: 'Sleep Moves Clause',
		desc: "Bans all moves that induce sleep, such as Hypnosis",
		banlist: ['Yawn'],
		onBegin() {
			this.add('rule', 'Sleep Moves Clause: Sleep-inducing moves are banned');
		},
		onValidateSet(set) {
			const problems = [];
			if (set.moves) {
				for (const id of set.moves) {
					const move = this.dex.moves.get(id);
					if (move.status === 'slp') problems.push(move.name + ' is banned by Sleep Moves Clause.');
				}
			}
			return problems;
		},
	},
	gravitysleepclause: {
		effectType: 'ValidatorRule',
		name: 'Gravity Sleep Clause',
		desc: "Bans sleep moves below 100% accuracy, in conjunction with Gravity or Gigantamax Orbeetle",
		banlist: [
			'Gravity ++ Dark Void', 'Gravity ++ Grass Whistle', 'Gravity ++ Hypnosis', 'Gravity ++ Lovely Kiss', 'Gravity ++ Sing', 'Gravity ++ Sleep Powder',
		],
		onValidateTeam(team) {
			let hasOrbeetle = false;
			let hasSleepMove = false;
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				if (species.name === "Orbeetle" && set.gigantamax) hasOrbeetle = true;
				if (!hasOrbeetle && species.name === "Orbeetle-Gmax") hasOrbeetle = true;
				for (const moveid of set.moves) {
					const move = this.dex.moves.get(moveid);
					// replicates previous behavior which may compare `true` to 100: true < 100 == true
					// this variable is true if the move never misses (even with lowered acc) or has a chance to miss,
					// but false if the move's accuracy is 100% (yet can be lowered).
					const hasMissChanceOrNeverMisses = move.accuracy === true || move.accuracy < 100;

					if (move.status === 'slp' && hasMissChanceOrNeverMisses) {
						hasSleepMove = true;
					}
				}
			}
			if (hasOrbeetle && hasSleepMove) {
				return [`The combination of Gravity and Gigantamax Orbeetle on the same team is banned.`];
			}
		},
		onBegin() {
			this.add('rule', 'Gravity Sleep Clause: The combination of sleep-inducing moves with imperfect accuracy and Gravity or Gigantamax Orbeetle are banned');
		},
	},
	endlessbattleclause: {
		effectType: 'Rule',
		name: 'Endless Battle Clause',
		desc: "Prevents players from forcing a battle which their opponent cannot end except by forfeit",
		// implemented in sim/battle.js, see https://dex.pokemonshowdown.com/articles/battlerules#endlessbattleclause for the specification.
		onBegin() {
			this.add('rule', 'Endless Battle Clause: Forcing endless battles is banned');
		},
	},
	moodyclause: {
		effectType: 'ValidatorRule',
		name: 'Moody Clause',
		desc: "Bans the ability Moody",
		banlist: ['Moody'],
		onBegin() {
			this.add('rule', 'Moody Clause: Moody is banned');
		},
	},
	swaggerclause: {
		effectType: 'ValidatorRule',
		name: 'Swagger Clause',
		desc: "Bans the move Swagger",
		banlist: ['Swagger'],
		onBegin() {
			this.add('rule', 'Swagger Clause: Swagger is banned');
		},
	},
	drypassclause: {
		effectType: 'ValidatorRule',
		name: 'DryPass Clause',
		desc: "Stops teams from bringing Pok&eacute;mon with Baton Pass + any form of trapping, residual recovery, boosting, or Substitute.",
		ruleset: ['Baton Pass Stat Clause', 'Baton Pass Stat Trap Clause'],
		banlist: ['Baton Pass + Substitute', 'Baton Pass + Ingrain', 'Baton Pass + Aqua Ring', 'Baton Pass + Block', 'Baton Pass + Mean Look', 'Baton Pass + Spider Web', 'Baton Pass + Jaw Lock'],
	},
	batonpassclause: {
		effectType: 'ValidatorRule',
		name: 'Baton Pass Clause',
		desc: "Stops teams from having more than one Pok&eacute;mon with Baton Pass, and no Pok&eacute;mon may be capable of passing boosts to both Speed and another stat",
		banlist: ["Baton Pass > 1"],
		onBegin() {
			this.add('rule', 'Baton Pass Clause: Limit one Baton Passer, can\'t pass Spe and other stats simultaneously');
		},
		onValidateSet(set, format, setHas) {
			if (!('move:batonpass' in setHas)) return;

			const item = this.dex.items.get(set.item);
			const ability = this.toID(set.ability);
			let speedBoosted: boolean | string = false;
			let nonSpeedBoosted: boolean | string = false;

			for (const moveId of set.moves) {
				const move = this.dex.moves.get(moveId);
				if (move.id === 'flamecharge' || (move.boosts?.spe && move.boosts.spe > 0)) {
					speedBoosted = true;
				}
				const nonSpeedBoostedMoves = [
					'acupressure', 'bellydrum', 'chargebeam', 'curse', 'diamondstorm', 'fellstinger', 'fierydance',
					'flowershield', 'poweruppunch', 'rage', 'rototiller', 'skullbash', 'stockpile',
				];
				if (nonSpeedBoostedMoves.includes(move.id) ||
					move.boosts && ((move.boosts.atk && move.boosts.atk > 0) || (move.boosts.def && move.boosts.def > 0) ||
						(move.boosts.spa && move.boosts.spa > 0) || (move.boosts.spd && move.boosts.spd > 0))) {
					nonSpeedBoosted = true;
				}
				if (item.zMove && move.type === item.zMoveType && move.zMove?.boost) {
					const boosts = move.zMove.boost;
					if (boosts.spe && boosts.spe > 0) {
						if (!speedBoosted) speedBoosted = move.name;
					}
					if (
						(boosts.atk && boosts.atk > 0) || (boosts.def && boosts.def > 0) ||
						(boosts.spa && boosts.spa > 0) || (boosts.spd && boosts.spd > 0)
					) {
						if (!nonSpeedBoosted || move.name === speedBoosted) nonSpeedBoosted = move.name;
					}
				}
			}

			const speedBoostedAbilities = ['motordrive', 'rattled', 'speedboost', 'steadfast', 'weakarmor'];
			const speedBoostedItems = ['blazikenite', 'eeviumz', 'kommoniumz', 'salacberry'];
			if (speedBoostedAbilities.includes(ability) || speedBoostedItems.includes(item.id)) {
				speedBoosted = true;
			}
			if (!speedBoosted) return;

			const nonSpeedBoostedAbilities = [
				'angerpoint', 'competitive', 'defiant', 'download', 'justified', 'lightningrod', 'moxie', 'sapsipper', 'stormdrain',
			];
			const nonSpeedBoostedItems = [
				'absorbbulb', 'apicotberry', 'cellbattery', 'eeviumz', 'ganlonberry', 'keeberry', 'kommoniumz', 'liechiberry',
				'luminousmoss', 'marangaberry', 'petayaberry', 'snowball', 'starfberry', 'weaknesspolicy',
			];
			if (nonSpeedBoostedAbilities.includes(ability) || nonSpeedBoostedItems.includes(item.id)) {
				nonSpeedBoosted = true;
			}
			if (!nonSpeedBoosted) return;

			// if both boost sources are Z-moves, and they're distinct
			if (speedBoosted !== nonSpeedBoosted && typeof speedBoosted === 'string' && typeof nonSpeedBoosted === 'string') return;

			return [
				`${set.name || set.species} can Baton Pass both Speed and a different stat, which is banned by Baton Pass Clause.`,
			];
		},
	},
	onebatonpassclause: {
		effectType: 'ValidatorRule',
		name: 'One Baton Pass Clause',
		desc: "Stops teams from having more than one Pok&eacute;mon with Baton Pass",
		banlist: ["Baton Pass > 1"],
		onBegin() {
			this.add('rule', 'One Baton Pass Clause: Limit one Baton Passer');
		},
	},
	oneboostpasserclause: {
		effectType: 'ValidatorRule',
		name: 'One Boost Passer Clause',
		desc: "Stops teams from having a Pok&eacute;mon with Baton Pass that has multiple ways to boost its stats, and no more than one Baton Passer may be able to boost its stats",
		onBegin() {
			this.add('rule', 'One Boost Passer Clause: Limit one Baton Passer that has a way to boost its stats');
		},
		onValidateTeam(team) {
			const boostingEffects = [
				'acidarmor', 'agility', 'amnesia', 'apicotberry', 'barrier', 'bellydrum', 'bulkup', 'calmmind', 'cosmicpower', 'curse',
				'defensecurl', 'dragondance', 'ganlonberry', 'growth', 'harden', 'howl', 'irondefense', 'liechiberry', 'meditate',
				'petayaberry', 'salacberry', 'sharpen', 'speedboost', 'starfberry', 'swordsdance', 'tailglow', 'withdraw',
			];
			let passers = 0;
			for (const set of team) {
				if (!set.moves.includes('Baton Pass')) continue;
				let passableBoosts = 0;
				const item = this.toID(set.item);
				const ability = this.toID(set.ability);
				for (const move of set.moves) {
					if (boostingEffects.includes(this.toID(move))) passableBoosts++;
				}
				if (boostingEffects.includes(item)) passableBoosts++;
				if (boostingEffects.includes(ability)) passableBoosts++;
				if (passableBoosts === 1) passers++;
				if (passableBoosts > 1) {
					return [
						`${set.name || set.species} has Baton Pass and multiple ways to boost its stats, which is banned by One Boost Passer Clause.`,
					];
				}
				if (passers > 1) {
					return [
						`Multiple Pokemon have Baton Pass and a way to boost their stats, which is banned by One Boost Passer Clause.`,
					];
				}
			}
		},
	},
	batonpassstatclause: {
		effectType: 'ValidatorRule',
		name: 'Baton Pass Stat Clause',
		desc: "Stops teams from having a Pok&eacute;mon with Baton Pass that has any way to boost its stats",
		onBegin() {
			this.add('rule', 'Baton Pass Stat Clause: No Baton Passer may have a way to boost its stats');
		},
		onValidateTeam(team) {
			const boostingEffects = [
				'absorbbulb', 'acidarmor', 'acupressure', 'agility', 'amnesia', 'ancientpower', 'angerpoint', 'apicotberry', 'autotomize',
				'barrier', 'bellydrum', 'bulkup', 'calmmind', 'cellbattery', 'charge', 'chargebeam', 'coil', 'cosmicpower', 'cottonguard', 'curse',
				'defensecurl', 'defendorder', 'defiant', 'download', 'dragondance', 'fierydance', 'flamecharge', 'focusenergy', 'ganlonberry', 'growth',
				'harden', 'honeclaws', 'howl', 'irondefense', 'justified', 'lansatberry', 'liechiberry', 'lightningrod', 'meditate', 'metalclaw',
				'meteormash', 'motordrive', 'moxie', 'nastyplot', 'ominouswind', 'petayaberry', 'quiverdance', 'rage', 'rattled',
				'rockpolish', 'salacberry', 'sapsipper', 'sharpen', 'shellsmash', 'shiftgear', 'silverwind', 'skullbash', 'speedboost',
				'starfberry', 'steadfast', 'steelwing', 'stockpile', 'stormdrain', 'swordsdance', 'tailglow', 'weakarmor', 'withdraw',
				'workup',
			];
			for (const set of team) {
				const moves = set.moves.map(this.toID);
				if (!moves.includes('batonpass' as ID)) continue;
				let passableBoosts = false;
				const item = this.toID(set.item);
				const ability = this.toID(set.ability);
				if (
					moves.some(m => boostingEffects.includes(m)) || boostingEffects.includes(item) ||
					boostingEffects.includes(ability)
				) {
					passableBoosts = true;
				}
				if (passableBoosts) {
					return [
						`${set.name || set.species} has Baton Pass and a way to boost its stats, which is banned by Baton Pass Stat Clause.`,
					];
				}
			}
		},
	},
	batonpasstrapclause: {
		effectType: 'ValidatorRule',
		name: 'Baton Pass Trap Clause',
		desc: "Stops teams from having a Pok&eacute;mon with Baton Pass that has any way to trap Pok&eacute;mon.",
		onBegin() {
			this.add('rule', 'Baton Pass Trap Clause: No Baton Passer may have a way to trap Pok\u00e9mon');
		},
		onValidateTeam(team, format, teamHas) {
			const trappingMoves = ['block', 'fairylock', 'meanlook', 'octolock', 'spiderweb'];
			let name = '';
			const bpAndTrap = team.some(set => {
				name = set.name || set.species;
				return set.moves.includes('batonpass') && set.moves.some(move => trappingMoves.includes(move));
			});
			if (bpAndTrap) {
				return [
					`${name} has Baton Pass and a way to pass trapping, which is banned by Baton Pass Trap Clause.`,
				];
			}
		},
	},
	batonpassstattrapclause: {
		effectType: 'ValidatorRule',
		name: 'Baton Pass Stat Trap Clause',
		desc: "Stops teams from having a Pok&eacute;mon with Baton Pass that has any way to boost its stats or trap Pok&eacute;mon.",
		onBegin() {
			this.add('rule', 'Baton Pass Stat Trap Clause: No Baton Passer may have a way to boost stats or trap Pok\u00e9mon');
		},
		onValidateTeam(team) {
			const statBoostOrTrapping = [
				'Acid Armor', 'Acupressure', 'Agility', 'Amnesia', 'Ancient Power', 'Assist', 'Barrier', 'Belly Drum', 'Block', 'Bulk Up', 'Calm Mind', 'Charge',
				'Charge Beam', 'Cosmic Power', 'Curse', 'Defend Order', 'Defense Curl', 'Dragon Dance', 'Growth', 'Guard Swap', 'Harden', 'Heart Swap', 'Howl',
				'Iron Defense', 'Ingrain', 'Mean Look', 'Meteor Mash', 'Meditate', 'Metal Claw', 'Nasty Plot', 'Ominous Wind', 'Power Trick', 'Psych Up', 'Rage',
				'Rock Polish', 'Sharpen', 'Silver Wind', 'Skull Bash', 'Spider Web', 'Steel Wing', 'Stockpile', 'Swords Dance', 'Tail Glow', 'Withdraw', 'Speed Boost',
				'Apicot Berry', 'Ganlon Berry', 'Liechi Berry', 'Petaya Berry', 'Salac Berry', 'Starf Berry', 'Kee Berry', 'Maranga Berry', 'Weakness Policy',
				'Blunder Policy', 'Luminiscent Moss', 'Snowball', 'Throat Spray', 'Mirror Herb', 'Adrenaline Orb',
			].map(this.toID);
			for (const set of team) {
				if (!set.moves.map(this.toID).includes('batonpass' as ID)) continue;
				let passableBoosts = false;
				const item = this.toID(set.item);
				const ability = this.toID(set.ability);
				for (const move of set.moves) {
					if (statBoostOrTrapping.includes(this.toID(move))) passableBoosts = true;
				}
				if (statBoostOrTrapping.includes(item)) passableBoosts = true;
				if (statBoostOrTrapping.includes(ability)) passableBoosts = true;
				if (passableBoosts) {
					return [
						`${set.name || set.species} has Baton Pass and a way to boost its stats or pass trapping, which is banned by Baton Pass Stat Trap Clause.`,
					];
				}
			}
		},
	},
	cfzclause: {
		effectType: 'ValidatorRule',
		name: 'CFZ Clause',
		desc: "Bans the use of crystal-free Z-Moves",
		banlist: [
			'10,000,000 Volt Thunderbolt', 'Acid Downpour', 'All-Out Pummeling', 'Black Hole Eclipse', 'Bloom Doom',
			'Breakneck Blitz', 'Catastropika', 'Clangorous Soulblaze', 'Continental Crush', 'Corkscrew Crash',
			'Devastating Drake', 'Extreme Evoboost', 'Genesis Supernova', 'Gigavolt Havoc', 'Guardian of Alola',
			'Hydro Vortex', 'Inferno Overdrive', 'Let\'s Snuggle Forever', 'Light That Burns the Sky',
			'Malicious Moonsault', 'Menacing Moonraze Maelstrom', 'Never-Ending Nightmare', 'Oceanic Operetta',
			'Pulverizing Pancake', 'Savage Spin-Out', 'Searing Sunraze Smash', 'Shattered Psyche', 'Sinister Arrow Raid',
			'Soul-Stealing 7-Star Strike', 'Splintered Stormshards', 'Stoked Sparksurfer', 'Subzero Slammer',
			'Supersonic Skystrike', 'Tectonic Rage', 'Twinkle Tackle',
		],
		onBegin() {
			this.add('rule', 'CFZ Clause: Crystal-free Z-Moves are banned');
		},
	},
	zmoveclause: {
		effectType: 'ValidatorRule',
		name: 'Z-Move Clause',
		desc: "Bans Pok&eacute;mon from holding Z-Crystals",
		onValidateSet(set) {
			const item = this.dex.items.get(set.item);
			if (item.zMove) return [`${set.name || set.species}'s item ${item.name} is banned by Z-Move Clause.`];
		},
		onBegin() {
			this.add('rule', 'Z-Move Clause: Z-Moves are banned');
		},
	},
	notfullyevolved: {
		effectType: 'ValidatorRule',
		name: 'Not Fully Evolved',
		desc: "Bans Pok&eacute;mon that are fully evolved or can't evolve",
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			if (!species.nfe) {
				return [set.species + " cannot evolve."];
			}
		},
	},
	hppercentagemod: {
		effectType: 'Rule',
		name: 'HP Percentage Mod',
		desc: "Shows the HP of Pok&eacute;mon in percentages",
		onBegin() {
			this.add('rule', 'HP Percentage Mod: HP is shown in percentages');
			this.reportPercentages = true;
		},
	},
	exacthpmod: {
		effectType: 'Rule',
		name: 'Exact HP Mod',
		desc: "Shows the exact HP of all Pok&eacute;mon",
		onBegin() {
			this.add('rule', 'Exact HP Mod: Exact HP is shown');
			this.reportExactHP = true;
		},
	},
	cancelmod: {
		effectType: 'Rule',
		name: 'Cancel Mod',
		desc: "Allows players to change their own choices before their opponents make one",
		onBegin() {
			this.supportCancel = true;
		},
	},
	sleepclausemod: {
		effectType: 'Rule',
		name: 'Sleep Clause Mod',
		desc: "Prevents players from putting more than one of their opponent's Pok&eacute;mon to sleep at a time, and bans Mega Gengar from using Hypnosis",
		banlist: ['Hypnosis + Gengarite'],
		onBegin() {
			this.add('rule', 'Sleep Clause Mod: Limit one foe put to sleep');
		},
		onSetStatus(status, target, source) {
			if (source?.isAlly(target)) {
				return;
			}
			if (status.id === 'slp') {
				for (const pokemon of target.side.pokemon) {
					if (pokemon.hp && pokemon.status === 'slp') {
						if (!pokemon.statusState.source?.isAlly(pokemon)) {
							this.add('-message', 'Sleep Clause Mod activated.');
							this.hint("Sleep Clause Mod prevents players from putting more than one of their opponent's Pokémon to sleep at a time");
							return false;
						}
					}
				}
			}
		},
	},
	stadiumsleepclause: {
		effectType: 'Rule',
		name: 'Stadium Sleep Clause',
		desc: "Prevents players from putting one of their opponent's Pok\u00E9mon to sleep if any of the opponent's other Pok\u00E9mon are asleep (different from Sleep Clause Mod because putting your own Pok\u00E9mon to sleep is enough to prevent opponents from putting your others to sleep).",
		onBegin() {
			this.add('rule', 'Stadium Sleep Clause: Limit one foe put to sleep');
		},
		onSetStatus(status, target, source) {
			if (source?.isAlly(target)) {
				return;
			}
			if (status.id === 'slp') {
				for (const pokemon of target.side.pokemon) {
					if (pokemon.hp && pokemon.status === 'slp') {
						this.add('-message', "Sleep Clause activated. (In official formats, Sleep Clause activates if any of the opponent's Pokemon are asleep, even if self-inflicted from Rest)");
						return false;
					}
				}
			}
		},
	},
	switchpriorityclausemod: {
		effectType: 'Rule',
		name: 'Switch Priority Clause Mod',
		desc: "Makes a faster Pokémon switch first when double-switching, unlike in Emerald link battles, where player 1's Pokémon would switch first",
		onBegin() {
			this.add('rule', 'Switch Priority Clause Mod: Faster Pokémon switch first');
		},
	},
	desyncclausemod: {
		effectType: 'Rule',
		name: 'Desync Clause Mod',
		desc: 'If a desync would happen, the move fails instead. This rule currently covers Bide, Counter, and Psywave.',
		onBegin() {
			this.add('rule', 'Desync Clause Mod: Desyncs changed to move failure.');
		},
		// Hardcoded in gen1/moves.ts
		// Can't be disabled (no precedent for how else to handle desyncs)
	},
	deoxyscamouflageclause: {
		effectType: 'Rule',
		name: 'Deoxys Camouflage Clause',
		desc: "Reveals the Deoxys forme when it is sent in battle.",
		// Hardcoded into effect, cannot be disabled.
		onBegin() {
			this.add('rule', 'Deoxys Camouflage Clause: Reveals the Deoxys forme when it is sent in battle.');
		},
	},
	freezeclausemod: {
		effectType: 'Rule',
		name: 'Freeze Clause Mod',
		desc: "Prevents players from freezing more than one of their opponent's Pok&eacute;mon at a time",
		onBegin() {
			this.add('rule', 'Freeze Clause Mod: Limit one foe frozen');
		},
		onSetStatus(status, target, source) {
			if (source?.isAlly(target)) {
				return;
			}
			if (status.id === 'frz') {
				for (const pokemon of target.side.pokemon) {
					if (pokemon.status === 'frz') {
						this.add('-message', 'Freeze Clause activated.');
						return false;
					}
				}
			}
		},
	},
	sametypeclause: {
		effectType: 'ValidatorRule',
		name: 'Same Type Clause',
		desc: "Forces all Pok&eacute;mon on a team to share a type with each other",
		onBegin() {
			this.add('rule', 'Same Type Clause: Pokémon in a team must share a type');
		},
		onValidateTeam(team) {
			let typeTable: string[] = [];
			for (const [i, set] of team.entries()) {
				let species = this.dex.species.get(set.species);
				if (!species.types) return [`Invalid pokemon ${set.name || set.species}`];
				if (i === 0) {
					typeTable = species.types;
				} else {
					typeTable = typeTable.filter(type => species.types.includes(type));
				}
				if (!typeTable.length) return [`Your team must share a type.`];
			}
			for (const set of team) {
				if (this.gen === 9 && set.teraType &&
					!typeTable.includes(set.teraType) && this.ruleTable.has(`enforcesameteratype`)) {
					return [`${set.species}'s Tera Type must match the team's type.`];
				}
			}
		},
	},
	enforcesameteratype: {
		effectType: 'ValidatorRule',
		name: 'Enforce Same Tera Type',
		desc: "Forces Pok&eacute;mon to have a Tera Type matching one of their original types.",
		// implemented in sametypeclause
	},
	dynamaxclause: {
		effectType: 'Rule',
		name: 'Dynamax Clause',
		desc: "Prevents Pok&eacute;mon from Dynamaxing",
		onValidateSet(set) {
			if (set.gigantamax) {
				return [
					`Your set for ${set.species} is flagged as Gigantamax, but Gigantamaxing is disallowed`,
					`(If this was a mistake, disable Gigantamaxing on the set.)`,
				];
			}
		},
		onBegin() {
			for (const side of this.sides) {
				side.dynamaxUsed = true;
			}
			this.add('rule', 'Dynamax Clause: You cannot dynamax');
		},
	},
	terastalclause: {
		effectType: 'Rule',
		name: 'Terastal Clause',
		desc: "Prevents Pok&eacute;mon from Terastallizing",
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				pokemon.canTerastallize = null;
			}
			this.add('rule', 'Terastal Clause: You cannot Terastallize');
		},
	},
	arceusevlimit: {
		effectType: 'ValidatorRule',
		name: 'Arceus EV Limit',
		desc: "Restricts Arceus to a maximum of 100 EVs in any one stat, and only multiples of 10",
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			if (species.num === 493 && set.evs) {
				let stat: StatID;
				for (stat in set.evs) {
					const ev = set.evs[stat];
					if (ev > 100) {
						return [
							"Arceus can't have more than 100 EVs in any stat, because Arceus is only obtainable from level 100 events.",
							"Level 100 Pokemon can only gain EVs from vitamins (Carbos etc), which are capped at 100 EVs.",
						];
					}
					if (!(
						ev % 10 === 0 ||
						(ev % 10 === 8 && ev % 4 === 0)
					)) {
						return [
							"Arceus can only have EVs that are multiples of 10, because Arceus is only obtainable from level 100 events.",
							"Level 100 Pokemon can only gain EVs from vitamins (Carbos etc), which boost in multiples of 10.",
						];
					}
				}
			}
		},
	},
	inversemod: {
		effectType: 'Rule',
		name: 'Inverse Mod',
		desc: "The mod for Inverse Battle which inverts the type effectiveness chart; weaknesses become resistances, while resistances and immunities become weaknesses",
		onNegateImmunity: false,
		onBegin() {
			this.add('rule', 'Inverse Mod: Weaknesses become resistances, while resistances and immunities become weaknesses.');
		},
		onEffectivenessPriority: 1,
		onEffectiveness(typeMod, target, type, move) {
			// The effectiveness of Freeze Dry on Water isn't reverted
			if (move && move.id === 'freezedry' && type === 'Water') return;
			if (move && !this.dex.getImmunity(move, type)) return 1;
			// Ignore normal effectiveness, prevents bug with Tera Shell
			if (typeMod) return -typeMod;
		},
	},

	minsourcegen: {
		effectType: 'ValidatorRule',
		name: "Min Source Gen",
		desc: "Pokemon must be obtained from this generation or later.",
		hasValue: 'positive-integer',
		onValidateRule(value) {
			const minSourceGen = parseInt(value);
			if (minSourceGen > this.dex.gen) {
				// console.log(this.ruleTable);
				throw new Error(`Invalid generation ${minSourceGen}${this.ruleTable.blame('minsourcegen')} for a Gen ${this.dex.gen} format (${this.format.name})`);
			}
		},
	},

	omunobtainablemoves: {
		effectType: 'ValidatorRule',
		name: 'OM Unobtainable Moves',
		desc: "Allows special move legality rules to allow moves which are otherwise unobtainable without hacking or glitches",
		// Hardcoded in team-validator.ts
		onValidateRule() {
			if (!this.ruleTable.checkCanLearn?.[0]) {
				throw new Error(`A format with the "OM Unobtainable Moves"${this.ruleTable.blame('omunobtainablemoves')} rule must also have a special move legality rule.`);
			}
		},
	},
	stabmonsmovelegality: {
		effectType: 'ValidatorRule',
		name: 'STABmons Move Legality',
		desc: "Allows Pok&eacute;mon to use any move that they or a previous evolution/out-of-battle forme share a type with",
		ruleset: ['OM Unobtainable Moves'],
		checkCanLearn(move, species, setSources, set) {
			const nonstandard = move.isNonstandard === 'Past' && !this.ruleTable.has('natdexmod');
			if (!nonstandard && !move.isZ && !move.isMax && !this.ruleTable.isRestricted(`move:${move.id}`)) {
				const speciesTypes: string[] = [];
				const moveTypes: string[] = [];
				// BDSP can't import Pokemon from Home, so it shouldn't grant moves from archaic species types
				const minObtainableSpeciesGen = this.dex.currentMod === 'gen8bdsp' ||
					(this.dex.gen === 9 && !this.ruleTable.has('natdexmod')) ?
					this.dex.gen : species.gen;
				for (let i = this.dex.gen; i >= minObtainableSpeciesGen && i >= move.gen; i--) {
					const dex = this.dex.forGen(i);
					moveTypes.push(dex.moves.get(move.name).type);

					const pokemon = dex.species.get(species.name);
					if (pokemon.forme || pokemon.otherFormes) {
						const baseSpecies = dex.species.get(pokemon.baseSpecies);
						const originalForme = dex.species.get(pokemon.changesFrom || pokemon.name);
						speciesTypes.push(...originalForme.types);
						if (baseSpecies.otherFormes) {
							for (const formeName of baseSpecies.otherFormes) {
								if (baseSpecies.prevo) {
									const prevo = dex.species.get(baseSpecies.prevo);
									if (prevo.evos.includes(formeName)) continue;
								}
								const forme = dex.species.get(formeName);
								if (forme.changesFrom === originalForme.name && !forme.battleOnly) {
									speciesTypes.push(...forme.types);
								}
							}
						}
					} else {
						speciesTypes.push(...pokemon.types);
					}

					let prevo = pokemon.prevo;
					while (prevo) {
						const prevoSpecies = dex.species.get(prevo);
						speciesTypes.push(...prevoSpecies.types);
						prevo = prevoSpecies.prevo;
					}
				}
				if (moveTypes.some(m => speciesTypes.includes(m))) return null;
			}
			return this.checkCanLearn(move, species, setSources, set);
		},
	},
	alphabetcupmovelegality: {
		effectType: 'ValidatorRule',
		name: 'Alphabet Cup Move Legality',
		desc: "Allows Pok&eacute;mon to use any move that shares the same first letter as their name or a previous evolution's name.",
		ruleset: ['OM Unobtainable Moves'],
		checkCanLearn(move, species, setSources, set) {
			const nonstandard = move.isNonstandard === 'Past' && !this.ruleTable.has('natdexmod');
			if (!nonstandard && !move.isZ && !move.isMax && !this.ruleTable.isRestricted(`move:${move.id}`)) {
				const letters = [species.id.charAt(0)];
				let prevo = species.prevo;
				if (species.changesFrom === 'Silvally') prevo = 'Type: Null';
				while (prevo) {
					const prevoSpecies = this.dex.species.get(prevo);
					letters.push(prevoSpecies.id.charAt(0));
					prevo = prevoSpecies.prevo;
				}
				if (letters.includes(move.id.charAt(0))) return null;
			}
			return this.checkCanLearn(move, species, setSources, set);
		},
	},
	sketchmonsmovelegality: {
		effectType: 'ValidatorRule',
		name: 'Sketchmons Move Legality',
		desc: "Pok&eacute;mon can learn one of any move they don't normally learn.",
		ruleset: ['OM Unobtainable Moves'],
		checkCanLearn(move, species, lsetData, set) {
			const problem = this.checkCanLearn(move, species, lsetData, set);
			if (!problem) return null;
			if (move.isZ || move.isMax || this.ruleTable.isRestricted(`move:${move.id}`)) return problem;
			const sketchMove = (set as any).sketchMove;
			if (sketchMove && sketchMove !== move.name) {
				return ` already has ${sketchMove} as a sketched move.\n(${species.name} doesn't learn ${move.name}.)`;
			}
			(set as any).sketchMove = move.name;
			return null;
		},
		onValidateTeam(team) {
			const sketches = new this.dex.Multiset<string>();
			for (const set of team) {
				if ((set as any).sketchMove) {
					sketches.add((set as any).sketchMove);
				}
			}
			const overSketched = [...sketches.entries()].filter(([moveName, count]) => count > 1);
			if (overSketched.length) {
				return overSketched.map(([moveName, count]) => (
					`You are limited to 1 of ${moveName} by Sketch Clause.\n(You have sketched ${moveName} ${count} times.)`
				));
			}
		},
	},
	allowtradeback: {
		effectType: 'ValidatorRule',
		name: 'Allow Tradeback',
		desc: "Allows Gen 1 pokemon to have moves from their Gen 2 learnsets",
		// Implemented in team-validator.js
	},
	allowavs: {
		effectType: 'ValidatorRule',
		name: 'Allow AVs',
		desc: "Tells formats with the 'gen7letsgo' mod to take Awakening Values into consideration when calculating stats",
		// implemented in TeamValidator#validateStats
	},
	nfeclause: {
		effectType: 'ValidatorRule',
		name: 'NFE Clause',
		desc: "Bans all NFE Pokemon",
		onValidateSet(set) {
			const species = this.dex.species.get(set.species || set.name);
			if (species.nfe) {
				if (this.ruleTable.has(`+pokemon:${species.id}`)) return;
				return [`${set.species} is banned due to NFE Clause.`];
			}
		},
	},
	gemsclause: {
		effectType: 'ValidatorRule',
		name: 'Gems Clause',
		desc: "Bans all Gems",
		onValidateSet(set) {
			if (!set.item) return;
			const item = this.dex.items.get(set.item);
			if (item.isGem) {
				if (this.ruleTable.has(`+item:${item.id}`)) return;
				return [`${item.name} is banned due to Gems Clause.`];
			}
		},
	},
	'sketchpostgen7moves': {
		effectType: 'ValidatorRule',
		name: 'Sketch Post-Gen 7 Moves',
		desc: "Allows Pokémon who learn Sketch to learn any Gen 8+ move (normally, Sketch is not usable in Gen 8 or Gen 9 Pre-DLC2).",
		// Implemented in sim/team-validator.ts
	},
	mimicglitch: {
		effectType: 'ValidatorRule',
		name: 'Mimic Glitch',
		desc: "Allows any Pokemon with access to Assist, Copycat, Metronome, Mimic, or Transform to gain access to almost any other move.",
		// Implemented in sim/team-validator.ts
	},
	overflowstatmod: {
		effectType: 'Rule',
		name: 'Overflow Stat Mod',
		desc: "Caps stats at 654 after a positive nature, or 655 after a negative nature",
		// Implemented in sim/battle.ts
	},
	formeclause: {
		effectType: 'ValidatorRule',
		name: 'Forme Clause',
		desc: "Prevents teams from having more than one Pok&eacute;mon of the same forme",
		onBegin() {
			this.add('rule', 'Forme Clause: Limit one of each forme of a Pokémon');
		},
		onValidateTeam(team) {
			const formeTable = new Set<string>();
			for (const set of team) {
				let species = this.dex.species.get(set.species);
				if (species.name !== species.baseSpecies) {
					const baseSpecies = this.dex.species.get(species.baseSpecies);
					if (
						species.types.join('/') === baseSpecies.types.join('/') &&
						Object.values(species.baseStats).join('/') === Object.values(baseSpecies.baseStats).join('/')
					) {
						species = baseSpecies;
					}
				}
				if (formeTable.has(species.name)) {
					return [
						`You are limited to one of each forme of a Pokémon by Forme Clause.`,
						`(You have more than one of ${species.name})`,
					];
				}
				formeTable.add(species.name);
			}
		},
	},
	'350cupmod': {
		effectType: 'Rule',
		name: '350 Cup Mod',
		desc: "If a Pok&eacute;mon's BST is 350 or lower, all of its stats get doubled.",
		onBegin() {
			this.add('rule', '350 Cup Mod: If a Pokemon\'s BST is 350 or lower, all of its stats get doubled.');
		},
		onModifySpeciesPriority: 2,
		onModifySpecies(species) {
			const newSpecies = this.dex.deepClone(species);
			if (newSpecies.bst <= 350) {
				newSpecies.bst = 0;
				for (const stat in newSpecies.baseStats) {
					newSpecies.baseStats[stat] = this.clampIntRange(newSpecies.baseStats[stat] * 2, 1, 255);
					newSpecies.bst += newSpecies.baseStats[stat];
				}
			}
			return newSpecies;
		},
	},
	flippedmod: {
		effectType: 'Rule',
		name: 'Flipped Mod',
		desc: "Every Pok&eacute;mon's stats are reversed. HP becomes Spe, Atk becomes Sp. Def, Def becomes Sp. Atk, and vice versa.",
		onBegin() {
			this.add('rule', 'Flipped Mod: Pokemon have their stats flipped (HP becomes Spe, vice versa).');
		},
		onModifySpeciesPriority: 2,
		onModifySpecies(species) {
			const newSpecies = this.dex.deepClone(species);
			const reversedNums = Object.values(newSpecies.baseStats).reverse();
			for (const [i, statName] of Object.keys(newSpecies.baseStats).entries()) {
				newSpecies.baseStats[statName] = reversedNums[i];
			}
			return newSpecies;
		},
	},
	scalemonsmod: {
		effectType: 'Rule',
		name: 'Scalemons Mod',
		desc: "Every Pok&eacute;mon's stats, barring HP, are scaled to give them a BST as close to 600 as possible",
		onBegin() {
			this.add('rule', 'Scalemons Mod: Every Pokemon\'s stats, barring HP, are scaled to come as close to a BST of 600 as possible');
		},
		onModifySpeciesPriority: 1,
		onModifySpecies(species) {
			const newSpecies = this.dex.deepClone(species);
			const bstWithoutHp: number = newSpecies.bst - newSpecies.baseStats['hp'];
			const scale = 600 - newSpecies.baseStats['hp'];
			newSpecies.bst = newSpecies.baseStats['hp'];
			for (const stat in newSpecies.baseStats) {
				if (stat === 'hp') continue;
				newSpecies.baseStats[stat] = this.clampIntRange(newSpecies.baseStats[stat] * scale / bstWithoutHp, 1, 255);
				newSpecies.bst += newSpecies.baseStats[stat];
			}
			return newSpecies;
		},
	},
	teamtypepreview: {
		effectType: 'Rule',
		name: 'Team Type Preview',
		desc: "Allows each player to see the Pok&eacute;mon on their opponent's team and those Pok&eacute;mon's types before they choose their lead Pok&eacute;mon",
		onTeamPreview() {
			this.add('clearpoke');
			for (const side of this.sides) {
				for (const pokemon of side.pokemon) {
					const details = pokemon.details.replace(', shiny', '')
						.replace(/(Arceus)(-[a-zA-Z?-]+)?/g, '$1-*');
					this.add('poke', pokemon.side.id, details, '');
				}
				let buf = 'raw|';
				for (const pokemon of side.pokemon) {
					if (!buf.endsWith('|')) buf += '/</span>&#8203;';
					buf += `<span style="white-space:nowrap"><psicon pokemon="${pokemon.species.id}" />`;
					for (const type of pokemon.species.types) {
						buf += `<psicon type="${type}" /> `;
					}
				}
				this.add(`${buf}</span>`);
			}
			this.makeRequest('teampreview');
		},
	},
	openteamsheets: {
		effectType: 'Rule',
		name: 'Open Team Sheets',
		desc: "Allows each player to see the Pok&eacute;mon and all non-stat information about them, before they choose their lead Pok&eacute;mon",
		mutuallyExclusiveWith: 'forceopenteamsheets',
		onValidateRule() {
			if (!(this.ruleTable.has('teampreview') || this.ruleTable.has('teamtypepreview'))) {
				throw new Error(`The "Open Team Sheets" rule${this.ruleTable.blame('openteamsheets')} requires Team Preview.`);
			}
		},
		onTeamPreview() {
			const msg = 'uhtml|otsrequest|<button name="send" value="/acceptopenteamsheets" class="button" style="margin-right: 10px;"><strong>Accept Open Team Sheets</strong></button><button name="send" value="/rejectopenteamsheets" class="button" style="margin-top: 10px"><strong>Deny Open Team Sheets</strong></button>';
			for (const side of this.sides) {
				this.addSplit(side.id, [msg]);
			}
		},
		onBattleStart() {
			for (const side of this.sides) {
				this.addSplit(side.id, ['uhtmlchange|otsrequest|']);
			}
		},
	},
	forceopenteamsheets: {
		effectType: 'Rule',
		name: 'Force Open Team Sheets',
		desc: "Allows each player to see the Pok&eacute;mon and all non-stat information about them, before they choose their lead Pok&eacute;mon",
		mutuallyExclusiveWith: 'openteamsheets',
		onValidateRule() {
			if (!(this.ruleTable.has('teampreview') || this.ruleTable.has('teamtypepreview'))) {
				throw new Error(`The "Force Open Team Sheets" rule${this.ruleTable.blame('forceopenteamsheets')} requires Team Preview.`);
			}
		},
		onTeamPreview() {
			this.showOpenTeamSheets();
		},
	},
	aaarestrictedabilities: {
		effectType: 'ValidatorRule',
		name: 'AAA Restricted Abilities',
		desc: "Allows validation for AAA formats to use restricted abilities instead of banned ones.",
		onValidateSet(set) {
			const ability = this.dex.abilities.get(set.ability);
			if (this.ruleTable.isRestricted(`ability:${ability.id}`)) {
				const species = this.dex.species.get(set.species);
				if (!Object.values(species.abilities).includes(ability.name)) {
					return [
						`The Ability "${ability.name}" is restricted.`,
						`(Only Pok\u00e9mon that get ${ability.name} naturally can use it.)`,
					];
				}
			}
		},
	},
	eventmovesclause: {
		effectType: 'ValidatorRule',
		name: 'Event Moves Clause',
		desc: "Bans moves only obtainable through events.",
		onBegin() {
			this.add('rule', 'Event Moves Clause: Event-only moves are banned');
		},
		onValidateSet(set) {
			if (!set.moves) return;
			const moveSources: NonNullable<Learnset['learnset']> = Object.fromEntries(
				set.moves.map(move => [this.toID(move), []])
			);

			const species = this.dex.species.get(set.species);
			for (const { learnset } of this.dex.species.getFullLearnset(species.id)) {
				for (const moveid in moveSources) {
					moveSources[moveid].push(...(learnset[moveid] || []));
				}
			}
			const problems = [];
			for (const move of set.moves) {
				const sources = moveSources[this.toID(move)];
				if (sources?.length && sources.every(learned => learned.includes('S'))) {
					problems.push(`${species.name}'s move ${move} is obtainable only through events.`);
				}
			}
			if (problems.length) problems.push(`(Event-only moves are banned.)`);
			return problems;
		},
	},
	pickedteamsize: {
		effectType: 'Rule',
		name: 'Picked Team Size',
		desc: "Team size (number of pokemon) that can be brought out of Team Preview",
		hasValue: 'positive-integer',
		// hardcoded in sim/side
		onValidateRule() {
			if (!(this.ruleTable.has('teampreview') || this.ruleTable.has('teamtypepreview'))) {
				throw new Error(`The "Picked Team Size" rule${this.ruleTable.blame('pickedteamsize')} requires Team Preview.`);
			}
		},
	},
	minteamsize: {
		effectType: 'ValidatorRule',
		name: "Min Team Size",
		desc: "Minimum team size (number of pokemon) that can be brought into Team Preview (or into the battle, in formats without Team Preview)",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
	},
	evlimit: {
		effectType: 'ValidatorRule',
		name: "EV Limit",
		desc: "Maximum total EVs on each pokemon.",
		hasValue: 'integer',
		// hardcoded in sim/team-validator
	},
	maxteamsize: {
		effectType: 'ValidatorRule',
		name: "Max Team Size",
		desc: "Maximum team size (number of pokemon) that can be brought into Team Preview (or into the battle, in formats without Team Preview)",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
		onValidateRule(value) {
			if (this.format.id.endsWith('computergeneratedteams')) {
				throw new Error(`${this.format.name} does not support Max Team Size.`);
			}
		},
	},
	maxmovecount: {
		effectType: 'ValidatorRule',
		name: "Max Move Count",
		desc: "Max number of moves allowed on a single pokemon (defaults to 4 in a normal game)",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
	},
	maxtotallevel: {
		effectType: 'Rule',
		name: 'Max Total Level',
		desc: "Teams are restricted to a total maximum Level limit and Pokemon are restricted to a set range of Levels",
		hasValue: 'positive-integer',
		onValidateTeam(team) {
			const pickedTeamSize = this.ruleTable.pickedTeamSize || team.length;
			const maxTotalLevel = this.ruleTable.maxTotalLevel;
			if (maxTotalLevel === null) throw new Error("No maxTotalLevel specified.");

			const teamLevels = [];
			for (const set of team) {
				teamLevels.push(set.level);
			}
			teamLevels.sort((a, b) => a - b);

			let totalLowestLevels = 0;
			for (let i = 0; i < pickedTeamSize; i++) {
				totalLowestLevels += teamLevels[i];
			}
			if (totalLowestLevels > maxTotalLevel) {
				const thePokemon = pickedTeamSize === team.length ?
					`all ${team.length} Pokémon` : `the ${pickedTeamSize} lowest-leveled Pokémon`;
				return [
					`The combined levels of ${thePokemon} of your team is ${totalLowestLevels}, above the format's total level limit of ${maxTotalLevel}${this.ruleTable.blame('maxtotallevel')}.`,
				];
			}

			let minTotalWithHighestLevel = teamLevels[teamLevels.length - 1];
			for (let i = 0; i < pickedTeamSize - 1; i++) {
				minTotalWithHighestLevel += teamLevels[i];
			}
			if (minTotalWithHighestLevel > maxTotalLevel) {
				return [
					`Your highest level Pokémon is unusable, because there's no way to create a team with it whose total level is less than the format's total level limit of ${maxTotalLevel}${this.ruleTable.blame('maxtotallevel')}.`,
				];
			}
		},
		onValidateRule(value) {
			const ruleTable = this.ruleTable;
			const maxTotalLevel = ruleTable.maxTotalLevel!;
			const maxTeamSize = ruleTable.pickedTeamSize || ruleTable.maxTeamSize;
			const maxTeamSizeBlame = ruleTable.pickedTeamSize ? ruleTable.blame('pickedteamsize') : ruleTable.blame('maxteamsize');
			if (maxTotalLevel >= ruleTable.maxLevel * maxTeamSize) {
				throw new Error(`A Max Total Level of ${maxTotalLevel}${ruleTable.blame('maxtotallevel')} is too high (and will have no effect) with ${maxTeamSize}${maxTeamSizeBlame} Pokémon at max level ${ruleTable.maxLevel}${ruleTable.blame('maxlevel')}`);
			}
			if (maxTotalLevel <= ruleTable.minLevel * maxTeamSize) {
				throw new Error(`A Max Total Level of ${maxTotalLevel}${ruleTable.blame('maxtotallevel')} is too low with ${maxTeamSize}${maxTeamSizeBlame} Pokémon at min level ${ruleTable.minLevel}${ruleTable.blame('minlevel')}`);
			}
		},
		// hardcoded in sim/side
	},
	minlevel: {
		effectType: 'ValidatorRule',
		name: 'Min Level',
		desc: "Minimum level of brought Pokémon",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
	},
	maxlevel: {
		effectType: 'ValidatorRule',
		name: 'Max Level',
		desc: "Maximum level of brought Pokémon (if you're using both this and Adjust Level, this will control what level moves you have access to)",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
	},
	defaultlevel: {
		effectType: 'ValidatorRule',
		name: 'Default Level',
		desc: "Default level of brought Pokémon (normally should be equal to Max Level, except Custom Games have a very high max level but still default to 100)",
		hasValue: 'positive-integer',
		// hardcoded in sim/team-validator
	},
	adjustlevel: {
		effectType: 'ValidatorRule',
		name: 'Adjust Level',
		desc: "All Pokémon will be set to exactly this level (but unlike Max Level and Min Level, it will still be able to learn moves from above this level) (when using this, Max Level is the level of the pokemon before it's level-adjusted down)",
		hasValue: 'positive-integer',
		mutuallyExclusiveWith: 'adjustleveldown',
		// hardcoded in sim/team-validator
	},
	adjustleveldown: {
		effectType: 'ValidatorRule',
		name: 'Adjust Level Down',
		desc: "Any Pokémon above this level will be set to this level (but unlike Max Level, it will still be able to learn moves from above this level)",
		hasValue: 'positive-integer',
		mutuallyExclusiveWith: 'adjustlevel',
		// hardcoded in sim/team-validator
	},
	stadiumitemsclause: {
		effectType: 'ValidatorRule',
		name: 'Stadium Items Clause',
		desc: "Bans items that are not usable in Pokemon Stadium 2.",
		banlist: ['Fast Ball', 'Friend Ball', 'Great Ball', 'Heavy Ball', 'Level Ball', 'Love Ball', 'Lure Ball', 'Master Ball', 'Moon Ball', 'Park Ball', 'Poke Ball', 'Safari Ball', 'Ultra Ball', 'Fire Stone', 'Leaf Stone', 'Moon Stone', 'Sun Stone', 'Thunder Stone', 'Upgrade', 'Water Stone', 'Mail'],
	},
	nc2000movelegality: {
		effectType: 'ValidatorRule',
		name: "NC 2000 Move Legality",
		desc: "Prevents Pok\u00e9mon from having moves that would only be obtainable in Pok\u00e9mon Crystal.",
		// Implemented in mods/gen2/rulesets.ts
	},
	aptclause: {
		effectType: 'ValidatorRule',
		name: 'APT Clause',
		desc: "Bans the combination of Agility and partial trapping moves like Wrap.",
		banlist: ['Agility + Wrap', 'Agility + Fire Spin', 'Agility + Bind', 'Agility + Clamp'],
	},
	nc1997movelegality: {
		effectType: 'ValidatorRule',
		name: "NC 1997 Move Legality",
		desc: "Bans move combinations on Pok\u00e9mon that weren't legal in NC 1997.",
		// Implemented in mods/gen1jpn/rulesets.ts
	},
	noswitching: {
		effectType: 'Rule',
		name: 'No Switching',
		desc: 'All Pok\u00e9mon are trapped (cannot switch naturally, but can as the effect of an item, move, or Ability).',
		onBegin() {
			this.add('rule', 'No Switching: All Pok\u00e9mon are trapped');
		},
		onTrapPokemon(pokemon) {
			pokemon.trapped = true;
		},
	},
	guaranteedsecondarymod: {
		effectType: 'Rule',
		name: 'Guaranteed Secondary Mod',
		desc: 'All moves\' secondary effect chances are set to 100% (Tri Attack and Dire Claw set a random status; Poison Touch is not a real secondary and remains at 30%).',
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('Freeze test: Guaranteeing secondary');
				for (const secondary of move.secondaries) {
					secondary.chance = 100;
				}
			}
		},
	},
	chimera1v1rule: {
		effectType: 'Rule',
		name: 'Chimera 1v1 Rule',
		desc: "Merges a team of six into a single Pok\u00e9mon depending on the order chosen at team preview: It gains the typing of the first, item of the second, ability of the third, stats of the fourth, the first two moves of the fifth, and the last two moves of the sixth.",
		ruleset: ['Team Preview', 'Picked Team Size = 6'],
		onValidateSet(set) {
			if (!set.item) return;
			const item = this.dex.items.get(set.item);
			if (item.itemUser && !this.ruleTable.has(`+item:${item.id}`)) {
				return [`${set.species}'s item ${item.name} is banned.`];
			}
		},
		onValidateRule() {
			const table = this.ruleTable;
			if ((table.pickedTeamSize || table.minTeamSize) < 6) {
				throw new Error(
					`Custom rules that could allow the active team size to be reduced below 6 (Min Team Size < 6, Picked Team Size < 6) could prevent the Chimera from being fully defined, and are incompatible with Chimera 1v1.`
				);
			}
			const gameType = this.format.gameType;
			if (gameType === 'doubles' || gameType === 'triples') {
				throw new Error(
					`The game type '${gameType}' cannot be 1v1 because sides can have multiple active Pok\u00e9mon, so it is incompatible with Chimera 1v1.`
				);
			}
		},
		onBeforeSwitchIn(pokemon) {
			const allies = pokemon.side.pokemon.splice(1);
			pokemon.side.pokemonLeft = 1;
			const newSpecies = this.dex.deepClone(pokemon.baseSpecies);
			newSpecies.abilities = allies[1].baseSpecies.abilities;
			newSpecies.baseStats = allies[2].baseSpecies.baseStats;
			newSpecies.bst = allies[2].baseSpecies.bst;
			pokemon.item = allies[0].item;
			pokemon.ability = pokemon.baseAbility = allies[1].ability;
			pokemon.set.evs = allies[2].set.evs;
			pokemon.set.nature = allies[2].set.nature;
			pokemon.set.ivs = allies[2].set.ivs;
			pokemon.hpType = (pokemon as any).baseHpType = allies[2].baseHpType;
			pokemon.moveSlots = (pokemon as any).baseMoveSlots = [
				...allies[3].baseMoveSlots.slice(0, 2), ...allies[4].baseMoveSlots.slice(2),
			].filter((move, index, moveSlots) => moveSlots.find(othermove => othermove.id === move.id) === move);
			// so all HP-related properties get re-initialized in setSpecies
			pokemon.maxhp = 0;
			pokemon.setSpecies(newSpecies, null);
		},
	},
	bonustypemod: {
		name: "Bonus Type Mod",
		effectType: "Rule",
		desc: `Pok&eacute;mon have their Tera Type added onto their current ones.`,
		onBegin() {
			this.add('rule', 'Bonus Type Mod: Pok\u00e9mon have their Tera Type added onto their current ones.');
		},
		onModifySpeciesPriority: 1,
		onModifySpecies(species, target, source, effect) {
			if (!target) return; // Chat command
			if (effect && ['imposter', 'transform'].includes(effect.id)) return;
			const typesSet = new Set(species.types);
			const bonusType = this.dex.types.get(target.teraType);
			if (bonusType.exists) typesSet.add(bonusType.name);
			return { ...species, types: [...typesSet] };
		},
		onSwitchIn(pokemon) {
			this.add('-start', pokemon, 'typechange', (pokemon.illusion || pokemon).getTypes(true).join('/'), '[silent]');
		},
		onAfterMega(pokemon) {
			this.add('-start', pokemon, 'typechange', (pokemon.illusion || pokemon).getTypes(true).join('/'), '[silent]');
		},
	},
	firstbloodrule: {
		effectType: "Rule",
		name: "First Blood Rule",
		desc: `The first team to have a Pok&eacute;mon faint loses.`,
		onBegin() {
			this.add('rule', 'First Blood Rule: The first team to have a Pok\u00e9mon faint loses.');
		},
		onFaint(target) {
			this.lose(target.side);
		},
	},
	tiershiftmod: {
		effectType: "Rule",
		name: "Tier Shift Mod",
		desc: `Pok&eacute;mon below OU get their stats, excluding HP, boosted. UU/RUBL get +15, RU/NUBL get +20, NU/PUBL get +25, and PU or lower get +30.`,
		ruleset: ['Overflow Stat Mod'],
		onBegin() {
			this.add('rule', 'Tier Shift Mod: Pok\u00e9mon get stat buffs depending on their tier, excluding HP.');
		},
		onModifySpecies(species, target, source, effect) {
			if (!species.baseStats) return;
			const boosts: { [tier: string]: number } = {
				uu: 15,
				rubl: 15,
				ru: 20,
				nubl: 20,
				nu: 25,
				publ: 25,
				pu: 30,
				zubl: 30,
				zu: 30,
				nfe: 30,
				lc: 30,
			};
			const isNatDex: boolean = this.ruleTable.has("standardnatdex");
			let tier: string = this.toID(isNatDex ? species.natDexTier : species.tier);
			if (!(tier in boosts)) return;
			// Non-Pokemon bans in lower tiers
			if (target) {
				if (this.toID(target.set.item) === 'lightclay') tier = 'rubl';
				if (this.toID(target.set.item) === 'damprock') tier = 'publ';
				if (this.toID(target.set.item) === 'heatrock') tier = 'publ';
			}
			const pokemon = this.dex.deepClone(species);
			pokemon.bst = pokemon.baseStats['hp'];
			const boost = boosts[tier];
			let statName: StatID;
			for (statName in pokemon.baseStats as StatsTable) {
				if (statName === 'hp') continue;
				pokemon.baseStats[statName] = this.clampIntRange(pokemon.baseStats[statName] + boost, 1, 255);
				pokemon.bst += pokemon.baseStats[statName];
			}
			return pokemon;
		},
	},
	revelationmonsmod: {
		effectType: "Rule",
		name: "Revelationmons Mod",
		desc: `The moves in the first slot(s) of a Pok&eacute;mon's set have their types changed to match the Pok&eacute;mon's type(s).`,
		onBegin() {
			this.add('rule', 'Revelationmons Mod: The first moveslots have their types changed to match the Pok\u00e9mon\'s types');
		},
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const slotIndex = species.types.length - 1;
			const problems = [];
			for (const [i, moveid] of set.moves.entries()) {
				const move = this.dex.moves.get(moveid);
				if (!this.ruleTable.isRestricted(`move:${move.id}`)) continue;
				if (i <= slotIndex) {
					problems.push(`${move.name} can't be in moveslot ${i + 1} because it's restricted from being in the first ${slotIndex + 1 > 1 ? `${slotIndex + 1} slots` : 'slot'}.`);
				}
			}
			return problems;
		},
		onModifyMove(move, pokemon, target) {
			const types = pokemon.getTypes(true);
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (noModifyType.includes(move.id)) return;
			for (const [i, type] of types.entries()) {
				if (!this.dex.types.isName(type)) continue;
				if (pokemon.moveSlots[i] && move.id === pokemon.moveSlots[i].id) move.type = type;
			}
		},
	},
	reevolutionmod: {
		effectType: "Rule",
		name: "Re-Evolution Mod",
		desc: "Pok&eacute;mon gain the stat changes they would gain from evolving again.",
		onBegin() {
			this.add('rule', 'Re-Evolution Mod: Pok\u00e9mon gain the boosts they would gain from evolving again');
		},
		onModifySpecies(species, target) {
			const newSpecies = this.dex.deepClone(species);
			const baseSpecies = this.dex.species.get(
				(Array.isArray(species.battleOnly) ? species.battleOnly[0] : species.battleOnly) || species.changesFrom || species.name
			);
			if (!newSpecies.prevo) {
				if (!baseSpecies.prevo) return;
				const prevoSpecies = this.dex.species.get(baseSpecies.prevo);
				let statid: StatID;
				newSpecies.bst = 0;
				for (statid in prevoSpecies.baseStats) {
					const change = baseSpecies.baseStats[statid] - prevoSpecies.baseStats[statid];
					const formeChange = newSpecies.baseStats[statid] - baseSpecies.baseStats[statid];
					newSpecies.baseStats[statid] = this.clampIntRange(baseSpecies.baseStats[statid] + change, 1, 255);
					newSpecies.baseStats[statid] = this.clampIntRange(newSpecies.baseStats[statid] + formeChange, 1, 255);
					newSpecies.bst += newSpecies.baseStats[statid];
				}
				return newSpecies;
			}
			const prevoSpecies = this.dex.species.get(newSpecies.prevo);
			let statid: StatID;
			newSpecies.bst = 0;
			for (statid in prevoSpecies.baseStats) {
				const change = newSpecies.baseStats[statid] - prevoSpecies.baseStats[statid];
				newSpecies.baseStats[statid] = this.clampIntRange(newSpecies.baseStats[statid] + change, 1, 255);
				newSpecies.bst += newSpecies.baseStats[statid];
			}
			return newSpecies;
		},
	},
	brokenrecordmod: {
		effectType: "Rule",
		name: "Broken Record Mod",
		desc: `Pok&eacute;mon can hold a TR to use that move in battle.`,
		onValidateSet(set) {
			if (!set.item) return;
			const item = this.dex.items.get(set.item);
			if (!/^tr\d\d/i.test(item.name)) return;
			const moveName = item.desc.split('move ')[1].split('.')[0];
			if (set.moves.map(this.toID).includes(this.toID(moveName))) {
				return [
					`${set.species} can't run ${item.name} (${moveName}) as its item because it already has that move in its moveset.`,
				];
			}
		},
		onValidateTeam(team) {
			const trs = new Set<string>();
			for (const set of team) {
				if (!set.item) continue;
				const item = this.dex.items.get(set.item).name;
				if (!/^tr\d\d/i.test(item)) continue;
				if (trs.has(item)) {
					return [`Your team already has a Pok\u00e9mon with ${item}.`];
				}
				trs.add(item);
			}
		},
		onTakeItem(item) {
			return !/^tr\d\d/i.test(item.name);
		},
		onModifyMove(move) {
			if (move.id === 'knockoff') {
				move.onBasePower = function (basePower, source, target, m) {
					const item = target.getItem();
					if (!this.singleEvent('TakeItem', item, target.itemState, target, target, m, item)) return;
					// Very hardcode but I'd prefer to not make a mod for one damage calculation change
					if (item.id && !/^tr\d\d/i.test(item.id)) {
						return this.chainModify(1.5);
					}
				};
			} else if (move.id === 'fling') {
				move.onPrepareHit = function (target, source, m) {
					if (source.ignoringItem()) return false;
					const item = source.getItem();
					if (!this.singleEvent('TakeItem', item, source.itemState, source, source, m, item)) return false;
					if (!item.fling) return false;
					if (/^tr\d\d/i.test(item.id)) return false;
					m.basePower = item.fling.basePower;
					if (item.isBerry) {
						m.onHit = function (foe) {
							if (this.singleEvent('Eat', item, null, foe, null, null)) {
								this.runEvent('EatItem', foe, null, null, item);
								if (item.id === 'leppaberry') foe.staleness = 'external';
							}
							if (item.onEat) foe.ateBerry = true;
						};
					} else if (item.fling.effect) {
						m.onHit = item.fling.effect;
					} else {
						if (!m.secondaries) m.secondaries = [];
						if (item.fling.status) {
							m.secondaries.push({ status: item.fling.status });
						} else if (item.fling.volatileStatus) {
							m.secondaries.push({ volatileStatus: item.fling.volatileStatus });
						}
					}
					source.addVolatile('fling');
				};
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				const item = pokemon.getItem();
				if (/^tr\d\d/i.test(item.name)) {
					const move = this.dex.moves.get(item.desc.split('move ')[1].split('.')[0]);
					pokemon.moveSlots = (pokemon as any).baseMoveSlots = [
						...pokemon.baseMoveSlots, {
							id: move.id,
							move: move.name,
							pp: move.pp * 8 / 5,
							maxpp: move.pp * 8 / 5,
							target: move.target,
							disabled: false,
							disabledSource: '',
							used: false,
						},
					];
				}
			}
		},
	},
	forceofthefallenmod: {
		effectType: 'Rule',
		name: 'Force of the Fallen Mod',
		desc: `Pok&eacute;mon pass the move in their last moveslot to their allies when they are KOed.`,
		onValidateSet(set, format, setHas, teamHas) {
			const lastMoveslot = this.dex.moves.get(set.moves[set.moves.length - 1]);
			if (this.ruleTable.isRestricted(`move:${lastMoveslot.id}`)) {
				return [`${set.species}'s move ${lastMoveslot.name} cannot be placed in the last moveslot.`];
			}
		},
		onBegin() {
			this.add('rule', 'Force of the Fallen Mod: Pok&\u00e9mon pass the move in their last moveslot to their allies when they\'re KOed');
			for (const pokemon of this.getAllPokemon()) {
				pokemon.m.trueLastMoveSlot = pokemon.baseMoveSlots[pokemon.baseMoveSlots.length - 1];
			}
		},
		onFaint(target) {
			const allies = target.side.pokemon.filter(ally => ally && target !== ally);
			for (const ally of allies) {
				ally.moveSlots = (ally as any).baseMoveSlots = [...ally.baseMoveSlots, target.m.trueLastMoveSlot];
			}
		},
	},
	categoryswapmod: {
		effectType: 'Rule',
		name: 'Category Swap Mod',
		desc: `All physical moves become special, and all special moves become physical.`,
		onBegin() {
			this.add('rule', 'Category Swap Mod: All physical moves become special, and vice versa');
		},
		onModifyMove(move, pokemon, target) {
			if (move.category === "Status") return;

			if (move.category === "Physical") {
				move.category = "Special";
			} else if (move.category === "Special") {
				move.category = "Physical";
			}

			switch (move.id) {
			case 'doomdesire': {
				move.onTry = function (source, subtarget) {
					if (!subtarget.side.addSlotCondition(subtarget, 'futuremove')) return false;
					Object.assign(subtarget.side.slotConditions[subtarget.position]['futuremove'], {
						move: 'doomdesire',
						source,
						moveData: {
							id: 'doomdesire',
							name: "Doom Desire",
							accuracy: 100,
							basePower: 140,
							category: "Physical",
							priority: 0,
							flags: { futuremove: 1 },
							effectType: 'Move',
							type: 'Steel',
						},
					});
					this.add('-start', source, 'Doom Desire');
					return this.NOT_FAIL;
				};
				break;
			}
			case 'futuresight': {
				move.onTry = function (source, subtarget) {
					if (!subtarget.side.addSlotCondition(subtarget, 'futuremove')) return false;
					Object.assign(subtarget.side.slotConditions[subtarget.position]['futuremove'], {
						duration: 3,
						move: 'futuresight',
						source,
						moveData: {
							id: 'futuresight',
							name: "Future Sight",
							accuracy: 100,
							basePower: 120,
							category: "Physical",
							priority: 0,
							flags: { futuremove: 1 },
							ignoreImmunity: false,
							effectType: 'Move',
							type: 'Psychic',
						},
					});
					this.add('-start', source, 'move: Future Sight');
					return this.NOT_FAIL;
				};
				break;
			}
			// Moves with dynamic categories will always be physical if not special-cased
			case 'lightthatburnsthesky':
			case 'photongeyser': {
				move.category = 'Special';
				if (pokemon.getStat('atk', false, true) > pokemon.getStat('spa', false, true)) move.category = 'Physical';
				break;
			}
			case 'shellsidearm': {
				if (!target) return;
				move.category = 'Special';
				const atk = pokemon.getStat('atk', false, true);
				const spa = pokemon.getStat('spa', false, true);
				const def = target.getStat('def', false, true);
				const spd = target.getStat('spd', false, true);
				const physical = Math.floor(Math.floor(Math.floor(Math.floor(2 * pokemon.level / 5 + 2) * 90 * atk) / def) / 50);
				const special = Math.floor(Math.floor(Math.floor(Math.floor(2 * pokemon.level / 5 + 2) * 90 * spa) / spd) / 50);
				if (physical > special || (physical === special && this.randomChance(1, 2))) {
					move.category = 'Physical';
					move.flags.contact = 1;
				}
				break;
			}
			}
		},
	},
	convergencelegality: {
		effectType: 'ValidatorRule',
		name: "Convergence Legality",
		desc: `Allows all Pok&eacute;mon that have identical types to share moves and abilities.`,
		onValidateSet(set, format) {
			const curSpecies = this.dex.species.get(set.species);
			const obtainableAbilityPool = new Set<string>();
			const matchingSpecies = this.dex.species.all()
				.filter(species => (
					(!species.isNonstandard || this.ruleTable.has(`+pokemontag:${this.toID(species.isNonstandard)}`)) &&
					species.types.every(type => curSpecies.types.includes(type)) &&
					species.types.length === curSpecies.types.length && !this.ruleTable.isBannedSpecies(species)
				));
			for (const species of matchingSpecies) {
				for (const abilityName of Object.values(species.abilities)) {
					const abilityid = this.toID(abilityName);
					obtainableAbilityPool.add(abilityid);
				}
			}
			if (!obtainableAbilityPool.has(this.toID(set.ability))) {
				return [`${curSpecies.name} doesn't have access to ${this.dex.abilities.get(set.ability).name}.`];
			}
		},
		checkCanLearn(move, species, setSources, set) {
			const matchingSpecies = this.dex.species.all()
				.filter(s => (
					(!s.isNonstandard || this.ruleTable.has(`+pokemontag:${this.toID(s.isNonstandard)}`)) &&
					s.types.every(type => species.types.includes(type)) &&
					s.types.length === species.types.length && !this.ruleTable.isBannedSpecies(s)
				));
			const someCanLearn = matchingSpecies.some(s => this.checkCanLearn(move, s, setSources, set) === null);
			if (someCanLearn) return null;
			return this.checkCanLearn(move, species, setSources, set);
		},
	},
	speciesrevealclause: {
		effectType: 'Rule',
		name: 'Species Reveal Clause',
		desc: "Reveals a Pok&eacute;mon's true species in hackmons-based metagames.",
		// Hardcoded into effect, cannot be disabled, ties into team preview
		onBegin() {
			this.add('rule', 'Species Reveal Clause: Reveals a Pok\u00e9mon\'s true species in hackmons-based metagames.');
		},
	},
	franticfusionsmod: {
		effectType: 'Rule',
		name: "Frantic Fusions Mod",
		desc: `Pok&eacute;mon nicknamed after another Pok&eacute;mon get their stats buffed by 1/4 of that Pok&eacute;mon's stats, barring HP, and access to their abilities.`,
		onBegin() {
			this.add('rule', 'Frantic Fusions Mod: Pok\u00e9mon nicknamed after another Pok\u00e9mon get buffed stats and more abilities.');
		},
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const fusion = this.dex.species.get(set.name);
			const abilityPool = new Set<string>(Object.values(species.abilities));
			if (fusion.exists) {
				for (const ability of Object.values(fusion.abilities)) {
					abilityPool.add(ability);
				}
			}
			const ability = this.dex.abilities.get(set.ability);
			if (!abilityPool.has(ability.name)) {
				return [`${species.name} only has access to the following abilities: ${Array.from(abilityPool).join(', ')}.`];
			}
		},
		onValidateTeam(team, format) {
			const donors = new this.dex.Multiset<string>();
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				const fusion = this.dex.species.get(set.name);
				if (fusion.exists) {
					set.name = fusion.name;
				} else {
					set.name = species.baseSpecies;
					if (species.baseSpecies === 'Unown') set.species = 'Unown';
				}
				if (fusion.name === species.name) continue;
				donors.add(fusion.name);
			}
			for (const [fusionName, number] of donors) {
				if (number > 1) {
					return [`You can only fuse with any Pok\u00e9 once.`, `(You have ${number} Pok\u00e9mon fused with ${fusionName}.)`];
				}
				const fusion = this.dex.species.get(fusionName);
				if (this.ruleTable.isBannedSpecies(fusion) || fusion.battleOnly) {
					return [`Pok\u00e9mon can't fuse with banned Pok\u00e9mon.`, `(${fusionName} is banned.)`];
				}
				if (fusion.isNonstandard &&
					!(this.ruleTable.has(`+pokemontag:${this.toID(fusion.isNonstandard)}`) ||
						this.ruleTable.has(`+pokemon:${fusion.id}`) ||
						this.ruleTable.has(`+basepokemon:${this.toID(fusion.baseSpecies)}`))) {
					return [`${fusion.name} is marked as ${fusion.isNonstandard}, which is banned.`];
				}
			}
		},
		onModifySpecies(species, target, source, effect) {
			if (!target) return;
			const newSpecies = this.dex.deepClone(species);
			const fusionName = target.set.name;
			if (!fusionName || fusionName === newSpecies.name) return;
			const fusionSpecies = this.dex.deepClone(this.dex.species.get(fusionName));
			newSpecies.bst = newSpecies.baseStats.hp;
			for (const stat in newSpecies.baseStats) {
				if (stat === 'hp') continue;
				const addition = Math.floor(fusionSpecies.baseStats[stat] / 4);
				newSpecies.baseStats[stat] = this.clampIntRange(newSpecies.baseStats[stat] + addition, 1, 255);
				newSpecies.bst += newSpecies.baseStats[stat];
			}
			return newSpecies;
		},
	},
	proteanpalacemod: {
		effectType: 'Rule',
		name: "Protean Palace Mod",
		desc: `Pok&eacute;mon become the type of the move they use.`,
		onBegin() {
			this.add('rule', 'Protean Palace Mod: Pok\u00e9mon become the type of the move they use.');
		},
		onPrepareHit(source, target, move) {
			if (move.hasBounced || move.flags['futuremove'] || move.sourceEffect === 'snatch') return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				if (!source.setType(type)) return;
				this.add('-start', source, 'typechange', type, '[from] ability: Protean');
			}
		},
	},
	bestof: {
		effectType: 'ValidatorRule',
		name: 'Best Of',
		desc: "Allows players to define a best-of series where the winner of the series is the winner of the majority of games.",
		hasValue: 'positive-integer',
		onValidateRule(value) {
			const num = Number(value);
			if (num > 9 || num < 3 || num % 2 !== 1) {
				throw new Error("Series length must be an odd number between three and nine (inclusive).");
			}
			if (!['singles', 'doubles'].includes(this.format.gameType)) {
				throw new Error("Only single and doubles battles can be a Best-of series.");
			}
			return value;
		},
	},
	illusionlevelmod: {
		effectType: 'Rule',
		name: "Illusion Level Mod",
		desc: `Changes the Illusion ability to disguise the Pok&eacute;mon's level instead of leaking it.`,
		onBegin() {
			this.add('rule', "Illusion Level Mod: Illusion disguises the Pok\u00e9mon's true level");
		},
		// Implemented in Pokemon#getDetails
	},
	allowedpokemoves: {
		effectType: 'ValidatorRule',
		name: "Allowed Pokemoves",
		desc: "Allows players to define the amount of Pokemoves allowed per set.",
		hasValue: 'positive-integer',
		onValidateRule(value) {
			const num = Number(value);
			if (num > this.ruleTable.maxMoveCount || num < 1) {
				throw new Error(`Allowed Pokemoves must be between 1 and ${this.ruleTable.maxMoveCount}.`);
			}
			return value;
		},
		// Validation in the Pokemoves format
	},
	uniquepokemoves: {
		effectType: 'ValidatorRule',
		name: "Unique Pokemoves",
		desc: "Allows players to define how many times a Pokemon can be used as a Pokemove per team.",
		hasValue: 'positive-integer',
		onValidateRule(value) {
			const num = Number(value);
			if (num > this.ruleTable.maxMoveCount || num < 1) {
				throw new Error(`Unique Pokemoves must be between 1 and ${this.ruleTable.maxMoveCount}.`);
			}
			return value;
		},
		onValidateTeam(team, format, teamHas) {
			const pokemoves = new this.dex.Multiset<ID>();
			for (const set of team) {
				if (set.moves?.length) {
					for (const moveid of set.moves) {
						const pokemove = this.dex.species.get(moveid);
						if (!pokemove.exists) continue;
						pokemoves.add(pokemove.id);
					}
				}
			}
			const problems: string[] = [];
			const uniquePokemoves = Number(this.ruleTable.valueRules.get('uniquepokemoveclause') || 1);
			for (const [moveid, num] of pokemoves) {
				if (num <= uniquePokemoves) continue;
				problems.push(
					`You have ${num} Pok\u00e9mon with ${this.dex.species.get(moveid).name} as a Pokemove.`,
					`(Each Pok\u00e9mon can only be used as a Pokemove ${uniquePokemoves} time${uniquePokemoves === 1 ? '' : 's'} per team.)`
				);
			}
			return problems;
		},
	},
	ferventimpersonationmod: {
		effectType: 'Rule',
		name: "Fervent Impersonation Mod",
		desc: `Nickname a Pok&eacute;mon after another Pok&eacute;mon that it shares a moveset with, and it will transform into the Pok&eacute;mon it's nicknamed after once it drops to or below 50% health.`,
		onValidateTeam(team, format, teamHas) {
			const exhaustedSpecies = new Set<string>();
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				const impersonation = this.dex.species.get(set.name);
				if (exhaustedSpecies.has(species.baseSpecies) ||
					(exhaustedSpecies.has(impersonation.baseSpecies) && impersonation.baseSpecies !== species.baseSpecies)) {
					return [`You have more than one Pok\u00e9mon nicknamed after ${impersonation.baseSpecies}.`];
				}
				exhaustedSpecies.add(species.baseSpecies);
				if (impersonation.exists && impersonation.baseSpecies !== species.baseSpecies) {
					exhaustedSpecies.add(impersonation.baseSpecies);
				}
			}
		},
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const impersonation = this.dex.species.get(set.name);
			if (this.ruleTable.isRestrictedSpecies(species)) {
				return [
					`${species.name} can't be used as a base species.`,
					`(Restricted Pok\u00e9mon can only be used as impersonations.)`,
				];
			}
			const rt = this.ruleTable;
			if ((this.toID(set.name) !== species.id && this.toID(set.name) !== impersonation.id) ||
				(impersonation.isNonstandard && !(rt.has(`+pokemontag:${this.toID(impersonation.isNonstandard)}`) ||
					rt.has(`+pokemon:${impersonation.id}`) || rt.has(`+basepokemon:${this.toID(impersonation.baseSpecies)}`)))) {
				return [`All Pok\u00e9mon must either have no nickname or must be nicknamed after a Pok\u00e9mon.`];
			}
		},
		checkCanLearn(move, species, setSources, set) {
			const impersonation = this.dex.species.get(set.name);
			const baseCheckCanLearn = this.checkCanLearn(move, species, setSources, set);
			if (baseCheckCanLearn) return baseCheckCanLearn;
			return this.checkCanLearn(move, impersonation, setSources, set);
		},
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (pokemon.transformed || !pokemon.hp) return;
			const oldPokemon = pokemon.species;
			const impersonation = this.dex.species.get(pokemon.set.name);
			if (pokemon.species.baseSpecies === impersonation.baseSpecies || pokemon.hp > pokemon.maxhp / 2) return;
			this.add('-activate', pokemon, 'ability: Power Construct');
			const abilitySlot = Object.keys(oldPokemon.abilities).find(x => (
				(oldPokemon.abilities as any)[x] === pokemon.set.ability
			)) || "0";
			pokemon.formeChange(impersonation.name, this.effect, true, abilitySlot);
			pokemon.baseMaxhp = Math.floor(Math.floor(
				2 * pokemon.species.baseStats['hp'] + pokemon.set.ivs['hp'] + Math.floor(pokemon.set.evs['hp'] / 4) + 100
			) * pokemon.level / 100 + 10);
			const newMaxHP = pokemon.volatiles['dynamax'] ? (2 * pokemon.baseMaxhp) : pokemon.baseMaxhp;
			pokemon.hp = this.clampIntRange(newMaxHP - (pokemon.maxhp - pokemon.hp), 1, newMaxHP);
			pokemon.maxhp = newMaxHP;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
		},
	},
	badnboostedmod: {
		effectType: 'Rule',
		name: "Bad 'n Boosted Mod",
		desc: "All of a Pok&eacute;mon's base stats below 70 are doubled.",
		onBegin() {
			this.add('rule', 'Bad \'n Boosted Mod: All of a Pokemon\'s base stats below 70 are doubled.');
		},
		onModifySpeciesPriority: 2,
		onModifySpecies(species) {
			const newSpecies = this.dex.deepClone(species);
			newSpecies.bst = 0;
			for (const stat in newSpecies.baseStats) {
				if (newSpecies.baseStats[stat] <= 70) {
					newSpecies.baseStats[stat] = this.clampIntRange(newSpecies.baseStats[stat] * 2, 1, 255);
				}
				newSpecies.bst += newSpecies.baseStats[stat];
			}
			return newSpecies;
		},
	},
	datapreview: {
		effectType: 'Rule',
		name: 'Data Preview',
		desc: 'When a new Pokémon switches in for the first time, information about its types, stats and Abilities is displayed to both players.',
		onSwitchIn(pokemon) {
			const species = pokemon.illusion?.species || pokemon.species;
			const gen = this.gen;

			if (pokemon.illusion) {
				pokemon.m.revealed = false;
			}

			// Recreation of Chat.getDataPokemonHTML
			let buf = '<li class="result">';
			buf += `<span class="col numcol">${species.tier}</span> `;
			buf += `<span class="col iconcol"><psicon pokemon="${species.id}"/></span> `;
			buf += `<span class="col pokemonnamecol" style="white-space:nowrap"><a href="https://${Config.routes.dex}/pokemon/${species.id}" target="_blank">${species.name}</a></span> `;
			buf += '<span class="col typecol">';
			if (species.types) {
				for (const type of species.types) {
					buf += `<img src="https://${Config.routes.client}/sprites/types/${type}.png" alt="${type}" height="14" width="32">`;
				}
			}
			buf += '</span> ';
			if (gen >= 3) {
				buf += '<span style="float:left;min-height:26px">';
				if (species.abilities['1'] && (gen >= 4 || Dex.abilities.get(species.abilities['1']).gen === 3)) {
					buf += `<span class="col twoabilitycol">${species.abilities['0']}<br />${species.abilities['1']}</span>`;
				} else {
					buf += `<span class="col abilitycol">${species.abilities['0']}</span>`;
				}
				if (species.abilities['H'] && species.abilities['S']) {
					buf += `<span class="col twoabilitycol${species.unreleasedHidden ? ' unreleasedhacol' : ''}"><em>${species.abilities['H']}<br />(${species.abilities['S']})</em></span>`;
				} else if (species.abilities['H']) {
					buf += `<span class="col abilitycol${species.unreleasedHidden ? ' unreleasedhacol' : ''}"><em>${species.abilities['H']}</em></span>`;
				} else if (species.abilities['S']) {
					// special case for Zygarde
					buf += `<span class="col abilitycol"><em>(${species.abilities['S']})</em></span>`;
				} else {
					buf += '<span class="col abilitycol"></span>';
				}
				buf += '</span>';
			}
			buf += '<span style="float:left;min-height:26px">';
			buf += `<span class="col statcol"><em>HP</em><br />${species.baseStats.hp}</span> `;
			buf += `<span class="col statcol"><em>Atk</em><br />${species.baseStats.atk}</span> `;
			buf += `<span class="col statcol"><em>Def</em><br />${species.baseStats.def}</span> `;
			if (gen <= 1) {
				buf += `<span class="col statcol"><em>Spc</em><br />${species.baseStats.spa}</span> `;
			} else {
				buf += `<span class="col statcol"><em>SpA</em><br />${species.baseStats.spa}</span> `;
				buf += `<span class="col statcol"><em>SpD</em><br />${species.baseStats.spd}</span> `;
			}
			buf += `<span class="col statcol"><em>Spe</em><br />${species.baseStats.spe}</span> `;
			buf += `<span class="col bstcol"><em>BST<br />${species.bst}</em></span> `;
			buf += '</span>';
			buf += '</li>';
			buf = `<div class="message"><ul class="utilichart">${buf}<li style="clear:both"></li></ul></div>`;
			this.add('-start', pokemon, 'typechange', pokemon.getTypes(true).join('/'), '[silent]');
			this.add(`raw|${buf}`);
		},
		onDamagingHit(damage, target, source, move) {
			if (target.hasAbility('illusion') && !target.m.revealed) {
				const species = target.species;
				const gen = this.gen;

				// Recreation of Chat.getDataPokemonHTML
				let buf = '<li class="result">';
				buf += `<span class="col numcol">${species.tier}</span> `;
				buf += `<span class="col iconcol"><psicon pokemon="${species.id}"/></span> `;
				buf += `<span class="col pokemonnamecol" style="white-space:nowrap"><a href="https://${Config.routes.dex}/pokemon/${species.id}" target="_blank">${species.name}</a></span> `;
				buf += '<span class="col typecol">';
				if (species.types) {
					for (const type of species.types) {
						buf += `<img src="https://${Config.routes.client}/sprites/types/${type}.png" alt="${type}" height="14" width="32">`;
					}
				}
				buf += '</span> ';
				if (gen >= 3) {
					buf += '<span style="float:left;min-height:26px">';
					if (species.abilities['1'] && (gen >= 4 || Dex.abilities.get(species.abilities['1']).gen === 3)) {
						buf += `<span class="col twoabilitycol">${species.abilities['0']}<br />${species.abilities['1']}</span>`;
					} else {
						buf += `<span class="col abilitycol">${species.abilities['0']}</span>`;
					}
					if (species.abilities['H'] && species.abilities['S']) {
						buf += `<span class="col twoabilitycol${species.unreleasedHidden ? ' unreleasedhacol' : ''}"><em>${species.abilities['H']}<br />(${species.abilities['S']})</em></span>`;
					} else if (species.abilities['H']) {
						buf += `<span class="col abilitycol${species.unreleasedHidden ? ' unreleasedhacol' : ''}"><em>${species.abilities['H']}</em></span>`;
					} else if (species.abilities['S']) {
						// special case for Zygarde
						buf += `<span class="col abilitycol"><em>(${species.abilities['S']})</em></span>`;
					} else {
						buf += '<span class="col abilitycol"></span>';
					}
					buf += '</span>';
				}
				buf += '<span style="float:left;min-height:26px">';
				buf += `<span class="col statcol"><em>HP</em><br />${species.baseStats.hp}</span> `;
				buf += `<span class="col statcol"><em>Atk</em><br />${species.baseStats.atk}</span> `;
				buf += `<span class="col statcol"><em>Def</em><br />${species.baseStats.def}</span> `;
				if (gen <= 1) {
					buf += `<span class="col statcol"><em>Spc</em><br />${species.baseStats.spa}</span> `;
				} else {
					buf += `<span class="col statcol"><em>SpA</em><br />${species.baseStats.spa}</span> `;
					buf += `<span class="col statcol"><em>SpD</em><br />${species.baseStats.spd}</span> `;
				}
				buf += `<span class="col statcol"><em>Spe</em><br />${species.baseStats.spe}</span> `;
				buf += `<span class="col bstcol"><em>BST<br />${species.bst}</em></span> `;
				buf += '</span>';
				buf += '</li>';
				buf = `<div class="message"><ul class="utilichart">${buf}<li style="clear:both"></li></ul></div>`;

				this.add('-start', target, 'typechange', target.getTypes(true).join('/'), '[silent]');
				this.add(`raw|${buf}`);
				target.m.revealed = true;
			}
		},
	},
};
