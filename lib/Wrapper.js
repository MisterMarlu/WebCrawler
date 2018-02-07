require(`${__dirname}/debugging`);

// Import modules.
const fs = require('fs'),
  {MongoClient} = require('mongodb'),
  mysql = require('mysql'),
  {Spinner} = require('cli-spinner'),

  // Import custom modules.
  {BaseModule} = require(`${__dirname}/BaseModule`),
  {Global} = require(`${__dirname}/Global`),
  {Crawler} = require(`${__dirname}/Crawler`),
  {Output} = require(`${__dirname}/Output`),
  {ScreenShot} = require(`${__dirname}/ScreenShot`),
  {DB} = require(`${__dirname}/DB`),
  {Helper} = require(`${__dirname}/Helper`),
  {Formatter} = require(`${__dirname}/Formatter`),
  {DelayedSave} = require(`${__dirname}/DelayedSave`),
  {Parser} = require(`${__dirname}/Parser`),

  // Path to the local configuration file.
  configPath = `${__dirname}/../config.json`;

let instance = null,
  moduleName = Parser.getModuleName(__filename);

/**
 * Wrapper includes all core and custom modules.
 *
 * @extends BaseModule
 * @param {string} dir The absolute directory path to the project.
 * @param {object} commands An object with commands for the webcrawler.
 * @param {string} [commands.startUrl=https://www.phpdoc.org/] The url you are starting from.
 * @param {number} [commands.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
 * @param {number} [commands.debug=0] Turn on/off the debug mode.
 * @param {string} [commands.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
 * @param {number} [commands.screenShots=0] Turn on/of the function to create screenshots.
 * @returns {Wrapper} Returns the Wrapper instance.
 */
class Wrapper extends BaseModule {

  /**
   * @see Wrapper
   */
  constructor(dir, commands) {
    let options = {
      output: new Output(),
    };

    // Constructor of the super class.
    super(options);

    // The class Wrapper is a singleton class.
    if (instance instanceof Wrapper) return instance;
    if (!(this instanceof Wrapper)) return new Wrapper(dir);

    let tmpTimer = new Date();
    tmpTimer.setMinutes(tmpTimer.getMinutes() + 1);
    Global.set('saveTimer', tmpTimer);
    Global.set('projectPath', dir);
    Global.set('config', {});
    Global.set('callbacks', {});
    this.projectPath = dir;
    this.crawler = new Crawler();
    this.screenShot = new ScreenShot();
    this.connString = '';
    this.connection = {};
    this.dbVariant = {};
    // Store all commands into the class Global.
    Wrapper.setInput(commands);
    tmpTimer = null;

    // Set local configurations.
    this.setConfig(configPath);
    this.searchForConfig();

    Global.set('dbVariant', this.dbVariant);
    this.db = new DB();

    instance = this;
    return this;
  }

  /**
   * Add a configuration file so the configs will be used.
   * The configuration file must be a .json file. Look at the local config.json to get the format.
   *
   * @param {string} filePath The absolute path to the configuration file.
   * @param {string} [name=] The name of the configuration so the configs wont be mixed.
   */
  setConfig(filePath, name = '') {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.setConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Check if file exists.
    if (!fs.existsSync(filePath)) {
      console.log(`Error: File ${filePath} doesn't exists.`);
      return;
    }

    // Set the name of the config.
    name = name || moduleName;

    // Get all configurations from stored in the class Global.
    let config = Global.get('config');
    config[name] = require(filePath);

    // Iterate through the added configuration file.
    for (let module in config[name]) {
      // "default" is used in the local configuration for configure the class Wrapper.
      if (module === 'default') {
        if (config[name].hasOwnProperty(module)) {
          this.setLocalConfig(config[name][module]);
        }
        continue;
      }

      // Set configurations of an added module.
      if (config[name].hasOwnProperty(module) && this.hasOwnProperty(module)) {
        this[module].setLocalConfig(config[name][module]);
      }
    }
  }

  /**
   * Set a callback. On some points of the core it calls some callbacks so you can hook into some
   * functions with your modules.
   *
   * @param {string} name A name for this callback is necessary.
   * @param {function} callback Of cause the callback should be a function.
   */
  setCallback(name, callback) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.setCallback - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    if (typeof callback !== 'function') return;

