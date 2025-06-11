// Battle System for TEVE
class BattleUnit {
    constructor(source, isEnemy = false, position = 0) {
        this.source = source; // Reference to Hero or Enemy object
        this.isEnemy = isEnemy;
        this.position = position;
        
        // Battle stats
        this.currentHp = this.maxHp;
        this.actionBar = 0;
        this.buffs = [];
        this.debuffs = [];
        this.cooldowns = {};
        this.isDead = false;
        
        // Combat modifiers
        this.damageMultiplier = 1;
        this.defenseMultiplier = 1;
        this.healingReceived = 1;
        this.spellPower = 1;
        this.accuracy = 1;
        this.evasion = 0;
        this.critChance = 0.1;
        this.dodgeChance = 0;
        this.missChance = 0;
        this.damageReflect = 0;
        
        // Initialize cooldowns
        const abilities = this.abilities;
        if (abilities && abilities.length > 0) {
            abilities.forEach((ability, index) => {
                if (ability.cooldown > 0) {
                    this.cooldowns[index] = 0;
                }
                // Ultimate abilities start with random cooldown
                if (ability.ultimate) {
                    this.cooldowns[index] = Math.floor(Math.random() * 500) + 1;
                }
            });
        }
        
        console.log(`Created BattleUnit: ${this.name}, HP: ${this.currentHp}/${this.maxHp}, Speed: ${this.actionBarSpeed}`);
    }
    
    get name() {
        return this.source.name;
    }
    
    get maxHp() {
        return this.isEnemy ? this.source.hp : this.source.hp;
    }
    
    get stats() {
        return this.isEnemy ? this.source.baseStats : this.source.totalStats;
    }
    
    get actionBarSpeed() {
        const agi = this.stats.agi;
        let speed = 100 + 100 * (agi / (agi + 1000));
        
        // Apply buffs/debuffs
        this.buffs.forEach(buff => {
            if (buff.actionBarMultiplier) {
                speed *= buff.actionBarMultiplier;
            }
        });
        
        this.debuffs.forEach(debuff => {
            if (debuff.actionBarSpeed) {
                speed *= debuff.actionBarSpeed;
            }
        });
        
        return speed;
    }
    
    get isAlive() {
        return this.currentHp > 0 && !this.isDead;
    }
    
    get abilities() {
        return this.source.abilities || [];
    }
    
    canUseAbility(abilityIndex) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;
        
        // Check cooldown
        if (this.cooldowns[abilityIndex] > 0) return false;
        
        // Check if stunned
        if (this.debuffs.some(d => d.stunned)) return false;
        
        // Check if ability is passive or aura
        const spell = spellManager.getSpell(ability.id);
        if (spell && (spell.target === 'passive' || spell.effects.includes('aura'))) {
            return false;
        }
        
