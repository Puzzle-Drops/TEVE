// Spell Logic Functions
const spellLogic = {
    // Villager Spells
    punchLogic: function(battle, caster, target) {
        const damage = 5 + caster.stats.str + caster.stats.agi + caster.stats.int;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.log(`${caster.name} punches ${target.name} for ${damage} damage!`);
    },

    furyLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'fury', 2, { actionBarMultiplier: 1.5 });
        battle.log(`${caster.name} enters a fury, increasing attack speed for 2 turns!`);
    },

    // Druid Spells
    naturesTouchLogic: function(battle, caster, target) {
        const healAmount = Math.floor(target.maxHp * 0.2 + caster.totalStats.int);
        battle.healUnit(target, healAmount);
        battle.log(`${caster.name} heals ${target.name} for ${healAmount} HP!`);
    },

    wildGrowthLogic: function(battle, caster, targets) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            if (ally.currentHp > 0) {
                const healAmount = Math.floor(ally.maxHp * 0.1 + caster.totalStats.int * 0.5);
                battle.healUnit(ally, healAmount);
            }
        });
        battle.log(`${caster.name} casts Wild Growth, healing all allies!`);
    },

    beastFormLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'beastForm', -1, { 
            strMultiplier: 1.5, 
            agiMultiplier: 1.5 
        });
        battle.log(`${caster.name} transforms into beast form!`);
    },

    elementalShieldLogic: function(battle, caster, target) {
        const shieldAmount = caster.totalStats.int * 2;
        battle.applyShield(target, shieldAmount);
        battle.log(`${caster.name} shields ${target.name} for ${shieldAmount} damage!`);
    },

    runicAuraLogic: function(battle, caster) {
        // Passive aura - applied at battle start
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.cooldownReduction += 0.2;
        });
        battle.log(`${caster.name}'s Runic Aura grants 20% CDR to all allies!`);
    },

    naturesArmyLogic: function(battle, caster) {
        // Passive aura - summons handled separately
        battle.log(`${caster.name}'s Nature's Army stands ready!`);
    },

    eternalRuneLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.str * 3 + caster.totalStats.int * 5;
                battle.dealDamage(caster, enemy, damage, 'magical');
            }
        });
        battle.log(`${caster.name} unleashes Eternal Rune!`);
    },

    naturesWrathLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 4 + caster.totalStats.agi * 2;
                battle.dealDamage(caster, enemy, damage, 'magical');
                battle.applyDebuff(enemy, 'naturesDot', 3, { dotDamage: damage * 0.2 });
            }
        });
        battle.log(`${caster.name} channels Nature's Wrath!`);
    },

    // Acolyte/Priest Spells
    holyLightLogic: function(battle, caster, target) {
        const healAmount = Math.floor(target.maxHp * 0.3 + caster.totalStats.int * 0.5);
        battle.healUnit(target, healAmount);
        battle.log(`${caster.name} heals ${target.name} with Holy Light for ${healAmount} HP!`);
    },

    divineShieldLogic: function(battle, caster, target) {
        battle.applyBuff(target, 'divineShield', 2, { immunity: true });
        battle.log(`${caster.name} grants ${target.name} Divine Shield!`);
    },

    massHealLogic: function(battle, caster, targets) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            if (ally.currentHp > 0) {
                const healAmount = Math.floor(ally.maxHp * 0.15 + caster.totalStats.int);
                battle.healUnit(ally, healAmount);
            }
        });
        battle.log(`${caster.name} casts Mass Heal!`);
    },

    blessedRecoveryLogic: function(battle, caster, target) {
        if (target.currentHp <= 0) {
            target.currentHp = Math.floor(target.maxHp * 0.5);
            battle.removeDebuffs(target);
            battle.log(`${caster.name} resurrects ${target.name}!`);
        }
    },

    divineAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.healingReceived = (ally.healingReceived || 1) * 1.25;
        });
        battle.log(`${caster.name}'s Divine Aura increases healing received!`);
    },

    prophecyAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.dodgeChance = (ally.dodgeChance || 0) + 0.15;
        });
        battle.log(`${caster.name}'s Prophecy Aura grants dodge chance!`);
    },

    heavensWrathLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 6;
                battle.dealDamage(caster, enemy, damage, 'holy');
            }
        });
        battle.log(`${caster.name} calls down Heaven's Wrath!`);
    },

    divineInterventionLogic: function(battle, caster, targets) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.currentHp = ally.maxHp;
            battle.removeDebuffs(ally);
        });
        battle.log(`${caster.name} calls upon Divine Intervention!`);
    },

    // Archer Spells
    poisonStrikeLogic: function(battle, caster, target) {
        const damage = caster.totalStats.agi * 1.5;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.applyDebuff(target, 'poison', 3, { dotDamage: damage * 0.3 });
        battle.log(`${caster.name} poisons ${target.name}!`);
    },

    multishotLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.agi * 1.2;
                battle.dealDamage(caster, enemy, damage, 'physical');
            }
        });
        battle.log(`${caster.name} fires a Multishot!`);
    },

    aimedShotLogic: function(battle, caster, target) {
        const damage = caster.totalStats.agi * 3;
        const isCrit = Math.random() < 0.5;
        battle.dealDamage(caster, target, damage * (isCrit ? 2 : 1), 'physical');
        battle.log(`${caster.name} fires an Aimed Shot${isCrit ? ' (CRIT!)' : ''}!`);
    },

    huntersMarkLogic: function(battle, caster, target) {
        battle.applyDebuff(target, 'huntersMark', -1, { damageTakenMultiplier: 1.25 });
        battle.log(`${caster.name} marks ${target.name} for the hunt!`);
    },

    eagleEyeAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.accuracy = (ally.accuracy || 1) * 1.2;
            ally.critChance = (ally.critChance || 0.1) + 0.2;
        });
        battle.log(`${caster.name}'s Eagle Eye Aura sharpens aim!`);
    },

    predatorAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.markedDamageBonus = 1.3;
        });
        battle.log(`${caster.name}'s Predator Aura enhances the hunt!`);
    },

    perfectShotLogic: function(battle, caster, target) {
        if (target.currentHp / target.maxHp <= 0.3) {
            target.currentHp = 0;
            battle.log(`${caster.name} executes ${target.name} with a Perfect Shot!`);
        } else {
            const damage = caster.totalStats.agi * 10;
            battle.dealDamage(caster, target, damage, 'physical');
            battle.log(`${caster.name} fires a Perfect Shot!`);
        }
    },

    theWildHuntLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.agi * 5 + caster.totalStats.str * 3;
                battle.dealDamage(caster, enemy, damage, 'physical');
            }
        });
        battle.log(`${caster.name} summons The Wild Hunt!`);
    },

    // Mage Spells
    fireballLogic: function(battle, caster, target) {
        const damage = caster.totalStats.int * 2.5;
        battle.dealDamage(caster, target, damage, 'fire');
        battle.log(`${caster.name} hurls a Fireball at ${target.name}!`);
    },

    frostArmorLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'frostArmor', 3, { damageReduction: 0.3 });
        battle.log(`${caster.name} encases themselves in Frost Armor!`);
    },

    arcaneExplosionLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 2;
                battle.dealDamage(caster, enemy, damage, 'arcane');
            }
        });
        battle.log(`${caster.name} explodes with arcane energy!`);
    },

    manaBurnLogic: function(battle, caster, target) {
        const manaBurned = Math.min(target.currentMana || 0, 100);
        target.currentMana = (target.currentMana || 0) - manaBurned;
        const damage = manaBurned * 1.5 + caster.totalStats.int * 1.5;
        battle.dealDamage(caster, target, damage, 'arcane');
        battle.log(`${caster.name} burns ${target.name}'s mana!`);
    },

    enlightenmentAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.spellPower = (ally.spellPower || 1) * 1.3;
        });
        battle.log(`${caster.name}'s Enlightenment Aura empowers spells!`);
    },

    wisdomAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.manaRegen = (ally.manaRegen || 0) + 0.2;
            ally.cooldownReduction = (ally.cooldownReduction || 0) + 0.15;
        });
        battle.log(`${caster.name}'s Wisdom Aura grants clarity!`);
    },

    meteorStormLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 8;
                battle.dealDamage(caster, enemy, damage, 'fire');
            }
        });
        battle.log(`${caster.name} calls down a Meteor Storm!`);
    },

    timeStopLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            battle.applyDebuff(enemy, 'timeStop', 2, { stunned: true });
        });
        battle.log(`${caster.name} stops time!`);
    },

    // Swordsman/Knight Spells
    bladeStrikeLogic: function(battle, caster, target) {
        const damage = caster.totalStats.str * 2;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.log(`${caster.name} strikes with their blade!`);
    },

    shieldBashLogic: function(battle, caster, target) {
        const damage = caster.totalStats.str * 1.5;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.applyDebuff(target, 'stun', 1, { stunned: true });
        battle.log(`${caster.name} bashes ${target.name} with their shield!`);
    },

    royalChargeLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.str * 2.5;
                battle.dealDamage(caster, enemy, damage, 'physical');
            }
        });
        battle.log(`${caster.name} charges through the enemy ranks!`);
    },

    holyStrikeLogic: function(battle, caster, target) {
        const damage = caster.totalStats.str * 2 + caster.totalStats.int;
        battle.dealDamage(caster, target, damage, 'holy');
        battle.log(`${caster.name} delivers a Holy Strike!`);
    },

    valorAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.damageMultiplier = (ally.damageMultiplier || 1) * 1.25;
            ally.defenseMultiplier = (ally.defenseMultiplier || 1) * 1.25;
        });
        battle.log(`${caster.name}'s Valor Aura inspires allies!`);
    },

    vengeanceAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.damageReflect = 0.3;
        });
        battle.log(`${caster.name}'s Vengeance Aura reflects damage!`);
    },

    divineStormLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.str * 5 + caster.totalStats.int * 2;
                battle.dealDamage(caster, enemy, damage, 'holy');
            }
        });
        battle.log(`${caster.name} spins in a Divine Storm!`);
    },

    wrathOfHeavenLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.str * 4 + caster.totalStats.int * 4;
                battle.dealDamage(caster, enemy, damage, 'holy');
            }
        });
        battle.log(`${caster.name} channels the Wrath of Heaven!`);
    },

    // Templar Spells
    shieldSlamLogic: function(battle, caster, target) {
        const defense = caster.totalStats.str * 0.5; // Use STR as proxy for defense
        const damage = caster.totalStats.str * 1.5 + defense * 0.5;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.log(`${caster.name} slams with their shield!`);
    },

    consecrateLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            battle.applyDebuff(enemy, 'consecration', 3, { 
                dotDamage: caster.totalStats.int 
            });
        });
        battle.log(`${caster.name} consecrates the ground!`);
    },

    shadowStrikeLogic: function(battle, caster, target) {
        const damage = caster.totalStats.str * 1.5 + caster.totalStats.int * 1.5;
        battle.dealDamage(caster, target, damage, 'shadow');
        battle.log(`${caster.name} strikes from the shadows!`);
    },

    psiStormLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 3;
                battle.dealDamage(caster, enemy, damage, 'psionic');
            }
        });
        battle.log(`${caster.name} creates a Psi Storm!`);
    },

    darknessAuraLogic: function(battle, caster) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            enemy.missChance = (enemy.missChance || 0) + 0.2;
        });
        battle.log(`${caster.name}'s Darkness Aura blinds enemies!`);
    },

    psionicAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.mindShield = true;
            ally.manaRegen = (ally.manaRegen || 0) + 0.25;
        });
        battle.log(`${caster.name}'s Psionic Aura protects minds!`);
    },

    voidStormLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 7;
                battle.dealDamage(caster, enemy, damage, 'void');
            }
        });
        battle.log(`${caster.name} tears reality with a Void Storm!`);
    },

    archonFormLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'archonForm', -1, { 
            intMultiplier: 2.0,
            spellPowerMultiplier: 1.5 
        });
        battle.log(`${caster.name} transforms into Archon Form!`);
    },

    // Thief/Rogue Spells
    backstabLogic: function(battle, caster, target) {
        const damage = caster.totalStats.agi * 2.5;
        const isCrit = Math.random() < 0.5;
        battle.dealDamage(caster, target, damage * (isCrit ? 3 : 1), 'physical');
        battle.log(`${caster.name} backstabs ${target.name}${isCrit ? ' (CRIT!)' : ''}!`);
    },

    smokeBombLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'stealth', 2, { 
            untargetable: true,
            damageMultiplier: 1.5 
        });
        battle.log(`${caster.name} vanishes in smoke!`);
    },

    assassinateLogic: function(battle, caster, target) {
        if (target.currentHp / target.maxHp <= 0.2) {
            target.currentHp = 0;
            battle.log(`${caster.name} assassinates ${target.name}!`);
        } else {
            const damage = caster.totalStats.agi * 4;
            battle.dealDamage(caster, target, damage, 'physical');
            battle.log(`${caster.name} attempts to assassinate ${target.name}!`);
        }
    },

    shadowstepLogic: function(battle, caster, target) {
        const damage = caster.totalStats.agi * 3;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.log(`${caster.name} shadowsteps behind ${target.name}!`);
    },

    blurAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.evasion = (ally.evasion || 0) + 0.25;
        });
        battle.log(`${caster.name}'s Blur Aura grants evasion!`);
    },

    shadowMasteryAuraLogic: function(battle, caster) {
        // This is handled per turn when checking HP
        battle.log(`${caster.name}'s Shadow Mastery protects the wounded!`);
    },

    coupDeGraceLogic: function(battle, caster, target) {
        for (let i = 0; i < 6; i++) {
            if (target.currentHp > 0) {
                const damage = caster.totalStats.agi * 1.5;
                const isCrit = Math.random() < 0.8; // High crit chance
                battle.dealDamage(caster, target, damage * (isCrit ? 2 : 1), 'physical');
            }
        }
        battle.log(`${caster.name} unleashes Coup de Grace!`);
    },

    thousandCutsLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.agi * 6;
                battle.dealDamage(caster, enemy, damage, 'physical');
            }
        });
        battle.log(`${caster.name} performs a Thousand Cuts!`);
    },

    // Witch Hunter Spells
    silverBoltLogic: function(battle, caster, target) {
        let damage = caster.totalStats.agi * 1.5 + caster.totalStats.int * 0.5;
        if (target.type === 'undead' || target.type === 'demon') {
            damage *= 2;
        }
        battle.dealDamage(caster, target, damage, 'holy');
        battle.log(`${caster.name} fires a Silver Bolt!`);
    },

    purgeLogic: function(battle, caster, target) {
        battle.removeBuffs(target);
        battle.log(`${caster.name} purges ${target.name}'s buffs!`);
    },

    holyFireLogic: function(battle, caster, target) {
        const damage = caster.totalStats.int * 2.5;
        battle.dealDamage(caster, target, damage, 'holy');
        battle.applyDebuff(target, 'holyFire', 3, { dotDamage: damage * 0.3 });
        battle.log(`${caster.name} burns ${target.name} with Holy Fire!`);
    },

    alchemyLogic: function(battle, caster, target) {
        const effects = ['damage', 'heal', 'buff', 'debuff'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        switch(effect) {
            case 'damage':
                battle.dealDamage(caster, target, caster.totalStats.int * 3, 'random');
                battle.log(`${caster.name}'s potion explodes!`);
                break;
            case 'heal':
                battle.healUnit(target, target.maxHp * 0.3);
                battle.log(`${caster.name}'s potion heals!`);
                break;
            case 'buff':
                battle.applyBuff(target, 'alchemyBuff', 3, { allStatsMultiplier: 1.2 });
                battle.log(`${caster.name}'s potion empowers!`);
                break;
            case 'debuff':
                battle.applyDebuff(target, 'alchemyDebuff', 3, { allStatsMultiplier: 0.8 });
                battle.log(`${caster.name}'s potion weakens!`);
                break;
        }
    },

    zealotAuraLogic: function(battle, caster) {
        const party = battle.getParty(caster);
        party.forEach(ally => {
            ally.holyDamageVsUndead = 2.0;
        });
        battle.log(`${caster.name}'s Zealot Aura burns the unholy!`);
    },

    mutationAuraLogic: function(battle, caster) {
        // Applied each turn
        battle.log(`${caster.name}'s Mutation Aura causes random mutations!`);
    },

    divineJudgmentLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.totalStats.int * 10;
                battle.dealDamage(caster, enemy, damage, 'holy');
            }
        });
        battle.log(`${caster.name} calls down Divine Judgment!`);
    },

    trialOfGrassesLogic: function(battle, caster, target) {
        battle.applyBuff(caster, 'mutation', -1, { 
            strMultiplier: 1.5,
            agiMultiplier: 1.5,
            intMultiplier: 1.5 
        });
        battle.log(`${caster.name} undergoes the Trial of Grasses!`);
    },

    // Boss Spells
