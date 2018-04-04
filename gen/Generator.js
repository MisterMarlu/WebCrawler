const fs = require('fs'),
  cp = require("child_process"),
  inquirer = require('inquirer'),
  GenHelper = require('./GenHelper'),
  genConfig = require('./genConfig');

/**
 * Class to generate files and directories for the webcrawler.
 */
class Generator {

  /**
   * @see Generator.
   */
  constructor() {
    this._configStub = require('./stubs/configStub');
    this._directories = GenHelper.getImportantDirs();
    this._questions = GenHelper.safeClone(genConfig.questions);
    this._databaseInfo = GenHelper.safeClone(genConfig.databaseInfo);
    this._moduleInfo = GenHelper.safeClone(genConfig.moduleInfo);
    this._paths = GenHelper.safeClone(genConfig.paths);
    this._replacements = GenHelper.safeClone(genConfig.replacements);

    this.setReplacements();
    this.replaceObjectString(this._paths);
  }

  /**
   * Ask for database credentials.
   *
   * @async
   * @returns {Promise}
   */
  askForDatabase() {
    let prompt = inquirer.createPromptModule();

    return new Promise(async (resolve, reject) => {
      let answers = await prompt(this._questions.database);

      GenHelper.setAnswers(this._databaseInfo, answers);
      await this.createTables();

      resolve();
    });
  }

  /**
   * Ask for database table creation.
   *
   * @async
   * @returns {Promise}
   */
  askForDatabaseCreation() {
    let prompt = inquirer.createPromptModule();

    return new Promise(async (resolve, reject) => {
      let answers = await prompt(this._questions.createDatabase);

      resolve(answers.create);
    });
  }

  /**
   * Ask for module information.
   *
   * @async
   * @returns {Promise}
   */
  askForModule() {
    let prompt = inquirer.createPromptModule();

    return new Promise(async (resolve, reject) => {
      let answers = await prompt(this._questions.module);

      GenHelper.setAnswers(this._moduleInfo, answers);

      let replacement = {
          pattern: '%ModuleStub%',
          replacement: this._moduleInfo.name,
        },
        replacementExists = false;

      for (let i = 0; i < this._replacements.length; i += 1) {
        if (this._replacements[i].pattern !== '%ModuleStub%') continue;
        replacementExists = true;
        this._replacements[i].replacement = this._moduleInfo.name;
      }

      if (!replacementExists) this._replacements.push(replacement);

      this._moduleInfo.directory = `${this._directories.projectDir}/${this._moduleInfo.directory}`;
      this._paths.moduleDir.path = this._moduleInfo.directory;
      this._paths.module.path = `${this._moduleInfo.directory}/${this._moduleInfo.name}.js`;

      resolve();
    });
  }

  /**
   * Generate a module file.
   *
   * @async
   * @returns {Promise}
   */
  fileModule() {
    let content = this.genContent('ModuleStub.js'),
      replacements = [
        {
          pattern: '%type%',
          replacement: 'a module',
        },
        {
          pattern: '%name%',
          replacement: `${this._moduleInfo.name}.js`,
        },
      ];

    this.makeDirectories(['moduleDir']);

    return new Promise(async (resolve, reject) => {
      let overwrite = await this.checkIfExists(this._paths.module.path, replacements);

      if (!overwrite) {
        await this.askForModule();
        await this.fileModule();
        resolve();

        return;
      }

      fs.writeFile(this._paths.module.path, content, (error) => {
        let module = GenHelper.getCreationString(error, 'module', this._paths);

        console.log(GenHelper.coloredString(module));
        resolve();
      });
    });
  }

  /**
   * Generate a quick start file.
   *
   * @async
   * @returns {Promise}
   */
  fileQuickStart() {
    let content = this.genContent('quickStartStub.js'),
      replacements = [
        {
          pattern: '%type%',
          replacement: 'a file',
        },
        {
          pattern: '%name%',
          replacement: 'quickStart.js',
        },
      ];

    return new Promise(async (resolve, reject) => {
      let overwrite = await this.checkIfExists(this._paths.quickStart.path, replacements),
        quickStart = GenHelper.getCreationString(true, 'quickStart', this._paths);

      if (!overwrite) {
        console.log(GenHelper.coloredString(quickStart));
        resolve();

        return;
      }

      fs.writeFile(this._paths.quickStart.path, content, (error) => {
        let quickStart = GenHelper.getCreationString(error, 'quickStart', this._paths);

        console.log(GenHelper.coloredString(quickStart));
        resolve();
      });
    });
  }

  /**
   * Generate a json file with configurations.
   *
   * @async
   * @returns {Promise}
   */
  fileConfigJson() {
    this._configStub.output.logPath = this._paths.log.path;
    this._configStub.screenShot.screenshot.filePath = this._paths.screenshot.path;
    this.makeDirectories(['log', 'screenshot']);

    let replacements = [
      {
        pattern: '%type%',
        replacement: 'a file',
      },
      {
        pattern: '%name%',
        replacement: 'web-crawler.json',
      },
    ];

    return new Promise(async (resolve, reject) => {
      let overwrite = await this.checkIfExists(this._paths.configuration.path, replacements),
        json = GenHelper.getCreationString(true, 'configuration', this._paths),
        screenshots = GenHelper.getCreationString(false, 'screenshot', this._paths),
        logs = GenHelper.getCreationString(false, 'log', this._paths);

      if (!overwrite) {
        console.log(GenHelper.coloredString(json));

        if (this._paths.screenshot.created) console.log(GenHelper.coloredString(screenshots));
        if (this._paths.log.created) console.log(GenHelper.coloredString(logs));
        resolve();

        return;
      }

      fs.writeFile(this._paths.configuration.path, JSON.stringify(this._configStub), (error) => {
        json = GenHelper.getCreationString(error, 'configuration', this._paths);

        console.log(GenHelper.coloredString(json));

        if (this._paths.screenshot.created) console.log(GenHelper.coloredString(screenshots));
        if (this._paths.log.created) console.log(GenHelper.coloredString(logs));
        resolve();
      });
    });
  }

