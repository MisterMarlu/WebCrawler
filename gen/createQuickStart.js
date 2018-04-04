const Generator = require('./Generator');

let generator = new Generator();

start().then(() => {
  // Added this "then" to prevent testing warnings.
});

async function start() {
  let createTables = await generator.askForDatabaseCreation();

  if (createTables) await generator.askForDatabase();

  await generator.fileQuickStart();
  await generator.fileConfigJson();
}
