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
        return this.currentHp > 0;
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
                if (ability.aura && spellLogic[ability.logicKey]) {
                    try {
                        spellLogic[ability.logicKey](this, unit);
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
        
        // Check if unit is stunned
        if (unit.debuffs.some(d => d.stunned)) {
            this.log(`${unit.name} is stunned!`);
            this.endTurn();
            return;
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
        // Find the strongest available ability
        let bestAbility = null;
        let bestIndex = -1;
        
        for (let i = unit.abilities.length - 1; i >= 0; i--) {
            if (unit.canUseAbility(i)) {
                bestAbility = unit.abilities[i];
                bestIndex = i;
                break;
            }
        }
        
        if (bestAbility && bestIndex >= 0) {
            // Determine target based on ability
            let target = null;
            const spell = spellManager.getSpell(bestAbility.id);
            
            if (spell) {
                switch (spell.target) {
                    case 'enemy':
                        const enemies = unit.isEnemy ? this.party : this.enemies;
                        const aliveEnemies = enemies.filter(e => e && e.isAlive);
                        if (aliveEnemies.length > 0) {
                            target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                        }
                        break;
                    case 'ally':
                        const allies = unit.isEnemy ? this.enemies : this.party;
                        const aliveAllies = allies.filter(a => a && a.isAlive);
                        // Prioritize low HP allies for heals
                        if (spell.effects.includes('heal')) {
                            aliveAllies.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
                        }
                        if (aliveAllies.length > 0) {
                            target = aliveAllies[0];
                        }
                        break;
                    case 'self':
                        target = unit;
                        break;
                    case 'all_enemies':
                    case 'all_allies':
                        target = 'all';
                        break;
                }
                
                if (target || spell.target === 'passive') {
                    this.executeAbility(unit, bestIndex, target);
                }
            }
        } else {
            this.log(`${unit.name} has no abilities available!`);
        }
        
        this.endTurn();
    }
    
    executeAbility(caster, abilityIndex, target) {
        const ability = caster.abilities[abilityIndex];
        if (!ability || !caster.useAbility(abilityIndex)) return;
        
        const spell = spellManager.getSpell(ability.id);
        if (!spell) return;
        
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
        
        damage = Math.floor(damage);
        target.currentHp = Math.max(0, target.currentHp - damage);
        
        return damage;
    }
    
    healUnit(target, amount) {
        if (!target.isAlive) return 0;
        
        let heal = Math.floor(amount);
        
        // Apply healing received modifiers
        if (target.healingReceived) {
            heal *= target.healingReceived;
        }
        
        heal = Math.floor(heal);
        const actualHeal = Math.min(heal, target.maxHp - target.currentHp);
        target.currentHp += actualHeal;
        
        return actualHeal;
    }
    
    applyBuff(target, buffName, duration, effects) {
        if (!target.isAlive) return;
        
        const buff = {
            name: buffName,
            duration: duration,
            ...effects
        };
        
        target.buffs.push(buff);
    }
    
    applyDebuff(target, debuffName, duration, effects) {
        if (!target.isAlive) return;
        
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
    }
    
    removeBuffs(target) {
        target.buffs = target.buffs.filter(buff => buff.duration === -1);
    }
    
    removeDebuffs(target) {
        target.debuffs = [];
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
        unit.debuffs.forEach(debuff => {
            if (debuff.dotDamage && unit.isAlive) {
                const damage = Math.floor(debuff.dotDamage);
                unit.currentHp = Math.max(0, unit.currentHp - damage);
                this.log(`${unit.name} takes ${damage} damage from ${debuff.name}!`);
            }
        });
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
            // TODO: Handle loot, experience, etc.
            setTimeout(() => {
                this.game.showMainMenu();
            }, 2000);
        } else {
            // TODO: Handle defeat
            setTimeout(() => {
                this.game.showMainMenu();
            }, 2000);
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
            const abilityDiv = document.createElement('div');
            abilityDiv.className = 'ability';
            
            if (!unit.canUseAbility(index)) {
                abilityDiv.classList.add('onCooldown');
            }
            
            const spell = spellManager.getSpell(ability.id);
            const iconUrl = `https://puzzle-drops.github.io/TEVE/img/spells/${ability.id}.png`;
            
            abilityDiv.innerHTML = `
                <img src="${iconUrl}" alt="${ability.name}" style="width: 72px; height: 72px;" onerror="this.style.display='none'">
                <span style="position: absolute; bottom: 0px; font-size: 10px;">${ability.name}</span>
                ${unit.cooldowns[index] > 0 ? `<span class="cooldownText">${unit.cooldowns[index]}</span>` : ''}
            `;
            
            if (unit.canUseAbility(index)) {
                abilityDiv.onclick = () => {
                    if (spell) {
                        // For targeted abilities, highlight valid targets
                        if (spell.target === 'enemy' || spell.target === 'ally') {
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
        autoDiv.style.cssText = 'position: absolute; top: -16px; right: 40px;';
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
        // Highlight valid targets
        const validTargets = targetType === 'enemy' ? 
            this.enemies.filter(e => e && e.isAlive) : 
            this.party.filter(p => p && p.isAlive);
        
        // Add click handlers to valid targets
        validTargets.forEach(target => {
            const element = document.getElementById(target.isEnemy ? `enemy${target.position + 1}` : `party${target.position + 1}`);
            if (element) {
                element.style.cursor = 'pointer';
                element.style.filter = 'brightness(1.2)';
                
                const clickHandler = () => {
                    // Remove all handlers and highlighting
                    validTargets.forEach(t => {
                        const el = document.getElementById(t.isEnemy ? `enemy${t.position + 1}` : `party${t.position + 1}`);
                        if (el) {
                            el.style.cursor = '';
                            el.style.filter = '';
                            el.replaceWith(el.cloneNode(true));
                        }
                    });
                    
                    // Execute ability
                    this.executeAbility(caster, abilityIndex, target);
                    this.endTurn();
                };
                
                element.addEventListener('click', clickHandler);
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
                const unitNameDiv = element.querySelector('.unitName');

                if (unitNameDiv) {
                    unitNameDiv.textContent = unit.name || "unknown";

                }
                
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
                        unitDiv.style.opacity = '';
                        unitDiv.style.filter = '';
                    }
                }
                
                // Update or create action bar
                let actionBar = element.querySelector('.actionBar');
                if (!actionBar) {
                    actionBar = document.createElement('div');
                    actionBar.className = 'actionBar';
                    actionBar.style.cssText = 'width: 80%; height: 4px; background: #0a1929; border: 1px solid #2a6a8a; margin-top: 2px; position: relative;';
                    
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
}
