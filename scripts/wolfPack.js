/**
 * Represents a pack of 4 wolf enemies.
 *
 * @author Ryan MacLeod
 *
 */

class WolfPack extends Entity {
    constructor(pos) {
        //Make sure there is a enough reserved space for the "wolf den"
        super(pos, new Dimension(64 * 3, 64 * 3));
    
        this.protectMode = false; //Initially set enraged characteristic to false
        this.wolfList = [];
        this.maxHitPointList = [];
        this.wolfPosList = [];
        this.wolfPosList[0] = new Vec2(this.pos.x, this.pos.y);
        this.wolfPosList[1] = new Vec2(this.pos.x + 128, this.pos.y);
        this.wolfPosList[2] = new Vec2(this.pos.x, this.pos.y + 128);
        this.wolfPosList[3] = new Vec2(this.pos.x + 128, this.pos.y + 128);

        for(let i = 0; i < 4; i++) {
            this.wolfList[i] = new Wolf(this.wolfPosList[i]);
            this.maxHitPointList[i] = this.wolfList[i].maxHitPoints;
            gameEngine.addEntity(this.wolfList[i]);
        }
    }

    update() {
        // If pack is marked for removal, remove individual wolves too
        if(this.removeFromWorld) return this.wolfList.forEach(wolf => wolf.removeFromWorld = true);

        if(!this.protectMode) {
            for(let i = 0; i < 4; i++) {
                if(this.wolfList[i].hitPoints < this.maxHitPointList[i]) {
                    this.protectMode = true;
                    break;
                }
            }
        }

        if(doug.dead) {
            this.protectMode = false;
            for(let i = 0; i < 4; i++) {
                this.wolfList[i].enraged = false;
                this.maxHitPointList[i] = this.wolfList[i].hitPoints;
            }
        } else if(this.protectMode) {
            this.wolfList.forEach(wolf => {
                wolf.enraged = true;
            });
        }
    }
}