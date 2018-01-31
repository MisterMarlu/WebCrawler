if (typeof __stack === 'undefined') {
  /**
   * Define __stack for __line.
   */
  Object.defineProperty(global, '__stack', {
    get: function () {
      let orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function (_, stack) {
        return stack;
      };
      let err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      let stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
  });

  if (typeof __line === 'undefined') {
    /**
     * Define __line for debugging.
     */
    Object.defineProperty(global, '__line', {
      get: function () {
        return __stack[1].getLineNumber();
      }
    });
  }
}

const fs = require('fs'),
  mongoClient = require('mongodb').MongoClient,

  {Module} = require(`${__dirname}/lib/module`),
  {Global} = require(`${__dirname}/lib/global`),
  {Crawler} = require(`${__dirname}/lib/crawler`),
  {Output} = require(`${__dirname}/lib/output`),
  {ScreenShot} = require(`${__dirname}/lib/screenshot`),
  {DB} = require(`${__dirname}/lib/db`),
  {parseInput, isDebug, Formatter} = require(`${__dirname}/lib/parser`),

  configPath = `${__dirname}/config.json`,
  moduleName = 'WebCrawler';

let instance = null;

class WebCrawler extends Module {
  constructor(dir) {
    let options = {
      output: new Output(),
      db: new DB(),
    };

    super(options);

    if (instance instanceof WebCrawler) return instance;
    if (!(this instanceof WebCrawler)) return new WebCrawler(dir);

    Global.set('projectPath', dir);
    this.projectPath = dir;
    Global.set('config', {});
    this.crawler = new Crawler();
    this.screenShot = new ScreenShot();
    this.connString = '';

    this.setConfig(configPath);
    this.searchForConfig();

    instance = this;
    return instance;
  }

  setConfig(filePath, name = null) {
    if (!fs.existsSync(filePath)) {
      console.log(`Error: File ${filePath} doesn't exists.`);
      return;
    }

    if (typeof name !== 'string') name = moduleName;

    let config = Global.get('config');
    config[name] = require(filePath);

    for (let module in config) {
      if (module === 'default') {
        if (config[name].hasOwnProperty(module)) {
          this.setLocalConfig(config[name][module]);
        }
        continue;
      }

      if (config[name].hasOwnProperty(module) && this[name].hasOwnProperty(module)) {
        this[name].setLocalConfig(config[name][module]);
      }
    }
  }

  setCallback(name, callback) {
    this.output.writeConsole(`WebCrawler.setCallback - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    if (typeof callback !== 'function') return;

    let callbacks = Global.get('callbacks');
    callbacks[name] = callback;
    Global.set('callbacks', callbacks);
  }

  addConfig(pathToConfig, name) {
    this.output.writeConsole(`WebCrawler.addConfig - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    this.setConfig(pathToConfig, name);
  }

  addModule(pathToModule, name) {
    this.output.writeConsole(`WebCrawler.addModule - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    let newModule = require(`${this.projectPath}${pathToModule}`)[name],
      options = {
        output: this.output,
        db: this.db,
      };

    this[name] = new Module(options);
  }

  searchForConfig() {
    this.output.writeConsole(`WebCrawler.searchForConfig - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    if (fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
      this.setLocalConfig(`${this.projectPath}/web-crawler.json`, 'project');
    }
  }

  databaseCheck() {
    this.output.writeConsole(`WebCrawler.databaseCheck - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    let isSet = false,
      config = Global.get('config');

    for (let name in config) {
      if (!config.hasOwnProperty(name)) continue;
      if (typeof config[name] !== 'object') continue;
      if (typeof config[name].default !== 'object') continue;
      if (typeof config[name].default.connString !== 'string') continue;
      isSet = true;
    }

    if (!isSet) {
      throw 'You have to define a mongodb connection string as "default": {"connString": "mongodb://"}';
    }
  }

  saveStartingUrl(url) {
    this.db.save({url}, {url, active: true}, 'starting_urls', (error, result) => {
      this.db.findOne({url}, {}, 'starting_urls', (error, starting) => {
        Global.set('starting', starting);
      });
    });
  }

  setInput(options) {
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
      if (key === 'debug-module') continue;
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

  crawl(options, logFileName = this.output.logFileName) {
    this.output.writeConsole(`WebCrawler.crawl - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    if (typeof options === 'string') options = {startUrl: options};

    this.setInput(options);
    this.databaseCheck();

    mongoClient.connect(this.connString, (error, db) => {
      if (error) throw error;

      this.db.setConnection(db);

      // Don't run multiple crawling processes.
      if (this.crawler.hasLockFile()) {
        db.close();
        return;
      }

      this.saveStartingUrl(Global.get('START_URL'));

      setTimeout(() => {
        // Init the log.
        this.output.initLogger(logFileName);
        this.output.writeUserInput(this.crawler);

        this.screenShot.init();

        let callbacks = Global.get('callbacks');
        if (typeof callbacks['init'] === 'function') {
          callbacks['init'](this, Global.get('input'));
          return;
        }

        this.startCrawling();
      }, 10000);
    });
  }

  async startCrawling() {
    this.output.writeConsole(`WebCrawler.startCrawling - File: ${__filename} - Line: ${__line}`, isDebug(Global.get('DEBUG'), moduleName), 'debug');
    let reason = await this.crawler.start(),
      callbacks = Global.get('callbacks');

    if (Global.get('SCREEN_SHOT')) {
      if (typeof callbacks['screenshots'] === 'function') {
        await callbacks['screenshots'](Global.get('input'));
      }
    }

    if (typeof callbacks['output'] === 'function') {
      await callbacks['output'](reason);
    }

    this.screenShot.stopChrome(this.crawler.end());
  }
}

exports.Webcrawler = WebCrawler;