// Import all custom modules to export them.
const Wrapper = require(`${__dirname}/lib/Wrapper`),
  Global = require(`${__dirname}/lib/Global`),
  BaseModule = require(`${__dirname}/lib/BaseModule`),
  Output = require(`${__dirname}/lib/Output`),
  Helper = require(`${__dirname}/lib/Helper`),
  Formatter = require(`${__dirname}/lib/Formatter`),
  Parser = require(`${__dirname}/lib/Parser`);

// Export all modules.
module.exports = {
  Main: Wrapper,
  Global,
  BaseModule,
  Output,
  Helper,
  Formatter,
  Parser,
};