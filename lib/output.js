/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Import custom modules.
 */
const {toUpperFirst} = require(`${__dirname}/parser`);

/**
 * Globals.
 */
let instance = {};

/**
 * Output constructor.
 *
 * @returns {Output}
 * @constructor
 */
let Output = function () {
  if (!(this instanceof Output)) return new Output();
  if (instance instanceof Output) return instance;

  init(this);

  instance = this;

  return this;
};

/**
 * Set configurations.
 *
 * @param config: {{}}
 */
Output.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }
};

/**
 * Get any parameter.
 *
 * @param parameter
 * @returns {*}
 */
Output.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

/**
 * Parameters.
 */
Output.logger = null;

/**
 * Write output.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
 * @param background?: {string}
 */
Output.prototype.write = function (value, print, type, background) {
  if (typeof value === 'object') {
    this.logger.write(JSON.stringify(value) + "\r\n");
  } else {
    this.logger.write(value + "\r\n");
  }

  if (typeof print === 'undefined' || !print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  if (typeof background === 'undefined' || background.length < 1) {
    console.log(this.getColor(type), value);
    return;
  }

  console.log(this.getColor(type, background), ` ${value} `);
};

/**
 * Write in console only.
 *
 * @param value: {*}
 * @param print: {boolean}
 * @param type?: {string}
 * @param background?: {string}
 */
Output.prototype.writeConsole = function (value, print, type, background) {
  if (!print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  if (typeof background === 'undefined' || background.length < 1) {
    console.log(this.getColor(type), value);
    return;
  }

  console.log(this.getColor(type, background), ` ${value} `);
};

/**
 * Write output with a new line before.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
 * @param background?: {string}
 */
Output.prototype.writeLine = function (value, print, type, background) {
  this.logger.write("\r\n");

  if (print) {
    console.log();
  }

  this.write(value, print, type, background);
};

/**
 * Write output with a trailing new line.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
 * @param background?: {string}
 */
Output.prototype.writeWithSpace = function (value, print, type, background) {
  this.write(value, print, type, background);
  this.logger.write("\r\n");

  if (print) {
    console.log();
  }
};

/**
 * Write array as strings with new line for each entry.
 *
 * @param sentences: {Array}
 * @param type: {string}
 */
Output.prototype.writeOutput = function (sentences, type) {
  this.writeLine(sentences[0].text, true, type);

  for (let i = 1; i < sentences.length; i += 1) {
    let color = sentences[i].color || '',
      bg = sentences[i].bg || '';
    this.write(sentences[i].text, true, color, bg);
  }
};

/**
 * Get colored command line output.
 *
 * @param type: {string}
 * @param background?: {string}
 * @returns {string}
 */
Output.prototype.getColor = function (type, background) {
  let colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      underscore: "\x1b[4m",
      blink: "\x1b[5m",
      reverse: "\x1b[7m",
      hidden: "\x1b[8m",

      black: "\x1b[30m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",

      bgBlack: "\x1b[40m",
      bgRed: "\x1b[41m",
      bgGreen: "\x1b[42m",
      bgYellow: "\x1b[43m",
      bgBlue: "\x1b[44m",
      bgMagenta: "\x1b[45m",
      bgCyan: "\x1b[46m",
      bgWhite: "\x1b[47m",

      comment: "\x1b[90m"
    },
    string = '';

  colors.error = colors.red;
  colors.success = colors.green;
  colors.warning = colors.yellow;
  colors.default = colors.magenta;
  colors.debug = colors.cyan;

  if (colors.hasOwnProperty(type)) {
    string = colors[type] + '%s' + colors.reset;

    if (typeof background !== 'undefined' && colors.hasOwnProperty(`bg${toUpperFirst(background)}`)) {
      string = colors[`bg${toUpperFirst(background)}`] + string;
    }
  }

  return string;
};

/**
 * Default output when page limit is reached.
 *
 * param numPages: {int}
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots: {int}
 * param screenshots?: {boolean}
 */
Output.prototype.pageLimit = function () {
  if (arguments.length < 5) {
    throw `Output.pageLimit: Too few arguments (${arguments.length}). See in documentation.`;
  }

  let sentences = [
    {
      text: `Reached max limit of number of pages to visit. (${arguments[0]} pages)`
    }
  ];

  this.writeEnd(arguments, sentences, 'warning');
};

/**
 * Default output when no more websites are available.
 *
 * param numPages: {int}
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots: {int}
 * param screenshots?: {boolean}
 */
Output.prototype.lastPage = function () {
  if (arguments.length < 5) {
    throw `Output.lastPage: Too few arguments (${arguments.length}). See in documentation.`;
  }

  let sentences = [
    {
      text: `No more pages to visit. (${arguments[0]} pages)`
    }
  ];

  this.writeEnd(arguments, sentences, 'success');
};

/**
 * Write the ending stuff.
 *
 * @param args: {{}}
 * @param sentences: {array}
 * @param color: {string}
 */
Output.prototype.writeEnd = function (args, sentences, color) {
  let information = [];
  for (let i = 1; i < args.length; i += 1) {
    information.push(args[i]);
  }

  sentences = sentences.concat(this.getEndSentences(information));

  this.writeOutput(sentences, color);
};

/**
 * Get default ending information.
 * (We need three or five arguments)
 *
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots?: {int}
 * param screenshots?: {boolean}
 * @returns {Array}
 */
Output.prototype.getEndSentences = function (args) {
  if (args.length < 3) {
    throw `Output.getEndSentences: Too few arguments (${args.length}). See in documentation.`;
  } else if (args.length === 4) {
    throw `Output.getEndSentences: Too few or too much arguments (${args.length}). See in documentation.`;
  }

  let endingInformation = [
    {
      text: `Found absolute links total: ${args[0]}`
    },
    {
      text: `Found relative links total: ${args[1]}`
    },
    {
      text: `Found links total: ${(args[0] + args[1])}`
    },
    {
      text: `Errors total: ${args[2]}`
    }
  ];

  if (typeof args[4] === 'boolean' && args[4]) {
    endingInformation.splice(3, 0, {text: `Screenshots total: ${args[3]}`});
  }

  return endingInformation;
};

/**
 * Init the log file.
 *
 * @param name?: {string} Name of the log file. Needs a number at the end (e.g. "logfile-1").
 */
Output.prototype.initLogger = function (name) {
  if (typeof name === 'undefined') name = this.logFileName;

  let path = `./logs/${name}.log`,
    info = checkLogFile(name, path);

  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
  }

  this.logger = fs.createWriteStream(info.path, {flags: 'a'});
  this.write(`Name of this log file: ${info.name}.log`, true, 'success');
};

