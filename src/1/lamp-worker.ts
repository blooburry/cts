import raylibPkg from 'raylib';
const { InitWindow, SetTargetFPS, WindowShouldClose, BeginDrawing, ClearBackground, DrawCircle, EndDrawing, CloseWindow, RAYWHITE, BLACK } = raylibPkg;

const [, , id, kleurJson, knipperPeriodeStr] = process.argv;
const kleur = JSON.parse(kleurJson);
const knipperPeriode = Number(knipperPeriodeStr);

let status: "aan" | "uit" = "uit";
let color = kleur;

process.on("message", (msg: any) => {
  if (msg.type === "status") status = msg.value;
  if (msg.type === "color") color = msg.value;
});

InitWindow(400, 400, `Lamp ${id}`);
SetTargetFPS(30);

const periodInFrames = knipperPeriode * 30;
let on = true;
let blinkCounter = 0;

function loop() {
  if (WindowShouldClose()) {
    CloseWindow();
    process.exit(0);
  }

  BeginDrawing();
  ClearBackground(RAYWHITE);
  const showLamp = status === "aan" && on;
  DrawCircle(200, 200, 80, showLamp ? color : BLACK);
  EndDrawing();

  blinkCounter += 1;
  if (blinkCounter >= periodInFrames) {
    on = !on;
    blinkCounter = 0;
  }

  setImmediate(loop);
}

loop();