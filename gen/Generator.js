const fs = require('fs'),
  cp = require("child_process"),
  inquirer = require('inquirer'),
  GenHelper = require('./GenHelper'),
  GenFiles = require('./GenFiles'),
  genConfig = require('./genConfig');

/**
 * Class to generate files and directories for the webcrawler.
 */
class Generator extends GenFiles {

  /**
   * @see Generator.
   */
  constructor() {
    super();
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
      };

      this.addReplacement(replacement);

      this._moduleInfo.directory = `${this._directories.projectDir}/${this._moduleInfo.directory}`;
      this._paths.moduleDir.path = this._moduleInfo.directory;
      this._paths.module.path = `${this._moduleInfo.directory}/${this._moduleInfo.name}.js`;

      resolve();
    });
  }

  askForQuickStart() {
    let prompt = inquirer.createPromptModule();

    return new Promise(async (resolve, reject) => {
      let answers = await prompt(this._questions.quickStart);

      GenHelper.setAnswers(this._quickStartInfo, answers);

      resolve();
    });
  }

  askForQuickStartModules() {
    let prompt = null;

    if (this._quickStartInfo.modules) prompt = inquirer.createPromptModule();

    return new Promise(async (resolve, reject) => {
      if (!this._quickStartInfo.modules) resolve();

      let answers = await prompt(this._questions.quickStartModule);

      GenHelper.setAnswers(this._quickStartInfo, answers);

      let moduleDir = this.simpleReplace(`%projectDir%/${this._quickStartInfo.moduleDirName}`),
        moduleList = fs.readdirSync(moduleDir);

      this._quickStartInfo.moduleNames = [];

      for (let i = 0; i < moduleList.length; i += 1) {
        let moduleFileArray = moduleList[i].split('.');

        if (moduleFileArray[moduleFileArray.length - 1] !== 'js') continue;

        let moduleName = moduleList[i].split('.')[0];
        this._quickStartInfo.moduleNames.push(moduleName);
      }

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
  async fileQuickStart() {
    let content = await this.genQuickStart(),
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

        if (error) database = `%no% Unable to generate tables`;

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

      this._questions.overwrite.message = GenHelper.replace(question, replacements);

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

  simpleReplace(string) {
    for (let i = 0; i < this._replacements.length; i += 1) {
      string = GenHelper.replace(string, this._replacements[i]);
    }

    return string;
  }
}

module.exports = Generator;