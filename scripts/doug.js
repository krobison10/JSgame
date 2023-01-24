"use strict";

/**
 * Represents the player character.
 *
 * @author Kyler Robison
 */
class Doug extends Character {
    /**
     * Delay in seconds before health regen will begin
     * @type {number}
     */
    static regenDelay = 10;
    /**
     * Amount of time in seconds before doug can take damage again.
     * @type {number}
     */
    static immunityDuration = 0.75;
    /**
     * The base regeneration rate in terms of hit points per second.
     * @type {number}
     */
    static healthRegen = 2;
    /**
     * The base regeneration rate in terms of hit points per second.
     * @type {number}
     */
    static baseManaRegen = 5;
    /**
     * Multiplier for the exponential growth of mana regeneration.
     * @type {number}
     */
    static manaRegenMultiplier = 1.015;
    /**
     * Time before respawning in seconds.
     * @type {number}
     */
    static respawnTime = 10;

    /**
     * @param {Vec2} pos initial position of the player.
     * @param {HTMLImageElement} spritesheet spritesheet of the player.
     * @param {Dimension} size size of the sprite.
     * @param {Padding} spritePadding represents the padding between the actual size of the entity and its collision box.
     */
    constructor(pos, spritesheet, size, spritePadding) {
        super(pos, spritesheet, size, spritePadding);
        this.animations = [];

        /**
         * The maximum hit points of doug
         * @type {number}
         */
        this.maxHitPoints = 400;
        /**
         * The current health of doug. Should not exceed 400 because the health bar will break.
         * @type {number}
         */
        this.hitPoints = 400;
        /**
         * The time of the last health regeneration frame.
         * @type {number}
         */
        this.lastHealthRegen = Date.now();
        /**
         * Time that the last damage frame occurred.
         * @type {number}
         */
        this.lastDamage = Date.now();
        /**
         * Pretty self-explanatory
         * @type {boolean}
         */
        this.dead = false;
        /**
         * Time of last death.
         * @type {undefined}
         */
        this.deathTime = undefined;
        /**
         * The maximum mana level of doug.
         * @type {number}
         */
        this.maxMana = 200;
        /**
         * The current mana level of doug.
         * @type {number}
         */
        this.manaLevel = 190;
        /**
         * The time of the last mana regeneration frame.
         * @type {number}
         */
        this.lastManaRegen = Date.now();
        /**
         * Represents the current rate of mana regen that is increased the longer mana isn't used.
         * @type {number}
         */
        this.curManaRegen = Doug.baseManaRegen;
        /**
         * Speed of the player.
         * @type {number}
         */
        this.speed = 250;
        /**
         * Current velocity of the player.
         * @type {Vec2}
         */
        this.velocity = new Vec2(0, 0);
        /**
         * Memory for the direction of the player.
         * @type {number}
         */
        this.directionMem = 0;
        /**
         * Current bounding box of the player.
         * @type {BoundingBox}
         */
        this.boundingBox = Character.createBB(this.pos, this.size, this.spritePadding);

        //Create still animations
        for(let i = 0; i < 4; i++) {
            this.animations[i] = new Animator(this.spritesheet, 0, i * this.size.h,
                this.size.w, this.size.h,
                1, 1, 0, false, true);
        }
        //Create walking animations
        for(let i = 0; i < 4; i++) {
            this.animations[i + 4] = new Animator(this.spritesheet, this.size.w, i * this.size.h,
                this.size.w, this.size.h,
                2, .1, 0, false, true);
        }
    }

    /**
     * Updates the player for the frame.
     */
    update() {
        this.velocity.x = this.velocity.y = 0;
        if(this.dead) {
            if(timeInSecondsBetween(this.deathTime, Date.now()) >= Doug.respawnTime) {
                this.respawn();
            }
            else {
                return;
            }
        }

        if(gameEngine.keys["a"]) this.velocity.x -= this.speed;
        if(gameEngine.keys["d"]) this.velocity.x += this.speed;
        if(gameEngine.keys["w"]) this.velocity.y -= this.speed;
        if(gameEngine.keys["s"]) this.velocity.y += this.speed;

        //If the resulting vector's magnitude exceeds the speed
        if(Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y) > this.speed) {
            //Modify components so that vector's magnitude (total speed) matches desired speed
            this.velocity.x = this.speed/Math.sqrt(2) * this.velocity.x/this.speed;//Might be redundant
            this.velocity.y = this.speed/Math.sqrt(2) * this.velocity.y/this.speed;
        }

        /*
         * Check for collision with an obstacle, we do two separate checks so that if a player is colliding in one axis
         * they can still possibly be able to move on the other axis.
         */
        const collisionLat = this.checkCollide("lateral");
        const collisionVert = this.checkCollide("vertical");
        if(!collisionLat) {
            this.pos.x += this.velocity.x * gameEngine.clockTick;
        }
        if(!collisionVert) {
            this.pos.y += this.velocity.y * gameEngine.clockTick;
        }