        return true;
    }
    
    useAbility(abilityIndex) {
        const ability = this.abilities[abilityIndex];
        if (!ability || !this.canUseAbility(abilityIndex)) return false;
        
        // Set cooldown
        if (ability.cooldown > 0) {
            this.cooldowns[abilityIndex] = ability.cooldown;
        }
        
        return true;
    }
    
    reduceCooldowns() {
        Object.keys(this.cooldowns).forEach(key => {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key]--;
            }
        });
    }
    
    updateBuffsDebuffs() {
        // Reduce duration and remove expired buffs
        this.buffs = this.buffs.filter(buff => {
            if (buff.duration > 0) {
                buff.duration--;
                return buff.duration > 0;
            }
            return buff.duration === -1; // Permanent buffs
        });
        
        // Reduce duration and remove expired debuffs
        this.debuffs = this.debuffs.filter(debuff => {
            if (debuff.duration > 0) {
                debuff.duration--;
                return debuff.duration > 0;
            }
            return debuff.duration === -1; // Permanent debuffs
        });
    }
    
    applyStatModifiers() {
        // Reset modifiers
        this.damageMultiplier = 1;
        this.defenseMultiplier = 1;
        this.healingReceived = 1;
        this.spellPower = 1;
        this.accuracy = 1;
        this.evasion = 0;
        this.critChance = 0.1;
        this.dodgeChance = 0;
        this.missChance = 0;
        this.damageReflect = 0;
        
        // Apply buff effects
        this.buffs.forEach(buff => {
            if (buff.damageMultiplier) this.damageMultiplier *= buff.damageMultiplier;
            if (buff.defenseMultiplier) this.defenseMultiplier *= buff.defenseMultiplier;
            if (buff.healingReceived) this.healingReceived *= buff.healingReceived;
            if (buff.spellPowerMultiplier) this.spellPower *= buff.spellPowerMultiplier;
            if (buff.accuracy) this.accuracy *= buff.accuracy;
            if (buff.evasion) this.evasion += buff.evasion;
            if (buff.critChance) this.critChance += buff.critChance;
            if (buff.dodgeChance) this.dodgeChance += buff.dodgeChance;
            if (buff.strMultiplier) this.stats.str = Math.floor(this.stats.str * buff.strMultiplier);
            if (buff.agiMultiplier) this.stats.agi = Math.floor(this.stats.agi * buff.agiMultiplier);
            if (buff.intMultiplier) this.stats.int = Math.floor(this.stats.int * buff.intMultiplier);
            if (buff.allStatsMultiplier) {
                this.stats.str = Math.floor(this.stats.str * buff.allStatsMultiplier);
                this.stats.agi = Math.floor(this.stats.agi * buff.allStatsMultiplier);
                this.stats.int = Math.floor(this.stats.int * buff.allStatsMultiplier);
            }
        });
        
        // Apply debuff effects
        this.debuffs.forEach(debuff => {
            if (debuff.damageTakenMultiplier) this.defenseMultiplier /= debuff.damageTakenMultiplier;
            if (debuff.missChance) this.missChance += debuff.missChance;
            if (debuff.allStatsMultiplier) {
                this.stats.str = Math.floor(this.stats.str * debuff.allStatsMultiplier);
                this.stats.agi = Math.floor(this.stats.agi * debuff.allStatsMultiplier);
                this.stats.int = Math.floor(this.stats.int * debuff.allStatsMultiplier);
            }
        });
    }
}

class Battle {
    constructor(game, party, enemies) {
        this.game = game;
        this.turn = 0;
        this.currentUnit = null;
        this.waitingForPlayer = false;
        this.autoMode = false;
        this.battleLog = [];
        this.gameSpeed = 1;
        this.running = true;
        this.selectedTargets = [];
        
        // Create battle units
        this.party = party.map((hero, index) => hero ? new BattleUnit(hero, false, index) : null).filter(u => u);
        this.enemies = enemies.map((enemy, index) => enemy ? new BattleUnit(enemy, true, index) : null).filter(u => u);
        
        this.allUnits = [...this.party, ...this.enemies];
        
        // Apply initial auras
        this.applyInitialAuras();
    }
    
    applyInitialAuras() {
        // Apply aura abilities at battle start
        this.allUnits.forEach(unit => {
            unit.abilities.forEach((ability, index) => {
                const spell = spellManager.getSpell(ability.id);
                if (spell && spell.effects.includes('aura') && spellLogic[spell.logicKey]) {
                    try {
                        spellLogic[spell.logicKey](this, unit);
                    } catch (error) {
                        console.error(`Error applying aura ${ability.name}:`, error);
                    }
                }
            });
        });
    }
    
    start() {
        this.log("Battle started!");
        this.log(`Your party: ${this.party.map(u => u.name).join(', ')}`);
        this.log(`Enemies: ${this.enemies.map(u => u.name).join(', ')}`);
        
        // Initial UI update
        this.updateUI();
        
        // Start the battle loop with a small delay
        setTimeout(() => this.battleLoop(), 500);
    }
    
