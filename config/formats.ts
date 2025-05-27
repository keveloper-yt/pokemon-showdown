// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts
/*
If you want to add custom formats, create a file in this folder named: "custom-formats.ts"

Paste the following code into the file and add your desired formats and their sections between the brackets:
--------------------------------------------------------------------------------
// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts

export const Formats: FormatList = [
];
--------------------------------------------------------------------------------

If you specify a section that already exists, your format will be added to the bottom of that section.
New sections will be added to the bottom of the specified column.
The column value will be ignored for repeat sections.
*/

export const Formats: import('../sim/dex-formats').FormatList = [

	{
		section: "PokeMMO Formats",
	},
	{
		name: "[PMMO] Ubers",
		mod: 'gen9',
		ruleset: ['Standard'],
		banlist: ['AG', 'Moody'],
	},
	{
		name: "[PMMO] OU",
		mod: 'gen9',
		ruleset: ['[PMMO] Ubers', 'Adjust Level = 50'],
		banlist: ['Uber', 'Dugtrio + Arena Trap', 'Gallade + Sharpness', 'Garchomp + Swords Dance', 'Hydreigon + Draco Meteor', 'Shaymin-Sky', 'Jirachi + Follow Me'],
	},
	{
		name: "[PMMO] UU",
		mod: 'gen9',
		ruleset: ['[PMMO] OU'],
		banlist: ['OU'],
	},
	{
		name: "[PMMO] NU",
		mod: 'gen9',
		ruleset: ['[PMMO] UU'],
		banlist: ['UU'],
	},
	{
		name: "[PMMO] Doubles",
		mod: 'gen9',
		gameType: 'doubles',
		ruleset: ['Standard Doubles', 'Evasion Abilities Clause'],
		banlist: [],
	},
	{
		name: "[PMMO] Anything Goes",
		mod: 'gen9',
		ruleset: ['Standard AG'],
	},
	{
		name: "[PMMO] VGC",
		mod: 'gen9',
		gameType: 'doubles',
		searchShow: false,
		bestOfDefault: true,
		ruleset: ['Flat Rules', '!! Adjust Level = 50', 'VGC Timer', 'Open Team Sheets'],
	},
	{
		section: "Equos Formats",
	},
	{
		name: "[EQUOS] LC",
		mod: 'gen9',
		ruleset: ['Little Cup', 'Standard'],
		banlist: [],
	},
	{
		section: "Special Formats",
	},
	{
		name: "[PMMO] Custom Game",
		mod: 'gen9',
		searchShow: false,
		debug: true,
		battle: { trunc: Math.trunc },
		// no restrictions, for serious (other than team preview)
		ruleset: ['Team Preview', 'Cancel Mod', 'Max Team Size = 24', 'Max Move Count = 24', 'Max Level = 9999', 'Default Level = 100'],
	},
	{
		name: "[PMMO] Doubles Custom Game",
		mod: 'gen9',
		gameType: 'doubles',
		searchShow: false,
		battle: { trunc: Math.trunc },
		debug: true,
		// no restrictions, for serious (other than team preview)
		ruleset: ['Team Preview', 'Cancel Mod', 'Max Team Size = 24', 'Max Move Count = 24', 'Max Level = 9999', 'Default Level = 100'],
	},
	{
		name: "[PMMO] Triples",
		mod: 'gen9',
		gameType: 'triples',
		searchShow: false,
		ruleset: ['Standard Doubles', 'Evasion Abilities Clause'],
		banlist: [
			'Arceus', 'Darkrai', 'Dialga', 'Giratina',
			'Groudon', 'Ho-Oh', 'Kyogre', 'Kyurem-Black', 'Kyurem-White', 'Lugia', 'Mewtwo',
			'Palkia', 'Rayquaza', 'Reshiram',
			'Zekrom', 'Moody', 'Shadow Tag', 'Bright Powder', 'King\'s Rock', 'Razor Fang',
		],
	},
];
