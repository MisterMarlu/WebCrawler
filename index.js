const {Wrapper} = require(`${__dirname}/lib/wrapper`),
  {Global} = require(`${__dirname}/lib/global`),
  {Module} = require(`${__dirname}/lib/module`),
  {Output} = require(`${__dirname}/lib/output`),
  {DB} = require(`${__dirname}/lib/db`),
  {Helper} = require(`${__dirname}/lib/helper`),
  {Formatter, isDebug} = require(`${__dirname}/lib/parser`);

exports.WebCrawler = Wrapper;
exports.Global = Global;
exports.Module = Module;
exports.Output = Output;
exports.DB = DB;
exports.Helper = Helper;
exports.Formatter = Formatter;
exports.isDebug = isDebug;