    battleLoop() {
        if (!this.running || this.checkBattleEnd()) return;
        
        // If waiting for player, don't progress
        if (this.waitingForPlayer) {
            setTimeout(() => this.battleLoop(), 100);
            return;
        }
        
        // Progress action bars for all living units
        let highestActionBar = 0;
        this.allUnits.forEach(unit => {
            if (unit.isAlive) {
                unit.actionBar += unit.actionBarSpeed;
                if (unit.actionBar > highestActionBar) {
                    highestActionBar = unit.actionBar;
                }
            }
        });
        
        // Update UI to show action bar progress
        this.updateUI();
        
        // Check if anyone can act
        const readyUnits = this.allUnits.filter(u => u.isAlive && u.actionBar >= 10000);
        
        if (readyUnits.length > 0) {
            // Sort by action bar value (highest first)
            readyUnits.sort((a, b) => b.actionBar - a.actionBar);
            this.currentUnit = readyUnits[0];
            
            // Subtract action bar
            this.currentUnit.actionBar -= 10000;
            
            // Apply stat modifiers at turn start
            this.currentUnit.applyStatModifiers();
            
            // Log who's taking a turn
            this.log(`${this.currentUnit.name}'s turn! (Action: ${Math.floor(this.currentUnit.actionBar)})`);
            
            // Process turn
            this.processTurn();
        } else {
            // Continue the loop
            setTimeout(() => this.battleLoop(), 50 / this.gameSpeed);
        }
    }
    
    processTurn() {
        const unit = this.currentUnit;
        
        // Update buffs/debuffs at turn start
        unit.updateBuffsDebuffs();
        
        // Apply DOT effects
        this.applyDotEffects(unit);
        
        // Check if unit died from DOT
        if (!unit.isAlive) {
            this.endTurn();
            return;
        }
        
        // Check if unit is stunned
        if (unit.debuffs.some(d => d.stunned)) {
            this.log(`${unit.name} is stunned!`);
            this.endTurn();
            return;
        }
        
        // Check for stealth break
        if (unit.buffs.some(b => b.untargetable)) {
            // Remove stealth if attacking
            unit.buffs = unit.buffs.filter(b => !b.untargetable);
        }
        
        // Check if it's a player unit and not in auto mode
        if (!unit.isEnemy && !this.autoMode) {
            this.waitingForPlayer = true;
            this.showPlayerAbilities(unit);
        } else {
            // AI turn
            this.executeAITurn(unit);
        }
    }
    
    executeAITurn(unit) {
        // Find the best available ability
        let bestAbility = null;
        let bestIndex = -1;
        let bestScore = -1;
        
        // Evaluate each ability
        for (let i = unit.abilities.length - 1; i >= 0; i--) {
            if (unit.canUseAbility(i)) {
                const ability = unit.abilities[i];
                const spell = spellManager.getSpell(ability.id);
                if (!spell) continue;
                
                // Score the ability based on situation
                let score = this.scoreAbility(unit, ability, spell);
                if (score > bestScore) {
                    bestScore = score;
                    bestAbility = ability;
                    bestIndex = i;
                }
            }
        }
        
        if (bestAbility && bestIndex >= 0) {
            const spell = spellManager.getSpell(bestAbility.id);
            let target = this.selectAITarget(unit, spell);
            
            if (target || spell.target === 'passive' || spell.target === 'self') {
                this.executeAbility(unit, bestIndex, target);
            }
        } else {
            this.log(`${unit.name} has no abilities available!`);
        }
        
        this.endTurn();
    }
    
    scoreAbility(unit, ability, spell) {
        let score = 0;
        
        // Base score from ability level
        score += ability.level * 10;
        
        // Score based on effects
        if (spell.effects.includes('damage')) {
            // Prefer damage when enemies are healthy
            const enemyHealthPercent = this.getAverageHealthPercent(unit.isEnemy ? this.party : this.enemies);
            score += enemyHealthPercent * 50;
        }
        
        if (spell.effects.includes('heal')) {
            // Prefer healing when allies are hurt
            const allyHealthPercent = this.getAverageHealthPercent(unit.isEnemy ? this.enemies : this.party);
            score += (1 - allyHealthPercent) * 60;
        }
        
        if (spell.effects.includes('buff')) {
            // Buffs are good early in battle
            score += Math.max(30 - this.turn, 0);
        }
        
        if (spell.effects.includes('debuff')) {
            // Debuffs are always useful
            score += 40;
        }
        
        if (spell.effects.includes('execute')) {
            // Check if any enemy can be executed
            const enemies = unit.isEnemy ? this.party : this.enemies;
            const hasLowHpTarget = enemies.some(e => e.isAlive && (e.currentHp / e.maxHp) <= 0.3);
            if (hasLowHpTarget) score += 100;
        }
        
        if (spell.effects.includes('resurrect')) {
            // Check if any ally is dead
            const allies = unit.isEnemy ? this.enemies : this.party;
            const hasDeadAlly = allies.some(a => !a.isAlive);
            if (hasDeadAlly) score += 80;
        }
        
        if (spell.effects.includes('aoe')) {
            // AOE is better when more targets
            const targetCount = (unit.isEnemy ? this.party : this.enemies).filter(u => u.isAlive).length;
            score += targetCount * 15;
        }
        
        // Ultimate abilities get bonus score
        if (ability.ultimate) score += 50;
        
        return score;
    }
    