    // Add the callback to the class Global.
    let callbacks = Global.get('callbacks');
    callbacks[name] = callback;
    Global.set('callbacks', callbacks);
  }

  /**
   * Add a custom configuration file. It must be a .json file.
   *
   * @param {string} pathToConfig The absolute path to the configuration file.
   * @param {string} name The name of the configuration.
   */
  addConfig(pathToConfig, name) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.addConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Set the configuration.
    this.setConfig(pathToConfig, name);
  }

  /**
   * Add a custom module.
   *
   * @param {string} pathToModule The relative path to the module.
   * @param {string} name The name of the module.
   */
  addModule(pathToModule, name) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.addModule - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Initialize the module and add it to the class Wrapper.
    let newModule = require(`${this.projectPath}${pathToModule}`)[name],
      // Default options.
      options = {
        output: this.output, // Instance of the class Output.
        db: this.db, // Instance of the class DB.
      };

    this[name] = new newModule(options);
  }

  /**
   * Search for a default configuration file.
   */
  searchForConfig() {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.searchForConfig - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Check if there is an configuration file in the project path.
    if (fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
      this.setLocalConfig(`${this.projectPath}/web-crawler.json`, 'project');
    }
  }

  /**
   * Check if a database connection string is defined.
   */
  databaseCheck() {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.databaseCheck - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    let isSet = false,
      config = Global.get('config');

    if (this.dbVariant === 'mongodb') {
      // Search all configurations for a connection string.
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

    // Search all configurations for a connection object.
    for (let name in config) {
      if (!config.hasOwnProperty(name)) continue;
      if (typeof config[name] !== 'object') continue;
      if (typeof config[name].default !== 'object') continue;
      if (typeof config[name].default.connection !== 'object') continue;
      if (typeof config[name].default.connection.host !== 'string') continue;
      if (typeof config[name].default.connection.user !== 'string') continue;
      if (typeof config[name].default.connection.password !== 'string') continue;
      isSet = true;
    }

    if (isSet) return;
    throw 'You have to define a mysql connection as "default": {"connection": {"host": "localhost", "user": "username", "password": "password", "database": "mydb"}}';
  }

  /**
   * Save the starting url.
   *
   * @param {string} url The url where you are starting the crawling process.
   */
  saveStartingUrl(url) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.saveStartingUrl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // This should be a promise so we can wait until it has finished.
    return new Promise((resolve, reject) => {
      this.db.save({url}, {url, active: true}, 'starting_urls').then(starting => {
        Global.set('starting', starting);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Write the user input into the Global class.
   *
   * @param {object} options The options for the webcrawler.
   * @param {string} [options.startUrl=https://www.phpdoc.org/] The url you are starting from.
   * @param {number} [options.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
   * @param {number} [options.debug=0] Turn on/off the debug mode.
   * @param {string} [options.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
   * @param {number} [options.screenShots=0] Turn on/of the function to create screenshots.
   */
  static setInput(options) {
    // These are the default options.
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

    for (let key in input) {
      if (!input.hasOwnProperty(key)) continue;
      if (userInput.hasOwnProperty(key)) continue;
      userInput[key] = input[key];

      if (options.hasOwnProperty(key)) userInput[key] = options[key];
    }

    userInput = Parser.parseInput(userInput);
    userInput.default = input;

    // Set the options to the class Global.
    for (let key in userInput) {
      if (!userInput.hasOwnProperty(key)) continue;
      if (key === 'default') continue;
      if (key === 'debugModule') continue;
      if (key === 'debug') {
        if (!parseInt(userInput.debug)) {
          Global.set('DEBUG', userInput.debug);
        } else {
          if (userInput.debugModule.length > 0) {
            Global.set('DEBUG', userInput.debugModule);
          } else {
            Global.set('DEBUG', userInput.debug);
          }
        }

        continue;
      }

      // Format names, e.g. "pageLimit" -> "PAGE_LIMIT".
      Global.set(Formatter.camelToUnderscore(key).toUpperCase(), userInput[key]);
    }

    Global.set('input', userInput);
  }

  /**
   *
   * @param logFileName
   */
  startWithMongo(logFileName) {
    MongoClient.connect(this.connString, (error, db) => {
      if (error) throw error;

      // Set the connection into the DB class.
      this.db.setConnection(db);

      // Prevent running multiple processes.
      if (this.crawler.hasLockFile()) {
        db.close();
        return;
      }

      // Let the user know that the crawler is about to start.
      let tmpSpinner = new Spinner('The crawler is about to start %s');
      tmpSpinner.start();

      // Store the starting url into the database.
      this.saveStartingUrl(Global.get('START_URL')).then(() => {
        // Remove the spinner from the console.
        tmpSpinner.stop(true);

        // Init the log file.
        this.output.initLogger(logFileName);
        this.output.writeUserInput(this.crawler);

        if (Global.get('SCREEN_SHOT')) {
          // Init the Class ScreenShot.
          this.screenShot.init();
        }

        if (Helper.hasCallback('init')) {
          // Run the init callback from the project root.
          Helper.getCallback('init')(this, Global.get('input'));
          return;
        }

        // Start the crawling process.
        this.startCrawling();
      }).catch(error => {
        tmpSpinner.stop(true);
        console.log(error);
      });
    });
  }

  /**
   *
   * @param logFileName
   */
  startWithMysql(logFileName) {
    let connection = mysql.createConnection(this.connection);

    connection.connect((error) => {
      if (error) throw error;

      // Set the connection into the DB class.
      this.db.setConnection(connection);

      // Prevent running multiple processes.
      if (this.crawler.hasLockFile()) {
        this.db.database.end();
        return;
      }

      // Let the user know that the crawler is about to start.
      let tmpSpinner = new Spinner('The crawler is about to start %s');
      tmpSpinner.start();

      // Store the starting url into the database.
      this.saveStartingUrl(Global.get('START_URL')).then(() => {
        // Remove the spinner from the console.
        tmpSpinner.stop(true);

        // Init the log file.
        this.output.initLogger(logFileName);
        this.output.writeUserInput(this.crawler);

        if (Global.get('SCREEN_SHOT')) {
          // Init the Class ScreenShot.
          this.screenShot.init();
        }

        if (Helper.hasCallback('init')) {
          // Run the init callback from the project root.
          Helper.getCallback('init')(this, Global.get('input'));
          return;
        }

        // Start the crawling process.
        this.startCrawling();
      }).catch(error => {
        tmpSpinner.stop(true);
        console.log(error);
      });
    });
  }

  /**
   * Prepare for the crawling process.
   *
   * @param {string} [logFileName=] Name of the log file. Default is the name defined in a config.json.
   */
  crawl(logFileName = this.output.logFileName) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.crawl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Check the database connection string.
    this.databaseCheck();

    // Start the connection to the database so you don't have to connect for every operation.
    if (this.dbVariant === 'mongodb') {
      this.startWithMongo(logFileName);
    } else {
      this.startWithMysql(logFileName);
    }
  }

  /**
   * Start the crawling process.
   */
  startCrawling() {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.startCrawling - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Start the crawler.
    this.crawler.start(Wrapper.stopCrawling);
  }

  /**
   * Stop the crawling process.
   *
   * @param {string} reason The reason why the crawler has stopped the process.
   */
  static stopCrawling(reason) {
    // Debugging line.
    instance.output.writeConsole(`${moduleName}.stopCrawling - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Save the cached data so everything is saved.
    DelayedSave.saveAll().then(async () => {
        if (Global.get('SCREEN_SHOT')) {
          if (Helper.hasCallback('screenshot')) {
            // Create screenshots.
            await Helper.getCallback('screenshot')(Global.get('input'));
          }
        }

        if (Helper.hasCallback('output')) {
          // Create custom output from modules.
          await Helper.getCallback('output')(reason);
        }

        // Stop google chrome if already running.
        instance.screenShot.stopChrome(instance.crawler.end());
      }
    ).catch(error => {
      console.log(error);
    });
  }
}

exports.Wrapper = Wrapper;