/**
 * Write user input values.
 *
 * @param crawler
 */
Output.prototype.writeUserInput = function (crawler) {
  let sentences = [
    {text: 'User input:'}
  ];

  for (let name in crawler.commands) {
    if (crawler.commands.hasOwnProperty(name)) {
      let string = (crawler.isDefault(name)) ? ' (default)' : '',
        sentence = {
          text: `${name}: ${crawler.commands[name]}${string}`,
          color: (crawler.isDefault(name)) ? 'default' : ''
        };

      sentences.push(sentence);
    }
  }

  this.writeOutput(sentences, 'underscore');
};

/**
 * Generate name and path of the logfile.
 *
 * @param name: {string}
 * @param path: {string}
 * @returns {{name: string, path: string}}
 */
function checkLogFile(name, path) {
  if (!fs.existsSync(path)) {
    return {
      name: name,
      path: path,
    };
  }

  let nameArray = name.split('-'),
    number = parseInt(nameArray[(nameArray.length - 1)]);

  nameArray[(nameArray.length - 1)] = (number + 1);
  name = nameArray.join('-');
  path = 'logs/' + name + '.log';

  return checkLogFile(name, path);
}

exports.Output = Output;

/**
 * Initialize Output.
 *
 * @param o: {Output}
 */
function init(o) {
  o.logger = null;
  o.logFileName = null;
}