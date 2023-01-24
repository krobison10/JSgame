'use strict'

const TILE_SIZE = 32;
const WIDTH = 1024;
const HEIGHT = 768;
let boundingBoxes = false;

const dontDrawDistance = 1000;
const dontUpdateDistance = 2000;
const dontCheckCollideDistance = 800;

let gameTime = 4.5 * 60; //5:30 am

const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();
const lightMap = new LightMap();


//Add paths of assets to be downloaded here
declareAssets([
	"sprites/blondie_spritesheet.png",
	"sprites/bat_spritesheet.png",
	"sprites/slime01.png",
	"sprites/tree_00.png",
	"sprites/grass_1.png",
	"sprites/firepit.png",
	"sprites/tiles.png",
	"sprites/heart.png",
	"sprites/star.png",
	"sprites/items.png",
	"sprites/fires/torch_stem.png",
	"sprites/fires/orange/loops/burning_loop_1.png",
	"sprites/fires/orange/loops/burning_loop_3.png"
]);

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	gameEngine.init(ctx);
	gameEngine.start();
});



//------ Build Game ------//


let doug = new Doug(new Vec2(-140, 0), ASSET_MANAGER.getAsset("sprites/blondie_spritesheet.png"),
 	new Dimension(52, 72), new Padding(36, 12, 8, 12));
lightMap.addLightSource(new FlickeringLightSource(.6, new Vec2(0, 0),
	doug, new RGBColor(252, 204, 67)));

let bat = new Bat(new Vec2(200, 200), ASSET_MANAGER.getAsset("sprites/bat_spritesheet.png"),
	new Dimension(32, 32), new Padding(10, -15, 0, 5));

let slime = new Slime(new Vec2(200,200), ASSET_MANAGER.getAsset("sprites/slime01.png"), 
	new Dimension(55, 37), new Padding(0, -20, -20, 5));

let hotbar;
buildWorld();
buildUI();

gameEngine.addEntity(lightMap, Layers.LIGHTMAP);
gameEngine.addEntity(doug);
gameEngine.addEntity(bat);
gameEngine.addEntity(slime);




//------ Functions ------//

function buildWorld() {
	//Background tiles, border walls and border trees
	new MapBuilder().build();

	//Torch line along path
	placeTorches();

	//Cute campfire
	const fire = new CampFire(new Vec2(13 * TILE_SIZE, TILE_SIZE));
	gameEngine.addEntity(fire);
}

function buildUI() {
	hotbar = new Hotbar();
	gameEngine.addEntity(hotbar, Layers.UI);
	gameEngine.addEntity(new Health(), Layers.UI);
	gameEngine.addEntity(new Mana(), Layers.UI);

	const clock = new UIText(new Vec2(WIDTH - 300, 90), "Time: ", 20);
	clock.updateFn = () => {
		const time = Math.round(gameTime);
		let hour = Math.floor((time + 60) / 60);
		let ext = 'AM';
		if (hour > 12) {
			hour -= 12
		}
		if(time >= 660 && time < 23*60) {
			ext = 'PM';
		}
		let minute = time % 60;
		if(minute < 10) {
			minute = `0${minute}`;
		}
		clock.content = `${hour}:${minute} ${ext}`;
	}
	gameEngine.addEntity(clock, Layers.UI);

	const fpsCounter = new UIText(new Vec2(WIDTH - 300, 120), "", 20);
	fpsCounter.updateFn = () => {fpsCounter.content = `FPS: ${gameEngine.fps}`};
	gameEngine.addEntity(fpsCounter, Layers.UI);
}

function placeTorches() {
	for(let y = 180; y >= -180; y -= 6) {
		gameEngine.addEntity(new Torch(new Vec2(-6.5 * TILE_SIZE, y * TILE_SIZE)));
		gameEngine.addEntity(new Torch(new Vec2(-1.5 * TILE_SIZE, (y - 3) * TILE_SIZE)));
	}
}

function declareAssets(paths) {
	for(let path of paths) {
		ASSET_MANAGER.queueDownload(path);
	}
}

const toggleBoxes = () => {
	const box = document.getElementById("toggle-boxes");
	boundingBoxes = box.checked;
}
