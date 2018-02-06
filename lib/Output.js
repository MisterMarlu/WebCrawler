// Import modules.
const fs = require('fs'),

  // Import custom modules.
  {Formatter} = require(`${__dirname}/Formatter`),
  {Global} = require(`${__dirname}/Global`),
  {BaseModule} = require(`${__dirname}/BaseModule`);

let instance = null;

/**
 * This class prints every output and debugging information into the log file and/or the console.
 *
 * @extends BaseModule
 * @returns {Output} Returns the Output instance.
 */
class Output extends BaseModule {

  /**
   * @see Output
   */
  constructor() {
    // Constructor od the super class.
    super();

    // The class Output is a singleton class.
    if (instance instanceof Output) return instance;
    if (!(this instanceof Output)) return new Output();

    this.logger = null;
    this.logFileName = '';
    this.logPath = '';
    this.multiple = true;

    instance = this;
    return this;
  }

  /**
   * Initiate the log file and open a write stream.
   *
   * @param {string} [name=] Name of the log file. Default is the name defined in a config.json.
   */
  initLogger(name = this.logFileName) {
    // The absolute path to the /log directory.
    let path = this.logPath || `${Global.get('projectPath')}/logs`;

    // Create the directory if not exists.
    if (!fs.existsSync(path)) fs.mkdirSync(path);

    // Add the file name to the path.
    path += `/${name}.log`;
    let info = Output.checkLogFile(name, path, this.multiple);

    // Remove the old log file if already exists.
    if (fs.existsSync(info.path)) fs.unlinkSync(info.path);

    // Create the write stream.
    this.logger = fs.createWriteStream(info.path, {flags: 'a'});
    this.write(`Path to log file: ${info.path}`, true, 'success');
    this.write(`Started at: ${new Date()}`, true, 'success');
  }

  /**
   * Write output.
   *
   * @param {any} value The value that should be printed.
   * @param {boolean} [toConsole=false] Print to console.
   * @param {string} [type=] The type or color of the value.
   * @param {string} [background=] The background color of the value.
   */
  write(value, toConsole = false, type = '', background = '') {
    // Convert the value to a string.
    if (typeof value === 'object') {
      this.logger.write(JSON.stringify(value) + "\r\n");
    } else {
      this.logger.write(value + "\r\n");
    }

    this.writeConsole(value, toConsole, type, background);
  }

  /**
   * Write output with a new line before.
   *
   * @param {any} value The value that should be printed.
   * @param {boolean} [toConsole=false] Print to console.
   * @param {string} [type=] The type or color of the value.
   * @param {string} [background=] The background color of the value.
   */
  writeLine(value, toConsole = false, type = '', background = '') {
    this.logger.write("\r\n");
    if (toConsole) console.log();

    this.write(value, toConsole, type, background);
  }

  /**
   * Write output with a trailing new line.
   *
   * @param {any} value The value that should be printed.
   * @param {boolean} [toConsole=false] Print to console.
   * @param {string} [type=] The type or color of the value.
   * @param {string} [background=] The background color of the value.
   */
  writeWithSpace(value, toConsole = false, type = '', background = '') {
    this.write(value, toConsole, type, background);
    this.logger.write("\r\n");
    if (toConsole) console.log();
  }

  /**
   * Write in console only.
   *
   * @param {any} value The value that should be printed.
   * @param {boolean} [toConsole=false] Print to console.
   * @param {string} [type=] The type or color of the value.
   * @param {string} [background=] The background color of the value.
   */
  writeConsole(value, toConsole = false, type = '', background = '') {
    if (!toConsole) return;

    if (type.length < 1) {
      console.log(value);
      return;
    }

    if (background.length < 1) {
      console.log(Output.getColor(type), value);
      return;
    }

    console.log(Output.getColor(type, background), ` ${value} `);
  }

  /**
   * Write array as strings with new line for each entry.
   *
   * @param {object[]} sentences An array of objects stored with default write information.
   * @param {string} sentences[].text The text that should be printed.
   * @param {string} [sentences[].type=] The type or color of the text.
   * @param {string} [sentences[].background=] The background color of the text.
   * @param {string} [type=] The type or color of the first text.
   */
  writeOutput(sentences, type = '') {
    this.writeLine(sentences[0].text, true, type);

    for (let i = 1; i < sentences.length; i += 1) {
      let color = sentences[i].color || '',
        bg = sentences[i].bg || '';

      if (sentences.length !== (i + 1)) {
        this.write(sentences[i].text, true, color, bg);
        continue;
      }

      this.writeWithSpace(sentences[i].text, true, color, bg);
    }
  }

  /**
   * Write user input values.
   *
   * @param {Crawler} crawler The Crawler instance to print user inputs.
   */
  writeUserInput(crawler) {
    let sentences = [
        {text: 'User input:'},
      ],
      input = Global.get('input');

    for (let name in input) {
      if (!input.hasOwnProperty(name)) continue;
      if (name === 'default') continue;

      let string = (crawler.isDefault(name)) ? ' (default)' : '',
        sentence = {
          text: `${name}: ${input[name]}${string}`,
          color: (crawler.isDefault(name)) ? 'default' : '',
        };

      sentences.push(sentence);
    }

    this.writeOutput(sentences, 'underscore');
  }

  /**
   * Get colored command line output.
   *
   * @param {string} type The type or color of the value.
   * @param {string} [background=] The background color of the value.
   * @returns {string} Returns the colored string.
   */
  static getColor(type, background = '') {
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

      if (background.length > 0 && colors.hasOwnProperty(`bg${Formatter.toUpperFirst(background)}`)) {
        string = colors[`bg${Formatter.toUpperFirst(background)}`] + string;
      }
    }

    return string;
  }

  /**
   * Generate name and path of the log file.
   *
   * @param {string} name The name of the log file.
   * @param {string} path The absolute path of the log file directory.
   * @param {boolean} multiple If true the log file will be iterated.
   * @returns {object} Returns an object with the generated name and path of the log file.
   */
  static checkLogFile(name, path, multiple) {
    if (!multiple || !fs.existsSync(path)) {
      return {name, path};
    }

    let nameArray = name.split('-'),
      pathArray = path.split('/'),
      lastNA = nameArray.length - 1,
      number = parseInt(nameArray[lastNA]);

    nameArray[lastNA] = (number + 1);
    pathArray.pop();
    name = nameArray.join('-');
    path = pathArray.join('/') + `/${name}.log`;

    return Output.checkLogFile(name, path, multiple);
  }
}

exports.Output = Output;