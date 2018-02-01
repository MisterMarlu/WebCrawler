require(`${__dirname}/debugging`);

// Import modules.
const fs = require('fs'),
  {MongoClient} = require('mongodb'),

  // Import custom modules.
  {Module} = require(`${__dirname}/module`),
  {Global} = require(`${__dirname}/global`),
  {Crawler} = require(`${__dirname}/crawler`),
  {Output} = require(`${__dirname}/output`),
  {ScreenShot} = require(`${__dirname}/screenshot`),
  {DB} = require(`${__dirname}/db`),
  {Helper} = require(`${__dirname}/helper`),
  {Formatter} = require(`${__dirname}/formatter`),
  {parseInput} = require(`${__dirname}/parser`),

  configPath = `${__dirname}/../config.json`;

let instance = null,
  moduleName = 'Wrapper';

/**
 * Class Wrapper.
 */
class Wrapper extends Module {

  /**
   * Wrapper constructor.
   *
   * @param dir: String
   * @param commands: {{}}
   * @returns {*}
   */
  constructor(dir, commands) {
    let options = {
      output: new Output(),
      db: new DB(),
    };

    super(options);

    if (instance instanceof Wrapper) return instance;
    if (!(this instanceof Wrapper)) return new Wrapper(dir);

    Global.set('projectPath', dir);
    Global.set('config', {});
    Global.set('callbacks', {});
    this.projectPath = dir;
    this.crawler = new Crawler();
    this.screenShot = new ScreenShot();
    this.connString = '';
    Wrapper.setInput(commands);

    this.setConfig(configPath);
    this.searchForConfig();

    instance = this;
    return this;
  }

  /**
   * Set configuration.
   *
   * @param filePath: String
   * @param name?: String
   */
  setConfig(filePath, name = null) {
    this.output.writeConsole(`${moduleName}.setConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    if (!fs.existsSync(filePath)) {
      console.log(`Error: File ${filePath} doesn't exists.`);
      return;
    }

    name = name || moduleName;

    let config = Global.get('config');
    config[name] = require(filePath);

    for (let module in config[name]) {
      if (module === 'default') {
        if (config[name].hasOwnProperty(module)) {
          this.setLocalConfig(config[name][module]);
        }
        continue;
      }

      if (config[name].hasOwnProperty(module) && this.hasOwnProperty(module)) {
        this[module].setLocalConfig(config[name][module]);
      }
    }
  }

  /**
   * Set a callback.
   *
   * @param name: String
   * @param callback: Function
   */
  setCallback(name, callback) {
    this.output.writeConsole(`${moduleName}.setCallback - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    if (typeof callback !== 'function') return;

    let callbacks = Global.get('callbacks');
    callbacks[name] = callback;
    Global.set('callbacks', callbacks);
  }

  /**
   * Add configuration.
   *
   * @param pathToConfig: String
   * @param name: String
   */
  addConfig(pathToConfig, name) {
    this.output.writeConsole(`${moduleName}.addConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.setConfig(pathToConfig, name);
  }

  /**
   * Add custom module.
   *
   * @param pathToModule: String
   * @param name: String
   */
  addModule(pathToModule, name) {
    this.output.writeConsole(`${moduleName}.addModule - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let newModule = require(`${this.projectPath}${pathToModule}`)[name],
      options = {
        output: this.output,
        db: this.db,
      };

    this[name] = new newModule(options);
  }

  /**
   * Search for a configuration file.
   */
  searchForConfig() {
    this.output.writeConsole(`${moduleName}.searchForConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    if (fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
      this.setLocalConfig(`${this.projectPath}/web-crawler.json`, 'project');
    }
  }

  /**
   * Check if a database connection string is defined.
   */
  databaseCheck() {
    this.output.writeConsole(`${moduleName}.databaseCheck - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let isSet = false,
      config = Global.get('config');

    for (let name in config) {
      if (!config.hasOwnProperty(name)) continue;
      if (typeof config[name] !== 'object') continue;
      if (typeof config[name].default !== 'object') continue;
      if (typeof config[name].default.connString !== 'string') continue;
      isSet = true;
    }

    if (isSet) return;
    throw 'You have to define a mongodb connection string as "default": {"connString": "mongodb://"}';
  }

  /**
   * Save the starting url.
   *
   * @param url: String
   */
  saveStartingUrl(url) {
    this.output.writeConsole(`${moduleName}.saveStartingUrl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.db.save({url}, {url, active: true}, 'starting_urls', (error, result) => {
      this.db.findOne({url}, 'starting_urls', {}, (error, starting) => {
        Global.set('starting', starting);
      });
    });
  }

  /**
   * Write the user input into the Global class.
   *
   * @param options: {*}
   */
  static setInput(options) {
    let input = {
        startUrl: 'https://www.phpdoc.org/',
        pageLimit: 0,
        debug: 0,
        debugModule: '',
        screenShots: 0,
      },
      userInput = {
        default: input,
      };

    for (let key in options) {
      if (!input.hasOwnProperty(key)) continue;
      if (userInput.hasOwnProperty(key)) continue;
      userInput[key] = input[key];

      if (options.hasOwnProperty(key)) userInput[key] = options[key];
    }

    userInput = parseInput(userInput);
    userInput.default = input;

    for (let key in userInput) {
      if (!userInput.hasOwnProperty(key)) continue;
      if (key === 'default') continue;
      if (key === 'debugModule') continue;
      if (key === 'debug') {
        if (!userInput.debug) {
          Global.set('DEBUG', userInput.debug);
        } else {
          if (userInput.debugModule) {
            Global.set('DEBUG', userInput.debugModule);
          } else {
            Global.set('DEBUG', userInput.debug);
          }
        }

        continue;
      }

      Global.set(Formatter.camelToUnderscore(key).toUpperCase(), userInput[key]);
    }

    Global.set('input', userInput);
  }

  /**
   * Prepare the crawling process.
   *
   * @param logFileName?: String
   */
  crawl(logFileName = this.output.logFileName) {
    this.output.writeConsole(`${moduleName}.crawl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.databaseCheck();

    // Start the connection to the database so you don't have to connect for every operation.
    MongoClient.connect(this.connString, (error, db) => {
      if (error) throw error;

      // Set the connection into the DB class.
      this.db.setConnection(db);

      // Prevent running multiple processes.
      if (this.crawler.hasLockFile()) {
        db.close();
        return;
      }

      this.saveStartingUrl(Global.get('START_URL'));

      // Wait until the starting url is definitive saved.
      setTimeout(() => {
        // Init the log.
        this.output.initLogger(logFileName);
        this.output.writeUserInput(this.crawler);

        this.screenShot.init();

        if (Helper.hasCallback('init')) {
          Helper.getCallback('init')(this, Global.get('input'));
          return;
        }

        this.startCrawling();
      }, 10000);
    });
  }

  /**
   * Start the crawling process.
   *
   * @returns {Promise<void>}
   */
  async startCrawling() {
    this.output.writeConsole(`${moduleName}.startCrawling - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let reason = await this.crawler.start();

    if (Global.get('SCREEN_SHOT')) {
      if (Helper.hasCallback('screenshot')) {
        await Helper.getCallback('screenshot')(Global.get('input'));
      }
    }

    if (Helper.hasCallback('output')) {
      await Helper.getCallback('output')(reason);
    }

    this.screenShot.stopChrome(this.crawler.end());
  }
}

exports.Wrapper = Wrapper;