    selectAITarget(unit, spell) {
        let potentialTargets = [];
        
        switch (spell.target) {
            case 'enemy':
                potentialTargets = (unit.isEnemy ? this.party : this.enemies).filter(e => e && e.isAlive);
                
                // Smart targeting
                if (spell.effects.includes('execute')) {
                    // Target lowest HP percentage
                    potentialTargets.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
                } else if (spell.effects.includes('debuff') || spell.effects.includes('mark')) {
                    // Target highest threat (highest damage dealers)
                    potentialTargets.sort((a, b) => b.stats.str + b.stats.agi + b.stats.int - (a.stats.str + a.stats.agi + a.stats.int));
                } else {
                    // Default: target lowest absolute HP
                    potentialTargets.sort((a, b) => a.currentHp - b.currentHp);
                }
                break;
                
            case 'ally':
                potentialTargets = (unit.isEnemy ? this.enemies : this.party).filter(a => a && a.isAlive);
                
                if (spell.effects.includes('heal')) {
                    // Target lowest HP percentage
                    potentialTargets.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
                } else if (spell.effects.includes('buff')) {
                    // Target strongest ally
                    potentialTargets.sort((a, b) => b.stats.str + b.stats.agi + b.stats.int - (a.stats.str + a.stats.agi + a.stats.int));
                }
                break;
                
            case 'dead_ally':
                potentialTargets = (unit.isEnemy ? this.enemies : this.party).filter(a => a && !a.isAlive);
                break;
                
            case 'self':
                return unit;
                
            case 'all_enemies':
            case 'all_allies':
                return 'all';
        }
        
        return potentialTargets.length > 0 ? potentialTargets[0] : null;
    }
    
    getAverageHealthPercent(units) {
        const aliveUnits = units.filter(u => u && u.isAlive);
        if (aliveUnits.length === 0) return 0;
        
        const totalPercent = aliveUnits.reduce((sum, u) => sum + (u.currentHp / u.maxHp), 0);
        return totalPercent / aliveUnits.length;
    }
    
    executeAbility(caster, abilityIndex, target) {
        const ability = caster.abilities[abilityIndex];
        if (!ability || !caster.useAbility(abilityIndex)) return;
        
        const spell = spellManager.getSpell(ability.id);
        if (!spell) return;
        
        // Check for miss
        if (spell.target === 'enemy' && target !== 'all') {
            const missRoll = Math.random();
            if (missRoll < caster.missChance || missRoll < target.evasion) {
                this.log(`${caster.name}'s ${ability.name} missed!`);
                return;
            }
        }
        
        // Execute spell logic
        if (spellLogic[spell.logicKey]) {
            try {
                spellLogic[spell.logicKey](this, caster, target, spell);
            } catch (error) {
                console.error(`Error executing ${ability.name}:`, error);
                this.log(`${caster.name} failed to use ${ability.name}!`);
            }
        }
    }
    
    endTurn() {
        if (this.currentUnit) {
            this.currentUnit.reduceCooldowns();
        }
        this.currentUnit = null;
        this.waitingForPlayer = false;
        this.turn++;
        
        // Hide ability panel
        this.hidePlayerAbilities();
        
        // Update UI
        this.updateUI();
        
        // Continue battle loop
        setTimeout(() => this.battleLoop(), 100 / this.gameSpeed);
    }
    