        const entities = gameEngine.entities[Layers.FOREGROUND];
            for(const entity of entities) {
                 if (entity instanceof Enemy && this.boundingBox.collide(entity.boundingBox)) {
                     this.takeDamage(entity.damage);
            }
        }

        this.boundingBox = Character.createBB(this.pos, this.size, this.spritePadding);

        this.regen();
        this.updateDebug();
    }

    /**
     * Takes mana away from doug and makes necessary updates. If doug does not have enough mana, none will be taken.
     * @param amount the amount to take away.
     * @returns {boolean} True if there was enough mana, false if there was not.
     */
    useMana(amount) {
        if(amount > this.manaLevel) return false;

        this.manaLevel -= amount;
        this.curManaRegen = Doug.baseManaRegen;
        return true;
    }

    takeDamage(amount) {
        if(timeInSecondsBetween(this.lastDamage, Date.now()) >= Doug.immunityDuration) {
            this.lastDamage = Date.now();
            this.hitPoints -= amount;
            if(this.hitPoints <= 0) {
                this.hitPoints = 0;
                this.die();
            }
        }
    }

    /**
     * Takes steps to kill doug
     */
    die() {
        this.dead = true;
        this.deathTime = Date.now();

        const bigText = new UIText(
            new Vec2(this.getScreenPos().x - 48, this.getScreenPos().y + 20),
            "Doug Ded",
            40,
            new RGBColor(255, 45, 45));
        bigText.updateFn = function () {
            if(!doug.dead) this.removeFromWorld = true;
        }

        const counterText = new UIText(new Vec2(this.getScreenPos().x - 42, this.getScreenPos().y + 70),
            "Respawning in...",
            20,
            new RGBColor(255, 45, 45));
        counterText.updateFn = () => {
            if(!doug.dead) {
                counterText.removeFromWorld = true;
            } else {
                let timeToRespawn = Doug.respawnTime - Math.round(timeInSecondsBetween(doug.deathTime, Date.now()));
                counterText.content = "Respawning in... " + timeToRespawn;
            }
        }
        gameEngine.addEntity(bigText, Layers.UI);
        gameEngine.addEntity(counterText, Layers.UI);

    }

    respawn() {
        this.pos = new Vec2(0, 0);
        this.dead = false;
        this.hitPoints = this.maxHitPoints;
        this.manaLevel = this.maxMana;
        this.directionMem = 0;

    }

    /**
     * Attempts to regenerate the player's health and mana
     */
    regen() {
        if(this.hitPoints < this.maxHitPoints && timeInSecondsBetween(this.lastDamage, Date.now()) >= Doug.regenDelay) {
            if(timeInSecondsBetween(this.lastHealthRegen, Date.now()) >= 1 / Doug.healthRegen) {
                if(this.velocity.netVelocity() !== 0) {
                    this.hitPoints += 1;
                }
                else {
                    this.hitPoints += 2;
                }

                if(this.hitPoints > this.maxHitPoints) this.hitPoints = this.maxHitPoints;

                this.lastHealthRegen = Date.now();
            }
        }
        if(this.manaLevel < this.maxMana) {
            if(timeInSecondsBetween(this.lastManaRegen, Date.now()) >= 1 / this.curManaRegen) {
                this.manaLevel += 1;
                this.lastManaRegen = Date.now();
                this.curManaRegen *= Doug.manaRegenMultiplier;
            }
        }
    }

    /**
     * Updates the position label below the canvas
     */
    updateDebug() {
        const label = document.getElementById("position");
        label.innerText = `X: ${Math.round(this.pos.x / TILE_SIZE)}, Y: ${Math.round(this.pos.y / TILE_SIZE)}`;
    }

    draw(ctx) {
        if(this.dead) return;

        if(this.velocity.x < 0) {
            this.drawAnim(ctx, this.animations[5]);
            this.directionMem = 1;
        }
        if(this.velocity.x > 0) {
            this.drawAnim(ctx, this.animations[6]);
            this.directionMem = 2;
        }
        if(this.velocity.y === this.speed) {
            this.drawAnim(ctx, this.animations[4]);
            this.directionMem = 0;
        }
        if(this.velocity.y === -this.speed) {
            this.drawAnim(ctx, this.animations[7]);
            this.directionMem = 3;
        }
        if(this.velocity.y === 0 && this.velocity.x === 0) {
            this.drawAnim(ctx, this.animations[this.directionMem]);
        }

        this.boundingBox.draw(ctx);
    }

    drawAnim(ctx, animator) {
        animator.drawFrame(gameEngine.clockTick, ctx, this.getScreenPos().x, this.getScreenPos().y);
    }
}