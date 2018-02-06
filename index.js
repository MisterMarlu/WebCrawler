// Import all custom modules to export them.
const {Wrapper} = require(`${__dirname}/lib/Wrapper`),
  {Global} = require(`${__dirname}/lib/Global`),
  {BaseModule} = require(`${__dirname}/lib/BaseModule`),
  {Output} = require(`${__dirname}/lib/Output`),
  {DB} = require(`${__dirname}/lib/DB`),
  {Helper} = require(`${__dirname}/lib/Helper`),
  {DelayedSave} = require(`${__dirname}/lib/DelayedSave`),
  {Formatter} = require(`${__dirname}/lib/Formatter`);

// Export all modules.
exports.WebCrawler = Wrapper;
exports.Global = Global;
exports.BaseModule = BaseModule;
exports.Output = Output;
exports.DB = new DB();
exports.Helper = Helper;
exports.DelayedSave = DelayedSave;
exports.Formatter = Formatter;