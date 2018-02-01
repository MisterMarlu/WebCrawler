// Import modules.
const fs = require('fs'),

  // Import custom modules.
  {Formatter} = require(`${__dirname}/formatter`),
  {Global} = require(`${__dirname}/global`),
  {Module} = require(`${__dirname}/module`);

let instance = null;

/**
 * Class Output.
 */
class Output extends Module {

  /**
   * Output constructor.
   *
   * @returns {*}
   */
  constructor() {
    super();

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
   * @param name?: String
   */
  initLogger(name = this.logFileName) {
    let path = this.logPath || `${Global.get('projectPath')}/logs`;

    if (!fs.existsSync(path)) fs.mkdirSync(path);

    path += `/${name}.log`;
    let info = this.checkLogFile(name, path, this.multiple);

    if (fs.existsSync(info.path)) fs.unlinkSync(info.path);

    this.logger = fs.createWriteStream(info.path, {flags: 'a'});
    this.write(`Path to log file: ${info.path}`, true, 'success');
    this.write(`Started at: ${new Date()}`, true, 'success');
  }

  /**
   * Write output.
   *
   * @param value: {*}
   * @param toConsole?: Boolean
   * @param type?: String
   * @param background?: String
   */
  write(value, toConsole = false, type = '', background = '') {
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
   * @param value: {*}
   * @param toConsole?: Boolean
   * @param type?: String
   * @param background?: String
   */
  writeLine(value, toConsole = false, type = '', background = '') {
    this.logger.write("\r\n");
    if (toConsole) console.log();

    this.write(value, toConsole, type, background);
  }

  /**
   * Write output with a trailing new line.
   *
   * @param value: {*}
   * @param toConsole?: Boolean
   * @param type?: String
   * @param background?: String
   */
  writeWithSpace(value, toConsole = false, type = '', background = '') {
    this.write(value, toConsole, type, background);
    this.logger.write("\r\n");
    if (toConsole) console.log();
  }

  /**
   * Write in console only.
   *
   * @param value: {*}
   * @param toConsole?: Boolean
   * @param type?: String
   * @param background?: String
   */
  writeConsole(value, toConsole = false, type = '', background = '') {
    if (!toConsole) return;

    if (type.length < 1) {
      console.log(value);
      return;
    }

    if (background.length < 1) {
      console.log(this.getColor(type), value);
      return;
    }

    console.log(this.getColor(type, background), ` ${value} `);
  }

  /**
   * Write array as strings with new line for each entry.
   *
   * @param sentences: [{{text: string, color?: string, background?: string}}]
   * @param type?: String
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
   * @param crawler: Crawler
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
   * @param type: String
   * @param background?: String
   * @returns {string}
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
   * @param name: String
   * @param path: String
   * @param multiple: Boolean
   * @returns {{name: string, path: string}}
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

    return this.checkLogFile(name, path, multiple);
  }
}

exports.Output = Output;