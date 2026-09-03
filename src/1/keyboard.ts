import EventEmitter from "node:events";
import { exit, stdin, stdout } from "node:process";
import { createInterface } from "node:readline";

const rl = createInterface({
  input: stdin,
  output: stdout
});

function echo(input: string) {
  console.log(`Received: ${input}`);
}

function handleQuit(input: string){
  if (input == "q"){
    exit();
  }
}

export function run() {
  rl.on('line', echo);
  rl.on('line', handleQuit);
  setInterval(() => {
    rl.emit('line', 'line event emitted!')
  }, 1000);
}
