"use strict";


/**
 *
 * @author Kyler Robison
 */
class LightMap extends Entity {

    constructor() {
        super(0, 0);
        this.lightmask = document.createElement('canvas');
        this.lightmask.width = WIDTH;
        this.lightmask.height = HEIGHT;

        this.renderingCtx = this.lightmask.getContext("2d");
        this.renderingCtx.globalCompositeOperation = 'lighten';

        //this.color = new RGBColor(20, 20, 100);
        this.color = new RGBColor(0, 0, 0);
        this.alpha = 1;
        this.setLightValue();

        this.lightSources = [];
    }

    addLightSource(src) {
        this.lightSources.push(src);
    }

    setLightValue() {
        this.lightValue = rgba(this.color.r, this.color.g, this.color.b, this.alpha);
    }

    update() {
        if(this.alpha === 0) {
            return;
        }

        this.renderingCtx.clearRect(0, 0, WIDTH, HEIGHT);

        this.setLightValue();

        //Apply ambient light value to mask again
        this.renderingCtx.fillStyle = this.lightValue;
        this.renderingCtx.fillRect(0 ,0, WIDTH, HEIGHT);

        for (let i = this.lightSources.length - 1; i >= 0; --i) {
            if (this.lightSources[i].removeFromWorld) {
                this.lightSources.splice(i, 1); // Delete element at i
            } else {
                this.lightSources[i].update();
                this.lightSources[i].draw(this.renderingCtx);
            }
        }
    }

    draw(ctx) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(this.lightmask, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }
}