  /**
   * Generate correct content from stub file.
   *
   * @param {string} stubFile Name of the stub file with extension.
   * @returns {string} Returns the generated content as string.
   */
  genContent(stubFile) {
    let stub = fs.readFileSync(`${this._directories.stubsDir}/${stubFile}`),
      lines = stub.toString().split("\r\n");

    for (let i = 0; i < lines.length; i += 1) {
      for (let j = 0; j < this._replacements.length; j += 1) {
        lines[i] = Generator.replace(lines[i], this._replacements[j]);
      }
    }

    return lines.join("\r\n");
  }

  /**
   * Create tables in the database.
   *
   * @async
   * @returns {Promise}
   */
  createTables() {
    let command = 'mysql';

    if (this._databaseInfo.user) command += ` --user=${this._databaseInfo.user}`;
    if (this._databaseInfo.password) command += ` --password=${this._databaseInfo.password}`;

    command += ` ${this._databaseInfo.database} < ${__dirname}/default.sql`;

    this._configStub.default.connection.database = this._databaseInfo.database;
    this._configStub.default.connection.user = this._databaseInfo.user;
    this._configStub.default.connection.password = this._databaseInfo.password;

    return new Promise((resolve, reject) => {
      cp.exec(command, function (error, stdout, stderr) {
        let database = `%yes% Successfully generated tables`;

        if (error) database = `%yes% Unable to generate tables`;

        console.log(GenHelper.coloredString(database));
        resolve();
      });
    });
  }

  /**
   * Creates directories if not already exists.
   *
   * @param {string[]} pathNames An array of path names, defined in the private _path property.
   */
  makeDirectories(pathNames) {
    for (let i = 0; i < pathNames.length; i += 1) {
      let type = pathNames[i];

      if (!this._paths[type].isDir) continue;

      if (!fs.existsSync(this._paths[type].path)) {
        fs.mkdirSync(this._paths[type].path);
        this._paths[type].created = true;
      }
    }
  }

  /**
   * Check if file already exists and ask for overwriting the file.
   *
   * @async
   * @param {string} fullFilePath The absolute path to the file to generate.
   * @param {object[]} replacements An array of replacements for the overwrite question.
   * @param {string[]} replacements[].pattern The string that should be replaced.
   * @param {string[]} replacements[].replacement The string to replace the pattern.
   * @returns {Promise} Returns an Promise object with the boolean value to overwrite.
   */
  checkIfExists(fullFilePath, replacements) {
    return new Promise(async (resolve, reject) => {
      let writeFile = true;

      if (!fs.existsSync(fullFilePath)) {
        resolve(writeFile);
        return;
      }

      let question = this._questions.overwrite.message,
        prompt = inquirer.createPromptModule();

      this._questions.overwrite.message = Generator.replace(question, replacements);

      let answers = await prompt(this._questions.overwrite);

      this._questions.overwrite = {};
      this._questions.overwrite = GenHelper.safeClone(genConfig.questions.overwrite);

      setTimeout(() => {
        if (!answers.delete) {
          resolve(!writeFile);
          return;
        }

        fs.unlinkSync(fullFilePath);
        resolve(writeFile);
      }, 100);
    });
  }

  /**
   * Set replacements.
   */
  setReplacements() {
    for (let i = 0; i < this._replacements.length; i += 1) {
      let string = this._replacements[i].replacement,
        type = string.split('%').join('');

      if (!this._directories.hasOwnProperty(type)) continue;

      let replacement = this._directories[type];

      this._replacements[i].replacement = Generator.replace(string, string, replacement);
    }
  }

  /**
   * Deep replacing of strings in objects.
   *
   * @param {object} object An object where all strings should be replaced with a given pattern.
   */
  replaceObjectString(object) {
    for (let property in object) {
      if (!object.hasOwnProperty(property)) continue;
      if (typeof object[property] === 'object') {
        this.replaceObjectString(object[property]);
        continue;
      }

      if (typeof object[property] !== 'string') continue;

      for (let i = 0; i < this._replacements.length; i += 1) {
        object[property] = Generator.replace(object[property], this._replacements[i]);
      }
    }
  }

  /**
   * Replace a string.
   *
   * @param {string} string String that should be replaced.
   * @param {string|object|object[]} pattern The pattern that should be replaced. It can be a string, an object containing the properties "pattern" and "replacement" or an array with objects.
   * @param {string} pattern.pattern The pattern that should be used.
   * @param {string} pattern.replacement The replacement that should be used.
   * @param {string[]} pattern[].pattern The pattern that should be used.
   * @param {string[]} pattern[].replacement The replacement that should be used.
   * @param {string} [replacement=] The replacement that should be used. Optional when pattern is an object or an array of objects.
   * @returns {string} Returns the replaced string.
   */
  static replace(string, pattern, replacement = '') {
    if (typeof pattern === 'string' && replacement) return string.split(pattern).join(replacement);
    if (!pattern.hasOwnProperty(0)) return string.split(pattern.pattern).join(pattern.replacement);

    for (let i = 0; i < pattern.length; i += 1) {
      string = string.split(pattern[i].pattern).join(pattern[i].replacement);
    }

    return string;
  }
}

module.exports = Generator;