    // Combat methods referenced by spells
    dealDamage(attacker, target, amount, damageType = 'physical') {
        if (!target.isAlive) return 0;
        
        let damage = Math.floor(amount);
        
        // Apply attacker's damage multiplier
        damage *= attacker.damageMultiplier;
        
        // Apply spell power for magical damage
        if (damageType !== 'physical') {
            damage *= attacker.spellPower;
        }
        
        // Check for critical hit
        if (Math.random() < attacker.critChance) {
            damage *= 2;
            this.log("Critical hit!");
        }
        
        // Apply target's defense
        damage /= target.defenseMultiplier;
        
        // Apply damage reduction from buffs
        target.buffs.forEach(buff => {
            if (buff.damageReduction) {
                damage *= (1 - buff.damageReduction);
            }
        });
        
        // Apply damage increase from debuffs
        target.debuffs.forEach(debuff => {
            if (debuff.damageTakenMultiplier) {
                damage *= debuff.damageTakenMultiplier;
            }
        });
        
        // Check for immunity
        if (target.buffs.some(b => b.immunity)) {
            this.log(`${target.name} is immune to damage!`);
            return 0;
        }
        
        damage = Math.floor(damage);
        const actualDamage = Math.min(damage, target.currentHp);
        target.currentHp = Math.max(0, target.currentHp - damage);
        
        // Check for damage reflection
        if (target.damageReflect > 0 && attacker !== target) {
            const reflectedDamage = Math.floor(actualDamage * target.damageReflect);
            attacker.currentHp = Math.max(0, attacker.currentHp - reflectedDamage);
            this.log(`${attacker.name} takes ${reflectedDamage} reflected damage!`);
        }
        
        // Check if target died
        if (target.currentHp <= 0) {
            target.isDead = true;
            this.log(`${target.name} has been slain!`);
        }
        
        return actualDamage;
    }
    
    healUnit(target, amount) {
        if (!target.isAlive) return 0;
        
        let heal = Math.floor(amount);
        
        // Apply healing received modifiers
        heal *= target.healingReceived;
        
        // Apply spell power for magical healing
        heal *= this.currentUnit.spellPower;
        
        heal = Math.floor(heal);
        const actualHeal = Math.min(heal, target.maxHp - target.currentHp);
        target.currentHp += actualHeal;
        
        return actualHeal;
    }
    
    applyBuff(target, buffName, duration, effects) {
        if (!target.isAlive) return;
        
        // Check if buff already exists
        const existingBuff = target.buffs.find(b => b.name === buffName);
        if (existingBuff) {
            // Refresh duration
            existingBuff.duration = Math.max(existingBuff.duration, duration);
            return;
        }
        
        const buff = {
            name: buffName,
            duration: duration,
            ...effects
        };
        
        target.buffs.push(buff);
    }
    
    applyDebuff(target, debuffName, duration, effects) {
        if (!target.isAlive) return;
        
        // Check for debuff immunity
        if (target.buffs.some(b => b.immunity || b.mindShield)) {
            this.log(`${target.name} resists the debuff!`);
            return;
        }
        
        // Check if debuff already exists
        const existingDebuff = target.debuffs.find(d => d.name === debuffName);
        if (existingDebuff) {
            // Refresh duration
            existingDebuff.duration = Math.max(existingDebuff.duration, duration);
            return;
        }
        
        const debuff = {
            name: debuffName,
            duration: duration,
            ...effects
        };
        
        target.debuffs.push(debuff);
    }
    
    applyShield(target, amount) {
        if (!target.isAlive) return;
        
        // For now, treat shields as temporary HP
        target.currentHp += Math.floor(amount);
        this.log(`${target.name} gains a ${Math.floor(amount)} point shield!`);
    }
    
    removeBuffs(target) {
        const removedCount = target.buffs.filter(b => b.duration !== -1).length;
        target.buffs = target.buffs.filter(buff => buff.duration === -1);
        if (removedCount > 0) {
            this.log(`${target.name}'s buffs were purged!`);
        }
    }
    
    removeDebuffs(target) {
        const removedCount = target.debuffs.length;
        target.debuffs = [];
        if (removedCount > 0) {
            this.log(`${target.name} was cleansed!`);
        }
    }
    