slashLogic: function(battle, caster, target, spell) {
    const { percent, cap } = spell.scaling;
    const damage = Math.min(target.maxHp * percent, cap);
    battle.dealDamage(caster, target, damage, 'physical');
    battle.log(`${caster.name} slashes ${target.name} for ${Math.round(damage)} damage!`);
},

biteLogic: function(battle, caster, target, spell) {
    const { percent, floor } = spell.scaling;
    const damage = Math.max(target.maxHp * percent, floor);
    battle.dealDamage(caster, target, damage, 'physical');
    battle.log(`${caster.name} bites ${target.name} for ${Math.round(damage)} damage!`);
},


    frostBreathLogic: function(battle, caster, targets) {
        const enemies = battle.getEnemies(caster);
        enemies.forEach(enemy => {
            if (enemy.currentHp > 0) {
                const damage = caster.baseStats.str * 2;
                battle.dealDamage(caster, enemy, damage, 'frost');
                battle.applyDebuff(enemy, 'slow', 2, { actionBarSpeed: 0.5 });
            }
        });
        battle.log(`${caster.name} breathes frost!`);
    },

    goldTossLogic: function(battle, caster, target) {
        const randomMultiplier = Math.random() * 3;
        const damage = caster.baseStats.str * randomMultiplier;
        battle.dealDamage(caster, target, damage, 'physical');
        battle.log(`${caster.name} tosses gold coins for ${Math.floor(damage)} damage!`);
    },

    summonGoblinsLogic: function(battle, caster, target) {
        for (let i = 0; i < 2; i++) {
            battle.summonUnit(caster, {
                name: 'Goblin Minion',
                hp: caster.hp * 0.3,
                str: caster.baseStats.str * 0.5,
                agi: caster.baseStats.agi * 0.5,
                int: caster.baseStats.int * 0.5
            });
        }
        battle.log(`${caster.name} summons goblin minions!`);
    }
};

