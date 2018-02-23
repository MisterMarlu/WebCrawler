require(`${__dirname}/debugging`);

// Import modules.
const fs = require('fs'),
  {MongoClient} = require('mongodb'),
  mysql = require('mysql'),
  // {Spinner} = require('cli-spinner'),

  // Import custom modules.
  {BaseModule} = require(`${__dirname}/BaseModule`),
  {Spinner} = require(`${__dirname}/Spinner`),
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
    Global.set('customerModules', []);
    Global.set('callbacks', {});
    this.projectPath = dir;
    this.connString = '';
    this.connection = {};
    this.dbVariant = '';

    // Store all commands into the class Global.
    Wrapper.setInput(commands);
    tmpTimer = null;

    // Set local configurations into the class Global.
    this.setConfig(configPath);
    this.searchForConfig();

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

    // Store the configurations into the class Global.
    Global.set('config', config);
  }

  /**
   * Execute the configurations for the Wrapper so we know the type of the database that should be used.
   */
  performWrapperConfig() {
    let config = Global.get('config');

    // Iterate through all configurations.
    for (let name in config) {
      if (!config.hasOwnProperty(name)) continue;
      // Iterate through one configuration.
      for (let module in config[name]) {
        // "default" is used in the local configuration for configure the class Wrapper.
        if (module === 'default') {
          if (config[name].hasOwnProperty(module)) {
            this.setLocalConfig(config[name][module]);
          }
        }
      }
    }

    Global.set('dbVariant', this.dbVariant);
  }

  /**
   * Selecting the database type and create instances of all internal modules that needs an instance of the database.
   */
  addDBModules() {
    // Select database type.
    this.db = DB.selectType(this.dbVariant);

    // The options for internal modules.
    let options = {
      output: this.output,
      db: this.db,
    };

    // Create instances of the internal modules.
    this.crawler = new Crawler(options);
    this.screenShot = new ScreenShot(options);
    this.delayedSave = new DelayedSave(options);
  }

  /**
   * Execute all configurations for all modules, also the added.
   */
  performModuleConfig() {
    let config = Global.get('config');

    // Iterate through all configurations.
    for (let name in config) {
      if (!config.hasOwnProperty(name)) continue;
      // Iterate through one configuration.
      for (let module in config[name]) {
        // Set configurations of an added module.
        if (config[name].hasOwnProperty(module) && this.hasOwnProperty(module)) {
          this[module].setLocalConfig(config[name][module]);
        }
      }
    }
  }

  /**
   * Create instances of the added modules.
   */
  performCustomModules() {
    let customerModules = Global.get('customerModules');

    // Iterate through all the customer modules.
    for (let i = 0; i < customerModules.length; i += 1) {
      let moduleInfo = customerModules[i];

      // Initialize the module and add it to the class Wrapper.
      let newModule = require(`${this.projectPath}${moduleInfo.pathToModule}`)[moduleInfo.name],
        // Default options.
        options = {
          output: this.output, // Instance of the class Output.
          db: this.db, // Instance of the class DB.
          delayedSave: this.delayedSave, // Instance of the class DelayedSave.
        };

      this[moduleInfo.name] = new newModule(options);
    }
  }

  /**
   * Prepare modules and configurations for the crawling process.
   */
  prepareForCrawling() {
    // Here we get the database type that we should use.
    this.performWrapperConfig();
    // Add all internal modules that need the database instance.
    this.addDBModules();
    // Add instances of the custom modules.
    this.performCustomModules();
    // Add all configurations to the modules.
    this.performModuleConfig();
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
    Helper.printDebugLine(instance.output, this.setCallback, __filename, __line);

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
    Helper.printDebugLine(instance.output, this.addConfig, __filename, __line);

    // Set the configuration.
    this.setConfig(pathToConfig, name);
  }

  /**
   * Add a custom module.
   *
   * @param {string} pathToModule The relative path to the module.
   */
  addModule(pathToModule) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.addModule, __filename, __line);

    // Get module name by file name.
    let name = pathToModule.split('/');
    name = name[name.length - 1];

    let newModule = {
        name,
        pathToModule,
      },
      customerModules = Global.get('customerModules');

    customerModules.push(newModule);
    Global.set('customerModules', customerModules);
  }

  /**
   * Search for a default configuration file.
   */
  searchForConfig() {
    // Check if there is an configuration file in the project path.
    if (fs.existsSync(`${this.projectPath}/web-crawler.json`)) {
      this.addConfig(`${this.projectPath}/web-crawler.json`, 'project');
    }
  }

  /**
   * Check if a database connection string is defined.
   */
  databaseCheck() {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.databaseCheck, __filename, __line);

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
    Helper.printDebugLine(instance.output, this.saveStartingUrl, __filename, __line);

    // This should be a promise so we can wait until it has finished.
    return new Promise((resolve, reject) => {
      this.db.save({url}, {url, active: true, num_visited: 0}, 'starting_urls').then(starting => {
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
   * Start the crawling process with the MongoDB database.
   *
   * @param {string} logFileName Name of the log file. Default is the name defined in a config.json.
   */
  startWithMongo(logFileName) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.startWithMongo, __filename, __line);

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
        this.output.writeWithSpace(`Using database type "${this.dbVariant}"`, true, 'success');

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
   * Start the crawling process with the MySQL database.
   *
   * @param {string} logFileName Name of the log file. Default is the name defined in a config.json.
   */
  startWithMysql(logFileName) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.startWithMysql, __filename, __line);

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
        this.output.writeWithSpace(`Using database type "${this.dbVariant}"`, true, 'success');

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
  crawl(logFileName = '') {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.crawl, __filename, __line);

    // Default log file name.
    if (!logFileName) logFileName = this.output.logFileName;

    // Set configurations and modules in a specific order.
    this.prepareForCrawling();

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
    Helper.printDebugLine(instance.output, this.startCrawling, __filename, __line);

    // Stop google chrome if already running.
    this.screenShot.stopChrome();
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
    Helper.printDebugLine(instance.output, Wrapper.stopCrawling, __filename, __line);

    // Don not try to start a saving process when already exists.
    if (DelayedSave.isSaving()) {
      setTimeout(() => {
        Wrapper.stopCrawling(reason);
      }, 1);
      return;
    }

    // Save the cached data so everything is saved.
    instance.delayedSave.saveAll().then(() => {
      if (Global.get('SCREEN_SHOTS')) {
        if (Helper.hasCallback('screenshot')) {

          instance.output.writeWithSpace(`Starting screenshots at ${(new Date()).toTimeString()}`, true);
          // Create screenshots.
          Helper.getCallback('screenshot')(Global.get('input')).then(() => {
            Wrapper.ending(reason);
          }).catch(error => {
            console.log(error);
          });
          return;
        }
      }

      Wrapper.ending(reason);
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Write output and stop processes.
   *
   * @param {string} reason The reason why the crawler has stopped the process.
   */
  static ending(reason) {
    // Debugging line.
    Helper.printDebugLine(instance.output, Wrapper.ending, __filename, __line);

    if (Helper.hasCallback('output')) {
      // Create custom output from modules.
      Helper.getCallback('output')(reason);
    }

    // Stop google chrome if already running.
    instance.screenShot.stopChrome();
    instance.crawler.end();
  }
}

exports.Wrapper = Wrapper;