    getParty(unit) {
        return unit.isEnemy ? this.enemies : this.party;
    }
    
    getEnemies(unit) {
        return unit.isEnemy ? this.party : this.enemies;
    }
    
    summonUnit(summoner, unitData) {
        // TODO: Implement summon logic
        this.log(`${summoner.name} summons ${unitData.name}!`);
    }
    
    applyDotEffects(unit) {
        let totalDotDamage = 0;
        
        unit.debuffs.forEach(debuff => {
            if (debuff.dotDamage && unit.isAlive) {
                const damage = Math.floor(debuff.dotDamage);
                totalDotDamage += damage;
            }
        });
        
        if (totalDotDamage > 0) {
            unit.currentHp = Math.max(0, unit.currentHp - totalDotDamage);
            this.log(`${unit.name} takes ${totalDotDamage} damage over time!`);
            
            if (unit.currentHp <= 0) {
                unit.isDead = true;
                this.log(`${unit.name} died from damage over time!`);
            }
        }
    }
    
    checkBattleEnd() {
        const partyAlive = this.party.some(u => u && u.isAlive);
        const enemiesAlive = this.enemies.some(u => u && u.isAlive);
        
        if (!partyAlive) {
            this.log("Defeat! Your party has been wiped out!");
            this.endBattle(false);
            return true;
        }
        
        if (!enemiesAlive) {
            this.log("Victory! All enemies defeated!");
            this.endBattle(true);
            return true;
        }
        
        return false;
    }
    
    endBattle(victory) {
        this.running = false;
        
        if (victory) {
            // Grant experience to surviving heroes
            const baseExp = 100; // Base experience per enemy
            const expGain = this.enemies.reduce((sum, enemy) => {
                return sum + (enemy.source.level * baseExp);
            }, 0);
            
            this.party.forEach(unit => {
                if (unit.isAlive) {
                    unit.source.exp += expGain;
                    this.log(`${unit.name} gains ${expGain} experience!`);
                    
                    // Check for level up
                    while (unit.source.exp >= unit.source.expToNext && unit.source.level < 500) {
                        unit.source.exp -= unit.source.expToNext;
                        unit.source.level++;
                        unit.source.expToNext = unit.source.calculateExpToNext();
                        this.log(`${unit.name} reached level ${unit.source.level}!`);
                    }
                }
            });
            
            // TODO: Handle loot
            
            setTimeout(() => {
                this.game.showMainMenu();
            }, 3000);
        } else {
            // TODO: Handle defeat
            setTimeout(() => {
                this.game.showMainMenu();
            }, 3000);
        }
    }
    
    log(message) {
        this.battleLog.push(message);
        const logElement = document.getElementById('battleLog');
        if (logElement) {
            logElement.innerHTML = this.battleLog.slice(-10).join('<br>') + '<br>';
            logElement.scrollTop = logElement.scrollHeight;
        }
    }
    
    showPlayerAbilities(unit) {
        const abilityPanel = document.getElementById('abilityPanel');
        abilityPanel.innerHTML = '';
        
        unit.abilities.forEach((ability, index) => {
            const spell = spellManager.getSpell(ability.id);
            
            // Skip passive and aura abilities
            if (spell && (spell.target === 'passive' || spell.effects.includes('aura'))) {
                return;
            }
            
            const abilityDiv = document.createElement('div');
            abilityDiv.className = 'ability';
            
            if (!unit.canUseAbility(index)) {
                abilityDiv.classList.add('onCooldown');
            }
            
            const iconUrl = `https://puzzle-drops.github.io/TEVE/img/spells/${ability.id}.png`;
            
            abilityDiv.innerHTML = `
                <img src="${iconUrl}" alt="${ability.name}" style="width: 60px; height: 60px;" onerror="this.style.display='none'">
                <span style="position: absolute; bottom: 5px; font-size: 10px;">${ability.name}</span>
                ${unit.cooldowns[index] > 0 ? `<span class="cooldownText">${unit.cooldowns[index]}</span>` : ''}
            `;
            
            if (unit.canUseAbility(index)) {
                abilityDiv.onclick = () => {
                    if (spell) {
                        // For targeted abilities, highlight valid targets
                        if (spell.target === 'enemy' || spell.target === 'ally' || spell.target === 'dead_ally') {
                            this.selectTarget(unit, index, spell.target);
                        } else {
                            this.executeAbility(unit, index, spell.target === 'self' ? unit : 'all');
                            this.endTurn();
                        }
                    }
                };
            }
            
            abilityPanel.appendChild(abilityDiv);
        });
        
        // Add auto-battle toggle
        const autoDiv = document.createElement('div');
        autoDiv.style.cssText = 'position: absolute; bottom: -30px; left: 0;';
        autoDiv.innerHTML = `
            <label style="color: #b0e0f0;">
                <input type="checkbox" ${this.autoMode ? 'checked' : ''} onchange="game.currentBattle.toggleAutoMode(this.checked)">
                Auto
            </label>
        `;
        abilityPanel.appendChild(autoDiv);
    }
    