// Spell Manager Class
class SpellManager {
    constructor() {
        this.spells = {};
        this.loaded = false;
    }

    async loadSpells() {
        try {
            const response = await fetch('spells.json');
            const spellData = await response.json();
            
            // spellData is already a flat object with spell IDs as keys
            this.spells = spellData;
            
            this.loaded = true;
            console.log('Spells loaded:', Object.keys(this.spells).length);
        } catch (error) {
            console.error('Failed to load spells:', error);
            // Fallback spell data
            this.spells = {
                punch: {
                    name: "Punch",
                    description: "Basic attack dealing 5 + STR + AGI + INT damage",
                    cooldown: 0,
                    effects: ["damage"],
                    target: "enemy",
                    logicKey: "punchLogic"
                },
                fury: {
                    name: "Fury",
                    description: "Doubles action bar gain for 5 turns",
                    cooldown: 5,
                    effects: ["buff", "speed"],
                    target: "self",
                    logicKey: "furyLogic"
                }
            };
        }
    }

    getSpell(spellId) {
        return this.spells[spellId] || null;
    }

    getSpellsByIds(spellIds) {
        return spellIds.map(id => this.getSpell(id)).filter(spell => spell !== null);
    }

    executeSpell(spellId, battle, caster, target) {
        const spell = this.getSpell(spellId);
        if (!spell) {
            console.error(`Spell not found: ${spellId}`);
            return false;
        }

        const logicFunction = spellLogic[spell.logicKey];
        if (!logicFunction) {
            console.error(`Logic function not found: ${spell.logicKey}`);
            return false;
        }

        try {
            logicFunction(battle, caster, target);
            return true;
        } catch (error) {
            console.error(`Error executing spell ${spellId}:`, error);
            return false;
        }
    }
}
