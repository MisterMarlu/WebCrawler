const {Generator} = require('./Generator');

let generator = new Generator();

start().then(() => {
  // Added this "then" to prevent testing warnings.
});

async function start() {
  await generator.askForModule();
  await generator.fileModule();
}