    hidePlayerAbilities() {
        const abilityPanel = document.getElementById('abilityPanel');
        if (abilityPanel) {
            abilityPanel.innerHTML = '';
        }
    }
    
    selectTarget(caster, abilityIndex, targetType) {
        // Clear previous target indicators
        this.clearTargetIndicators();
        
        // Determine valid targets
        let validTargets = [];
        switch (targetType) {
            case 'enemy':
                validTargets = this.enemies.filter(e => e && e.isAlive && !e.buffs.some(b => b.untargetable));
                break;
            case 'ally':
                validTargets = this.party.filter(p => p && p.isAlive);
                break;
            case 'dead_ally':
                validTargets = this.party.filter(p => p && !p.isAlive);
                break;
        }
        
        // Add target indicators and click handlers
        validTargets.forEach(target => {
            const element = document.getElementById(target.isEnemy ? `enemy${target.position + 1}` : `party${target.position + 1}`);
            if (element) {
                // Add green arrow indicator
                const arrow = document.createElement('div');
                arrow.className = 'targetArrow';
                arrow.innerHTML = '▼';
                arrow.style.cssText = `
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 24px;
                    color: #00ff88;
                    text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
                    animation: bounce 1s infinite;
                `;
                element.appendChild(arrow);
                
                // Add glow effect
                element.style.cursor = 'pointer';
                element.style.filter = 'brightness(1.3)';
                element.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
                
                // Add click handler
                const clickHandler = () => {
                    // Remove all handlers and indicators
                    this.clearTargetIndicators();
                    
                    // Execute ability
                    this.executeAbility(caster, abilityIndex, target);
                    this.endTurn();
                };
                
                element.addEventListener('click', clickHandler);
                element.dataset.clickHandler = clickHandler;
            }
        });
        
        // Add CSS animation for bouncing arrow
        if (!document.getElementById('targetArrowStyle')) {
            const style = document.createElement('style');
            style.id = 'targetArrowStyle';
            style.textContent = `
                @keyframes bounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    clearTargetIndicators() {
        // Remove all target indicators and handlers
        document.querySelectorAll('.unitSlot').forEach(element => {
            element.style.cursor = '';
            element.style.filter = '';
            element.style.boxShadow = '';
            
            // Remove arrow
            const arrow = element.querySelector('.targetArrow');
            if (arrow) arrow.remove();
            
            // Remove click handler
            if (element.dataset.clickHandler) {
                element.removeEventListener('click', element.dataset.clickHandler);
                delete element.dataset.clickHandler;
            }
        });
    }
    
    toggleAutoMode(enabled) {
        this.autoMode = enabled;
        if (enabled && this.waitingForPlayer) {
            this.executeAITurn(this.currentUnit);
        }
    }
    
    updateUI() {
        // Update all unit displays
        this.allUnits.forEach(unit => {
            const elementId = unit.isEnemy ? `enemy${unit.position + 1}` : `party${unit.position + 1}`;
            const element = document.getElementById(elementId);
            
            if (element) {
                const healthBar = element.querySelector('.healthFill');
                const healthText = element.querySelector('.healthText');
                const unitDiv = element.querySelector('.unit');
                
                // Update health bar
                if (healthBar) {
                    const hpPercent = (unit.currentHp / unit.maxHp) * 100;
                    healthBar.style.width = `${hpPercent}%`;
                    
                    // Change color based on HP
                    if (hpPercent > 60) {
                        healthBar.style.background = 'linear-gradient(90deg, #00ff88 0%, #00cc66 100%)';
                    } else if (hpPercent > 30) {
                        healthBar.style.background = 'linear-gradient(90deg, #ffaa00 0%, #ff8800 100%)';
                    } else {
                        healthBar.style.background = 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)';
                    }
                }
                
                if (healthText) {
                    healthText.textContent = `${Math.floor(unit.currentHp)}/${unit.maxHp}`;
                }
                
                // Update unit appearance
                if (unitDiv) {
                    if (!unit.isAlive) {
                        unitDiv.style.opacity = '0.3';
                        unitDiv.style.filter = 'grayscale(100%)';
                    } else {
                        unitDiv.style.opacity = '1';
                        unitDiv.style.filter = '';
                    }
                    
                    // Show buff/debuff indicators
                    this.updateStatusEffects(unitDiv, unit);
                }
                
                // Update or create action bar
                let actionBar = element.querySelector('.actionBar');
                if (!actionBar) {
                    actionBar = document.createElement('div');
                    actionBar.className = 'actionBar';
                    actionBar.style.cssText = 'width: 100px; height: 4px; background: #0a1929; border: 1px solid #2a6a8a; margin-top: 5px; position: relative;';
                    
                    const actionFill = document.createElement('div');
                    actionFill.className = 'actionFill';
                    actionFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #4dd0e1 0%, #2a9aaa 100%); transition: width 0.1s; box-shadow: 0 0 5px rgba(77, 208, 225, 0.5);';
                    
                    actionBar.appendChild(actionFill);
                    element.appendChild(actionBar);
                }
                
                // Update action bar fill
                const actionFill = actionBar.querySelector('.actionFill');
                if (actionFill) {
                    const actionPercent = Math.min((unit.actionBar / 10000) * 100, 100);
                    actionFill.style.width = `${actionPercent}%`;
                    
                    // Glow when ready
                    if (actionPercent >= 100) {
                        actionFill.style.boxShadow = '0 0 10px rgba(77, 208, 225, 1)';
                    }
                }
                
                // Highlight current unit
                if (unit === this.currentUnit) {
                    element.style.border = '2px solid #4dd0e1';
                    element.style.boxShadow = '0 0 20px rgba(77, 208, 225, 0.5)';
                } else {
                    element.style.border = '';
                    element.style.boxShadow = '';
                }
            }
        });
    }
    
    updateStatusEffects(unitDiv, unit) {
        // Remove existing status container
        let statusContainer = unitDiv.querySelector('.statusEffects');
        if (statusContainer) {
            statusContainer.remove();
        }
        
        // Create new status container if needed
        if (unit.buffs.length > 0 || unit.debuffs.length > 0) {
            statusContainer = document.createElement('div');
            statusContainer.className = 'statusEffects';
            statusContainer.style.cssText = `
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 2px;
            `;
            
            // Add buff indicators
            unit.buffs.forEach(buff => {
                const buffIcon = document.createElement('div');
                buffIcon.style.cssText = `
                    width: 16px;
                    height: 16px;
                    background: #00ff88;
                    border: 1px solid #00cc66;
                    border-radius: 2px;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                `;
                buffIcon.textContent = buff.duration > 0 ? buff.duration : '∞';
                buffIcon.title = buff.name;
                statusContainer.appendChild(buffIcon);
            });
            
            // Add debuff indicators
            unit.debuffs.forEach(debuff => {
                const debuffIcon = document.createElement('div');
                debuffIcon.style.cssText = `
                    width: 16px;
                    height: 16px;
                    background: #ff4444;
                    border: 1px solid #cc0000;
                    border-radius: 2px;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                `;
                debuffIcon.textContent = debuff.duration > 0 ? debuff.duration : '∞';
                debuffIcon.title = debuff.name;
                statusContainer.appendChild(debuffIcon);
            });
            
            unitDiv.appendChild(statusContainer);
        }
    }
}
