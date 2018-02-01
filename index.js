const {Wrapper} = require(`${__dirname}/lib/wrapper`),
  {Global} = require(`${__dirname}/lib/global`),
  {Module} = require(`${__dirname}/lib/module`),
  {Output} = require(`${__dirname}/lib/output`),
  {DB} = require(`${__dirname}/lib/db`),
  {Helper} = require(`${__dirname}/lib/helper`),
  {Formatter} = require(`${__dirname}/lib/formatter`);

exports.WebCrawler = Wrapper;
exports.Global = Global;
exports.Module = Module;
exports.Output = new Output();
exports.DB = new DB();
exports.Helper = Helper;
exports.Formatter = Formatter;